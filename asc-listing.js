// Sets the App Store version localization texts for Hostel Rasoi.
// Usage: node asc-listing.js <ISSUER_ID>
const crypto = require('crypto'); const fs = require('fs'); const https = require('https');
const KEY_ID='AXSWLCWZ9K', P8='C:/Users/sande/Downloads/AuthKey_AXSWLCWZ9K.p8', ISSUER=process.argv[2];
const APP='6796607611';
if(!ISSUER){console.error('Pass Issuer ID');process.exit(1);}
function jwt(){const h=Buffer.from(JSON.stringify({alg:'ES256',kid:KEY_ID,typ:'JWT'})).toString('base64url');
const n=Math.floor(Date.now()/1000);const p=Buffer.from(JSON.stringify({iss:ISSUER,iat:n,exp:n+900,aud:'appstoreconnect-v1'})).toString('base64url');
const s=crypto.sign('sha256',Buffer.from(h+'.'+p),{key:fs.readFileSync(P8,'utf8'),dsaEncoding:'ieee-p1363'}).toString('base64url');return h+'.'+p+'.'+s;}
function api(m,path,body){return new Promise((res,rej)=>{const r=https.request({hostname:'api.appstoreconnect.apple.com',path,method:m,headers:{Authorization:'Bearer '+jwt(),'Content-Type':'application/json'}},x=>{let d='';x.on('data',c=>d+=c);x.on('end',()=>res({status:x.statusCode,body:d?JSON.parse(d):{}}));});r.on('error',rej);if(body)r.write(JSON.stringify(body));r.end();});}
const ok=(l,r)=>console.log(l+':', r.status<300?'OK':'ERR '+JSON.stringify(r.body.errors||r.body).slice(0,300));

const DESCRIPTION = `Living away from home and tired of ordering in? Hostel Rasoi teaches you to cook the 102 dishes every Indian student actually misses — written for tiny kitchens, first-time cooks and mild-spice lovers.

102 REAL RECIPES, ZERO FANCY EQUIPMENT
• Everything works with a gas stove, a pressure cooker and (optionally) a microwave — no oven needed
• Oven classics reinvented for the stovetop: tawa pizza, pan lasagna, tandoori-style wings, kadhai-basted fish
• Eight sections: Breakfast, Snacks & Street Food, Dal-Chawal & Curries, Sabzi-Paneer-Roti, Chicken & Egg, Fish, Chinese & Continental, Sweets & Drinks

MILD BY DESIGN — KAM MIRCHI
• Every recipe is written gentle on spice but big on flavour
• Kashmiri mirch for colour, whole spices for aroma, and a full lesson on cooling down any dish that got too hot

KITCHEN SCHOOL: 10 SHORT LESSONS
• Perfect rice every time, kneading soft atta, the tadka method, a pressure-cooker whistle chart
• The "Mother Gravy" — one base that becomes ten different curries
• Chicken, fish and egg safety; microwave tricks; knife basics; kitchen safety

BUILT FOR STUDENT LIFE
• One-time pantry & utensils checklist that remembers what you have bought
• A 7-day starter meal plan so you always know what to cook next
• Chef's tips on every dish — the tricks families pass down at the stove
• Search any dish or ingredient and jump straight to it

100% PRIVATE, 100% OFFLINE
• No sign-in, no account, no ads, no tracking, no data collection. Ever.
• Works fully offline — cook along even when the Wi-Fi does not

From your first slightly-Australia-shaped roti to a full Sunday biryani — Hostel Rasoi walks with you, one dish at a time. Ghar ka khana, made by you.`;

(async()=>{
 let r=await api('GET','/v1/apps/'+APP+'/appStoreVersions?limit=1');
 const ver=r.body.data[0].id;
 r=await api('GET','/v1/appStoreVersions/'+ver+'/appStoreVersionLocalizations?limit=10');
 for(const loc of (r.body.data||[])){
   const pr=await api('PATCH','/v1/appStoreVersionLocalizations/'+loc.id,{data:{type:'appStoreVersionLocalizations',id:loc.id,attributes:{
     description: DESCRIPTION,
     keywords: 'recipes,indian,cooking,student,hostel,easy,dal,paneer,curry,mild,offline,vegetarian',
     supportUrl: 'https://pcssolutions.co.in',
     promotionalText: '102 easy, mild North Indian recipes for students — with a 10-lesson kitchen school, fully offline.'
   }}});
   ok('listing ('+loc.attributes.locale+')', pr);
 }
})().catch(e=>{console.error(e);process.exit(1);});
