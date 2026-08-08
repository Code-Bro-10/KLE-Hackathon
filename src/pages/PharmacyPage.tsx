import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Store, Search, Activity, CheckCircle2, 
  ShieldAlert, ShoppingCart, Plus, Minus, Trash2, X, 
  Printer, ClipboardList, Package, ArrowRight, HeartPulse
} from 'lucide-react';
import NavigationBar from '@/components/Navigation';
import { supabase } from '@/lib/supabase';

interface CartItem {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  stock: number;
}

const CATEGORIES = ['All', 'Pain Relief', 'Cold & Allergy', 'First Aid', 'Digestive Care', 'Other'];

export default function PharmacyPage() {
  const navigate = useNavigate();
  const userEmail = localStorage.getItem('resq-active-user-email') || '';

  // Tab State
  const [activeTab, setActiveTab] = useState<'marketplace' | 'my-orders'>('marketplace');

  // Search & Categories state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Database vs Local fallback states
  const [medicines, setMedicines] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [usingFallback, setUsingFallback] = useState(false);
  const [loading, setLoading] = useState(true);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);

  // Checkout modal
  const [showCheckout, setShowCheckout] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Bill display modal/view
  const [activeBillOrder, setActiveBillOrder] = useState<any | null>(null);

  // Selected quantities on cards
  const [cardQuantities, setCardQuantities] = useState<Record<string, number>>({});

  // Real-time listener reference
  useEffect(() => {
    loadData();

    // Setup Supabase real-time updates for medicines and orders
    const medicinesChannel = supabase
      .channel('pharmacy-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'medicines' }, () => {
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(medicinesChannel);
    };
  }, []);

  // Sync cart from local storage on load
  useEffect(() => {
    const savedCart = localStorage.getItem('resq-pharmacy-cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (err) {
        console.error('Failed to parse cart:', err);
      }
    }
  }, []);

  const saveCart = (updatedCart: CartItem[]) => {
    setCart(updatedCart);
    localStorage.setItem('resq-pharmacy-cart', JSON.stringify(updatedCart));
  };

  const loadData = async () => {
    setLoading(true);
    let currentMeds: any[] = [];
    let currentOrders: any[] = [];
    let isDbOnline = false;

    try {
      const { data: dbMeds, error: medsErr } = await supabase
        .from('medicines')
        .select('*')
        .order('medicine_name', { ascending: true });
      if (medsErr) throw medsErr;

      const { data: dbOrders, error: ordersErr } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('user_email', userEmail.trim().toLowerCase())
        .order('created_at', { ascending: false });
      if (ordersErr) throw ordersErr;

      if (dbMeds) {
        currentMeds = dbMeds;
        isDbOnline = true;
      }
      if (dbOrders) {
        currentOrders = dbOrders;
      }
    } catch (err) {
      console.warn('Database query failed, using mock data:', err);
    }

    // Merge registered medicines from localStorage
    const localMeds = localStorage.getItem('resq-registered-medicines');
    if (localMeds) {
      const parsedMeds = JSON.parse(localMeds);
      currentMeds = [...currentMeds, ...parsedMeds];
    } else if (!isDbOnline || currentMeds.length === 0) {
      // Fallback Seed mock medicines
      const defaultMeds = [
        { id: 'm-1', medicine_name: 'Paracetamol 650mg', category: 'Pain Relief', description: 'Relieves mild to moderate pain and reduces fever.', price: 15.00, stock: 50, is_available: true, image_url: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=200' },
        { id: 'm-2', medicine_name: 'Cetirizine 10mg', category: 'Cold & Allergy', description: 'Provides relief from runny nose, sneezing, and hives.', price: 20.00, stock: 30, is_available: true, image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=200' },
        { id: 'm-3', medicine_name: 'ORS Oral Rehydration Salts', category: 'Digestive Care', description: 'Restores essential body fluids and electrolytes.', price: 25.00, stock: 5, is_available: true, image_url: 'https://images.unsplash.com/photo-1607619056574-7b8f304b3c93?auto=format&fit=crop&q=80&w=200' },
        { id: 'm-4', medicine_name: 'Antiseptic Dettol', category: 'First Aid', description: 'Protects against infection from cuts, scratches, and insect bites.', price: 80.00, stock: 15, is_available: true, image_url: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?auto=format&fit=crop&q=80&w=200' },
        { id: 'm-5', medicine_name: 'Pain Relief Gel', category: 'Pain Relief', description: 'Fast-acting topical gel for muscle ache and joint stiffness.', price: 120.00, stock: 0, is_available: false, image_url: 'https://images.unsplash.com/photo-1550572017-edd951b55104?auto=format&fit=crop&q=80&w=200' }
      ];
      currentMeds = defaultMeds;
      localStorage.setItem('resq-registered-medicines', JSON.stringify(defaultMeds));
    }

    // Merge registered orders from localStorage
    const localOrders = localStorage.getItem('resq-medicine-orders');
    if (localOrders) {
      const parsedOrders = JSON.parse(localOrders);
      currentOrders = [...parsedOrders, ...currentOrders];
    }

    setMedicines(currentMeds);
    setOrders(currentOrders);
    setUsingFallback(!isDbOnline);
    setLoading(false);
  };

  // Filter medicines
  const filteredMedicines = useMemo(() => {
    return medicines.filter((m) => {
      const matchesSearch = m.medicine_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (m.description && m.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'All' || m.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [medicines, searchQuery, selectedCategory]);

  // Cart operations
  const getCardQty = (medId: string) => cardQuantities[medId] || 1;
  const setCardQty = (medId: string, val: number) => {
    setCardQuantities(prev => ({ ...prev, [medId]: val }));
  };

  const handleAddToCart = (med: any) => {
    const qty = getCardQty(med.id);
    if (med.stock === 0) return;

    if (qty > med.stock) {
      alert(`Only ${med.stock} units are available.`);
      return;
    }

    const existing = cart.find(c => c.id === med.id);
    let newCart: CartItem[] = [];

    if (existing) {
      const newQty = existing.quantity + qty;
      if (newQty > med.stock) {
        alert(`Cannot add more. Only ${med.stock} units are available in total.`);
        return;
      }
      newCart = cart.map(c => c.id === med.id ? { ...c, quantity: newQty } : c);
    } else {
      newCart = [...cart, {
        id: med.id,
        name: med.medicine_name,
        category: med.category,
        price: med.price,
        quantity: qty,
        stock: med.stock
      }];
    }

    saveCart(newCart);
    // Reset quantity select
    setCardQty(med.id, 1);
    alert(`${med.medicine_name} added to cart!`);
  };

  const handleUpdateCartQty = (id: string, delta: number) => {
    const item = cart.find(c => c.id === id);
    if (!item) return;

    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      handleRemoveFromCart(id);
      return;
    }

    if (newQty > item.stock) {
      alert(`Only ${item.stock} units are available.`);
      return;
    }

    const newCart = cart.map(c => c.id === id ? { ...c, quantity: newQty } : c);
    saveCart(newCart);
  };

  const handleRemoveFromCart = (id: string) => {
    const newCart = cart.filter(c => c.id !== id);
    saveCart(newCart);
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = cartSubtotal > 0 ? 10 : 0;
  const cartTotal = cartSubtotal + deliveryFee;

  // Checkout process with database validations
  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    setIsPlacingOrder(true);

    try {
      const dbMedsToDecrement: { id: string; newStock: number }[] = [];
      const validatedItems: any[] = [];

      // Validate session role/auth
      const currentEmail = userEmail || 'anonymous@resq.com';

      // 1. Verify current stock in database
      if (!usingFallback) {
        for (const cartItem of cart) {
          const { data: dbItem, error: fetchErr } = await supabase
            .from('medicines')
            .select('*')
            .eq('id', cartItem.id)
            .maybeSingle();

          if (fetchErr || !dbItem) {
            throw new Error(`Medicine "${cartItem.name}" is no longer available in the marketplace.`);
          }

          if (dbItem.stock < cartItem.quantity) {
            throw new Error(`Only ${dbItem.stock} units of "${cartItem.name}" are available.`);
          }

          dbMedsToDecrement.push({
            id: cartItem.id,
            newStock: dbItem.stock - cartItem.quantity
          });

          validatedItems.push({
            medicine_id: cartItem.id,
            name: dbItem.medicine_name,
            quantity: cartItem.quantity,
            price: dbItem.price
          });
        }

        // 2. Perform atomic stock decreases in Supabase
        for (const dec of dbMedsToDecrement) {
          const { error: updErr } = await supabase
            .from('medicines')
            .update({ stock: dec.newStock })
            .eq('id', dec.id);

          if (updErr) {
            throw new Error(`Failed to update stock for medicine ID ${dec.id}.`);
          }
        }

        // 3. Create order entry in database
        const orderNum = 'RESQ-' + Math.floor(1000 + Math.random() * 9000);
        const { data: newOrder, error: oErr } = await supabase
          .from('orders')
          .insert({
            order_number: orderNum,
            user_email: currentEmail.trim().toLowerCase(),
            status: 'Placed',
            subtotal: cartSubtotal,
            delivery_charge: deliveryFee,
            gst: 0,
            total: cartTotal
          })
          .select()
          .single();

        if (oErr || !newOrder) throw oErr || new Error('Failed to create order.');

        // 4. Create order items entries in database
        for (const item of validatedItems) {
          const { error: itemErr } = await supabase
            .from('order_items')
            .insert({
              order_id: newOrder.id,
              medicine_id: item.medicine_id,
              medicine_name: item.name,
              quantity: item.quantity,
              price: item.price,
              total_price: item.price * item.quantity
            });

          if (itemErr) console.warn('Failed to insert item log:', itemErr);
        }

        // Reload data from DB
        await loadData();
        const { data: orderDetails } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('id', newOrder.id)
          .single();

        setActiveBillOrder(orderDetails || newOrder);
      } else {
        // Fallback local registry flow
        const localMedsStr = localStorage.getItem('resq-registered-medicines') || '[]';
        const localMedsList = JSON.parse(localMedsStr);

        for (const cartItem of cart) {
          const dbItem = localMedsList.find((m: any) => m.id === cartItem.id);
          if (!dbItem) {
            throw new Error(`Medicine "${cartItem.name}" is no longer available.`);
          }
          if (dbItem.stock < cartItem.quantity) {
            throw new Error(`Only ${dbItem.stock} units of "${cartItem.name}" are available.`);
          }
          dbItem.stock -= cartItem.quantity;
          validatedItems.push({
            medicine_id: cartItem.id,
            name: dbItem.medicine_name,
            quantity: cartItem.quantity,
            price: dbItem.price
          });
        }

        // Save updated local inventory
        localStorage.setItem('resq-registered-medicines', JSON.stringify(localMedsList));

        // Create local order
        const orderNum = 'RESQ-' + Math.floor(1000 + Math.random() * 9000);
        const newLocalOrder = {
          id: 'o-' + Math.random().toString(36).substr(2, 9),
          order_number: orderNum,
          user_email: currentEmail.trim().toLowerCase(),
          status: 'Placed',
          subtotal: cartSubtotal,
          delivery_charge: deliveryFee,
          gst: 0,
          total: cartTotal,
          created_at: new Date().toISOString(),
          order_items: validatedItems.map(item => ({
            id: 'oi-' + Math.random().toString(36).substr(2, 9),
            medicine_name: item.name,
            quantity: item.quantity,
            price: item.price,
            total_price: item.price * item.quantity
          }))
        };

        const existingLocalOrders = localStorage.getItem('resq-medicine-orders');
        const ordersList = existingLocalOrders ? JSON.parse(existingLocalOrders) : [];
        ordersList.unshift(newLocalOrder);
        localStorage.setItem('resq-medicine-orders', JSON.stringify(ordersList));

        await loadData();
        setActiveBillOrder(newLocalOrder);
      }

      // Empty Cart
      saveCart([]);
      setShowCheckout(false);
    } catch (err: any) {
      alert(err.message || 'Failed to place order. Please review your stock settings.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const getStockBadge = (stock: number) => {
    if (stock > 10) return <span className="text-[10px] font-bold text-stable bg-green-50 px-2 py-0.5 rounded-full">🟢 In Stock</span>;
    if (stock > 0) return <span className="text-[10px] font-bold text-urgent bg-amber-50 px-2 py-0.5 rounded-full">🟠 Low Stock</span>;
    return <span className="text-[10px] font-bold text-emergency bg-red-50 px-2 py-0.5 rounded-full">🔴 Out of Stock</span>;
  };

  const getStatusLineClass = (orderStatus: string, step: string) => {
    const steps = ['Placed', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered'];
    const currentIdx = steps.indexOf(orderStatus);
    const stepIdx = steps.indexOf(step);

    if (stepIdx <= currentIdx) return 'bg-medical text-medical';
    return 'bg-border text-text-muted';
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-16 flex flex-col justify-between">
      <NavigationBar />

      <div className="container-main max-w-5xl w-full mx-auto px-4">
        {/* Banner Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-medical-soft text-medical mb-4">
            <Store className="w-4 h-4" />
            <span className="text-sm font-semibold">ResQ Pharmacy</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary tracking-tight mb-3">
            ResQ Pharmacy
          </h1>
          <p className="text-text-secondary max-w-xl mx-auto text-sm md:text-base font-normal">
            Check medicine availability and order medicines easily.
          </p>

          {/* Tab Selection */}
          <div className="flex justify-center gap-4 mt-6">
            <button
              onClick={() => setActiveTab('marketplace')}
              className={`px-5 py-2.5 rounded-full font-bold text-xs transition-all shadow-sm flex items-center gap-2 ${
                activeTab === 'marketplace'
                  ? 'bg-medical text-white'
                  : 'bg-surface border border-border/60 text-text-secondary hover:bg-surface-blue'
              }`}
            >
              <Store className="w-3.5 h-3.5" /> Medicine Marketplace
            </button>
            <button
              onClick={() => setActiveTab('my-orders')}
              className={`px-5 py-2.5 rounded-full font-bold text-xs transition-all shadow-sm flex items-center gap-2 ${
                activeTab === 'my-orders'
                  ? 'bg-medical text-white'
                  : 'bg-surface border border-border/60 text-text-secondary hover:bg-surface-blue'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" /> My Orders ({orders.length})
            </button>
          </div>
        </div>

        {/* Tab 1: Marketplace */}
        {activeTab === 'marketplace' && (
          <div className="space-y-6">
            {/* Filter and Cart triggers row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-4 rounded-2xl border border-border shadow-sm">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search medicines..."
                  className="input-field pl-10 text-xs"
                />
              </div>

              {/* Category tabs */}
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      selectedCategory === cat
                        ? 'bg-text-primary text-background'
                        : 'bg-background hover:bg-surface-blue border border-border/60 text-text-secondary'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* View Cart button */}
              <button
                onClick={() => setShowCart(true)}
                className="btn-primary h-10 px-4 flex items-center justify-center gap-2 text-xs font-bold shrink-0 shadow-md relative"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Cart</span>
                {cart.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emergency text-white flex items-center justify-center text-[9px] font-bold border-2 border-background">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                )}
              </button>
            </div>

            {/* Medicines Catalog Grid */}
            {loading ? (
              <div className="text-center py-12">
                <span className="w-8 h-8 border-2 border-medical/30 border-t-medical rounded-full animate-spin inline-block mb-3" />
                <p className="text-xs text-text-secondary">Loading medicine inventory...</p>
              </div>
            ) : filteredMedicines.length === 0 ? (
              <div className="text-center py-12 card border border-border">
                <ShieldAlert className="w-12 h-12 text-text-muted mx-auto mb-3" />
                <p className="text-sm font-bold text-text-primary">No medicines found</p>
                <p className="text-xs text-text-secondary mt-1">Try resetting filters or adjusting search queries.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {filteredMedicines.map((med) => {
                  const qty = getCardQty(med.id);
                  const inStock = med.stock > 0;
                  return (
                    <div 
                      key={med.id} 
                      className={`card p-4 border border-border/60 shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between ${
                        !inStock ? 'opacity-85' : ''
                      }`}
                    >
                      <div>
                        {/* Image */}
                        <div className="w-full h-36 rounded-xl bg-surface overflow-hidden mb-3 border border-border/30 relative">
                          <img 
                            src={med.image_url || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=200'} 
                            alt={med.medicine_name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 right-2">
                            {getStockBadge(med.stock)}
                          </div>
                        </div>

                        {/* Details */}
                        <span className="text-[9px] font-bold text-medical uppercase tracking-wider block mb-1">
                          {med.category}
                        </span>
                        <h3 className="font-bold text-text-primary text-base leading-tight mb-1">
                          {med.medicine_name}
                        </h3>
                        <p className="text-xs text-text-secondary line-clamp-2 mb-3">
                          {med.description || 'No description provided.'}
                        </p>
                      </div>

                      {/* Footer buying panel */}
                      <div className="pt-3 border-t border-border/50">
                        <div className="flex items-center justify-between mb-3.5">
                          <span className="text-base font-extrabold text-text-primary font-mono">
                            ₹{med.price}
                          </span>
                          <span className="text-[10px] text-text-secondary font-medium">
                            Stock: <span className="font-bold font-mono">{med.stock}</span>
                          </span>
                        </div>

                        {/* Buy actions */}
                        {inStock ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between bg-surface rounded-lg p-1 border border-border">
                              <button
                                onClick={() => setCardQty(med.id, Math.max(1, qty - 1))}
                                className="w-7 h-7 rounded-md bg-background hover:bg-surface-blue flex items-center justify-center text-text-secondary"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-xs font-mono font-bold text-text-primary">
                                {qty}
                              </span>
                              <button
                                onClick={() => setCardQty(med.id, Math.min(med.stock, qty + 1))}
                                className="w-7 h-7 rounded-md bg-background hover:bg-surface-blue flex items-center justify-center text-text-secondary"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <button
                              onClick={() => handleAddToCart(med)}
                              className="btn-primary w-full h-9 text-xs font-bold flex items-center justify-center gap-1 bg-medical hover:bg-medical-dark shadow-sm"
                            >
                              Add to Cart
                            </button>
                          </div>
                        ) : (
                          <button
                            disabled
                            className="w-full h-9 rounded-xl bg-border text-text-muted text-xs font-bold cursor-not-allowed"
                          >
                            Out of Stock
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: My Orders */}
        {activeTab === 'my-orders' && (
          <div className="space-y-6">
            {orders.length === 0 ? (
              <div className="text-center py-12 card border border-border">
                <Package className="w-12 h-12 text-text-muted mx-auto mb-3" />
                <p className="text-sm font-bold text-text-primary">No orders placed yet</p>
                <p className="text-xs text-text-secondary mt-1">Browse our pharmacy marketplace to place your first medicine request.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((o) => (
                  <div key={o.id} className="card p-6 border border-border/80 shadow-sm relative overflow-hidden bg-surface/30">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border/50 pb-4 mb-4 gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold font-mono text-text-primary">{o.order_number}</span>
                          <span className="text-[10px] text-text-secondary font-mono">
                            {new Date(o.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-[10px] text-text-secondary mt-0.5">
                          {o.order_items?.length || 0} medicines list
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-sm font-extrabold font-mono text-text-primary">
                          ₹{o.total}
                        </span>
                        <button
                          onClick={() => setActiveBillOrder(o)}
                          className="px-3.5 py-1.5 rounded-lg bg-medical-soft text-medical hover:bg-medical/15 transition-colors text-[10px] font-bold flex items-center gap-1"
                        >
                          <Printer className="w-3.5 h-3.5" /> View Bill
                        </button>
                      </div>
                    </div>

                    {/* Progress Tracker */}
                    <div className="py-2">
                      <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block mb-3">
                        Order Status Track: <span className="text-medical font-extrabold">{o.status}</span>
                      </span>

                      {/* Visual progress bar */}
                      <div className="grid grid-cols-5 text-center relative max-w-xl">
                        {/* Horizontal connecting lines */}
                        <div className="absolute top-3 left-[10%] right-[10%] h-0.5 bg-border -z-10">
                          <div 
                            className="h-full bg-medical transition-all duration-500" 
                            style={{ 
                              width: o.status === 'Placed' ? '0%' :
                                     o.status === 'Confirmed' ? '25%' :
                                     o.status === 'Preparing' ? '50%' :
                                     o.status === 'Out for Delivery' ? '75%' : '100%'
                            }}
                          />
                        </div>

                        {['Placed', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered'].map((step, idx) => {
                          const isActive = ['Placed', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered'].indexOf(o.status) >= idx;
                          return (
                            <div key={step} className="flex flex-col items-center">
                              <div className={`w-6.5 h-6.5 rounded-full border-2 bg-background flex items-center justify-center text-[10px] font-bold transition-all ${
                                isActive ? 'border-medical text-medical shadow-sm' : 'border-border text-text-muted'
                              }`}>
                                {idx + 1}
                              </div>
                              <span className={`text-[9px] font-bold mt-1.5 block ${
                                isActive ? 'text-text-primary' : 'text-text-muted'
                              }`}>
                                {step}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cart Drawer */}
      <AnimatePresence>
        {showCart && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCart(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            />
            {/* Drawer */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="absolute right-0 top-0 bottom-0 max-w-md w-full bg-background border-l border-border shadow-2xl flex flex-col justify-between"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-border flex items-center justify-between bg-surface/50">
                <h3 className="font-bold text-text-primary text-lg flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-medical" /> Shopping Cart
                </h3>
                <button 
                  onClick={() => setShowCart(false)}
                  className="w-8 h-8 rounded-full hover:bg-surface border border-border flex items-center justify-center text-text-secondary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cart.length === 0 ? (
                  <div className="text-center py-16">
                    <ShoppingCart className="w-12 h-12 text-text-muted mx-auto mb-3" />
                    <p className="text-sm font-bold text-text-primary">Your cart is empty</p>
                    <p className="text-xs text-text-secondary mt-1">Browse the marketplace and add items to your cart.</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="p-4 rounded-xl border border-border bg-surface/30 flex items-start justify-between gap-3 shadow-xs">
                      <div>
                        <span className="text-[8px] font-bold text-medical uppercase tracking-wider block mb-0.5">{item.category}</span>
                        <h4 className="font-bold text-text-primary text-xs leading-snug">{item.name}</h4>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-xs font-extrabold font-mono text-text-primary">₹{item.price}</span>
                          <span className="text-[10px] text-text-muted">each</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2.5">
                        {/* Quantity editor */}
                        <div className="flex items-center gap-1.5 bg-background rounded-lg p-0.5 border border-border">
                          <button
                            onClick={() => handleUpdateCartQty(item.id, -1)}
                            className="w-6 h-6 rounded-md hover:bg-surface flex items-center justify-center text-text-secondary text-xs"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-mono font-bold text-text-primary w-5 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateCartQty(item.id, 1)}
                            className="w-6 h-6 rounded-md hover:bg-surface flex items-center justify-center text-text-secondary text-xs"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Remove item */}
                        <button
                          onClick={() => handleRemoveFromCart(item.id)}
                          className="text-[10px] font-bold text-emergency hover:underline flex items-center gap-0.5"
                        >
                          <Trash2 className="w-3 h-3" /> Remove
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Total calculations & Checkout */}
              {cart.length > 0 && (
                <div className="p-6 border-t border-border bg-surface/50 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-text-secondary">
                      <span>Subtotal</span>
                      <span className="font-mono font-bold text-text-primary">₹{cartSubtotal}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-text-secondary">
                      <span>Delivery Fee</span>
                      <span className="font-mono font-bold text-text-primary">₹{deliveryFee}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm font-bold text-text-primary pt-2 border-t border-border/50">
                      <span>Grand Total</span>
                      <span className="font-mono text-base font-extrabold text-medical">₹{cartTotal}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setShowCart(false);
                      setShowCheckout(true);
                    }}
                    className="btn-primary w-full h-11 text-xs font-bold flex items-center justify-center gap-1 bg-medical hover:bg-medical-dark shadow-md"
                  >
                    Proceed to Checkout <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Checkout Screen Modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto px-4 py-8">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setShowCheckout(false)} />
          
          <div className="card max-w-md w-full p-6 border border-border shadow-2xl relative z-10 bg-background overflow-hidden animate-scaleIn">
            <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2 border-b border-border/60 pb-3">
              <Package className="w-5.5 h-5.5 text-medical" /> Order Summary Checkout
            </h3>

            {/* Summary list */}
            <div className="max-h-48 overflow-y-auto space-y-2.5 mb-4 pr-1">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between text-xs items-start">
                  <div>
                    <span className="font-bold text-text-primary">{item.name}</span>
                    <span className="text-[10px] text-text-secondary ml-1.5">Qty: {item.quantity}</span>
                  </div>
                  <span className="font-mono font-bold text-text-primary">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            {/* Subtotal totals block */}
            <div className="space-y-2 border-t border-border pt-4 mb-5">
              <div className="flex items-center justify-between text-xs text-text-secondary">
                <span>Subtotal</span>
                <span className="font-mono font-bold text-text-primary">₹{cartSubtotal}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-text-secondary">
                <span>Delivery Charge</span>
                <span className="font-mono font-bold text-text-primary">₹{deliveryFee}</span>
              </div>
              <div className="flex items-center justify-between text-sm font-bold text-text-primary pt-2 border-t border-border/50">
                <span>Grand Total</span>
                <span className="font-mono text-base font-extrabold text-medical">₹{cartTotal}</span>
              </div>
            </div>

            {/* Submit checkout buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowCheckout(false)}
                className="flex-1 btn-secondary text-xs font-bold h-11"
                disabled={isPlacingOrder}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder}
                className="flex-1 btn-primary text-xs font-bold h-11 flex items-center justify-center gap-1 bg-medical hover:bg-medical-dark"
              >
                {isPlacingOrder ? (
                  <span className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Place Order</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bill / Invoice Receipt display modal */}
      {activeBillOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto px-4 py-8">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setActiveBillOrder(null)} />
          
          <div className="card max-w-md w-full p-6 border border-border shadow-2xl relative z-10 bg-background overflow-hidden animate-scaleIn print:p-0 print:border-none print:shadow-none">
            
            {/* Header close button */}
            <div className="flex justify-between items-center border-b border-border/60 pb-3 mb-4 print:hidden">
              <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Pharmacy Invoice Bill</span>
              <button 
                onClick={() => setActiveBillOrder(null)}
                className="w-7 h-7 rounded-full hover:bg-surface border border-border flex items-center justify-center text-text-secondary"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* The printable invoice content */}
            <div id="print-area" className="font-mono text-xs text-text-primary p-4 border border-dashed border-border rounded-xl bg-surface/10 space-y-4">
              <div className="text-center border-b border-dashed border-border pb-3">
                <h2 className="text-sm font-extrabold tracking-widest text-text-primary">RESQ HEALTHCARE</h2>
                <p className="text-[10px] text-text-secondary mt-0.5">PHARMACY BILL RECEIPT</p>
              </div>

              <div className="space-y-1 text-[10px] text-text-secondary">
                <div>Order ID: <span className="font-bold text-text-primary">{activeBillOrder.order_number || activeBillOrder.id}</span></div>
                <div>Date: <span className="font-bold text-text-primary">{new Date(activeBillOrder.created_at).toLocaleString()}</span></div>
                <div>Customer: <span className="font-bold text-text-primary">{activeBillOrder.user_email}</span></div>
                <div>Status: <span className="font-bold text-medical">{activeBillOrder.status}</span></div>
              </div>

              <div className="border-t border-b border-dashed border-border py-2.5">
                <table className="w-full text-left text-[10px]">
                  <thead>
                    <tr className="font-bold text-text-secondary border-b border-dashed border-border/40 pb-1">
                      <th className="pb-1">Medicine</th>
                      <th className="pb-1 text-center">Qty</th>
                      <th className="pb-1 text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(activeBillOrder.order_items || []).map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td className="py-1">{item.medicine_name}</td>
                        <td className="py-1 text-center">{item.quantity}</td>
                        <td className="py-1 text-right">₹{item.price * item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-1.5 text-right text-[10px] text-text-secondary">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-bold text-text-primary">₹{activeBillOrder.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee:</span>
                  <span className="font-bold text-text-primary">₹{activeBillOrder.delivery_charge}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-text-primary border-t border-dashed border-border/50 pt-1.5">
                  <span className="text-medical">TOTAL:</span>
                  <span className="text-medical font-mono font-extrabold">₹{activeBillOrder.total}</span>
                </div>
              </div>

              <div className="text-center border-t border-dashed border-border/80 pt-3 text-[9px] text-text-secondary">
                Thank you for choosing ResQ Emergency Services.<br/>
                Get well soon!
              </div>
            </div>

            {/* Print and view controls */}
            <div className="flex gap-2 mt-5 print:hidden">
              <button
                type="button"
                onClick={() => {
                  setActiveBillOrder(null);
                  setActiveTab('my-orders');
                }}
                className="flex-1 btn-secondary text-xs font-bold h-10 flex items-center justify-center gap-1"
              >
                <ClipboardList className="w-4 h-4" /> View My Orders
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 btn-primary text-xs font-bold h-10 flex items-center justify-center gap-1 bg-medical hover:bg-medical-dark"
              >
                <Printer className="w-4 h-4" /> Print Bill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
