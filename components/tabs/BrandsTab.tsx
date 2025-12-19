
import React from 'react';
import { PlusCircle, Building2, Edit3, Trash2 } from 'lucide-react';
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
          <SectionHeader title="Quản lý Brand" subtitle="Thêm và cấu hình các Brand trong hệ thống" />
          {(currentUser.role === 'admin' || currentUser.role === 'brand_owner') && (
              <button onClick={() => { setEditingBrand(null); setIsBrandModalOpen(true); }} className="px-6 py-3 bg-[#102d62] text-white rounded-xl font-bold hover:bg-blue-900 shadow-lg flex items-center gap-2"><PlusCircle size={20}/> Thêm Brand</button>
          )}
      </div>
      <div className="grid gap-6">
          {availableBrands.map(b => (
              <div key={b.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex justify-between items-start group">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-blue-50 rounded-lg text-[#01ccff] group-hover:bg-[#102d62] transition-colors"><Building2 size={24}/></div>
                      <div><h3 className="text-xl font-bold text-[#102d62]">{b.name}</h3><div className="text-[10px] font-mono text-slate-400">ID: {b.id}</div></div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-8 mt-4 pl-14">
                      <div><div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Personality</div><p className="text-sm text-slate-600 line-clamp-2">{b.personality}</p></div>
                      <div><div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Voice</div><p className="text-sm text-slate-600 line-clamp-2">{b.voice}</p></div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => { setEditingBrand(b); setIsBrandModalOpen(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit3 size={20}/></button>
                    {(currentUser.role === 'admin' || currentUser.role === 'brand_owner') && (
                      <button onClick={() => handleDeleteBrand(b.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={20}/></button>
                    )}
                </div>
              </div>
          ))}
      </div>
    </div>
  );
};

export default BrandsTab;
