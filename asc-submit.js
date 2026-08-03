// Submits version 1.0 for App Review (after the build is attached).
// Usage: node asc-submit.js <ISSUER_ID>
const crypto = require('crypto'); const fs = require('fs'); const https = require('https');
const KEY_ID='AXSWLCWZ9K', P8='C:/Users/sande/Downloads/AuthKey_AXSWLCWZ9K.p8', ISSUER=process.argv[2];
const APP='6796607611';
if(!ISSUER){console.error('Pass Issuer ID');process.exit(1);}
function jwt(){const h=Buffer.from(JSON.stringify({alg:'ES256',kid:KEY_ID,typ:'JWT'})).toString('base64url');
const n=Math.floor(Date.now()/1000);const p=Buffer.from(JSON.stringify({iss:ISSUER,iat:n,exp:n+900,aud:'appstoreconnect-v1'})).toString('base64url');
const s=crypto.sign('sha256',Buffer.from(h+'.'+p),{key:fs.readFileSync(P8,'utf8'),dsaEncoding:'ieee-p1363'}).toString('base64url');return h+'.'+p+'.'+s;}
function api(m,path,body){return new Promise((res,rej)=>{const r=https.request({hostname:'api.appstoreconnect.apple.com',path,method:m,headers:{Authorization:'Bearer '+jwt(),'Content-Type':'application/json'}},x=>{let d='';x.on('data',c=>d+=c);x.on('end',()=>res({status:x.statusCode,body:d?JSON.parse(d):{}}));});r.on('error',rej);if(body)r.write(JSON.stringify(body));r.end();});}
const ok=(l,r)=>console.log(l+':', r.status<300?'OK':'ERR '+JSON.stringify(r.body.errors||r.body).slice(0,300));
(async()=>{
 let r=await api('GET','/v1/apps/'+APP+'/appStoreVersions?limit=1');
 const ver=r.body.data[0]; console.log('version', ver.attributes.versionString, ver.attributes.appStoreState||ver.attributes.appVersionState);
 // existing open submission?
 r=await api('GET','/v1/apps/'+APP+'/reviewSubmissions?filter[state]=READY_FOR_REVIEW,WAITING_FOR_REVIEW,IN_REVIEW,UNRESOLVED_ISSUES&limit=5');
 let sub=(r.body.data||[])[0];
 if(!sub){
   r=await api('POST','/v1/reviewSubmissions',{data:{type:'reviewSubmissions',attributes:{platform:'IOS'},relationships:{app:{data:{type:'apps',id:APP}}}}});
   if(r.status>=300){console.log('create submission ERR', JSON.stringify(r.body.errors).slice(0,300)); process.exit(1);}
   sub=r.body.data;
 }
 console.log('submission', sub.id, sub.attributes.state);
 r=await api('POST','/v1/reviewSubmissionItems',{data:{type:'reviewSubmissionItems',relationships:{reviewSubmission:{data:{type:'reviewSubmissions',id:sub.id}},appStoreVersion:{data:{type:'appStoreVersions',id:ver.id}}}}});
 ok('add version to submission', r);
 r=await api('PATCH','/v1/reviewSubmissions/'+sub.id,{data:{type:'reviewSubmissions',id:sub.id,attributes:{submitted:true}}});
 ok('SUBMIT for review', r);
})().catch(e=>{console.error(e);process.exit(1);});
