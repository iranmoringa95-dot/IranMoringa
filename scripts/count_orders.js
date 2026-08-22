const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: fs.createReadStream('DATABASE/iranmori_db.sql'),
  crlfDelay: Infinity
});

let inOrders = false;
let orderCount = 0;

rl.on('line', (line) => {
  if (line.includes('INSERT INTO `ss_wc_orders`') || line.includes('INSERT INTO `ss_posts`')) {
    if (line.includes('shop_order') || line.includes('ss_wc_orders')) {
      orderCount++;
    }
  }
});

rl.on('close', () => {
  console.log('Order matches found:', orderCount);
});
