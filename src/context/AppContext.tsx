import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Department, Product, Role, TipPost, DataUpdateStatus } from '../types';
import { INITIAL_PRODUCTS } from '../data/initialProducts';
import { parseProductsFromCsv, exportProductsToCsv } from '../utils/csvImporter';
import {
  checkSupabaseHealth,
  fetchProductsFromSupabase,
  upsertProductInSupabase,
  deleteProductInSupabase,
  seedProductsToSupabase,
  deleteAllProductsFromSupabase,
  fetchTipsFromSupabase,
  upsertTipInSupabase,
  seedTipsToSupabase,
  SupabaseHealthCheckResult,
} from '../services/supabaseService';
import { supabase, supabasePublic, supabaseApi } from '../services/supabaseClient';
import { triggerHaptic } from '../utils/haptics';

export type ActiveTab = 'home' | 'library' | 'admin' | 'tips';

export interface SyncResult {
  success: boolean;
  count: number;
  addedCount: number;
  error?: string;
}

interface AppContextType {
  role: Role;
  setRole: (role: Role) => void;
  products: Product[];
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedDepartment: Department | null;
  setSelectedDepartment: (dept: Department | null) => void;
  selectedProduct: Product | null;
  setSelectedProduct: (product: Product | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // Data status & update control (Green "À jour" vs Blue "Mise à jour")
  dataUpdateStatus: DataUpdateStatus;
  hasPendingUpdate: boolean;
  pendingProducts: Product[] | null;
  pendingUpdateMessage: string | null;
  checkForUpdates: (isManual?: boolean) => Promise<void>;
  applyUpdate: () => Promise<void>;
  dismissPendingUpdate: () => void;

  toggleProductStatus: (id: number) => Promise<void>;
  updateProduct: (updated: Product) => Promise<void>;
  addProduct: (newProduct: Omit<Product, 'id'>) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;
  resetCatalogue: () => void;
  clearAllProducts: () => Promise<void>;
  seedInitialCatalogueToSupabase: () => Promise<void>;
  syncWithSupabase: (isManual?: boolean) => Promise<SyncResult>;
  syncWithFirebase: (isManual?: boolean) => Promise<SyncResult>;
  seedSupabase: () => Promise<void>;
  seedTips: () => Promise<void>;
  supabaseHealth: SupabaseHealthCheckResult | null;
  checkSupabaseStatus: () => Promise<SupabaseHealthCheckResult | null>;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  isSyncing: boolean;
  syncProgress: { processed: number; total: number } | null;
  lastSyncTimestamp: string | null;
  importProductsCsv: (csvContent: string, mode?: 'merge' | 'replace') => { success: boolean; count: number; error?: string };
  exportCatalogueCsv: () => string;
  tips: TipPost[];
  addTip: (tip: Omit<TipPost, 'id' | 'createdAt' | 'likes'>) => void;
  updateTip: (updated: TipPost) => void;
  deleteTip: (id: string) => void;
  likeTip: (id: string) => void;
}

const STORAGE_KEY_PRODUCTS = 'finder_livry_products_v3';
const STORAGE_KEY_ROLE = 'finder_livry_role_v1';
const STORAGE_KEY_LAST_SYNC = 'finder_livry_last_sync_v3';
const STORAGE_KEY_TIPS = 'finder_livry_tips_v1';

const INITIAL_TIPS: TipPost[] = [
  {
    id: 'tip-1',
    title: 'Scanner une étiquette humide ou froissée',
    content:
      'Aux rayons Boucherie et Surgelés, la buée ou le film plastique froissé empêche la douchette de biper. Astuce : Ouvrez la fiche produit sur Finder Livry et cliquez sur le bouton Plein écran pour scanner le code directement sur votre smartphone.',
    category: 'Scanner & Caisse',
    authorRole: 'Pickeur',
    authorName: 'Ahmed (Lead Pickeur)',
    targetAudience: 'Tous',
    createdAt: 'Il y a 2 jours',
    likes: 14,
  },
  {
    id: 'tip-2',
    title: 'Pesée balance en panne ou illisible',
    content:
      'Si la balance du rayon Fruits & Légumes ne sort pas de code, vérifiez l\'unité du produit (ex: 500g ou 100g). Utilisez le stepper (-) et (+) pour multiplier le poids exact (ex: 100g x 5 = 500g). Le code-barres s\'ajuste automatiquement avec la clé de pesée Marjane.',
    category: 'Pesée & Balance',
    authorRole: 'Pickeur',
    authorName: 'Yassine',
    targetAudience: 'Pickeur',
    createdAt: 'Il y a 3 jours',
    likes: 9,
  },
  {
    id: 'tip-3',
    title: 'Code XXXX ou produit non répertorié',
    content:
      'Les codes marqués XXXX sont masqués du catalogue public. Si vous rencontrez un article sans code au stand Fromage ou Boucherie, prenez une photo et transmettez le nom à l\'Admin pour qu\'il le saisisse dans le panneau d\'import CSV.',
    category: 'Général',
    authorRole: 'Admin',
    authorName: 'Admin Livry',
    targetAudience: 'Tous',
    createdAt: 'Cette semaine',
    likes: 18,
  },
  {
    id: 'tip-4',
    title: 'Astuce rapidité pour les Livreurs en caisse',
    content:
      'Mettez la luminosité de votre téléphone à 100% avant d\'arriver au tapis de caisse. Les douchettes laser Marjane bipent en moins de 0.2 seconde sur écran blanc lumineux.',
    category: 'Scanner & Caisse',
    authorRole: 'Livreur',
    authorName: 'Karim',
    targetAudience: 'Livreur',
    createdAt: 'Hier',
    likes: 12,
  },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<Role>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_ROLE);
    return (saved as Role) || 'Pickeur';
  });

  const [products, setProducts] = useState<Product[]>(() => {
    try {
      localStorage.removeItem('finder_livry_products_v2');
      const cached = localStorage.getItem(STORAGE_KEY_PRODUCTS);
      if (cached !== null) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Re-hydrate any missing imageUrl from INITIAL_PRODUCTS to guarantee images from links are always working!
          const initNameMap = new Map(INITIAL_PRODUCTS.map((p) => [p.name.trim().toLowerCase(), p.imageUrl]));
          const initCodeMap = new Map(
            INITIAL_PRODUCTS.filter((p) => p.code && p.code !== '-' && p.code !== 'XXXX').map((p) => [
              p.code.toLowerCase(),
              p.imageUrl,
            ])
          );
          return parsed.map((p: Product) => {
            if (!p.imageUrl) {
              const matchedImg =
                (p.code ? initCodeMap.get(p.code.toLowerCase()) : undefined) ||
                initNameMap.get(p.name.trim().toLowerCase());
              if (matchedImg) return { ...p, imageUrl: matchedImg };
            }
            return p;
          });
        }
      }
    } catch (e) {
      console.warn('Error reading local cache:', e);
    }
    return INITIAL_PRODUCTS;
  });

  const [tips, setTips] = useState<TipPost[]>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY_TIPS);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading local tips cache:', e);
    }
    return INITIAL_TIPS;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [syncProgress, setSyncProgress] = useState<{ processed: number; total: number } | null>(null);
  const [supabaseHealth, setSupabaseHealth] = useState<SupabaseHealthCheckResult | null>(null);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY_LAST_SYNC) || 'Catalogue prêt';
  });

  // State for user-controlled updates: Green "À jour" vs Blue "Mise à jour"
  const [dataUpdateStatus, setDataUpdateStatus] = useState<DataUpdateStatus>('up-to-date');
  const [pendingProducts, setPendingProducts] = useState<Product[] | null>(null);
  const [pendingUpdateMessage, setPendingUpdateMessage] = useState<string | null>(null);

  const hasPendingUpdate = dataUpdateStatus === 'update-available';

  // Reference to current products to avoid stale closures in listeners
  const productsRef = useRef<Product[]>(products);
  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  const isSyncing = syncStatus === 'syncing' || dataUpdateStatus === 'updating';
  const syncingRef = useRef(false);

  // Toast notification helper
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  }, []);

  // Sync products to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
    } catch (e) {
      console.warn('Local storage write limit or error:', e);
    }
  }, [products]);

  // Sync tips to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TIPS, JSON.stringify(tips));
    } catch (e) {
      console.warn('Tips storage error:', e);
    }
  }, [tips]);

  // Check Supabase status
  const checkSupabaseStatus = useCallback(async () => {
    try {
      const health = await checkSupabaseHealth();
      setSupabaseHealth(health);
      return health;
    } catch (err) {
      console.warn('Supabase health check error:', err);
      return null;
    }
  }, []);

  /**
   * Check for updates on Supabase without automatically overwriting the active app products.
   * If updates exist: marks status as 'update-available' (BLUE button) and sets message!
   * If everything matches: marks status as 'up-to-date' (GREEN button).
   */
  const checkForUpdates = useCallback(
    async (isSilent = true): Promise<void> => {
      if (syncingRef.current) return;
      try {
        const health = await checkSupabaseHealth();
        setSupabaseHealth(health);
        if (!health.connected || !health.tableExists) {
          return;
        }

        const res = await fetchProductsFromSupabase();
        if (res.success) {
          const remoteList = res.products;
          const currentList = productsRef.current;

          // Check if there are differences in length or content
          const currentIds = new Set(currentList.map((p) => `${p.id}_${p.code}_${p.name}_${p.imageUrl || ''}`));
          const hasDifferentItems =
            remoteList.length !== currentList.length ||
            remoteList.some((p) => !currentIds.has(`${p.id}_${p.code}_${p.name}_${p.imageUrl || ''}`));

          if (hasDifferentItems && remoteList.length > 0) {
            // New data is available! DO NOT overwrite automatically!
            setPendingProducts(remoteList);
            setDataUpdateStatus('update-available');
            const diff = remoteList.length - currentList.length;
            const diffMsg =
              diff > 0
                ? `${diff} nouveau${diff > 1 ? 'x' : ''} produit${diff > 1 ? 's' : ''} disponible${diff > 1 ? 's' : ''}`
                : `Mise à jour prête (${remoteList.length} articles)`;
            setPendingUpdateMessage(diffMsg);

            if (!isSilent) {
              triggerHaptic('medium');
              showToast(`🔔 ${diffMsg} ! Cliquez sur 'Mise à jour' en bleu pour actualiser.`);
            }
          } else {
            // Data is up to date!
            setDataUpdateStatus('up-to-date');
            setPendingProducts(null);
            setPendingUpdateMessage(null);
            if (!isSilent) {
              triggerHaptic('success');
              showToast(`✅ Votre catalogue est déjà à jour (${currentList.length} articles)`);
            }
          }
        }
      } catch (err) {
        console.warn('[CheckForUpdates] Error:', err);
      }
    },
    [showToast]
  );

  /**
   * User manually clicks the update button to apply pending data or refresh from DB.
   * When complete, turns the status to GREEN ('up-to-date').
   */
  const applyUpdate = useCallback(async (): Promise<void> => {
    // 1. If we already have pending products waiting in memory:
    if (pendingProducts && pendingProducts.length > 0) {
      setDataUpdateStatus('updating');
      setProducts(pendingProducts);
      const appliedCount = pendingProducts.length;
      setPendingProducts(null);
      setPendingUpdateMessage(null);
      setDataUpdateStatus('up-to-date');

      const nowTime = new Date().toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const note = `À jour (${appliedCount} articles synchronisés à ${nowTime})`;
      setLastSyncTimestamp(note);
      localStorage.setItem(STORAGE_KEY_LAST_SYNC, note);

      triggerHaptic('success');
      showToast(`✅ Données mises à jour avec succès : ${appliedCount} articles actifs !`);
      return;
    }

    // 2. Otherwise, perform a manual fetch and check from Supabase:
    setDataUpdateStatus('updating');
    setSyncStatus('syncing');
    showToast('Vérification des mises à jour...');

    try {
      const res = await fetchProductsFromSupabase();
      if (res.success) {
        const remoteList = res.products;
        setProducts(remoteList);
        setDataUpdateStatus('up-to-date');
        setPendingProducts(null);
        setPendingUpdateMessage(null);

        const nowTime = new Date().toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
        });
        const note = `À jour (${remoteList.length} articles synchronisés à ${nowTime})`;
        setLastSyncTimestamp(note);
        localStorage.setItem(STORAGE_KEY_LAST_SYNC, note);
        setSyncStatus('synced');

        triggerHaptic('success');
        showToast(`✅ Catalogue à jour : ${remoteList.length} articles disponibles !`);
      } else {
        setDataUpdateStatus('up-to-date');
        setSyncStatus('error');
        showToast(`⚠️ Supabase : ${res.error || 'Erreur réseau'}`);
      }
    } catch (err: any) {
      setDataUpdateStatus('up-to-date');
      setSyncStatus('error');
      showToast(`❌ Erreur : ${err.message}`);
    }
  }, [pendingProducts, showToast]);

  const dismissPendingUpdate = useCallback(() => {
    setPendingUpdateMessage(null);
  }, []);

  // Main sync function for Admin actions
  const syncWithSupabase = useCallback(
    async (isManual = false): Promise<SyncResult> => {
      if (isManual) {
        await applyUpdate();
        return { success: true, count: productsRef.current.length, addedCount: 0 };
      }
      await checkForUpdates(true);
      return { success: true, count: productsRef.current.length, addedCount: 0 };
    },
    [applyUpdate, checkForUpdates]
  );

  // Initial check on mount
  useEffect(() => {
    let isMounted = true;
    const initCheck = async () => {
      const health = await checkSupabaseHealth();
      if (!isMounted) return;
      setSupabaseHealth(health);

      if (health.connected && health.tableExists) {
        // Check if there are updates available without auto-overwriting
        await checkForUpdates(true);

        // Fetch tips
        const tipsRes = await fetchTipsFromSupabase();
        if (isMounted && tipsRes.success) {
          if (tipsRes.tips.length > 0) {
            setTips(tipsRes.tips);
          } else {
            await seedTipsToSupabase(INITIAL_TIPS);
          }
        }
      }
    };

    initCheck();
    return () => {
      isMounted = false;
    };
  }, [checkForUpdates]);

  // Periodic lightweight check for updates every 45s (when window is visible)
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        checkForUpdates(true).catch(console.warn);
      }
    }, 45000);

    const handleTabFocus = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdates(true).catch(console.warn);
      }
    };

    window.addEventListener('focus', handleTabFocus);
    document.addEventListener('visibilitychange', handleTabFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleTabFocus);
      document.removeEventListener('visibilitychange', handleTabFocus);
    };
  }, [checkForUpdates]);

  // Real-time Supabase Event Listener:
  // When someone adds or modifies products on Supabase (e.g. from a website or dashboard),
  // DO NOT replace data automatically! Turn status to 'update-available' (BLUE button) with notification!
  useEffect(() => {
    let isMounted = true;

    const channelPub = supabasePublic
      .channel('realtime-db-sync-public')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        async (payload: any) => {
          if (!isMounted) return;
          console.log('[Supabase Realtime] Changement détecté sur products:', payload.eventType);
          // Check for updates, populate pendingProducts and switch button to BLUE
          await checkForUpdates(false);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tips' },
        async () => {
          if (!isMounted) return;
          const res = await fetchTipsFromSupabase();
          if (res.success && isMounted && res.tips.length > 0) {
            setTips(res.tips);
          }
        }
      )
      .subscribe();

    const channelApi = supabaseApi
      .channel('realtime-db-sync-api')
      .on(
        'postgres_changes',
        { event: '*', schema: 'api', table: 'products' },
        async (payload: any) => {
          if (!isMounted) return;
          console.log('[Supabase Realtime API] Changement détecté sur products:', payload.eventType);
          await checkForUpdates(false);
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabasePublic.removeChannel(channelPub);
      supabaseApi.removeChannel(channelApi);
    };
  }, [checkForUpdates]);

  const setRole = (newRole: Role) => {
    setRoleState(newRole);
    localStorage.setItem(STORAGE_KEY_ROLE, newRole);
    if (newRole === 'Admin') {
      setActiveTab('admin');
    }
    showToast(`Rôle activé : ${newRole}`);
  };

  const toggleProductStatus = async (id: number) => {
    let targetProduct: Product | undefined;
    setProducts((prev) => {
      const updated = prev.map((p) => {
        if (p.id === id) {
          const toggled = { ...p, isEnabled: !p.isEnabled };
          targetProduct = toggled;
          return toggled;
        }
        return p;
      });
      return updated;
    });

    if (targetProduct) {
      const res = await upsertProductInSupabase(targetProduct);
      if (!res.success) {
        showToast(`⚠️ Statut mis à jour localement (Erreur Supabase: ${res.error})`);
      } else {
        showToast('Statut du produit mis à jour');
      }
    }
  };

  const updateProduct = async (updated: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    if (selectedProduct?.id === updated.id) {
      setSelectedProduct(updated);
    }

    const res = await upsertProductInSupabase(updated);
    if (!res.success) {
      showToast(`⚠️ Produit enregistré localement mais erreur Supabase : ${res.error}`);
    } else {
      showToast('✅ Produit enregistré dans l\'application et Supabase !');
    }
  };

  const addProduct = async (newProduct: Omit<Product, 'id'>) => {
    const maxExisting = productsRef.current.reduce((max, p) => (p.id > max ? p.id : max), 0);
    const nextId = maxExisting > 0 ? maxExisting + 1 : Math.floor(Date.now() % 1000000000);

    const fullProd: Product = { ...newProduct, id: nextId };
    setProducts((prev) => [fullProd, ...prev]);

    const res = await upsertProductInSupabase(fullProd);
    if (!res.success) {
      showToast(`⚠️ Produit "${fullProd.name}" ajouté localement (Erreur Supabase: ${res.error})`);
    } else {
      showToast(`✅ Produit "${fullProd.name}" synchronisé sur Supabase !`);
    }
  };

  const deleteProduct = async (id: number) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    if (selectedProduct?.id === id) {
      setSelectedProduct(null);
    }

    const res = await deleteProductInSupabase(id);
    if (!res.success) {
      showToast(`⚠️ Supprimé localement (Erreur Supabase: ${res.error})`);
    } else {
      showToast('Produit supprimé du catalogue et de Supabase');
    }
  };

  const clearAllProducts = async () => {
    setProducts([]);
    try {
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify([]));
    } catch (e) {
      console.warn(e);
    }
    try {
      await deleteAllProductsFromSupabase();
      await checkSupabaseStatus();
    } catch (e) {
      console.warn('Error clearing Supabase:', e);
    }
    setDataUpdateStatus('up-to-date');
    showToast('Tous les produits ont été supprimés (0 produit). Prêt pour le test Supabase !');
  };

  const resetCatalogue = async () => {
    setProducts(INITIAL_PRODUCTS);
    try {
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    } catch (e) {
      console.warn(e);
    }
    showToast('Restauration du catalogue (543 articles) vers Supabase...');
    await seedInitialCatalogueToSupabase();
  };

  const seedInitialCatalogueToSupabase = async () => {
    setSyncStatus('syncing');
    setSyncProgress({ processed: 0, total: INITIAL_PRODUCTS.length });
    showToast(`Envoi des 543 articles officiels vers Supabase...`);

    try {
      const res = await seedProductsToSupabase(INITIAL_PRODUCTS, (processed, total) => {
        setSyncProgress({ processed, total });
      });

      if (res.success) {
        setProducts(INITIAL_PRODUCTS);
        const nowStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        const syncNote = `À jour (${res.count} produits envoyés à ${nowStr})`;
        setLastSyncTimestamp(syncNote);
        localStorage.setItem(STORAGE_KEY_LAST_SYNC, syncNote);
        setSyncStatus('synced');
        setDataUpdateStatus('up-to-date');
        setSyncProgress(null);
        await checkSupabaseStatus();
        showToast(`Succès : ${res.count} produits enregistrés sur Supabase !`);
      } else {
        setSyncStatus('error');
        setSyncProgress(null);
        showToast(`Erreur d'envoi : ${res.error}`);
      }
    } catch (err: any) {
      setSyncStatus('error');
      setSyncProgress(null);
      showToast(`Erreur : ${err.message}`);
    }
  };

  const importProductsCsv = (csvContent: string, mode: 'merge' | 'replace' = 'merge') => {
    const { products: parsed, error } = parseProductsFromCsv(csvContent);
    if (error || !parsed || parsed.length === 0) {
      showToast(error || 'Échec de lecture du fichier CSV');
      return { success: false, count: 0, error: error || 'Format invalide' };
    }

    if (mode === 'replace') {
      setProducts(parsed);
      setDataUpdateStatus('up-to-date');
      showToast(`${parsed.length} produits importés (catalogue remplacé)`);
      return { success: true, count: parsed.length };
    }

    let updatedCount = 0;
    let addedCount = 0;

    setProducts((prev) => {
      const copy = [...prev];
      const maxId = Math.max(...prev.map((p) => p.id), 0);
      let currentNewId = maxId + 1;

      for (const item of parsed) {
        const matchIdx = copy.findIndex(
          (p) =>
            (item.code !== '-' && item.code !== 'XXXX' && p.code.toLowerCase() === item.code.toLowerCase()) ||
            p.name.trim().toLowerCase() === item.name.trim().toLowerCase()
        );

        if (matchIdx !== -1) {
          copy[matchIdx] = {
            ...copy[matchIdx],
            code: item.code !== '-' ? item.code : copy[matchIdx].code,
            barcodeMjValide: item.barcodeMjValide || copy[matchIdx].barcodeMjValide,
            barcodeMarjane: item.barcodeMarjane || copy[matchIdx].barcodeMarjane,
            barcodeSecours: item.barcodeSecours || copy[matchIdx].barcodeSecours,
            barcodeMiniSecours: item.barcodeMiniSecours || copy[matchIdx].barcodeMiniSecours,
            barcodeP2: item.barcodeP2 || copy[matchIdx].barcodeP2,
            barcodeP3: item.barcodeP3 || copy[matchIdx].barcodeP3,
            imageUrl: item.imageUrl || copy[matchIdx].imageUrl,
          };
          updatedCount++;
        } else {
          copy.push({
            ...item,
            id: currentNewId++,
          });
          addedCount++;
        }
      }

      return copy;
    });

    setDataUpdateStatus('up-to-date');
    const msg = `${updatedCount} produits mis à jour, ${addedCount} nouveaux ajoutés`;
    showToast(msg);
    return { success: true, count: updatedCount + addedCount };
  };

  const exportCatalogueCsv = () => {
    return exportProductsToCsv(products);
  };

  // Tips Management
  const addTip = (newTip: Omit<TipPost, 'id' | 'createdAt' | 'likes'>) => {
    const post: TipPost = {
      ...newTip,
      id: `tip-${Date.now()}`,
      createdAt: 'À l\'instant',
      likes: 0,
    };
    setTips((prev) => [post, ...prev]);
    upsertTipInSupabase(post).catch(console.warn);
    showToast('Tuto / Astuce publié avec succès !');
  };

  const updateTip = (updated: TipPost) => {
    setTips((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    upsertTipInSupabase(updated).catch(console.warn);
    showToast('Tuto mis à jour avec succès');
  };

  const deleteTip = (id: string) => {
    setTips((prev) => prev.filter((t) => t.id !== id));
    showToast('Astuce supprimée');
  };

  const likeTip = (id: string) => {
    setTips((prev) => {
      const updated = prev.map((t) => {
        if (t.id === id) {
          const item = { ...t, likes: t.likes + 1 };
          upsertTipInSupabase(item).catch(console.warn);
          return item;
        }
        return t;
      });
      return updated;
    });
  };

  // Seed / Push all local products to Supabase
  const seedSupabase = async () => {
    if (products.length === 0) {
      showToast('Aucun produit dans le tableau à envoyer. Utilisez "Envoyer 543 articles initiaux" ou importez un CSV.');
      return;
    }

    setSyncStatus('syncing');
    setSyncProgress({ processed: 0, total: products.length });
    showToast(`Envoi de ${products.length} produits vers Supabase...`);

    try {
      const res = await seedProductsToSupabase(products, (processed, total) => {
        setSyncProgress({ processed, total });
      });

      if (res.success) {
        const nowStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        const syncNote = `À jour (${res.count} produits envoyés à ${nowStr})`;
        setLastSyncTimestamp(syncNote);
        localStorage.setItem(STORAGE_KEY_LAST_SYNC, syncNote);
        setSyncStatus('synced');
        setDataUpdateStatus('up-to-date');
        setSyncProgress(null);
        await checkSupabaseStatus();
        showToast(`Succès : ${res.count} produits enregistrés sur Supabase !`);
      } else {
        setSyncStatus('error');
        setSyncProgress(null);
        showToast(`Erreur d'envoi : ${res.error}`);
      }
    } catch (err: any) {
      setSyncStatus('error');
      setSyncProgress(null);
      showToast(`Erreur : ${err.message}`);
    }
  };

  // Seed / Push all tips to Supabase
  const seedTips = async () => {
    setSyncStatus('syncing');
    showToast(`Envoi de ${tips.length} tutoriels vers Supabase...`);
    try {
      const res = await seedTipsToSupabase(tips);
      if (res.success) {
        setSyncStatus('synced');
        showToast(`Succès : ${res.count} tutoriels enregistrés sur Supabase !`);
      } else {
        setSyncStatus('error');
        showToast(`Erreur d'envoi des tutoriels : ${res.error}`);
      }
    } catch (err: any) {
      setSyncStatus('error');
      showToast(`Erreur : ${err.message}`);
    }
  };

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        products,
        activeTab,
        setActiveTab,
        selectedDepartment,
        setSelectedDepartment,
        selectedProduct,
        setSelectedProduct,
        searchQuery,
        setSearchQuery,
        toastMessage,
        showToast,

        // Data status & update control (Green "À jour" vs Blue "Mise à jour")
        dataUpdateStatus,
        hasPendingUpdate,
        pendingProducts,
        pendingUpdateMessage,
        checkForUpdates,
        applyUpdate,
        dismissPendingUpdate,

        toggleProductStatus,
        updateProduct,
        addProduct,
        deleteProduct,
        resetCatalogue,
        clearAllProducts,
        seedInitialCatalogueToSupabase,
        syncWithSupabase,
        syncWithFirebase: syncWithSupabase,
        seedSupabase,
        seedTips,
        supabaseHealth,
        checkSupabaseStatus,
        syncStatus,
        isSyncing,
        syncProgress,
        lastSyncTimestamp,
        importProductsCsv,
        exportCatalogueCsv,
        tips,
        addTip,
        updateTip,
        deleteTip,
        likeTip,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
