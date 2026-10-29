import React, { useState, useMemo, useRef, useEffect, useDeferredValue } from 'react';
import { ArrowLeft, ShoppingBag, AlertCircle, Lock, Search, X, Database } from 'lucide-react';
import { Department, Product } from '../types';
import { DEPARTMENT_CONFIGS, filterProducts, getCleanProductCode, getProductDisplayStatus } from '../utils/productUtils';
import { useApp } from '../context/AppContext';
import { triggerHaptic } from '../utils/haptics';

interface ProductListScreenProps {
  products: Product[];
  selectedDepartment: Department | null;
  initialQuery?: string;
  onBack: () => void;
  onSelectProduct: (p: Product) => void;
}

export const ProductListScreen: React.FC<ProductListScreenProps> = ({
  products,
  selectedDepartment,
  initialQuery,
  onBack,
  onSelectProduct,
}) => {
  const { showToast, searchQuery, setSearchQuery, role, setActiveTab } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  // Local search query for searching within a specific department
  const [deptSearchQuery, setDeptSearchQuery] = useState<string>('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const deptConfig = selectedDepartment ? DEPARTMENT_CONFIGS[selectedDepartment] : null;

  // The active query depends on whether we are in global search mode or department mode
  const activeQuery = selectedDepartment ? deptSearchQuery : (searchQuery || initialQuery || '');

  // High performance: defer query filtering for 60fps/120fps typing on mobile phones
  const deferredQuery = useDeferredValue(activeQuery);

  // Auto-focus search input when in global search mode
  useEffect(() => {
    if (!selectedDepartment && searchInputRef.current) {
      searchInputRef.current.focus();
      const len = searchInputRef.current.value.length;
      searchInputRef.current.setSelectionRange(len, len);
    }
  }, [selectedDepartment]);

  // Extract unique categories within this department (excluding XXXX and no-code-no-bc items)
  const categories = useMemo(() => {
    const list = selectedDepartment
      ? products.filter(
          (p) =>
            p.department === selectedDepartment &&
            p.isEnabled &&
            getProductDisplayStatus(p) !== 'HIDDEN_XXXX' &&
            getProductDisplayStatus(p) !== 'HIDDEN_NO_CODE_NO_BC'
        )
      : products.filter(
          (p) =>
            p.isEnabled &&
            getProductDisplayStatus(p) !== 'HIDDEN_XXXX' &&
            getProductDisplayStatus(p) !== 'HIDDEN_NO_CODE_NO_BC'
        );

    const unique = Array.from(new Set(list.map((p) => p.category).filter(Boolean)));
    return unique.sort();
  }, [products, selectedDepartment]);

  // Filter products by deferredQuery (2, 3, 4 digit codes, barcodes, names), department and category
  const filtered = useMemo(() => {
    return filterProducts(
      products,
      deferredQuery,
      selectedDepartment || 'ALL',
      selectedCategory,
      false,
      false
    );
  }, [products, deferredQuery, selectedDepartment, selectedCategory]);

  const title = selectedDepartment || 'Recherche de produits';

  const handleProductClick = (product: Product) => {
    const status = getProductDisplayStatus(product);
    // LI 3ANDO CODE O MAENDOCH CODE BARRE KAYBQA TAL3 MAIS MATQDERCH TCHOFO KITLA3 INDISPONIBLE
    if (status === 'UNAVAILABLE_NO_BARCODE') {
      triggerHaptic('warning');
      showToast('Produit indisponible (aucun code-barres)');
      return;
    }
    triggerHaptic('light');
    onSelectProduct(product);
  };

  const handleClearSearch = () => {
    triggerHaptic('light');
    if (selectedDepartment) {
      setDeptSearchQuery('');
    } else {
      setSearchQuery('');
      onBack();
    }
  };

  return (
    <div className="w-full max-w-[850px] mx-auto px-3 sm:px-4 py-2.5 pb-20 flex flex-col min-h-[calc(100dvh-65px)] pb-safe">
      {/* Top Header with Back Button */}
      <div className="flex items-center gap-2 mb-2">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            onBack();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] text-[#0759A4] bg-white border border-[#E0E0E6]/80 shadow-2xs hover:bg-[#EBF4FC] active:scale-95 transition font-bold text-xs shrink-0 cursor-pointer select-none"
          aria-label="Retour"
        >
          <ArrowLeft className="w-4 h-4 text-[#0759A4]" />
          <span>Retour</span>
        </button>

        <h1 className="text-sm sm:text-base font-bold text-[#171717] truncate flex-1">
          {title}
        </h1>

        <span className="text-[11px] font-bold text-[#333333] bg-white px-2.5 py-0.5 rounded-[10px] border border-gray-200 shrink-0 shadow-2xs">
          {filtered.length} art.
        </span>

        {role === 'Admin' && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic('medium');
              setActiveTab('admin');
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-[10px] bg-[#FDF0F5] hover:bg-[#FCE4EC] text-[#B43167] border border-[#B43167]/30 text-[11px] font-black transition active:scale-95 cursor-pointer shadow-2xs shrink-0 select-none"
            title="Ouvrir le panneau Données"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Data</span>
          </button>
        )}
      </div>

      {/* Search Input for Department */}
      <div className="w-full mb-2.5">
        <div className="w-full h-[46px] bg-white rounded-[14px] shadow-2xs border border-[#E0E0E6]/90 flex items-center px-3.5 transition-all focus-within:border-[#0759A4] focus-within:ring-2 focus-within:ring-[#0759A4]/15">
          <Search className="w-4 h-4 text-[#0759A4] shrink-0 mr-2.5" />
          <input
            ref={searchInputRef}
            type="search"
            inputMode="text"
            enterKeyHint="search"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            value={deptSearchQuery}
            onChange={(e) => setDeptSearchQuery(e.target.value)}
            placeholder={`Code (2, 3, 4 chiffres) ou nom dans ce rayon...`}
            className="w-full h-full bg-transparent border-none outline-none text-[#171717] font-bold text-xs sm:text-sm placeholder:text-gray-400 placeholder:font-normal"
          />
          {deptSearchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition shrink-0 ml-1 cursor-pointer"
              aria-label="Effacer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Categories Filter Tabs (Horizontal Scrollable Chips with Touch Momentum) */}
      {categories.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2.5 no-scrollbar select-none touch-pan-x">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setSelectedCategory('ALL');
            }}
            className={`px-3 py-1.5 rounded-[12px] text-xs font-bold transition shrink-0 cursor-pointer active:scale-95 ${
              selectedCategory === 'ALL'
                ? 'text-white shadow-xs'
                : 'bg-white text-gray-700 border border-gray-200/90 hover:bg-gray-50'
            }`}
            style={
              selectedCategory === 'ALL'
                ? {
                    backgroundColor: deptConfig?.accentColor || '#0759A4',
                    borderColor: deptConfig?.accentColor || '#0759A4',
                  }
                : undefined
            }
          >
            Tous ({products.filter((p) => (!selectedDepartment || p.department === selectedDepartment) && p.isEnabled && getProductDisplayStatus(p) !== 'HIDDEN_XXXX' && getProductDisplayStatus(p) !== 'HIDDEN_NO_CODE_NO_BC').length})
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setSelectedCategory(cat);
                }}
                className={`px-3 py-1.5 rounded-[12px] text-xs font-bold transition shrink-0 cursor-pointer active:scale-95 ${
                  isSelected
                    ? 'text-white shadow-xs'
                    : 'bg-white text-gray-700 border border-gray-200/90 hover:bg-gray-50'
                }`}
                style={
                  isSelected
                    ? {
                        backgroundColor: deptConfig?.accentColor || '#0759A4',
                        borderColor: deptConfig?.accentColor || '#0759A4',
                      }
                    : undefined
                }
              >
                {cat}
              </button>
            );
          })}
        </div>
      )}

      {/* Product Cards Grid: 2 columns on mobile, 3-4 columns on tablet & PC */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3.5">
        {filtered.length > 0 ? (
          filtered.map((product) => {
            const productDeptConfig =
              DEPARTMENT_CONFIGS[product.department] ||
              deptConfig ||
              DEPARTMENT_CONFIGS['Fruits et légumes'];

            const status = getProductDisplayStatus(product);
            const isUnavailableNoBarcode = status === 'UNAVAILABLE_NO_BARCODE';
            const isAvailableNoCode = status === 'AVAILABLE_NO_CODE';

            return (
              <div
                key={product.id}
                onClick={() => handleProductClick(product)}
                style={{
                  backgroundColor: isUnavailableNoBarcode ? '#FBFBFC' : productDeptConfig.bgColor,
                  borderColor: isUnavailableNoBarcode
                    ? '#E5E7EB'
                    : `${productDeptConfig.accentColor}30`,
                }}
                className={`flex flex-col rounded-[18px] border-2 transition-all select-none p-2 sm:p-2.5 overflow-hidden ${
                  isUnavailableNoBarcode
                    ? 'opacity-80 cursor-not-allowed hover:border-gray-300'
                    : 'shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md hover:scale-[1.01] active:scale-[0.97] cursor-pointer'
                }`}
              >
                {/* 1. Big Image on Top (aspect-square) */}
                <div
                  className={`relative w-full aspect-square rounded-[14px] bg-white border border-black/5 flex items-center justify-center overflow-hidden mb-2 p-1.5 sm:p-2 ${
                    isUnavailableNoBarcode ? 'grayscale-20' : ''
                  }`}
                >
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div
                      className="w-full h-full rounded-[10px] flex items-center justify-center"
                      style={{
                        backgroundColor: productDeptConfig.tagBg,
                        color: productDeptConfig.accentColor,
                      }}
                    >
                      <ShoppingBag className="w-8 h-8 sm:w-10 sm:h-10 opacity-70" />
                    </div>
                  )}

                  {/* Lock badge if product is unavailable (has code, but no barcode) */}
                  {isUnavailableNoBarcode && (
                    <div
                      className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full bg-black/65 backdrop-blur-xs flex items-center gap-1 text-white shadow-xs text-[9px] font-bold"
                      title="Produit indisponible (aucun code-barres)"
                    >
                      <Lock className="w-2.5 h-2.5" />
                      <span>Bloqué</span>
                    </div>
                  )}
                </div>

                {/* 2. Code Underneath or Indisponible Badge */}
                <div className="mb-1 flex items-center gap-1 flex-wrap">
                  {isUnavailableNoBarcode ? (
                    // LI 3ANDO CODE O MAENDOCH CODE BARRE: Code reste visible, avec badge Indisponible
                    <div className="flex items-center gap-1 flex-wrap">
                      <span
                        className="inline-block text-[10px] sm:text-[12px] font-mono font-black px-1.5 py-0.5 rounded-[6px] tracking-wider shadow-2xs border opacity-75"
                        style={{
                          backgroundColor: productDeptConfig.tagBg,
                          color: productDeptConfig.tagText,
                          borderColor: `${productDeptConfig.accentColor}35`,
                        }}
                      >
                        {getCleanProductCode(product.code)}
                      </span>
                      <span className="inline-flex items-center gap-0.5 text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-[6px] bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                        <AlertCircle className="w-2.5 h-2.5 text-amber-700 shrink-0" />
                        <span>Indisponible</span>
                      </span>
                    </div>
                  ) : isAvailableNoCode ? (
                    // LI 3ANDO CODE BARRE O BLA CODE: Kiban mais code blasto Indisponible
                    <span className="inline-flex items-center text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-[6px] bg-gray-100 text-gray-700 border border-gray-300 shadow-2xs">
                      Indisponible
                    </span>
                  ) : (
                    // AVAILABLE_FULL: Code normal
                    <span
                      className="inline-block text-[11px] sm:text-[13px] font-mono font-black px-2 py-0.5 rounded-[6px] tracking-wider shadow-2xs border"
                      style={{
                        backgroundColor: productDeptConfig.tagBg,
                        color: productDeptConfig.tagText,
                        borderColor: `${productDeptConfig.accentColor}35`,
                      }}
                    >
                      {getCleanProductCode(product.code)}
                    </span>
                  )}
                </div>

                {/* 3. Name Underneath */}
                <h3
                  className="text-[11px] sm:text-[13px] font-extrabold leading-snug line-clamp-2 mt-auto tracking-tight"
                  style={{
                    color: isUnavailableNoBarcode ? '#6B7280' : productDeptConfig.tagText,
                  }}
                  title={product.name}
                >
                  {product.name}
                </h3>
              </div>
            );
          })
        ) : (
          <div className="col-span-2 sm:col-span-3 md:col-span-4 bg-white rounded-[16px] p-6 text-center border border-gray-100 shadow-2xs mt-3">
            <p className="text-xs font-bold text-[#171717]">
              {products.length === 0 ? 'Catalogue vide (0 produit)' : 'Aucun produit trouvé'}
            </p>
            <p className="text-[11px] text-[#333333] mt-0.5">
              {products.length === 0
                ? 'Tous les produits ont été retirés pour tester la base Supabase. Ajoutez un article depuis le panneau Admin ou depuis Supabase.'
                : activeQuery.trim()
                ? `Aucun résultat pour "${activeQuery.trim()}". Essayez avec un code court (2, 3 ou 4 chiffres) ou le nom de l'article.`
                : 'Aucun article dans cette catégorie pour le moment.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
