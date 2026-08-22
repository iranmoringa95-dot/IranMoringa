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

// Strip Next.js route groups like (storefront), (account), etc. from URL path
function normalizeRoutePath(rel) {
  const parts = rel.split(path.sep).filter(p => !/^\(.*\)$/.test(p));
  return parts.join(path.sep);
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

// 4. Copy and map all HTML, RSC, and META files from .next/server/app
function processServerAppFiles(dir, rel = '') {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const rawRelPath = path.join(rel, entry.name);

    if (entry.isDirectory()) {
      processServerAppFiles(fullPath, rawRelPath);
    } else {
      const cleanRel = normalizeRoutePath(rel);
      const cleanRelPath = normalizeRoutePath(rawRelPath);

      // Copy .html, .rsc, .meta, .json, .txt
      if (
        entry.name.endsWith('.html') ||
        entry.name.endsWith('.rsc') ||
        entry.name.endsWith('.meta') ||
        entry.name.endsWith('.json') ||
        entry.name.endsWith('.txt')
      ) {
        const destPath = path.join(distDir, cleanRelPath);
        copyRecursive(fullPath, destPath);

        // Also copy with route group preserved just in case
        if (rawRelPath !== cleanRelPath) {
          const rawDestPath = path.join(distDir, rawRelPath);
          copyRecursive(fullPath, rawDestPath);
        }

        // For .html files, create clean URL index.html and handle 404
        if (entry.name.endsWith('.html')) {
          const baseName = entry.name.replace(/\.html$/, '');

          if (baseName === '_not-found') {
            fs.copyFileSync(fullPath, path.join(distDir, '404.html'));
          } else if (baseName !== 'index') {
            const cleanDir = path.join(distDir, cleanRel, baseName);
            if (!fs.existsSync(cleanDir)) fs.mkdirSync(cleanDir, { recursive: true });
            fs.copyFileSync(fullPath, path.join(cleanDir, 'index.html'));

            // Also support URL-encoded directory for non-ASCII slugs
            const encoded = encodeURIComponent(baseName);
            if (encoded !== baseName) {
              const encodedDir = path.join(distDir, cleanRel, encoded);
              if (!fs.existsSync(encodedDir)) fs.mkdirSync(encodedDir, { recursive: true });
              fs.copyFileSync(fullPath, path.join(encodedDir, 'index.html'));
            }
          }
        }

        // For .rsc files, support URL-encoded paths as well
        if (entry.name.endsWith('.rsc')) {
          const baseName = entry.name.replace(/\.rsc$/, '');
          const encoded = encodeURIComponent(baseName);
          if (encoded !== baseName) {
            const encodedDest = path.join(distDir, cleanRel, `${encoded}.rsc`);
            fs.copyFileSync(fullPath, encodedDest);
          }
        }
      }
    }
  }
}

if (fs.existsSync(serverAppDir)) {
  processServerAppFiles(serverAppDir);
  console.log('✓ Processed and mapped all HTML & RSC routes for Cloudflare CDN');
}

// 5. Clean .next/cache to save space
const cacheDir = path.join(webRoot, '.next', 'cache');
if (fs.existsSync(cacheDir)) {
  fs.rmSync(cacheDir, { recursive: true, force: true });
  console.log('✓ Cleared .next/cache');
}

console.log('🎉 Cloudflare deployment bundle prepared successfully in apps/web/cf-dist');
