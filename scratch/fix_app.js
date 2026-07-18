const fs = require('fs');

const path = 'd:/Project/ProjectModul/public/app.js';
let content = fs.readFileSync(path, 'utf8');

// We want to remove lines that contain `<button class="btn-book-primary" onclick="goToPage(`
// EXCEPT line 1312 which is submitQuiz, but submitQuiz doesn't use goToPage.
// So we can safely remove any line containing `<button class="btn-book-primary" onclick="goToPage(`
// Actually, they are wrapped in `+ '<div class="mt-6 text-right pb-4"><button ...>...</button></div>'`
// Let's use regex to remove the whole `+ (nextPageNum > 0 ? ...` or `+ '<div class="mt-6 ... goToPage ... </div>'`

// Remove exact match of: + '<div class="mt-6 text-right pb-4"><button class="btn-book-primary" onclick="goToPage(X)">Y</button></div>'
content = content.replace(/\s*\+\s*'<div class="mt-6 text-right pb-4">\s*<button class="btn-book-primary" onclick="goToPage\([^)]+\)">[^<]+<\/button>\s*<\/div>'/g, '');

// There is one wrapped in ternary: + (nextPageNum > 0 ? '<div ...><button ... goToPage(nextPageNum) ...</button></div>' : '')
content = content.replace(/\s*\+\s*\(nextPageNum > 0 \? '<div class="mt-6 text-right pb-4"><button class="btn-book-primary" onclick="goToPage\(' \+ nextPageNum \+ '\)">[^<]+<\/button><\/div>' : ''\)/g, '');

// There's one without div wrapper? No, let's just find any `<button class="btn-book-primary" onclick="goToPage` and remove its line.
let lines = content.split('\n');
lines = lines.filter(line => !line.includes('btn-book-primary" onclick="goToPage'));

fs.writeFileSync(path, lines.join('\n'));
console.log('Removed manual goToPage buttons from app.js');
