import React from 'react';
import { Minus, Plus, Scale } from 'lucide-react';
import { ProductUnitInfo, calculateTargetQuantity } from '../utils/productWeight';
import { triggerHaptic } from '../utils/haptics';

interface QuantityCalculatorProps {
  unitInfo: ProductUnitInfo;
  multiplier: number;
  onMultiplierChange: (val: number) => void;
  onReset?: () => void;
}

export const QuantityCalculator: React.FC<QuantityCalculatorProps> = ({
  unitInfo,
  multiplier,
  onMultiplierChange,
}) => {
  const handleStep = (delta: number) => {
    triggerHaptic('light');
    const next = Math.max(1, Math.min(99, multiplier + delta));
    onMultiplierChange(next);
  };

  const targetCalc = calculateTargetQuantity(unitInfo, multiplier);

  return (
    <div className="w-full my-2 space-y-1.5">
      {/* Stepper with Large 48px Touch Targets for Thumb Ergonomics */}
      <div className="flex items-center justify-between gap-2 sm:gap-3 bg-white p-2 rounded-[18px] border border-[#E0E0E6] shadow-2xs">
        <button
          type="button"
          onClick={() => handleStep(-1)}
          disabled={multiplier <= 1}
          className="w-12 h-12 rounded-[14px] flex items-center justify-center text-white active:scale-90 disabled:opacity-25 transition shadow-xs cursor-pointer select-none shrink-0"
          style={{ backgroundColor: '#1E293B' }}
          aria-label="Diminuer la quantité"
        >
          <Minus className="w-6 h-6" />
        </button>

        <div className="flex flex-col items-center justify-center px-2 flex-1 select-none text-center min-w-0">
          <div className="flex items-baseline gap-1.5 justify-center">
            <span className="text-2xl sm:text-3xl font-black text-[#171717] tracking-tight tabular-nums">
              {multiplier}
            </span>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              {unitInfo.type === 'weight' ? 'sachet(s)' : 'unité(s)'}
            </span>
          </div>
          {/* Real-time calculated weight/quantity display */}
          <span className="text-[11px] font-black text-[#0759A4] truncate">
            {targetCalc.displayCalculation}
          </span>
        </div>

        <button
          type="button"
          onClick={() => handleStep(1)}
          disabled={multiplier >= 99}
          className="w-12 h-12 rounded-[14px] flex items-center justify-center text-white active:scale-90 disabled:opacity-25 transition shadow-xs cursor-pointer select-none shrink-0"
          style={{ backgroundColor: '#0759A4' }}
          aria-label="Augmenter la quantité"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {multiplier > 1 && (
        <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 py-1 px-2.5 rounded-full border border-emerald-200/80 animate-in fade-in">
          <Scale className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Code-barres recalculé automatiquement pour {targetCalc.totalDisplay}</span>
        </div>
      )}
    </div>
  );
};
