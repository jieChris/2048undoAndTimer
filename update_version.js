const fs = require('fs');
const path = require('path');

// Target directory (current directory)
const dir = __dirname;
// Use current timestamp as the new version
const newVersion = Date.now().toString();

console.log(`Busting cache with new version string: ?v=${newVersion}`);

// Read all files in the directory
const files = fs.readdirSync(dir);

// Filter for HTML files
const htmlFiles = files.filter(f => f.endsWith('.html'));

let filesChanged = 0;

for (const file of htmlFiles) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  let changed = false;

  // Regex to match .js?v=XX and .css?v=XX inside tags
  // Example: src="js/theme_manager.js?v=9" -> src="js/theme_manager.js?v=1738222938"
  // Look for .js?v= or .css?v= followed by digits
  const jsRegex = /\.js\?v=\d+/g;
  const cssRegex = /\.css\?v=\d+/g;

  if (jsRegex.test(content) || cssRegex.test(content)) {
    content = content.replace(/\.js\?v=\d+/g, '.js?v=' + newVersion);
    content = content.replace(/\.css\?v=\d+/g, '.css?v=' + newVersion);
    changed = true;
  }

  // Also catch files that don't have ?v= yet, but are in js/ or style/ directories
  // This is slightly riskier but useful if some files were missed
  const jsNoVersionRegex = /src="([^"]+\.js)"/g;
  content = content.replace(jsNoVersionRegex, (match, p1) => {
    if (!p1.includes('?v=')) {
        changed = true;
        return `src="${p1}?v=${newVersion}"`;
    }
    return match;
  });

  const cssNoVersionRegex = /href="([^"]+\.css)"/g;
  content = content.replace(cssNoVersionRegex, (match, p1) => {
    if (!p1.includes('?v=')) {
        changed = true;
        return `href="${p1}?v=${newVersion}"`;
    }
    return match;
  });

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    filesChanged++;
    console.log(`Updated: ${file}`);
  }
}

console.log(`Finished. Updated ${filesChanged} HTML files.`);
