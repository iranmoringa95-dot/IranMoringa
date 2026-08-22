const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: fs.createReadStream('DATABASE/iranmori_db.sql'),
  crlfDelay: Infinity
});

let inUsermeta = false;
const metaKeys = new Set();
let count = 0;

rl.on('line', (line) => {
  if (line.includes('INSERT INTO `ss_usermeta`')) {
    inUsermeta = true;
  } else if (line.startsWith('INSERT INTO `') && !line.includes('ss_usermeta')) {
    inUsermeta = false;
  }

  if (inUsermeta) {
    const matches = line.matchAll(/\(\d+,\s*(\d+),\s*'([^']+)',/g);
    for (const m of matches) {
      metaKeys.add(m[2]);
      count++;
    }
  }
});

rl.on('close', () => {
  console.log('Total usermeta entries matched:', count);
  console.log('Meta keys found:', Array.from(metaKeys).slice(0, 30));
});
