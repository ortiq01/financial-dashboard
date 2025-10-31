const fs = require('fs');

// Read ABN AMRO data
const data = fs.readFileSync('public/data/TXT251030225219.TAB', 'utf8');
const lines = data.trim().split('\n');

const merchants = new Map();

lines.forEach(line => {
  const cols = line.split('\t');
  if (cols.length >= 8) {
    const desc = cols[7];
    
    // Extract merchant names from common patterns
    let merchant = '';
    
    // BEA/GEA transactions
    if (desc.match(/BEA,|GEA,/)) {
      const match = desc.match(/(?:BEA|GEA), (?:Google Pay|Apple Pay|Betaalpas)\s+(.+?),PAS/);
      if (match) merchant = match[1].trim();
    }
    // iDEAL transactions
    else if (desc.includes('iDEAL') || desc.includes('/TRTP/iDEAL/')) {
      const match = desc.match(/NAME\/([^\/]+)/);
      if (match) merchant = match[1].trim();
    }
    // SEPA Incasso
    else if (desc.includes('SEPA Incasso')) {
      const match = desc.match(/Naam: ([^\/\s]+)/);
      if (match) merchant = match[1].trim();
    }
    // SEPA Overboeking
    else if (desc.includes('SEPA Overboeking') || desc.includes('/TRTP/SEPA OVERBOEKING/')) {
      const match = desc.match(/NAME\/([^\/]+)/);
      if (match) merchant = match[1].trim();
    }
    
    if (merchant && merchant.length > 3) {
      const key = merchant.toLowerCase();
      if (!merchants.has(key)) {
        merchants.set(key, { name: merchant, count: 1 });
      } else {
        merchants.get(key).count++;
      }
    }
  }
});

// Sort by name
const sorted = Array.from(merchants.values()).sort((a, b) => a.name.localeCompare(b.name));

console.log('=== Unique Merchants Found (alphabetical) ===\n');
sorted.forEach((item, i) => {
  console.log(`${i+1}. [${item.count}x] ${item.name}`);
});

console.log(`\n\nTotal unique merchants: ${merchants.size}`);
