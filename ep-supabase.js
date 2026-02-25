// ============================================
// SUPABASE CLIENT - EmporionPros
// ============================================

const EP_SUPABASE_URL = 'https://nfwxruzhgzkhklvzmfsw.supabase.co';
const EP_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5md3hydXpoZ3praGtsdnptZnN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MDEwODEsImV4cCI6MjA4NzI3NzA4MX0.djKBfVTxZf6M-To9fnmbukAXxvVckDD1SO-Bx_tJwvM';

// Initialize Supabase client (lazy - creates on first use)
var _epSupabaseClient = null;
function getSupabase() {
  if (_epSupabaseClient) return _epSupabaseClient;
  try {
    if (window.supabase && window.supabase.createClient) {
      _epSupabaseClient = window.supabase.createClient(EP_SUPABASE_URL, EP_SUPABASE_ANON_KEY);
    }
  } catch(e) { console.error('Supabase init error:', e); }
  return _epSupabaseClient;
}
// Alias for backward compat
Object.defineProperty(window, 'epSupabase', { get: function() { return getSupabase(); } });

// ============================================
// AUTH MODULE
// ============================================
const EPAuth = {
  // Get current user
  async getUser() {
    if (!getSupabase()) return null;
    const { data: { user } } = await getSupabase().auth.getUser();
    return user;
  },

  // Get current session
  async getSession() {
    if (!getSupabase()) return null;
    const { data: { session } } = await getSupabase().auth.getSession();
    return session;
  },

  // Get user profile from profiles table
  async getProfile() {
    const user = await this.getUser();
    if (!user) return null;
    const { data, error } = await getSupabase()
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (error) { console.error('Profile fetch error:', error); return null; }
    return data;
  },

  // Sign up
  async signUp(email, password, metadata = {}) {
    if (!getSupabase()) return { error: { message: 'Supabase not loaded' } };
    const { data, error } = await getSupabase().auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: metadata.full_name || '',
          role: metadata.role || 'user'
        }
      }
    });
    if (!error && data.user) {
      // Update profile with additional info
      await getSupabase().from('profiles').update({
        full_name: metadata.full_name || '',
        phone: metadata.phone || '',
        role: metadata.role || 'user',
        company: metadata.company || ''
      }).eq('id', data.user.id);
    }
    return { data, error };
  },

  // Sign in
  async signIn(email, password) {
    if (!getSupabase()) return { error: { message: 'Supabase not loaded' } };
    const { data, error } = await getSupabase().auth.signInWithPassword({ email, password });
    return { data, error };
  },

  // Sign out
  async signOut() {
    if (!getSupabase()) return;
    await getSupabase().auth.signOut();
    window.location.href = '/';
  },

  // Reset password
  async resetPassword(email) {
    if (!getSupabase()) return { error: { message: 'Supabase not loaded' } };
    const { data, error } = await getSupabase().auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/login.html'
    });
    return { data, error };
  },

  // Listen for auth changes
  onAuthChange(callback) {
    if (!getSupabase()) return;
    getSupabase().auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  },

  // Update profile
  async updateProfile(updates) {
    const user = await this.getUser();
    if (!user) return { error: { message: 'Not logged in' } };
    const { data, error } = await getSupabase()
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();
    return { data, error };
  }
};

