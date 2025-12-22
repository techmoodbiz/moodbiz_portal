
import React, { useState, useMemo } from 'react';
import { RefreshCw, Search, ChevronDown, CheckCircle, AlertCircle, Users, MessageSquare, Sparkles, Copy, Lightbulb, BarChart2, Check, AlertTriangle, Globe, FileText, Link2, Search as SearchIcon, MousePointer, Layout, Building2 } from 'lucide-react';
import { Brand, Auditor, SystemPrompts, User } from '../../types';
import { SectionHeader, BrandSelector } from '../UIComponents';
import { GLOBAL_AUDIT_STANDARDS, SUPPORTED_LANGUAGES } from '../../constants';
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
}

const AuditorTab: React.FC<AuditorTabProps> = ({
  availableBrands,
  selectedBrandId,
  setSelectedBrandId,
  systemPrompts,
  currentUser,
  setToast,
  guidelines,
  auditors
}) => {
  const [inputType, setInputType] = useState<'text' | 'url'>('text');
  const [auditUrl, setAuditUrl] = useState('');
  const [auditText, setAuditText] = useState('');
  const [auditContentType, setAuditContentType] = useState("social");
  const [auditLanguage, setAuditLanguage] = useState("Vietnamese");
  const [isAuditing, setIsAuditing] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [auditResult, setAuditResult] = useState<any>(null);

  const handleCopy = async (text: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setToast({ type: 'success', message: 'Đã copy nội dung vào clipboard!' });
    } catch (err) {
      setToast({ type: 'error', message: 'Không copy được.' });
    }
  };

  const handleInputTypeChange = (type: 'text' | 'url') => {
    setInputType(type);
    if (type === 'url') {
      setAuditContentType('website');
    }
  };

  const commonMistakes = useMemo(() => {
    if (!auditors || !auditors.length || !selectedBrandId) return [];
    const brandAudits = auditors.filter(a => a.brand_id === selectedBrandId);
    const counts: Record<string, number> = {};
    brandAudits.forEach(audit => {
      const issues = audit.output_data?.identified_issues;
      if (Array.isArray(issues)) {
        issues.forEach((issue: any) => {
          const type = (issue.issue_type || 'Unknown').split('/')[0].trim().toLowerCase();
          counts[type] = (counts[type] || 0) + 1;
        });
      }
    });
    return Object.entries(counts).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [auditors, selectedBrandId]);

  const updateAnalytics = async (brandId: string, issues: any[]) => {
    try {
      const analyticsRef = db.collection('brand_analytics').doc(brandId);
      const significantIssues = issues.filter((i: any) => (i.severity || '').toLowerCase() !== 'low');

      await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(analyticsRef);
        const data = doc.exists ? doc.data() : { total_audits: 0, issue_counts: {} };
        const newTotal = (data?.total_audits || 0) + 1;
        const newIssueCounts = { ...(data?.issue_counts || {}) };

        significantIssues.forEach((issue: any) => {
           const type = (issue.issue_type || 'Unknown').split('/')[0].trim(); 
           newIssueCounts[type] = (newIssueCounts[type] || 0) + 1;
        });

        transaction.set(analyticsRef, {
          brand_id: brandId,
          total_audits: newTotal,
          issue_counts: newIssueCounts,
          last_updated: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      });
    } catch (error) {
      console.error("Lỗi cập nhật Analytics:", error);
    }
  };

  const performScrape = async (url: string) => {
    let targetUrl = url.trim();
    if (!targetUrl) return null;
    if (!/^https?:\/\//i.test(targetUrl)) targetUrl = 'https://' + targetUrl;
    setIsScraping(true);
    try {
        const content = await scrapeWebsiteContent(targetUrl);
        return { content, finalUrl: targetUrl };
    } catch (err: any) {
        throw err;
    } finally {
        setIsScraping(false);
    }
  };

  const handleAudit = async () => {
    const brand = availableBrands.find(b => b.id === selectedBrandId);
    if (!brand) { setToast({type:'error', message: 'Chưa chọn thương hiệu'}); return; }
    
    let textToAudit = auditText;
    let finalUrl = "";

    if (inputType === 'url') {
       if (!auditUrl) { setToast({type:'error', message: 'Vui lòng nhập URL'}); return; }
       setIsAuditing(true);
       try {
          const scraped = await performScrape(auditUrl);
          if (scraped?.content) {
             textToAudit = scraped.content;
             finalUrl = scraped.finalUrl;
             setAuditText(scraped.content);
          } else throw new Error("Không lấy được nội dung.");
       } catch (e: any) {
          setIsAuditing(false);
          setToast({type:'error', message: "Lỗi: " + e.message});
          return;
       }
    } else {
       if (!textToAudit.trim()) { setToast({type:'error', message: 'Vui lòng nhập nội dung'}); return; }
       setIsAuditing(true);
    }

    const mistakesText = commonMistakes.length > 0 ? commonMistakes.map(m => `- ${m.type} (${m.count} lần)`).join('\n') : "Chưa có dữ liệu lỗi.";
    const approvedGuide = guidelines.find(g => g.brand_id === brand.id && g.status === 'approved');
    const guideContext = approvedGuide?.guideline_text ? `GUIDELINE:\n${approvedGuide.guideline_text}\n` : '';
    const basePrompt = (auditContentType === 'website' ? systemPrompts.auditor.website : systemPrompts.auditor.social);
    const prompt = basePrompt
      .replace(/{text}/g, textToAudit).replace(/{global_standards}/g, GLOBAL_AUDIT_STANDARDS)
      .replace(/{brand_name}/g, brand.name).replace(/{brand_personality}/g, brand.personality)
      .replace(/{brand_voice}/g, brand.voice).replace(/{audit_criteria}/g, brand.auditCriteria || 'N/A')
      .replace(/{language}/g, auditLanguage).replace(/{guideline}/g, guideContext).replace(/{commonmistakes}/g, mistakesText);

    try {
      const data = await auditContent({ brand, contentType: auditContentType, prompt });
      let outputData = data.result;
      if (typeof outputData === 'string') {
        try { outputData = JSON.parse(outputData.replace(/```json?/gi, '').replace(/```/g, '')); } 
        catch { outputData = { rawText: outputData }; }
      }
      let finalScore = outputData.overall_score || 0;
      if (finalScore <= 1 && finalScore > 0) finalScore *= 100;
      const issues = outputData.identified_issues || [];
      const canPublish = (Math.round(finalScore)) >= 80;
      const finalResult = { ...outputData, overall_score: finalScore, canPublish, content_type: auditContentType };
      setAuditResult(finalResult);

      await db.collection('auditors').doc(`AUD_${brand.id}_${Date.now()}`).set({
        id: `AUD_${brand.id}_${Date.now()}`,
        brand_id: brand.id, brand_name: brand.name,
        user_id: currentUser!.uid, user_name: currentUser!.name || currentUser!.displayName,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        input_data: { rawText: textToAudit, text: textToAudit, url: finalUrl },
        output_data: finalResult,
      });
      await updateAnalytics(brand.id, issues);
      setToast({type:'success', message: 'Audit hoàn tất!'});
    } catch (e: any) {
      setToast({type:'error', message: 'Lỗi: ' + e.message});
    } finally {
      setIsAuditing(false);
    }
  };

  const selectedBrand = availableBrands.find(b => b.id === selectedBrandId);

  return (
    <div className="animate-in fade-in h-full flex flex-col">
      <SectionHeader title="VOICE AUDITOR" subtitle="Kiểm tra tính nhất quán với Brand Voice" />
      <div className="grid lg:grid-cols-12 gap-10 flex-1">
        <div className="lg:col-span-4 bg-white p-7 rounded-[2rem] shadow-premium border border-slate-100 flex flex-col h-fit space-y-7">
          
          <div>
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">THƯƠNG HIỆU CẦN KIỂM TRA</label>
            <BrandSelector 
              availableBrands={availableBrands} 
              selectedBrandId={selectedBrandId} 
              onChange={setSelectedBrandId} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">LOẠI NỘI DUNG</label>
                <div className="relative group">
                  <select className="w-full pl-4 pr-10 py-4 bg-white border border-slate-300 rounded-2xl text-[14px] font-bold text-slate-900 outline-none appearance-none cursor-pointer hover:border-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all shadow-sm" value={auditContentType} onChange={e => setAuditContentType(e.target.value)}>
                    <option value="social">Bài Post Social</option><option value="website">Bài Post Website</option>
                  </select>
                  <ChevronDown size={20} strokeWidth={2.5} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none z-10" />
                </div>
             </div>
             <div>
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">NGÔN NGỮ BÀI VIẾT</label>
                <div className="relative group">
                  <select className="w-full pl-4 pr-10 py-4 bg-white border border-slate-300 rounded-2xl text-[14px] font-bold text-slate-900 outline-none appearance-none cursor-pointer hover:border-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all shadow-sm" value={auditLanguage} onChange={e => setAuditLanguage(e.target.value)}>
                    {SUPPORTED_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label.split(' (')[0]}</option>)}
                  </select>
                  <ChevronDown size={20} strokeWidth={2.5} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none z-10" />
                </div>
             </div>
          </div>

          <div>
             <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">NGUỒN NỘI DUNG</label>
             <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
                <button onClick={() => handleInputTypeChange('text')} className={`flex-1 flex items-center justify-center gap-2 py-2 text-[11px] font-black rounded-lg transition-all ${inputType === 'text' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>
                  <FileText size={14}/> NHẬP TEXT
                </button>
                <button onClick={() => handleInputTypeChange('url')} className={`flex-1 flex items-center justify-center gap-2 py-2 text-[11px] font-black rounded-lg transition-all ${inputType === 'url' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>
                  <Globe size={14}/> WEBSITE URL
                </button>
             </div>

             {inputType === 'text' ? (
                <textarea className="w-full h-[300px] p-5 bg-white border border-slate-300 rounded-2xl text-[14px] text-slate-900 outline-none resize-none font-medium transition-all shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5" placeholder="Dán nội dung bài viết, email vào đây..." value={auditText} onChange={e => setAuditText(e.target.value)} disabled={isAuditing} />
             ) : (
                <input type="url" className="w-full px-5 py-4 bg-white border border-slate-300 rounded-2xl text-[14px] text-slate-900 outline-none font-medium shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5" placeholder="https://example.com/bai-viet" value={auditUrl} onChange={e => setAuditUrl(e.target.value)} disabled={isAuditing} />
             )}
          </div>

          <button onClick={handleAudit} disabled={isAuditing} className="w-full py-4.5 bg-white border-2 border-[#102d62] text-[#102d62] rounded-xl font-black text-[15px] flex justify-center items-center gap-2 shadow-sm hover:bg-slate-50 active:scale-[0.98] transition-all disabled:opacity-50 uppercase tracking-widest">
             {isAuditing ? <RefreshCw className="animate-spin" size={18} /> : <Search size={18} />} {isAuditing ? 'ĐANG PHÂN TÍCH...' : 'AUDIT CONTENT'}
          </button>
        </div>

        <div className="lg:col-span-8 h-full">
          {auditResult ? (
            <div className="space-y-6 animate-in fade-in h-full flex flex-col">
              <div className="bg-[#102d62] rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-lg">
                <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-[#01ccff]/20 to-transparent"></div>
                <div className="flex justify-between items-center relative z-10">
                   <div>
                      <div className="text-[10px] text-[#01ccff] font-black tracking-widest uppercase mb-1">Audit Score Result</div>
                      <h2 className="text-2xl font-black">{selectedBrand?.name}</h2>
                      {auditResult.canPublish && <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-black uppercase tracking-widest"><CheckCircle size={14}/> Ready to Publish</div>}
                   </div>
                   <div className="text-right">
                      <div className="text-6xl font-black tracking-tighter" style={{ color: (Math.round(auditResult.overall_score)) >= 80 ? '#4ade80' : '#fbbf24' }}>
                        {Math.round(auditResult.overall_score)}
                      </div>
                      <div className="text-[11px] opacity-70 font-black uppercase tracking-widest">/ 100 Points</div>
                   </div>
                </div>
              </div>
              <div className="bg-white p-10 rounded-[2.5rem] shadow-premium border border-slate-50 flex-1 overflow-y-auto custom-scrollbar">
                 <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6">Phân tích chi tiết</h4>
                 <p className="text-sm text-slate-600 leading-relaxed italic mb-8">"{auditResult.summary}"</p>
                 <div className="grid md:grid-cols-2 gap-8">
                    {auditResult.identified_issues?.map((issue:any, i:number) => (
                      <div key={i} className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <div className="text-red-500 font-black text-[10px] uppercase mb-1">{issue.issue_type}</div>
                        <div className="text-sm font-bold text-[#102d62] mb-3">{issue.problematic_text}</div>
                        <p className="text-xs text-slate-500 leading-relaxed">{issue.suggestion}</p>
                      </div>
                    ))}
                 </div>
              </div>
            </div>
          ) : (
            <div className="h-full bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 p-12 transition-all group hover:bg-white hover:border-[#01ccff]/30">
              <div className="w-24 h-24 bg-white rounded-3xl shadow-premium flex items-center justify-center mb-8 text-slate-200 group-hover:scale-105 transition-transform duration-500">
                <BarChart2 size={48} strokeWidth={1.5} />
              </div>
              <p className="font-black text-[#102d62] text-2xl mb-3 tracking-tight">Kết quả phân tích sẽ hiển thị ở đây</p>
              <p className="text-sm text-slate-400 text-center max-w-sm font-medium leading-relaxed">
                Nhập nội dung hoặc dán Link Website để bắt đầu quy trình Audit giọng văn thương hiệu.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditorTab;
