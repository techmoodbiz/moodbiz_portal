
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

// IMPORT TABS
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
import firebase from './firebase';

const App = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'danger' as 'danger' | 'warning' | 'info'
  });

  const [systemPrompts, setSystemPrompts] = useState<SystemPrompts>(() => {
    const saved = localStorage.getItem('moodbiz_prompts');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (typeof parsed.auditor === 'string') {
        return { generator: parsed.generator, auditor: { social: parsed.auditor, website: WEBSITE_AUDIT_PROMPT } };
      }
      return parsed;
    }
    return { generator: DEFAULT_GEN_PROMPT, auditor: { social: SOCIAL_AUDIT_PROMPT, website: WEBSITE_AUDIT_PROMPT } };
  });

  // DATA STATE
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandsLoaded, setBrandsLoaded] = useState(false);
  const [brandsError, setBrandsError] = useState(false);

  const [generations, setGenerations] = useState<Generation[]>([]);
  const [generationsLoaded, setGenerationsLoaded] = useState(false);
  
  const [auditors, setAuditors] = useState<Auditor[]>([]);
  const [auditorsLoaded, setAuditorsLoaded] = useState(false);
  
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoaded, setUsersLoaded] = useState(false);
  
  const [guidelines, setGuidelines] = useState<Guideline[]>([]);
  const [guidelinesLoaded, setGuidelinesLoaded] = useState(false);

  // UI STATE (Modals)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showConfirm = (title: string, message: string, onConfirm: () => void, type: 'danger' | 'warning' | 'info' = 'danger') => {
    setConfirmModal({ isOpen: true, title, message, onConfirm, type });
  };

  // Auth Listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (fbUser) => {
      if (fbUser) {
        let userData: User = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || fbUser.email,
          role: 'viewer',
        };
        try {
          const docRef = db.collection('users').doc(fbUser.uid);
          const snap = await docRef.get();
          if (snap.exists) {
            userData = { ...userData, ...snap.data() as any };
          }
        } catch (err) {
          console.error('Error reading user metadata', err);
        }
        setCurrentUser(userData);
      } else {
        setCurrentUser(null);
      }
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Brands Listener
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = db.collection("brands").onSnapshot(
      snapshot => {
        const firestoreBrands: Brand[] = [];
        snapshot.forEach(doc => firestoreBrands.push({ id: doc.id, ...doc.data() } as Brand));
        setBrands(firestoreBrands);
        setBrandsLoaded(true);
      },
      error => {
        console.error("Error listening brands", error);
        setBrandsError(true);
        setBrandsLoaded(true);
      }
    );
    return unsubscribe;
  }, [currentUser]);

  // Users Listener
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = db.collection("users").onSnapshot(
      snapshot => {
        const firestoreUsers: User[] = [];
        snapshot.forEach(doc => firestoreUsers.push({ id: doc.id, ...doc.data() } as User));
        setUsers(firestoreUsers);
        setUsersLoaded(true);
      },
      error => setUsersLoaded(true)
    );
    return unsubscribe;
  }, [currentUser]);

  // History Listeners
  useEffect(() => {
    if (!currentUser) return;
    
    let qGen: firebase.firestore.Query = db.collection('generations');
    let qAudit: firebase.firestore.Query = db.collection('auditors');

    if (currentUser.role === 'content_creator') {
      qGen = qGen.where('user_id', '==', currentUser.uid).limit(50);
      qAudit = qAudit.where('user_id', '==', currentUser.uid).limit(50);
    } else {
      qGen = qGen.orderBy('timestamp', 'desc').limit(50);
      qAudit = qAudit.orderBy('timestamp', 'desc').limit(50);
    }

    const unsubGen = qGen.onSnapshot(snap => {
      const items: Generation[] = [];
      snap.forEach(doc => items.push({ id: doc.id, ...doc.data() } as Generation));
      if (currentUser.role === 'content_creator') {
        items.sort((a, b) => {
          const tA = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
          const tB = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
          return tB - tA;
        });
      }
      setGenerations(items);
      setGenerationsLoaded(true);
    }, err => console.error("Gen listener error", err));

    const unsubAudit = qAudit.onSnapshot(snap => {
      const items: Auditor[] = [];
      snap.forEach(doc => items.push({ id: doc.id, ...doc.data() } as Auditor));
      if (currentUser.role === 'content_creator') {
        items.sort((a, b) => {
          const tA = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
          const tB = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
          return tB - tA;
        });
      }
      setAuditors(items);
      setAuditorsLoaded(true);
    }, err => console.error("Audit listener error", err));

    return () => { unsubGen(); unsubAudit(); };
  }, [currentUser]);

  // Guidelines Listener
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = db.collection("brand_guidelines").orderBy("created_at", "desc").onSnapshot(
      snapshot => {
        const items: Guideline[] = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          items.push({ 
            id: doc.id, 
            ...data,
            brand_id: data.brand_id || data.brandId,
            file_name: data.file_name || data.fileName || data.filename,
            uploaded_by: data.uploaded_by || data.uploadedBy,
            type: data.type || "guideline"
          } as Guideline);
        });
        setGuidelines(items);
        setGuidelinesLoaded(true);
      },
      error => setGuidelinesLoaded(true)
    );
    return unsubscribe;
  }, [currentUser]);

  // RBAC Brands
  const availableBrands = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'admin') return brands;
    if (currentUser.role === 'brand_owner') return brands.filter(b => currentUser.ownedBrandIds?.includes(b.id));
    if (currentUser.role === 'content_creator') return brands.filter(b => currentUser.assignedBrandIds?.includes(b.id));
    return [];
  }, [currentUser, brands]);

  // Brand Selection
  const [selectedBrandId, setSelectedBrandId] = useState('');
  useEffect(() => {
    if (availableBrands.length > 0 && (!selectedBrandId || !availableBrands.find(b => b.id === selectedBrandId))) {
      setSelectedBrandId(availableBrands[0].id);
    }
  }, [availableBrands]);

  // Handlers
  const handleLogin = (user: User) => setCurrentUser(user);
  
  const handleLogout = () => {
    showConfirm("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?", async () => {
      await auth.signOut();
      setActiveTab('dashboard');
    }, 'info');
  };

  const handleSaveBrand = async (brandData: Brand) => {
    try {
      await db.collection("brands").doc(brandData.id).set(brandData, { merge: true });
      setIsBrandModalOpen(false);
      setToast({type:'success', message: editingBrand ? "Đã cập nhật Brand" : "Đã thêm Brand mới"});
    } catch (e) {
      setToast({type:'error', message: "Lỗi lưu brand"});
    }
  };

  const handleDeleteBrand = (id: string) => {
    showConfirm("Xóa Brand", "Hành động này không thể hoàn tác. Bạn chắc chắn muốn xóa?", async () => {
      await db.collection("brands").doc(id).delete();
      setToast({type:'success', message: "Đã xóa Brand"});
    });
  };

  const handleSaveUser = async (userData: any) => {
    try {
      if (!editingUser) {
        const token = await auth.currentUser?.getIdToken();
        if (token) await createUserApi(userData, token);
      } else {
        await db.collection('users').doc(editingUser.id).update({
          name: userData.name, role: userData.role,
          ownedBrandIds: userData.ownedBrandIds || [],
          assignedBrandIds: userData.assignedBrandIds || []
        });
      }
      setIsUserModalOpen(false);
      setToast({type:'success', message: "Đã lưu tài khoản"});
    } catch (e: any) {
      setToast({type:'error', message: "Lỗi: " + e.message});
    }
  };

  const handleDeleteUser = (id: string) => {
    showConfirm("Xóa User", "Bạn chắc chắn muốn xóa tài khoản này?", async () => {
      await db.collection('users').doc(id).delete();
      setToast({type:'success', message: "Đã xóa user"});
    });
  };

  if (!authReady) return <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center"><div className="w-16 h-16 border-4 border-[#01ccff] border-t-transparent rounded-full animate-spin"></div></div>;
  if (!currentUser) return <LoginScreen onLogin={handleLogin} />;
  
  const showLoading = !brandsLoaded && !brandsError;

  return (
    <div className="h-screen bg-[#f8f9fa] font-sans text-[#374151] flex overflow-hidden">
      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 z-40 w-72 bg-[#102d62] text-white flex flex-col shrink-0 shadow-2xl transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#01ccff] rounded-full mix-blend-overlay opacity-10 blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        <div className="p-8 border-b border-blue-900/30 relative z-10 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1.5 bg-[#01ccff]"></div>
            <div><h1 className="text-2xl font-extrabold tracking-tight leading-none">MOODBIZ</h1><p className="text-[10px] text-[#01ccff] uppercase tracking-[0.2em] mt-1 font-medium">Partner Portal</p></div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-white/50 hover:text-white"><X size={20}/></button>
        </div>
        <nav className="flex-1 p-6 space-y-1 relative z-10 overflow-y-auto sidebar-scroll">
          {NAV_ITEMS.map((item, index) => {
            if (item.role && !item.role.includes(currentUser.role)) return null;
            if (item.type === 'header') return <div key={index} className="px-4 pt-6 pb-2 text-xs font-bold text-[#01ccff] uppercase tracking-widest opacity-80">{item.label}</div>;
            return (
              <button key={item.id} onClick={() => { setActiveTab(item.id!); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 group ${activeTab === item.id ? 'bg-white text-[#102d62] shadow-lg translate-x-1' : 'text-blue-200 hover:bg-blue-900/50 hover:text-white'}`}>
                {item.icon && <item.icon size={20} className={activeTab === item.id ? 'text-[#01ccff]' : 'group-hover:text-[#01ccff] transition-colors'} />}
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="p-6 relative z-10 border-t border-blue-900/30">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-blue-800 flex items-center justify-center text-blue-200 font-bold text-sm">{currentUser.name?.charAt(0) || currentUser.email?.charAt(0)}</div>
            <div className="overflow-hidden"><div className="text-sm font-bold truncate">{currentUser.name || currentUser.displayName}</div><div className="text-xs text-blue-300 capitalize">{currentUser.role.replace('_', ' ')}</div></div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-3 bg-blue-900/40 hover:bg-red-500/80 text-blue-200 hover:text-white rounded-xl text-xs font-bold transition-colors"><LogOut size={14} /> Đăng Xuất</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative overflow-y-auto h-screen bg-[#f8f9fa] w-full">
        <MenuToggle isOpen={isSidebarOpen} toggle={() => setIsSidebarOpen(!isSidebarOpen)} />
        
        <div className="max-w-7xl mx-auto p-4 md:p-10 lg:p-12 pt-16 md:pt-10">
          
          {/* DASHBOARD */}
          {activeTab === 'dashboard' && (
            <DashboardTab 
              currentUser={currentUser} 
              showLoading={showLoading} 
              availableBrands={availableBrands} 
              setActiveTab={setActiveTab}
              generations={generations}
              auditors={auditors}
            />
          )}

          {/* GENERATOR */}
          {activeTab === 'generator' && (
            <GeneratorTab 
              availableBrands={availableBrands}
              selectedBrandId={selectedBrandId}
              setSelectedBrandId={setSelectedBrandId}
              systemPrompts={systemPrompts}
              currentUser={currentUser}
              setToast={setToast}
              auditors={auditors}
              guidelines={guidelines}
            />
          )}

          {/* AUDITOR */}
          {activeTab === 'auditor' && (
            <AuditorTab
              availableBrands={availableBrands}
              selectedBrandId={selectedBrandId}
              setSelectedBrandId={setSelectedBrandId}
              systemPrompts={systemPrompts}
              currentUser={currentUser}
              setToast={setToast}
              guidelines={guidelines}
              auditors={auditors}
            />
          )}

          {/* HISTORY: GENERATOR */}
          {activeTab === 'generations' && (
            <HistoryGenerationsTab 
              generations={generations}
              brands={brands}
              availableBrands={availableBrands}
              setToast={setToast}
              currentUser={currentUser}
              systemPrompts={systemPrompts}
              auditors={auditors}
              guidelines={guidelines}
            />
          )}

          {/* HISTORY: AUDITOR */}
          {activeTab === 'audits' && (
            <HistoryAuditsTab 
              auditors={auditors}
              brands={brands}
              availableBrands={availableBrands}
            />
          )}

          {/* ANALYTICS */}
          {activeTab === 'analytics' && (
            <AnalyticsTab 
              availableBrands={availableBrands}
            />
          )}

          {/* USERS */}
          {activeTab === 'users' && (
            <UsersTab
              users={users}
              brands={brands} 
              currentUser={currentUser}
              setEditingUser={setEditingUser}
              setIsUserModalOpen={setIsUserModalOpen}
              handleDeleteUser={handleDeleteUser}
            />
          )}

          {/* BRANDS */}
          {activeTab === 'brands' && (
            <BrandsTab 
              availableBrands={availableBrands}
              currentUser={currentUser}
              setEditingBrand={setEditingBrand}
              setIsBrandModalOpen={setIsBrandModalOpen}
              handleDeleteBrand={handleDeleteBrand}
            />
          )}

          {/* GUIDELINES */}
          {activeTab === 'guidelines' && (
            <GuidelinesTab 
              guidelines={guidelines}
              availableBrands={availableBrands}
              brands={brands}
              currentUser={currentUser}
              setToast={setToast}
              showConfirm={showConfirm}
            />
          )}

          {/* SETTINGS */}
          {activeTab === 'settings' && currentUser.role === 'admin' && (
            <SettingsTab 
              systemPrompts={systemPrompts}
              setSystemPrompts={setSystemPrompts}
              showConfirm={showConfirm}
              setToast={setToast}
            />
          )}

        </div>
      </main>

      {/* Modals */}
      <BrandModal isOpen={isBrandModalOpen} onClose={() => setIsBrandModalOpen(false)} onSave={handleSaveBrand} brand={editingBrand} currentUser={currentUser} setToast={setToast} />
      <UserModal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} onSave={handleSaveUser} user={editingUser} brands={availableBrands} currentUserRole={currentUser.role} />
      
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-10 z-[70] ${toast.type === 'success' ? 'bg-[#102d62] text-white' : 'bg-red-500 text-white'}`}>
           {toast.type === 'success' ? <CheckCircle size={20} className="text-[#01ccff]"/> : <AlertTriangle size={20}/>}
           <span className="font-bold text-sm">{toast.message}</span>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({...confirmModal, isOpen: false})} onConfirm={confirmModal.onConfirm} title={confirmModal.title} message={confirmModal.message} type={confirmModal.type} />
    </div>
  );
};

export default App;
