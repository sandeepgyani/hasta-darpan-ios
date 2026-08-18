// Sets the App Store version localization texts for Hostel Rasoi.
// Usage: node asc-listing.js <ISSUER_ID>
const crypto = require('crypto'); const fs = require('fs'); const https = require('https');
const KEY_ID='AXSWLCWZ9K', P8='C:/Users/sande/Downloads/AuthKey_AXSWLCWZ9K.p8', ISSUER=process.argv[2];
const APP='6797386877';
if(!ISSUER){console.error('Pass Issuer ID');process.exit(1);}
function jwt(){const h=Buffer.from(JSON.stringify({alg:'ES256',kid:KEY_ID,typ:'JWT'})).toString('base64url');
const n=Math.floor(Date.now()/1000);const p=Buffer.from(JSON.stringify({iss:ISSUER,iat:n,exp:n+900,aud:'appstoreconnect-v1'})).toString('base64url');
const s=crypto.sign('sha256',Buffer.from(h+'.'+p),{key:fs.readFileSync(P8,'utf8'),dsaEncoding:'ieee-p1363'}).toString('base64url');return h+'.'+p+'.'+s;}
function api(m,path,body){return new Promise((res,rej)=>{const r=https.request({hostname:'api.appstoreconnect.apple.com',path,method:m,headers:{Authorization:'Bearer '+jwt(),'Content-Type':'application/json'}},x=>{let d='';x.on('data',c=>d+=c);x.on('end',()=>res({status:x.statusCode,body:d?JSON.parse(d):{}}));});r.on('error',rej);if(body)r.write(JSON.stringify(body));r.end();});}
const ok=(l,r)=>console.log(l+':', r.status<300?'OK':'ERR '+JSON.stringify(r.body.errors||r.body).slice(0,300));

// Repositioned 18 Aug 2026 after Guideline 4.3(b) Spam rejection: numerology/lucky-date calculator now leads,
// hand/face measurement demoted to a secondary reference feature. See STORE-LISTING.md for rationale.
// NOTE: this script only PATCHes description/keywords/supportUrl/promotionalText. The app NAME and SUBTITLE
// (renamed to "Ank Numerology & Lucky Days" / "Names, Numbers & Measurement" per STORE-LISTING.md) are NOT
// set here - do that via appInfoLocalizations (name) and this same appStoreVersionLocalizations resource
// (subtitle) or via the App Store Connect UI directly.
const DESCRIPTION = `Calculate your Life Path, Destiny and Soul Urge numbers, find lucky dates for weddings and business launches, check name compatibility, and analyse business names, mobile numbers and vehicle numbers - all offline on your iPhone or iPad. No internet, no sign-in, no data collection.

NUMEROLOGY - THE COMPLETE SET
Choose the Pythagorean or Chaldean system; master numbers 11, 22 and 33 are preserved. Life Path, Destiny, Soul Urge, Personality, Birthday and Maturity numbers; Personal Year, Month and Day; all four Pinnacle cycles and Challenge numbers; career, business and relationship guidance; lucky dates, numbers and colours; and suggested name spellings.

NUMBER TOOLS
Name compatibility between two people, business name analysis, baby name suggestions, vehicle numbers, house and flat numbers, mobile numbers, and company launch dates.

GUIDED HAND & FACE MEASUREMENT - reference feature
Two additional self-reflection tools use real geometric measurement, not photo guessing or AI. For the hand: you photograph your own palm and trace each line yourself, and the app measures the true length, curve and clarity of the life, head, heart, fate and sun lines relative to your palm, matched to classical palmistry meanings. The app asks whether you are right- or left-handed so your dominant hand is identified correctly. For the face: mark twenty landmark points on a front-facing photo and the app computes actual proportions - face shape, facial zones, eye spacing, nose and lip ratios, jaw-to-cheekbone ratio and symmetry - each shown as a number with the traditional interpretation beside it.

UPAY - A REMEDY FOR EVERY WEAK POINT
Whatever the readings find - a demanding Life Path, a name that pulls against your numbers, a faint life line - you get the traditional correction: the mantra, the daan, the gemstone, and one practical step you can actually take.

HINDI
The whole app switches to Hindi with one tap.

PRIVATE BY DESIGN
Your photographs are opened, measured and discarded on your own device. Nothing is uploaded, stored on a server or shared with anyone.

DISCLAIMER
Numerology, palmistry and face reading are traditional cultural practices. This app is offered for interest, entertainment and self-reflection. It does not provide medical, psychological, legal or financial advice.`;

(async()=>{
 let r=await api('GET','/v1/apps/'+APP+'/appStoreVersions?limit=1');
 const ver=r.body.data[0].id;
 r=await api('GET','/v1/appStoreVersions/'+ver+'/appStoreVersionLocalizations?limit=10');
 for(const loc of (r.body.data||[])){
   const pr=await api('PATCH','/v1/appStoreVersionLocalizations/'+loc.id,{data:{type:'appStoreVersionLocalizations',id:loc.id,attributes:{
     description: DESCRIPTION,
     keywords: 'numerology,life path number,lucky number,name numerology,lucky date,business name,mobile number,samudrik,hindi',
     supportUrl: 'https://pcssolutions.co.in',
     promotionalText: 'Calculate your Life Path and Destiny numbers, find lucky dates for weddings and launches, and check name and business-name compatibility - all offline. Hindi included.'
   }}});
   ok('listing ('+loc.attributes.locale+')', pr);
 }
})().catch(e=>{console.error(e);process.exit(1);});
