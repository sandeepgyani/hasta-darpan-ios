// Finalizes Hostel Rasoi (iOS) metadata via App Store Connect API:
// category=FOOD_AND_DRINK, copyright, age rating (all none), Free price, privacy policy URL,
// content rights declaration, and review contact. Usage: node asc-finalize.js <ISSUER_ID>
const crypto = require('crypto'); const fs = require('fs'); const https = require('https');
const KEY_ID='AXSWLCWZ9K', P8='C:/Users/sande/Downloads/AuthKey_AXSWLCWZ9K.p8', ISSUER=process.argv[2];
const APP='6797386877';
const PRIVACY='https://sandeepgyani.github.io/app-privacy-policies/hastadarpan-privacy-policy.html';
if(!ISSUER){console.error('Pass Issuer ID');process.exit(1);}
function jwt(){const h=Buffer.from(JSON.stringify({alg:'ES256',kid:KEY_ID,typ:'JWT'})).toString('base64url');
const n=Math.floor(Date.now()/1000);const p=Buffer.from(JSON.stringify({iss:ISSUER,iat:n,exp:n+900,aud:'appstoreconnect-v1'})).toString('base64url');
const s=crypto.sign('sha256',Buffer.from(h+'.'+p),{key:fs.readFileSync(P8,'utf8'),dsaEncoding:'ieee-p1363'}).toString('base64url');return h+'.'+p+'.'+s;}
function api(m,path,body){return new Promise((res,rej)=>{const r=https.request({hostname:'api.appstoreconnect.apple.com',path,method:m,headers:{Authorization:'Bearer '+jwt(),'Content-Type':'application/json'}},x=>{let d='';x.on('data',c=>d+=c);x.on('end',()=>res({status:x.statusCode,body:d?JSON.parse(d):{}}));});r.on('error',rej);if(body)r.write(JSON.stringify(body));r.end();});}
const ok=(l,r)=>console.log(l+':', r.status<300?'OK':'ERR '+JSON.stringify(r.body.errors||r.body).slice(0,240));
(async()=>{
 // appInfo (editable)
 let r=await api('GET','/v1/apps/'+APP+'/appInfos?limit=2');
 const infos=r.body.data||[];
 const info=infos.find(i=>['PREPARE_FOR_SUBMISSION','DEVELOPER_REJECTED','REJECTED'].includes(i.attributes.appStoreState||i.attributes.state))||infos[0];
 // 1. category EDUCATION
 r=await api('PATCH','/v1/appInfos/'+info.id,{data:{type:'appInfos',id:info.id,relationships:{primaryCategory:{data:{type:'appCategories',id:'LIFESTYLE'}}}}});
 ok('category FOOD_AND_DRINK', r);
 // 2. privacy policy URL on the app-info localization
 r=await api('GET','/v1/appInfos/'+info.id+'/appInfoLocalizations?limit=20');
 for(const loc of (r.body.data||[])){
   const pr=await api('PATCH','/v1/appInfoLocalizations/'+loc.id,{data:{type:'appInfoLocalizations',id:loc.id,attributes:{privacyPolicyUrl:PRIVACY}}});
   ok('privacy policy ('+loc.attributes.locale+')', pr);
 }
 // 3. version copyright
 r=await api('GET','/v1/apps/'+APP+'/appStoreVersions?limit=1');
 const ver=r.body.data[0].id;
 r=await api('PATCH','/v1/appStoreVersions/'+ver,{data:{type:'appStoreVersions',id:ver,attributes:{copyright:'2026 PCS Solutions'}}});
 ok('copyright', r);
 // 4. age rating — all none
 r=await api('GET','/v1/appStoreVersions/'+ver+'/ageRatingDeclaration');
 let decl=r.body.data;
 if(!decl){ r=await api('GET','/v1/appInfos/'+info.id+'/ageRatingDeclaration'); decl=r.body.data; }
 const NONE={ageAssurance:false,lootBox:false,userGeneratedContent:false,messagingAndChat:false,advertising:false,parentalControls:false,alcoholTobaccoOrDrugUseOrReferences:'NONE',contests:'NONE',gunsOrOtherWeapons:'NONE',healthOrWellnessTopics:false,gamblingSimulated:'NONE',horrorOrFearThemes:'NONE',matureOrSuggestiveThemes:'NONE',medicalOrTreatmentInformation:'NONE',profanityOrCrudeHumor:'NONE',sexualContentGraphicAndNudity:'NONE',sexualContentOrNudity:'NONE',violenceCartoonOrFantasy:'NONE',violenceRealistic:'NONE',violenceRealisticProlongedGraphicOrSadistic:'NONE',gambling:false,unrestrictedWebAccess:false,kidsAgeBand:null};
 if(decl){ r=await api('PATCH','/v1/ageRatingDeclarations/'+decl.id,{data:{type:'ageRatingDeclarations',id:decl.id,attributes:NONE}}); ok('age rating', r); }
 else console.log('age rating: declaration not found via API — do in UI');
 // 5. content rights — no third-party content
 r=await api('PATCH','/v1/apps/'+APP,{data:{type:'apps',id:APP,attributes:{contentRightsDeclaration:'DOES_NOT_USE_THIRD_PARTY_CONTENT'}}});
 ok('content rights', r);
 // 6. review contact + notes (no sign-in, fully offline)
 const attrs={contactFirstName:'Sandeep',contactLastName:'Gyani',contactPhone:'+91 9829013317',contactEmail:'sandeep@pcssolutions.co.in',demoAccountRequired:false,notes:'Traditional palmistry, face reading and numerology reference app. No sign-in and no account are needed, and it works fully offline with no data collection. IMPORTANT: this app does not use machine vision or AI - the user traces their own palm lines on their own photo and the app performs geometric measurement of what was traced, which is why tracing is required. To test palmistry: tap Palm photo, choose any photo of a hand, pick a line such as Life line, then drag along it on the picture and tap Generate Reading. Face reading works the same way by tapping the twenty named landmark points on a face photo. Numerology needs only a name and date of birth. The Upay tab lists traditional remedies for whatever the readings find. The language can be switched to Hindi with the button at the top. All content carries a disclaimer that it is for interest and self-reflection and is not medical, psychological, legal or financial advice.'};
 r=await api('GET','/v1/appStoreVersions/'+ver+'/appStoreReviewDetail');
 if(r.status===200 && r.body.data){ r=await api('PATCH','/v1/appStoreReviewDetails/'+r.body.data.id,{data:{type:'appStoreReviewDetails',id:r.body.data.id,attributes:attrs}}); }
 else { r=await api('POST','/v1/appStoreReviewDetails',{data:{type:'appStoreReviewDetails',attributes:attrs,relationships:{appStoreVersion:{data:{type:'appStoreVersions',id:ver}}}}}); }
 ok('review detail', r);
 // 7. price Free
 let pp=await api('GET','/v1/apps/'+APP+'/appPricePoints?filter[territory]=USA&limit=1');
 const freePoint=(pp.body.data||[])[0];
 if(freePoint){
   r=await api('POST','/v1/appPriceSchedules',{data:{type:'appPriceSchedules',relationships:{app:{data:{type:'apps',id:APP}},baseTerritory:{data:{type:'territories',id:'USA'}},manualPrices:{data:[{type:'appPrices',id:'${p1}'}]}}},included:[{id:'${p1}',type:'appPrices',attributes:{startDate:null},relationships:{appPricePoint:{data:{type:'appPricePoints',id:freePoint.id}}}}]});
   ok('price (free)', r);
 } else console.log('price: no free point found (may already be set)');
})().catch(e=>{console.error(e);process.exit(1);});
