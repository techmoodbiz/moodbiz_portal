
import React, { useState, useEffect, useMemo } from 'react';
import { LogOut, X, CheckCircle, AlertTriangle } from 'lucide-react';
import { auth, db } from './firebase';
import LoginScreen from './components/LoginScreen';
import BrandModal from './components/BrandModal';
import UserModal from './components/UserModal';
import { ConfirmationModal, MenuToggle } from './components/UIComponents';
import { User, Brand, Generation, Auditor, Guideline, SystemPrompts } from './types';
import { NAV_ITEMS, DEFAULT_GEN_PROMPT, SOCIAL_AUDIT_PROMPT, WEBSITE_AUDIT_PROMPT } from './constants';
import { createUserApi } from './services/api';

// TABS
import DashboardTab from './components/tabs/DashboardTab';
import GeneratorTab from './components/tabs/GeneratorTab';
import AuditorTab from './components/tabs/AuditorTab';
import HistoryGenerationsTab from './components/tabs/HistoryGenerationsTab';
import HistoryAuditsTab from './components/tabs/HistoryAuditsTab';
import AnalyticsTab from './components/tabs/AnalyticsTab';
import UsersTab from './components/tabs/UsersTab';
import BrandsTab from './components/tabs/BrandsTab';
import GuidelinesTab from './components/tabs/GuidelinesTab';
import SettingsTab from './components/tabs/SettingsTab';
import PersonasTab from './components/tabs/PersonasTab';
import ProductsTab from './components/tabs/ProductsTab';
import TemplatesTab from './components/tabs/TemplatesTab';
import firebase from './firebase';

