const crypto=require('crypto'),fs=require('fs'),https=require('https');
const KEY_ID='AXSWLCWZ9K',P8='C:/Users/sande/Downloads/AuthKey_AXSWLCWZ9K.p8',ISSUER=process.argv[2],APP='6796607611',BUILD='927488dc-7b6b-47eb-8a5d-3f828999f644';
function jwt(){const h=Buffer.from(JSON.stringify({alg:'ES256',kid:KEY_ID,typ:'JWT'})).toString('base64url');const n=Math.floor(Date.now()/1000);const p=Buffer.from(JSON.stringify({iss:ISSUER,iat:n,exp:n+900,aud:'appstoreconnect-v1'})).toString('base64url');const s=crypto.sign('sha256',Buffer.from(h+'.'+p),{key:fs.readFileSync(P8,'utf8'),dsaEncoding:'ieee-p1363'}).toString('base64url');return h+'.'+p+'.'+s;}
function api(m,path,body){return new Promise((res,rej)=>{const r=https.request({hostname:'api.appstoreconnect.apple.com',path,method:m,headers:{Authorization:'Bearer '+jwt(),'Content-Type':'application/json'}},x=>{let d='';x.on('data',c=>d+=c);x.on('end',()=>res({status:x.statusCode,body:d?JSON.parse(d):{}}));});r.on('error',rej);if(body)r.write(JSON.stringify(body));r.end();});}
(async()=>{
 let r=await api('GET','/v1/apps/'+APP+'/appStoreVersions?limit=1');
 const ver=r.body.data[0].id; const state=r.body.data[0].attributes.appStoreState;
 console.log('version',r.body.data[0].attributes.versionString,state);
 r=await api('PATCH','/v1/appStoreVersions/'+ver+'/relationships/build',{data:{type:'builds',id:BUILD}});
 console.log('attach build:', r.status<300?'OK':'ERR '+JSON.stringify(r.body.errors||r.body).slice(0,300));
 // export compliance on the build (no encryption)
 r=await api('PATCH','/v1/builds/'+BUILD,{data:{type:'builds',id:BUILD,attributes:{usesNonExemptEncryption:false}}});
 console.log('export compliance:', r.status<300?'OK':'ERR '+JSON.stringify(r.body.errors||r.body).slice(0,200));
})().catch(e=>{console.error(e);process.exit(1);});
