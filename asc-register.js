// Registers the CyberROI bundle ID + App Store provisioning profile via the
// App Store Connect API, using the same API key Codemagic uses (AXSWLCWZ9K).
// Usage: node asc-register.js <ISSUER_ID>
const crypto = require('crypto');
const fs = require('fs');
const https = require('https');

const KEY_ID = 'AXSWLCWZ9K';
const P8_PATH = 'C:/Users/sande/Downloads/AuthKey_AXSWLCWZ9K.p8';
const BUNDLE_ID = 'in.co.pcssolutions.hastadarpan';
const APP_NAME = 'Hasta Darpan';
const ISSUER = process.argv[2];
if (!ISSUER) { console.error('Pass the Issuer ID as the first argument'); process.exit(1); }

function jwt() {
  const header = Buffer.from(JSON.stringify({ alg: 'ES256', kid: KEY_ID, typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({ iss: ISSUER, iat: now, exp: now + 900, aud: 'appstoreconnect-v1' })).toString('base64url');
  const sig = crypto.sign('sha256', Buffer.from(header + '.' + payload), {
    key: fs.readFileSync(P8_PATH, 'utf8'), dsaEncoding: 'ieee-p1363'
  }).toString('base64url');
  return header + '.' + payload + '.' + sig;
}

function api(method, path, body) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.appstoreconnect.apple.com', path, method,
      headers: { Authorization: 'Bearer ' + jwt(), 'Content-Type': 'application/json' }
    }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d ? JSON.parse(d) : {} }));
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

(async () => {
  // 1. Bundle ID (reuse if it already exists)
  let r = await api('GET', '/v1/bundleIds?filter[identifier]=' + BUNDLE_ID);
  let bid = r.body.data && r.body.data.find(b => b.attributes.identifier === BUNDLE_ID);
  if (!bid) {
    r = await api('POST', '/v1/bundleIds', { data: { type: 'bundleIds', attributes: { identifier: BUNDLE_ID, name: 'Hasta Darpan', platform: 'IOS' } } });
    if (r.status >= 300) { console.error('bundleId error', JSON.stringify(r.body.errors)); process.exit(1); }
    bid = r.body.data;
  }
  console.log('Bundle ID registered:', bid.id, bid.attributes.identifier);

  // 2. Find the existing Apple Distribution certificate
  r = await api('GET', '/v1/certificates?filter[certificateType]=DISTRIBUTION,IOS_DISTRIBUTION&limit=20');
  const certs = (r.body.data || []).filter(c => new Date(c.attributes.expirationDate) > new Date());
  if (!certs.length) { console.error('No valid distribution certificate found'); process.exit(1); }
  const cert = certs[0];
  console.log('Using distribution cert:', cert.id, cert.attributes.name, 'expires', cert.attributes.expirationDate);

  // 3. Create the App Store provisioning profile
  r = await api('POST', '/v1/profiles', { data: {
    type: 'profiles',
    attributes: { name: 'hastadarpan appstore profile', profileType: 'IOS_APP_STORE' },
    relationships: {
      bundleId: { data: { type: 'bundleIds', id: bid.id } },
      certificates: { data: [{ type: 'certificates', id: cert.id }] }
    } } });
  if (r.status >= 300) { console.error('profile error', JSON.stringify(r.body.errors)); process.exit(1); }
  const prof = r.body.data;
  fs.writeFileSync('hastadarpan_appstore_profile.mobileprovision', Buffer.from(prof.attributes.profileContent, 'base64'));
  console.log('Profile created:', prof.attributes.name, prof.attributes.uuid);
  console.log('Saved to hastadarpan_appstore_profile.mobileprovision — upload this to Codemagic code signing identities.');
})().catch(e => { console.error(e); process.exit(1); });