const App = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'danger' as 'danger' | 'warning' | 'info'
  });

  const [systemPrompts, setSystemPrompts] = useState<SystemPrompts>(() => {
    const saved = localStorage.getItem('moodbiz_prompts');
    if (saved) return JSON.parse(saved);
    return { generator: DEFAULT_GEN_PROMPT, auditor: { social: SOCIAL_AUDIT_PROMPT, website: WEBSITE_AUDIT_PROMPT } };
  });

  // DATA
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandsLoaded, setBrandsLoaded] = useState(false);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [auditors, setAuditors] = useState<Auditor[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [guidelines, setGuidelines] = useState<Guideline[]>([]);

  // MODALS
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showConfirm = (title: string, message: string, onConfirm: () => void, type: 'danger' | 'warning' | 'info' = 'danger') => {
    setConfirmModal({ isOpen: true, title, message, onConfirm, type });
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (fbUser) => {
      if (fbUser) {
        let userData: User = { uid: fbUser.uid, email: fbUser.email, displayName: fbUser.displayName || fbUser.email, role: 'viewer' };
        try {
          const snap = await db.collection('users').doc(fbUser.uid).get();
          if (snap.exists) userData = { ...userData, ...snap.data() as any };
        } catch (err) { console.error(err); }
        setCurrentUser(userData);
      } else { setCurrentUser(null); }
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    return db.collection("brands").onSnapshot(snapshot => {
      setBrands(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Brand)));
      setBrandsLoaded(true);
    }, err => console.error("Permission denied on brands list"));
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const qGen = currentUser.role === 'content_creator' ? db.collection('generations').where('user_id', '==', currentUser.uid) : db.collection('generations').orderBy('timestamp', 'desc');
    return qGen.onSnapshot(snap => setGenerations(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Generation))), err => console.error("Permission denied on generations list"));
  }, [currentUser]);

  // Fix: Completed truncated guideline subscription and added missing logic
  useEffect(() => {
    if (!currentUser) return;
    const unsub = db.collection("brand_guidelines").orderBy("created_at", "desc").onSnapshot(snap => {
      setGuidelines(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Guideline)));
    }, err => console.error("Permission denied on guidelines list:", err));
    return unsub;
  }, [currentUser]);

  // Fix: Added missing subscriptions for users and auditors
  useEffect(() => {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'brand_owner')) return;
    
    const unsubUsers = db.collection("users").onSnapshot(snap => {
      setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));
    });
    
    const unsubAuditors = db.collection("auditors").orderBy("timestamp", "desc").onSnapshot(snap => {
      setAuditors(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Auditor)));
    });

    return () => {
      unsubUsers();
      unsubAuditors();
    };
  }, [currentUser]);

  // Derived state: Brands the current user has access to
  const availableBrands = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'admin') return brands;
    if (currentUser.role === 'brand_owner') {
      return brands.filter(b => currentUser.ownedBrandIds?.includes(b.id));
    }
    if (currentUser.role === 'content_creator') {
      return brands.filter(b => currentUser.assignedBrandIds?.includes(b.id));
    }
    return [];
  }, [currentUser, brands]);

  const [selectedBrandId, setSelectedBrandId] = useState('');
  useEffect(() => {
    if (availableBrands.length > 0 && !selectedBrandId) {
      setSelectedBrandId(availableBrands[0].id);
    }
  }, [availableBrands, selectedBrandId]);

  // Handlers
  const handleDeleteUser = (id: string) => {
    showConfirm("Xóa người dùng", "Bạn có chắc chắn muốn xóa tài khoản này?", async () => {
      try {
        await db.collection("users").doc(id).delete();
        setToast({ type: 'success', message: 'Đã xóa người dùng' });
      } catch (err) {
        setToast({ type: 'error', message: 'Lỗi khi xóa' });
      }
    });
  };

  const handleDeleteBrand = (id: string) => {
    showConfirm("Xóa thương hiệu", "Xóa brand sẽ xóa toàn bộ dữ liệu liên quan. Tiếp tục?", async () => {
      try {
        await db.collection("brands").doc(id).delete();
        setToast({ type: 'success', message: 'Đã xóa brand' });
      } catch (err) {
        setToast({ type: 'error', message: 'Lỗi khi xóa' });
      }
    });
  };

  const handleSaveUser = async (data: any) => {
    try {
      if (editingUser) {
        await db.collection("users").doc(editingUser.id).update(data);
        setToast({ type: 'success', message: 'Cập nhật thành công' });
      } else {
        const token = await auth.currentUser?.getIdToken();
        if (!token) throw new Error("No auth token");
        await createUserApi(data, token);
        setToast({ type: 'success', message: 'Tạo tài khoản thành công' });
      }
      setIsUserModalOpen(false);
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Lỗi khi lưu user' });
    }
  };

  if (!authReady) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-[#102d62] animate-pulse">Initializing...</div>;
  if (!currentUser) return <LoginScreen onLogin={setCurrentUser} />;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardTab currentUser={currentUser} showLoading={!brandsLoaded} availableBrands={availableBrands} setActiveTab={setActiveTab} generations={generations} auditors={auditors} />;
      case 'generator': return <GeneratorTab availableBrands={availableBrands} selectedBrandId={selectedBrandId} setSelectedBrandId={setSelectedBrandId} systemPrompts={systemPrompts} currentUser={currentUser} setToast={setToast} auditors={auditors} guidelines={guidelines} />;
      case 'auditor': return <AuditorTab availableBrands={availableBrands} selectedBrandId={selectedBrandId} setSelectedBrandId={setSelectedBrandId} systemPrompts={systemPrompts} currentUser={currentUser} setToast={setToast} guidelines={guidelines} auditors={auditors} />;
      case 'generations': return <HistoryGenerationsTab generations={generations} brands={brands} availableBrands={availableBrands} setToast={setToast} currentUser={currentUser} systemPrompts={systemPrompts} auditors={auditors} guidelines={guidelines} />;
      case 'audits': return <HistoryAuditsTab auditors={auditors} brands={brands} availableBrands={availableBrands} />;
      case 'analytics': return <AnalyticsTab availableBrands={availableBrands} />;
      case 'users': return <UsersTab users={users} brands={brands} currentUser={currentUser} setEditingUser={setEditingUser} setIsUserModalOpen={setIsUserModalOpen} handleDeleteUser={handleDeleteUser} />;
      case 'brands': return <BrandsTab availableBrands={availableBrands} currentUser={currentUser} setEditingBrand={setEditingBrand} setIsBrandModalOpen={setIsBrandModalOpen} handleDeleteBrand={handleDeleteBrand} />;
      case 'guidelines': return <GuidelinesTab guidelines={guidelines} availableBrands={availableBrands} brands={brands} currentUser={currentUser} setToast={setToast} showConfirm={showConfirm} />;
      case 'settings': return <SettingsTab systemPrompts={systemPrompts} setSystemPrompts={setSystemPrompts} showConfirm={showConfirm} setToast={setToast} />;
      case 'personas': return <PersonasTab availableBrands={availableBrands} selectedBrandId={selectedBrandId} />;
      case 'products': return <ProductsTab availableBrands={availableBrands} selectedBrandId={selectedBrandId} />;
      case 'templates': return <TemplatesTab availableBrands={availableBrands} selectedBrandId={selectedBrandId} />;
      default: return <DashboardTab currentUser={currentUser} showLoading={!brandsLoaded} availableBrands={availableBrands} setActiveTab={setActiveTab} generations={generations} auditors={auditors} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex font-sans">
      <MenuToggle isOpen={isSidebarOpen} toggle={() => setIsSidebarOpen(!isSidebarOpen)} />

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-[#102d62] text-white transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out shadow-2xl flex flex-col`}>
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-[#01ccff] rounded-xl flex items-center justify-center font-black text-blue-900 shadow-lg shadow-cyan-400/20">M</div>
          <span className="text-xl font-extrabold tracking-tight">MOODBIZ <span className="text-[#01ccff]">AI</span></span>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1 custom-scrollbar">
          {NAV_ITEMS.map((item, idx) => {
            if (item.type === 'header') {
              if (item.role && !item.role.includes(currentUser.role)) return null;
              return <div key={idx} className="px-4 pt-6 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</div>;
            }
            if (item.role && !item.role.includes(currentUser.role)) return null;
            const Icon = item.icon!;
            return (
              <button key={item.id} onClick={() => { setActiveTab(item.id!); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all group ${activeTab === item.id ? 'bg-[#01ccff] text-[#102d62] shadow-lg shadow-cyan-400/20' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}>
                <Icon size={18} className={`${activeTab === item.id ? 'text-[#102d62]' : 'text-slate-400 group-hover:text-[#01ccff]'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 mt-auto">
          <button onClick={() => auth.signOut()} className="w-full flex items-center justify-between px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors font-bold text-sm group">
            <div className="flex items-center gap-3">
              <LogOut size={18} /> Đăng xuất
            </div>
            <X size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-72 p-4 md:p-8 lg:p-12 relative min-h-screen">
        {renderTabContent()}

        {/* Toast Notification */}
        {toast && (
          <div className={`fixed bottom-8 right-8 z-[100] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-10 ${toast.type === 'success' ? 'bg-emerald-500 text-white' : toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-[#102d62] text-white'}`}>
            {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
            <span className="font-bold text-sm">{toast.message}</span>
          </div>
        )}
      </main>

      <ConfirmationModal isOpen={confirmModal.isOpen} title={confirmModal.title} message={confirmModal.message} onConfirm={confirmModal.onConfirm} onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })} type={confirmModal.type} />
      <UserModal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} onSave={handleSaveUser} user={editingUser} brands={brands} currentUserRole={currentUser.role} />
      <BrandModal isOpen={isBrandModalOpen} onClose={() => setIsBrandModalOpen(false)} brand={editingBrand} currentUser={currentUser} setToast={setToast} onSave={(b) => setEditingBrand(null)} />
    </div>
  );
};

// Fix: Added missing default export
export default App;
