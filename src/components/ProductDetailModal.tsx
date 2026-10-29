import React, { useState, useMemo, useEffect } from 'react';
import { X, ArrowLeft, ShoppingBag, Share2, Check } from 'lucide-react';
import { Product } from '../types';
import { DEPARTMENT_CONFIGS, getProductBarcodeVariants } from '../utils/productUtils';
import { BarcodeCard } from './BarcodeCard';
import { QuantityCalculator } from './QuantityCalculator';
import { extractProductUnitInfo, recalculateBarcodeWithMultiplier, calculateTargetQuantity } from '../utils/productWeight';
import { triggerHaptic } from '../utils/haptics';

interface ProductDetailModalProps {
  product: Product;
  initialQuantity?: number;
  onClose: () => void;
  onCopySuccess: (code: string) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  initialQuantity = 1,
  onClose,
  onCopySuccess,
}) => {
  const [imgError, setImgError] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number>(0);
  const [isImageZoomed, setIsImageZoomed] = useState(false);

  // Prevent background scroll on mobile devices when modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Extract base unit from product name (e.g. 100g, 500g, 1Kg, pièce)
  const unitInfo = useMemo(() => extractProductUnitInfo(product.name), [product.name]);
  const [multiplier, setMultiplier] = useState<number>(initialQuantity || 1);

  const deptConfig = DEPARTMENT_CONFIGS[product.department] || DEPARTMENT_CONFIGS['Fruits et légumes'];
  const rawVariants = useMemo(() => getProductBarcodeVariants(product), [product]);

  // Adjust barcodes if multiplier > 1 (e.g. 100g x 5 = 500g -> barcode calculated for 500g)
  // Règle : Les codes contenant 2000014 ne changent jamais avec le poids
  const adjustedVariants = useMemo(() => {
    return rawVariants.map((v) => {
      if (v.code.includes('2000014')) {
        return v;
      }
      if (multiplier !== 1 && v.code.length === 13) {
        const recalculated = recalculateBarcodeWithMultiplier(v.code, unitInfo, multiplier);
        return {
          ...v,
          code: recalculated,
        };
      }
      return v;
    });
  }, [rawVariants, unitInfo, multiplier]);

  // Safe index within bounds
  const currentVariant = adjustedVariants[selectedVariantIndex] || adjustedVariants[0];

  const targetCalc = calculateTargetQuantity(unitInfo, multiplier);

  const handleShare = () => {
    triggerHaptic('medium');
    const primaryCode = currentVariant?.code || product.code;
    const textToShare = `${product.name} (Code: ${product.code}) - ${targetCalc.displayCalculation} - Barcode: ${primaryCode}`;
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: textToShare,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(textToShare);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  const handleVariantSelect = (idx: number) => {
    triggerHaptic('light');
    setSelectedVariantIndex(idx);
  };

  const hasValidShortCode = Boolean(
    product.code &&
      product.code.trim() !== '' &&
      product.code.trim() !== '-' &&
      product.code.trim().toUpperCase() !== 'XXXX'
  );

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          triggerHaptic('light');
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/65 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-[480px] bg-white rounded-[24px] shadow-2xl border border-gray-100 overflow-hidden my-auto max-h-[92dvh] flex flex-col animate-in zoom-in-95 duration-150">
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-3.5 py-2.5 bg-white/95 backdrop-blur-md border-b border-gray-100 shrink-0">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-[#0759A4] py-1 px-2.5 rounded-[10px] hover:bg-[#EBF4FC] active:scale-95 transition cursor-pointer min-h-[36px]"
          >
            <ArrowLeft className="w-4 h-4 text-[#0759A4]" />
            <span>Retour</span>
          </button>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleShare}
              className="p-2 rounded-[10px] text-gray-500 hover:text-gray-900 hover:bg-gray-100 active:scale-95 transition cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
              title="Partager les informations du produit"
            >
              {copiedShare ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              className="p-2 rounded-[10px] text-gray-400 hover:text-gray-700 hover:bg-gray-100 active:scale-95 transition cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto px-3.5 py-3 space-y-2.5 overscroll-contain">
          {/* 1. Big Image & Code & Name Box */}
          <div className="bg-[#FFFFFF] rounded-[20px] border border-[#E0E0E6]/90 p-2.5 sm:p-3 shadow-2xs space-y-2">
            <div className="w-full h-36 sm:h-48 rounded-[14px] sm:rounded-[16px] bg-[#F8F7FC] border border-gray-100 p-2 flex items-center justify-center overflow-hidden relative group">
              {product.imageUrl && !imgError ? (
                <>
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    onError={() => setImgError(true)}
                    loading="eager"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain cursor-zoom-in active:scale-98 transition-transform"
                    onClick={() => {
                      triggerHaptic('light');
                      setIsImageZoomed(true);
                    }}
                    title="Cliquer pour agrandir la photo"
                  />
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-[6px] bg-black/40 text-white text-[9px] font-bold pointer-events-none backdrop-blur-xs">
                    Zoom
                  </div>
                </>
              ) : (
                <div
                  className="w-full h-full rounded-[12px] flex items-center justify-center"
                  style={{ backgroundColor: deptConfig.bgColor }}
                >
                  <ShoppingBag className="w-14 h-14 opacity-60" style={{ color: deptConfig.accentColor }} />
                </div>
              )}
            </div>

            {/* 2. Code Underneath & 3. Name Underneath */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                {hasValidShortCode ? (
                  <span className="px-3 py-1 rounded-[8px] text-xs sm:text-sm font-mono font-black bg-[#0759A4] text-white tracking-wider shadow-2xs">
                    {product.code}
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-[8px] text-xs font-black bg-gray-100 text-gray-700 border border-gray-300">
                    Indisponible
                  </span>
                )}

                <span
                  className="px-2.5 py-0.5 rounded-[8px] text-[10px] font-bold"
                  style={{ backgroundColor: deptConfig.tagBg, color: deptConfig.tagText }}
                >
                  {deptConfig.shortName}
                </span>

                <span className="text-[11px] font-bold text-gray-500">
                  {unitInfo.label}
                </span>
              </div>

              {/* Product Name (Bold) */}
              <h2 className="text-sm sm:text-base font-black text-[#171717] leading-snug tracking-tight">
                {product.name}
              </h2>
            </div>
          </div>

          {/* 4. Partia d l3bar: Stepper (-) 'digit' (+) */}
          <QuantityCalculator
            unitInfo={unitInfo}
            multiplier={multiplier}
            onMultiplierChange={(m) => setMultiplier(m)}
          />

          {/* Choix des codes-barres (style bhal statut Valide) */}
          <div className="space-y-2 pt-0.5">
            {adjustedVariants.length > 0 ? (
              <div className="space-y-2">
                {/* Badges des types de code-barres (style bhal Valide) */}
                {adjustedVariants.length > 1 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {adjustedVariants.map((variant, idx) => {
                      const isSelected = selectedVariantIndex === idx;

                      return (
                        <button
                          key={`${variant.type}-${variant.code}-${idx}`}
                          type="button"
                          onClick={() => handleVariantSelect(idx)}
                          style={{
                            backgroundColor: isSelected ? variant.accentColor : variant.badgeBg,
                            color: isSelected ? '#FFFFFF' : variant.badgeText,
                            borderColor: variant.accentColor,
                          }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black border transition-all cursor-pointer select-none active:scale-95 shadow-2xs min-h-[34px] ${
                            isSelected
                              ? 'ring-2 ring-offset-1 shadow-xs'
                              : 'opacity-85 hover:opacity-100'
                          }`}
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: isSelected ? '#FFFFFF' : variant.accentColor }}
                          />
                          {variant.label}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Displayed Barcode Card (foq lcodebarre: ghir Valide ou Possible) */}
                {currentVariant && (
                  <BarcodeCard
                    variant={currentVariant}
                    onCopySuccess={onCopySuccess}
                  />
                )}
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-[14px] p-4 text-center text-amber-900 text-xs font-medium">
                Aucun code-barres disponible pour cet article
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Image Zoom Overlay */}
      {isImageZoomed && product.imageUrl && (
        <div
          onClick={() => setIsImageZoomed(false)}
          className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md animate-in fade-in duration-150 cursor-pointer"
        >
          <div className="relative max-w-lg max-h-[85vh] p-2 bg-white rounded-[20px] shadow-2xl flex flex-col items-center">
            <img
              src={product.imageUrl}
              alt={product.name}
              referrerPolicy="no-referrer"
              className="w-full h-auto max-h-[75vh] object-contain rounded-[14px]"
            />
            <p className="text-center text-xs font-bold text-gray-700 mt-2 truncate max-w-xs">
              {product.name}
            </p>
            <span className="text-[10px] text-gray-400 mt-0.5">Touchez pour fermer</span>
          </div>
        </div>
      )}
    </div>
  );
};
