
import React, { useState } from 'react';
import { Eye, CheckCircle, AlertCircle, X, Activity } from 'lucide-react';
import { Auditor, Brand } from '../../types';

interface HistoryAuditsTabProps {
  auditors: Auditor[];
  brands: Brand[];
  availableBrands: Brand[];
}

const HistoryAuditsTab: React.FC<HistoryAuditsTabProps> = ({ auditors, brands, availableBrands }) => {
  const [selectedAuditsFilterBrand, setSelectedAuditsFilterBrand] = useState('all');
  const [selectedAuditor, setSelectedAuditor] = useState<Auditor | null>(null);
  const [isAuditorDetailOpen, setIsAuditorDetailOpen] = useState(false);

  const formatTimestamp = (ts: any) => {
    if (!ts) return '';
    try {
      if (ts.toDate) return ts.toDate().toLocaleString('vi-VN');
      return new Date(ts).toLocaleString('vi-VN');
    } catch (e) { return ''; }
  };

  return (
    <div className="animate-in fade-in max-w-6xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-2xl font-bold text-[#102d62]">Lịch sử Voice Auditor</h1><p className="text-slate-500 text-sm">Nhật ký kiểm duyệt nội dung</p></div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
            <div className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-500">{auditors.length} Audits</div>
            <select className="bg-transparent text-sm font-bold text-[#102d62] outline-none cursor-pointer" value={selectedAuditsFilterBrand} onChange={e => setSelectedAuditsFilterBrand(e.target.value)}>
              <option value="all">Tất cả Brands</option>
              {availableBrands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-[#102d62] uppercase tracking-wide">
            <tr><th className="px-6 py-4 text-left">Thời gian</th><th className="px-6 py-4 text-left">Brand</th><th className="px-6 py-4 text-left">Score</th><th className="px-6 py-4 text-left">User</th><th className="px-6 py-4 text-right">Action</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {auditors.filter(a => selectedAuditsFilterBrand === 'all' || a.brand_id === selectedAuditsFilterBrand).map(a => {
                const score = Math.round(a.output_data?.overall_score || 0);
                return (
                <tr key={a.id} className="hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => { setSelectedAuditor(a); setIsAuditorDetailOpen(true); }}>
                  <td className="px-6 py-4 align-top"><div className="font-bold text-[#102d62]">{formatTimestamp(a.timestamp).split(' ')[1]}</div><div className="text-xs text-slate-400">{formatTimestamp(a.timestamp).split(' ')[0]}</div></td>
                  <td className="px-6 py-4 align-top font-bold text-[#102d62]">{brands.find(b => b.id === a.brand_id)?.name}</td>
                  <td className="px-6 py-4 align-top">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold ${score >= 80 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                        {score >= 80 ? <CheckCircle size={12}/> : <AlertCircle size={12}/>} {score}/100
                      </div>
                  </td>
                  <td className="px-6 py-4 align-top"><div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">{a.user_name?.charAt(0)}</div><span className="text-sm text-slate-600">{a.user_name}</span></div></td>
                  <td className="px-6 py-4 align-top text-right"><button className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-[#01ccff]"><Eye size={16}/></button></td>
                </tr>
                );
            })}
          </tbody>
        </table>
      </div>
      
      {isAuditorDetailOpen && selectedAuditor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-3"><div className="p-2 bg-cyan-100 rounded-lg text-cyan-600"><Activity size={20}/></div><div><h3 className="font-bold text-[#102d62]">Audit Report</h3><p className="text-xs text-slate-500">{formatTimestamp(selectedAuditor.timestamp)} • {brands.find(b => b.id === selectedAuditor.brand_id)?.name}</p></div></div>
                <button onClick={() => setIsAuditorDetailOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400"><X size={20}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 grid md:grid-cols-2 gap-0 divide-x divide-slate-100">
                <div className="pr-6">
                  <h4 className="text-xs font-bold text-[#102d62] uppercase tracking-wide mb-3 bg-slate-100 p-2 rounded-lg inline-block">Văn bản gốc</h4>
                  <div className="text-sm text-slate-600 whitespace-pre-wrap font-mono bg-slate-50 p-4 rounded-xl border border-slate-200 leading-relaxed">{selectedAuditor.input_data.text || selectedAuditor.input_data.rawText}</div>
                </div>
                <div className="pl-6">
                  <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wide mb-3 bg-emerald-50 p-2 rounded-lg inline-block">Văn bản tối ưu</h4>
                  <div className="text-sm text-slate-700 whitespace-pre-wrap font-sans bg-white p-4 rounded-xl border border-slate-200 leading-relaxed shadow-sm">{selectedAuditor.output_data?.rewritten_text || "No rewritten text available"}</div>
                  
                  <div className="mt-6 space-y-4">
                      <div className="flex gap-4">
                        <div className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-100"><div className="text-[10px] uppercase font-bold text-slate-400">Score</div><div className="text-2xl font-bold text-[#102d62]">{Math.round(selectedAuditor.output_data?.overall_score || 0)}</div></div>
                        <div className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-100"><div className="text-[10px] uppercase font-bold text-slate-400">Tone</div><div className="text-sm font-bold text-[#102d62]">{selectedAuditor.output_data?.brand_voice_assessment?.tone_quality}</div></div>
                      </div>
                      {selectedAuditor.output_data?.identified_issues?.length > 0 && (
                        <div className="border border-red-100 rounded-xl overflow-hidden">
                            <div className="bg-red-50 px-3 py-2 text-xs font-bold text-red-700 uppercase">Issues Found</div>
                            <ul className="divide-y divide-red-50">
                              {selectedAuditor.output_data.identified_issues.map((i:any, idx:number) => (
                                  <li key={idx} className="p-3 text-xs text-slate-600"><span className="font-bold text-red-500 block mb-0.5">{i.issue_type}</span>{i.reason}</li>
                              ))}
                            </ul>
                        </div>
                      )}
                  </div>
                </div>
            </div>
          </div>
          </div>
      )}
    </div>
  );
};

export default HistoryAuditsTab;
