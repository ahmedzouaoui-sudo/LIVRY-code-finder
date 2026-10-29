import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Lock, X, ShieldAlert, RefreshCw, Database, Check, ShoppingBag, Truck, Shield } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Role } from '../types';
import { triggerHaptic } from '../utils/haptics';
import { PWAInstallButton } from './PWAInstallButton';

export const Header: React.FC<{ onLogoClick?: () => void }> = ({ onLogoClick }) => {
  const {
    role,
    setRole,
    activeTab,
    setActiveTab,
    setSelectedDepartment,
    showToast,
    isSyncing,
    products,
    lastSyncTimestamp,
    dataUpdateStatus,
    applyUpdate,
  } = useApp();
  const [isRoleOpen, setIsRoleOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pinInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsRoleOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  useEffect(() => {
    if (isPinModalOpen) {
      setTimeout(() => {
        pinInputRef.current?.focus();
      }, 100);
    } else {
      setAdminPin('');
      setPinError(false);
    }
  }, [isPinModalOpen]);

  const roleStyles: Record<Role, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    Pickeur: {
      label: 'Pickeur',
      color: '#0759A4',
      bg: '#EBF4FC',
      icon: <ShoppingBag className="w-4 h-4 shrink-0" />,
    },
    Livreur: {
      label: 'Livreur',
      color: '#28B873',
      bg: '#EAF8F1',
      icon: <Truck className="w-4 h-4 shrink-0" />,
    },
    Admin: {
      label: 'Admin',
      color: '#B43167',
      bg: '#FDF0F5',
      icon: <Shield className="w-4 h-4 shrink-0" />,
    },
  };

  const current = roleStyles[role];

  const handleRoleSelect = (targetRole: Role) => {
    setIsRoleOpen(false);
    triggerHaptic('light');
    if (targetRole === role) return;

    if (targetRole === 'Admin') {
      setIsPinModalOpen(true);
    } else {
      setRole(targetRole);
    }
  };

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPin === '1997') {
      triggerHaptic('success');
      setRole('Admin');
      setIsPinModalOpen(false);
      setAdminPin('');
      setPinError(false);
      showToast('Accès Administrateur déverrouillé');
    } else {
      triggerHaptic('warning');
      setPinError(true);
      setAdminPin('');
      pinInputRef.current?.focus();
    }
  };

  const handleUpdateClick = () => {
    triggerHaptic('medium');
    applyUpdate();
  };

  return (
    <>
      <header className="w-full bg-[#FFFFFF] border-b border-[#E0E0E6]/80 sticky top-0 z-30 shadow-[0_2px_8px_rgba(0,0,0,0.03)] px-2.5 sm:px-6 py-2 sm:py-3 pt-safe">
        <div className="max-w-[850px] mx-auto flex items-center justify-between gap-1.5 sm:gap-3">
          {/* Application logo aligned to the left */}
          <div
            onClick={() => {
              triggerHaptic('light');
              if (onLogoClick) onLogoClick();
              else {
                setSelectedDepartment(null);
                setActiveTab('home');
              }
            }}
            className="flex items-center gap-1.5 sm:gap-2.5 cursor-pointer select-none group min-w-0 shrink-1"
          >
            <div className="w-[34px] h-[34px] sm:w-[42px] sm:h-[42px] rounded-full bg-white flex items-center justify-center p-0.5 shadow-2xs border border-gray-100 group-hover:scale-105 transition-transform shrink-0">
              <img
                src="/assets/aistudio/icon_03400f86.png"
                alt="Livry Code Finder"
                className="w-full h-full object-contain"
                loading="eager"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1 sm:gap-1.5 leading-none">
                <span className="text-[15px] sm:text-[19px] font-black tracking-tight text-[#0759A4]">
                  Livry
                </span>
                <span className="text-[10px] sm:text-[12px] font-black text-[#171717] tracking-wider uppercase">
                  FINDER
                </span>
              </div>
              <span className="text-[9px] sm:text-[10px] font-semibold text-[#757575] tracking-tight mt-0.5 hidden xs:inline truncate">
                Marjane & Aswak
              </span>
            </div>
          </div>

          {/* Right Header Area: PWA Install + "Mise à jour" (icon only on mobile) + Admin Data + Role (icon only on mobile) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Install PWA Button */}
            <PWAInstallButton />

            {/* Bouton Mise à jour (GHA ICON sur mobile, texte sur grand écran) */}
            {dataUpdateStatus === 'update-available' ? (
              <button
                type="button"
                onClick={handleUpdateClick}
                disabled={isSyncing}
                title="Des nouvelles données sont disponibles ! Cliquez pour mettre à jour"
                className="flex items-center justify-center gap-1.5 w-9 h-9 sm:w-auto sm:px-3.5 sm:py-2 rounded-[12px] sm:rounded-[14px] bg-[#0759A4] hover:bg-[#064a88] text-white font-black text-xs shadow-md shadow-blue-500/25 ring-2 ring-blue-400/50 active:scale-95 transition cursor-pointer select-none"
                aria-label="Mise à jour disponible"
              >
                <RefreshCw className={`w-4 h-4 text-white shrink-0 ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="font-black tracking-tight hidden sm:inline">Mise à jour</span>
              </button>
            ) : isSyncing ? (
              <button
                type="button"
                disabled
                className="flex items-center justify-center gap-1.5 w-9 h-9 sm:w-auto sm:px-3.5 sm:py-2 rounded-[12px] sm:rounded-[14px] bg-[#0759A4]/90 text-white font-black text-xs shadow-xs select-none"
                aria-label="Mise à jour en cours"
              >
                <RefreshCw className="w-4 h-4 animate-spin text-white shrink-0" />
                <span className="font-black tracking-tight hidden sm:inline">Mise à jour...</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleUpdateClick}
                title={lastSyncTimestamp ? `${lastSyncTimestamp} - Cliquez pour actualiser` : 'Catalogue à jour - Cliquez pour actualiser'}
                className="flex items-center justify-center gap-1.5 w-9 h-9 sm:w-auto sm:px-3.5 sm:py-2 rounded-[12px] sm:rounded-[14px] bg-[#EAF8F1] hover:bg-[#D4F4E4] active:bg-[#BFE9D4] text-[#1E8E55] border-2 border-[#28B873]/40 text-xs font-black transition shadow-xs active:scale-95 cursor-pointer select-none"
                aria-label="Catalogue à jour"
              >
                <Check className="w-4 h-4 text-[#28B873] stroke-[3] shrink-0" />
                <span className="font-black tracking-tight hidden sm:inline">À jour</span>
              </button>
            )}

            {/* Bouton direct "Données / Data" quand on est connecté en Admin */}
            {role === 'Admin' && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('medium');
                  setSelectedDepartment(null);
                  setActiveTab('admin');
                  showToast('Ouverture du panneau Données & Base...');
                }}
                title="Panneau Données, Tableur CSV et Base Supabase"
                className={`flex items-center justify-center gap-1.5 w-9 h-9 sm:w-auto sm:px-3 sm:py-2 rounded-[12px] sm:rounded-[14px] font-black text-xs transition shadow-xs active:scale-95 cursor-pointer select-none border ${
                  activeTab === 'admin'
                    ? 'bg-[#B43167] text-white border-[#B43167] shadow-xs ring-2 ring-[#B43167]/30'
                    : 'bg-[#FDF0F5] hover:bg-[#FCE4EC] text-[#B43167] border-[#B43167]/30 hover:border-[#B43167]'
                }`}
                aria-label="Panneau Données"
              >
                <Database className={`w-4 h-4 shrink-0 ${activeTab === 'admin' ? 'text-white' : 'text-[#B43167]'}`} />
                <span className="hidden sm:inline font-black tracking-tight">Data</span>
              </button>
            )}

            {/* Role Switcher Pill (GHA ICON sur mobile, texte sur grand écran) */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setIsRoleOpen(!isRoleOpen);
                }}
                className="flex items-center justify-center gap-1 sm:gap-1.5 w-9 h-9 sm:w-auto sm:px-3 sm:py-2 rounded-[12px] sm:rounded-[14px] border-2 text-xs font-black transition shadow-xs active:scale-95 cursor-pointer"
                style={{
                  backgroundColor: current.bg,
                  color: current.color,
                  borderColor: `${current.color}40`,
                }}
                title={`Rôle actuel: ${current.label} (Cliquer pour changer)`}
                aria-label={`Rôle: ${current.label}`}
              >
                {current.icon}
                <span className="hidden sm:inline truncate">{current.label}</span>
                <ChevronDown className="w-3 h-3 opacity-70 hidden sm:inline shrink-0" />
              </button>

              {isRoleOpen && (
                <div className="absolute right-0 mt-2 w-44 sm:w-48 bg-white rounded-[16px] shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1 border-b border-gray-100 mb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Changer de rôle
                  </div>
                  {(['Pickeur', 'Livreur', 'Admin'] as Role[]).map((r) => {
                    const item = roleStyles[r];
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => handleRoleSelect(r)}
                        className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-bold hover:bg-gray-50 transition cursor-pointer"
                        style={{ color: role === r ? item.color : '#333333' }}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="p-1 rounded-[6px]"
                            style={{ backgroundColor: item.bg, color: item.color }}
                          >
                            {item.icon}
                          </span>
                          <span>{item.label}</span>
                          {r === 'Admin' && role !== 'Admin' && (
                            <Lock className="w-3 h-3 text-[#B43167] opacity-80" />
                          )}
                        </div>
                        {role === r && <span className="text-xs font-black text-emerald-600">✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Admin Password Prompt Modal (Strictly Masked - 1997) */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-xs bg-white rounded-[22px] p-5 shadow-2xl border border-gray-200 animate-in zoom-in-95 duration-150 relative">
            <button
              type="button"
              onClick={() => setIsPinModalOpen(false)}
              className="absolute top-3.5 right-3.5 p-1 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-[#FDF0F5] border border-[#B43167]/20 flex items-center justify-center text-[#B43167] mb-3">
                <Lock className="w-5 h-5" />
              </div>

              <h3 className="text-sm font-bold text-[#171717]">Accès Section Admin</h3>
              <p className="text-[11px] text-gray-500 mt-1 mb-4">
                Veuillez saisir le code confidentiel administrateur pour continuer.
              </p>

              <form onSubmit={handleVerifyPin} className="w-full space-y-3">
                <div>
                  <input
                    ref={pinInputRef}
                    type="password"
                    inputMode="numeric"
                    autoComplete="current-password"
                    maxLength={10}
                    value={adminPin}
                    onChange={(e) => {
                      setAdminPin(e.target.value);
                      if (pinError) setPinError(false);
                    }}
                    placeholder="••••"
                    className={`w-full text-center text-lg tracking-[0.4em] font-bold py-2.5 px-3 rounded-[14px] border ${
                      pinError
                        ? 'border-rose-500 bg-rose-50/50 text-rose-700'
                        : 'border-gray-200 focus:border-[#B43167] bg-gray-50/60'
                    } outline-none transition`}
                  />
                  {pinError && (
                    <div className="flex items-center justify-center gap-1 mt-2 text-rose-600 text-[11px] font-bold">
                      <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                      <span>Code d'accès incorrect</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsPinModalOpen(false)}
                    className="py-2 px-3 rounded-[12px] border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={!adminPin.trim()}
                    className="py-2 px-3 rounded-[12px] bg-[#B43167] hover:bg-[#992655] text-white text-xs font-bold shadow-xs active:scale-95 transition cursor-pointer disabled:opacity-40"
                  >
                    Valider
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
