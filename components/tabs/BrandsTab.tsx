
import React from 'react';
import { PlusCircle, Building2, Edit3, Trash2, Target, Zap, Globe, ShieldCheck } from 'lucide-react';
import { Brand, User } from '../../types';
import { SectionHeader } from '../UIComponents';

interface BrandsTabProps {
  availableBrands: Brand[];
  currentUser: User;
  setEditingBrand: (brand: Brand | null) => void;
  setIsBrandModalOpen: (isOpen: boolean) => void;
  handleDeleteBrand: (id: string) => void;
}

const BrandsTab: React.FC<BrandsTabProps> = ({ availableBrands, currentUser, setEditingBrand, setIsBrandModalOpen, handleDeleteBrand }) => {
  return (
    <div className="animate-in fade-in max-w-5xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-8">
          <SectionHeader title="Brand Management" subtitle="Quản lý chiến lược và nhận diện thương hiệu tập trung" />
          {(currentUser.role === 'admin' || currentUser.role === 'brand_owner') && (
              <button onClick={() => { setEditingBrand(null); setIsBrandModalOpen(true); }} className="px-6 py-3 bg-[#102d62] text-white rounded-xl font-bold hover:bg-blue-900 shadow-xl flex items-center gap-2 transition-all hover:-translate-y-1"><PlusCircle size={20}/> Thêm Brand Mới</button>
          )}
      </div>

      <div className="grid gap-6">
          {availableBrands.length === 0 ? (
            <div className="bg-white p-20 rounded-3xl border border-dashed border-slate-200 text-center text-slate-400">
               <Building2 size={48} className="mx-auto mb-4 opacity-20" />
               <p className="font-bold">Chưa có thương hiệu nào được đăng ký</p>
            </div>
          ) : availableBrands.map(b => (
              <div key={b.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all flex flex-col md:flex-row overflow-hidden group">
                {/* Brand Color Strip */}
                <div className="w-full md:w-3 shrink-0" style={{ backgroundColor: b.primary_color || '#102d62' }}></div>
                
                <div className="p-8 flex-1 flex flex-col md:flex-row gap-8">
                   <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-4 bg-slate-50 rounded-2xl text-[#102d62] group-hover:bg-[#102d62] group-hover:text-white transition-all duration-300">
                          <Building2 size={32}/>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                             <h3 className="text-2xl font-extrabold text-[#102d62]">{b.name}</h3>
                             {b.industry && <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-lg uppercase border border-blue-100">{b.industry}</span>}
                          </div>
                          <p className="text-sm font-bold text-[#01ccff] italic">{b.slogan || b.tagline || 'Digital Growth Partner'}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
                        <div className="space-y-1">
                           <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1"><Zap size={10}/> USP</span>
                           <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{b.usp?.join(', ') || 'Lợi thế độc bản chưa cập nhật'}</p>
                        </div>
                        <div className="space-y-1">
                           <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1"><ShieldCheck size={10}/> AI Rule</span>
                           <div className="flex flex-wrap gap-1">
                              {b.brand_personality?.slice(0, 3).map((p, i) => (
                                <span key={i} className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-medium">{p}</span>
                              ))}
                              {(!b.brand_personality || b.brand_personality.length === 0) && <span className="text-[9px] text-slate-400 italic">Chưa có Rule</span>}
                           </div>
                        </div>
                      </div>
                   </div>

                   <div className="flex md:flex-col gap-2 justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-8">
                      <button 
                        onClick={() => { setEditingBrand(b); setIsBrandModalOpen(true); }} 
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-600 rounded-xl font-bold text-xs hover:bg-[#102d62] hover:text-white transition-all"
                      >
                        <Edit3 size={16}/> Sửa Hồ Sơ
                      </button>
                      {(currentUser.role === 'admin' || currentUser.role === 'brand_owner') && (
                        <button 
                          onClick={() => handleDeleteBrand(b.id)} 
                          className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-500 rounded-xl font-bold text-xs hover:bg-red-500 hover:text-white transition-all"
                        >
                          <Trash2 size={16}/> Xóa
                        </button>
                      )}
                   </div>
                </div>
              </div>
          ))}
      </div>
    </div>
  );
};

export default BrandsTab;
