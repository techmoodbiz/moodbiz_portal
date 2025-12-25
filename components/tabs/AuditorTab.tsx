
import React, { useState, useMemo, useEffect } from 'react';
import {
  Activity, RefreshCw, AlertTriangle, CheckCircle,
  Languages, BrainCircuit, Award, ShoppingBag,
  Layout, Globe, Mail, Facebook, Linkedin,
  Shield, Check, BookOpen, AlertCircle, Link as LinkIcon,
  ChevronDown, ChevronUp, ArrowRight, XCircle, FileText
} from 'lucide-react';
import { Brand, User, SystemPrompts, Guideline, AuditRule, Product } from '../../types';
import { SectionHeader, BrandSelector, CustomSelect, MultiSelect } from '../UIComponents';
import { auditContent, scrapeWebsiteContent } from '../../services/api';
import { SUPPORTED_LANGUAGES, PLATFORM_CONFIGS } from '../../constants';
import { db } from '../../firebase';
import firebase from '../../firebase';

interface AuditorTabProps {
  availableBrands: Brand[];
  selectedBrandId: string;
  setSelectedBrandId: (id: string) => void;
  systemPrompts: SystemPrompts;
  currentUser: User;
  setToast: (toast: any) => void;
  guidelines: Guideline[];
  auditors: any[];
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
  const [auditMode, setAuditMode] = useState<'text' | 'url'>('text');
  const [inputText, setInputText] = useState('');
  const [inputUrl, setInputUrl] = useState('');
  
