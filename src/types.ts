export type Role = 'Pickeur' | 'Livreur' | 'Admin';

export type Department =
  | 'Boulangerie et pâtisserie'
  | 'Fruits et légumes'
  | 'Boucherie et volaille'
  | 'Fromage et charcuterie';

export type BarcodeVariantType =
  | 'barcodeMjValide'
  | 'barcodeMarjane'
  | 'barcodeP2'
  | 'barcodeInterne'
  | 'barcodeMiniSecours'
  | 'barcodeSecours'
  | 'barcodeP3';

export type BarcodeStatus = 'Valide' | 'Possible';

export interface BarcodeVariant {
  type: BarcodeVariantType;
  label: string;
  code: string;
  format: 'EAN-13' | 'EAN-8';
  status: BarcodeStatus;
  accentColor: string;
  badgeBg: string;
  badgeText: string;
}

export interface Product {
  id: number;
  code: string; // code (ex: 6037, XXXX, -)
  name: string; // produit
  department: Department; // département
  category: string; // catégorie
  barcodeMarjane?: string; // marjane
  barcodeP2?: string; // marjane 2
  barcodeInterne?: string; // marjane Interne
  barcodeMiniSecours?: string; // marjane mini
  barcodeSecours?: string; // marjane sec
  barcodeP3?: string; // marjane sec 2
  imageUrl?: string; // image_html
  isEnabled: boolean;
  barcodeMjValide?: string; // alias
}

export interface DepartmentConfig {
  name: Department;
  shortName: string;
  icon: string;
  bgColor: string;
  accentColor: string;
  tagBg: string;
  tagText: string;
}

export type TipCategory =
  | 'Général'
  | 'Pesée & Balance'
  | 'Scanner & Caisse'
  | 'Fruits & Légumes'
  | 'Boucherie'
  | 'Fromage'
  | 'Boulangerie';

export interface TipPost {
  id: string;
  title: string;
  content: string;
  category: TipCategory;
  authorRole: Role;
  authorName?: string;
  createdAt: string;
  likes: number;
  imageUrl?: string;
  targetAudience?: 'Tous' | 'Pickeur' | 'Livreur';
}

export type DataUpdateStatus = 'up-to-date' | 'update-available' | 'updating';
