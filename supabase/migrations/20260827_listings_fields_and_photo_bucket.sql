-- EmporionPros listings: the columns list-property.html has always tried to
-- write, plus the storage bucket its photos have never been uploaded to.
--
-- WHY THIS EXISTS
-- saveListing() collects ~18 fields the `listings` table has no column for, so
-- every insert would have been rejected by PostgREST with 42703 / PGRST204 --
-- except the insert never ran at all (the call was gated on a method name that
-- does not exist), so the failure was invisible and the table sat at zero rows.
-- Fixing the call without adding these columns would turn a silent no-op into a
-- loud 400. Both halves have to land, and this half has to land FIRST.
--
-- Additive and idempotent. No existing column is touched, nothing is backfilled.

-- ---------------------------------------------------------------------------
-- 1. The missing columns
-- ---------------------------------------------------------------------------
-- Three fields already had homes and are MAPPED in code rather than duplicated
-- here -- adding near-twins would leave two columns meaning one thing:
--   amenities -> features (text[])   specials -> special (text)   photos -> images (text[])
alter table public.listings
  add column if not exists unit            text,
  add column if not exists floor           text,
  add column if not exists deposit         numeric,
  add column if not exists hoa             numeric,
  add column if not exists available_date  date,
  add column if not exists pets            text,
  add column if not exists parking         text,
  add column if not exists laundry         text,
  add column if not exists utilities       text,
  add column if not exists contact_name    text,
  add column if not exists contact_phone   text,
  add column if not exists contact_email   text,
  add column if not exists calendar_link   text,
  add column if not exists website         text,
  add column if not exists notes           text;

-- One ALTER TABLE, comma-separated. Split into separate semicolon-terminated
-- statements, every line after the first is a bare ADD COLUMN and Postgres
-- rejects it at "ADD", leaving the tail of the list silently unapplied.

-- Defensive no-op on the current schema (agent_id is already nullable there).
-- Kept so this migration is safe against a copy of the table where someone
-- tightened it: entry points other than list-property.html may create a listing
-- with no session to attribute it to, and NOT NULL would reject those.
alter table public.listings alter column agent_id drop not null;

-- ---------------------------------------------------------------------------
-- 2. Photo storage bucket
-- ---------------------------------------------------------------------------
-- Public read is required, not a convenience: syndication targets (Facebook
-- catalog, JSON-LD for Google) fetch images anonymously and reject data URLs
-- and signed URLs that expire. 5MB matches the client-side per-photo cap in
-- handlePhotos().
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-photos', 'listing-photos', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Anyone may READ. That is what "public bucket" means and what the feeds need.
drop policy if exists "listing photos are publicly readable" on storage.objects;
create policy "listing photos are publicly readable"
  on storage.objects for select
  using (bucket_id = 'listing-photos');

-- Only SIGNED-IN users may WRITE.
drop policy if exists "authenticated users upload listing photos" on storage.objects;
create policy "authenticated users upload listing photos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'listing-photos');

-- DECISION RESOLVED 2026-08-27: option (a). list-property.html now gates on
-- EPAuth.getUser() (commit ea337be) and redirects to login.html without a
-- session, so authenticated-only INSERT above is the policy that page needs.
-- Nothing below has to be enabled.
--
-- The anon alternative is left here ONLY to record what was rejected and why:
-- it grants ANY visitor -- and anyone who reads the anon key out of the PUBLIC
-- repo -- write access to your storage until revoked. That is an open
-- file-upload endpoint on the internet. Do not enable it as a shortcut past a
-- login prompt.
--
-- create policy "anyone uploads listing photos"
--   on storage.objects for insert to anon
--   with check (bucket_id = 'listing-photos');

-- Verify:
--   select column_name from information_schema.columns
--    where table_schema='public' and table_name='listings' order by ordinal_position;
--   select id, public, file_size_limit from storage.buckets where id='listing-photos';
