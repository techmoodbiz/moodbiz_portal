
import React, { useState, useMemo, useEffect } from 'react';
import {
  RefreshCw, Globe, Zap, ShieldCheck,
  SearchCode, AlertTriangle, Languages,
  ShieldAlert, BrainCircuit, Award, ShoppingBag, X, FileCode, Check,
  Copy, Sparkles, AlertCircle, Activity, Layout, Shield, CheckCircle, ChevronDown, History
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

  // REAL-TIME LEARNING ENGINE: Phân tích sâu 40 lượt audit gần nhất để tìm pattern lỗi lặp lại
  const learningInsights = useMemo(() => {
    if (!auditors || !selectedBrandId) return { language: [], ai_logic: [], brand: [], product: [] };
    const brandAudits = auditors.filter(a => a.brand_id === selectedBrandId).slice(0, 40);
    const aggregated: Record<string, string[]> = { language: [], ai_logic: [], brand: [], product: [] };
    
    brandAudits.forEach(audit => {
      const issues = audit.output_data?.identified_issues || [];
      issues.forEach((issue: any) => {
        const cat = (issue.category || 'language').toLowerCase();
        const reason = issue.reason;
        if (!reason) return;
        const targetKey = cat.includes('logic') ? 'ai_logic' : cat.includes('brand') ? 'brand' : cat.includes('product') ? 'product' : 'language';
        if (aggregated[targetKey].length < 12 && !aggregated[targetKey].includes(reason)) {
          aggregated[targetKey].push(issue.severity === 'High' ? `CRITICAL: ${reason}` : reason);
        }
      });
    });
    return aggregated;
  }, [auditors, selectedBrandId]);

  const activeRules = useMemo(() => {
    return auditRules.filter(r => {
      const ruleCode = (r.code || '').trim().toLowerCase();
      if (r.type === 'ai_logic') return true;
      if (ruleCode === 'global') return true;
      if (r.type === 'language' && ruleCode === auditLanguage.toLowerCase()) return true;
      if (r.type === 'brand' && ruleCode === selectedBrandId.toLowerCase()) return true;
      return false;
    });
  }, [auditRules, auditLanguage, selectedBrandId]);

  const dynamicRulesContext = useMemo(() => {
    if (activeRules.length === 0) return "Tuân thủ nghiêm ngặt SOP và Brand Voice.";
    return activeRules.map(r => `[QUY TẮC BẮT BUỘC - ${r.label}]\n${r.content}`).join('\n\n');
  }, [activeRules]);

  const handleAudit = async () => {
    const brand = availableBrands.find(b => b.id === selectedBrandId);
    if (!brand) { setToast({ type: 'error', message: "Vui lòng chọn thương hiệu." }); return; }

    let textToAudit = auditText;
    setIsAuditing(true);
    setAuditResult(null);

    try {
      if (inputType === 'url') {
        if (!auditUrl) throw new Error("Vui lòng nhập URL.");
        setToast({ type: 'info', message: "Đang truy xuất dữ liệu..." });
        textToAudit = await scrapeWebsiteContent(auditUrl);
        setAuditText(textToAudit);
      }

      if (!textToAudit.trim()) throw new Error("Nội dung trống.");

      const approvedGuide = guidelines.find(g => g.brand_id === brand.id && g.status === 'approved');
      const guideContext = approvedGuide?.guideline_text ? `DỮ LIỆU THAM CHIẾU (GUIDELINE):\n${approvedGuide.guideline_text}\n` : '';

      const pastMistakesText = `
[NGĂN CHẶN LỖI HIGH SEVERITY - DỮ LIỆU LỊCH SỬ]
Đây là các lỗi "High Severity" thường xuyên lặp lại. Nếu bản rewritten_text chứa bất kỳ dấu hiệu nào của các lỗi này, lượt Audit sẽ bị coi là Thất bại:
- Ngôn ngữ & SOP: ${learningInsights.language.join('; ') || 'Sạch'}
- Logic & Xác thực: ${learningInsights.ai_logic.join('; ') || 'Sạch'}
- Brand Identity: ${learningInsights.brand.join('; ') || 'Sạch'}
- Product Detail: ${learningInsights.product.join('; ') || 'Sạch'}

CHỈ THỊ ĐẶC BIỆT: Sau khi viết bản thảo tối ưu, bạn phải thực hiện bước 'Self-Audit' bằng cách đối chiếu chính bản vừa viết với danh sách 'Từ cấm' và 'Lỗi lịch sử' ở trên. Nếu có lỗi, hãy sửa ngay lập tức.
      `;

      const isWebsite = auditPlatform === 'Website / SEO Blog';
      const basePrompt = isWebsite ? systemPrompts.auditor.website : systemPrompts.auditor.social;

      const prompt = basePrompt
        .replace(/{text}/g, textToAudit)
        .replace(/{dynamic_rules}/g, `${dynamicRulesContext}\n\n${pastMistakesText}`)
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
          throw new Error("AI trả về cấu trúc lỗi. Vui lòng Audit lại.");
        }
      }

      const finalResult = {
        ...parsedResult,
        canPublish: (parsedResult.identified_issues?.length || 0) === 0,
        content_type: auditPlatform,
        recursive_check: true
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

      setToast({ type: 'success', message: 'Audit & Self-Correction hoàn tất!' });
    } catch (e: any) {
      setToast({ type: 'error', message: e.message || "Lỗi Audit." });
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
                {learningInsights[category as keyof typeof learningInsights]?.some(insight => insight.includes(issue.reason)) && (
                  <span className="flex items-center gap-1 text-[8px] font-black text-[#01ccff] uppercase bg-blue-50 px-1.5 py-0.5 rounded animate-pulse">
                    <History size={10}/> Critical Pattern
                  </span>
                )}
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 relative group/item hover:bg-white transition-colors">
                <div className="text-[12px] font-bold text-slate-800 mb-2 leading-relaxed italic border-l-2 border-slate-200 pl-3">
                  "{issue.problematic_text}"
                </div>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed mb-3">{issue.reason}</p>
                <div className="bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100 flex gap-2">
                  <Check size={12} className="text-emerald-500 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-emerald-800 font-bold"><span className="text-emerald-500 uppercase text-[9px]">Sửa thành:</span> {issue.suggestion}</p>
                </div>
              </div>
            </div>
          )) : (
            <div className="h-full flex flex-col items-center justify-center py-10 animate-in fade-in">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-400 mb-3 shadow-inner">
                <ShieldCheck size={28} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600/60 text-center">Đã vượt qua quy trình<br/>Self-Correction</p>
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
      <SectionHeader title="VOICE AUDITOR ULTRA" subtitle="Quy trình QC 2 lớp (Internal Recursive Audit) triệt tiêu lỗi lặp lại." />
      <div className="grid lg:grid-cols-12 gap-8 flex-1">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-premium border border-slate-100 flex flex-col gap-6">
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">THƯƠNG HIỆU</label>
              <BrandSelector availableBrands={availableBrands} selectedBrandId={selectedBrandId} onChange={setSelectedBrandId} />
            </div>
            <div className="flex bg-slate-100 p-1.5 rounded-2xl">
              <button onClick={() => setInputType('text')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${inputType === 'text' ? 'bg-[#102d62] text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>VĂN BẢN</button>
              <button onClick={() => setInputType('url')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${inputType === 'url' ? 'bg-[#102d62] text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>LINK URL</button>
            </div>
            {inputType === 'text' ? (
              <textarea className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-[13px] min-h-[220px] font-medium text-[#102d62] outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all shadow-inner-soft custom-scrollbar" placeholder="Dán nội dung..." value={auditText} onChange={e => setAuditText(e.target.value)} />
            ) : (
              <input type="url" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold text-[#102d62] outline-none focus:bg-white shadow-inner-soft" placeholder="https://www.moodbiz.vn/" value={auditUrl} onChange={e => setAuditUrl(e.target.value)} />
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2.5 block ml-1">NGÔN NGỮ</label>
                <div className="relative group">
                  <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#102d62] outline-none appearance-none" value={auditLanguage} onChange={e => setAuditLanguage(e.target.value)}>
                    {SUPPORTED_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2.5 block ml-1">KÊNH ĐĂNG TẢI</label>
                <div className="relative group">
                  <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#102d62] outline-none appearance-none" value={auditPlatform} onChange={e => setAuditPlatform(e.target.value)}>
                    {Object.keys(PLATFORM_CONFIGS).map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
            <button onClick={handleAudit} disabled={isAuditing} className="w-full py-5 bg-[#102d62] text-white rounded-xl font-black text-sm flex justify-center items-center gap-3 shadow-xl hover:bg-[#0a1d40] transition-all disabled:opacity-50 uppercase tracking-widest">
              {isAuditing ? <RefreshCw className="animate-spin" size={20} /> : <Activity size={20} className="text-[#01ccff]" />}
              {isAuditing ? 'Đang phân tích recursive...' : 'Bắt đầu Audit Ultra'}
            </button>
          </div>
          <div className="bg-[#102d62] p-6 rounded-3xl text-white shadow-lg border border-white/5 overflow-hidden relative group">
            <div className="absolute -right-4 -bottom-4 opacity-5 rotate-12 group-hover:scale-110 transition-transform"><History size={80} /></div>
            <div className="flex items-center gap-2 mb-4 relative z-10">
              <History size={16} className="text-[#01ccff]" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#01ccff]">Recursive Check Active</span>
            </div>
            <p className="text-[11px] text-blue-100/70 font-medium leading-relaxed mb-4 relative z-10">AI tự soi lỗi bản tối ưu với <b>{Object.values(learningInsights).flat().length}</b> pattern rủi ro lịch sử.</p>
          </div>
        </div>
        <div className="lg:col-span-9 flex flex-col h-full overflow-hidden">
          {auditResult ? (
            <div className="flex flex-col h-full animate-in zoom-in-95 space-y-6">
              <div className={`rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-premium ${auditResult.canPublish ? 'bg-emerald-600' : 'bg-[#102d62]'}`}>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="flex-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[9px] font-black uppercase tracking-widest mb-3">Audit Ultra Synopsis</div>
                    <h2 className="text-3xl font-black font-head uppercase tracking-tight leading-tight">{auditResult.canPublish ? 'HOÀN TOÀN TUÂN THỦ (CLEAN)' : `PHÁT HIỆN ${auditResult.identified_issues?.length || 0} ĐIỂM RỦI RO`}</h2>
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
                  <h4 className="text-[10px] font-black text-[#102d62] uppercase tracking-widest flex items-center gap-2">
                    <Sparkles size={16} className="text-[#01ccff]" /> 
                    Bản thảo tối ưu (Sạch lỗi 100% - Đã Recursive Audit)
                  </h4>
                  <button onClick={() => { navigator.clipboard.writeText(auditResult.rewritten_text); setToast({ type: 'success', message: 'Đã copy bản thảo sạch!' }); }} className="px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black text-[#102d62] uppercase flex items-center gap-1.5 transition-all shadow-sm"><Copy size={14} /> Copy Final</button>
                </div>
                <div className="p-10 overflow-y-auto flex-1 custom-scrollbar">
                  <div className="prose prose-sm max-w-none text-slate-700 font-medium leading-[1.8] text-[15px] whitespace-pre-wrap selection:bg-[#01ccff]/20">{auditResult.rewritten_text}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 p-12 group transition-all hover:bg-white">
              <div className="w-20 h-20 bg-white rounded-[2rem] shadow-premium flex items-center justify-center mb-6 text-slate-200 group-hover:scale-110 transition-all duration-500"><ShieldCheck size={40} strokeWidth={1} /></div>
              <p className="font-black text-[#102d62] text-xl mb-3 tracking-tight uppercase">Sẵn sàng Audit Ultra</p>
              <p className="text-[13px] text-slate-400 text-center max-w-xs font-medium leading-relaxed">Hệ thống áp dụng quy trình Recursive Audit để triệt tiêu mọi rủi ro High Severity phát sinh mới.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default AuditorTab;
