const crypto=require('crypto'),fs=require('fs'),https=require('https');
const KEY_ID='AXSWLCWZ9K',P8='C:/Users/sande/Downloads/AuthKey_AXSWLCWZ9K.p8',ISSUER=process.argv[2],APP='6796607611';
function jwt(){const h=Buffer.from(JSON.stringify({alg:'ES256',kid:KEY_ID,typ:'JWT'})).toString('base64url');const n=Math.floor(Date.now()/1000);const p=Buffer.from(JSON.stringify({iss:ISSUER,iat:n,exp:n+900,aud:'appstoreconnect-v1'})).toString('base64url');const s=crypto.sign('sha256',Buffer.from(h+'.'+p),{key:fs.readFileSync(P8,'utf8'),dsaEncoding:'ieee-p1363'}).toString('base64url');return h+'.'+p+'.'+s;}
function api(path){return new Promise((res,rej)=>{const r=https.request({hostname:'api.appstoreconnect.apple.com',path,method:'GET',headers:{Authorization:'Bearer '+jwt()}},x=>{let d='';x.on('data',c=>d+=c);x.on('end',()=>res({status:x.statusCode,body:d?JSON.parse(d):{}}));});r.on('error',rej);r.end();});}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{for(let i=0;i<30;i++){const r=await api('/v1/builds?filter[app]='+APP+'&limit=3&sort=-uploadedDate');
 const b=(r.body.data||[])[0];
 if(b){const st=b.attributes.processingState;console.log('poll '+i+': build '+b.attributes.version+' -> '+st);if(st==='VALID'){console.log('BUILD_READY '+b.id);process.exit(0);}}
 else console.log('poll '+i+': no build yet');
 await sleep(60000);} console.log('TIMEOUT waiting for build');}) ().catch(e=>{console.error(e);process.exit(1);});
