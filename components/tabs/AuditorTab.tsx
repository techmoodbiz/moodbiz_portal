
import React, { useState, useMemo } from 'react';
import { RefreshCw, Search, ChevronDown, CheckCircle, AlertCircle, Users, MessageSquare, Sparkles, Copy, Lightbulb, BarChart2, Check, AlertTriangle, Globe, FileText, Link2, Search as SearchIcon, MousePointer, Layout } from 'lucide-react';
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
      setAuditContentType('website'); // Auto switch to website for URL
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
      
      const significantIssues = issues.filter((i: any) => {
        const severity = (i.severity || '').toLowerCase();
        return severity !== 'low'; 
      });

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
        let retryUrl = targetUrl;
        if (targetUrl.includes('//www.')) retryUrl = targetUrl.replace('//www.', '//');
        else retryUrl = targetUrl.replace('//', '//www.');

        if (retryUrl !== targetUrl) {
            try {
                const content = await scrapeWebsiteContent(retryUrl);
                return { content, finalUrl: retryUrl };
            } catch (retryErr) {
               console.error("Scrape retry failed");
            }
        }
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
       setAuditResult(null);
       
       try {
          const scraped = await performScrape(auditUrl);
          if (scraped?.content) {
             textToAudit = scraped.content;
             finalUrl = scraped.finalUrl;
             setAuditText(scraped.content);
          } else {
             throw new Error("Không lấy được nội dung từ link này.");
          }
       } catch (e: any) {
          setIsAuditing(false);
          setToast({type:'error', message: "Lỗi đọc link: " + e.message});
          return;
       }
    } else {
       if (!textToAudit.trim()) { setToast({type:'error', message: 'Vui lòng nhập nội dung'}); return; }
       setIsAuditing(true);
       setAuditResult(null);
    }

    const mistakesText = commonMistakes.length > 0 ? commonMistakes.map(m => `- ${m.type} (${m.count} lần)`).join('\n') : "Chưa có dữ liệu lỗi.";
    
    const approvedGuide = guidelines.find(g => g.brand_id === brand.id && g.status === 'approved');
    const guideContext = approvedGuide?.guideline_text ? `GUIDELINE:\n${approvedGuide.guideline_text}\n` : '';

    const basePrompt = (auditContentType === 'website' ? systemPrompts.auditor.website : systemPrompts.auditor.social);
    const prompt = basePrompt
      .replace(/{text}/g, textToAudit)
      .replace(/{global_standards}/g, GLOBAL_AUDIT_STANDARDS)
      .replace(/{brand_name}/g, brand.name).replace(/{brandname}/g, brand.name)
      .replace(/{brand_personality}/g, brand.personality).replace(/{brandpersonality}/g, brand.personality)
      .replace(/{brand_voice}/g, brand.voice).replace(/{brandvoice}/g, brand.voice)
      .replace(/{audit_criteria}/g, brand.auditCriteria || 'N/A')
      .replace(/{language}/g, auditLanguage)
      .replace(/{guideline}/g, guideContext)
      .replace(/{commonmistakes}/g, mistakesText);

    try {
      const data = await auditContent({
        brand: { ...brand, auditCriteria: brand.auditCriteria },
        contentType: auditContentType,
        prompt
      });
      
      let outputData = data.result;
      if (typeof outputData === 'string') {
        try { outputData = JSON.parse(outputData.replace(/```json?/gi, '').replace(/```/g, '')); } 
        catch { outputData = { rawText: outputData, isParsed: false }; }
      }

      let finalScore = outputData.overall_score || 0;
      if (finalScore <= 1 && finalScore > 0) finalScore *= 100;
      else if (finalScore <= 5 && finalScore > 1) finalScore *= 20;
      else if (finalScore <= 10 && finalScore > 5) finalScore *= 10;
      outputData.overall_score = finalScore;

      const issues = outputData.identified_issues || [];
      const canPublish = (Math.round(outputData.overall_score || 0)) >= 80 && !issues.some((i: any) => ['High', 'Medium'].includes(i.severity));
      const finalResult = { ...outputData, canPublish, content_type: auditContentType };
      setAuditResult(finalResult);

      const timestamp = Date.now();
      const auditId = `AUD_${brand.id}_${timestamp}`;

      await db.collection('auditors').doc(auditId).set({
        id: auditId,
        type: 'auditor',
        brand_id: brand.id,
        brand_name: brand.name,
        user_id: currentUser!.uid,
        user_name: currentUser!.name || currentUser!.displayName,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        input_data: { 
            rawText: textToAudit, 
            text: textToAudit,
            ...(finalUrl ? { url: finalUrl } : {}),
            language: auditLanguage
        },
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

  const renderScoreBar = (label: string, score: number, icon: React.ReactNode, colorClass: string) => (
    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between h-full gap-3">
        <div className="flex items-center justify-between">
             <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${colorClass.replace('text-', 'bg-').replace('600', '50')} ${colorClass}`}>{icon}</div>
                <div className="text-sm font-bold text-[#102d62] whitespace-nowrap">{label}</div>
            </div>
            <span className={`text-xl font-extrabold ${colorClass}`}>{score}</span>
        </div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${colorClass.replace('text-', 'bg-')}`} style={{width: `${score}%`}}></div>
        </div>
    </div>
  );

  return (
    <div className="animate-in fade-in h-full flex flex-col">
      <SectionHeader title="Voice Auditor" subtitle="Kiểm tra tính nhất quán với Brand Voice" />
      <div className="grid lg:grid-cols-12 gap-8 flex-1">
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl shadow-xl border border-slate-100 flex flex-col h-fit">
          <div className="space-y-5">
            <div>
              <label className="text-xs font-bold text-[#102d62] uppercase tracking-wide mb-2 block">Thương hiệu cần kiểm tra</label>
              <BrandSelector availableBrands={availableBrands} selectedBrandId={selectedBrandId} onChange={setSelectedBrandId} disabled={isAuditing} />
            </div>

            {commonMistakes.length > 0 && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2 text-amber-700 font-bold text-xs uppercase tracking-wide">
                  <AlertTriangle size={14} /> AI sẽ lưu ý tránh các lỗi sau:
                </div>
                <ul className="space-y-1">
                  {commonMistakes.slice(0, 3).map((m, idx) => (
                    <li key={idx} className="text-xs text-amber-900 flex justify-between">
                      <span className="capitalize">• {m.type}</span>
                      <span className="opacity-60">{m.count} lần</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="text-xs font-bold text-[#102d62] uppercase tracking-wide mb-2 block">Loại nội dung</label>
                  <div className="relative">
                    <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none font-medium text-[#102d62] outline-none" value={auditContentType} onChange={e => setAuditContentType(e.target.value)}>
                      <option value="social">Bài Post Social</option><option value="website">Bài Post Website</option>
                    </select>
                  </div>
               </div>
               <div>
                  <label className="text-xs font-bold text-[#102d62] uppercase tracking-wide mb-2 block">Ngôn ngữ bài viết</label>
                  <div className="relative">
                    <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none font-medium text-[#102d62] outline-none" value={auditLanguage} onChange={e => setAuditLanguage(e.target.value)}>
                      {SUPPORTED_LANGUAGES.map(lang => (
                        <option key={lang.code} value={lang.code}>{lang.flag} {lang.label}</option>
                      ))}
                    </select>
                  </div>
               </div>
            </div>

            <div>
               <label className="text-xs font-bold text-[#102d62] uppercase tracking-wide mb-2 block">Nguồn nội dung</label>
               <div className="flex bg-slate-100 p-1 rounded-xl mb-3">
                  <button 
                    onClick={() => handleInputTypeChange('text')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${inputType === 'text' ? 'bg-white text-[#102d62] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <FileText size={14}/> Nhập Text
                  </button>
                  <button 
                    onClick={() => handleInputTypeChange('url')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${inputType === 'url' ? 'bg-white text-[#01ccff] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <Globe size={14}/> Website URL
                  </button>
               </div>

               {inputType === 'text' ? (
                  <textarea 
                    className="w-full h-[300px] p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#01ccff] outline-none resize-none font-medium transition-all" 
                    placeholder="Dán nội dung bài viết, email vào đây..." 
                    value={auditText} 
                    onChange={e => setAuditText(e.target.value)} 
                    disabled={isAuditing}
                  />
               ) : (
                  <div className="space-y-3">
                     <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Link2 size={16}/></div>
                        <input 
                          type="url"
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#01ccff] outline-none font-medium transition-all"
                          placeholder="https://example.com/bai-viet"
                          value={auditUrl}
                          onChange={e => setAuditUrl(e.target.value)}
                          disabled={isAuditing}
                        />
                     </div>
                     <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800">
                        <p className="font-bold flex items-center gap-2 mb-1"><Globe size={12}/> Lưu ý:</p>
                        AI sẽ tự động đọc nội dung từ link và tiến hành Audit. Hãy đảm bảo link công khai và không bị chặn bot.
                     </div>
                     {auditText && (
                        <div className="mt-2">
                           <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Nội dung đã quét được:</label>
                           <textarea className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 resize-none" value={auditText} readOnly />
                        </div>
                     )}
                  </div>
               )}
            </div>

            <button onClick={handleAudit} disabled={isAuditing || (inputType === 'text' && !auditText) || (inputType === 'url' && !auditUrl)} className="w-full py-4 bg-white border-2 border-[#102d62] text-[#102d62] rounded-xl font-bold hover:bg-blue-50 flex justify-center items-center gap-2 shadow-sm hover:shadow-md transition-all disabled:opacity-50">
               {isAuditing ? (
                  <><RefreshCw className="animate-spin" /> {isScraping ? 'Đang đọc link...' : 'Đang phân tích...'}</>
               ) : (
                  <><Search size={18} /> {inputType === 'url' ? 'Scan Link & Audit' : 'Audit Content'}</>
               )}
            </button>
          </div>
        </div>

        <div className="lg:col-span-8">
          {auditResult ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 pb-20">
              <div className="bg-[#102d62] rounded-2xl p-8 text-white relative overflow-hidden shadow-lg">
                <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-[#01ccff]/20 to-transparent"></div>
                <div className="flex justify-between items-center relative z-10">
                   <div>
                      <div className="text-xs text-[#01ccff] font-bold tracking-widest uppercase mb-1">Audit Score</div>
                      <h2 className="text-2xl font-bold">{availableBrands.find(b => b.id === selectedBrandId)?.name}</h2>
                      {auditResult.canPublish && <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold uppercase"><CheckCircle size={12}/> Ready to Publish</div>}
                   </div>
                   <div className="text-right">
                      <div className="text-6xl font-extrabold tracking-tighter" style={{ color: (Math.round(auditResult.overall_score ?? 0)) >= 80 ? '#4ade80' : '#fbbf24' }}>
                        {auditResult.overall_score != null ? Math.round(auditResult.overall_score) : '--'}
                      </div>
                      <div className="text-xs opacity-70 font-bold uppercase">/ 100 Points</div>
                   </div>
                </div>
              </div>

              {auditResult.content_type === 'website' && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-inner">
                    <h3 className="text-sm font-bold text-[#102d62] uppercase tracking-wide mb-4 flex items-center gap-2">
                        <Globe size={16} /> Website Deep Dive (SEO & UX)
                    </h3>
                    
                    <div className="grid md:grid-cols-3 gap-4 mb-6">
                        {renderScoreBar("SEO", auditResult.seo_assessment?.score || 0, <SearchIcon size={16}/>, "text-blue-600")}
                        {renderScoreBar("UX/Readability", auditResult.ux_assessment?.score || 0, <Layout size={16}/>, "text-purple-600")}
                        {renderScoreBar("Conversion", auditResult.conversion_assessment?.score || 0, <MousePointer size={16}/>, "text-emerald-600")}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-slate-100">
                            <h4 className="text-xs font-bold text-blue-800 uppercase mb-2">SEO Insights</h4>
                            <ul className="space-y-2">
                                <li className="text-xs text-slate-600"><span className="font-bold">Keyword:</span> {auditResult.seo_assessment?.keyword_check || 'N/A'}</li>
                                <li className="text-xs text-slate-600"><span className="font-bold">Structure:</span> {auditResult.seo_assessment?.structure_check || 'N/A'}</li>
                            </ul>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-100">
                            <h4 className="text-xs font-bold text-purple-800 uppercase mb-2">UX Insights</h4>
                            <ul className="space-y-2">
                                <li className="text-xs text-slate-600"><span className="font-bold">Readability:</span> {auditResult.ux_assessment?.readability || 'N/A'}</li>
                                <li className="text-xs text-slate-600"><span className="font-bold">Formatting:</span> {auditResult.ux_assessment?.formatting || 'N/A'}</li>
                            </ul>
                        </div>
                    </div>

                    {auditResult.seo_assessment?.meta_suggestions && (
                        <div className="mt-4 bg-white p-4 rounded-xl border border-blue-100">
                            <h4 className="text-xs font-bold text-[#102d62] uppercase mb-3">Gợi ý Meta Tags</h4>
                            <div className="space-y-3">
                                <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Meta Title</div>
                                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-blue-700 font-sans">{auditResult.seo_assessment.meta_suggestions.title}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Meta Description</div>
                                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600">{auditResult.seo_assessment.meta_suggestions.description}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                {auditResult.brand_personality_assessment && (
                   <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                      <h4 className="text-sm font-bold text-[#102d62] uppercase tracking-wide mb-4 flex items-center gap-2"><Users size={16}/> Personality Check</h4>
                      <div className={`p-4 rounded-xl border mb-4 ${auditResult.brand_personality_assessment.is_compliant ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                         <div className="flex items-center gap-2 font-bold text-sm mb-1">
                            {auditResult.brand_personality_assessment.is_compliant ? <CheckCircle size={16} className="text-emerald-600"/> : <AlertCircle size={16} className="text-amber-600"/>}
                            <span className={auditResult.brand_personality_assessment.is_compliant ? 'text-emerald-800' : 'text-amber-800'}>
                               {auditResult.brand_personality_assessment.is_compliant ? 'Tuân thủ tốt' : 'Cần cải thiện'}
                            </span>
                         </div>
                         <p className="text-xs text-slate-600 leading-relaxed">{auditResult.brand_personality_assessment.detailed_comment}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                         {auditResult.brand_personality_assessment.traits_matched?.map((t:string, i:number) => <span key={i} className="px-2 py-1 bg-slate-100 rounded-md text-[10px] font-bold text-slate-600 flex items-center gap-1 border border-slate-200"><Check size={10}/> {t}</span>)}
                      </div>
                   </div>
                )}
                {auditResult.brand_voice_assessment && (
                   <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                      <h4 className="text-sm font-bold text-[#102d62] uppercase tracking-wide mb-4 flex items-center gap-2"><MessageSquare size={16}/> Voice Check</h4>
                      <div className="grid grid-cols-2 gap-3 mb-4">
                         <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="text-[10px] text-slate-400 font-bold uppercase">Tone</div>
                            <div className="text-sm font-bold text-[#102d62]">{auditResult.brand_voice_assessment.tone_quality}</div>
                         </div>
                         <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="text-[10px] text-slate-400 font-bold uppercase">Conciseness</div>
                            <div className="text-sm font-bold text-[#102d62]">{auditResult.brand_voice_assessment.conciseness}</div>
                         </div>
                      </div>
                      <p className="text-xs text-slate-600 italic border-l-2 border-slate-200 pl-3">"{auditResult.brand_voice_assessment.detailed_comment}"</p>
                   </div>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                 <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50"><h4 className="text-sm font-bold text-[#102d62] uppercase tracking-wide">Vấn đề phát hiện</h4></div>
                 {auditResult.identified_issues?.length > 0 ? (
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase"><tr className="border-b border-slate-100"><th className="p-4 text-left w-1/3">Vấn đề</th><th className="p-4 text-left w-1/3">Lý do</th><th className="p-4 text-left w-1/3">Đề xuất</th></tr></thead>
                      <tbody className="divide-y divide-slate-100">
                         {auditResult.identified_issues.map((issue:any, i:number) => (
                            <tr key={i} className="hover:bg-slate-50/50">
                               <td className="p-4 align-top">
                                  <div className="text-red-500 font-medium bg-red-50 inline-block px-2 py-0.5 rounded text-xs mb-1 line-through decoration-red-300">{issue.problematic_text}</div>
                                  <div className="text-[10px] text-slate-400 font-bold uppercase">{issue.issue_type}</div>
                                  {issue.severity && <div className={`text-[10px] font-bold uppercase mt-1 inline-block px-1.5 rounded ${['High','Critical'].includes(issue.severity) ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>{issue.severity}</div>}
                               </td>
                               <td className="p-4 align-top text-slate-600 text-xs leading-relaxed">{issue.reason}</td>
                               <td className="p-4 align-top text-[#102d62] font-medium text-xs bg-emerald-50/30">{issue.suggestion}</td>
                            </tr>
                         ))}
                      </tbody>
                    </table>
                 ) : (
                    <div className="p-8 text-center bg-emerald-50/30">
                       <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-500">
                          <CheckCircle size={24} />
                       </div>
                       <h4 className="text-emerald-800 font-bold text-sm mb-1">Không phát hiện vấn đề nghiêm trọng</h4>
                       <p className="text-xs text-emerald-600/80">Bài viết tuân thủ tốt các tiêu chuẩn đã đề ra.</p>
                    </div>
                 )}
              </div>

              {auditResult.rewritten_text && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 relative group">
                   <div className="flex justify-between items-center mb-4"><h4 className="text-sm font-bold text-[#102d62] uppercase tracking-wide flex items-center gap-2"><Sparkles size={16} className="text-[#01ccff]"/> Phiên bản tối ưu</h4><button onClick={() => handleCopy(auditResult.rewritten_text)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-[#01ccff] transition-colors"><Copy size={16}/></button></div>
                   <div className="bg-[#f8f9fa] p-6 rounded-xl border border-slate-200 text-slate-700 leading-relaxed font-sans text-sm whitespace-pre-wrap">{auditResult.rewritten_text}</div>
                </div>
              )}

              {auditResult.improvement_tips?.length > 0 && (
                <div className="bg-amber-50 rounded-2xl border border-amber-100 p-6">
                   <h4 className="text-sm font-bold text-amber-800 uppercase tracking-wide mb-3 flex items-center gap-2"><Lightbulb size={16}/> Tips cải thiện</h4>
                   <div className="space-y-2">{auditResult.improvement_tips.map((tip:string, i:number) => <div key={i} className="flex gap-3 items-start text-sm text-amber-900"><span className="font-bold text-amber-500/50">{i+1}.</span>{tip}</div>)}</div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 p-12">
              <BarChart2 size={48} className="text-slate-300 mb-4 opacity-50" />
              <p className="font-bold text-lg text-slate-500">Kết quả phân tích sẽ hiển thị ở đây</p>
              <p className="text-sm text-slate-400 mt-2">Nhập nội dung hoặc dán Link Website để bắt đầu</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditorTab;
