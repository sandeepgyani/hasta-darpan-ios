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

const DESCRIPTION = `Hasta Darpan brings three traditional systems together in one private, offline app: palmistry, face reading and numerology. Everything is calculated on your own iPhone or iPad.

PALMISTRY - GUIDED AND MEASURED
This is not a guess from a photograph. You photograph your own palm and trace each line yourself, and the app then measures what you traced: the true length of the life, head, heart, fate and sun lines relative to your palm, how far each line curves away from a straight chord, and how clearly it reads against the surrounding skin. Your hand shape and thumb angle come from points you mark. Those real measurements are matched to the classical palmistry meanings.

The app asks whether you are right- or left-handed, so your dominant hand is identified correctly - for a left-handed person the left hand is the dominant one, read for the life you are actively making, while the other hand is read for inherited nature.

FACE READING - REAL GEOMETRY
Mark twenty landmark points on a front-facing photo and the app computes actual proportions: face shape, the three facial zones, eye spacing as a multiple of eye width, nose length and width ratios, lip height, mouth width, jaw-to-cheekbone ratio and left-right symmetry. Each measurement is shown as a number with the traditional interpretation beside it.

NUMEROLOGY - THE COMPLETE SET
Choose the Pythagorean or Chaldean system; master numbers 11, 22 and 33 are preserved. Life Path, Destiny, Soul Urge, Personality, Birthday and Maturity numbers; Personal Year, Month and Day; all four Pinnacle cycles and Challenge numbers; career, business and relationship guidance; lucky dates, numbers and colours; and suggested name spellings.

UPAY - A REMEDY FOR EVERY WEAK POINT
Whatever the readings find - a faint life line, a demanding Life Path, a name that pulls against your numbers - you get the traditional correction: the mantra, the daan, the gemstone, and one practical step you can actually take.

NUMBER TOOLS
Name compatibility between two people, business name analysis, baby name suggestions, vehicle numbers, house and flat numbers, mobile numbers, and company launch dates.

HINDI
The whole app switches to Hindi with one tap.

PRIVATE BY DESIGN
Your photographs are opened, measured and discarded on your own device. Nothing is uploaded, stored on a server or shared with anyone.

DISCLAIMER
Palmistry, face reading and numerology are traditional cultural practices. This app is offered for interest, entertainment and self-reflection. It does not provide medical, psychological, legal or financial advice.`;

(async()=>{
 let r=await api('GET','/v1/apps/'+APP+'/appStoreVersions?limit=1');
 const ver=r.body.data[0].id;
 r=await api('GET','/v1/appStoreVersions/'+ver+'/appStoreVersionLocalizations?limit=10');
 for(const loc of (r.body.data||[])){
   const pr=await api('PATCH','/v1/appStoreVersionLocalizations/'+loc.id,{data:{type:'appStoreVersionLocalizations',id:loc.id,attributes:{
     description: DESCRIPTION,
     keywords: 'palmistry,palm reading,hast rekha,face reading,numerology,samudrik,lucky number,upay,hindi',
     supportUrl: 'https://pcssolutions.co.in',
     promotionalText: 'Trace your own palm and the app measures it - real line length, curve and clarity - then gives the traditional reading and a remedy for every weak point. Hindi included.'
   }}});
   ok('listing ('+loc.attributes.locale+')', pr);
 }
})().catch(e=>{console.error(e);process.exit(1);});
