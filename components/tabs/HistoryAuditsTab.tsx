
import React, { useState, useMemo } from 'react';
import {
   Eye, CheckCircle, AlertCircle, X, Activity, Filter, Search,
   Calendar, Globe, ShieldCheck, AlertTriangle, Languages, BrainCircuit,
   Award, ShoppingBag, Copy, ChevronRight, FileCode, Check, Shield, User as UserIcon, Layout
} from 'lucide-react';
import { Auditor, Brand } from '../../types';
import { SectionHeader, BrandSelector } from '../UIComponents';
import { AUDIT_CATEGORIES } from '../../constants';

interface HistoryAuditsTabProps {
   auditors: Auditor[];
   brands: Brand[];
   availableBrands: Brand[];
}

const HistoryAuditsTab: React.FC<HistoryAuditsTabProps> = ({ auditors, brands, availableBrands }) => {
   const [selectedAuditsFilterBrand, setSelectedAuditsFilterBrand] = useState('all');
   const [searchTerm, setSearchTerm] = useState('');
   const [selectedAuditor, setSelectedAuditor] = useState<Auditor | null>(null);
   const [isAuditorDetailOpen, setIsAuditorDetailOpen] = useState(false);

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

   const filteredAudits = useMemo(() => {
      return auditors.filter(a => {
         const matchesBrand = selectedAuditsFilterBrand === 'all' || a.brand_id === selectedAuditsFilterBrand;
         const textToSearch = (a.input_data.text || a.input_data.rawText || '').toLowerCase();
         const matchesSearch = textToSearch.includes(searchTerm.toLowerCase());
         return matchesBrand && matchesSearch;
      });
   }, [auditors, selectedAuditsFilterBrand, searchTerm]);

   const getIssueCategoryIcon = (category: string) => {
      switch (category?.toLowerCase()) {
         case 'language': return <Languages size={14} />;
         case 'ai_logic': return <BrainCircuit size={14} />;
         case 'brand': return <Award size={14} />;
         case 'product': return <ShoppingBag size={14} />;
         default: return <AlertCircle size={14} />;
      }
   };

   return (
      <>
         <div className="animate-in fade-in flex-1 flex flex-col">
            <SectionHeader title="Auditor History" subtitle="Dữ liệu đối soát rủi ro & tuân thủ SOP Markdown toàn hệ thống.">
               <div className="relative group min-w-[280px]">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#01ccff] transition-colors" size={18} />
                  <input
                     type="text"
                     placeholder="Tìm kiếm theo chủ đề"
                     value={searchTerm}
                     onChange={e => setSearchTerm(e.target.value)}
                     className="w-full pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-2xl text-[13px] font-bold text-[#102d62] outline-none focus:ring-4 focus:ring-[#01ccff]/5 focus:border-[#01ccff]/30 transition-all shadow-sm"
                  />
               </div>
               <BrandSelector
                  availableBrands={availableBrands}
                  selectedBrandId={selectedAuditsFilterBrand}
                  onChange={setSelectedAuditsFilterBrand}
                  showAllOption={true}
                  className="min-w-[240px]"
               />
            </SectionHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
               {filteredAudits.length === 0 ? (
                  <div className="col-span-full py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-400">
                     <ShieldCheck size={64} strokeWidth={1} className="mb-4 opacity-20" />
                     <p className="font-bold text-lg text-slate-400">Hệ thống chưa có bản ghi Audit nào</p>
                  </div>
               ) : filteredAudits.map((a, idx) => {
                  const brand = brands.find(b => b.id === a.brand_id);
                  const ts = formatTimestamp(a.timestamp);
                  const issuesCount = a.output_data?.identified_issues?.length || 0;
                  const status = issuesCount === 0 ? 'Compliant' : 'Needs Review';

                  return (
                     <div
                        key={a.id}
                        onClick={() => { setSelectedAuditor(a); setIsAuditorDetailOpen(true); }}
                        className="bg-white p-7 rounded-[2.5rem] border border-slate-50 shadow-premium hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col h-full animate-in slide-in-from-bottom-4"
                        style={{ animationDelay: `${idx * 50}ms` }}
                     >
                        <div className="flex justify-between items-start mb-6">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-slate-50 text-[#102d62] flex items-center justify-center shadow-inner group-hover:bg-[#102d62] group-hover:text-[#01ccff] transition-all">
                                 <Activity size={24} />
                              </div>
                              <div>
                                 <h3 className="text-[13px] font-black text-[#102d62] line-clamp-1">{brand?.name || 'Unknown Brand'}</h3>
                                 <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{ts.date}</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                                    <span className="text-[10px] font-black text-[#01ccff]">{ts.time}</span>
                                 </div>
                              </div>
                           </div>
                           <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider border ${status === 'Compliant' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                              {status}
                           </div>
                        </div>

                        <div className="flex-1 mb-6">
                           <div className="flex flex-wrap items-center gap-2 mb-4">
                              <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[9px] font-black uppercase rounded-md border border-slate-200 flex items-center gap-1.5">
                                 <Layout size={10} /> {a.input_data.platform || 'General'}
                              </span>
                              <span className="px-2.5 py-1 bg-cyan-50 text-cyan-700 text-[9px] font-black uppercase rounded-md border border-cyan-100 flex items-center gap-1.5">
                                 <Languages size={10} /> {a.input_data.language || 'Vietnamese'}
                              </span>
                           </div>
                           <p className="text-[13px] text-slate-500 font-bold italic leading-relaxed line-clamp-3">"{a.input_data.text || a.input_data.rawText}"</p>
                        </div>

                        <div className="flex items-center gap-2 mb-6">
                           <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase flex items-center gap-1.5 ${issuesCount > 0 ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                              {issuesCount > 0 ? <AlertTriangle size={12} /> : <CheckCircle size={12} />}
                              {issuesCount === 0 ? 'Perfect Compliance' : `${issuesCount} Quality Issues`}
                           </span>
                        </div>

                        <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                           <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-slate-100 text-[#102d62] flex items-center justify-center text-[10px] font-black border border-slate-200 uppercase">{a.user_name?.charAt(0)}</div>
                              <span className="text-[11px] font-bold text-slate-500">{a.user_name}</span>
                           </div>
                           <div className="flex items-center gap-1.5 text-[10px] font-black text-[#102d62] uppercase tracking-widest group-hover:text-[#01ccff] transition-colors">
                              Report <ChevronRight size={14} />
                           </div>
                        </div>
                     </div>
                  );
               })}
            </div>
         </div>

         {/* Detail Modal moved outside of animate-in container to bypass stacking context limits */}
         {isAuditorDetailOpen && selectedAuditor && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
               <div className="bg-white w-full max-w-7xl rounded-[3rem] shadow-2xl flex flex-col h-[92vh] overflow-hidden animate-in zoom-in-95">
                  <div className="px-10 py-7 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                     <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 text-[#102d62] flex items-center justify-center shadow-inner">
                           <ShieldCheck size={32} />
                        </div>
                        <div>
                           <h3 className="text-2xl font-black text-[#102d62] uppercase tracking-tight leading-none mb-2">Detailed Compliance Report</h3>
                           <div className="flex items-center gap-4">
                              <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                                 <Calendar size={14} /> {formatTimestamp(selectedAuditor.timestamp).full}
                              </p>
                              <span className="text-slate-300">•</span>
                              <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5"><UserIcon size={14} /> {selectedAuditor.user_name}</p>
                           </div>
                        </div>
                     </div>
                     <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                           <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Audit Status</div>
                           <div className={`text-xl font-black uppercase tracking-wider ${(selectedAuditor.output_data?.identified_issues?.length || 0) === 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                              {(selectedAuditor.output_data?.identified_issues?.length || 0) === 0 ? 'Approved' : 'Action Required'}
                           </div>
                        </div>
                        <button onClick={() => setIsAuditorDetailOpen(false)} className="p-3 hover:bg-slate-50 rounded-2xl text-slate-300 hover:text-red-500 transition-all">
                           <X size={32} />
                        </button>
                     </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-10 grid lg:grid-cols-12 gap-8 custom-scrollbar bg-slate-50/20">
                     <div className="lg:col-span-8 space-y-8">
                        <div className="grid md:grid-cols-2 gap-8">
                           <div className="bg-white rounded-[2rem] border border-slate-100 shadow-premium overflow-hidden flex flex-col">
                              <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><FileCode size={14} /> Input Specification</span>
                              </div>
                              <div className="p-8 space-y-4 flex-1">
                                 <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                       <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Platform</span>
                                       <span className="text-xs font-bold text-[#102d62]">{selectedAuditor.input_data.platform || 'General'}</span>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                       <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Language</span>
                                       <span className="text-xs font-bold text-[#102d62]">{selectedAuditor.input_data.language || 'Vietnamese'}</span>
                                    </div>
                                 </div>
                                 <div className="text-[14px] text-slate-600 font-medium leading-[1.8] whitespace-pre-wrap italic">
                                    "{selectedAuditor.input_data.text || selectedAuditor.input_data.rawText}"
                                 </div>
                              </div>
                           </div>

                           <div className="bg-[#102d62] rounded-[2rem] border border-blue-900 shadow-premium overflow-hidden flex flex-col text-white">
                              <div className="px-6 py-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
                                 <span className="text-[10px] font-black text-[#01ccff] uppercase tracking-widest flex items-center gap-2"><Shield size={14} className="text-[#01ccff]" /> Optimized Result</span>
                              </div>
                              <div className="p-8 text-[14px] text-blue-50 font-medium leading-[1.8] whitespace-pre-wrap flex-1 overflow-y-auto custom-scrollbar">
                                 {selectedAuditor.output_data?.rewritten_text || "Bản thảo đã chuẩn mực, không cần chỉnh sửa."}
                              </div>
                              <div className="px-8 py-4 border-t border-white/5 flex justify-end shrink-0">
                                 <button onClick={() => { navigator.clipboard.writeText(selectedAuditor.output_data?.rewritten_text || ''); }} className="text-[10px] font-black uppercase text-[#01ccff] hover:underline flex items-center gap-2 tracking-widest">
                                    <Copy size={14} /> Copy Content
                                 </button>
                              </div>
                           </div>
                        </div>

                        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-50 shadow-premium shrink-0">
                           <div className="flex items-center gap-3 mb-8">
                              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Activity size={20} /></div>
                              <div>
                                 <h4 className="text-lg font-black text-[#102d62] uppercase tracking-tight leading-none mb-1">AI Audit Synopsis</h4>
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compliance Overview</p>
                              </div>
                           </div>
                           <p className="text-[16px] text-slate-600 font-medium leading-relaxed italic border-l-4 border-[#01ccff] pl-6 bg-slate-50 p-7 rounded-r-2xl shadow-inner-soft">
                              "{selectedAuditor.output_data?.summary}"
                           </p>
                        </div>
                     </div>

                     <div className="lg:col-span-4 h-full overflow-hidden">
                        <div className="bg-white p-8 rounded-[2.5rem] shadow-premium border border-slate-100 flex flex-col h-full overflow-hidden">
                           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center justify-between shrink-0">
                              <span className="flex items-center gap-2"><AlertTriangle size={14} className="text-amber-500" /> Violation Log ({selectedAuditor.output_data?.identified_issues?.length || 0})</span>
                           </h4>

                           <div className="space-y-6 overflow-y-auto custom-scrollbar pr-2 flex-1">
                              {selectedAuditor.output_data?.identified_issues?.length > 0 ? (
                                 selectedAuditor.output_data.identified_issues.map((issue: any, idx: number) => (
                                    <div key={idx} className="p-5 rounded-3xl bg-slate-50 border border-slate-100 animate-in slide-in-from-bottom-2">
                                       <div className="flex items-center justify-between mb-4">
                                          <div className="flex items-center gap-2">
                                             <span className="p-1.5 bg-white rounded-lg text-slate-400 shadow-sm border border-slate-100">{getIssueCategoryIcon(issue.category)}</span>
                                             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{issue.category}</span>
                                          </div>
                                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border ${issue.severity?.toLowerCase() === 'high' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                             {issue.severity} Severity
                                          </span>
                                       </div>
                                       <p className="text-[12px] text-slate-600 font-bold leading-relaxed mb-4">"{issue.problematic_text}"</p>
                                       <p className="text-[12px] text-slate-500 font-medium leading-relaxed mb-4 italic">{issue.reason}</p>
                                       <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-100/50 flex gap-2">
                                          <Check size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                                          <p className="text-[11px] text-emerald-800 font-bold leading-relaxed"><span className="text-emerald-500 uppercase text-[9px] font-black block mb-1">Sửa thành</span> {issue.suggestion}</p>
                                       </div>
                                    </div>
                                 ))
                              ) : (
                                 <div className="h-full flex flex-col items-center justify-center py-20 text-center text-slate-300">
                                    <CheckCircle size={56} className="mb-4 text-emerald-400 opacity-40" strokeWidth={1} />
                                    <p className="font-black text-[11px] uppercase tracking-widest text-emerald-600/60">No Risks Found</p>
                                 </div>
                              )}
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         )}
      </>
   );
};

export default HistoryAuditsTab;
