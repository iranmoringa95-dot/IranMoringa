const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: fs.createReadStream('DATABASE/iranmori_db.sql'),
  crlfDelay: Infinity
});

const postTypes = {};
rl.on('line', (line) => {
  if (line.includes("'shop_order'") || line.includes("'product'") || line.includes("'post'") || line.includes("'page'")) {
    const types = ['shop_order', 'product', 'product_variation', 'post', 'page', 'attachment'];
    for (const t of types) {
      if (line.includes(`'${t}'`)) {
        postTypes[t] = (postTypes[t] || 0) + 1;
      }
    }
  }
});

rl.on('close', () => {
  console.log('Post types found:', postTypes);
});
