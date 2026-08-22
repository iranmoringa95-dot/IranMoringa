const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: fs.createReadStream('DATABASE/iranmori_db.sql'),
  crlfDelay: Infinity
});

const tables = [];

rl.on('line', (line) => {
  if (line.startsWith('CREATE TABLE')) {
    const match = line.match(/CREATE TABLE [`"']?([^`"'\s]+)[`"']?/);
    if (match) {
      tables.push(match[1]);
    }
  }
});

rl.on('close', () => {
  console.log('Total Tables found:', tables.length);
  const relevant = tables.filter(t => 
    t.includes('post') || t.includes('woo') || t.includes('user') || 
    t.includes('term') || t.includes('order') || t.includes('comment')
  );
  console.log('Core tables:\n', relevant.join('\n'));
});
