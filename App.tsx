
import React, { useState, useEffect, useMemo } from 'react';
import { LogOut, X, CheckCircle, AlertTriangle, Loader2, ShieldAlert } from 'lucide-react';
import { auth, db } from './firebase';
import LoginScreen from './components/LoginScreen';
import BrandModal from './components/BrandModal';
import UserModal from './components/UserModal';
import { ConfirmationModal, MenuToggle } from './components/UIComponents';
import { User, Brand, Generation, Auditor, Guideline, SystemPrompts, AuditRule } from './types';
import { NAV_ITEMS, GEN_PROMPTS_DEFAULTS, AUDIT_PROMPTS_DEFAULTS } from './constants';
import { createUserApi, deleteUserApi } from './services/api';

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
import PersonasTab from './components/tabs/PersonasTab';
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
    let initial = { generator: GEN_PROMPTS_DEFAULTS, auditor: AUDIT_PROMPTS_DEFAULTS };
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge saved config with defaults to ensure all platforms exist (handling schema migrations)
        initial = {
          generator: { ...GEN_PROMPTS_DEFAULTS, ...(parsed.generator || {}) },
          auditor: { ...AUDIT_PROMPTS_DEFAULTS, ...(parsed.auditor || {}) }
        };
      } catch (e) {
        console.error("Error parsing saved prompts, resetting to defaults", e);
      }
    }
    return initial;
  });

  useEffect(() => {
    localStorage.setItem('moodbiz_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    // Save prompts whenever they change to ensure persistence
    localStorage.setItem('moodbiz_prompts', JSON.stringify(systemPrompts));
  }, [systemPrompts]);

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
    let unsubscribeUserDoc: () => void;

    const unsubscribeAuth = auth.onAuthStateChanged(async (fbUser) => {
      // Clean up previous user listener if any
      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
      }

      if (fbUser) {
        // Optimistic / Initial user state
        const initialUser: User = { 
          uid: fbUser.uid, 
          email: fbUser.email, 
          displayName: fbUser.displayName || fbUser.email, 
          role: 'viewer' 
        };

        // Subscribe to real-time updates for the current user's profile
        unsubscribeUserDoc = db.collection('users').doc(fbUser.uid).onSnapshot(
          (doc) => {
            if (doc.exists) {
              const data = doc.data();
              // Merge Firestore data with Auth data
              setCurrentUser({ 
                ...initialUser, 
                ...data 
              } as User);
            } else {
              // Doc doesn't exist yet, stick with auth data
              setCurrentUser(initialUser);
            }
            setAuthReady(true);
          },
          (err) => {
             console.error("User doc listen error", err);
             // Fallback to auth data if Firestore fails
             setCurrentUser(initialUser);
             setAuthReady(true);
          }
        );

      } else { 
        setCurrentUser(null); 
        setAuthReady(true);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUserDoc) unsubscribeUserDoc();
    };
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    
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
    if (!currentUser || currentUser.role === 'viewer') return;
    
    let unsubUsers = () => {};
    if (currentUser.role === 'admin' || currentUser.role === 'brand_owner') {
      unsubUsers = db.collection("users").onSnapshot(snap => {
        setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));
      });
    }
    
    const unsubAuditors = db.collection("auditors").orderBy("timestamp", "desc").onSnapshot(snap => {
      const allAudits = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Auditor));
      
      if (currentUser.role === 'admin') {
        setAuditors(allAudits);
      } else if (currentUser.role === 'brand_owner') {
        setAuditors(allAudits.filter(a => currentUser.ownedBrandIds?.includes(a.brand_id)));
      } else if (currentUser.role === 'content_creator') {
        setAuditors(allAudits.filter(a => currentUser.assignedBrandIds?.includes(a.brand_id)));
      }
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

  const handleDeleteUser = async (id: string) => {
    showConfirm("Xóa người dùng", "Hành động này sẽ xóa vĩnh viễn tài khoản khỏi hệ thống.", async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) throw new Error("Authentication required");
        
        await deleteUserApi(id, token);
        setToast({ type: 'success', message: 'Đã xóa người dùng và tài khoản đăng nhập' });
      } catch (err: any) {
        setToast({ type: 'error', message: 'Lỗi khi xóa: ' + err.message });
      }
    });
  };

  const handleDeleteBrand = async (id: string) => {
    showConfirm("Xóa thương hiệu", "Xác nhận xóa thương hiệu này và toàn bộ dữ liệu liên quan?", async () => {
      try {
        await db.collection("brands").doc(id).delete();
        setToast({ type: 'success', message: 'Đã xóa thương hiệu' });
      } catch (err: any) {
        setToast({ type: 'error', message: 'Lỗi khi xóa: ' + err.message });
      }
    });
  };

  const handleLoginSuccess = (user: User) => {
    setActiveTab('dashboard'); 
  };

  const hasAccess = (tabId: string) => {
    if (!currentUser) return false;
    const item = NAV_ITEMS.find((n: any) => n.id === tabId) as any;
    if (!item) return true;
    return item.roles?.includes(currentUser.role);
  };

  const renderTabContent = () => {
    if (!currentUser) return null;

    if (!hasAccess(activeTab)) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] animate-in fade-in">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mb-6 shadow-sm">
            <ShieldAlert size={40} />
          </div>
          <h2 className="text-2xl font-black text-[#102d62] uppercase mb-2">Truy cập bị hạn chế</h2>
          <p className="text-slate-500 font-medium text-center max-w-md">Bạn không có quyền truy cập vào tính năng này. Vui lòng liên hệ Admin nếu bạn cho rằng đây là một sự nhầm lẫn.</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard': return <DashboardTab currentUser={currentUser} showLoading={!brandsLoaded} availableBrands={availableBrands} setActiveTab={setActiveTab} generations={generations} auditors={auditors} />;
      case 'generator': return <GeneratorTab availableBrands={availableBrands} selectedBrandId={selectedBrandId} setSelectedBrandId={setSelectedBrandId} systemPrompts={systemPrompts} currentUser={currentUser} setToast={setToast} auditors={auditors} guidelines={guidelines} />;
      case 'auditor': return <AuditorTab availableBrands={availableBrands} selectedBrandId={selectedBrandId} setSelectedBrandId={setSelectedBrandId} systemPrompts={systemPrompts} currentUser={currentUser} setToast={setToast} guidelines={guidelines} auditors={auditors} auditRules={auditRules} />;
      case 'generations': return <HistoryGenerationsTab generations={generations} brands={brands} availableBrands={availableBrands} setToast={setToast} currentUser={currentUser} systemPrompts={systemPrompts} auditors={auditors} guidelines={guidelines} />;
      case 'audits': return <HistoryAuditsTab auditors={auditors} brands={brands} availableBrands={availableBrands} />;
      // Cập nhật: Truyền auditors vào AnalyticsTab
      case 'analytics': return <AnalyticsTab availableBrands={availableBrands} auditors={auditors} />;
      // Cập nhật: Truyền availableBrands thay vì brands vào UsersTab
      case 'users': return <UsersTab users={users} brands={availableBrands} currentUser={currentUser} setEditingUser={setEditingUser} setIsUserModalOpen={setIsUserModalOpen} handleDeleteUser={handleDeleteUser} />;
      case 'brands': return <BrandsTab availableBrands={availableBrands} currentUser={currentUser} setEditingBrand={setEditingBrand} setIsBrandModalOpen={setIsBrandModalOpen} handleDeleteBrand={handleDeleteBrand} />;
      case 'guidelines': return <GuidelinesTab guidelines={guidelines} availableBrands={availableBrands} brands={brands} currentUser={currentUser} setToast={setToast} showConfirm={showConfirm} />;
      case 'settings': return <SettingsTab systemPrompts={systemPrompts} setSystemPrompts={setSystemPrompts} showConfirm={showConfirm} setToast={setToast} auditRules={auditRules} />;
      case 'products': return <ProductsTab availableBrands={availableBrands} selectedBrandId={selectedBrandId} />;
      case 'personas': return <PersonasTab availableBrands={availableBrands} selectedBrandId={selectedBrandId} />;
      default: return <DashboardTab currentUser={currentUser} showLoading={!brandsLoaded} availableBrands={availableBrands} setActiveTab={setActiveTab} generations={generations} auditors={auditors} />;
    }
  };

  if (!authReady) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-[#102d62]" size={48} />
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen onLogin={handleLoginSuccess} />;
  }

  return (
    <div className="h-screen bg-[#f8f9fa] flex overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-72 bg-[#102d62] text-white transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:relative md:flex md:flex-col shrink-0 border-r border-white/5`}>
        <div className="p-8 border-b border-white/10 shrink-0">
          <h1 className="text-2xl font-black tracking-tighter uppercase">MOODBIZ <span className="text-[#01ccff]">AI</span></h1>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          {NAV_ITEMS.map((item: any, idx) => {
            if (item.type === 'header') {
              if (item.roles && !item.roles.includes(currentUser.role)) return null;
              return <div key={idx} className="px-4 pt-6 pb-2 text-[10px] font-black uppercase text-white/30 tracking-[0.2em]">{item.label}</div>;
            }
            if (item.roles && !item.roles.includes(currentUser.role)) return null;
            const Icon = item.icon!;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id!); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-[#01ccff] text-[#102d62] font-black shadow-lg shadow-cyan-400/20' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
              >
                <Icon size={20} />
                <span className="text-sm font-bold">{item.label}</span>
              </button>
            );
          })}
          <div className="pt-8 mt-auto">
            <button
              onClick={() => auth.signOut()}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-400/10 transition-all"
            >
              <LogOut size={20} />
              <span className="text-sm font-bold">Đăng xuất</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 px-8 py-4 flex items-center justify-between md:hidden shrink-0 z-20">
          <MenuToggle isOpen={isSidebarOpen} toggle={() => setIsSidebarOpen(!isSidebarOpen)} />
          <h1 className="text-lg font-black text-[#102d62]">MOODBIZ AI</h1>
          <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[12px] font-black text-[#102d62] uppercase">
            {currentUser.name?.charAt(0) || currentUser.email?.charAt(0)}
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#f8f9fa]">
          <div className="p-8 md:p-12 max-w-[1600px] mx-auto w-full">
            {renderTabContent()}
          </div>
        </div>
      </main>

      {/* Shared Modals */}
      <BrandModal 
        isOpen={isBrandModalOpen} 
        onClose={() => setIsBrandModalOpen(false)} 
        brand={editingBrand} 
        currentUser={currentUser} 
        setToast={setToast} 
      />
      <UserModal 
        isOpen={isUserModalOpen} 
        onClose={() => setIsUserModalOpen(false)} 
        user={editingUser} 
        brands={availableBrands} 
        currentUserRole={currentUser.role} 
        onSave={handleSaveUser} 
      />
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        type={confirmModal.type}
      />

      {/* Global Notifications (Toast) */}
      {toast && (
        <div className={`fixed bottom-8 right-8 z-[100] px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 flex items-center gap-3 border ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : toast.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
          {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
          <span className="text-sm font-bold">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-current opacity-50 hover:opacity-100"><X size={16} /></button>
        </div>
      )}
    </div>
  );
};

export default App;
