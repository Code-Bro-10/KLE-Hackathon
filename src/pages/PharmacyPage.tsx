import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Store, Search, Phone, MapPin, Activity, CheckCircle2, 
  Compass, ShieldAlert, Clock, Plus, Trash2, Edit, X, 
  ExternalLink, MessageSquare, AlertCircle, ShoppingBag
} from 'lucide-react';
import NavigationBar from '@/components/Navigation';
import { supabase } from '@/lib/supabase';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Haversine formula to compute distance between coordinates in Kilometers
function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Custom Leaflet Icons
const userIcon = L.divIcon({
  className: 'custom-user-marker',
  html: `
    <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; width: 24px; height: 24px; background: rgba(10, 132, 255, 0.4); border-radius: 50%; animation: ringPulse 2s ease-out infinite;"></div>
      <div style="position: absolute; width: 12px; height: 12px; background: #0A84FF; border: 2px solid white; border-radius: 50%;"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const storeIcon = L.divIcon({
  className: 'custom-store-marker',
  html: `
    <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; width: 12px; height: 4px; border-radius: 50%; bottom: 0; left: 10px; background: rgba(0,0,0,0.2); transform: scaleX(1.5);"></div>
      <div style="color: #30D158; position: absolute; top: 0; cursor: pointer;">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="28" height="28" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// Mock Fallback Data (used if Supabase query fails or tables are missing)
const MOCK_STORES = [
  { id: 'store-1', name: 'Belgaum Drug House', phone: '+919876543210', latitude: 15.8520, longitude: 74.5030, address: 'Maratha Mandir Road, Belgaum, Karnataka' },
  { id: 'store-2', name: 'KLES Pharmacy', phone: '+919988776655', latitude: 15.8610, longitude: 74.5090, address: 'Nehru Nagar, Belgaum, Karnataka' },
  { id: 'store-3', name: 'Goaves Wellness Pharmacy', phone: '+919448112233', latitude: 15.8420, longitude: 74.4980, address: 'Goaves Circle, Belgaum, Karnataka' },
];

const MOCK_MEDICINES = [
  { id: 'med-1', store_id: 'store-1', medicine_name: 'Paracetamol 650', price: 15.0, stock: 50, is_available: true },
  { id: 'med-2', store_id: 'store-1', medicine_name: 'Sterile Gauze', price: 25.0, stock: 100, is_available: true },
  { id: 'med-3', store_id: 'store-1', medicine_name: 'Antiseptic Solution', price: 75.0, stock: 30, is_available: true },
  { id: 'med-4', store_id: 'store-1', medicine_name: 'Adhesive Bandages', price: 5.0, stock: 200, is_available: true },
  { id: 'med-5', store_id: 'store-1', medicine_name: 'Pain Relief Spray', price: 110.0, stock: 0, is_available: false },

  { id: 'med-6', store_id: 'store-2', medicine_name: 'Paracetamol 650', price: 16.5, stock: 80, is_available: true },
  { id: 'med-7', store_id: 'store-2', medicine_name: 'Sterile Gauze', price: 30.0, stock: 150, is_available: true },
  { id: 'med-8', store_id: 'store-2', medicine_name: 'Antiseptic Solution', price: 85.0, stock: 50, is_available: true },
  { id: 'med-9', store_id: 'store-2', medicine_name: 'Adhesive Bandages', price: 4.5, stock: 400, is_available: true },
  { id: 'med-10', store_id: 'store-2', medicine_name: 'Burn Ointment', price: 60.0, stock: 25, is_available: true },

  { id: 'med-11', store_id: 'store-3', medicine_name: 'Paracetamol 650', price: 14.0, stock: 20, is_available: true },
  { id: 'med-12', store_id: 'store-3', medicine_name: 'Sterile Gauze', price: 28.0, stock: 60, is_available: true },
  { id: 'med-13', store_id: 'store-3', medicine_name: 'Antiseptic Solution', price: 80.0, stock: 15, is_available: true },
  { id: 'med-14', store_id: 'store-3', medicine_name: 'Adhesive Bandages', price: 6.0, stock: 100, is_available: true },
  { id: 'med-15', store_id: 'store-3', medicine_name: 'Pain Relief Spray', price: 125.0, stock: 12, is_available: true },
];

export default function PharmacyPage() {
  const [activeTab, setActiveTab] = useState<'search' | 'dashboard'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Database vs Local fallback states
  const [stores, setStores] = useState<any[]>(MOCK_STORES);
  const [medicines, setMedicines] = useState<any[]>(MOCK_MEDICINES);
  const [usingFallback, setUsingFallback] = useState(false);

  // User location baseline: Belgaum center
  const defaultUserLocation = { lat: 15.8497, lng: 74.4977 };
  const [userLocation] = useState(defaultUserLocation);

  // Dashboard Owner Management States
  const [selectedStoreId, setSelectedStoreId] = useState('store-1');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMedName, setNewMedName] = useState('');
  const [newMedPrice, setNewMedPrice] = useState('');
  const [newMedStock, setNewMedStock] = useState('');
  const [newMedAvailable, setNewMedAvailable] = useState(true);
  const [editingMedId, setEditingMedId] = useState<string | null>(null);

  // Reservation Modal popup state
  const [reservedMed, setReservedMed] = useState<{ medName: string; storeName: string } | null>(null);

  // Map references
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Initial URL query parameter check (for triage page integrations)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) {
      setSearchQuery(q);
    }
  }, []);

  // Load stores and medicines data
  const loadData = async () => {
    let currentStores = MOCK_STORES;
    let currentMeds = MOCK_MEDICINES;
    let isDbOnline = false;

    try {
      const { data: dbStores, error: storesErr } = await supabase.from('medical_stores').select('*');
      const { data: dbMeds, error: medsErr } = await supabase.from('medicines').select('*');

      if (!storesErr && !medsErr && dbStores && dbMeds && dbStores.length > 0) {
        currentStores = dbStores;
        currentMeds = dbMeds;
        isDbOnline = true;
      }
    } catch (err) {
      console.warn('Supabase offline or table missing, using fallbacks:', err);
    }

    // Merge registered stores from localStorage
    const localStores = localStorage.getItem('resq-registered-stores');
    if (localStores) {
      const parsedStores = JSON.parse(localStores);
      currentStores = [...currentStores, ...parsedStores];
    }

    // Merge registered medicines from localStorage
    const localMeds = localStorage.getItem('resq-registered-medicines');
    if (localMeds) {
      const parsedMeds = JSON.parse(localMeds);
      currentMeds = [...currentMeds, ...parsedMeds];
    }

    setStores(currentStores);
    setMedicines(currentMeds);
    setUsingFallback(!isDbOnline);

    // Auto-select active logged in store if applicable
    const activeStoreId = localStorage.getItem('resq-active-store-id');
    if (activeStoreId && currentStores.find(s => s.id === activeStoreId)) {
      setSelectedStoreId(activeStoreId);
    } else if (currentStores.length > 0) {
      setSelectedStoreId(currentStores[0].id);
    }
  };

  useEffect(() => {
    loadData();

    // Subscribe to medicines changes in real-time
    const channel = supabase
      .channel('medicines-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'medicines' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filter and compute pharmacy search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const matches = medicines.filter((m) =>
      m.medicine_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return matches.map((m) => {
      const store = stores.find((s) => s.id === m.store_id);
      const distance = store
        ? getHaversineDistance(userLocation.lat, userLocation.lng, store.latitude, store.longitude)
        : 99.9;

      return {
        ...m,
        storeName: store ? store.name : 'Unknown Store',
        phone: store ? store.phone : '',
        address: store ? store.address : '',
        lat: store ? store.latitude : 0,
        lng: store ? store.longitude : 0,
        calculatedDistance: parseFloat(distance.toFixed(1)),
      };
    }).sort((a, b) => a.calculatedDistance - b.calculatedDistance);
  }, [searchQuery, medicines, stores, userLocation]);

  // Leaflet Map Initialization
  useEffect(() => {
    if (activeTab !== 'search' || !mapRef.current) return;

    // Destroy existing instance
    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }

    mapInstance.current = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([userLocation.lat, userLocation.lng], 13);

    // Apply CartoDB light map tiles layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(mapInstance.current);

    // Zoom controls bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(mapInstance.current);

    // User Location Marker
    L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
      .addTo(mapInstance.current)
      .bindPopup('<b>Your Location</b>', { closeButton: false });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [activeTab]);

  // Update map markers when search results change
  useEffect(() => {
    if (activeTab !== 'search' || !mapInstance.current) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Pin stores matching the searched medicine
    const pinnedStoreIds = new Set<string>();

    searchResults.forEach((item) => {
      if (pinnedStoreIds.has(item.store_id)) return;
      pinnedStoreIds.add(item.store_id);

      if (item.lat && item.lng && mapInstance.current) {
        const marker = L.marker([item.lat, item.lng], { icon: storeIcon })
          .addTo(mapInstance.current)
          .bindPopup(
            `<b>${item.storeName}</b><br/>${item.medicine_name}: ₹${item.price}<br/>${
              item.stock > 0 ? '🟢 In Stock' : '🔴 Out of Stock'
            }`,
            { closeButton: false }
          );
        markersRef.current.push(marker);
      }
    });

    // If search results exist, fit map bounds to show results
    if (searchResults.length > 0 && mapInstance.current) {
      const coords = searchResults.map((r) => [r.lat, r.lng] as [number, number]);
      coords.push([userLocation.lat, userLocation.lng]);
      const bounds = L.latLngBounds(coords);
      mapInstance.current.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [searchResults, activeTab]);

  // Dashboard Owner Management CRUD triggers
  const dashboardMedicines = useMemo(() => {
    return medicines.filter((m) => m.store_id === selectedStoreId);
  }, [medicines, selectedStoreId]);

  const handleAddMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName.trim() || !newMedPrice || !newMedStock) return;

    const priceNum = parseFloat(newMedPrice);
    const stockInt = parseInt(newMedStock);

    if (usingFallback) {
      // Mock Fallback creation
      const mockId = `mock-med-${Date.now()}`;
      const newMockItem = {
        id: mockId,
        store_id: selectedStoreId,
        medicine_name: newMedName.trim(),
        price: priceNum,
        stock: stockInt,
        is_available: newMedAvailable,
      };
      setMedicines((prev) => [...prev, newMockItem]);
    } else {
      // Supabase database insert
      try {
        await supabase.from('medicines').insert({
          store_id: selectedStoreId,
          medicine_name: newMedName.trim(),
          price: priceNum,
          stock: stockInt,
          is_available: newMedAvailable,
        });
        loadData();
      } catch (err) {
        console.error(err);
      }
    }

    // Reset Form
    setNewMedName('');
    setNewMedPrice('');
    setNewMedStock('');
    setNewMedAvailable(true);
    setShowAddForm(false);
  };

  const handleUpdateStock = async (id: string, newStock: number) => {
    const isAvail = newStock > 0;
    if (usingFallback) {
      setMedicines((prev) =>
        prev.map((m) => (m.id === id ? { ...m, stock: newStock, is_available: isAvail } : m))
      );
    } else {
      try {
        await supabase.from('medicines').update({ stock: newStock, is_available: isAvail }).eq('id', id);
        loadData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleUpdatePrice = async (id: string, newPrice: number) => {
    if (usingFallback) {
      setMedicines((prev) =>
        prev.map((m) => (m.id === id ? { ...m, price: newPrice } : m))
      );
    } else {
      try {
        await supabase.from('medicines').update({ price: newPrice }).eq('id', id);
        loadData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDeleteMedicine = async (id: string) => {
    if (usingFallback) {
      setMedicines((prev) => prev.filter((m) => m.id !== id));
    } else {
      try {
        await supabase.from('medicines').delete().eq('id', id);
        loadData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <NavigationBar />

      <div className="container-main max-w-5xl">
        {/* Header Title Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-medical-soft text-medical mb-4">
            <Store className="w-4 h-4" />
            <span className="text-sm font-semibold">ResQ Inventory Discovery</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary tracking-tight mb-3">
            Nearby Medical Stores
          </h1>
          <p className="text-text-secondary max-w-xl mx-auto text-sm md:text-base">
            Locate critical medicines and first-aid supplies in nearby pharmacies in real-time. Update store stock levels dynamically.
          </p>

          {/* Navigation/Toggles Tabs */}
          {localStorage.getItem('resq-active-user-role') !== 'user' && (
            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={() => setActiveTab('search')}
                className={`px-5 py-2.5 rounded-full font-semibold text-sm transition-all shadow-sm ${
                  activeTab === 'search'
                    ? 'bg-medical text-white'
                    : 'bg-surface border border-border/60 text-text-secondary hover:bg-surface-blue'
                }`}
              >
                Search Medicines
              </button>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-5 py-2.5 rounded-full font-semibold text-sm transition-all shadow-sm ${
                  activeTab === 'dashboard'
                    ? 'bg-medical text-white'
                    : 'bg-surface border border-border/60 text-text-secondary hover:bg-surface-blue'
                }`}
              >
                Store Owner Dashboard
              </button>
            </div>
          )}
        </div>

        {/* Tab 1: SEARCH & DISCOVERY */}
        {activeTab === 'search' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Search & Pharmacy List */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              
              {/* Search Panel Card */}
              <div className="card p-6">
                <h3 className="text-lg font-bold text-text-primary mb-2 flex items-center gap-2">
                  <Search className="w-5 h-5 text-medical" /> Find Supplies
                </h3>
                <p className="text-xs text-text-secondary mb-4">
                  Search for a medicine (e.g. "Paracetamol 650" or "Gauze") to check local pharmacy stock.
                </p>
                <div className="relative">
                  <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search medicines..."
                    className="input-field pl-10"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Quick search shortcuts */}
                <div className="mt-4">
                  <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block mb-2">
                    Quick Search
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {['Paracetamol 650', 'Sterile Gauze', 'Antiseptic Solution', 'Adhesive Bandages'].map((m) => (
                      <button
                        key={m}
                        onClick={() => setSearchQuery(m)}
                        className="px-3 py-1 rounded-full bg-surface border border-border/60 hover:bg-surface-blue text-xs text-text-secondary transition-all"
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Stores Results List */}
              <div className="flex-1 flex flex-col gap-3">
                <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider px-2">
                  Matching Pharmacies ({searchResults.length})
                </h4>

                {searchQuery.trim() === '' ? (
                  <div className="card p-8 text-center text-text-secondary flex flex-col items-center justify-center">
                    <ShoppingBag className="w-10 h-10 text-text-muted mb-3" />
                    <p className="text-sm font-semibold">Enter a medicine name</p>
                    <p className="text-xs text-text-muted mt-1">Start searching above to check stock levels near you.</p>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="card p-8 text-center text-text-secondary flex flex-col items-center justify-center border border-dashed border-border">
                    <AlertCircle className="w-10 h-10 text-urgent mb-3" />
                    <p className="text-sm font-semibold">Medicine Not Found</p>
                    <p className="text-xs text-text-muted mt-1">No participating pharmacies have "{searchQuery}" listed.</p>
                  </div>
                ) : (
                  <div className="space-y-3 overflow-y-auto max-h-[500px] scrollbar-hide pr-1">
                    {searchResults.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card p-5 border border-border/60 flex flex-col justify-between hover:shadow-sm transition-shadow"
                      >
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h5 className="font-bold text-text-primary text-base leading-snug">{item.storeName}</h5>
                              <p className="text-xs text-text-secondary flex items-center gap-1 mt-1">
                                <MapPin className="w-3.5 h-3.5 text-text-secondary" /> {item.calculatedDistance} km away
                              </p>
                            </div>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              item.stock > 0 && item.is_available
                                ? 'bg-green-50 text-stable'
                                : 'bg-red-50 text-emergency'
                            }`}>
                              {item.stock > 0 && item.is_available ? `In Stock (${item.stock})` : 'Out of Stock'}
                            </span>
                          </div>

                          <div className="flex justify-between items-center bg-surface px-3 py-2 rounded-xl border border-border/40 mt-3 mb-4">
                            <span className="text-xs text-text-secondary">Unit Price:</span>
                            <span className="text-base font-bold text-medical font-mono">₹{item.price}</span>
                          </div>
                        </div>

                        {/* Communication / Action Buttons */}
                        <div className="flex flex-wrap gap-2">
                          <a
                            href={`tel:${item.phone}`}
                            className="flex-1 min-w-[70px] btn-secondary !h-9 text-xs flex items-center justify-center gap-1.5"
                            title="Call Store"
                          >
                            <Phone className="w-3.5 h-3.5" /> Call
                          </a>
                          <a
                            href={`https://wa.me/${item.phone.replace(/[^0-9]/g, '')}?text=Hi%2C%20do%20you%20have%20${encodeURIComponent(item.medicine_name)}%20available%20in%20stock%20at%20${encodeURIComponent(item.storeName)}%3F`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 min-w-[70px] btn-secondary !h-9 text-xs flex items-center justify-center gap-1.5 border-emerald-500/20 text-emerald-600 dark:text-emerald-500 hover:bg-emerald-50/40"
                            title="Chat on WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-500" /> WhatsApp
                          </a>
                          <button
                            disabled={item.stock === 0 || !item.is_available}
                            onClick={() => setReservedMed({ medName: item.medicine_name, storeName: item.storeName })}
                            className="w-full btn-primary !h-9 text-xs flex items-center justify-center gap-1.5 disabled:opacity-40"
                          >
                            Request Medicine
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Right Column: Leaflet Map */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              {/* Map Panel Wrapper */}
              <div className="rounded-2xl h-[450px] lg:h-[650px] relative border border-border shadow-sm overflow-hidden z-0 bg-background">
                <div ref={mapRef} className="w-full h-full" />
                <div className="absolute top-4 left-4 z-[1000] flex gap-2">
                  <div className="card-float px-4 py-2 text-xs font-semibold text-text-primary flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-stable live-dot" />
                    Belgaum Area Triage Map
                  </div>
                  {usingFallback && (
                    <div className="card-float px-3 py-2 text-xs font-semibold text-urgent border border-amber-500/10 flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" /> Mock Mode Active
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: MEDICAL STORE OWNER DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="card p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border/50 pb-6 mb-6">
              <div>
                <h3 className="text-xl font-bold text-text-primary">
                  Store Owner Inventory Console
                </h3>
                <p className="text-xs text-text-secondary mt-1">
                  Select your pharmacy, manage inventory item listings, adjust pricing models, and publish stock updates in real-time.
                </p>
                {usingFallback && (
                  <span className="mt-2 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-50 text-urgent border border-amber-200/50 text-[10px] font-bold uppercase tracking-wider">
                    <ShieldAlert className="w-3 h-3" /> Database Offline: Edits Local Only
                  </span>
                )}
              </div>

              {/* Selector store to manage */}
              <div className="flex items-center gap-2 bg-surface px-4 py-2 rounded-xl border border-border">
                <Store className="w-4 h-4 text-text-secondary" />
                <select
                  value={selectedStoreId}
                  onChange={(e) => {
                    setSelectedStoreId(e.target.value);
                    setShowAddForm(false);
                    setEditingMedId(null);
                  }}
                  className="bg-transparent text-text-primary font-bold text-sm focus:outline-none cursor-pointer"
                >
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dashboard Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Form Side - Add / Edit Medicine */}
              <div className="lg:col-span-1">
                <div className="p-5 rounded-2xl bg-surface border border-border">
                  <h4 className="font-bold text-text-primary text-base mb-4 flex items-center justify-between">
                    <span>Manage Inventory</span>
                    {!showAddForm && (
                      <button
                        onClick={() => {
                          setShowAddForm(true);
                          setEditingMedId(null);
                        }}
                        className="p-1.5 rounded-lg bg-medical-soft text-medical hover:bg-medical hover:text-white transition-all"
                        title="Add Medicine"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                  </h4>

                  {showAddForm ? (
                    <form onSubmit={handleAddMedicine} className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Medicine Name</label>
                        <input
                          type="text"
                          required
                          value={newMedName}
                          onChange={(e) => setNewMedName(e.target.value)}
                          placeholder="e.g. Paracetamol 650"
                          className="input-field"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Price (₹)</label>
                          <input
                            type="number"
                            required
                            min="0"
                            step="0.5"
                            value={newMedPrice}
                            onChange={(e) => setNewMedPrice(e.target.value)}
                            placeholder="Price"
                            className="input-field"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Stock Count</label>
                          <input
                            type="number"
                            required
                            min="0"
                            value={newMedStock}
                            onChange={(e) => setNewMedStock(e.target.value)}
                            placeholder="Stock"
                            className="input-field"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 py-2">
                        <input
                          type="checkbox"
                          id="new-available"
                          checked={newMedAvailable}
                          onChange={(e) => setNewMedAvailable(e.target.checked)}
                          className="w-4 h-4 text-medical border-border rounded focus:ring-medical"
                        />
                        <label htmlFor="new-available" className="text-xs text-text-primary font-semibold select-none">
                          Mark item as available for search
                        </label>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowAddForm(false)}
                          className="flex-1 btn-secondary"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 btn-primary"
                        >
                          Save Item
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="text-center py-6 text-text-secondary text-sm">
                      <ShoppingBag className="w-12 h-12 text-text-muted mx-auto mb-3" />
                      <p>Select a pharmacy, click <span className="font-semibold text-medical inline-flex items-center gap-0.5"><Plus className="w-3.5 h-3.5"/> Add</span>, or edit stock counts in the list directly.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Table Side - List of medicines in inventory */}
              <div className="lg:col-span-2">
                <div className="rounded-2xl border border-border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-surface border-b border-border text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                          <th className="py-4 px-6">Medicine Name</th>
                          <th className="py-4 px-6 text-center">Unit Price</th>
                          <th className="py-4 px-6 text-center">Stock Level</th>
                          <th className="py-4 px-6 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboardMedicines.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-12 text-center text-text-secondary text-sm">
                              No items in inventory. Add supplies on the left panel.
                            </td>
                          </tr>
                        ) : (
                          dashboardMedicines.map((m) => (
                            <tr key={m.id} className="border-b border-border/50 hover:bg-surface-blue/10 transition-colors">
                              <td className="py-4 px-6">
                                <div className="font-bold text-text-primary text-sm">{m.medicine_name}</div>
                                <div className="text-[10px] text-text-muted mt-0.5">
                                  {m.stock > 0 && m.is_available ? '🟢 Active listing' : '🔴 Out of stock warning'}
                                </div>
                              </td>
                              <td className="py-4 px-6 text-center">
                                {editingMedId === m.id ? (
                                  <input
                                    type="number"
                                    defaultValue={m.price}
                                    step="0.5"
                                    onBlur={(e) => {
                                      handleUpdatePrice(m.id, parseFloat(e.target.value) || m.price);
                                      setEditingMedId(null);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleUpdatePrice(m.id, parseFloat((e.target as HTMLInputElement).value) || m.price);
                                        setEditingMedId(null);
                                      }
                                    }}
                                    className="w-16 h-8 text-center text-xs font-mono border border-border bg-background rounded-lg text-text-primary focus:outline-none focus:border-medical"
                                    autoFocus
                                  />
                                ) : (
                                  <button
                                    onClick={() => setEditingMedId(m.id)}
                                    className="font-mono text-sm font-bold text-text-primary hover:text-medical transition-colors"
                                    title="Click to Edit Price"
                                  >
                                    ₹{m.price}
                                  </button>
                                )}
                              </td>
                              <td className="py-4 px-6 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => handleUpdateStock(m.id, Math.max(0, m.stock - 1))}
                                    className="w-7 h-7 rounded-lg bg-surface border border-border hover:bg-surface-blue flex items-center justify-center text-text-secondary font-bold text-sm"
                                  >
                                    -
                                  </button>
                                  <span className="w-10 font-bold font-mono text-text-primary text-sm">
                                    {m.stock}
                                  </span>
                                  <button
                                    onClick={() => handleUpdateStock(m.id, m.stock + 1)}
                                    className="w-7 h-7 rounded-lg bg-surface border border-border hover:bg-surface-blue flex items-center justify-center text-text-secondary font-bold text-sm"
                                  >
                                    +
                                  </button>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => setEditingMedId(m.id)}
                                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-text-secondary transition-all"
                                    title="Edit Price"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteMedicine(m.id)}
                                    className="p-1.5 rounded-lg bg-red-50 hover:bg-emergency-soft text-emergency transition-all"
                                    title="Delete Item"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Reservation Confirmation Modal Overlay */}
      <AnimatePresence>
        {reservedMed && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card bg-background max-w-sm w-full p-8 border border-border text-center shadow-card relative overflow-hidden"
            >
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-9 h-9 text-stable" />
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-2">Medicine Reserved!</h3>
              <p className="text-text-secondary text-sm leading-relaxed mb-6">
                We have requested <b>{reservedMed.medName}</b> from <b>{reservedMed.storeName}</b>. Show this confirmation screen at the counter to retrieve your items.
              </p>
              <button
                onClick={() => setReservedMed(null)}
                className="w-full btn-primary h-12 rounded-full font-bold"
              >
                Dismiss
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
