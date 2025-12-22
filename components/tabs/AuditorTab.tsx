
import React, { useState, useMemo } from 'react';
import { 
  RefreshCw, ChevronDown, CheckCircle, Globe, Zap, ShieldCheck, 
  SearchCode, ListX, MessageCircleWarning, AlertTriangle, Quote, Languages,
  ShieldAlert, BrainCircuit, Award, ShoppingBag, X, Info, FileCode, Check,
  Copy, ArrowRight, Sparkles, AlertCircle, Activity
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
    if (!brand) { setToast({type:'error', message: 'Chưa chọn thương hiệu'}); return; }
    
    let textToAudit = auditText;
    let finalUrl = "";

    if (inputType === 'url') {
       if (!auditUrl) { setToast({type:'error', message: 'Vui lòng nhập URL'}); return; }
       setIsAuditing(true);
       try {
          const res = await scrapeWebsiteContent(auditUrl);
          textToAudit = res;
          finalUrl = auditUrl;
          setAuditText(res);
       } catch (e: any) {
          setIsAuditing(false);
          setToast({type:'error', message: "Lỗi scrape: " + e.message});
          return;
       }
    } else {
       if (!textToAudit.trim()) { setToast({type:'error', message: 'Vui lòng nhập nội dung'}); return; }
       setIsAuditing(true);
    }

    const approvedGuide = guidelines.find(g => g.brand_id === brand.id && g.status === 'approved');
    const guideContext = approvedGuide?.guideline_text ? `GUIDELINE:\n${approvedGuide.guideline_text}\n` : '';
    const isWebsite = auditPlatform === 'Website / SEO Blog';
    const basePromptTemplate = isWebsite ? systemPrompts.auditor.website : systemPrompts.auditor.social;
    
    const prompt = basePromptTemplate
      .replace(/{text}/g, textToAudit)
      .replace(/{dynamic_rules}/g, dynamicRulesContext)
      .replace(/{platform}/g, auditPlatform)
      .replace(/{brand_name}/g, brand.name)
      .replace(/{brand_personality}/g, brand.brand_personality?.join(', ') || brand.personality)
      .replace(/{brand_voice}/g, brand.tone_of_voice || brand.voice)
      .replace(/{guideline}/g, guideContext);

    try {
      const data = await auditContent({ brand, contentType: isWebsite ? 'website' : 'social', prompt });
      let outputData = data.result;
      if (typeof outputData === 'string') {
        try { outputData = JSON.parse(outputData.replace(/```json?/gi, '').replace(/```/g, '')); } 
        catch { outputData = { rawText: outputData }; }
      }
      const finalResult = { ...outputData, canPublish: (outputData.identified_issues?.length || 0) === 0, content_type: auditPlatform };
      setAuditResult(finalResult);

      await db.collection('auditors').doc(`AUD_${brand.id}_${Date.now()}`).set({
        id: `AUD_${brand.id}_${Date.now()}`,
        brand_id: brand.id, brand_name: brand.name,
        user_id: currentUser!.uid, user_name: currentUser!.name || currentUser!.displayName,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        input_data: { rawText: textToAudit, text: textToAudit, url: finalUrl, platform: auditPlatform, language: auditLanguage },
        output_data: finalResult,
      });

      const analyticsRef = db.collection('brand_analytics').doc(brand.id);
      const updateData: any = {
        total_audits: firebase.firestore.FieldValue.increment(1),
        last_audit: firebase.firestore.FieldValue.serverTimestamp()
      };
      finalResult.identified_issues?.forEach((issue: any) => {
        const cat = issue.category || 'unknown';
        updateData[`issue_counts.${cat}`] = firebase.firestore.FieldValue.increment(1);
      });
      await analyticsRef.set(updateData, { merge: true });
      setToast({type:'success', message: 'Truy quét thành công!'});
    } catch (e: any) {
      setToast({type:'error', message: 'Lỗi audit: ' + e.message});
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
                <h4 className={`text-[10px] font-black ${config.color} uppercase tracking-widest`}>Khối {config.label}</h4>
                <p className="text-[8px] text-slate-400 font-bold">{config.description}</p>
             </div>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${issues.length > 0 ? 'bg-red-500 text-white animate-pulse' : 'bg-emerald-500 text-white'}`}>
             {issues.length}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-4">
          {issues.length > 0 ? issues.map((issue, i) => (
            <div key={i} className="animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between mb-1.5">
                 <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase border ${issue.severity === 'High' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
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
                <CheckCircle size={28} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600/60">Tuyệt vời</p>
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
    <div className="animate-in fade-in h-full flex flex-col">
      <SectionHeader title="VOICE AUDITOR" subtitle="Kiểm duyệt dựa trên SOP Markdown động: Ngôn ngữ • AI Logic • Brand • Product." />
      
      <div className="grid lg:grid-cols-12 gap-8 flex-1">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-premium border border-slate-100 flex flex-col gap-6">
            <div>
               <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2.5 block ml-1">THƯƠNG HIỆU</label>
               <BrandSelector availableBrands={availableBrands} selectedBrandId={selectedBrandId} onChange={setSelectedBrandId} />
            </div>
            
            <div className="space-y-4">
               <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">NGÔN NGỮ</label>
                  <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-bold text-[#102d62] outline-none" value={auditLanguage} onChange={e => setAuditLanguage(e.target.value)}>
                    {SUPPORTED_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                  </select>
               </div>
               <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">KÊNH ĐĂNG</label>
                  <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-bold text-[#102d62] outline-none" value={auditPlatform} onChange={e => setAuditPlatform(e.target.value)}>
                    {Object.keys(PLATFORM_CONFIGS).map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
               </div>
            </div>

            <div className="bg-slate-100 p-1 rounded-xl flex">
               <button onClick={() => setInputType('text')} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${inputType === 'text' ? 'bg-[#102d62] text-white shadow-md' : 'text-slate-400'}`}>TEXT</button>
               <button onClick={() => setInputType('url')} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${inputType === 'url' ? 'bg-[#102d62] text-white shadow-md' : 'text-slate-400'}`}>URL</button>
            </div>

            {inputType === 'text' ? (
               <textarea className="w-full h-64 p-5 bg-slate-50 border border-slate-200 rounded-2xl text-[13px] text-[#102d62] outline-none resize-none font-medium focus:bg-white transition-all shadow-inner-soft custom-scrollbar" placeholder="Dán nội dung..." value={auditText} onChange={e => setAuditText(e.target.value)} disabled={isAuditing} />
            ) : (
               <div className="relative">
                 <input type="url" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[12px] text-[#102d62] font-bold outline-none" placeholder="https://..." value={auditUrl} onChange={e => setAuditUrl(e.target.value)} disabled={isAuditing} />
                 <Globe className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
               </div>
            )}

            <button onClick={handleAudit} disabled={isAuditing} className="w-full py-5 bg-[#102d62] text-white rounded-xl font-black text-[13px] flex justify-center items-center gap-2 shadow-lg hover:bg-blue-900 transition-all active:scale-95 disabled:opacity-50 uppercase tracking-widest">
              {isAuditing ? <RefreshCw className="animate-spin" size={18} /> : <SearchCode size={18} />} 
              {isAuditing ? 'ĐANG QUÉT...' : 'BẮT ĐẦU AUDIT'}
            </button>
          </div>

          <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
             <div className="flex items-center gap-2 mb-3">
                <div className="p-1 bg-blue-50 rounded text-blue-600"><ShieldCheck size={14}/></div>
                <h4 className="text-[9px] font-black text-[#102d62] uppercase tracking-widest">Applied SOP Tags</h4>
             </div>
             <div className="flex flex-wrap gap-2">
                {activeRules.length > 0 ? activeRules.map(r => (
                  <span key={r.id} className="px-2.5 py-1 bg-slate-50 text-[#102d62] rounded-lg border border-slate-100 text-[10px] font-bold flex items-center gap-1.5 hover:bg-blue-50 hover:border-blue-100 transition-all cursor-default">
                    <div className="w-1 h-1 rounded-full bg-[#01ccff]"></div>
                    {r.label}
                  </span>
                )) : (
                  <p className="text-[9px] text-slate-400 italic font-medium">Chưa nạp quy chuẩn</p>
                )}
             </div>
          </div>
        </div>

        <div className="lg:col-span-9 flex flex-col gap-6">
          {auditResult ? (
            <div className="flex flex-col gap-6 h-full animate-in zoom-in-95">
              <div className={`rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-premium ${auditResult.canPublish ? 'bg-emerald-600' : 'bg-[#102d62]'}`}>
                <div className="absolute top-0 right-0 w-1/4 h-full bg-gradient-to-l from-white/10 to-transparent"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                   <div className="flex-1">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[9px] font-black uppercase tracking-widest mb-3">Quality Matrix Score: {auditResult.overall_score || 0}%</div>
                      <h2 className="text-3xl font-black font-head uppercase tracking-tight leading-tight">{auditResult.canPublish ? 'Sẵn sàng phát hành' : `Phát hiện ${auditResult.identified_issues.length} điểm rủi ro`}</h2>
                      <p className="mt-3 text-white/70 font-bold text-[13px] leading-relaxed max-w-2xl italic">"{auditResult.summary}"</p>
                   </div>
                   <div className="shrink-0 w-24 h-24 rounded-full border-4 border-white/10 flex items-center justify-center bg-white/5 backdrop-blur-md shadow-inner">
                      {auditResult.canPublish ? <CheckCircle size={40} className="text-emerald-300" /> : <AlertTriangle size={40} className="text-amber-400" />}
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
                  <h4 className="text-[10px] font-black text-[#102d62] uppercase tracking-widest flex items-center gap-2"><Sparkles size={16} className="text-[#01ccff]" /> Bản thảo tối ưu (Standard Cleaned)</h4>
                  <button onClick={() => { navigator.clipboard.writeText(auditResult.rewritten_text); setToast({type:'success', message:'Đã copy!'}); }} className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-100 rounded-xl text-[9px] font-black text-[#102d62] uppercase flex items-center gap-1.5 transition-all shadow-sm">
                    <Copy size={14}/> Copy Content
                  </button>
                </div>
                <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
                   <div className="prose prose-sm max-w-none text-slate-700 font-medium leading-[1.8] text-[15px] whitespace-pre-wrap">{auditResult.rewritten_text}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 p-12 transition-all hover:bg-white group">
              <div className="w-20 h-20 bg-white rounded-[2rem] shadow-premium flex items-center justify-center mb-6 text-slate-200 group-hover:scale-110 transition-all duration-500">
                <Activity size={40} strokeWidth={1} />
              </div>
              <h3 className="font-black text-[#102d62] text-xl mb-3 tracking-tight uppercase">SOP Auditor is Active</h3>
              <p className="text-[13px] text-slate-400 text-center max-w-xs font-medium leading-relaxed">Hệ thống đang sẵn sàng đối soát văn bản với các file Markdown Rules (SOP) bạn đã cấu hình.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditorTab;
