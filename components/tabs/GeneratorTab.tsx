
import React, { useState, useMemo } from 'react';
import { Hash, Monitor, RefreshCw, Sparkles, Copy, AlertTriangle, BookOpen, FileText, Globe, Info, ShieldCheck } from 'lucide-react';
import { Brand, SystemPrompts, User, Auditor, Guideline } from '../../types';
import { SectionHeader, BrandSelector, TemplateCard } from '../UIComponents';
import { GEN_TEMPLATES, SUPPORTED_LANGUAGES, PLATFORM_CONFIGS } from '../../constants';
import { generateContent } from '../../services/api';
import firebase, { db } from '../../firebase';

interface GeneratorTabProps {
  availableBrands: Brand[];
  selectedBrandId: string;
  setSelectedBrandId: (id: string) => void;
  systemPrompts: SystemPrompts;
  currentUser: User;
  setToast: (toast: any) => void;
  auditors: Auditor[];
  guidelines: Guideline[]; // Thêm guidelines prop
}

const GeneratorTab: React.FC<GeneratorTabProps> = ({ 
  availableBrands, 
  selectedBrandId, 
  setSelectedBrandId, 
  systemPrompts, 
  currentUser,
  setToast,
  auditors,
  guidelines
}) => {
  const [genTopic, setGenTopic] = useState('');
  const [genPlatform, setGenPlatform] = useState('Facebook Post');
  const [genLanguage, setGenLanguage] = useState('Vietnamese');
  const [genResult, setGenResult] = useState('');
  const [citations, setCitations] = useState<string[]>([]);
  const [ragInfo, setRagInfo] = useState<{ ragMethod: string; hasGuidelines: boolean } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Đếm số lượng guideline đã duyệt cho brand hiện tại
  const activeGuidelinesCount = useMemo(() => {
    return guidelines.filter(g => g.brand_id === selectedBrandId && g.status === 'approved').length;
  }, [guidelines, selectedBrandId]);

  // Calculate common mistakes from audit history
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

  const handleCopy = async (text: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setToast({ type: 'success', message: 'Đã copy nội dung vào clipboard!' });
    } catch (err) {
      setToast({ type: 'error', message: 'Không copy được.' });
    }
  };

  const handleGenerate = async () => {
    const brand = availableBrands.find(b => b.id === selectedBrandId);
    if (!brand) { setToast({type: 'error', message: "Chưa chọn thương hiệu."}); return; }
    
    setIsGenerating(true);
    setGenResult('');
    setCitations([]);
    setRagInfo(null);
    
    const mistakesPayload = commonMistakes.map(m => ({ type: m.type, count: m.count }));
    const mistakesText = commonMistakes.length > 0 
      ? commonMistakes.map(m => `- ${m.type} (lặp lại ${m.count} lần)`).join('\n') 
      : 'Chưa có dữ liệu lỗi quan trọng.';
    
    const platformRules = PLATFORM_CONFIGS[genPlatform] || 'Tuân thủ các quy tắc thông thường của nền tảng này.';

    const systemPrompt = systemPrompts.generator
      .replace(/{brand_name}/g, brand.name)
      .replace(/{brand_personality}/g, brand.personality)
      .replace(/{brand_voice}/g, brand.voice)
      .replace(/{language}/g, genLanguage)
      .replace(/{platform}/g, genPlatform)
      .replace(/{platform_rules}/g, platformRules)
      .replace(/{common_mistakes}/g, mistakesText);

    try {
      const data = await generateContent({
        brand: { ...brand, commonMistakes: mistakesPayload },
        topic: genTopic,
        platform: genPlatform,
        userText: "",
        systemPrompt,
        ragConfig: {
           minRelevanceScore: 0.7,
           topK: 10, // Tăng topK để lấy dữ liệu từ nhiều file hơn
           includeCitations: true
        }
      });

      let output = (data.result || 'No response').replace(/^\*\*\[Kênh:\s*[^\]]+\]\*\*\s*\n*/i, '').trim();
      
      const extractedCitations: string[] = [];
      const citationRegex = />\s*\[Source:\s*(.*?)\]/gi;
      let match;
      while ((match = citationRegex.exec(output)) !== null) {
          extractedCitations.push(match[1]);
      }
      
      output = output.replace(citationRegex, '').trim(); 
      const finalCitations = [...new Set([...(data.citations || []), ...extractedCitations])];

      setGenResult(output);
      setCitations(finalCitations);
      
      if (data.ragMethod) {
         setRagInfo({ ragMethod: data.ragMethod, hasGuidelines: data.hasGuidelines });
      }
      
      await db.collection('generations').add({
        brand_id: brand.id,
        user_id: currentUser.uid,
        user_name: currentUser.name || currentUser.displayName,
        input_data: { platform: genPlatform, topic: genTopic, language: genLanguage },
        output_data: output,
        citations: finalCitations,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      });
    } catch (e: any) {
      setGenResult("Lỗi AI: " + e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="animate-in fade-in h-full flex flex-col">
      <SectionHeader title="Content Generator" subtitle="Tạo nội dung Marketing chuẩn giọng văn" />
      
      <div className="grid lg:grid-cols-12 gap-8 flex-1">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100">
            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold text-[#102d62] uppercase tracking-wide mb-2 block">Chọn Thương Hiệu</label>
                <BrandSelector availableBrands={availableBrands} selectedBrandId={selectedBrandId} onChange={setSelectedBrandId} disabled={isGenerating} />
                
                {/* Knowledge Base Status */}
                <div className="mt-3 flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center gap-2">
                       <ShieldCheck size={14} className={activeGuidelinesCount > 0 ? "text-emerald-500" : "text-slate-300"} />
                       <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Cơ sở tri thức:</span>
                    </div>
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${activeGuidelinesCount > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-400'}`}>
                       {activeGuidelinesCount} NGUỒN DỮ LIỆU
                    </span>
                </div>
              </div>

              {/* Visualize Common Mistakes */}
              {commonMistakes.length > 0 && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2 text-amber-700 font-bold text-xs uppercase tracking-wide">
                    <AlertTriangle size={14} /> AI sẽ tự động tránh:
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

              <div>
                <label className="text-xs font-bold text-[#102d62] uppercase tracking-wide mb-2 flex items-center gap-2"><Hash size={14}/> Chủ đề bài viết</label>
                <textarea className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#01ccff] outline-none min-h-[100px]" placeholder="VD: Giải pháp SEO cho B2B..." value={genTopic} onChange={e => setGenTopic(e.target.value)} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#102d62] uppercase tracking-wide mb-2 flex items-center gap-2"><Globe size={14}/> Ngôn ngữ</label>
                    <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" value={genLanguage} onChange={e => setGenLanguage(e.target.value)}>
                      {SUPPORTED_LANGUAGES.map(lang => (
                        <option key={lang.code} value={lang.code}>{lang.flag} {lang.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#102d62] uppercase tracking-wide mb-2 flex items-center gap-2"><Monitor size={14}/> Kênh</label>
                    <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" value={genPlatform} onChange={e => setGenPlatform(e.target.value)}>
                      {Object.keys(PLATFORM_CONFIGS).map(platform => (
                         <option key={platform} value={platform}>{platform}</option>
                      ))}
                    </select>
                  </div>
              </div>

              {/* Platform Rules Hint */}
              {PLATFORM_CONFIGS[genPlatform] && (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                     <div className="flex items-center gap-2 mb-1 text-blue-800 font-bold text-xs uppercase tracking-wide">
                        <Info size={14}/> Quy tắc {genPlatform}:
                     </div>
                     <p className="text-[10px] text-blue-900/80 leading-relaxed whitespace-pre-line">
                        {PLATFORM_CONFIGS[genPlatform].split('\n')[1].trim()}...
                     </p>
                  </div>
              )}

              <button onClick={handleGenerate} disabled={isGenerating || !genTopic} className="w-full py-4 bg-[#102d62] text-white rounded-xl font-bold hover:bg-blue-900 transition-all flex justify-center items-center gap-2 shadow-lg shadow-blue-900/20 disabled:opacity-70 hover:-translate-y-1">
                {isGenerating ? <RefreshCw className="animate-spin" /> : <Sparkles size={18} />} {isGenerating ? 'Đang viết...' : 'Tạo Nội Dung'}
              </button>
            </div>
          </div>

          {/* Templates */}
          <div>
            <h3 className="text-sm font-bold text-[#102d62] mb-3 uppercase tracking-wide">Mẫu có sẵn</h3>
            <div className="grid grid-cols-1 gap-3">
              {GEN_TEMPLATES.map((t, i) => (
                <TemplateCard key={i} title={t.title} desc={t.desc} onClick={() => { setGenTopic(t.prompt); setGenPlatform(t.platform); }} />
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 h-full min-h-[600px]">
          {genResult ? (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 h-full flex flex-col animate-in fade-in slide-in-from-bottom-4">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                   <div className="flex items-center gap-2"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div><span className="font-bold text-[#102d62]">Kết quả AI ({genLanguage})</span></div>
                   
                   {/* RAG Status Badge */}
                   {ragInfo?.hasGuidelines && (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold uppercase border border-indigo-100">
                         <BookOpen size={12} />
                         RAG: {ragInfo.ragMethod === 'vector' ? 'Smart Vector' : 'Basic Match'}
                      </div>
                   )}
                </div>
                <button onClick={() => handleCopy(genResult)} className="text-slate-400 hover:text-[#01ccff] flex items-center gap-1 text-xs font-bold uppercase"><Copy size={16} /> Copy</button>
              </div>
              
              <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap flex-1 overflow-y-auto font-sans">
                {genResult}
              </div>

              {/* Citations / Sources Footer */}
              {citations.length > 0 && (
                <div className="mt-6 pt-4 border-t border-slate-100">
                   <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2"><FileText size={14}/> Nguồn tham khảo (Verified Sources)</h4>
                   <div className="grid gap-2">
                      {citations.map((c, idx) => {
                         const parts = c.split('-').map(s => s.trim());
                         const fileName = parts[0];
                         const pageInfo = parts.length > 1 ? parts.slice(1).join(' - ') : '';

                         return (
                           <div key={idx} className="flex items-center justify-between px-4 py-3 bg-blue-50/50 rounded-xl border border-blue-100 hover:bg-blue-50 transition-colors group">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg text-blue-600 border border-blue-100"><BookOpen size={16}/></div>
                                <div>
                                   <div className="text-sm font-bold text-[#102d62]">{fileName}</div>
                                   {pageInfo && <div className="text-xs text-slate-500">{pageInfo}</div>}
                                </div>
                              </div>
                              <div className="text-[10px] font-bold text-blue-400 px-2 py-1 bg-white rounded border border-blue-100">CITATION</div>
                           </div>
                         );
                      })}
                   </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 p-12">
              <div className="w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center mb-6"><Sparkles size={40} className="text-slate-300" /></div>
              <p className="font-bold text-lg text-slate-500">Nội dung được tạo sẽ hiển thị ở đây</p>
              <p className="text-sm text-slate-400 mt-2">Chọn thương hiệu và chủ đề để bắt đầu</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeneratorTab;
