// Uploads App Store screenshots via the ASC API.
// Usage: node asc-screenshots.js <ISSUER_ID>
const crypto = require('crypto'); const fs = require('fs'); const https = require('https'); const { URL } = require('url');
const KEY_ID='AXSWLCWZ9K', P8='C:/Users/sande/Downloads/AuthKey_AXSWLCWZ9K.p8', ISSUER=process.argv[2];
const APP='6797386877';
const SETS = [
  { type: 'APP_IPHONE_65', files: ['store-assets/hd-ios-ip1.jpg','store-assets/hd-ios-ip2.jpg','store-assets/hd-ios-ip3.jpg','store-assets/hd-ios-ip4.jpg'] },
  { type: 'APP_IPAD_PRO_3GEN_129', files: ['store-assets/hd-ios-ipad1.jpg'] },
];
if(!ISSUER){console.error('Pass Issuer ID');process.exit(1);}
function jwt(){const h=Buffer.from(JSON.stringify({alg:'ES256',kid:KEY_ID,typ:'JWT'})).toString('base64url');
const n=Math.floor(Date.now()/1000);const p=Buffer.from(JSON.stringify({iss:ISSUER,iat:n,exp:n+900,aud:'appstoreconnect-v1'})).toString('base64url');
const s=crypto.sign('sha256',Buffer.from(h+'.'+p),{key:fs.readFileSync(P8,'utf8'),dsaEncoding:'ieee-p1363'}).toString('base64url');return h+'.'+p+'.'+s;}
function api(m,path,body){return new Promise((res,rej)=>{const r=https.request({hostname:'api.appstoreconnect.apple.com',path,method:m,headers:{Authorization:'Bearer '+jwt(),'Content-Type':'application/json'}},x=>{let d='';x.on('data',c=>d+=c);x.on('end',()=>res({status:x.statusCode,body:d?JSON.parse(d):{}}));});r.on('error',rej);if(body)r.write(JSON.stringify(body));r.end();});}
function putChunk(op, buf){return new Promise((res,rej)=>{const u=new URL(op.url);const hdrs={};for(const h of (op.requestHeaders||[]))hdrs[h.name]=h.value;
const r=https.request({hostname:u.hostname,path:u.pathname+u.search,method:op.method||'PUT',headers:{...hdrs,'Content-Length':op.length}},x=>{let d='';x.on('data',c=>d+=c);x.on('end',()=>res(x.statusCode));});r.on('error',rej);r.write(buf.slice(op.offset,op.offset+op.length));r.end();});}

(async()=>{
 let r=await api('GET','/v1/apps/'+APP+'/appStoreVersions?limit=1');
 const ver=r.body.data[0].id;
 r=await api('GET','/v1/appStoreVersions/'+ver+'/appStoreVersionLocalizations?limit=10');
 const loc=r.body.data[0];
 console.log('localization:', loc.attributes.locale, loc.id);
 // existing sets
 r=await api('GET','/v1/appStoreVersionLocalizations/'+loc.id+'/appScreenshotSets?limit=20');
 const existing=r.body.data||[];
 for(const cfg of SETS){
   let set=existing.find(s=>s.attributes.screenshotDisplayType===cfg.type);
   if(!set){
     r=await api('POST','/v1/appScreenshotSets',{data:{type:'appScreenshotSets',attributes:{screenshotDisplayType:cfg.type},relationships:{appStoreVersionLocalization:{data:{type:'appStoreVersionLocalizations',id:loc.id}}}}});
     if(r.status>=300){console.log('set '+cfg.type+' ERR', JSON.stringify(r.body.errors).slice(0,200));continue;}
     set=r.body.data;
   }
   console.log('set', cfg.type, set.id);
   for(const f of cfg.files){
     const buf=fs.readFileSync(f);
     const name=f.split('/').pop();
     r=await api('POST','/v1/appScreenshots',{data:{type:'appScreenshots',attributes:{fileName:name,fileSize:buf.length},relationships:{appScreenshotSet:{data:{type:'appScreenshotSets',id:set.id}}}}});
     if(r.status>=300){console.log('  reserve '+name+' ERR', JSON.stringify(r.body.errors).slice(0,250));continue;}
     const shot=r.body.data;
     for(const op of shot.attributes.uploadOperations){
       const code=await putChunk(op, buf);
       if(code>=300){console.log('  chunk ERR', code);}
     }
     const md5=crypto.createHash('md5').update(buf).digest('hex');
     r=await api('PATCH','/v1/appScreenshots/'+shot.id,{data:{type:'appScreenshots',id:shot.id,attributes:{uploaded:true,sourceFileChecksum:md5}}});
     console.log('  '+name+':', r.status<300?'UPLOADED':'ERR '+JSON.stringify(r.body.errors).slice(0,200));
   }
 }
})().catch(e=>{console.error(e);process.exit(1);});
