import fs from 'fs';
const stats = fs.statSync('public/avatar.glb');
console.log('File size:', stats.size);
const content = fs.readFileSync('public/avatar.glb', 'utf8').slice(0, 100);
console.log('Content preview:', content);
