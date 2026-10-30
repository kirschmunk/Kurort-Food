const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const {execFileSync} = require('node:child_process');
const dir = path.resolve(__dirname, '../belokurikha-rooms');
const rooms = JSON.parse(fs.readFileSync(path.join(dir, 'rooms-data.json'), 'utf8'));
const expectedImages = new Set(rooms.flatMap(r => r.images));
const collect = (folder, prefix = '') => fs.readdirSync(folder, {withFileTypes:true}).flatMap(e => {
  const name = prefix + e.name;
  if (e.name.startsWith('.') || ['developer.zip', 'manifest.json'].includes(name)) return [];
  if (e.isDirectory()) return collect(path.join(folder,e.name), name+'/');
  if (name.startsWith('assets/images/') && !expectedImages.has(name)) return [];
  return [name];
});
for (const file of expectedImages) if (!fs.existsSync(path.join(dir,file))) throw new Error('Missing '+file);
const files = collect(dir).sort();
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const manifest = {version:'20261030-neutral-overlay', designCount:2, roomCount:rooms.length, imageCount:expectedImages.size, files:Object.fromEntries(files.map(f=>[f,hash(path.join(dir,f))]))};
fs.writeFileSync(path.join(dir,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
const temp = fs.mkdtempSync(path.join(os.tmpdir(),'belok-rooms-package-'));
const packageDir = path.join(temp,'belokurikha-rooms');
for (const file of [...files,'manifest.json']) {
  const target = path.join(packageDir,file);
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.copyFileSync(path.join(dir,file),target);
}
execFileSync('zip',['-q','-r',path.join(temp,'developer.zip'),'belokurikha-rooms'],{cwd:temp});
fs.copyFileSync(path.join(temp,'developer.zip'),path.join(dir,'developer.zip'));
const verify = path.join(temp,'verify');
fs.mkdirSync(verify);
execFileSync('unzip',['-q',path.join(dir,'developer.zip'),'-d',verify]);
for (const [file, expected] of Object.entries(manifest.files)) {
  if (hash(path.join(verify,'belokurikha-rooms',file)) !== expected) throw new Error('Archive mismatch '+file);
}
console.log(`Verified archive: ${rooms.length} rooms, ${expectedImages.size} photos, ${files.length+1} files`);
