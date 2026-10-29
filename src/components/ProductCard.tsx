import React, { useState } from 'react';
import { ShoppingBag, ChevronRight, Barcode, CheckCircle2 } from 'lucide-react';
import { Product } from '../types';
import { DEPARTMENT_CONFIGS, getProductBarcodeVariants, getProductDisplayStatus, getCleanProductCode } from '../utils/productUtils';

import { triggerHaptic } from '../utils/haptics';

interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => {
  const [imgError, setImgError] = useState(false);
  const deptConfig = DEPARTMENT_CONFIGS[product.department] || DEPARTMENT_CONFIGS['Fruits et légumes'];
  const variants = getProductBarcodeVariants(product);
  const status = getProductDisplayStatus(product);
  const isUnavailableNoBarcode = status === 'UNAVAILABLE_NO_BARCODE';
  const isAvailableNoCode = status === 'AVAILABLE_NO_CODE';
  const hasValidBarcode = variants.some((v) => v.status === 'Valide');

  const handleClick = () => {
    if (isUnavailableNoBarcode) {
      triggerHaptic('warning');
      return;
    }
    triggerHaptic('light');
    onClick();
  };

  return (
    <div
      onClick={handleClick}
      className={`group relative flex items-center gap-3.5 bg-white p-3.5 rounded-2xl border transition-all duration-150 select-none ${
        isUnavailableNoBarcode
          ? 'opacity-80 cursor-not-allowed border-gray-200'
          : 'border-[#E0E0E6]/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-[#B43167]/30 cursor-pointer active:scale-[0.98]'
      }`}
    >
      {/* 56x56 Thumbnail with Fallback */}
      <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0 flex items-center justify-center">
        {product.imageUrl && !imgError ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            onError={() => setImgError(true)}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            className={`w-full h-full object-contain p-1 transition-transform ${
              isUnavailableNoBarcode ? 'grayscale-25' : 'group-hover:scale-105'
            }`}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: deptConfig.bgColor }}
          >
            <ShoppingBag className="w-6 h-6 opacity-60" style={{ color: deptConfig.accentColor }} />
          </div>
        )}

        {/* Small Valid Indicator Badge overlay */}
        {hasValidBarcode && !isUnavailableNoBarcode && (
          <div
            className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-[#2E7D32] border border-white flex items-center justify-center shadow-xs"
            title="Code Valide disponible"
          >
            <CheckCircle2 className="w-2.5 h-2.5 text-white" />
          </div>
        )}
      </div>

      {/* Center Details */}
      <div className="flex-1 min-w-0">
        {/* Top Badges */}
        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
          {/* Code Badge or Indisponible status */}
          {isUnavailableNoBarcode ? (
            <div className="flex items-center gap-1">
              <span className="px-2 py-0.5 rounded-md text-xs font-mono font-black bg-slate-800 text-white shadow-2xs opacity-75">
                {getCleanProductCode(product.code)}
              </span>
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                Indisponible
              </span>
            </div>
          ) : isAvailableNoCode ? (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-300">
              Indisponible
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-md text-xs font-mono font-black bg-slate-900 text-white shadow-2xs">
              {getCleanProductCode(product.code)}
            </span>
          )}

          {/* Department Tag */}
          <span
            className="px-2 py-0.5 rounded-md text-[10px] font-bold"
            style={{ backgroundColor: deptConfig.tagBg, color: deptConfig.tagText }}
          >
            {deptConfig.shortName}
          </span>

          {/* Category Tag */}
          {product.category && product.category !== 'Général' && (
            <span className="text-[10px] text-gray-500 font-medium">
              • {product.category}
            </span>
          )}
        </div>

        {/* Product Name */}
        <h4 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-[#B43167] transition-colors">
          {product.name}
        </h4>

        {/* Barcode Indicator Dots */}
        <div className="flex items-center gap-1.5 mt-1.5">
          {variants.length > 0 ? (
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-semibold text-gray-400 mr-0.5">Codes :</span>
              {variants.map((v, i) => (
                <span
                  key={i}
                  className="w-2.5 h-2.5 rounded-full inline-block shadow-2xs"
                  style={{ backgroundColor: v.accentColor }}
                  title={`${v.label} (${v.status} - ${v.code})`}
                />
              ))}
              <span className="text-[10px] font-bold text-gray-600 ml-1">
                ({variants.length})
              </span>
            </div>
          ) : (
            <span className="text-[10px] text-gray-400 italic flex items-center gap-1">
              <Barcode className="w-3 h-3 text-gray-300" />
              Aucun code-barres enregistré
            </span>
          )}
        </div>
      </div>

      {/* Right Arrow */}
      <div className="shrink-0 text-gray-300 group-hover:text-[#B43167] group-hover:translate-x-0.5 transition-all">
        <ChevronRight className="w-5 h-5" />
      </div>
    </div>
  );
};
