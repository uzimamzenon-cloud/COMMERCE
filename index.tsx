import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";

// --- Types & Constants ---
type View = 'dashboard' | 'pos' | 'inventory' | 'crm' | 'analytics' | 'admin' | 'staff' | 'ai-assistant';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  image: string;
  lastSold?: string;
}

interface Customer {
  id: string;
  name: string;
  points: number;
  lastVisit: string;
  spent: number;
}

const CATEGORIES = ['Tout', 'Vêtements', 'Accessoires', 'Maison', 'Electronique'];

const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'T-Shirt Bio', price: 25, stock: 45, category: 'Vêtements', image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=200&h=200&fit=crop' },
  { id: '2', name: 'Jean Slim', price: 65, stock: 12, category: 'Vêtements', image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=200&h=200&fit=crop' },
  { id: '3', name: 'Montre Quartz', price: 120, stock: 5, category: 'Accessoires', image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=200&h=200&fit=crop' },
  { id: '4', name: 'Sac à Dos', price: 45, stock: 30, category: 'Accessoires', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=200&h=200&fit=crop' },
  { id: '5', name: 'Bougie Parfumée', price: 18, stock: 100, category: 'Maison', image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=200&h=200&fit=crop' },
  { id: '6', name: 'Casque Audio', price: 89, stock: 8, category: 'Electronique', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop' },
];

const INITIAL_CUSTOMERS: Customer[] = [
  { id: '101', name: 'Marie Dupont', points: 150, lastVisit: '2023-11-20', spent: 450 },
  { id: '102', name: 'Jean Martin', points: 45, lastVisit: '2023-11-22', spent: 120 },
  { id: '103', name: 'Sophie Bernard', points: 320, lastVisit: '2023-11-23', spent: 890 },
];

// --- Core App Component ---
const App = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [cart, setCart] = useState<{ product: Product; qty: number }[]>([]);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [aiInsights, setAiInsights] = useState<string>("Génération de vos conseils personnalisés...");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.API_KEY || "" }), []);

  // --- AI Logic ---
  const fetchAiDashboardInsights = async () => {
    setIsAiLoading(true);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Tu es un expert en gestion de commerce. Voici l'état actuel : 
        Ventes: 1200€ aujourd'hui (+15% vs hier). 
        Stocks: 3 articles en alerte critique (< 5 unités). 
        Météo: Pluie prévue demain. 
        Donne 3 conseils brefs et actionnables pour ce commerçant en français.`,
      });
      setAiInsights(response.text || "Erreur lors de la génération des insights.");
    } catch (err) {
      setAiInsights("Impossible de joindre l'assistant IA pour le moment.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatInput("");
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `En tant qu'assistant de gestion commerciale, réponds à cette question : ${userMsg}. Sois précis, professionnel et concis.`,
      });
      setChatHistory(prev => [...prev, { role: 'ai', text: response.text || "Je n'ai pas pu répondre." }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'ai', text: "Erreur de connexion avec le cerveau IA." }]);
    }
  };

  useEffect(() => {
    fetchAiDashboardInsights();
  }, []);

  // --- POS Logic ---
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.product.id !== id));
  };

  const totalCart = cart.reduce((acc, item) => acc + item.product.price * item.qty, 0);

  const handleCheckout = () => {
    alert(`Encaissement de ${totalCart}€ réussi ! Ticket envoyé par email.`);
    setCart([]);
    // Update stock logic would go here
  };

  // --- Components ---

  const Sidebar = () => (
    <div className={`w-64 h-screen flex flex-col fixed left-0 top-0 border-r shadow-sm transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-600'}`}>
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center text-white text-xl">
          <i className="fas fa-chart-line"></i>
        </div>
        <h1 className="font-bold text-xl tracking-tight">CommerceFlow</h1>
      </div>

      <nav className="flex-1 px-4 space-y-2 py-4">
        <SidebarLink icon="fa-th-large" label="Tableau de bord" active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} />
        <SidebarLink icon="fa-cash-register" label="Caisse (POS)" active={currentView === 'pos'} onClick={() => setCurrentView('pos')} />
        <SidebarLink icon="fa-boxes-stacked" label="Stocks" active={currentView === 'inventory'} onClick={() => setCurrentView('inventory')} />
        <SidebarLink icon="fa-users" label="Clients / CRM" active={currentView === 'crm'} onClick={() => setCurrentView('crm')} />
        <SidebarLink icon="fa-chart-pie" label="Statistiques" active={currentView === 'analytics'} onClick={() => setCurrentView('analytics')} />
        <SidebarLink icon="fa-user-tie" label="Employés" active={currentView === 'staff'} onClick={() => setCurrentView('staff')} />
        <SidebarLink icon="fa-file-invoice-dollar" label="Administration" active={currentView === 'admin'} onClick={() => setCurrentView('admin')} />
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <SidebarLink icon="fa-robot" label="Assistant IA" active={currentView === 'ai-assistant'} onClick={() => setCurrentView('ai-assistant')} />
        </div>
      </nav>

      <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
          <span>{isDarkMode ? 'Mode Clair' : 'Mode Sombre'}</span>
        </button>
        <div className="flex items-center gap-3 px-4 py-2">
          <img src="https://ui-avatars.com/api/?name=Jean+Commercant&background=10b981&color=fff" className="w-8 h-8 rounded-full" />
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-semibold truncate">Jean Commerçant</p>
            <p className="text-xs opacity-60 truncate">Boutique Centre-Ville</p>
          </div>
        </div>
      </div>
    </div>
  );

  const SidebarLink = ({ icon, label, active, onClick }: { icon: string; label: string; active: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
        active 
          ? 'bg-emerald-50 text-emerald-600 font-semibold dark:bg-emerald-900/20 dark:text-emerald-400' 
          : 'hover:bg-slate-50 dark:hover:bg-slate-800'
      }`}
    >
      <i className={`fas ${icon} w-5`}></i>
      <span className="text-sm">{label}</span>
    </button>
  );

  const DashboardView = () => (
    <div className="space-y-8 animate-fadeIn">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Bonjour Jean 👋</h2>
          <p className="text-slate-500 dark:text-slate-400">Voici les performances de votre boutique aujourd'hui.</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-3">
            <i className="fas fa-cloud-sun text-yellow-500 text-xl"></i>
            <div>
              <p className="text-xs text-slate-500">Météo Lyon</p>
              <p className="text-sm font-bold dark:text-white">18°C - Ensoleillé</p>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon="fa-euro-sign" color="emerald" label="CA Journalier" value="1,240 €" trend="+12.5%" />
        <StatCard icon="fa-shopping-basket" color="blue" label="Commandes" value="48" trend="+4%" />
        <StatCard icon="fa-users" color="purple" label="Nouveaux Clients" value="12" trend="+22%" />
        <StatCard icon="fa-percentage" color="amber" label="Marge Moyenne" value="42%" trend="-1.2%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart Placeholder */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg dark:text-white">Évolution des Ventes</h3>
            <select className="bg-slate-50 dark:bg-slate-700 border-none rounded-lg text-sm px-3 py-1 dark:text-slate-200">
              <option>7 derniers jours</option>
              <option>30 derniers jours</option>
            </select>
          </div>
          <div className="h-64 w-full flex items-end justify-between gap-2 pt-4">
            {[45, 60, 45, 80, 75, 90, 85].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div 
                  className="w-full bg-emerald-500 rounded-t-lg transition-all duration-500 group-hover:bg-emerald-400 cursor-pointer"
                  style={{ height: `${h}%` }}
                ></div>
                <span className="text-xs text-slate-400">Lun, Mar, Mer...[i]</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights Card */}
        <div className="bg-emerald-600 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
            <i className="fas fa-robot text-8xl"></i>
          </div>
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-400 p-2 rounded-lg text-white">
                <i className="fas fa-lightbulb"></i>
              </span>
              <h3 className="font-bold text-lg">Briefing IA du matin</h3>
            </div>
            {isAiLoading ? (
              <div className="space-y-3">
                <div className="h-4 bg-emerald-500/50 rounded animate-pulse w-3/4"></div>
                <div className="h-4 bg-emerald-500/50 rounded animate-pulse w-full"></div>
                <div className="h-4 bg-emerald-500/50 rounded animate-pulse w-2/3"></div>
              </div>
            ) : (
              <div className="text-emerald-50 text-sm leading-relaxed whitespace-pre-line">
                {aiInsights}
              </div>
            )}
            <button 
              onClick={fetchAiDashboardInsights}
              className="mt-4 w-full py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium backdrop-blur-sm transition-colors"
            >
              Réactualiser les conseils
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const StatCard = ({ icon, color, label, value, trend }: any) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-${color}-500/10 text-${color}-500`}>
        <i className={`fas ${icon} text-xl`}></i>
      </div>
      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{label}</p>
      <div className="flex items-end justify-between mt-1">
        <h4 className="text-2xl font-bold dark:text-white">{value}</h4>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${trend.startsWith('+') ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
          {trend}
        </span>
      </div>
    </div>
  );

  const POSView = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCategory, setFilterCategory] = useState("Tout");

    const filteredProducts = products.filter(p => 
      (filterCategory === 'Tout' || p.category === filterCategory) &&
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="flex gap-6 h-[calc(100vh-120px)] animate-fadeIn">
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input 
                type="text" 
                placeholder="Scanner ou rechercher un produit..."
                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="px-6 py-3 bg-slate-900 dark:bg-slate-700 text-white rounded-2xl hover:bg-slate-800 transition-colors">
              <i className="fas fa-barcode mr-2"></i> Scan
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto scroll-hide pb-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-5 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all ${
                  filterCategory === cat 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scroll">
            <div className="pos-grid">
              {filteredProducts.map(p => (
                <div 
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-900 transition-all cursor-pointer group"
                >
                  <img src={p.image} className="w-full aspect-square object-cover rounded-xl mb-3" />
                  <h4 className="font-semibold text-sm truncate dark:text-white">{p.name}</h4>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-emerald-600 font-bold">{p.price}€</span>
                    <span className={`text-[10px] ${p.stock < 10 ? 'text-red-500 font-bold' : 'text-slate-400'}`}>Stock: {p.stock}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cart Sidebar */}
        <div className="w-96 flex flex-col bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700">
            <h3 className="font-bold text-lg dark:text-white flex items-center justify-between">
              Panier Actuel
              <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-lg text-slate-500">#{Math.floor(Math.random() * 9000) + 1000}</span>
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <i className="fas fa-shopping-cart text-5xl mb-4 opacity-20"></i>
                <p>Le panier est vide</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.product.id} className="flex gap-4 group">
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                    <img src={item.product.image} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h5 className="text-sm font-semibold dark:text-white">{item.product.name}</h5>
                    <p className="text-xs text-slate-500">{item.qty} x {item.product.price}€</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold dark:text-white">{item.qty * item.product.price}€</span>
                    <button 
                      onClick={() => removeFromCart(item.product.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50"
                    >
                      <i className="fas fa-trash-alt text-xs"></i>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-6 bg-slate-50 dark:bg-slate-900/50 space-y-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Sous-total</span>
              <span>{totalCart.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>TVA (20%)</span>
              <span>{(totalCart * 0.2).toFixed(2)}€</span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-700">
              <span className="text-lg font-bold dark:text-white">Total</span>
              <span className="text-2xl font-black text-emerald-600">{totalCart.toFixed(2)}€</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button className="py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col items-center gap-2 hover:bg-slate-50 transition-colors">
                <i className="fas fa-money-bill-wave text-emerald-500"></i>
                <span className="text-xs font-bold dark:text-slate-300">Espèces</span>
              </button>
              <button 
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="py-4 bg-emerald-500 text-white rounded-2xl flex flex-col items-center gap-2 hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="fas fa-credit-card"></i>
                <span className="text-xs font-bold">Carte Bancaire</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const AiAssistantView = () => (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-120px)] animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col h-full overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white text-2xl">
            <i className="fas fa-robot"></i>
          </div>
          <div>
            <h3 className="font-bold text-lg dark:text-white">CommerceFlow AI</h3>
            <p className="text-xs text-emerald-600 font-medium">En ligne • Votre consultant stratégique</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 dark:bg-slate-900/50">
          {chatHistory.length === 0 && (
            <div className="text-center py-12 space-y-4">
              <p className="text-slate-400">Posez une question sur votre commerce :</p>
              <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                <button onClick={() => setChatInput("Quels produits sont en rupture ?")} className="p-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-emerald-500 dark:text-slate-300">"Quels produits sont en rupture ?"</button>
                <button onClick={() => setChatInput("Draft un SMS promo pour Noël")} className="p-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-emerald-500 dark:text-slate-300">"Draft un SMS promo pour Noël"</button>
                <button onClick={() => setChatInput("Analyse mon CA de la semaine")} className="p-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-emerald-500 dark:text-slate-300">"Analyse mon CA de la semaine"</button>
                <button onClick={() => setChatInput("Météo et impact ventes")} className="p-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-emerald-500 dark:text-slate-300">"Météo et impact ventes"</button>
              </div>
            </div>
          )}
          {chatHistory.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-emerald-600 text-white rounded-tr-none shadow-md' 
                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200 dark:border-slate-700 shadow-sm'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleChatSubmit} className="p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex gap-3">
          <input 
            type="text"
            className="flex-1 bg-slate-50 dark:bg-slate-900 px-6 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white"
            placeholder="Demandez n'importe quoi à l'IA..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
          />
          <button 
            type="submit"
            className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
          >
            <i className="fas fa-paper-plane"></i>
          </button>
        </form>
      </div>
    </div>
  );

  const InventoryView = () => (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold dark:text-white">Gestion des Stocks</h2>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium dark:text-white">
            <i className="fas fa-file-export mr-2"></i> Export Excel
          </button>
          <button className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600">
            <i className="fas fa-plus mr-2"></i> Nouveau Produit
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Produit</th>
              <th className="px-6 py-4">Catégorie</th>
              <th className="px-6 py-4">Stock</th>
              <th className="px-6 py-4">Prix</th>
              <th className="px-6 py-4">Valeur Totale</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {products.map(p => (
              <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                <td className="px-6 py-4 flex items-center gap-3">
                  <img src={p.image} className="w-10 h-10 rounded-lg object-cover" />
                  <span className="font-semibold text-sm dark:text-white">{p.name}</span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{p.category}</td>
                <td className="px-6 py-4 font-mono text-sm dark:text-slate-300">{p.stock}</td>
                <td className="px-6 py-4 text-sm dark:text-slate-300">{p.price} €</td>
                <td className="px-6 py-4 text-sm font-bold dark:text-white">{(p.stock * p.price).toLocaleString()} €</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                    p.stock < 10 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                  }`}>
                    {p.stock < 10 ? 'Critique' : 'Sain'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button className="text-slate-400 hover:text-emerald-500"><i className="fas fa-edit"></i></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-slate-950' : 'bg-slate-50'}`}>
      <Sidebar />
      <main className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {currentView === 'dashboard' && <DashboardView />}
          {currentView === 'pos' && <POSView />}
          {currentView === 'inventory' && <InventoryView />}
          {currentView === 'ai-assistant' && <AiAssistantView />}
          {['crm', 'analytics', 'admin', 'staff'].includes(currentView) && (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <i className="fas fa-tools text-6xl text-slate-200"></i>
              <h2 className="text-xl font-bold dark:text-white">Module en construction</h2>
              <p className="text-slate-500">Bientôt disponible dans la version Pro.</p>
              <button onClick={() => setCurrentView('dashboard')} className="text-emerald-600 font-bold hover:underline">Retour au Dashboard</button>
            </div>
          )}
        </div>
      </main>

      {/* Global AI Floating Button */}
      {currentView !== 'ai-assistant' && (
        <button 
          onClick={() => setCurrentView('ai-assistant')}
          className="fixed bottom-8 right-8 w-16 h-16 bg-emerald-500 text-white rounded-full shadow-2xl flex items-center justify-center text-2xl hover:scale-110 active:scale-95 transition-all animate-bounce"
        >
          <i className="fas fa-robot"></i>
        </button>
      )}
    </div>
  );
};

// --- Main Render ---
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
