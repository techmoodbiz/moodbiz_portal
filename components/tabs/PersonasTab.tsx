
import React, { useState, useEffect } from 'react';
import { UserCircle, Plus, Trash2, Edit3, Target, AlertCircle } from 'lucide-react';
import { Brand, Persona } from '../../types';
import { SectionHeader, BrandSelector } from '../UIComponents';
import { db } from '../../firebase';

interface PersonasTabProps {
  availableBrands: Brand[];
  selectedBrandId: string;
}

const PersonasTab: React.FC<PersonasTabProps> = ({ availableBrands, selectedBrandId: initialBrandId }) => {
  const [brandId, setBrandId] = useState(initialBrandId);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);

  const [formData, setFormData] = useState<Partial<Persona>>({
    name: '', jobTitle: '', industry: '', goals: '', painPoints: '', preferredLanguage: 'Vietnamese'
  });

  useEffect(() => {
    if (!brandId) return;
    const unsub = db.collection('personas').where('brand_id', '==', brandId).onSnapshot(snap => {
      setPersonas(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Persona)));
    });
    return unsub;
  }, [brandId]);

  const handleSave = async () => {
    const data = { ...formData, brand_id: brandId };
    if (editingPersona) {
      await db.collection('personas').doc(editingPersona.id).update(data);
    } else {
      const timestamp = Date.now();
      const personaId = `PER_${brandId}_${timestamp}`;
      await db.collection('personas').doc(personaId).set({
        ...data,
        id: personaId
      });
    }
    setIsModalOpen(false);
    setFormData({ name: '', jobTitle: '', industry: '', goals: '', painPoints: '', preferredLanguage: 'Vietnamese' });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Xác nhận xóa Persona này?')) {
      await db.collection('personas').doc(id).delete();
    }
  };

  return (
    <div className="animate-in fade-in">
      <div className="flex justify-between items-center mb-8">
        <SectionHeader title="Audience Personas" subtitle="Định nghĩa chân dung khách hàng mục tiêu để AI viết đúng insight." />
        <button onClick={() => { setEditingPersona(null); setIsModalOpen(true); }} className="px-5 py-2.5 bg-[#102d62] text-white rounded-xl font-bold flex items-center gap-2 shadow-lg">
          <Plus size={18} /> Thêm Persona
        </button>
      </div>

      <div className="mb-6 w-72">
        <BrandSelector availableBrands={availableBrands} selectedBrandId={brandId} onChange={setBrandId} />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {personas.length === 0 ? (
          <div className="col-span-full py-20 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
            Chưa có Persona nào được tạo cho Brand này.
          </div>
        ) : personas.map(p => (
          <div key={p.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-50 text-[#01ccff] rounded-xl group-hover:bg-[#102d62] transition-colors">
                <UserCircle size={24} />
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditingPersona(p); setFormData(p); setIsModalOpen(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit3 size={16}/></button>
                <button onClick={() => handleDelete(p.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
              </div>
            </div>
            <h3 className="text-xl font-bold text-[#102d62]">{p.name}</h3>
            <p className="text-sm font-bold text-[#01ccff] mb-4">{p.jobTitle} • {p.industry}</p>
            
            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1"><Target size={10}/> Mục tiêu</span>
                <p className="text-xs text-slate-600 line-clamp-2">{p.goals}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1"><AlertCircle size={10}/> Pain Points</span>
                <p className="text-xs text-slate-600 line-clamp-2">{p.painPoints}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-[#102d62] mb-6">{editingPersona ? 'Sửa Persona' : 'Thêm Persona'}</h2>
            <div className="space-y-4">
              <input className="w-full p-3 bg-slate-50 border rounded-xl" placeholder="Tên khách hàng (Persona Name)" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <input className="w-full p-3 bg-slate-50 border rounded-xl" placeholder="Chức danh" value={formData.jobTitle} onChange={e => setFormData({...formData, jobTitle: e.target.value})} />
              <input className="w-full p-3 bg-slate-50 border rounded-xl" placeholder="Ngành nghề" value={formData.industry} onChange={e => setFormData({...formData, industry: e.target.value})} />
              <textarea className="w-full p-3 bg-slate-50 border rounded-xl h-24" placeholder="Mục tiêu / Khao khát" value={formData.goals} onChange={e => setFormData({...formData, goals: e.target.value})} />
              <textarea className="w-full p-3 bg-slate-50 border rounded-xl h-24" placeholder="Nỗi đau / Rào cản" value={formData.painPoints} onChange={e => setFormData({...formData, painPoints: e.target.value})} />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-bold text-slate-500">Hủy</button>
              <button onClick={handleSave} className="px-6 py-2 bg-[#102d62] text-white rounded-xl font-bold">Lưu Persona</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonasTab;