  const [platform, setPlatform] = useState('Facebook Post');
  const [language, setLanguage] = useState('Vietnamese');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditStatus, setAuditStatus] = useState<string>(''); // 'scraping' | 'analyzing'
  const [auditResult, setAuditResult] = useState<any>(null);

  // Fetch Products khi đổi Brand
  useEffect(() => {
    if (!selectedBrandId) {
      setProducts([]);
      return;
    }
    const unsub = db.collection('products').where('brand_id', '==', selectedBrandId).onSnapshot(snap => {
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
      setSelectedProductIds([]); // Reset selection
    });
    return unsub;
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
      value: l.code,
      label: l.label,
      icon: l.flag
    }));
  }, []);

  const productOptions = useMemo(() => {
    const opts = [{ value: '', label: 'Chung (Toàn thương hiệu)', icon: Award }];
    products.forEach(p => {
      opts.push({ value: p.id, label: p.name, icon: ShoppingBag });
    });
    return opts;
  }, [products]);

  const handleAudit = async () => {
    const brand = availableBrands.find(b => b.id === selectedBrandId);
    if (!brand) { setToast({ type: 'error', message: 'Chưa chọn thương hiệu' }); return; }

    // Validation
    if (auditMode === 'text' && !inputText.trim()) {
      setToast({ type: 'error', message: 'Vui lòng nhập nội dung cần kiểm tra' }); return;
    }
    if (auditMode === 'url' && !inputUrl.trim()) {
      setToast({ type: 'error', message: 'Vui lòng nhập đường dẫn URL' }); return;
    }

    setIsAuditing(true);
    setAuditResult(null);

    let textToAnalyze = inputText;
    let urlToSave = '';

    try {
      // Step 1: Scrape if URL mode
      if (auditMode === 'url') {
        setAuditStatus('Đang quét nội dung từ Website...');
        urlToSave = inputUrl.trim();
        if (!/^https?:\/\//i.test(urlToSave)) {
          urlToSave = 'https://' + urlToSave;
        }
        
        const scrapedText = await scrapeWebsiteContent(urlToSave);
        if (!scrapedText || scrapedText.length < 50) {
          throw new Error("Không tìm thấy nội dung văn bản đủ dài tại URL này.");
        }
        textToAnalyze = scrapedText;
      }

      // Step 2: Audit
      setAuditStatus('Đang phân tích lỗi & chính tả...');
      
      const targetProducts = products.filter(p => selectedProductIds.includes(p.id));

      const res = await auditContent({
        brand,
        text: textToAnalyze,
        platform,
        language,
        products: targetProducts,
        rules: auditRules,
        platformRules: PLATFORM_CONFIGS[platform]?.audit_rules
      });

      setAuditResult(res.result);

      // Step 3: Save History
      const timestamp = Date.now();
      await db.collection('auditors').doc(`AUDIT_${brand.id}_${timestamp}`).set({
        id: `AUDIT_${brand.id}_${timestamp}`,
        brand_id: brand.id,
        brand_name: brand.name,
        user_id: currentUser.uid,
        user_name: currentUser.name || currentUser.displayName,
        input_data: {
          rawText: textToAnalyze,
          text: textToAnalyze, 
          url: urlToSave,
          platform,
          language,
          product_ids: selectedProductIds
        },
        output_data: res.result,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        type: 'manual_audit'
      });

    } catch (e: any) {
      setToast({ type: 'error', message: "Audit thất bại: " + e.message });
    } finally {
      setIsAuditing(false);
      setAuditStatus('');
    }
  };

  // Group Issues into 4 Categories
  const groupedIssues = useMemo(() => {
    const groups = {
      language: [] as any[],
      ai_logic: [] as any[],
      brand: [] as any[],
      product: [] as any[]
    };

    if (auditResult?.identified_issues) {
      auditResult.identified_issues.forEach((issue: any) => {
        const cat = (issue.category || '').toLowerCase();
        if (cat.includes('language')) groups.language.push(issue);
        else if (cat.includes('logic') || cat.includes('ai')) groups.ai_logic.push(issue);
        else if (cat.includes('brand')) groups.brand.push(issue);
        else if (cat.includes('product')) groups.product.push(issue);
        else groups.language.push(issue); // Fallback
      });
    }
    return groups;
  }, [auditResult]);

  const ResultBlock = ({ title, icon: Icon, issues, colorClass, bgClass, borderColor }: any) => (
    <div className={`rounded-[2rem] border ${borderColor} flex flex-col h-full overflow-hidden shadow-sm ${bgClass} transition-all hover:shadow-md`}>
      {/* Header */}
      <div className={`px-6 py-5 border-b ${borderColor} flex items-center justify-between bg-white/50 backdrop-blur-sm`}>
        <div className="flex items-center gap-3">
           <div className={`p-2.5 rounded-xl bg-white shadow-sm ${colorClass}`}>
             <Icon size={20} strokeWidth={2.5} />
           </div>
           <div>
             <h4 className={`text-[12px] font-black uppercase tracking-widest ${colorClass}`}>{title}</h4>
             <p className="text-[10px] text-slate-400 font-bold">Layer Check</p>
           </div>
        </div>
        <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${issues.length > 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
          {issues.length > 0 ? `${issues.length} Lỗi` : 'Đạt Chuẩn'}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-6 flex-1 overflow-y-auto custom-scrollbar space-y-4 max-h-[450px]">
        {issues.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-10 opacity-70">
             <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-3">
                <CheckCircle size={32} className="text-emerald-500" strokeWidth={2.5} />
             </div>
             <p className="text-[11px] font-black text-emerald-600 uppercase tracking-widest">Không phát hiện vi phạm</p>
          </div>
        ) : (
          issues.map((issue: any, idx: number) => (
            <div key={idx} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden group">
                {/* Header of Card */}
                <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                   <div className="flex items-center gap-2 overflow-hidden">
                      <AlertCircle size={14} className="text-red-500 shrink-0" />
                      {/* Hiển thị Citation (Trích dẫn quy tắc) - Mở rộng chiều rộng hiển thị */}
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate max-w-[200px]" title={issue.citation}>
                        {issue.citation || 'General Error'}
                      </span>
                   </div>
                   <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase shrink-0 ${issue.severity?.toLowerCase() === 'high' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                     {issue.severity}
                   </span>
                </div>

                {/* Diff View: Before/After */}
                <div className="p-4 grid grid-cols-1 gap-3">
                   {/* Incorrect Part */}
                   <div className="bg-red-50/50 p-3 rounded-xl border border-red-100/50 flex items-start gap-3">
                      <div className="mt-0.5"><XCircle size={14} className="text-red-500" /></div>
                      <div>
                         <p className="text-[13px] font-bold text-red-700 decoration-0 no-underline break-words">{issue.problematic_text}</p>
                      </div>
                   </div>

                   <div className="flex justify-center -my-2 relative z-10">
                      <div className="bg-white border border-slate-100 rounded-full p-1 text-slate-300 shadow-sm">
                         <ArrowRight size={12} className="rotate-90" />
                      </div>
                   </div>

                   {/* Correct Part */}
                   <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/50 flex items-start gap-3">
                      <div className="mt-0.5"><CheckCircle size={14} className="text-emerald-500" /></div>
                      <div>
                         <p className="text-[13px] font-bold text-emerald-800 break-words">{issue.suggestion}</p>
                      </div>
                   </div>
                </div>

                {/* Footer Reason & Source */}
                <div className="px-4 pb-3 pt-0 space-y-2">
                   <p className="text-[11px] text-slate-500 font-medium italic pl-1 border-l-2 border-slate-200">
                     {issue.reason}
                   </p>
                   {/* Trích dẫn rõ ràng hơn ở Footer */}
                   {issue.citation && issue.citation !== 'General Standard' && (
                     <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                        <FileText size={10} />
                        Source: <span className="text-[#102d62]">{issue.citation}</span>
                     </div>
                   )}
                </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="animate-in fade-in h-full flex flex-col pb-20">
      <SectionHeader title="Content Auditor" subtitle="Kiểm tra độ tuân thủ thương hiệu & chất lượng nội dung." />

      <div className="grid lg:grid-cols-12 gap-6 flex-1">
        
        {/* LEFT COLUMN: Controls & Input */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-premium border border-slate-100 flex flex-col gap-5 h-full">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">THƯƠNG HIỆU</label>
                <BrandSelector availableBrands={availableBrands} selectedBrandId={selectedBrandId} onChange={setSelectedBrandId} />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">SẢN PHẨM (TÙY CHỌN)</label>
                <MultiSelect 
                  options={productOptions} 
                  value={selectedProductIds} 
                  onChange={setSelectedProductIds} 
                  placeholder="Chọn sản phẩm"
                  icon={ShoppingBag}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">NGÔN NGỮ</label>
                  <CustomSelect options={languageOptions} value={language} onChange={setLanguage} icon={Globe} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">KÊNH</label>
                  <CustomSelect options={platformOptions} value={platform} onChange={setPlatform} />
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              {/* TAB SWITCHER */}
              <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
                  <button 
                    onClick={() => setAuditMode('text')} 
                    className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${auditMode === 'text' ? 'bg-[#102d62] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Văn bản
                  </button>
                  <button 
                    onClick={() => setAuditMode('url')} 
                    className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${auditMode === 'url' ? 'bg-[#102d62] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    URL
                  </button>
              </div>

              {auditMode === 'text' ? (
                <textarea 
                  className="w-full flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-[13px] font-medium text-[#102d62] outline-none focus:bg-white focus:ring-4 focus:ring-[#01ccff]/5 transition-all shadow-inner-soft custom-scrollbar resize-none min-h-[200px]" 
                  placeholder="Paste nội dung cần kiểm tra..." 
                  value={inputText} 
                  onChange={e => setInputText(e.target.value)} 
                />
              ) : (
                <div className="flex-1 flex flex-col justify-center bg-slate-50/50 rounded-2xl border border-slate-200 border-dashed p-4">
                   <div className="relative group">
                       <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#01ccff] transition-colors">
                           <LinkIcon size={16} />
                       </div>
                       <input 
                          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#102d62] outline-none focus:ring-4 focus:ring-[#01ccff]/10 focus:border-[#01ccff] transition-all shadow-sm"
                          placeholder="https://example.com..."
                          value={inputUrl}
                          onChange={e => setInputUrl(e.target.value)}
                       />
                   </div>
                </div>
              )}
            </div>

            <button 
              onClick={handleAudit} 
              disabled={isAuditing || (auditMode === 'text' ? !inputText : !inputUrl)} 
              className="w-full py-4 bg-[#102d62] text-white rounded-2xl font-black text-xs flex justify-center items-center gap-3 shadow-xl hover:bg-[#1a3e7d] transition-all active:scale-95 disabled:opacity-50 uppercase tracking-widest"
            >
              {isAuditing ? <RefreshCw className="animate-spin" size={18} /> : <Activity size={18} className="text-[#01ccff]" />}
              {isAuditing ? (auditStatus || 'Processing...') : 'CHẠY AUDIT'}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Results Grid */}
        <div className="lg:col-span-8 h-full">
          {auditResult ? (
            <div className="bg-white rounded-[2.5rem] shadow-premium border border-slate-50 h-full flex flex-col animate-in zoom-in-95 overflow-hidden p-6">
              
              {/* Summary Block */}
              <div className="mb-6 p-6 bg-[#102d62] rounded-3xl text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#01ccff] rounded-full blur-[80px] opacity-10 -mr-16 -mt-16 pointer-events-none"></div>
                  <div className="relative z-10 flex-1">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#01ccff] mb-2">Tổng quan Audit</div>
                    <p className="text-[13px] font-medium text-blue-100 leading-relaxed italic">"{auditResult.summary}"</p>
                  </div>
                  <div className="text-center md:text-right shrink-0 relative z-10">
                     <div className="text-4xl font-black text-white">{auditResult.identified_issues.length}</div>
                     <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">Rủi ro phát hiện</div>
                  </div>
              </div>

              {/* 4-Block Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4">
                 <ResultBlock 
                    title="Ngôn ngữ & Chính tả" 
                    icon={Languages} 
                    issues={groupedIssues.language} 
                    colorClass="text-blue-600"
                    bgClass="bg-blue-50/20"
                    borderColor="border-blue-100"
                 />
                 <ResultBlock 
                    title="AI Logic & Chính xác" 
                    icon={BrainCircuit} 
                    issues={groupedIssues.ai_logic} 
                    colorClass="text-purple-600"
                    bgClass="bg-purple-50/20"
                    borderColor="border-purple-100"
                 />
                 <ResultBlock 
                    title="Thương hiệu (Brand)" 
                    icon={Award} 
                    issues={groupedIssues.brand} 
                    colorClass="text-[#102d62]"
                    bgClass="bg-slate-50/50"
                    borderColor="border-slate-200"
                 />
                 <ResultBlock 
                    title="Sản phẩm (Product)" 
                    icon={ShoppingBag} 
                    issues={groupedIssues.product} 
                    colorClass="text-emerald-600"
                    bgClass="bg-emerald-50/20"
                    borderColor="border-emerald-100"
                 />
              </div>

            </div>
          ) : (
            <div className="h-full bg-slate-50/50 rounded-[4rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 p-12 group transition-all hover:bg-white">
              <div className="w-28 h-28 bg-white rounded-[3rem] shadow-premium flex items-center justify-center mb-8 text-slate-200 group-hover:scale-110 transition-all duration-500 group-hover:text-[#01ccff]">
                <Shield size={64} strokeWidth={1} />
              </div>
              <h3 className="font-black text-[#102d62] text-3xl mb-4 tracking-tight uppercase">Sẵn sàng kiểm duyệt</h3>
              <p className="text-sm text-slate-400 text-center max-w-md font-medium leading-relaxed">
                Hệ thống sẽ đối soát văn bản trên 4 lớp độc lập: Ngôn ngữ (Chính tả), Logic, Brand và Sản phẩm.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditorTab;
