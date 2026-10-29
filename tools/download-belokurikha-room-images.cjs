const fs = require('node:fs');
const path = require('node:path');
const dir = path.resolve(__dirname,'../belokurikha-rooms');
const rooms = JSON.parse(fs.readFileSync(path.join(dir,'rooms-data.json'),'utf8'));
const pending = rooms.flatMap(r=>r.photos.map((url,i)=>({url,file:path.join(dir,r.images[i])})));
async function download(item) {
  const url = new URL(item.url);
  if(url.hostname!=='belokurikha.ru'||!url.pathname.startsWith('/wp-content/uploads/'))throw Error('Unexpected image source');
  let lastError;
  for(const host of ['belokurikha.ru','www.belokurikha.ru']) {
    try {
      url.hostname=host;
      const res=await fetch(url,{signal:AbortSignal.timeout(20000)});
      if(!res.ok)throw Error('HTTP '+res.status);
      const bytes=Buffer.from(await res.arrayBuffer());
      if(bytes[0]!==255||bytes[1]!==216)throw Error('Not a JPEG image');
      fs.writeFileSync(item.file,bytes);
      console.log('Saved',path.basename(item.file),bytes.length);
      return;
    } catch(e) {lastError=e;}
  }
  throw lastError;
}
(async()=>{for(let i=0;i<pending.length;i+=5)await Promise.all(pending.slice(i,i+5).map(download));console.log('Saved official originals:',pending.length);})().catch(e=>{console.error(e);process.exitCode=1;});
