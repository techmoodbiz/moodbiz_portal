import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  RefreshCw, Globe, Zap, ShieldCheck,
  AlertTriangle, Languages, BrainCircuit, Award, 
  ShoppingBag, Check, Copy, Sparkles, Activity, 
  Layout, Shield, CheckCircle, Mail, Facebook, 
  Linkedin, Building2, ChevronRight, AlertCircle, Search,
  ArrowRight, Info
} from 'lucide-react';
import { Brand, Auditor, SystemPrompts, User, AuditRule, Product, LanguageCode } from '../../types';
import { BrandSelector, CustomSelect, SectionHeader } from '../UIComponents';
import { PLATFORM_CONFIGS, SUPPORTED_LANGUAGES, AUDIT_CATEGORIES } from '../../constants';
import { auditContent, scrapeWebsiteContent } from '../../services/api';
import firebase, { db } from '../../firebase';

interface AuditIssue {
  category: string;
  problematic_text: string;
  reason: string;
  severity: string;
  suggestion: string;
}

interface AuditorTabProps {
  availableBrands: Brand[];
  selectedBrandId: string;
  setSelectedBrandId: (id: string) => void;
  systemPrompts: SystemPrompts;
  currentUser: User;
  setToast: (toast: any) => void;
  guidelines: any[];
  auditors: Auditor[];
  auditRules: AuditRule[];
}

