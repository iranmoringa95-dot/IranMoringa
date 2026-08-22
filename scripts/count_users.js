const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: fs.createReadStream('DATABASE/iranmori_db.sql'),
  crlfDelay: Infinity
});

let inUsers = false;
let userCount = 0;
const sampleUsers = [];

rl.on('line', (line) => {
  if (line.includes('INSERT INTO `ss_users`')) {
    inUsers = true;
  } else if (line.startsWith('INSERT INTO `') && !line.includes('ss_users')) {
    inUsers = false;
  }

  if (inUsers && line.includes('(')) {
    userCount++;
    if (sampleUsers.length < 5) {
      sampleUsers.push(line.substring(0, 100));
    }
  }
});

rl.on('close', () => {
  console.log('Total ss_users INSERT lines:', userCount);
  console.log('Sample rows:', sampleUsers);
});
