# Usage: OUTREACH_IMPORT_SECRET=... python3 -I scripts/outreach-ingest.py <places_search result file> [category]
# Sends NJ results with phones to /.netlify/functions/outreach-import (line-type check + insert).
import json, re, sys, urllib.request, ssl, os
COUNTIES = {'essex','hudson','bergen','union','passaic','morris','middlesex','monmouth'}
RULES = [('home inspection',r'inspect'),('moving',r'mov|van line|relocat|storage'),('cleaning',r'clean|maid|janitor'),
 ('property management',r'property manag|management|realty manag|apartments'),('real estate photography',r'photo|media|video|drone'),
 ('home staging',r'stag|design|interior'),('pest control',r'pest|extermin|termite'),('junk removal',r'junk|haul|dumpster|removal'),
 ('real estate attorney',r'law|attorney|esq|legal'),('title insurance',r'title'),('mortgage',r'mortgage|lending|loan|funding'),
 ('appraisal',r'apprais'),('plumbing',r'plumb|drain|sewer'),('electrical',r'electric'),('hvac',r'hvac|heating|cooling|air cond'),
 ('roofing',r'roof'),('painting',r'paint'),('landscaping',r'landscap|lawn|tree'),('locksmith',r'lock'),('flooring',r'floor|carpet'),
 ('handyman',r'handyman'),('general contractor',r'contract|construct|renovat|remodel|builder|home improve')]
def cat(name, hint):
    if hint: return hint
    n=name.lower()
    for c,rx in RULES:
        if re.search(rx,n): return c
    return 'local services'
def main(path, hint=None):
    places=json.load(open(path))['places']
    out={}
    for p in places:
        a=p.get('address') or ''
        if ', NJ ' not in a: continue
        if not p.get('phone_number'): continue
        c=cat(p['name'],hint)
        out.setdefault(c,[]).append({'name':p['name'],'phone':p['phone_number'],'address':a,'place_id':p.get('place_id')})
    secret=os.environ['OUTREACH_IMPORT_SECRET']
    tot={'received':0,'added':0,'ai_callable':0,'manual_only':0,'already_on_file':0}
    for c,items in out.items():
        for i in range(0,len(items),50):
            req=urllib.request.Request('https://emporionpros.com/.netlify/functions/outreach-import',data=json.dumps({'category':c,'places':items[i:i+50]}).encode(),
              headers={'Content-Type':'application/json','x-internal-secret':secret},method='POST')
            r=json.load(urllib.request.urlopen(req,timeout=30))
            for k in tot: tot[k]+=r.get(k,0)
    print(json.dumps(tot), {c:len(v) for c,v in out.items()})
main(sys.argv[1], sys.argv[2] if len(sys.argv)>2 else None)