const AuditorTab: React.FC<AuditorTabProps> = ({
  availableBrands,
  selectedBrandId,
  setSelectedBrandId,
  currentUser,
  setToast,
  auditRules
}) => {
  const [inputType, setInputType] = useState<'text' | 'url'>('text');
  const [auditUrl, setAuditUrl] = useState('');
  const [auditText, setAuditText] = useState('');
  const [auditPlatform, setAuditPlatform] = useState("Facebook Post");
  const [auditLanguage, setAuditLanguage] = useState<LanguageCode>("vi");
  const [auditResult, setAuditResult] = useState<any>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');

  useEffect(() => {
    if (!selectedBrandId) return;
    return db.collection('products').where('brand_id', '==', selectedBrandId).onSnapshot(snap => {
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    });
  }, [selectedBrandId]);

  const platformOptions = useMemo(() => {
    return Object.keys(PLATFORM_CONFIGS).map(key => {
      let icon = Layout;
      if (key.includes('Facebook')) icon = Facebook;
      if (key.includes('LinkedIn')) icon = Linkedin;
      if (key.includes('Email')) icon = Mail;
      if (key.includes('Website')) icon = Globe;
      return { value: key, label: key, icon };
    });
  }, []);

  const languageOptions = useMemo(() => {
    return SUPPORTED_LANGUAGES.map(l => ({
      value: l.code === 'Vietnamese' ? 'vi' : l.code === 'English' ? 'en' : 'ja',
      label: l.label,
      icon: l.flag
    }));
  }, []);

  const productOptions = useMemo(() => {
    const opts = [{ value: '', label: 'Nội dung thương hiệu chung', icon: Building2 }];
    products.forEach(p => {
      opts.push({ value: p.id, label: p.name, icon: ShoppingBag });
    });
    return opts;
  }, [products]);

  const normalizeCategory = useCallback((cat: string): string => {
    const s = (cat || '').toLowerCase().trim();
    if (s.includes('brand') || s.includes('thương hiệu') || s.includes('personality') || s.includes('voice')) return 'brand';
    if (s.includes('logic') || s.includes('ai') || s.includes('fact')) return 'ai_logic';
    if (s.includes('product') || s.includes('sản phẩm') || s.includes('usp')) return 'product';
    return 'language'; 
  }, []);

  const handleAudit = async () => {
    const brand = availableBrands.find(b => b.id === selectedBrandId);
    if (!brand) { setToast({ type: 'error', message: "Vui lòng chọn thương hiệu." }); return; }
    let textToAudit = auditText;
    setIsAuditing(true);
    setAuditResult(null);

    try {
      if (inputType === 'url') {
        if (!auditUrl) throw new Error("Vui lòng nhập URL.");
        textToAudit = await scrapeWebsiteContent(auditUrl);
        setAuditText(textToAudit);
      }

      if (!textToAudit.trim()) throw new Error("Nội dung trống.");

      const selectedProduct = products.find(p => p.id === selectedProductId);
      const platformRules = PLATFORM_CONFIGS[auditPlatform]?.audit_rules || "";

      // CALL BACKEND API (Now the backend handles Prompt Engineering)
      const response = await auditContent({ 
        brand, 
        text: textToAudit,
        platform: auditPlatform,
        language: auditLanguage,
        product: selectedProduct,
        rules: auditRules,
        platformRules
      });
      
      let parsedResult = response.result;
      
      // Standardize categories from AI response
      const standardizedIssues = (parsedResult.identified_issues || []).map((issue: any) => ({
        ...issue,
        category: normalizeCategory(issue.category)
      }));
      parsedResult.identified_issues = standardizedIssues;

      setAuditResult(parsedResult);
      
      // Log to history
      await db.collection('auditors').doc(`AUDIT_${brand.id}_${Date.now()}`).set({
        brand_id: brand.id,
        user_id: currentUser.uid,
        user_name: currentUser.name || currentUser.displayName,
        input_data: { text: textToAudit, platform: auditPlatform, language: auditLanguage },
        output_data: parsedResult,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });

      setToast({ type: 'success', message: 'Hệ thống đã soi xong 4 lớp quy chuẩn!' });
    } catch (e: any) { 
      setToast({ type: 'error', message: e.message || "Lỗi hệ thống." }); 
    } finally { 
      setIsAuditing(false); 
    }
  };

  const issuesByLayer = useMemo(() => {
    if (!auditResult) return { language: [], ai_logic: [], brand: [], product: [] };
    const all = (auditResult.identified_issues || []) as AuditIssue[];
    return {
      language: all.filter(i => i.category === 'language'),
      ai_logic: all.filter(i => i.category === 'ai_logic'),
      brand: all.filter(i => i.category === 'brand'),
      product: all.filter(i => i.category === 'product'),
    };
  }, [auditResult]);

  const LayerCard = ({ category }: { category: keyof typeof AUDIT_CATEGORIES }) => {
    const config = AUDIT_CATEGORIES[category];
    const issues = issuesByLayer[category] || [];
    const Icon = config.icon;
    
    const displayStatus = !auditResult ? 'AWAITING' : (issues.length === 0 ? 'COMPLIANT' : 'VIOLATION');
    const isPass = displayStatus === 'COMPLIANT' || displayStatus === 'AWAITING';

    return (
      <div className={`bg-white rounded-[2.5rem] shadow-premium flex flex-col h-full overflow-hidden border transition-all duration-500 ${!isPass ? 'border-red-200 ring-4 ring-red-500/5' : 'border-slate-100 hover:border-slate-200'}`}>
        <div className={`px-6 py-5 flex items-center justify-between border-b ${!isPass ? 'bg-red-50/50 border-red-100' : 'bg-slate-50/50 border-slate-100'}`}>
           <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl shadow-sm ${!isPass ? 'bg-red-500 text-white' : 'bg-white text-[#102d62]'}`}>
                <Icon size={18} />
              </div>
              <div>
                <h4 className="text-[11px] font-black text-[#102d62] uppercase tracking-[0.15em] leading-none">{config.label}</h4>
                <p className={`text-[8px] font-bold mt-1 uppercase tracking-tighter ${!isPass ? 'text-red-500' : 'text-slate-400'}`}>
                  {displayStatus}
                </p>
              </div>
           </div>
           {auditResult && (
             <div className={`px-2 py-1 rounded-lg text-[9px] font-black ${issues.length > 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {issues.length > 0 ? `${issues.length} ISSUES` : 'PASSED'}
             </div>
           )}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {issues.length > 0 ? (
            <div className="space-y-5 animate-in slide-in-from-bottom-2">
              {issues.map((issue: AuditIssue, i: number) => (
                <div key={i} className="group/issue">
                   <div className="flex items-center gap-2 mb-2">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${issue.severity?.toLowerCase() === 'high' ? 'bg-red-500 text-white' : 'bg-amber-400 text-white'}`}>
                        {issue.severity}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                         Audit Discovery
                      </span>
                   </div>
                   <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group-hover/issue:border-red-100 transition-colors">
                      <p className="text-[11px] font-bold text-slate-700 leading-relaxed mb-3 italic">"{issue.problematic_text}"</p>
                      <div className="flex items-start gap-2 mb-3">
                         <AlertCircle size={12} className="text-red-400 mt-0.5 shrink-0" />
                         <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{issue.reason}</p>
                      </div>
                      <div className="bg-emerald-50/80 p-3 rounded-xl border border-emerald-100/50">
                         <div className="flex items-center gap-1.5 mb-1.5">
                            <Check size={10} className="text-emerald-500" />
                            <span className="text-[9px] font-black text-emerald-600 uppercase">Suggestion</span>
                         </div>
                         <p className="text-[10px] text-[#102d62] font-black leading-relaxed">{issue.suggestion}</p>
                      </div>
                   </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center py-10 opacity-30 group">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${!auditResult ? 'bg-slate-50 text-slate-300' : 'bg-emerald-50 text-emerald-500'}`}>
                {!auditResult ? <Shield size={32} /> : <ShieldCheck size={32} />}
              </div>
              <p className="text-[10px] font-black text-[#102d62] uppercase tracking-[0.2em]">
                {!auditResult ? 'Awaiting Scan' : 'Standard Compliance'}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="animate-in fade-in h-full flex flex-col pb-20">
      <SectionHeader title="Voice Auditor Ultra" subtitle="Hệ thống đối soát 4 lớp độc lập: Ngôn ngữ, Logic, Brand và Product.">
        <div className="bg-[#102d62] px-4 py-2 rounded-xl flex items-center gap-3 text-white">
           <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="text-[10px] font-black uppercase tracking-widest">Active QC</span>
           </div>
           <div className="w-px h-4 bg-white/20"></div>
           <span className="text-[10px] font-black uppercase tracking-widest text-[#01ccff]">Multi-Layer Engine</span>
        </div>
      </SectionHeader>

      <div className="grid lg:grid-cols-12 gap-10 flex-1">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-premium border border-slate-50 space-y-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">PROFILE THƯƠNG HIỆU</label>
              <BrandSelector availableBrands={availableBrands} selectedBrandId={selectedBrandId} onChange={setSelectedBrandId} />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">SẢN PHẨM / DỊCH VỤ</label>
              <CustomSelect
                options={productOptions}
                value={selectedProductId}
                onChange={setSelectedProductId}
                placeholder="Nội dung thương hiệu chung"
              />
            </div>

            <div className="space-y-4">
               <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                  <button onClick={() => setInputType('text')} className={`flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${inputType === 'text' ? 'bg-[#102d62] text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Văn Bản</button>
                  <button onClick={() => setInputType('url')} className={`flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${inputType === 'url' ? 'bg-[#102d62] text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>URL</button>
               </div>
               
               {inputType === 'text' ? (
                 <textarea 
                   className="w-full p-6 bg-slate-50 border border-slate-200 rounded-[2rem] text-[13px] min-h-[220px] font-medium text-[#102d62] outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all shadow-inner-soft custom-scrollbar" 
                   placeholder="Nhập nội dung cần soi lỗi..." 
                   value={auditText} 
                   onChange={e => setAuditText(e.target.value)} 
                 />
               ) : (
                 <div className="relative group">
                   <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#01ccff] transition-colors" size={18} />
                   <input type="url" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[13px] font-bold text-[#102d62] outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all shadow-inner-soft" placeholder="Dán link bài viết..." value={auditUrl} onChange={e => setAuditUrl(e.target.value)} />
                 </div>
               )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">NGÔN NGỮ</label>
                <CustomSelect options={languageOptions} value={auditLanguage} onChange={(val) => setAuditLanguage(val as LanguageCode)} icon={Globe} />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">KÊNH ĐĂNG</label>
                <CustomSelect options={platformOptions} value={auditPlatform} onChange={setAuditPlatform} />
              </div>
            </div>

            <button 
              onClick={handleAudit} 
              disabled={isAuditing || (!auditText && !auditUrl)} 
              className="w-full py-5 bg-[#102d62] text-white rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] flex justify-center items-center gap-3 shadow-xl hover:bg-[#1a3e7d] transition-all disabled:opacity-50 active:scale-95"
            >
              {isAuditing ? <RefreshCw className="animate-spin" size={20} /> : <Zap size={20} className="text-[#01ccff]" />}
              {isAuditing ? 'ĐANG SOI LỖI...' : 'BẮT ĐẦU KIỂM DUYỆT'}
            </button>
          </div>
        </div>

        <div className="lg:col-span-8 flex flex-col gap-8">
          <div className="bg-white p-8 rounded-[3rem] shadow-premium border border-slate-50 flex flex-col md:flex-row items-center justify-between gap-8">
             <div className="flex-1 grid grid-cols-4 gap-4 w-full">
                {(Object.keys(AUDIT_CATEGORIES) as Array<keyof typeof AUDIT_CATEGORIES>).map((key) => {
                  const config = AUDIT_CATEGORIES[key];
                  const issues = issuesByLayer[key] || [];
                  const status = !auditResult ? '---' : (issues.length === 0 ? 'PASS' : 'FAIL');
                  const isPass = status === 'PASS' || status === '---';
                  
                  return (
                    <div key={key} className="flex flex-col items-center">
                       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-inner transition-colors duration-500 ${isPass ? 'bg-slate-50 text-slate-400' : 'bg-red-50 text-red-500'}`}>
                          <config.icon size={24} />
                       </div>
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{config.label}</span>
                       <span className={`text-[10px] font-black uppercase ${!auditResult ? 'text-slate-200' : isPass ? 'text-emerald-500' : 'text-red-500'}`}>{status}</span>
                    </div>
                  );
                })}
             </div>

             <div className="hidden md:block w-px h-16 bg-slate-100"></div>

             <div className="flex items-center gap-8 pl-0 md:pl-10 pr-0 md:pr-6 w-full md:w-auto justify-between md:justify-end">
                <div className="text-right">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">DEFECT SCORE</span>
                  <div className="flex items-end gap-1.5 justify-end">
                    <span className={`text-5xl font-black leading-none ${auditResult?.identified_issues?.length > 0 ? 'text-red-500' : 'text-[#102d62]'}`}>
                      {auditResult?.identified_issues?.length || 0}
                    </span>
                    <span className="text-slate-300 font-bold text-sm mb-1">ISSUES</span>
                  </div>
                </div>
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500 ${auditResult?.identified_issues?.length > 0 ? 'bg-red-500 text-white' : 'bg-slate-50 text-slate-200'}`}>
                   {auditResult?.identified_issues?.length > 0 ? <AlertTriangle size={36} /> : <ShieldCheck size={36} />}
                </div>
             </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 flex-1">
             <LayerCard category="language" />
             <LayerCard category="ai_logic" />
             <LayerCard category="brand" />
             <LayerCard category="product" />
          </div>

          {auditResult?.rewritten_text && (
            <div className="bg-[#102d62] p-10 rounded-[3rem] shadow-2xl relative overflow-hidden animate-in slide-up">
               <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#01ccff] rounded-full mix-blend-overlay opacity-10 blur-[120px] -mr-32 -mt-32 pointer-events-none"></div>
               <div className="relative z-10">
                  <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-6 border-b border-white/10 pb-8">
                    <div className="flex items-center gap-5">
                      <div className="p-4 bg-white/10 backdrop-blur-md text-[#01ccff] rounded-3xl border border-white/10 shadow-xl">
                        <Sparkles size={32} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-tight">Optimized Result</h3>
                        <p className="text-blue-300 text-[10px] font-black uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                           <Activity size={12} /> AI-Refined Masterpiece
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => { navigator.clipboard.writeText(auditResult.rewritten_text); setToast({ type: 'success', message: 'Đã copy bản tối ưu!' }); }} 
                      className="w-full sm:w-auto px-8 py-4 bg-[#01ccff] text-[#102d62] rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-white transition-all shadow-xl active:scale-95"
                    >
                      <Copy size={20} /> Copy Result
                    </button>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm p-10 rounded-[2.5rem] border border-white/5 text-blue-50 leading-[2] text-[17px] font-medium whitespace-pre-wrap selection:bg-[#01ccff]/30">
                    {auditResult.rewritten_text}
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditorTab;
