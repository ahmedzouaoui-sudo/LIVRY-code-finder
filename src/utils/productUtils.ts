import { BarcodeVariant, Department, DepartmentConfig, Product } from '../types';

export const DEPARTMENT_CONFIGS: Record<Department, DepartmentConfig> = {
  'Boulangerie et pâtisserie': {
    name: 'Boulangerie et pâtisserie',
    shortName: 'Boulangerie',
    icon: 'Croissant',
    bgColor: '#FFF8E1',
    accentColor: '#F9A825',
    tagBg: '#FEF3C7',
    tagText: '#92400E',
  },
  'Fruits et légumes': {
    name: 'Fruits et légumes',
    shortName: 'Fruits & Légumes',
    icon: 'Apple',
    bgColor: '#E8F5E9',
    accentColor: '#155B48',
    tagBg: '#DCFCE7',
    tagText: '#14532D',
  },
  'Boucherie et volaille': {
    name: 'Boucherie et volaille',
    shortName: 'Boucherie & Volaille',
    icon: 'Beef',
    bgColor: '#FFEBEE',
    accentColor: '#B93838',
    tagBg: '#FEE2E2',
    tagText: '#991B1B',
  },
  'Fromage et charcuterie': {
    name: 'Fromage et charcuterie',
    shortName: 'Fromage & Charcuterie',
    icon: 'Ham',
    bgColor: '#FFF3CD',
    accentColor: '#0757A6',
    tagBg: '#DBEAFE',
    tagText: '#1E40AF',
  },
};

/**
 * Validates a barcode value strictly according to requirements:
 * Exclude "0", "0.0", "-", "", "sans", "XXXX", null, undefined.
 * Must be strictly 8 or 13 digits.
 */
function isValidBarcodeString(val: string | undefined): boolean {
  if (!val) return false;
  const s = val.trim();
  if (s === '0' || s === '0.0' || s === '-' || s === '' || s.toLowerCase() === 'sans' || s === 'XXXX') {
    return false;
  }
  const digits = s.replace(/\D/g, '');
  return digits.length === 8 || digits.length === 13;
}

/**
 * Extracts all valid barcode variants for a given product.
 */
export function getProductBarcodeVariants(product: Product): BarcodeVariant[] {
  const variants: BarcodeVariant[] = [];
  const seenCodes = new Set<string>();

  // 1. CODE MARJANE (marjane / code-barres Mj valide) -> Statut "Valide" (#0759A4 - Bleu Marjane)
  const primaryCode = product.barcodeMarjane || product.barcodeMjValide;
  if (isValidBarcodeString(primaryCode)) {
    const code = primaryCode!.replace(/\D/g, '');
    if (!seenCodes.has(code)) {
      seenCodes.add(code);
      variants.push({
        type: 'barcodeMarjane',
        label: 'CODE MARJANE',
        code,
        format: code.length === 8 ? 'EAN-8' : 'EAN-13',
        status: 'Valide',
        accentColor: '#0759A4',
        badgeBg: '#EFF6FF',
        badgeText: '#1E40AF',
      });
    }
  }

  // 2. CODE MJ 2 (marjane 2) -> Statut "Possible" (#7C3AED - Violet Royal)
  if (isValidBarcodeString(product.barcodeP2)) {
    const code = product.barcodeP2!.replace(/\D/g, '');
    if (!seenCodes.has(code)) {
      seenCodes.add(code);
      variants.push({
        type: 'barcodeP2',
        label: 'CODE MJ 2',
        code,
        format: code.length === 8 ? 'EAN-8' : 'EAN-13',
        status: 'Possible',
        accentColor: '#7C3AED',
        badgeBg: '#F5F3FF',
        badgeText: '#5B21B6',
      });
    }
  }

  // 3. CODE INTERNE (marjane Interne) -> Statut "Possible" (#059669 - Émeraude)
  if (isValidBarcodeString(product.barcodeInterne)) {
    const code = product.barcodeInterne!.replace(/\D/g, '');
    if (!seenCodes.has(code)) {
      seenCodes.add(code);
      variants.push({
        type: 'barcodeInterne',
        label: 'CODE INTERNE',
        code,
        format: code.length === 8 ? 'EAN-8' : 'EAN-13',
        status: 'Possible',
        accentColor: '#059669',
        badgeBg: '#ECFDF5',
        badgeText: '#065F46',
      });
    }
  }

  // 4. MARJANE MINI (marjane mini - 8 chiffres) -> Statut "Possible" (#0D9488 - Turquoise)
  if (isValidBarcodeString(product.barcodeMiniSecours)) {
    const code = product.barcodeMiniSecours!.replace(/\D/g, '');
    if (!seenCodes.has(code)) {
      seenCodes.add(code);
      variants.push({
        type: 'barcodeMiniSecours',
        label: 'MARJANE MINI',
        code,
        format: 'EAN-8',
        status: 'Possible',
        accentColor: '#0D9488',
        badgeBg: '#F0FDFA',
        badgeText: '#115E59',
      });
    }
  }

  // 5. CODE SEC (marjane sec) -> Statut "Possible" (#D97706 - Ambre Orange)
  if (isValidBarcodeString(product.barcodeSecours)) {
    const code = product.barcodeSecours!.replace(/\D/g, '');
    if (!seenCodes.has(code)) {
      seenCodes.add(code);
      variants.push({
        type: 'barcodeSecours',
        label: 'CODE SEC',
        code,
        format: code.length === 8 ? 'EAN-8' : 'EAN-13',
        status: 'Possible',
        accentColor: '#D97706',
        badgeBg: '#FFFBEB',
        badgeText: '#92400E',
      });
    }
  }

  // 6. CODE SEC 2 (marjane sec 2) -> Statut "Possible" (#C026D3 - Fuchsia)
  if (isValidBarcodeString(product.barcodeP3)) {
    const code = product.barcodeP3!.replace(/\D/g, '');
    if (!seenCodes.has(code)) {
      seenCodes.add(code);
      variants.push({
        type: 'barcodeP3',
        label: 'CODE SEC 2',
        code,
        format: code.length === 8 ? 'EAN-8' : 'EAN-13',
        status: 'Possible',
        accentColor: '#C026D3',
        badgeBg: '#FDF4FF',
        badgeText: '#86198F',
      });
    }
  }

  return variants;
}

