
import React, { useState, useMemo } from 'react';
import { Eye, FileText, X, Copy, CheckCircle, Activity, RefreshCw, AlertCircle, Filter, BookOpen } from 'lucide-react';
import { Generation, Brand, User, SystemPrompts, Auditor, Guideline } from '../../types';
import { CommentSection } from '../UIComponents';
import { addCommentToGeneration, auditContent } from '../../services/api';
import { GLOBAL_AUDIT_STANDARDS } from '../../constants';

interface HistoryGenerationsTabProps {
  generations: Generation[];
  brands: Brand[];
  availableBrands: Brand[];
  setToast: (toast: any) => void;
  currentUser?: User;
  systemPrompts: SystemPrompts;
  auditors: Auditor[];
  guidelines: Guideline[];
}

const HistoryGenerationsTab: React.FC<HistoryGenerationsTabProps> = ({ 
  generations, brands, availableBrands, setToast, currentUser, 
  systemPrompts, auditors, guidelines 
}) => {
  const [selectedGenerationsFilterBrand, setSelectedGenerationsFilterBrand] = useState('all');
  const [selectedGeneration, setSelectedGeneration] = useState<Generation | null>(null);
  const [isGenDetailOpen, setIsGenDetailOpen] = useState(false);
  
  // Quick Audit State
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<any>(null);

  const formatTimestamp = (ts: any) => {
    if (!ts) return '';
    try {
      if (ts.toDate) return ts.toDate().toLocaleString('vi-VN');
      return new Date(ts).toLocaleString('vi-VN');
    } catch (e) { return ''; }
  };

  const handleCopy = async (text: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setToast({ type: 'success', message: 'Đã copy nội dung!' });
    } catch (err) {
      setToast({ type: 'error', message: 'Lỗi copy.' });
    }
  };

  const handleQuickAudit = async () => {
    if (!selectedGeneration) return;
    const brand = brands.find(b => b.id === selectedGeneration.brand_id);
    if (!brand) return;

    setIsAuditing(true);
    setAuditResult(null);

    // Calculate mistakes (simple version)
    const brandAudits = auditors.filter(a => a.brand_id === brand.id);
    const counts: Record<string, number> = {};
    brandAudits.forEach(audit => {
      const issues = audit.output_data?.identified_issues || [];
      issues.forEach((issue: any) => {
          const type = (issue.issue_type || 'Unknown').split('/')[0].trim().toLowerCase();
          counts[type] = (counts[type] || 0) + 1;
      });
    });
    const commonMistakes = Object.entries(counts)
       .map(([type, count]) => ({ type, count }))
       .sort((a, b) => b.count - a.count)
       .slice(0, 5);
    const mistakesText = commonMistakes.map(m => `- ${m.type} (${m.count} lần)`).join('\n');

    // Guidelines
    const approvedGuide = guidelines.find(g => g.brand_id === brand.id && g.status === 'approved');
    const guideContext = approvedGuide?.guideline_text ? `GUIDELINE:\n${approvedGuide.guideline_text}\n` : '';

    const contentType = (selectedGeneration.input_data.platform || '').toLowerCase().includes('web') ? 'website' : 'social';
    const basePrompt = (contentType === 'website' ? systemPrompts.auditor.website : systemPrompts.auditor.social);
    
    const prompt = basePrompt
      .replace(/{text}/g, selectedGeneration.output_data)
      .replace(/{global_standards}/g, GLOBAL_AUDIT_STANDARDS)
      .replace(/{brand_name}/g, brand.name).replace(/{brandname}/g, brand.name)
      .replace(/{brand_personality}/g, brand.personality).replace(/{brandpersonality}/g, brand.personality)
      .replace(/{brand_voice}/g, brand.voice).replace(/{brandvoice}/g, brand.voice)
      .replace(/{audit_criteria}/g, brand.auditCriteria || 'N/A')
      .replace(/{guideline}/g, guideContext)
      .replace(/{commonmistakes}/g, mistakesText);

    try {
       const data = await auditContent({ brand: { ...brand, auditCriteria: brand.auditCriteria }, contentType, prompt });
       let outputData = data.result;
       if (typeof outputData === 'string') {
          try { outputData = JSON.parse(outputData.replace(/```json?/gi, '').replace(/```/g, '')); } 
          catch { outputData = { rawText: outputData }; }
       }

       // --- SCORE NORMALIZATION LOGIC ---
       let finalScore = outputData.overall_score || 0;
       if (finalScore <= 1 && finalScore > 0) finalScore *= 100;
       else if (finalScore <= 5 && finalScore > 1) finalScore *= 20;
       else if (finalScore <= 10 && finalScore > 5) finalScore *= 10;
       outputData.overall_score = finalScore;
       // ----------------------------------

       setAuditResult(outputData);
    } catch (e: any) {
       setToast({type:'error', message: "Audit thất bại: " + e.message});
    } finally {
       setIsAuditing(false);
    }
  };

  const handleOpenDetail = (g: Generation) => {
    setSelectedGeneration(g); 
    setAuditResult(null); 
    setIsGenDetailOpen(true);
  };

  const filteredGenerations = useMemo(() => {
    return generations.filter(g => {
       const brandMatch = selectedGenerationsFilterBrand === 'all' || g.brand_id === selectedGenerationsFilterBrand;
       return brandMatch;
    });
  }, [generations, selectedGenerationsFilterBrand]);

  return (
    <div className="animate-in fade-in max-w-6xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-2xl font-bold text-[#102d62]">Lịch sử Content Generator</h1><p className="text-slate-500 text-sm">Nhật ký tạo nội dung AI</p></div>
      </div>
      
      <div className="flex items-center gap-3 mb-4 overflow-x-auto pb-2">
         <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
            <Filter size={14} className="text-slate-400"/>
            <select className="bg-transparent text-sm font-bold text-[#102d62] outline-none cursor-pointer" value={selectedGenerationsFilterBrand} onChange={e => setSelectedGenerationsFilterBrand(e.target.value)}>
              <option value="all">Tất cả Brands</option>
              {availableBrands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
         </div>
         <div className="ml-auto px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-500 whitespace-nowrap">{filteredGenerations.length} Results</div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-[#102d62] uppercase tracking-wide">
            <tr><th className="px-6 py-4 text-left">Thời gian</th><th className="px-6 py-4 text-left">Nội dung</th><th className="px-6 py-4 text-left">User</th><th className="px-6 py-4 text-right">Action</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredGenerations.length === 0 ? (
               <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">Không tìm thấy dữ liệu phù hợp</td></tr>
            ) : filteredGenerations.map(g => {
                const brand = brands.find(b => b.id === g.brand_id);
                return (
                <tr key={g.id} className="hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => handleOpenDetail(g)}>
                  <td className="px-6 py-4 align-top"><div className="font-bold text-[#102d62]">{formatTimestamp(g.timestamp).split(' ')[1]}</div><div className="text-xs text-slate-400">{formatTimestamp(g.timestamp).split(' ')[0]}</div></td>
                  <td className="px-6 py-4 align-top">
                      <div className="flex items-center gap-2 mb-1"><span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 text-blue-600">{g.input_data.platform}</span><span className="text-xs font-bold text-slate-500">• {brand?.name}</span></div>
                      <div className="font-medium text-[#102d62] line-clamp-1">{g.input_data.topic}</div>
                      {g.citations && g.citations.length > 0 && (
                          <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                            <BookOpen size={10} /> {g.citations.length} nguồn tham khảo
                          </div>
                      )}
                  </td>
                  <td className="px-6 py-4 align-top"><div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">{g.user_name?.charAt(0)}</div><span className="text-sm text-slate-600">{g.user_name}</span></div></td>
                  <td className="px-6 py-4 align-top text-right"><button className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-[#01ccff]"><Eye size={16}/></button></td>
                </tr>
                );
            })}
          </tbody>
        </table>
      </div>

      {isGenDetailOpen && selectedGeneration && currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl flex flex-col h-[90vh] overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><FileText size={20}/></div>
                  <div>
                    <h3 className="font-bold text-[#102d62] flex items-center gap-3">
                      Chi tiết nội dung
                    </h3>
                    <p className="text-xs text-slate-500">{formatTimestamp(selectedGeneration.timestamp)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <button onClick={() => setIsGenDetailOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400"><X size={20}/></button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 grid md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      
                      {/* --- LEFT COLUMN: INFO & AUDIT --- */}
                      <div><h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Input Parameters</h4>
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                            <div className="flex justify-between border-b border-slate-200 pb-2"><span className="text-xs font-bold text-slate-500">Brand</span><span className="text-xs font-bold text-[#102d62]">{brands.find(b => b.id === selectedGeneration.brand_id)?.name}</span></div>
                            <div className="flex justify-between border-b border-slate-200 pb-2"><span className="text-xs font-bold text-slate-500">Platform</span><span className="text-xs font-bold text-[#102d62]">{selectedGeneration.input_data.platform}</span></div>
                            <div><span className="text-xs font-bold text-slate-500 block mb-1">Topic</span><p className="text-sm text-[#102d62] font-medium">{selectedGeneration.input_data.topic}</p></div>
                          </div>
                      </div>

                      {/* --- AI AUDIT ASSISTANT --- */}
                      <div className="bg-[#f0f9ff] rounded-xl border border-blue-100 overflow-hidden">
                          <div className="bg-blue-50 px-4 py-3 border-b border-blue-100 flex justify-between items-center">
                            <h4 className="text-xs font-bold text-[#102d62] uppercase tracking-wide flex items-center gap-2">
                              <Activity size={14} className="text-[#01ccff]"/> AI Review Assistant
                            </h4>
                            {auditResult && <span className="text-[10px] font-bold text-blue-400">Powered by Auditor</span>}
                          </div>
                          
                          <div className="p-4">
                            {!auditResult ? (
                              <div className="text-center py-4">
                                <p className="text-xs text-slate-500 mb-3">Kiểm tra chất lượng bài viết.</p>
                                <button onClick={handleQuickAudit} disabled={isAuditing} className="px-4 py-2 bg-white border border-blue-200 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-50 hover:border-blue-300 transition-all flex items-center justify-center gap-2 mx-auto shadow-sm w-full">
                                    {isAuditing ? <RefreshCw size={14} className="animate-spin"/> : <Activity size={14}/>} {isAuditing ? 'Đang phân tích...' : 'Kiểm tra ngay (Audit)'}
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-4 animate-in fade-in">
                                  <div className="flex items-center justify-between">
                                    <div className="text-3xl font-extrabold text-[#102d62]">{Math.round(auditResult.overall_score || 0)}<span className="text-xs font-bold text-slate-400">/100</span></div>
                                    <button onClick={handleQuickAudit} className="text-[10px] font-bold text-blue-400 hover:text-blue-600 flex items-center gap-1"><RefreshCw size={10}/> Re-run</button>
                                  </div>
                                  
                                  {/* Issues Summary */}
                                  <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">Vấn đề cần lưu ý</div>
                                    {auditResult.identified_issues?.length > 0 ? (
                                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                                          {auditResult.identified_issues.map((issue:any, i:number) => (
                                            <div key={i} className="flex gap-2 items-start bg-white p-2 rounded-lg border border-red-100">
                                                <AlertCircle size={12} className="text-red-500 shrink-0 mt-0.5"/>
                                                <div>
                                                  <div className="text-[10px] font-bold text-red-600">{issue.issue_type}</div>
                                                  <div className="text-[10px] text-slate-500 leading-tight">{issue.problematic_text}</div>
                                                </div>
                                            </div>
                                          ))}
                                      </div>
                                    ) : (
                                      <div className="text-xs text-emerald-600 flex items-center gap-1 bg-emerald-50 p-2 rounded-lg"><CheckCircle size={12}/> Không phát hiện lỗi nghiêm trọng</div>
                                    )}
                                  </div>

                                  {/* Recommendation */}
                                  <div className="pt-2 border-t border-blue-100">
                                    <p className="text-[10px] text-slate-500 leading-relaxed italic">
                                      "{auditResult.summary || 'Bài viết khá ổn.'}"
                                    </p>
                                  </div>
                              </div>
                            )}
                          </div>
                      </div>
                    </div>

                    {/* --- RIGHT COLUMN: CONTENT --- */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 flex justify-between">Generated Output <button onClick={() => handleCopy(selectedGeneration.output_data)} className="text-[#01ccff] hover:underline flex items-center gap-1"><Copy size={12}/> Copy</button></h4>
                      <div className="bg-white p-6 rounded-xl border border-slate-200 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap shadow-inner min-h-[400px]">{selectedGeneration.output_data}</div>
                      
                      {/* Citations Footer */}
                      {selectedGeneration.citations && selectedGeneration.citations.length > 0 && (
                        <div className="mt-4 bg-blue-50 p-4 rounded-xl border border-blue-100">
                           <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-3 flex items-center gap-2"><BookOpen size={14}/> Nguồn tham khảo (Verified Sources)</h4>
                           <div className="grid gap-2">
                              {selectedGeneration.citations.map((c, idx) => {
                                 const parts = c.split('-').map(s => s.trim());
                                 const fileName = parts[0];
                                 const pageInfo = parts.length > 1 ? parts.slice(1).join(' - ') : '';

                                 return (
                                 <div key={idx} className="flex items-center justify-between px-3 py-2 bg-white rounded-lg border border-blue-100 shadow-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                                        <div>
                                            <div className="text-xs font-bold text-[#102d62]">{fileName}</div>
                                            {pageInfo && <div className="text-[10px] text-slate-500">{pageInfo}</div>}
                                        </div>
                                    </div>
                                 </div>
                                 );
                              })}
                           </div>
                        </div>
                      )}
                    </div>
                </div>

                <CommentSection 
                  parentId={selectedGeneration.id} 
                  currentUser={currentUser}
                  onAddComment={async (content) => { await addCommentToGeneration(selectedGeneration.id, currentUser, content); }}
                />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryGenerationsTab;
