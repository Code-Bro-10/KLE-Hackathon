import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Map, Video, Store, Truck, LogOut, User, 
  Sparkles, Clock, MapPin, HeartPulse, ClipboardList, Printer, X
} from 'lucide-react';
import NavigationBar from '@/components/Navigation';
import { supabase } from '@/lib/supabase';

export default function UserDashboardPage() {
  const navigate = useNavigate();
  const userName = localStorage.getItem('resq-active-user-name') || 'Guest Patient';
  const userEmail = localStorage.getItem('resq-active-user-email') || '';

  // Order state variables
  const [orders, setOrders] = useState<any[]>([]);
  const [activeBillOrder, setActiveBillOrder] = useState<any | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Sync / Real-time loading
  const loadOrders = async () => {
    if (!userEmail) return;
    setLoadingOrders(true);
    let currentOrders: any[] = [];
    let isDbOnline = false;

    try {
      const { data: dbOrders, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('user_email', userEmail.trim().toLowerCase())
        .order('created_at', { ascending: false });

      if (!error && dbOrders) {
        currentOrders = dbOrders;
        isDbOnline = true;
      }
    } catch (err) {
      console.warn('DB offline, fallback to local orders:', err);
    }

    const localOrders = localStorage.getItem('resq-medicine-orders');
    if (localOrders) {
      const parsed = JSON.parse(localOrders);
      currentOrders = [...parsed, ...currentOrders];
    }

    setOrders(currentOrders);
    setLoadingOrders(false);
  };

  useEffect(() => {
    loadOrders();

    const ordersChannel = supabase
      .channel('user-orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        loadOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('resq-active-user-name');
    localStorage.removeItem('resq-active-user-email');
    localStorage.removeItem('resq-active-user-role');
    navigate('/');
  };

  const services = [
    {
      title: 'Medical Equipment For Rent',
      desc: 'Rent short-term care equipment: oxygen concentrators, hospital beds, and wheelchairs nearby.',
      icon: Truck,
      to: '/rentals',
      color: 'bg-cyan-50 text-cyan-600 border-cyan-100 dark:bg-cyan-950/20 dark:text-cyan-400 dark:border-cyan-900/30',
      badge: 'Equipment Leases'
    },
    {
      title: 'AI Injury Scanner & SOS',
      desc: 'Dispatch nearest medical responders and access immediate SOS call dispatcher commands.',
      icon: Activity,
      to: '/emergency',
      color: 'bg-red-50 text-red-600 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30',
      badge: 'SOS Responders'
    },
    {
      title: 'ResQ Pharmacy Marketplace',
      desc: 'Discover pharmacy inventory, check pricing, and order critical medicines with live tracking.',
      icon: Store,
      to: '/pharmacy',
      color: 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30',
      badge: 'Medicine Shop'
    },
    {
      title: 'Video Consultation',
      desc: 'Send requests to certified medical specialists and get Google Meet / Jitsi codes instantly.',
      icon: Video,
      to: '/consult',
      color: 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30',
      badge: 'Telehealth'
    },
    {
      title: 'Nearby Hospitals',
      desc: 'Locate trauma care centers and hospitals within 2km, 5km, 10km, or 20km search radius.',
      icon: Map,
      to: '/map',
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30',
      badge: 'Trauma Locator'
    },
    {
      title: 'AI Health Assistant',
      desc: 'Symptom guidance, first aid information, and multimodal injury image analysis via Gemini.',
      icon: Sparkles,
      to: '/emergency',
      color: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30',
      badge: 'Gemini AI'
    }
  ];

  return (
    <div className="min-h-screen bg-background pt-24 pb-16 flex flex-col justify-between">
      <NavigationBar />

      <div className="container-main max-w-5xl w-full mx-auto px-6 py-6 flex-1 space-y-8">
        
        {/* Welcome Banner */}
        <div className="card p-6 md:p-8 border border-border shadow-card relative overflow-hidden bg-gradient-to-r from-surface-blue/20 to-transparent">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-medical/5 blur-3xl" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-medical-soft text-medical flex items-center justify-center border border-medical/10">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text-primary">Welcome Back, {userName}!</h1>
                <p className="text-xs text-text-secondary mt-1">{userEmail || 'Active ResQ Patient Portal Profile'}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="btn-secondary h-10 px-4 rounded-full flex items-center gap-1.5 text-xs text-emergency hover:bg-emergency-soft/20 border border-emergency/10 self-start md:self-auto"
            >
              <LogOut className="w-3.5 h-3.5" /> Log Out
            </button>
          </div>
        </div>

        {/* Services Grid */}
        <div>
          <h2 className="text-lg font-bold text-text-primary mb-1">Your Patient Services</h2>
          <p className="text-xs text-text-secondary mb-6">Select a category below to access coordinates routing, consultations, and AI diagnostics.</p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((srv, idx) => {
              const Icon = srv.icon;
              return (
                <motion.div
                  key={srv.title}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.3 }}
                  onClick={() => navigate(srv.to)}
                  className="card p-6 border border-border hover:shadow-card hover:border-medical/40 transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden bg-surface/30"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${srv.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full uppercase bg-surface text-text-secondary border border-border/60">
                        {srv.badge}
                      </span>
                    </div>
                    
                    <h3 className="text-base font-bold text-text-primary mb-2 group-hover:text-medical transition-colors">
                      {srv.title}
                    </h3>
                    <p className="text-xs text-text-secondary leading-relaxed mb-4">
                      {srv.desc}
                    </p>
                  </div>
                  
                  <div className="text-[10px] font-bold text-medical flex items-center gap-1 mt-2">
                    Open Service Console &rarr;
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Pharmacy Order Tracker Section */}
        <div className="pt-4">
          <div className="border-t border-border/60 pt-6">
            <h2 className="text-lg font-bold text-text-primary mb-1 flex items-center gap-2">
              <ClipboardList className="w-5.5 h-5.5 text-medical" /> Track Active Pharmacy Orders
            </h2>
            <p className="text-xs text-text-secondary mb-6">Review your placed medical orders and check their live preparation or delivery status updates.</p>

            {loadingOrders ? (
              <div className="text-center py-6">
                <span className="w-6 h-6 border-2 border-medical/30 border-t-medical rounded-full animate-spin inline-block" />
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8 card border border-border bg-surface/10">
                <Store className="w-10 h-10 text-text-muted mx-auto mb-2" />
                <p className="text-xs font-bold text-text-secondary">No active orders placed</p>
                <p className="text-[10px] text-text-muted mt-1">Your orders will appear here automatically after checkout.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((o) => (
                  <div key={o.id} className="card p-5 border border-border/80 shadow-sm relative overflow-hidden bg-surface/30">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border/50 pb-3 mb-4 gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold font-mono text-text-primary">{o.order_number}</span>
                          <span className="text-[9px] text-text-secondary font-mono">
                            {new Date(o.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-[9px] text-text-secondary mt-0.5">
                          {o.order_items ? o.order_items.map((item: any) => `${item.medicine_name} (${item.quantity})`).join(', ') : 'No items'}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-extrabold font-mono text-text-primary">
                          ₹{o.total}
                        </span>
                        <button
                          onClick={() => setActiveBillOrder(o)}
                          className="px-3.5 py-1.5 rounded-lg bg-medical-soft text-medical hover:bg-medical/15 transition-colors text-[10px] font-bold flex items-center gap-1"
                        >
                          <Printer className="w-3.5 h-3.5" /> View Receipt
                        </button>
                      </div>
                    </div>

                    {/* Progress Tracker */}
                    <div className="py-1">
                      <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block mb-2.5">
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
                              <div className={`w-6 h-6 rounded-full border-2 bg-background flex items-center justify-center text-[9px] font-bold transition-all ${
                                isActive ? 'border-medical text-medical shadow-sm' : 'border-border text-text-muted'
                              }`}>
                                {idx + 1}
                              </div>
                              <span className={`text-[8px] font-bold mt-1 block ${
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
        </div>

      </div>

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
