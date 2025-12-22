
import React, { useState, useMemo } from 'react';
import { 
  RefreshCw, Globe, Zap, ShieldCheck, 
  SearchCode, AlertTriangle, Languages,
  ShieldAlert, BrainCircuit, Award, ShoppingBag, X, FileCode, Check,
  Copy, Sparkles, AlertCircle, Activity, Layout, Shield, CheckCircle, ChevronDown
} from 'lucide-react';
import { Brand, Auditor, SystemPrompts, User, AuditRule } from '../../types';
import { SectionHeader, BrandSelector } from '../UIComponents';
import { PLATFORM_CONFIGS, SUPPORTED_LANGUAGES, AUDIT_CATEGORIES } from '../../constants';
import { auditContent, scrapeWebsiteContent } from '../../services/api';
import firebase, { db } from '../../firebase';

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
  systemPrompts,
  currentUser,
  setToast,
  guidelines,
  auditors,
  auditRules
}) => {
  const [inputType, setInputType] = useState<'text' | 'url'>('text');
  const [auditUrl, setAuditUrl] = useState('');
  const [auditText, setAuditText] = useState('');
  const [auditPlatform, setAuditPlatform] = useState("Facebook Post");
  const [auditLanguage, setAuditLanguage] = useState("Vietnamese");
  const [auditResult, setAuditResult] = useState<any>(null);
  const [isAuditing, setIsAuditing] = useState(false);

  const activeRules = useMemo(() => {
    return auditRules.filter(r => {
      const ruleType = r.type;
      const ruleCode = (r.code || '').trim().toLowerCase();
      const currentLang = auditLanguage.toLowerCase();
      const currentBrand = selectedBrandId.toLowerCase();
      if (ruleType === 'ai_logic') return true;
      if (ruleCode === 'global') return true;
      if (ruleType === 'language' && ruleCode === currentLang) return true;
      if (ruleType === 'brand' && ruleCode === currentBrand) return true;
      return false;
    });
  }, [auditRules, auditLanguage, selectedBrandId]);

  const dynamicRulesContext = useMemo(() => {
    if (activeRules.length === 0) return "Không có quy chuẩn SOP bổ sung được nạp.";
    return activeRules.map(r => `--- SOP: ${r.label} [${r.type}] ---\n${r.content}`).join('\n\n');
  }, [activeRules]);

  const handleAudit = async () => {
    const brand = availableBrands.find(b => b.id === selectedBrandId);
    if (!brand) {
      setToast({ type: 'error', message: "Vui lòng chọn thương hiệu." });
      return;
    }

    let textToAudit = auditText;
    setIsAuditing(true);
    setAuditResult(null);

    try {
      if (inputType === 'url') {
        if (!auditUrl) throw new Error("Vui lòng nhập URL.");
        setToast({ type: 'info', message: "Đang lấy nội dung từ website..." });
        textToAudit = await scrapeWebsiteContent(auditUrl);
        setAuditText(textToAudit);
      }

      if (!textToAudit.trim()) throw new Error("Nội dung trống.");

      const approvedGuide = guidelines.find(g => g.brand_id === brand.id && g.status === 'approved');
      const guideContext = approvedGuide?.guideline_text ? `GUIDELINE:\n${approvedGuide.guideline_text}\n` : '';
      
      const isWebsite = auditPlatform === 'Website / SEO Blog';
      const basePrompt = isWebsite ? systemPrompts.auditor.website : systemPrompts.auditor.social;
      
      const prompt = basePrompt
        .replace(/{text}/g, textToAudit)
        .replace(/{dynamic_rules}/g, dynamicRulesContext)
        .replace(/{brand_name}/g, brand.name)
        .replace(/{brand_personality}/g, brand.brand_personality?.join(', ') || brand.personality)
        .replace(/{brand_voice}/g, brand.tone_of_voice || brand.voice)
        .replace(/{core_values}/g, brand.core_values?.join(', ') || 'N/A')
        .replace(/{do_words}/g, brand.do_words?.join(', ') || 'N/A')
        .replace(/{dont_words}/g, brand.dont_words?.join(', ') || 'N/A')
        .replace(/{guideline}/g, guideContext);

      const response = await auditContent({ brand, contentType: isWebsite ? 'website' : 'social', prompt });
      
      let parsedResult = response.result;
      if (typeof parsedResult === 'string') {
        try {
          parsedResult = JSON.parse(parsedResult.replace(/```json?/gi, '').replace(/```/g, ''));
        } catch {
          throw new Error("Dữ liệu trả về từ AI không đúng định dạng JSON.");
        }
      }

      const finalResult = { 
        ...parsedResult, 
        canPublish: (parsedResult.identified_issues?.length || 0) === 0,
        content_type: auditPlatform
      };
      
      setAuditResult(finalResult);

      await db.collection('auditors').doc(`AUD_${brand.id}_${Date.now()}`).set({
        id: `AUD_${brand.id}_${Date.now()}`,
        brand_id: brand.id,
        brand_name: brand.name,
        user_id: currentUser.uid,
        user_name: currentUser.name || currentUser.displayName,
        input_data: { 
          rawText: textToAudit, 
          text: textToAudit, 
          url: inputType === 'url' ? auditUrl : null,
          language: auditLanguage,
          platform: auditPlatform
        },
        output_data: finalResult,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      });

      setToast({ type: 'success', message: 'Hoàn tất kiểm duyệt nội dung!' });
    } catch (e: any) {
      setToast({ type: 'error', message: e.message || "Lỗi kiểm duyệt." });
    } finally {
      setIsAuditing(false);
    }
  };

  const IssueBlock = ({ category, issues }: { category: keyof typeof AUDIT_CATEGORIES, issues: any[] }) => {
    const config = AUDIT_CATEGORIES[category];
    const Icon = config.icon;
    
    return (
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-premium flex flex-col overflow-hidden h-full group hover:border-[#01ccff]/20 transition-all duration-300">
        <div className={`p-5 border-b border-slate-50 ${config.bg} flex justify-between items-center shrink-0`}>
          <div className="flex items-center gap-3">
             <div className={`p-2 rounded-xl bg-white shadow-sm ${config.color}`}><Icon size={16} /></div>
             <div>
                <h4 className={`text-[10px] font-black ${config.color} uppercase tracking-widest`}>{config.label} Layer</h4>
                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tight">{config.description}</p>
             </div>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${issues.length > 0 ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>
             {issues.length}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-4">
          {issues.length > 0 ? issues.map((issue, i) => (
            <div key={i} className="animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between mb-1.5">
                 <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase border ${issue.severity?.toLowerCase() === 'high' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                   {issue.severity} Severity
                 </span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 relative group/item hover:bg-white transition-colors">
                <div className="text-[12px] font-bold text-slate-800 mb-2 leading-relaxed italic border-l-2 border-slate-200 pl-3">
                  "{issue.problematic_text}"
                </div>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed mb-3">{issue.reason}</p>
                <div className="bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100 flex gap-2">
                   <Check size={12} className="text-emerald-500 mt-0.5 shrink-0" />
                   <p className="text-[11px] text-emerald-800 font-bold"><span className="text-emerald-500">Sửa:</span> {issue.suggestion}</p>
                </div>
              </div>
            </div>
          )) : (
            <div className="h-full flex flex-col items-center justify-center py-10 animate-in fade-in">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-400 mb-3 shadow-inner">
                <ShieldCheck size={28} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600/60">Tương thích tốt</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const categorizedIssues = {
    language: auditResult?.identified_issues?.filter((i: any) => i.category === 'language') || [],
    ai_logic: auditResult?.identified_issues?.filter((i: any) => i.category === 'ai_logic') || [],
    brand: auditResult?.identified_issues?.filter((i: any) => i.category === 'brand') || [],
    product: auditResult?.identified_issues?.filter((i: any) => i.category === 'product') || []
  };

  return (
    <div className="animate-in fade-in h-full flex flex-col max-w-[1400px] mx-auto">
      <SectionHeader title="VOICE AUDITOR" subtitle="Kiểm duyệt nội dung dựa trên Brand Profile & SOP Rules. Tuyệt đối không điểm số, chỉ tập trung vào rủi ro." />
      
      <div className="grid lg:grid-cols-12 gap-8 flex-1">
        {/* Left Panel */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-premium border border-slate-100 flex flex-col gap-6">
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">PROFILE ĐỐI SOÁT</label>
              <BrandSelector availableBrands={availableBrands} selectedBrandId={selectedBrandId} onChange={setSelectedBrandId} />
            </div>

            <div className="flex bg-slate-100 p-1.5 rounded-2xl">
              <button onClick={() => setInputType('text')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${inputType === 'text' ? 'bg-[#102d62] text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>VĂN BẢN</button>
              <button onClick={() => setInputType('url')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${inputType === 'url' ? 'bg-[#102d62] text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>ĐƯỜNG LINK</button>
            </div>

            {inputType === 'text' ? (
              <textarea className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-[13px] min-h-[220px] font-medium text-[#102d62] outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all shadow-inner-soft custom-scrollbar" placeholder="Dán nội dung bản thảo tại đây..." value={auditText} onChange={e => setAuditText(e.target.value)} />
            ) : (
              <input type="url" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold text-[#102d62] outline-none focus:bg-white shadow-inner-soft" placeholder="https://..." value={auditUrl} onChange={e => setAuditUrl(e.target.value)} />
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="relative group">
                <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#102d62] outline-none appearance-none" value={auditLanguage} onChange={e => setAuditLanguage(e.target.value)}>
                  {SUPPORTED_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
              <div className="relative group">
                <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#102d62] outline-none appearance-none" value={auditPlatform} onChange={e => setAuditPlatform(e.target.value)}>
                  {Object.keys(PLATFORM_CONFIGS).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <button onClick={handleAudit} disabled={isAuditing} className="w-full py-5 bg-[#102d62] text-white rounded-xl font-black text-sm flex justify-center items-center gap-3 shadow-xl hover:bg-[#0a1d40] transition-all disabled:opacity-50 uppercase tracking-widest">
              {isAuditing ? <RefreshCw className="animate-spin" size={20} /> : <Activity size={20} className="text-[#01ccff]" />} 
              {isAuditing ? 'ĐANG QUÉT...' : 'BẮT ĐẦU AUDIT'}
            </button>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><ShieldCheck size={14} className="text-[#01ccff]" /> Active SOP Rules ({activeRules.length})</h4>
             <div className="flex flex-wrap gap-2">
                {activeRules.map(r => (
                   <span key={r.id} className="px-2.5 py-1 bg-slate-50 text-[#102d62] rounded-lg border border-slate-100 text-[9px] font-bold uppercase tracking-tight">{r.label}</span>
                ))}
             </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="lg:col-span-9 flex flex-col h-full overflow-hidden">
          {auditResult ? (
            <div className="flex flex-col h-full animate-in zoom-in-95 space-y-6">
              <div className={`rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-premium ${auditResult.canPublish ? 'bg-emerald-600' : 'bg-[#102d62]'}`}>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                   <div className="flex-1">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[9px] font-black uppercase tracking-widest mb-3">Compliance Insight</div>
                      <h2 className="text-3xl font-black font-head uppercase tracking-tight leading-tight">{auditResult.canPublish ? 'PHÊ DUYỆT (COMPLIANT)' : `PHÁT HIỆN ${auditResult.identified_issues?.length || 0} ĐIỂM RỦI RO`}</h2>
                      <p className="mt-3 text-white/70 font-bold text-[13px] leading-relaxed max-w-2xl italic opacity-90">"{auditResult.summary}"</p>
                   </div>
                   <div className="shrink-0 w-24 h-24 rounded-full border-4 border-white/10 flex items-center justify-center bg-white/5 backdrop-blur-md">
                      {auditResult.canPublish ? <CheckCircle size={48} className="text-emerald-300" /> : <AlertTriangle size={48} className="text-amber-400" />}
                   </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0 h-[420px]">
                <IssueBlock category="language" issues={categorizedIssues.language} />
                <IssueBlock category="ai_logic" issues={categorizedIssues.ai_logic} />
                <IssueBlock category="brand" issues={categorizedIssues.brand} />
                <IssueBlock category="product" issues={categorizedIssues.product} />
              </div>

              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium flex flex-col overflow-hidden flex-1">
                <div className="p-5 border-b border-slate-50 bg-[#01ccff]/5 flex justify-between items-center shrink-0">
                  <h4 className="text-[10px] font-black text-[#102d62] uppercase tracking-widest flex items-center gap-2"><Sparkles size={16} className="text-[#01ccff]" /> Bản thảo tối ưu (Optimized Content)</h4>
                  <button onClick={() => { navigator.clipboard.writeText(auditResult.rewritten_text); setToast({type:'success', message:'Đã copy!'}); }} className="px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black text-[#102d62] uppercase flex items-center gap-1.5 transition-all shadow-sm">
                    <Copy size={14}/> Copy Result
                  </button>
                </div>
                <div className="p-10 overflow-y-auto flex-1 custom-scrollbar">
                   <div className="prose prose-sm max-w-none text-slate-700 font-medium leading-[1.8] text-[15px] whitespace-pre-wrap">{auditResult.rewritten_text}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 p-12 group transition-all hover:bg-white">
              <div className="w-20 h-20 bg-white rounded-[2rem] shadow-premium flex items-center justify-center mb-6 text-slate-200 group-hover:scale-110 transition-all duration-500">
                <ShieldCheck size={40} strokeWidth={1} />
              </div>
              <p className="font-black text-[#102d62] text-xl mb-3 tracking-tight uppercase">Ready for Compliance Check</p>
              <p className="text-[13px] text-slate-400 text-center max-w-xs font-medium leading-relaxed">Hệ thống sẽ đối soát nội dung với Persona, Voice, Core Values và Don't Words của Thương hiệu.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditorTab;
