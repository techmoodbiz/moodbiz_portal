
import React, { useState, useEffect, useMemo } from 'react';
import { LogOut, X, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { auth, db } from './firebase';
import LoginScreen from './components/LoginScreen';
import BrandModal from './components/BrandModal';
import UserModal from './components/UserModal';
import { ConfirmationModal, MenuToggle } from './components/UIComponents';
import { User, Brand, Generation, Auditor, Guideline, SystemPrompts, AuditRule } from './types';
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
import ProductsTab from './components/tabs/ProductsTab';
import firebase from './firebase';

const App = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('moodbiz_active_tab') || 'dashboard';
  });

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

  useEffect(() => {
    localStorage.setItem('moodbiz_active_tab', activeTab);
  }, [activeTab]);

  // DATA
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandsLoaded, setBrandsLoaded] = useState(false);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [auditors, setAuditors] = useState<Auditor[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [guidelines, setGuidelines] = useState<Guideline[]>([]);
  const [auditRules, setAuditRules] = useState<AuditRule[]>([]);

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
    
    // Subscribe to Audit Rules
    const unsubRules = db.collection("audit_rules").onSnapshot(snap => {
      setAuditRules(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditRule)));
    });

    const unsubBrands = db.collection("brands").onSnapshot(snapshot => {
      setBrands(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Brand)));
      setBrandsLoaded(true);
    });

    return () => {
      unsubRules();
      unsubBrands();
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const qGen = currentUser.role === 'content_creator' ? db.collection('generations').where('user_id', '==', currentUser.uid) : db.collection('generations').orderBy('timestamp', 'desc');
    return qGen.onSnapshot(snap => setGenerations(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Generation))), err => console.error(err));
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    return db.collection("brand_guidelines").orderBy("created_at", "desc").onSnapshot(snap => {
      setGuidelines(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Guideline)));
    });
  }, [currentUser]);

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

  const availableBrands = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'admin') return brands;
    if (currentUser.role === 'brand_owner') return brands.filter(b => currentUser.ownedBrandIds?.includes(b.id));
    if (currentUser.role === 'content_creator') return brands.filter(b => currentUser.assignedBrandIds?.includes(b.id));
    return [];
  }, [currentUser, brands]);

  const [selectedBrandId, setSelectedBrandId] = useState(() => {
    return localStorage.getItem('moodbiz_selected_brand_id') || '';
  });

  useEffect(() => {
    if (selectedBrandId) localStorage.setItem('moodbiz_selected_brand_id', selectedBrandId);
  }, [selectedBrandId]);

  useEffect(() => {
    if (availableBrands.length > 0 && !selectedBrandId) setSelectedBrandId(availableBrands[0].id);
  }, [availableBrands, selectedBrandId]);

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

  const renderTabContent = () => {
    if (!currentUser) return null;

    switch (activeTab) {
      case 'dashboard': return <DashboardTab currentUser={currentUser} showLoading={!brandsLoaded} availableBrands={availableBrands} setActiveTab={setActiveTab} generations={generations} auditors={auditors} />;
      case 'generator': return <GeneratorTab availableBrands={availableBrands} selectedBrandId={selectedBrandId} setSelectedBrandId={setSelectedBrandId} systemPrompts={systemPrompts} currentUser={currentUser} setToast={setToast} auditors={auditors} guidelines={guidelines} />;
      case 'auditor': return <AuditorTab availableBrands={availableBrands} selectedBrandId={selectedBrandId} setSelectedBrandId={setSelectedBrandId} systemPrompts={systemPrompts} currentUser={currentUser} setToast={setToast} guidelines={guidelines} auditors={auditors} auditRules={auditRules} />;
      case 'generations': return <HistoryGenerationsTab generations={generations} brands={brands} availableBrands={availableBrands} setToast={setToast} currentUser={currentUser} systemPrompts={systemPrompts} auditors={auditors} guidelines={guidelines} />;
      case 'audits': return <HistoryAuditsTab auditors={auditors} brands={brands} availableBrands={availableBrands} />;
      case 'analytics': return <AnalyticsTab availableBrands={availableBrands} />;
      case 'users': return <UsersTab users={users} brands={brands} currentUser={currentUser} setEditingUser={setEditingUser} setIsUserModalOpen={setIsUserModalOpen} handleDeleteUser={(id) => showConfirm("Xóa", "Xóa user này?", () => db.collection("users").doc(id).delete())} />;
      case 'brands': return <BrandsTab availableBrands={availableBrands} currentUser={currentUser} setEditingBrand={setEditingBrand} setIsBrandModalOpen={setIsBrandModalOpen} handleDeleteBrand={(id) => showConfirm("Xóa", "Xóa brand này?", () => db.collection("brands").doc(id).delete())} />;
      case 'products': return <ProductsTab availableBrands={availableBrands} selectedBrandId={selectedBrandId} />;
      case 'guidelines': return <GuidelinesTab guidelines={guidelines} availableBrands={availableBrands} brands={brands} currentUser={currentUser} setToast={setToast} showConfirm={showConfirm} />;
      case 'settings': return <SettingsTab systemPrompts={systemPrompts} setSystemPrompts={setSystemPrompts} showConfirm={showConfirm} setToast={setToast} auditRules={auditRules} />;
      default: return <DashboardTab currentUser={currentUser} showLoading={!brandsLoaded} availableBrands={availableBrands} setActiveTab={setActiveTab} generations={generations} auditors={auditors} />;
    }
  };

  if (!authReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#f1f5f9]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-[#102d62]" size={48} />
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Đang khởi tạo Moodbiz...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen onLogin={setCurrentUser} />;
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex font-sans overflow-x-hidden">
      <MenuToggle isOpen={isSidebarOpen} toggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      <aside className={`fixed inset-y-0 left-0 z-40 w-[320px] bg-[#102d62] text-white transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out shadow-2xl flex flex-col overflow-hidden`}>
        <div className="p-10 flex items-center gap-4">
          <div className="w-12 h-12 bg-[#01ccff] rounded-2xl flex items-center justify-center font-black text-[#102d62] shadow-[0_0_20px_rgba(1,204,255,0.4)] text-xl shrink-0">M</div>
          <span className="text-2xl font-black tracking-tight whitespace-nowrap uppercase">MOODBIZ <span className="text-[#01ccff]">AI</span></span>
        </div>
        <nav className="flex-1 overflow-y-auto px-6 py-4 space-y-1.5 custom-scrollbar">
          {NAV_ITEMS.map((item, idx) => {
            if (item.type === 'header') {
              if (item.role && !item.role.includes(currentUser.role)) return null;
              return <div key={idx} className="px-4 pt-8 pb-3 text-[10px] font-black text-slate-400/60 uppercase tracking-[0.2em]">{item.label}</div>;
            }
            if (item.role && !item.role.includes(currentUser.role)) return null;
            const Icon = item.icon!;
            const isActive = activeTab === item.id;
            return (
              <button key={item.id} onClick={() => { setActiveTab(item.id!); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-[14px] font-bold transition-all duration-300 group ${isActive ? 'bg-[#01ccff] text-[#102d62] shadow-[0_8px_30px_rgba(1,204,255,0.3)]' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}>
                <Icon size={20} strokeWidth={isActive ? 3 : 2} className={`${isActive ? 'text-[#102d62]' : 'text-slate-400 group-hover:text-[#01ccff]'} shrink-0`} />
                <span className="whitespace-nowrap overflow-hidden text-ellipsis flex-1 text-left">{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="p-6">
          <button onClick={() => auth.signOut()} className="w-full flex items-center gap-4 px-6 py-4 bg-white/5 hover:bg-white/10 text-[#f87171] rounded-2xl transition-all duration-300 font-bold text-sm group">
            <LogOut size={20} strokeWidth={2.5} className="shrink-0" /> 
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 md:ml-[320px] p-4 md:p-8 lg:p-12 relative min-h-screen">
        <div className="max-w-[1600px] mx-auto h-full">{renderTabContent()}</div>
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

export default App;
