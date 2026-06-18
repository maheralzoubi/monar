import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ShoppingCart, Search, X, Plus, Minus, Trash2,
  CreditCard, Banknote, Smartphone, Tag, Check,
  Printer, AlertCircle, Percent, DollarSign,
  MessageSquare, ChevronDown, RefreshCw, Receipt
} from 'lucide-react';
import { authFetch } from '../../src/lib/auth';

interface Category { _id: string; name: string; }
interface MenuItem { _id: string; name: string; category: string; price: number; description: string; image: string; featured: boolean; ingredients: string[]; allergens: string[]; }
interface Table { _id: string; name: string; }
interface CurrentUser { _id: string; name?: string; email: string; restaurantId?: string; }

interface CartItem {
  id: string; name: string; description: string; price: number; image: string;
  category: string; quantity: number; featured: boolean; ingredients: string[]; allergens: string[]; note: string;
}

type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'PICKUP' | 'DELIVERY';
type PaymentMethod = 'CASH' | 'CARD' | 'CLIQ' | 'UNPAID' | 'PAY_LATER';
type DiscountMode = 'CODE' | 'PERCENTAGE' | 'FIXED';

const PAYMENT_STATUS: Record<PaymentMethod, string> = {
  CASH: 'PENDING_CASH', CARD: 'PENDING_CARD_PAYMENT', CLIQ: 'PENDING_CLIQ_VERIFICATION',
  UNPAID: 'UNPAID', PAY_LATER: 'UNPAID',
};

const ORDER_TYPES: { value: OrderType; label: string }[] = [
  { value: 'DINE_IN', label: 'Dine In' },
  { value: 'TAKEAWAY', label: 'Takeaway' },
  { value: 'PICKUP', label: 'Pickup' },
  { value: 'DELIVERY', label: 'Delivery' },
];

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { value: 'CASH', label: 'Cash', icon: <Banknote className="w-4 h-4" /> },
  { value: 'CARD', label: 'Card', icon: <CreditCard className="w-4 h-4" /> },
  { value: 'CLIQ', label: 'CliQ', icon: <Smartphone className="w-4 h-4" /> },
  { value: 'UNPAID', label: 'Unpaid', icon: <AlertCircle className="w-4 h-4" /> },
  { value: 'PAY_LATER', label: 'Pay Later', icon: <RefreshCw className="w-4 h-4" /> },
];

const ProductCard: React.FC<{ item: MenuItem; onAdd: (item: MenuItem) => void }> = ({ item, onAdd }) => {
  return (
    <button
      onClick={() => onAdd(item)}
      className="group bg-surface-container rounded-xl overflow-hidden text-left hover:ring-2 hover:ring-primary/40 transition-all active:scale-95"
    >
      <div className="aspect-[4/3] overflow-hidden bg-surface">
        {item.image
          ? <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          : <div className="w-full h-full flex items-center justify-center text-on-surface-variant opacity-20">
              <ShoppingCart className="w-8 h-8" />
            </div>
        }
      </div>
      <div className="p-2.5">
        <p className="text-xs font-semibold text-on-surface leading-tight line-clamp-2">{item.name}</p>
        <p className="text-sm font-bold text-primary mt-1">${item.price.toFixed(2)}</p>
      </div>
    </button>
  );
}

