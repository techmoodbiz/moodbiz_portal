
import React, { useState } from 'react';
import { Check, X, Star, FileText, Info } from 'lucide-react';
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
    showConfirm("Duyệt Guideline", "Duyệt và nạp tài liệu này vào hệ thống RAG Knowledge Base?", async () => {
      try {
        await approveGuideline(g.id, !!(g.file_url));
        setToast({type:'success', message: "Đã phê duyệt guideline"});
      } catch (e: any) {
        setToast({type:'error', message: "Lỗi: " + e.message});
      }
    }, 'info');
  };

  const handleSetPrimary = async (guideline: Guideline) => {
    try {
      // Unset previous primary for this brand
      const batch = db.batch();
      const currentPrimaries = guidelines.filter(g => g.brand_id === guideline.brand_id && g.is_primary);
      currentPrimaries.forEach(gp => {
        batch.update(db.collection('brand_guidelines').doc(gp.id), { is_primary: false });
      });
      
      // Set new primary
      batch.update(db.collection('brand_guidelines').doc(guideline.id), { is_primary: true });
      await batch.commit();
      
      setToast({ type: 'success', message: 'Đã thiết lập Guideline chủ chốt (Master)' });
    } catch (e: any) {
      setToast({ type: 'error', message: 'Lỗi: ' + e.message });
    }
  };

  const handleRejectGuideline = (id: string) => {
    showConfirm("Từ chối Guideline", "Từ chối tài liệu này?", async () => {
      await db.collection("brand_guidelines").doc(id).update({ status: "rejected", is_primary: false });
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
      <SectionHeader title="Knowledge Base & Guidelines" subtitle="Hệ thống tự động gom tất cả tài liệu Approved thành một bộ hướng dẫn tổng cho AI." />
      
      {/* Tip Info */}
      <div className="mb-8 p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-4 items-start shadow-sm">
        <div className="p-2 bg-blue-100 text-blue-600 rounded-xl"><Info size={20}/></div>
        <div>
          <h4 className="font-bold text-blue-900 text-sm">Hệ thống Consolidated RAG</h4>
          <p className="text-xs text-blue-700 leading-relaxed">Bạn có thể upload nhiều tài liệu (Sản phẩm, Key Visual, Brand Soul). AI sẽ tự động phân tích và gom thông tin từ <b>tất cả</b> tài liệu có trạng thái <span className="font-bold">Approved</span> khi generate nội dung.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tổng tài liệu</div>
            <div className="text-3xl font-black text-[#102d62]">{guidelines.length}</div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm border-l-4 border-emerald-500">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Approved</div>
            <div className="text-3xl font-black text-emerald-500">{guidelines.filter(g => g.status === 'approved').length}</div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm border-l-4 border-amber-500">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Đang chờ duyệt</div>
            <div className="text-3xl font-black text-amber-500">{guidelines.filter(g => g.status === 'pending').length}</div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm border-l-4 border-red-500">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Từ chối</div>
            <div className="text-3xl font-black text-red-500">{guidelines.filter(g => g.status === 'rejected').length}</div>
          </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-lg p-8 overflow-hidden">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div><h3 className="text-xl font-bold text-[#102d62]">Danh mục tài nguyên</h3><p className="text-xs text-slate-400">Quản lý các tài liệu quy chuẩn được nạp vào AI</p></div>
            <div className="w-full md:w-64">
              <BrandSelector availableBrands={availableBrands} selectedBrandId={selectedGuidelineBrandId} onChange={setSelectedGuidelineBrandId} showAllOption={true} />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50">
                  <tr>
                    <th className="pb-4 text-left pl-4">Brand</th>
                    <th className="pb-4 text-left">Tài liệu</th>
                    <th className="pb-4 text-left">Loại</th>
                    <th className="pb-4 text-left">Trạng thái</th>
                    <th className="pb-4 text-right pr-4">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {guidelines.filter(g => {
                      const hasAccess = availableBrands.some(b => b.id === g.brand_id);
                      const matchesFilter = selectedGuidelineBrandId === 'all' || g.brand_id === selectedGuidelineBrandId;
                      return hasAccess && matchesFilter;
                  }).map(g => {
                      const brandName = brands.find(b => b.id === g.brand_id)?.name || g.brand_id;
                      const statusColor = g.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : g.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-amber-50 text-amber-600 border-amber-100';
                      return (
                        <tr key={g.id} className={`hover:bg-slate-50/50 transition-colors ${g.is_primary ? 'bg-blue-50/30' : ''}`}>
                            <td className="py-5 pl-4 align-top">
                                <div className="font-bold text-[#102d62] text-xs">{brandName}</div>
                            </td>
                            <td className="py-5 align-top">
                                <div className="flex items-start gap-2">
                                  <div className={`p-2 rounded-lg ${g.is_primary ? 'bg-blue-100 text-[#01ccff]' : 'bg-slate-100 text-slate-400'}`}>
                                    {g.is_primary ? <Star size={16} fill="currentColor"/> : <FileText size={16}/>}
                                  </div>
                                  <div>
                                    <div className="font-bold text-[#102d62] flex items-center gap-2">
                                      {g.file_name}
                                      {g.is_primary && <span className="px-1.5 py-0.5 rounded-md bg-blue-100 text-[#01ccff] text-[8px] font-black uppercase">Master</span>}
                                    </div>
                                    <div className="text-[10px] text-slate-400 mt-1 max-w-xs">{g.description || 'Không có mô tả'}</div>
                                  </div>
                                </div>
                            </td>
                            <td className="py-5 align-top text-[11px] font-bold text-slate-500 uppercase">{g.type}</td>
                            <td className="py-5 align-top">
                                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase border ${statusColor}`}>{g.status}</span>
                            </td>
                            <td className="py-5 pr-4 align-top text-right">
                              <div className="flex justify-end gap-2 items-center">
                                  {g.guideline_text && <button onClick={() => setViewGuidelineModal({isOpen: true, title: g.file_name, content: g.guideline_text!})} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all"><FileText size={16}/></button>}
                                  
                                  {currentUser.role === 'admin' && (
                                    <>
                                      {g.status === 'approved' && !g.is_primary && (
                                        <button onClick={() => handleSetPrimary(g)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg group transition-all" title="Set as Master">
                                          <Star size={16} />
                                        </button>
                                      )}
                                      {g.status === 'pending' && (
                                        <div className="flex gap-1 ml-2">
                                            <button onClick={() => handleApproveGuideline(g)} className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100"><Check size={16}/></button>
                                            <button onClick={() => handleRejectGuideline(g.id)} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100"><X size={16}/></button>
                                        </div>
                                      )}
                                    </>
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
            <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95">
               <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
                  <div>
                    <h3 className="font-extrabold text-[#102d62] text-lg">{viewGuidelineModal.title}</h3>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Guideline Content Preview</p>
                  </div>
                  <button onClick={() => setViewGuidelineModal({...viewGuidelineModal, isOpen: false})} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><X size={24}/></button>
               </div>
               <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 text-sm font-sans leading-relaxed text-slate-700 whitespace-pre-wrap">{viewGuidelineModal.content}</div>
               <div className="px-8 py-5 border-t border-slate-100 flex justify-end gap-3 bg-white">
                  <button onClick={() => handleCopy(viewGuidelineModal.content)} className="px-6 py-2.5 bg-blue-50 text-blue-600 rounded-xl font-bold text-xs hover:bg-blue-100 transition-all">Sao chép nội dung</button>
                  <button onClick={() => setViewGuidelineModal({...viewGuidelineModal, isOpen: false})} className="px-6 py-2.5 bg-[#102d62] text-white rounded-xl font-bold text-xs hover:bg-blue-900 transition-all">Đóng</button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default GuidelinesTab;
