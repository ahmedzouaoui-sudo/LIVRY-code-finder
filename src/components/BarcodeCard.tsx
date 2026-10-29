import React from 'react';
import { BarcodeVariant } from '../types';
import { BarcodeRenderer } from './BarcodeRenderer';

interface BarcodeCardProps {
  variant: BarcodeVariant;
  onCopySuccess?: (code: string) => void;
}

export const BarcodeCard: React.FC<BarcodeCardProps> = ({ variant, onCopySuccess }) => {
  return (
    <div className="bg-white rounded-[16px] border border-[#E0E0E6] p-3 shadow-2xs">
      {/* Top Banner: Uniquement le statut (Valide ou Possible) */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black shadow-2xs ${
            variant.status === 'Valide'
              ? 'bg-[#E8F5E9] text-[#1B5E20]'
              : 'bg-[#FFF8E1] text-[#B78103]'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              variant.status === 'Valide' ? 'bg-[#2E7D32]' : 'bg-[#F57F17]'
            }`}
          />
          {variant.status}
        </span>
      </div>

      {/* Barcode Graphic */}
      <BarcodeRenderer
        code={variant.code}
        format={variant.format}
        onCopy={() => onCopySuccess && onCopySuccess(variant.code)}
      />
    </div>
  );
};
