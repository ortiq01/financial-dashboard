#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');
let accountId = null;
const argAIndex = process.argv.indexOf('-a');
if (argAIndex > -1 && process.argv[argAIndex+1]) accountId = process.argv[argAIndex+1];
for (const a of process.argv){
  if (a.startsWith('--account=')) accountId = a.split('=')[1];
}

const destRoot = accountId
  ? path.join(projectRoot, 'public', 'data', 'accounts', accountId, 'uploads', 'imported')
  : path.join(projectRoot, 'public', 'data', 'uploads', 'imported');
const DATA_EXT = new Set(['.csv', '.tsv', '.tab', '.txt', '.json']);

function usage(){
  console.log('Usage: node services/import_datasets.js [/path/to/source-folder] [--account=ID | -a ID]');
  console.log('       If source folder is omitted, uses current working directory.');
}

const src = process.argv.find((p, i) => i>1 && !p.startsWith('-')) || process.cwd();

if (!fs.existsSync(src) || !fs.statSync(src).isDirectory()){
  console.error('Source folder does not exist or is not a directory:', src);
  process.exit(2);
}

const dateFolder = new Date().toISOString().slice(0,10);
const dest = path.join(destRoot, dateFolder);
fs.mkdirSync(dest, { recursive: true });

let copied = 0;
function walk(dir){
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })){
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { walk(full); continue; }
    const ext = path.extname(entry.name).toLowerCase();
    if (!DATA_EXT.has(ext)) continue;
    const safe = entry.name.replace(/[^A-Za-z0-9._-]+/g, '_');
    const out = path.join(dest, safe);
    fs.copyFileSync(full, out);
    copied++;
    console.log('Copied', full, '->', out);
  }
}

walk(src);
console.log(`Imported ${copied} file(s) into ${dest}`);