// ============================================
// LEADS MODULE
// ============================================
const EPLeads = {
  // Submit a lead (public - no auth required)
  async submit(leadData) {
    if (!getSupabase()) {
      // Fallback to Netlify forms if Supabase not available
      return this.submitNetlify(leadData);
    }
    const { data, error } = await getSupabase()
      .from('leads')
      .insert({
        name: leadData.name || '',
        email: leadData.email,
        phone: leadData.phone || '',
        source: leadData.source || 'website',
        page: leadData.page || window.location.pathname,
        role: leadData.role || '',
        message: leadData.message || '',
        status: 'new'
      });
    if (error) console.error('Lead submit error:', error);
    return { data, error };
  },

  // Fallback to Netlify forms
  async submitNetlify(leadData) {
    try {
      const formData = new URLSearchParams();
      formData.append('form-name', 'ep-signup');
      formData.append('email', leadData.email);
      formData.append('source', leadData.source || 'website');
      formData.append('role', leadData.role || '');
      formData.append('page', leadData.page || window.location.pathname);
      formData.append('timestamp', new Date().toISOString());
      await fetch('/', { method: 'POST', body: formData });
      return { data: true, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  },

  // Get leads (for agents/admins)
  async getLeads(filters = {}) {
    if (!getSupabase()) return { data: [], error: null };
    let query = getSupabase().from('leads').select('*').order('created_at', { ascending: false });
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.limit) query = query.limit(filters.limit);
    const { data, error } = await query;
    return { data: data || [], error };
  },

  // Update lead status
  async updateStatus(leadId, status) {
    if (!getSupabase()) return { error: { message: 'Supabase not loaded' } };
    const { data, error } = await getSupabase()
      .from('leads')
      .update({ status })
      .eq('id', leadId)
      .select()
      .single();
    return { data, error };
  }
};

// ============================================
// LISTINGS MODULE
// ============================================
const EPListings = {
  // Get all active listings
  async getAll(filters = {}) {
    if (!getSupabase()) return { data: [], error: null };
    let query = getSupabase().from('listings').select('*').eq('status', 'active').order('created_at', { ascending: false });
    if (filters.type) query = query.eq('type', filters.type);
    if (filters.city) query = query.ilike('city', `%${filters.city}%`);
    if (filters.minPrice) query = query.gte('price', filters.minPrice);
    if (filters.maxPrice) query = query.lte('price', filters.maxPrice);
    if (filters.beds) query = query.gte('beds', filters.beds);
    if (filters.limit) query = query.limit(filters.limit);
    const { data, error } = await query;
    return { data: data || [], error };
  },

  // Get single listing
  async getById(id) {
    if (!getSupabase()) return { data: null, error: null };
    const { data, error } = await getSupabase()
      .from('listings')
      .select('*, profiles(*)')
      .eq('id', id)
      .single();
    return { data, error };
  },

  // Create listing (agent only)
  async create(listingData) {
    // // const user = await EPAuth.getUser();
    if (!user) return { error: { message: 'Not logged in' } };
    const { data, error } = await getSupabase()
      .from('listings')
      .insert({ ...listingData, agent_id: user.id })
      .select()
      .single();
    return { data, error };
  },

  // Update listing
  async update(id, updates) {
    if (!getSupabase()) return { error: { message: 'Supabase not loaded' } };
    const { data, error } = await getSupabase()
      .from('listings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  // Delete listing
  async delete(id) {
    if (!getSupabase()) return { error: { message: 'Supabase not loaded' } };
    const { error } = await getSupabase().from('listings').delete().eq('id', id);
    return { error };
  },

  // Get agent's listings
  async getMyListings() {
    // // const user = await EPAuth.getUser();
    // // if (!user) return { data: [], error: null };
    const { data, error } = await getSupabase()
      .from('listings')
      .select('*')
      // // .eq('agent_id', user.id)
      .order('created_at', { ascending: false });
    return { data: data || [], error };
  },

  // Increment view count
  async incrementViews(id) {
    if (!getSupabase()) return;
    await getSupabase().rpc('increment_views', { listing_id: id }).catch(() => {
      // Fallback: direct update
      getSupabase().from('listings').update({ views_count: getSupabase().sql`views_count + 1` }).eq('id', id);
    });
  }
};

// ============================================
// APPOINTMENTS MODULE
// ============================================
const EPAppointments = {
  // Book an appointment (public)
  async book(appointmentData) {
    if (!getSupabase()) return { error: { message: 'Supabase not loaded' } };
    const { data, error } = await getSupabase()
      .from('appointments')
      .insert({
        listing_id: appointmentData.listing_id || null,
        agent_id: appointmentData.agent_id || null,
        client_name: appointmentData.client_name,
        client_email: appointmentData.client_email,
        client_phone: appointmentData.client_phone || '',
        appointment_date: appointmentData.date,
        appointment_time: appointmentData.time,
        type: appointmentData.type || 'showing',
        notes: appointmentData.notes || '',
        status: 'pending'
      })
      .select()
      .single();
    return { data, error };
  },

  // Get agent's appointments
  async getMyAppointments(filters = {}) {
    // // const user = await EPAuth.getUser();
    // // if (!user) return { data: [], error: null };
    let query = getSupabase()
      .from('appointments')
      .select('*')
      .order('appointment_date', { ascending: true });
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.upcoming) query = query.gte('appointment_date', new Date().toISOString().split('T')[0]);
    const { data, error } = await query;
    return { data: data || [], error };
  },

  // Update appointment status
  async updateStatus(id, status) {
    if (!getSupabase()) return { error: { message: 'Supabase not loaded' } };
    const { data, error } = await getSupabase()
      .from('appointments')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  // Get available time slots for a date
  async getAvailableSlots(agentId, date) {
    if (!getSupabase()) return { data: [], error: null };
    const { data: booked } = await getSupabase()
      .from('appointments')
      .select('appointment_time')
      .eq('agent_id', agentId)
      .eq('appointment_date', date)
      .neq('status', 'cancelled');

    const allSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
      '15:00', '15:30', '16:00', '16:30', '17:00'];
    const bookedTimes = (booked || []).map(b => b.appointment_time.slice(0, 5));
    const available = allSlots.filter(s => !bookedTimes.includes(s));
    return { data: available, error: null };
  }
};

// ============================================
// CAMPAIGNS MODULE
// ============================================
const EPCampaigns = {
  // Create campaign
  async create(campaignData) {
    // // const user = await EPAuth.getUser();
    if (!user) return { error: { message: 'Not logged in' } };
    const { data, error } = await getSupabase()
      .from('campaigns')
      .insert({
        listing_id: campaignData.listing_id || null,
        agent_id: user.id,
        name: campaignData.name,
        type: campaignData.type || 'listing',
        status: 'draft',
        content: campaignData.content || {},
        channels: campaignData.channels || [],
        scheduled_at: campaignData.scheduled_at || null
      })
      .select()
      .single();
    return { data, error };
  },

  // Get agent's campaigns
  async getMyCampaigns(filters = {}) {
    // // const user = await EPAuth.getUser();
    // // if (!user) return { data: [], error: null };
    let query = getSupabase()
      .from('campaigns')
      // // .select('*, listings(*)')
      // // .eq('agent_id', user.id)
      .order('created_at', { ascending: false });
    if (filters.status) query = query.eq('status', filters.status);
    const { data, error } = await query;
    return { data: data || [], error };
  },

  // Update campaign
  async update(id, updates) {
    if (!getSupabase()) return { error: { message: 'Supabase not loaded' } };
    const { data, error } = await getSupabase()
      .from('campaigns')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  // Launch campaign
  async launch(id) {
    return this.update(id, { status: 'active', sent_at: new Date().toISOString() });
  }
};

// ============================================
// VENDORS MODULE
// ============================================
const EPVendors = {
  // Get all active vendors
  async getAll(filters = {}) {
    if (!getSupabase()) return { data: [], error: null };
    let query = getSupabase().from('vendors').select('*').eq('status', 'active').order('rating', { ascending: false });
    if (filters.category) query = query.eq('category', filters.category);
    if (filters.city) query = query.ilike('city', `%${filters.city}%`);
    if (filters.limit) query = query.limit(filters.limit);
    const { data, error } = await query;
    return { data: data || [], error };
  },

  // Submit vendor application
  async apply(vendorData) {
    if (!getSupabase()) return { error: { message: 'Supabase not loaded' } };
    const { data, error } = await getSupabase()
      .from('vendors')
      .insert({
        business_name: vendorData.business_name,
        contact_name: vendorData.contact_name,
        email: vendorData.email,
        phone: vendorData.phone || '',
        category: vendorData.category,
        subtypes: vendorData.subtypes || [],
        city: vendorData.city || '',
        zip: vendorData.zip || '',
        service_area: vendorData.service_area || '',
        description: vendorData.description || ''
      })
      .select()
      .single();
    return { data, error };
  }
};

// ============================================
// NOTIFICATIONS MODULE
// ============================================
const EPNotifications = {
  async getAll() {
    // // const user = await EPAuth.getUser();
    // // if (!user) return { data: [], error: null };
    const { data, error } = await getSupabase()
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    return { data: data || [], error };
  },

  async markRead(id) {
    if (!getSupabase()) return;
    await getSupabase().from('notifications').update({ read: true }).eq('id', id);
  },

  async getUnreadCount() {
    // // const user = await EPAuth.getUser();
    if (!user) return 0;
    const { count } = await getSupabase()
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false);
    return count || 0;
  }
};

// ============================================
// UI HELPERS
// ============================================
const EPUI = {
  // Update header based on auth state
  async updateHeader() {
    // // const user = await EPAuth.getUser();
    const authBtns = document.getElementById('auth-buttons');
    if (!authBtns) return;

    if (user) {
      const profile = await EPAuth.getProfile();
      const name = profile?.full_name || user.email.split('@')[0];
      const role = profile?.role || 'user';
      const dashLink = role === 'agent' ? '/agent-dashboard.html' :
                       role === 'vendor' ? '/vendor-dashboard.html' :
                       '/agent-dashboard.html';
      authBtns.innerHTML = `
        <a href="${dashLink}" class="ep-btn ep-btn-outline" style="font-size:13px;padding:6px 14px">Dashboard</a>
        <div class="ep-user-menu" style="position:relative;display:inline-block">
          <button onclick="this.nextElementSibling.classList.toggle('show')" 
                  style="background:#1a56db;color:white;border:none;border-radius:50%;width:36px;height:36px;font-weight:700;cursor:pointer;font-size:14px">
            ${name.charAt(0).toUpperCase()}
          </button>
          <div class="ep-dropdown" style="display:none;position:absolute;right:0;top:42px;background:white;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,.15);min-width:180px;z-index:999;padding:8px 0">
            <div style="padding:10px 16px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#6b7280">${user.email}</div>
            <a href="${dashLink}" style="display:block;padding:10px 16px;color:#111;text-decoration:none;font-size:14px">📊 Dashboard</a>
            <a href="/agent-dashboard.html#listings" style="display:block;padding:10px 16px;color:#111;text-decoration:none;font-size:14px">🏠 My Listings</a>
            <a href="/agent-dashboard.html#leads" style="display:block;padding:10px 16px;color:#111;text-decoration:none;font-size:14px">👥 My Leads</a>
            <a href="/agent-dashboard.html#appointments" style="display:block;padding:10px 16px;color:#111;text-decoration:none;font-size:14px">📅 Appointments</a>
            <div style="border-top:1px solid #e5e7eb;margin-top:4px;padding-top:4px">
              <a href="#" onclick="EPAuth.signOut();return false" style="display:block;padding:10px 16px;color:#ef4444;text-decoration:none;font-size:14px">🚪 Sign Out</a>
            </div>
          </div>
        </div>
      `;
      // Toggle dropdown
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.ep-user-menu')) {
          document.querySelectorAll('.ep-dropdown').forEach(d => d.style.display = 'none');
        }
      });
      document.querySelectorAll('.ep-user-menu button').forEach(btn => {
        btn.addEventListener('click', () => {
          const dd = btn.nextElementSibling;
          dd.style.display = dd.style.display === 'none' ? 'block' : 'none';
        });
      });
    } else {
      authBtns.innerHTML = `
        <a href="/login.html" class="ep-btn ep-btn-outline" style="font-size:13px;padding:6px 14px">Log In</a>
        <a href="/signup.html" class="ep-btn ep-btn-primary" style="font-size:13px;padding:6px 14px">Sign Up Free</a>
      `;
    }
  },

  // Show toast notification
  toast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.style.cssText = `position:fixed;bottom:24px;right:24px;padding:14px 24px;border-radius:10px;color:white;font-size:14px;font-weight:500;z-index:10000;animation:slideUp .3s ease;max-width:360px;box-shadow:0 4px 20px rgba(0,0,0,.2);font-family:Inter,sans-serif;`;
    toast.style.background = type === 'success' ? '#059669' : type === 'error' ? '#dc2626' : '#2563eb';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3500);
  },

  // Loading spinner
  spinner(container) {
    if (typeof container === 'string') container = document.getElementById(container);
    if (container) container.innerHTML = '<div style="text-align:center;padding:40px"><div class="ep-spinner"></div><p style="color:#6b7280;margin-top:12px">Loading...</p></div>';
  }
};

// ============================================
// INIT - Run on every page
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
  // Update header auth state
  setTimeout(() => EPUI.updateHeader(), 100);

  // Listen for auth changes
  EPAuth.onAuthChange((event, session) => {
    EPUI.updateHeader();
  });
});

// Make modules globally available
window.EPAuth = EPAuth;
window.EPLeads = EPLeads;
window.EPListings = EPListings;
window.EPAppointments = EPAppointments;
window.EPCampaigns = EPCampaigns;
window.EPVendors = EPVendors;
window.EPNotifications = EPNotifications;
window.EPUI = EPUI;