/**
 * Normalizes text for search (lowercase, removes accents and special characters).
 */
export function normalizeSearchText(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Check if a product code is valid (not empty, not '-', and not 'XXXX').
 */
export function hasValidProductCode(code: string | undefined): boolean {
  if (!code) return false;
  const s = code.trim().toUpperCase();
  return s !== '' && s !== '-' && s !== 'XXXX';
}

/**
 * Check if a product has code 'XXXX'.
 */
export function isProductCodeXXXX(code: string | undefined): boolean {
  if (!code) return false;
  return code.trim().toUpperCase() === 'XXXX';
}

/**
 * Check if a product has at least one valid barcode.
 */
export function hasProductBarcodes(product: Product): boolean {
  return getProductBarcodeVariants(product).length > 0;
}

export type ProductDisplayStatus =
  | 'HIDDEN_XXXX'           // Code XXXX -> Never shown
  | 'HIDDEN_NO_CODE_NO_BC'   // No code and no barcode -> Never shown
  | 'UNAVAILABLE_NO_BARCODE' // Has code, but no barcode -> Shown, cannot view details, shows "Indisponible"
  | 'AVAILABLE_NO_CODE'      // Has barcode, but no code -> Shown, clickable, code badge says "Indisponible"
  | 'AVAILABLE_FULL';        // Has code AND barcode -> Normal active product

/**
 * Determines exact display and interaction status based on user rules:
 * 1. LI 3ANDO CODE XXXX MKIBANCH BMERA
 * 2. LI MAENDO CODE O CODE BARRE MAKIBANCH GA3
 * 3. LI 3ANDO CODE O MAENDOCH CODE BARRE KAYBQA TAL3 MAIS MATQDERCH TCHOFO KITLA3 INDISPONIBLE
 * 4. LI 3ANDO CODE BARRE O BLA CODE KIBAN MAIS CODE KITLA3 BLASTO INDISPONIBLE
 */
export function getProductDisplayStatus(product: Product): ProductDisplayStatus {
  const isXXXX = isProductCodeXXXX(product.code);
  if (isXXXX) return 'HIDDEN_XXXX';

  const hasCode = hasValidProductCode(product.code);
  const hasBc = hasProductBarcodes(product);

  if (!hasCode && !hasBc) return 'HIDDEN_NO_CODE_NO_BC';
  if (hasCode && !hasBc) return 'UNAVAILABLE_NO_BARCODE';
  if (!hasCode && hasBc) return 'AVAILABLE_NO_CODE';
  return 'AVAILABLE_FULL';
}

/**
 * Strips leading '#' and trims short product code.
 */
export function getCleanProductCode(code: string | undefined): string {
  if (!code) return '';
  const s = code.trim();
  if (s === '-' || s === '' || s.toUpperCase() === 'XXXX') return '';
  return s.replace(/^#\s*/, '').trim();
}

/**
 * Filter products in real-time (< 100ms) with multiple criteria.
 * Enforces user rules:
 * - Products with code XXXX are hidden
 * - Products with NO code and NO barcode are hidden
 * - Products with code but no barcode remain visible
 * - Products with barcode but no code remain visible
 */
export function filterProducts(
  products: Product[],
  query: string,
  departmentFilter?: Department | 'ALL',
  categoryFilter?: string | 'ALL',
  onlyWithBarcodes = false,
  includeXXXX = false
): Product[] {
  const cleanQuery = (query || '').replace(/^#\s*/, '').trim();
  const normQuery = normalizeSearchText(cleanQuery);
  const isNumericQuery = /^\d+$/.test(normQuery);
  const queryTokens = normQuery.split(/\s+/).filter(Boolean);

  // 1. Initial filter by active state and user visibility rules
  const candidates = products.filter((p) => {
    if (!p.isEnabled) return false;

    const status = getProductDisplayStatus(p);

    // Rule 1: LI 3ANDO CODE XXXX MKIBANCH BMERA
    if (!includeXXXX && status === 'HIDDEN_XXXX') {
      return false;
    }

    // Rule 2: LI MAENDO CODE O CODE BARRE MAKIBANCH GA3
    if (status === 'HIDDEN_NO_CODE_NO_BC') {
      return false;
    }

    if (departmentFilter && departmentFilter !== 'ALL' && p.department !== departmentFilter) {
      return false;
    }

    if (categoryFilter && categoryFilter !== 'ALL' && p.category !== categoryFilter) {
      return false;
    }

    if (onlyWithBarcodes && status === 'UNAVAILABLE_NO_BARCODE') {
      return false;
    }

    return true;
  });

  if (!normQuery) {
    return candidates;
  }

  // 2. Score candidate products
  interface ScoredProduct {
    product: Product;
    score: number;
  }

  const scored: ScoredProduct[] = [];

  for (const p of candidates) {
    const rawCode = getCleanProductCode(p.code);
    const normCode = rawCode.toLowerCase();
    const normName = normalizeSearchText(p.name);
    const normCategory = normalizeSearchText(p.category || '');
    const variants = getProductBarcodeVariants(p);

    let score = 0;

    // --- A. NUMERIC SHORT CODE QUERY (2, 3, 4 digits or any digits) ---
    if (isNumericQuery) {
      // 1. Exact match on short code (e.g. typing "6037", "552", "12", "83") -> Top Priority
      if (normCode === normQuery) {
        score += 10000;
      }
      // 2. Short code starts with query (e.g. typing "60" matches "6037", "12" matches "125")
      else if (normCode && normCode.startsWith(normQuery)) {
        score += 6000 + Math.max(0, 50 - normCode.length);
      }
      // 3. Short code ends with query
      else if (normCode && normCode.endsWith(normQuery)) {
        score += 4000;
      }
      // 4. Short code contains query
      else if (normCode && normCode.includes(normQuery)) {
        score += 3000;
      }

      // 5. Barcode matching
      for (const v of variants) {
        const cleanVCode = v.code;
        // Exact barcode match
        if (cleanVCode === normQuery) {
          score += 2500;
          break;
        }
        // Barcode starts with query
        else if (cleanVCode.startsWith(normQuery)) {
          score += 1500;
          break;
        }
        // Barcode contains query (only for queries >= 4 digits to avoid noise with 2 or 3 digits)
        else if (normQuery.length >= 4 && cleanVCode.includes(normQuery)) {
          score += 1000;
          break;
        }
      }

      // 6. Product name contains the numeric query (e.g., "500" matching "500g")
      if (normName.includes(normQuery)) {
        score += 500;
      }
    }

    // --- B. TEXT QUERY OR MULTI-WORD QUERY (Product Name / Designation) ---
    if (score === 0) {
      // Exact name match
      if (normName === normQuery) {
        score += 8000;
      }
      // Name starts with query
      else if (normName.startsWith(normQuery)) {
        score += 5000;
      }
      // Code match (alphanumeric code)
      else if (normCode && normCode === normQuery) {
        score += 7000;
      }
      // Multi-word matching across name, category, and code
      else if (queryTokens.length > 0) {
        const combined = `${normName} ${normCategory} ${normCode}`;
        const allTokensFound = queryTokens.every((token) => combined.includes(token));
        if (allTokensFound) {
          score += 2000;
          // Extra bonus if all tokens found directly in product name
          if (queryTokens.every((token) => normName.includes(token))) {
            score += 1000;
          }
          // Extra bonus if product name contains exact phrase
          if (normName.includes(normQuery)) {
            score += 1000;
          }
        }
      }
    }

    if (score > 0) {
      scored.push({ product: p, score });
    }
  }

  // Sort descending by relevance score
  scored.sort((a, b) => b.score - a.score);

  return scored.map((s) => s.product);
}
