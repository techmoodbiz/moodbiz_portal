
import React, { useState, useMemo } from 'react';
import { 
  Eye, FileText, X, Copy, Activity, RefreshCw, Filter, 
  BookOpen, Search, Calendar, User as UserIcon, MessageSquare, 
  ChevronRight, Sparkles, Layout, Facebook, Globe, Mail, Linkedin, PenTool, Languages
} from 'lucide-react';
import { Generation, Brand, User, SystemPrompts, Auditor, Guideline } from '../../types';
import { CommentSection, SectionHeader, BrandSelector } from '../UIComponents';
import { addCommentToGeneration, auditContent } from '../../services/api';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGeneration, setSelectedGeneration] = useState<Generation | null>(null);
  const [isGenDetailOpen, setIsGenDetailOpen] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<any>(null);

  const formatTimestamp = (ts: any) => {
    if (!ts) return { full: '', time: '', date: '' };
    try {
      const date = ts.toDate ? ts.toDate() : new Date(ts);
      return {
        full: date.toLocaleString('vi-VN'),
        time: date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        date: date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
      };
    } catch (e) { return { full: '', time: '', date: '' }; }
  };

  const getPlatformIcon = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes('facebook')) return <Facebook size={18} className="text-blue-600" />;
    if (p.includes('linkedin')) return <Linkedin size={18} className="text-blue-700" />;
    if (p.includes('web') || p.includes('seo')) return <Globe size={18} className="text-emerald-600" />;
    if (p.includes('email')) return <Mail size={18} className="text-amber-600" />;
    return <PenTool size={18} className="text-slate-600" />;
  };

  const filteredGenerations = useMemo(() => {
    return generations.filter(g => {
      const matchesBrand = selectedGenerationsFilterBrand === 'all' || g.brand_id === selectedGenerationsFilterBrand;
      const matchesSearch = g.input_data.topic.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           g.input_data.platform.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesBrand && matchesSearch;
    });
  }, [generations, selectedGenerationsFilterBrand, searchTerm]);

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

    const approvedGuide = guidelines.find(g => g.brand_id === brand.id && g.status === 'approved');
    const guideContext = approvedGuide?.guideline_text ? `GUIDELINE:\n${approvedGuide.guideline_text}\n` : '';

    const isWebsite = (selectedGeneration.input_data.platform || '').toLowerCase().includes('web');
    const basePrompt = isWebsite ? systemPrompts.auditor.website : systemPrompts.auditor.social;
    
    const prompt = basePrompt
      .replace(/{text}/g, selectedGeneration.output_data)
      .replace(/{dynamic_rules}/g, "Quy chuẩn SOP mặc định.")
      .replace(/{brand_name}/g, brand.name)
      .replace(/{brand_personality}/g, brand.brand_personality?.join(', ') || brand.personality)
      .replace(/{brand_voice}/g, brand.tone_of_voice || brand.voice)
      .replace(/{core_values}/g, brand.core_values?.join(', ') || 'N/A')
      .replace(/{do_words}/g, brand.do_words?.join(', ') || 'N/A')
      .replace(/{dont_words}/g, brand.dont_words?.join(', ') || 'N/A')
      .replace(/{guideline}/g, guideContext);

    try {
       const res = await auditContent({ brand, contentType: isWebsite ? 'website' : 'social', prompt });
       let outputData = res.result;
       if (typeof outputData === 'string') {
          try { outputData = JSON.parse(outputData.replace(/```json?/gi, '').replace(/```/g, '')); } 
          catch { outputData = { summary: outputData }; }
       }
       setAuditResult(outputData);
    } catch (e: any) {
       setToast({type:'error', message: "Audit thất bại"});
    } finally {
       setIsAuditing(false);
    }
  };

  return (
    <div className="animate-in fade-in h-full flex flex-col">
      <SectionHeader title="Content Library" subtitle="Kho lưu trữ bản thảo đã được xử lý bởi AI (Cập nhật Channel & Language).">
        <div className="relative group min-w-[280px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#01ccff] transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Tìm kiếm topic..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-2xl text-[13px] font-bold text-[#102d62] outline-none focus:ring-4 focus:ring-[#01ccff]/5 focus:border-[#01ccff]/30 transition-all shadow-sm"
          />
        </div>
        <BrandSelector 
          availableBrands={availableBrands} 
          selectedBrandId={selectedGenerationsFilterBrand} 
          onChange={setSelectedGenerationsFilterBrand} 
          showAllOption={true}
          className="min-w-[240px]"
        />
      </SectionHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
        {filteredGenerations.length === 0 ? (
          <div className="col-span-full py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-400">
             <Layout size={64} strokeWidth={1} className="mb-4 opacity-20" />
             <p className="font-bold text-lg text-slate-400">Không tìm thấy nội dung yêu cầu</p>
          </div>
        ) : filteredGenerations.map((g, idx) => {
          const ts = formatTimestamp(g.timestamp);
          const brand = brands.find(b => b.id === g.brand_id);
          return (
            <div 
              key={g.id} 
              onClick={() => { setSelectedGeneration(g); setAuditResult(null); setIsGenDetailOpen(true); }} 
              className="bg-white p-7 rounded-[2.5rem] border border-slate-50 shadow-premium hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group animate-in slide-in-from-bottom-4 flex flex-col h-full" 
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 text-[#102d62] flex items-center justify-center shadow-inner group-hover:bg-[#102d62] group-hover:text-[#01ccff] transition-all">
                    {getPlatformIcon(g.input_data.platform)}
                  </div>
                  <div>
                    <h4 className="text-[13px] font-black text-[#102d62] line-clamp-1">{brand?.name || 'Unknown Brand'}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{ts.date} • {ts.time}</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 mb-6">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                   <span className="px-2.5 py-1 bg-blue-50 text-blue-600 text-[9px] font-black uppercase rounded-md border border-blue-100 flex items-center gap-1.5">
                     <Layout size={10}/> {g.input_data.platform}
                   </span>
                   <span className="px-2.5 py-1 bg-cyan-50 text-cyan-700 text-[9px] font-black uppercase rounded-md border border-cyan-100 flex items-center gap-1.5">
                     <Languages size={10}/> {g.input_data.language || 'Vietnamese'}
                   </span>
                </div>
                <h3 className="text-[16px] font-black text-[#102d62] line-clamp-2 leading-snug group-hover:text-[#01ccff] transition-colors">{g.input_data.topic}</h3>
              </div>

              <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 text-[#102d62] flex items-center justify-center text-[10px] font-black border border-slate-200 uppercase">{g.user_name?.charAt(0)}</div>
                  <span className="text-[11px] font-bold text-slate-500">{g.user_name}</span>
                </div>
                <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>

      {isGenDetailOpen && selectedGeneration && currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-[1400px] rounded-[3rem] shadow-2xl flex flex-col h-[92vh] overflow-hidden animate-in zoom-in-95">
            <div className="px-10 py-7 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
                    {getPlatformIcon(selectedGeneration.input_data.platform)}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-[#102d62] uppercase tracking-tight leading-none mb-2">AI Workspace Details</h3>
                    <div className="flex items-center gap-4">
                      <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5"><Calendar size={14}/> {formatTimestamp(selectedGeneration.timestamp).full}</p>
                      <span className="text-slate-300">•</span>
                      <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5"><UserIcon size={14}/> {selectedGeneration.user_name}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                   <button onClick={() => handleCopy(selectedGeneration.output_data)} className="px-6 py-3.5 bg-[#102d62] text-white rounded-2xl font-black text-xs flex items-center gap-2 hover:bg-blue-900 transition-all shadow-xl uppercase tracking-widest"><Copy size={16}/> Copy Draft</button>
                   <button onClick={() => setIsGenDetailOpen(false)} className="p-3 hover:bg-slate-50 rounded-2xl text-slate-300 hover:text-red-500 transition-all"><X size={32}/></button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden bg-slate-50/20">
                <div className="flex-1 overflow-y-auto p-10 grid md:grid-cols-12 gap-10 custom-scrollbar">
                    <div className="md:col-span-4 space-y-8">
                      <section className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2"><RefreshCw size={14} className="text-[#01ccff]" /> Core Meta-data</h4>
                          <div className="space-y-6">
                            <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                               <span className="text-[10px] font-black text-slate-400 uppercase">Brand Profile</span>
                               <span className="text-sm font-bold text-[#102d62]">{brands.find(b => b.id === selectedGeneration.brand_id)?.name}</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                               <span className="text-[10px] font-black text-slate-400 uppercase">Platform</span>
                               <span className="px-2.5 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded uppercase border border-blue-100">{selectedGeneration.input_data.platform}</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                               <span className="text-[10px] font-black text-slate-400 uppercase">Language</span>
                               <span className="px-2.5 py-1 bg-cyan-50 text-cyan-600 text-[10px] font-black rounded uppercase border border-cyan-100">{selectedGeneration.input_data.language || 'Vietnamese'}</span>
                            </div>
                            <div>
                               <span className="text-[10px] font-black text-slate-400 uppercase block mb-2">Original Topic</span>
                               <p className="text-[13px] font-bold text-slate-600 leading-relaxed italic">"{selectedGeneration.input_data.topic}"</p>
                            </div>
                          </div>
                      </section>

                      {selectedGeneration.citations && selectedGeneration.citations.length > 0 && (
                        <section className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><BookOpen size={14} className="text-[#01ccff]"/> RAG References</h4>
                           <div className="flex flex-wrap gap-2">{selectedGeneration.citations.map((src, i) => (<span key={i} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-xl border border-emerald-100 flex items-center gap-2 truncate max-w-full"><div className="w-1 h-1 rounded-full bg-emerald-500 shrink-0"></div>{src}</span>))}</div>
                        </section>
                      )}

                      <section className={`p-8 rounded-[2rem] border shadow-premium transition-all ${auditResult ? 'bg-white border-slate-100' : 'bg-[#102d62] border-blue-900 text-white'}`}>
                        <div className="flex items-center justify-between mb-6">
                           <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 ${auditResult ? 'text-slate-400' : 'text-[#01ccff]'}`}><Sparkles size={14}/> Auto Quality Audit</h4>
                           {auditResult && <button onClick={() => setAuditResult(null)} className="text-[10px] font-black text-blue-500 hover:underline">Re-run</button>}
                        </div>
                        
                        {!auditResult ? (
                          <div className="text-center">
                            <p className="text-xs text-blue-200 font-medium mb-6 opacity-80 leading-relaxed">Xác thực độ tuân thủ của bản thảo này với Brand Profile & SOP hiện tại.</p>
                            <button onClick={handleQuickAudit} disabled={isAuditing} className="w-full py-4 bg-[#01ccff] text-[#102d62] rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white transition-all shadow-lg active:scale-95 disabled:opacity-50">{isAuditing ? <RefreshCw size={14} className="animate-spin"/> : <Activity size={16}/>} {isAuditing ? 'Analyzing...' : 'Run Audit'}</button>
                          </div>
                        ) : (
                          <div className="animate-in fade-in">
                             <div className="mb-4">
                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${auditResult.identified_issues?.length === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{auditResult.identified_issues?.length === 0 ? 'Compliant' : 'Issues Found'}</span>
                             </div>
                             <p className="text-[13px] text-slate-500 font-medium leading-relaxed italic mb-4">"{auditResult.summary}"</p>
                             {auditResult.identified_issues?.length > 0 && (
                               <div className="pt-4 border-t border-slate-100">
                                  <span className="text-[10px] font-black text-slate-300 uppercase block mb-3">Risks detected ({auditResult.identified_issues?.length})</span>
                                  <div className="space-y-3">
                                    {auditResult.identified_issues?.slice(0, 2).map((issue: any, i: number) => (<div key={i} className="text-[11px] font-bold text-slate-600 flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100"><div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0"></div>{issue.reason}</div>))}
                                  </div>
                               </div>
                             )}
                          </div>
                        )}
                      </section>
                    </div>

                    <div className="md:col-span-8 flex flex-col h-full bg-white rounded-[2.5rem] border border-slate-100 shadow-premium overflow-hidden">
                      <div className="px-8 py-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/50 shrink-0">
                         <div className="flex items-center gap-2">
                           <div className="p-2 bg-white rounded-lg shadow-sm"><FileText size={16} className="text-blue-600"/></div>
                           <span className="text-[10px] font-black text-[#102d62] uppercase tracking-[0.2em]">Studio Reader Mode</span>
                         </div>
                         <div className="flex items-center gap-4">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform: {selectedGeneration.input_data.platform}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lang: {selectedGeneration.input_data.language || 'VN'}</span>
                         </div>
                      </div>
                      <div className="p-12 overflow-y-auto flex-1 custom-scrollbar text-[17px] text-slate-700 leading-[1.9] font-sans whitespace-pre-wrap select-text selection:bg-[#01ccff]/20">
                        {selectedGeneration.output_data}
                      </div>
                    </div>
                </div>

                <div className="w-96 shrink-0 h-full border-l border-slate-100 bg-white">
                   <CommentSection parentId={selectedGeneration.id} currentUser={currentUser} onAddComment={async (content) => { await addCommentToGeneration(selectedGeneration.id, currentUser, content); }} />
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryGenerationsTab;
