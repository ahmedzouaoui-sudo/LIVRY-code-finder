import React, { useRef, useMemo, useState, useDeferredValue, useEffect } from 'react';
import { Search, Lightbulb, Database, ArrowRight, X, AlertCircle, ShoppingBag, Lock, ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Department, Product } from '../types';
import { DEPARTMENT_CONFIGS, filterProducts, getCleanProductCode, getProductDisplayStatus } from '../utils/productUtils';
import { triggerHaptic } from '../utils/haptics';

export const HomeScreen: React.FC = () => {
  const {
    searchQuery,
    setSearchQuery,
    setActiveTab,
    setSelectedDepartment,
    setSelectedProduct,
    role,
    products,
    showToast,
  } = useApp();

  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Deferred query for high performance typing without UI stuttering
  const deferredQuery = useDeferredValue(searchQuery);

  const isSearching = searchQuery.trim().length > 0;

  // Reset category filter when search query is cleared
  useEffect(() => {
    if (!isSearching) {
      setSelectedCategory('ALL');
    }
  }, [isSearching]);

  // Quick department shortcuts from home
  const handleQuickDept = (dept: Department) => {
    triggerHaptic('light');
    setSelectedDepartment(dept);
    setActiveTab('library');
  };

  // Filter products for active search query
  const searchResults = useMemo(() => {
    if (!deferredQuery.trim()) return [];
    return filterProducts(
      products,
      deferredQuery,
      'ALL',
      selectedCategory,
      false,
      false
    );
  }, [products, deferredQuery, selectedCategory]);

  // Categories available in current search results
  const availableCategories = useMemo(() => {
    if (!isSearching) return [];
    // Extract categories of all items matching query (unfiltered by category)
    const baseList = filterProducts(products, deferredQuery, 'ALL', 'ALL', false, false);
    const set = new Set<string>();
    baseList.forEach((p) => {
      if (p.category && p.category !== 'Général') {
        set.add(p.category);
      }
    });
    return Array.from(set).sort();
  }, [products, deferredQuery, isSearching]);

  const handleClearSearch = () => {
    triggerHaptic('light');
    setSearchQuery('');
    setSelectedCategory('ALL');
    inputRef.current?.focus();
  };

  const handleProductClick = (product: Product) => {
    const status = getProductDisplayStatus(product);
    // LI 3ANDO CODE O MAENDOCH CODE BARRE KAYBQA TAL3 MAIS MATQDERCH TCHOFO KITLA3 INDISPONIBLE
    if (status === 'UNAVAILABLE_NO_BARCODE') {
      triggerHaptic('warning');
      showToast('Produit indisponible (aucun code-barres)');
      return;
    }
    triggerHaptic('light');
    setSelectedProduct(product);
  };

  return (
    <div className="w-full flex-1 flex flex-col justify-between max-w-[850px] mx-auto px-3 sm:px-4 py-3 sm:py-5 min-h-[calc(100dvh-60px)] pb-safe">
      {/* Top Spacer when NOT searching */}
      {!isSearching && <div className="flex-1 transition-all duration-200" />}

      {/* Main Search Area */}
      <div className={`w-full mx-auto flex flex-col items-center transition-all duration-200 ${isSearching ? 'mt-0.5' : 'my-auto'}`}>
        {/* Brand Banner Above Search Bar (shown when idle, compact when searching) */}
        {!isSearching && (
          <div className="w-full flex items-center justify-center mb-3 sm:mb-6 px-2 animate-in fade-in duration-200">
            <img
              src="/assets/aistudio/barre_de_recherch_a0bb2929.png"
              alt="Aswak Assalam, Livry, Marjane"
              className="w-auto h-11 sm:h-18 max-w-[88%] sm:max-w-[420px] object-contain select-none pointer-events-none drop-shadow-xs"
              loading="eager"
              decoding="async"
            />
          </div>
        )}

        {/* Big Search Input Field - ALWAYS MOUNTED so keyboard never closes */}
        <div
          onClick={() => inputRef.current?.focus()}
          className={`w-full bg-[#FFFFFF] rounded-[18px] sm:rounded-[22px] shadow-[0_3px_14px_rgba(7,89,164,0.08)] border-2 transition-all flex items-center px-3.5 sm:px-5 cursor-text ${
            isSearching
              ? 'h-[48px] sm:h-[58px] border-[#0759A4] ring-2 ring-[#0759A4]/15 mb-2'
              : 'h-[60px] sm:h-[76px] border-[#0759A4]/25 hover:border-[#0759A4] focus-within:border-[#0759A4] focus-within:ring-3 focus-within:ring-[#0759A4]/15'
          }`}
        >
          {/* Search Icon */}
          <Search className={`shrink-0 mr-2.5 text-[#0759A4] ${isSearching ? 'w-4 h-4 sm:w-5 sm:h-5' : 'w-5 h-5 sm:w-6 sm:h-6'}`} />

          {/* Search Input (Mobile Optimized) */}
          <input
            ref={inputRef}
            type="search"
            inputMode="text"
            enterKeyHint="search"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Code (2, 3, 4 chiffres) ou nom..."
            className={`w-full h-full bg-transparent border-none outline-none text-[#171717] font-extrabold placeholder:text-gray-400 placeholder:font-bold ${
              isSearching ? 'text-[14px] sm:text-[18px]' : 'text-[15px] sm:text-[20px]'
            }`}
          />

          {/* Clear X Button */}
          {searchQuery && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClearSearch();
              }}
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 active:scale-90 transition shrink-0 ml-1 cursor-pointer"
              aria-label="Effacer la recherche"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Quick Department Shortcuts (Only visible when NOT searching) */}
        {!isSearching && (
          <div className="w-full flex items-center justify-center gap-1.5 sm:gap-2 mt-3.5 flex-wrap px-1 animate-in fade-in duration-150">
            <button
              type="button"
              onClick={() => handleQuickDept('Fruits et légumes')}
              className="px-2.5 py-1.5 rounded-[12px] bg-white border border-[#155B48]/25 text-[#155B48] font-bold text-[11px] shadow-2xs hover:bg-[#E8F5E9] active:scale-95 transition cursor-pointer select-none"
            >
              🍎 Fruits & Légumes
            </button>
            <button
              type="button"
              onClick={() => handleQuickDept('Boucherie et volaille')}
              className="px-2.5 py-1.5 rounded-[12px] bg-white border border-[#B93838]/25 text-[#B93838] font-bold text-[11px] shadow-2xs hover:bg-[#FFEBEE] active:scale-95 transition cursor-pointer select-none"
            >
              🥩 Boucherie
            </button>
            <button
              type="button"
              onClick={() => handleQuickDept('Fromage et charcuterie')}
              className="px-2.5 py-1.5 rounded-[12px] bg-white border border-[#0757A6]/25 text-[#0757A6] font-bold text-[11px] shadow-2xs hover:bg-[#FFF3CD] active:scale-95 transition cursor-pointer select-none"
            >
              🧀 Stand Fromage
            </button>
            <button
              type="button"
              onClick={() => handleQuickDept('Boulangerie et pâtisserie')}
              className="px-2.5 py-1.5 rounded-[12px] bg-white border border-[#F9A825]/30 text-[#92400E] font-bold text-[11px] shadow-2xs hover:bg-[#FFF8E1] active:scale-95 transition cursor-pointer select-none"
            >
              🥐 Boulangerie
            </button>
          </div>
        )}

        {/* LIVE SEARCH RESULTS DISPLAY (Visible when searching) */}
        {isSearching && (
          <div className="w-full flex-1 flex flex-col space-y-2 mt-1 animate-in fade-in duration-150">
            {/* Search Header Bar with Result Count and Quick Clear */}
            <div className="flex items-center justify-between px-1 text-xs">
              <span className="font-extrabold text-gray-800">
                {searchResults.length} article{searchResults.length > 1 ? 's' : ''} trouvé{searchResults.length > 1 ? 's' : ''} pour &ldquo;{searchQuery.trim()}&rdquo;
              </span>
              <button
                type="button"
                onClick={handleClearSearch}
                className="text-xs font-bold text-[#0759A4] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Fermer recherche</span>
              </button>
            </div>

            {/* Category Filter Chips (if multiple categories found) */}
            {availableCategories.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar select-none touch-pan-x">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setSelectedCategory('ALL');
                  }}
                  className={`px-3 py-1 rounded-[10px] text-xs font-bold transition shrink-0 cursor-pointer active:scale-95 ${
                    selectedCategory === 'ALL'
                      ? 'bg-[#0759A4] text-white shadow-xs'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  Tous ({filterProducts(products, deferredQuery, 'ALL', 'ALL', false, false).length})
                </button>
                {availableCategories.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setSelectedCategory(cat);
                      }}
                      className={`px-3 py-1 rounded-[10px] text-xs font-bold transition shrink-0 cursor-pointer active:scale-95 ${
                        isSelected
                          ? 'bg-[#0759A4] text-white shadow-xs'
                          : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Product Cards Grid: 2 columns on mobile, 3-4 columns on tablet & PC */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3.5 pt-1">
              {searchResults.length > 0 ? (
                searchResults.map((product) => {
                  const productDeptConfig =
                    DEPARTMENT_CONFIGS[product.department] ||
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
                      {/* 1. Big Image on Top */}
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

                        {/* Lock badge if product is unavailable */}
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
                          <span className="inline-flex items-center text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-[6px] bg-gray-100 text-gray-700 border border-gray-300 shadow-2xs">
                            Indisponible
                          </span>
                        ) : (
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
                <div className="col-span-2 sm:col-span-3 md:col-span-4 bg-white rounded-[18px] p-6 text-center border border-gray-200 shadow-2xs mt-2">
                  <p className="text-xs font-bold text-[#171717]">
                    Aucun article trouvé pour &ldquo;{searchQuery.trim()}&rdquo;
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1 max-w-sm mx-auto">
                    Vérifiez le numéro de code court (ex: 6037, 7989, 547) ou tapez le nom du produit (ex: bœuf, avocat, gouda, poulet).
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Spacer when NOT searching */}
      {!isSearching && <div className="flex-1 transition-all duration-200" />}

      {/* Bottom Navigation (Only visible when NOT searching) */}
      {!isSearching && (
        <div className="w-full max-w-[650px] mx-auto pt-3 pb-1 space-y-2.5 animate-in fade-in duration-150">
          {/* Bouton direct vers les Données si connecté en Admin */}
          {role === 'Admin' && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                setActiveTab('admin');
              }}
              className="w-full py-3 px-4 bg-gradient-to-r from-[#B43167] via-[#942353] to-[#7B1D45] text-white rounded-[18px] shadow-[0_4px_16px_rgba(180,49,103,0.25)] hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-between cursor-pointer select-none border border-white/20"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[10px] bg-white/20 flex items-center justify-center shrink-0">
                  <Database className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-black text-xs sm:text-sm leading-tight">
                    Panneau Données & Base (Admin)
                  </div>
                  <div className="text-[10px] text-pink-100 font-medium">
                    Tableur CSV 11 colonnes, Supabase & {products.length} articles
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-white text-[#B43167] font-black text-xs px-2.5 py-1 rounded-[10px] shadow-xs shrink-0">
                <span>Data</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('library');
            }}
            className="w-full h-[46px] sm:h-[54px] bg-[#0759A4] text-[#FFFFFF] rounded-[16px] sm:rounded-[18px] font-bold text-sm sm:text-base shadow-[0_4px_14px_rgba(7,89,164,0.2)] hover:bg-[#064a88] active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer select-none"
          >
            Bibliothèque des Rayons
          </button>

          {/* Bouton Astuces taht bibliotheque */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('tips');
            }}
            className="w-full h-[42px] sm:h-[48px] bg-[#FFFFFF] border-2 border-[#0759A4]/25 text-[#0759A4] hover:bg-[#EBF4FC]/60 rounded-[16px] sm:rounded-[18px] font-bold text-xs sm:text-sm shadow-2xs active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer select-none"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>Astuces & Tutos ({role === 'Livreur' ? 'Livreur' : 'Pickeur'})</span>
          </button>
        </div>
      )}
    </div>
  );
};
