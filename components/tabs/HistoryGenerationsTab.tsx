
import React, { useState, useMemo } from 'react';
import { Eye, FileText, X, Copy, Activity, RefreshCw, Filter, BookOpen } from 'lucide-react';
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

    const brandAudits = auditors.filter(a => a.brand_id === brand.id);
    const counts: Record<string, number> = {};
    brandAudits.forEach(audit => {
      const issues = audit.output_data?.identified_issues || [];
      issues.forEach((issue: any) => {
          const type = (issue.issue_type || 'Unknown').split('/')[0].trim().toLowerCase();
          counts[type] = (counts[type] || 0) + 1;
      });
    });
    const commonMistakes = Object.entries(counts).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count).slice(0, 5);
    const mistakesText = commonMistakes.map(m => `- ${m.type} (${m.count} lần)`).join('\n');

    const approvedGuide = guidelines.find(g => g.brand_id === brand.id && g.status === 'approved');
    const guideContext = approvedGuide?.guideline_text ? `GUIDELINE:\n${approvedGuide.guideline_text}\n` : '';

    const contentType = (selectedGeneration.input_data.platform || '').toLowerCase().includes('web') ? 'website' : 'social';
    const basePrompt = (contentType === 'website' ? systemPrompts.auditor.website : systemPrompts.auditor.social);
    
    const prompt = basePrompt
      .replace(/{text}/g, selectedGeneration.output_data)
      .replace(/{global_standards}/g, GLOBAL_AUDIT_STANDARDS)
      .replace(/{brand_name}/g, brand.name)
      .replace(/{brand_personality}/g, brand.personality)
      .replace(/{brand_voice}/g, brand.voice)
      .replace(/{audit_criteria}/g, brand.auditCriteria || 'N/A')
      .replace(/{guideline}/g, guideContext)
      .replace(/{commonmistakes}/g, mistakesText);

    try {
       const data = await auditContent({ brand, contentType, prompt });
       let outputData = data.result;
       if (typeof outputData === 'string') {
          try { outputData = JSON.parse(outputData.replace(/```json?/gi, '').replace(/```/g, '')); } 
          catch { outputData = { rawText: outputData }; }
       }
       setAuditResult(outputData);
    } catch (e: any) {
       setToast({type:'error', message: "Audit thất bại"});
    } finally {
       setIsAuditing(false);
    }
  };

  const filteredGenerations = useMemo(() => {
    return generations.filter(g => selectedGenerationsFilterBrand === 'all' || g.brand_id === selectedGenerationsFilterBrand);
  }, [generations, selectedGenerationsFilterBrand]);

  return (
    <div className="animate-in fade-in max-w-6xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-2xl font-bold text-[#102d62]">Lịch sử Content Generator</h1><p className="text-slate-500 text-sm">Nhật ký tạo nội dung AI</p></div>
      </div>
      
      <div className="flex items-center gap-3 mb-4">
         <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
            <Filter size={14} className="text-slate-400"/>
            <select className="bg-transparent text-sm font-bold text-[#102d62] outline-none cursor-pointer" value={selectedGenerationsFilterBrand} onChange={e => setSelectedGenerationsFilterBrand(e.target.value)}>
              <option value="all">Tất cả Brands</option>
              {availableBrands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
         </div>
         <div className="ml-auto px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-500">{filteredGenerations.length} Results</div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-[#102d62] uppercase tracking-wide">
            <tr><th className="px-6 py-4 text-left">Thời gian</th><th className="px-6 py-4 text-left">Nội dung</th><th className="px-6 py-4 text-left">User</th><th className="px-6 py-4 text-right">Action</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredGenerations.map(g => (
                <tr key={g.id} className="hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => { setSelectedGeneration(g); setAuditResult(null); setIsGenDetailOpen(true); }}>
                  <td className="px-6 py-4 align-top"><div className="font-bold text-[#102d62]">{formatTimestamp(g.timestamp).split(' ')[1]}</div><div className="text-xs text-slate-400">{formatTimestamp(g.timestamp).split(' ')[0]}</div></td>
                  <td className="px-6 py-4 align-top">
                      <div className="flex items-center gap-2 mb-1"><span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 text-blue-600">{g.input_data.platform}</span><span className="text-xs font-bold text-slate-500">• {brands.find(b => b.id === g.brand_id)?.name}</span></div>
                      <div className="font-medium text-[#102d62] line-clamp-1">{g.input_data.topic}</div>
                  </td>
                  <td className="px-6 py-4 align-top"><div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">{g.user_name?.charAt(0)}</div><span className="text-sm text-slate-600">{g.user_name}</span></div></td>
                  <td className="px-6 py-4 align-top text-right"><button className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-[#01ccff]"><Eye size={16}/></button></td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isGenDetailOpen && selectedGeneration && currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl flex flex-col h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-3"><div className="p-2 bg-blue-100 rounded-lg text-blue-600"><FileText size={20}/></div><div><h3 className="font-bold text-[#102d62]">Chi tiết nội dung</h3><p className="text-xs text-slate-500">{formatTimestamp(selectedGeneration.timestamp)}</p></div></div>
                <button onClick={() => setIsGenDetailOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400"><X size={20}/></button>
            </div>
            <div className="flex flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 grid md:grid-cols-2 gap-8 custom-scrollbar">
                    <div className="space-y-6">
                      <div><h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Input Parameters</h4>
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                            <div className="flex justify-between border-b border-slate-200 pb-2"><span className="text-xs font-bold text-slate-500">Brand</span><span className="text-xs font-bold text-[#102d62]">{brands.find(b => b.id === selectedGeneration.brand_id)?.name}</span></div>
                            <div className="flex justify-between border-b border-slate-200 pb-2"><span className="text-xs font-bold text-slate-500">Platform</span><span className="text-xs font-bold text-[#102d62]">{selectedGeneration.input_data.platform}</span></div>
                            <div><span className="text-xs font-bold text-slate-500 block mb-1">Topic</span><p className="text-sm text-[#102d62] font-medium">{selectedGeneration.input_data.topic}</p></div>
                          </div>
                      </div>

                      {selectedGeneration.citations && selectedGeneration.citations.length > 0 && (
                        <div>
                           <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-2"><BookOpen size={14}/> Sources Used</h4>
                           <div className="flex flex-wrap gap-2">
                              {selectedGeneration.citations.map((src, i) => (
                                <span key={i} className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-lg border border-blue-100">{src}</span>
                              ))}
                           </div>
                        </div>
                      )}

                      <div className="bg-[#f0f9ff] rounded-xl border border-blue-100 p-4">
                        <h4 className="text-xs font-bold text-[#102d62] uppercase mb-3 flex items-center gap-2"><Activity size={14}/> Quick Audit</h4>
                        {!auditResult ? (
                          <button onClick={handleQuickAudit} disabled={isAuditing} className="w-full py-2 bg-white border border-blue-200 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-50">
                            {isAuditing ? <RefreshCw size={14} className="animate-spin inline mr-1"/> : null} {isAuditing ? 'Đang phân tích...' : 'Audit ngay'}
                          </button>
                        ) : (
                          <div className="space-y-2">
                             <div className="text-2xl font-black text-[#102d62]">{Math.round(auditResult.overall_score || 0)}/100</div>
                             <p className="text-[10px] text-slate-500 italic">"{auditResult.summary}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 flex justify-between">Generated Output <button onClick={() => handleCopy(selectedGeneration.output_data)} className="text-[#01ccff] hover:underline flex items-center gap-1"><Copy size={12}/> Copy</button></h4>
                      <div className="bg-white p-6 rounded-xl border border-slate-200 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap shadow-inner min-h-[400px]">{selectedGeneration.output_data}</div>
                    </div>
                </div>
                <CommentSection parentId={selectedGeneration.id} currentUser={currentUser} onAddComment={async (content) => { await addCommentToGeneration(selectedGeneration.id, currentUser, content); }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryGenerationsTab;