interface CartItemRowProps {
  item: CartItem;
  onUpdateQty: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onNote: (id: string, note: string) => void;
  noteOpen: boolean;
  onToggleNote: () => void;
}
const CartItemRow: React.FC<CartItemRowProps> = ({
  item, onUpdateQty, onRemove, onNote, noteOpen, onToggleNote,
}) => {
  return (
    <div className="bg-surface rounded-xl p-2.5 space-y-2">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-on-surface line-clamp-1">{item.name}</p>
          <p className="text-xs text-on-surface-variant">${(item.price * item.quantity).toFixed(2)}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => onUpdateQty(item.id, -1)} className="w-6 h-6 rounded-lg bg-surface-container flex items-center justify-center hover:bg-primary/10 transition-colors">
            <Minus className="w-3 h-3" />
          </button>
          <span className="text-xs font-bold w-5 text-center">{item.quantity}</span>
          <button onClick={() => onUpdateQty(item.id, 1)} className="w-6 h-6 rounded-lg bg-surface-container flex items-center justify-center hover:bg-primary/10 transition-colors">
            <Plus className="w-3 h-3" />
          </button>
          <button onClick={onToggleNote} className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${noteOpen || item.note ? 'bg-primary/10 text-primary' : 'bg-surface-container text-on-surface-variant hover:bg-primary/10'}`}>
            <MessageSquare className="w-3 h-3" />
          </button>
          <button onClick={() => onRemove(item.id)} className="w-6 h-6 rounded-lg bg-surface-container flex items-center justify-center hover:bg-red-100 hover:text-red-500 transition-colors">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
      {noteOpen && (
        <input
          autoFocus
          value={item.note}
          onChange={e => onNote(item.id, e.target.value)}
          placeholder="Item note..."
          className="w-full px-2 py-1.5 text-xs bg-surface-container rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      )}
    </div>
  );
}

const ReceiptModal = ({ order, onClose, onPrint }: { order: any; onClose: () => void; onPrint: () => void }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-surface rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="bg-primary/10 px-6 py-5 text-center">
          <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <Check className="w-6 h-6 text-primary" />
          </div>
          <h2 className="font-headline font-bold text-lg">Order Created!</h2>
          <p className="text-xs text-on-surface-variant mt-1">#{order._id?.slice(-6).toUpperCase()}</p>
        </div>

        <div className="px-6 py-4 space-y-3 max-h-64 overflow-y-auto">
          {order.items?.map((item: any, i: number) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-on-surface-variant">{item.quantity}× {item.name}{item.note ? <span className="text-xs italic ml-1">({item.note})</span> : ''}</span>
              <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="px-6 pb-4 space-y-2 border-t border-surface-container">
          <div className="pt-3 space-y-1 text-sm">
            {order.discount > 0 && (
              <div className="flex justify-between text-on-surface-variant">
                <span>Discount</span><span>-${order.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base">
              <span>Total</span><span>${order.total.toFixed(2)}</span>
            </div>
          </div>
          <div className="flex gap-1 text-xs text-on-surface-variant flex-wrap">
            <span className="bg-surface-container px-2 py-0.5 rounded-full">{order.payment_method || 'CASH'}</span>
            <span className="bg-surface-container px-2 py-0.5 rounded-full">{order.order_type || 'DINE_IN'}</span>
            {order.tableNumber && <span className="bg-surface-container px-2 py-0.5 rounded-full">Table {order.tableNumber}</span>}
            {order.cashier_name && <span className="bg-surface-container px-2 py-0.5 rounded-full">By: {order.cashier_name}</span>}
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onPrint} className="flex-1 flex items-center justify-center gap-2 border border-surface-container rounded-xl py-2.5 text-sm font-semibold hover:bg-surface-container transition-colors">
            <Printer className="w-4 h-4" /> Print
          </button>
          <button onClick={onClose} className="flex-1 btn-gradient text-white rounded-xl py-2.5 text-sm font-bold">
            New Order
          </button>
        </div>
      </div>
    </div>
  );
}

export const CashierPOS = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [search, setSearch] = useState('');

  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeNote, setActiveNote] = useState<string | null>(null);

  const [orderType, setOrderType] = useState<OrderType>('DINE_IN');
  const [tableId, setTableId] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [orderNote, setOrderNote] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [discountMode, setDiscountMode] = useState<DiscountMode | null>(null);
  const [discountInput, setDiscountInput] = useState('');
  const [promoResult, setPromoResult] = useState<{ discount: number; type: string } | null>(null);
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);

  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<any | null>(null);

  useEffect(() => {
    const load = async () => {
      const [catRes, menuRes, tableRes, meRes] = await Promise.all([
        authFetch('/api/categories'),
        authFetch('/api/menu'),
        authFetch('/api/tables'),
        authFetch('/api/auth/me'),
      ]);
      if (catRes.ok) setCategories(await catRes.json());
      if (menuRes.ok) setMenuItems(await menuRes.json());
      if (tableRes.ok) setTables(await tableRes.json());
      if (meRes.ok) setCurrentUser(await meRes.json());
      setLoading(false);
    };
    load();
  }, []);

  const filteredItems = useMemo(() => menuItems.filter(item => {
    const matchCat = selectedCategory === 'All' || item.category === selectedCategory;
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) || item.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  }), [menuItems, selectedCategory, search]);

  const addToCart = useCallback((item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item._id);
      if (existing) return prev.map(c => c.id === item._id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { id: item._id, name: item.name, description: item.description, price: item.price, image: item.image, category: item.category, quantity: 1, featured: item.featured, ingredients: item.ingredients, allergens: item.allergens, note: '' }];
    });
  }, []);

  const updateQty = useCallback((id: string, delta: number) => {
    setCart(prev => prev.map(c => c.id === id ? { ...c, quantity: c.quantity + delta } : c).filter(c => c.quantity > 0));
  }, []);

  const removeFromCart = useCallback((id: string) => setCart(prev => prev.filter(c => c.id !== id)), []);
  const setItemNote = useCallback((id: string, note: string) => setCart(prev => prev.map(c => c.id === id ? { ...c, note } : c)), []);

  const subtotal = useMemo(() => cart.reduce((s, c) => s + c.price * c.quantity, 0), [cart]);

  const discountAmount = useMemo(() => {
    if (discountMode === 'CODE' && promoResult) {
      return promoResult.type === 'percentage' ? subtotal * (promoResult.discount / 100) : promoResult.discount;
    }
    if (discountMode === 'PERCENTAGE') return subtotal * ((parseFloat(discountInput) || 0) / 100);
    if (discountMode === 'FIXED') return Math.min(parseFloat(discountInput) || 0, subtotal);
    return 0;
  }, [discountMode, discountInput, promoResult, subtotal]);

  const total = Math.max(0, subtotal - discountAmount);

  const validatePromo = async () => {
    if (!discountInput.trim()) return;
    setPromoError('');
    setPromoLoading(true);
    try {
      const res = await authFetch('/api/promos/validate', {
        method: 'POST',
        body: JSON.stringify({ code: discountInput.trim(), restaurantId: currentUser?.restaurantId }),
      });
      if (res.ok) {
        const data = await res.json();
        setPromoResult(data);
      } else {
        setPromoError('Invalid or expired code');
      }
    } finally { setPromoLoading(false); }
  };

  const createOrder = async () => {
    if (cart.length === 0) { setError('Add at least one item to the cart'); return; }
    if (orderType === 'DINE_IN' && !tableNumber) { setError('Please select a table for Dine-In orders'); return; }
    setError('');
    setCreating(true);
    try {
      const payload: Record<string, any> = {
        items: cart.map(({ note, ...item }) => ({ ...item, note })),
        total,
        discount: discountAmount,
        restaurantId: currentUser?.restaurantId,
        tableNumber: orderType === 'DINE_IN' ? tableNumber : undefined,
        order_source: 'CASHIER_POS',
        order_type: orderType,
        payment_method: paymentMethod,
        payment_status: PAYMENT_STATUS[paymentMethod],
        cashier_id: currentUser?._id,
        cashier_name: currentUser?.name || currentUser?.email,
        order_note: orderNote || undefined,
      };
      if (discountMode === 'CODE' && promoResult) {
        payload.promoCode = discountInput.trim();
        payload.discount_type = 'CODE';
        payload.discount_applied_by = currentUser?.name || currentUser?.email;
      } else if (discountMode && discountAmount > 0) {
        payload.discount_type = discountMode;
        payload.discount_applied_by = currentUser?.name || currentUser?.email;
      }
      const res = await authFetch('/api/orders', { method: 'POST', body: JSON.stringify(payload) });
      if (res.ok) {
        setReceipt(await res.json());
        setCart([]);
      } else {
        const err = await res.json();
        setError(err.message || 'Failed to create order');
      }
    } catch { setError('Network error. Please try again.'); }
    finally { setCreating(false); }
  };

  const resetOrder = () => {
    setReceipt(null);
    setOrderNote('');
    setDiscountMode(null);
    setDiscountInput('');
    setPromoResult(null);
    setPromoError('');
    setTableId('');
    setTableNumber('');
    setError('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-on-surface-variant">
        <RefreshCw className="w-6 h-6 animate-spin mr-3" /> Loading POS...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4" style={{ height: 'calc(100vh - 13rem)' }}>
      {/* Order Type Bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-on-surface-variant mr-1">Order Type:</span>
        {ORDER_TYPES.map(t => (
          <button key={t.value} onClick={() => { setOrderType(t.value); setTableId(''); setTableNumber(''); }}
            className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-all ${orderType === t.value ? 'bg-primary text-white shadow-sm' : 'bg-surface-container text-on-surface-variant hover:text-on-surface'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Main */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* LEFT: Product Browser */}
        <div className="flex-1 flex flex-col gap-3 min-h-0">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2.5 bg-surface-container rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {['All', ...categories.map(c => c.name)].map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${selectedCategory === cat ? 'bg-primary text-white shadow-sm' : 'bg-surface-container text-on-surface-variant hover:text-on-surface'}`}>
                {cat}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto grid grid-cols-3 gap-3 content-start pr-1">
            {filteredItems.map(item => (
              <ProductCard key={item._id} item={item} onAdd={addToCart} />
            ))}
            {filteredItems.length === 0 && (
              <div className="col-span-3 flex flex-col items-center justify-center h-40 text-on-surface-variant gap-2">
                <Search className="w-8 h-8 opacity-20" />
                <p className="text-sm">No products found</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Cart */}
        <div className="w-[360px] flex flex-col bg-surface-container rounded-2xl overflow-hidden shrink-0">
          {/* Cart Header */}
          <div className="px-4 py-3 border-b border-black/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-primary" />
              <span className="font-bold text-sm font-headline">Cart</span>
              {cart.length > 0 && <span className="bg-primary text-white text-xs px-1.5 py-0.5 rounded-full font-bold">{cart.reduce((s, c) => s + c.quantity, 0)}</span>}
            </div>
            {cart.length > 0 && (
              <button onClick={() => setCart([])} className="text-xs text-on-surface-variant hover:text-red-500 transition-colors">Clear all</button>
            )}
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 min-h-0">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-on-surface-variant gap-2">
                <ShoppingCart className="w-8 h-8 opacity-20" />
                <p className="text-xs">Tap a product to add it</p>
              </div>
            ) : (
              cart.map(item => (
                <CartItemRow key={item.id} item={item}
                  onUpdateQty={updateQty} onRemove={removeFromCart}
                  onNote={setItemNote} noteOpen={activeNote === item.id}
                  onToggleNote={() => setActiveNote(activeNote === item.id ? null : item.id)}
                />
              ))
            )}
          </div>

          {/* Order Details */}
          <div className="border-t border-black/5 px-3 py-3 space-y-2.5">
            {/* Table */}
            {orderType === 'DINE_IN' && (
              <select value={tableId}
                onChange={e => { const t = tables.find(t => t._id === e.target.value); setTableId(e.target.value); setTableNumber(t?.name || ''); }}
                className="w-full px-3 py-2 bg-surface rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="">Select table *</option>
                {tables.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
            )}

            {/* Order Note */}
            <textarea
              value={orderNote}
              onChange={e => setOrderNote(e.target.value)}
              placeholder="Order note..."
              rows={1}
              className="w-full px-3 py-2 bg-surface rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
            />

            {/* Discount */}
            <div className="space-y-2">
              <div className="flex gap-1">
                {([['CODE', 'Promo', <Tag className="w-3 h-3" />], ['PERCENTAGE', '%', <Percent className="w-3 h-3" />], ['FIXED', 'Fixed', <DollarSign className="w-3 h-3" />]] as [DiscountMode, string, React.ReactNode][]).map(([mode, label, icon]) => (
                  <button key={mode} onClick={() => { setDiscountMode(discountMode === mode ? null : mode); setDiscountInput(''); setPromoResult(null); setPromoError(''); }}
                    className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${discountMode === mode ? 'bg-primary text-white' : 'bg-surface text-on-surface-variant hover:text-on-surface'}`}>
                    {icon}{label}
                  </button>
                ))}
              </div>
              {discountMode && (
                <div className="flex gap-1">
                  <input
                    value={discountInput}
                    onChange={e => { setDiscountInput(e.target.value); setPromoResult(null); setPromoError(''); }}
                    placeholder={discountMode === 'CODE' ? 'Enter promo code' : discountMode === 'PERCENTAGE' ? 'e.g. 10' : 'e.g. 5.00'}
                    className="flex-1 px-3 py-2 bg-surface rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  {discountMode === 'CODE' && (
                    <button onClick={validatePromo} disabled={promoLoading || !discountInput.trim()}
                      className="px-3 py-2 bg-primary text-white rounded-xl text-xs font-bold disabled:opacity-50 hover:opacity-90 transition-opacity">
                      {promoLoading ? '...' : 'Apply'}
                    </button>
                  )}
                </div>
              )}
              {promoResult && <p className="text-xs text-green-600 flex items-center gap-1"><Check className="w-3 h-3" /> Code applied: -{discountAmount.toFixed(2)}</p>}
              {promoError && <p className="text-xs text-red-500">{promoError}</p>}
            </div>

            {/* Payment Methods */}
            <div className="grid grid-cols-5 gap-1">
              {PAYMENT_METHODS.map(pm => (
                <button key={pm.value} onClick={() => setPaymentMethod(pm.value)}
                  className={`flex flex-col items-center gap-0.5 py-2 rounded-xl text-xs font-semibold transition-all ${paymentMethod === pm.value ? 'bg-primary text-white shadow-sm' : 'bg-surface text-on-surface-variant hover:text-on-surface'}`}>
                  {pm.icon}
                  <span style={{ fontSize: '10px' }}>{pm.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Totals + CTA */}
          <div className="px-4 pb-4 pt-3 border-t border-black/5 space-y-3">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-on-surface-variant">
                <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span><span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base">
                <span>Total</span><span>${total.toFixed(2)}</span>
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-xs flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}
              </p>
            )}

            <button onClick={createOrder} disabled={creating || cart.length === 0}
              className="w-full btn-gradient text-white py-3 rounded-xl font-bold text-sm disabled:opacity-40 transition-opacity flex items-center justify-center gap-2">
              {creating ? <><RefreshCw className="w-4 h-4 animate-spin" /> Creating...</>
                : <><Receipt className="w-4 h-4" /> Create Order · ${total.toFixed(2)}</>}
            </button>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      {receipt && <ReceiptModal order={receipt} onClose={resetOrder} onPrint={() => window.print()} />}
    </div>
  );
};
