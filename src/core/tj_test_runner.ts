import fs from 'fs';
import path from 'path';
import { evaluateScan } from './tj_engine';
import type { ScanResult } from '../types';

const FIXTURES_DIR = path.resolve(process.cwd(), 'tests/fixtures');
const OUTPUTS_DIR = path.resolve(process.cwd(), 'tests/evals');

function processDirectory(category: string) {
  const inDir = path.join(FIXTURES_DIR, category);
  const outDir = path.join(OUTPUTS_DIR, category);
  
  if (!fs.existsSync(inDir)) return;
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const files = fs.readdirSync(inDir).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const rawData = fs.readFileSync(path.join(inDir, file), 'utf8');
    const scanData: ScanResult = JSON.parse(rawData);
    const result = evaluateScan(scanData);
    
    fs.writeFileSync(path.join(outDir, file), JSON.stringify(result, null, 2));
    console.log(`Processed ${category}/${file} -> risk_level: ${result.risk_level}`);
  }
}

try {
  processDirectory('high');
  processDirectory('clean');
  console.log('All fixtures processed and outputs generated.');
  process.exit(0);
} catch (e) {
  console.error(`Error processing fixtures:`, e);
  process.exit(1);
}
