const fs = require('fs');
const path = require('path');

const webRoot = __dirname;
const distDir = path.join(webRoot, 'cf-dist');
const serverAppDir = path.join(webRoot, '.next', 'server', 'app');
const nextStaticDir = path.join(webRoot, '.next', 'static');
const publicDir = path.join(webRoot, 'public');

// 1. Clean / Recreate cf-dist
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const child of fs.readdirSync(src)) {
      copyRecursive(path.join(src, child), path.join(dest, child));
    }
  } else {
    const parent = path.dirname(dest);
    if (!fs.existsSync(parent)) fs.mkdirSync(parent, { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

// 2. Copy Public Assets (images, fonts, brand)
if (fs.existsSync(publicDir)) {
  copyRecursive(publicDir, distDir);
  console.log('✓ Copied public assets to cf-dist');
}

// 3. Copy Next.js Static JS/CSS Chunks (_next/static)
const cfNextStaticDir = path.join(distDir, '_next', 'static');
if (fs.existsSync(nextStaticDir)) {
  copyRecursive(nextStaticDir, cfNextStaticDir);
  console.log('✓ Copied .next/static to cf-dist/_next/static');
}

// 4. Copy and map all HTML files from .next/server/app
function processHtmlFiles(dir, rel = '') {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.join(rel, entry.name);

    if (entry.isDirectory()) {
      processHtmlFiles(fullPath, relPath);
    } else if (entry.name.endsWith('.html')) {
      const destPath = path.join(distDir, relPath);
      copyRecursive(fullPath, destPath);

      // Also create index.html in subfolder for clean URLs (e.g. shop.html -> shop/index.html)
      const baseName = entry.name.replace(/\.html$/, '');
      if (baseName !== 'index' && baseName !== '_not-found') {
        const cleanDir = path.join(distDir, rel, baseName);
        if (!fs.existsSync(cleanDir)) fs.mkdirSync(cleanDir, { recursive: true });
        fs.copyFileSync(fullPath, path.join(cleanDir, 'index.html'));
      }

      if (baseName === '_not-found') {
        fs.copyFileSync(fullPath, path.join(distDir, '404.html'));
      }
    }
  }
}

if (fs.existsSync(serverAppDir)) {
  processHtmlFiles(serverAppDir);
  console.log('✓ Processed all HTML pages for Cloudflare CDN');
}

// 5. Clean .next/cache to save space
const cacheDir = path.join(webRoot, '.next', 'cache');
if (fs.existsSync(cacheDir)) {
  fs.rmSync(cacheDir, { recursive: true, force: true });
  console.log('✓ Cleared .next/cache');
}

console.log('🎉 Cloudflare deployment bundle prepared successfully in apps/web/cf-dist');
