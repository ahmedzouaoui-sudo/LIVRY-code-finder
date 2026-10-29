import fs from 'fs';
import path from 'path';

// Use the updated CSV 2 which contains all 543 validated products
const csvPath = path.resolve('public/assets/aistudio/produits-livry_CATEGORIES_-_Produits__2__43de3e0b.csv');
const rawContent = fs.readFileSync(csvPath, 'utf-8');

// Parse CSV taking into account quotes
function parseCSV(text: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(current.trim());
      current = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      row.push(current.trim());
      if (row.some(cell => cell.length > 0)) {
        lines.push(row);
      }
      row = [];
      current = '';
    } else {
      current += char;
    }
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current.trim());
    if (row.some(cell => cell.length > 0)) {
      lines.push(row);
    }
  }

  return lines;
}

const parsed = parseCSV(rawContent);
const header = parsed[0];
console.log('Headers:', header);

const cleanBarcode = (val: string | undefined): string | undefined => {
  if (!val) return undefined;
  let s = val.trim();
  // Strip .0 if parsed as float e.g. 2600488005000.0
  if (s.endsWith('.0')) s = s.slice(0, -2);
  if (s === '0' || s === '0.0' || s === '-' || s === '' || s.toLowerCase() === 'sans' || s === 'XXXX') {
    return undefined;
  }
  // Remove non-digit characters if any
  const digitsOnly = s.replace(/\D/g, '');
  // GS1 rule: strictly 8 or 13 digits
  if (digitsOnly.length === 8 || digitsOnly.length === 13) {
    return digitsOnly;
  }
  return undefined;
};

const mapDept = (dept: string): 'Boulangerie et pâtisserie' | 'Fruits et légumes' | 'Boucherie et volaille' | 'Fromage et charcuterie' => {
  const d = (dept || '').toUpperCase().trim();
  if (d.includes('BOUCHERIE')) return 'Boucherie et volaille';
  if (d.includes('STAND')) return 'Fromage et charcuterie';
  if (d.includes('MARCHE')) return 'Fruits et légumes';
  if (d.includes('BOULANGERIE')) return 'Boulangerie et pâtisserie';
  return 'Fruits et légumes';
};

const cleanImage = (url: string | undefined): string | undefined => {
  if (!url) return undefined;
  let s = url.trim();
  if (!s || s === 'sans' || s === '-' || s === '0') return undefined;
  const match = s.match(/src=["']([^"']+)["']/i);
  if (match && match[1]) s = match[1].trim();
  s = s.replace(/^["'`]+|["'`]+$/g, '').trim();
  if (s.startsWith('//')) s = 'https:' + s;
  if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('/assets/')) return s;
  return undefined;
};

const products = parsed.slice(1).map((cols, idx) => {
  const [
    code,
    produit,
    barcodeMarjane,      // col 2: code-barres Mj valide = marjane (Valide)
    barcodeP2,           // col 3: code-barres Marjane possible = marjane 2
    barcodeInterne,      // col 4: code-barres mj secoure = marjane Interne
    barcodeMiniSecours,  // col 5: code-barres mj mini secoure = marjane mini
    barcodeSecours,      // col 6: code-barres mj p 2 = marjane sec
    barcodeP3,           // col 7: code-barres mj p 3 = marjane sec 2
    imageUrl,            // col 8: image_html
    departement,         // col 9: département
    categorie            // col 10: catégorie
  ] = cols;

  const rawCode = (code || '').trim();
  const finalCode = rawCode === '' ? '-' : rawCode;

  const bValide = cleanBarcode(barcodeMarjane);
  const bP2 = cleanBarcode(barcodeP2);
  const bInterne = cleanBarcode(barcodeInterne);
  const bMini = cleanBarcode(barcodeMiniSecours);
  const bSec = cleanBarcode(barcodeSecours);
  const bSec2 = cleanBarcode(barcodeP3);

  return {
    id: idx + 1,
    code: finalCode,
    name: (produit || '').trim(),
    department: mapDept(departement),
    category: (categorie || '').trim() || 'Général',
    barcodeMarjane: bValide,
    barcodeP2: bP2,
    barcodeInterne: bInterne,
    barcodeMiniSecours: bMini,
    barcodeSecours: bSec,
    barcodeP3: bSec2,
    imageUrl: cleanImage(imageUrl),
    isEnabled: true,
    barcodeMjValide: bValide,
  };
});

console.log('Total parsed products:', products.length);
const withCodes = products.filter(p => p.barcodeMarjane || p.barcodeP2 || p.barcodeInterne || p.barcodeMiniSecours || p.barcodeSecours || p.barcodeP3);
console.log('Products with at least one valid barcode:', withCodes.length);

const outContent = `import { Product } from '../types';

export const INITIAL_PRODUCTS: Product[] = ${JSON.stringify(products, null, 2)};
`;

fs.mkdirSync(path.resolve('src/data'), { recursive: true });
fs.writeFileSync(path.resolve('src/data/initialProducts.ts'), outContent, 'utf-8');
console.log('Written to src/data/initialProducts.ts successfully!');
