const fs = require('fs');

const path = 'd:/Project/ProjectModul/public/app.js';
let content = fs.readFileSync(path, 'utf8');

// We want to remove lines that contain `<button class="btn-book-primary" onclick="goToPage(`
let lines = content.split('\n');
lines = lines.filter(line => !line.includes('btn-book-primary" onclick="goToPage'));

fs.writeFileSync(path, lines.join('\n'));
console.log('Removed manual goToPage buttons from app.js');
