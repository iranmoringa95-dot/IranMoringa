const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: fs.createReadStream('DATABASE/iranmori_db.sql'),
  crlfDelay: Infinity
});

let inPosts = false;
const postTypes = {};
const postStatuses = {};

rl.on('line', (line) => {
  if (line.includes('INSERT INTO `ss_posts`')) {
    inPosts = true;
  } else if (line.startsWith('INSERT INTO `') && !line.includes('ss_posts')) {
    inPosts = false;
  }

  if (inPosts) {
    // Look for post_type and post_status
    // Typical format: (ID, post_author, post_date, ..., post_status, ..., post_name, ..., post_type, ...)
  }
});
