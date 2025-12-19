
import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import { Guideline, Brand, User } from '../../types';
import { SectionHeader, BrandSelector } from '../UIComponents';
import { approveGuideline } from '../../services/api';
import { db } from '../../firebase';

interface GuidelinesTabProps {
  guidelines: Guideline[];
  availableBrands: Brand[];
  brands: Brand[];
  currentUser: User;
  setToast: (toast: any) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void, type: 'danger' | 'warning' | 'info') => void;
}

const GuidelinesTab: React.FC<GuidelinesTabProps> = ({ guidelines, availableBrands, brands, currentUser, setToast, showConfirm }) => {
  const [selectedGuidelineBrandId, setSelectedGuidelineBrandId] = useState("all");
  const [viewGuidelineModal, setViewGuidelineModal] = useState({ isOpen: false, title: '', content: '' });

  const handleApproveGuideline = async (g: Guideline) => {
    showConfirm("Duyệt Guideline", "Duyệt và ingest tài liệu này vào RAG?", async () => {
      try {
        await approveGuideline(g.id, !!(g.file_url));
        setToast({type:'success', message: "Đã approve guideline"});
      } catch (e: any) {
        setToast({type:'error', message: "Lỗi: " + e.message});
      }
    }, 'info');
  };

  const handleRejectGuideline = (id: string) => {
    showConfirm("Từ chối Guideline", "Từ chối tài liệu này?", async () => {
      await db.collection("brand_guidelines").doc(id).update({ status: "rejected" });
      setToast({type:'success', message: "Đã từ chối guideline"});
    }, 'warning');
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

  return (
    <div className="animate-in fade-in max-w-7xl mx-auto pb-20">
      <SectionHeader title="Brand Guidelines" subtitle="Quản lý tài liệu guideline, tone of voice và cấu trúc nội dung cho từng thương hiệu." />
      
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Tổng Guideline</div>
            <div className="text-4xl font-extrabold text-[#102d62]">{guidelines.length}</div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Approved</div>
            <div className="text-4xl font-extrabold text-emerald-500">{guidelines.filter(g => g.status === 'approved').length}</div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Pending</div>
            <div className="text-4xl font-extrabold text-amber-500">{guidelines.filter(g => g.status === 'pending').length}</div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Rejected</div>
            <div className="text-4xl font-extrabold text-red-500">{guidelines.filter(g => g.status === 'rejected').length}</div>
          </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-lg p-8">
          <div className="flex justify-between items-center mb-6">
            <div><h3 className="text-xl font-bold text-[#102d62]">Danh sách Brand Guidelines</h3><p className="text-sm text-slate-500">Theo dõi trạng thái tài liệu guideline đã upload cho brand.</p></div>
            <div className="w-64">
              <BrandSelector 
                availableBrands={availableBrands} 
                selectedBrandId={selectedGuidelineBrandId} 
                onChange={setSelectedGuidelineBrandId} 
                showAllOption={true} 
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="text-xs font-bold text-slate-400 uppercase tracking-wide border-b border-slate-100">
                  <tr><th className="pb-4 text-left pl-4">Brand</th><th className="pb-4 text-left">Tên File</th><th className="pb-4 text-left">Loại</th><th className="pb-4 text-left">Trạng thái</th><th className="pb-4 text-left">Người Upload</th><th className="pb-4 text-right pr-4">Thao tác</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {guidelines.filter(g => {
                      // Permission check
                      const hasAccess = availableBrands.some(b => b.id === g.brand_id);
                      // Filter check
                      const matchesFilter = selectedGuidelineBrandId === 'all' || g.brand_id === selectedGuidelineBrandId;
                      return hasAccess && matchesFilter;
                  }).map(g => {
                      const brandName = brands.find(b => b.id === g.brand_id)?.name || g.brand_id;
                      const statusColor = g.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : g.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700';
                      return (
                        <tr key={g.id} className="hover:bg-slate-50/50">
                            <td className="py-4 pl-4 font-bold text-[#102d62]">{brandName}</td>
                            <td className="py-4"><div className="font-medium text-[#102d62]">{g.file_name}</div><div className="text-xs text-slate-400 max-w-xs truncate">{g.description}</div></td>
                            <td className="py-4 text-slate-500 capitalize">{g.type}</td>
                            <td className="py-4"><span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${statusColor}`}>{g.status}</span></td>
                            <td className="py-4 text-slate-500 text-xs">{g.uploaded_by}</td>
                            <td className="py-4 pr-4 text-right">
                              <div className="flex justify-end gap-3 items-center">
                                  {g.guideline_text && <button onClick={() => setViewGuidelineModal({isOpen: true, title: g.file_name, content: g.guideline_text!})} className="text-xs font-bold text-[#01ccff] hover:underline">Xem nội dung</button>}
                                  {g.file_url && <a href={g.file_url} target="_blank" rel="noreferrer" className="text-xs font-bold text-[#01ccff] hover:underline">Tải file</a>}
                                  {currentUser.role === 'admin' && g.status === 'pending' && (
                                    <div className="flex gap-1 ml-2">
                                        <button onClick={() => handleApproveGuideline(g)} className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100"><Check size={14}/></button>
                                        <button onClick={() => handleRejectGuideline(g.id)} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><X size={14}/></button>
                                    </div>
                                  )}
                              </div>
                            </td>
                        </tr>
                      );
                  })}
                </tbody>
            </table>
          </div>
      </div>

      {viewGuidelineModal.isOpen && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden animate-in zoom-in-95">
               <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-bold text-[#102d62]">{viewGuidelineModal.title}</h3>
                  <button onClick={() => setViewGuidelineModal({...viewGuidelineModal, isOpen: false})} className="p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button>
               </div>
               <div className="flex-1 overflow-y-auto p-6 bg-slate-50 text-sm font-mono whitespace-pre-wrap text-slate-700">{viewGuidelineModal.content}</div>
               <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
                  <button onClick={() => handleCopy(viewGuidelineModal.content)} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold text-xs hover:bg-blue-100">Copy Content</button>
                  <button onClick={() => setViewGuidelineModal({...viewGuidelineModal, isOpen: false})} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-200">Close</button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default GuidelinesTab;
