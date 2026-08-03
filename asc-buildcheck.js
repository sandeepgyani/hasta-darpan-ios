const crypto=require('crypto'),fs=require('fs'),https=require('https');
const KEY_ID='AXSWLCWZ9K',P8='C:/Users/sande/Downloads/AuthKey_AXSWLCWZ9K.p8',ISSUER=process.argv[2],APP='6796607611';
function jwt(){const h=Buffer.from(JSON.stringify({alg:'ES256',kid:KEY_ID,typ:'JWT'})).toString('base64url');const n=Math.floor(Date.now()/1000);const p=Buffer.from(JSON.stringify({iss:ISSUER,iat:n,exp:n+900,aud:'appstoreconnect-v1'})).toString('base64url');const s=crypto.sign('sha256',Buffer.from(h+'.'+p),{key:fs.readFileSync(P8,'utf8'),dsaEncoding:'ieee-p1363'}).toString('base64url');return h+'.'+p+'.'+s;}
function api(m,path){return new Promise((res,rej)=>{const r=https.request({hostname:'api.appstoreconnect.apple.com',path,method:m,headers:{Authorization:'Bearer '+jwt()}},x=>{let d='';x.on('data',c=>d+=c);x.on('end',()=>res({status:x.statusCode,body:d?JSON.parse(d):{}}));});r.on('error',rej);r.end();});}
(async()=>{const r=await api('GET','/v1/builds?filter[app]='+APP+'&limit=5&sort=-uploadedDate');
 const builds=(r.body.data||[]).map(b=>({ver:b.attributes.version,state:b.attributes.processingState,uploaded:b.attributes.uploadedDate,expired:b.attributes.expired}));
 console.log(JSON.stringify(builds,null,1));})().catch(e=>console.error(e));
