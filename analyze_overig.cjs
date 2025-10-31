const fs = require('fs');

// Load categories
const categoriesCode = fs.readFileSync('public/config/categories.js', 'utf8');
eval(categoriesCode);

// Read ABN AMRO data
const data = fs.readFileSync('public/data/TXT251030225219.TAB', 'utf8');
const lines = data.trim().split('\n');

const overigItems = new Map();

lines.forEach(line => {
  const cols = line.split('\t');
  if (cols.length >= 8) {
    const desc = cols[7];
    const amount = cols[6];
    const category = categorizeTransaction(desc);
    
    if (category === 'Overig') {
      // Extract merchant name (first meaningful part)
      const cleanDesc = desc.substring(0, 80).trim();
      const key = cleanDesc.toLowerCase();
      if (!overigItems.has(key)) {
        overigItems.set(key, { desc: cleanDesc, amount, count: 1 });
      } else {
        overigItems.get(key).count++;
      }
    }
  }
});

// Sort by count (most frequent first)
const sorted = Array.from(overigItems.values()).sort((a, b) => b.count - a.count);

console.log('=== Items in OVERIG category (sorted by frequency) ===\n');
sorted.slice(0, 50).forEach((item, i) => {
  console.log(`${i+1}. [${item.count}x] ${item.desc}`);
});

console.log(`\n\nTotal unique Overig items: ${overigItems.size}`);
console.log(`Showing top 50 most frequent`);
