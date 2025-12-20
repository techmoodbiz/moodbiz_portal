
import React, { useState, useEffect } from 'react';
import { ClipboardList, Plus, Trash2, Edit3, Type, Info } from 'lucide-react';
import { Brand, ContentTemplate } from '../../types';
import { SectionHeader, BrandSelector } from '../UIComponents';
import { db } from '../../firebase';

interface TemplatesTabProps {
  availableBrands: Brand[];
  selectedBrandId: string;
}

const TemplatesTab: React.FC<TemplatesTabProps> = ({ availableBrands, selectedBrandId: initialBrandId }) => {
  const [brandId, setBrandId] = useState(initialBrandId);
  const [templates, setTemplates] = useState<ContentTemplate[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ContentTemplate | null>(null);

  const [formData, setFormData] = useState<Partial<ContentTemplate>>({
    name: '', structure: 'AIDA', description: '', prompt_skeleton: ''
  });

  useEffect(() => {
    if (!brandId) return;
    return db.collection('content_templates').where('brand_id', '==', brandId).onSnapshot(snap => {
      setTemplates(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContentTemplate)));
    });
  }, [brandId]);

  return (
    <div className="animate-in fade-in">
      <div className="flex justify-between items-center mb-8">
        <SectionHeader title="Content Frameworks" subtitle="Thiết lập các khung viết chuẩn (AIDA, PAS, Storytelling) cho AI." />
        <button onClick={() => { setEditingTemplate(null); setIsModalOpen(true); }} className="px-5 py-2.5 bg-[#102d62] text-white rounded-xl font-bold flex items-center gap-2 shadow-lg">
          <Plus size={18} /> Thêm Framework
        </button>
      </div>

      <div className="mb-6 w-72">
        <BrandSelector availableBrands={availableBrands} selectedBrandId={brandId} onChange={setBrandId} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {templates.map(t => (
          <div key={t.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex gap-4 hover:shadow-md transition-all">
            <div className="p-4 bg-purple-50 text-purple-600 rounded-xl h-fit">
              <ClipboardList size={24} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-[#102d62] text-lg">{t.name}</h3>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingTemplate(t); setFormData(t); setIsModalOpen(true); }} className="text-slate-400 hover:text-blue-600"><Edit3 size={16}/></button>
                  <button onClick={() => db.collection('content_templates').doc(t.id).delete()} className="text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                </div>
              </div>
              <div className="inline-block px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded mt-1 mb-3">{t.structure}</div>
              <p className="text-xs text-slate-500 line-clamp-2">{t.description}</p>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-[#102d62] mb-6">Cấu hình Framework</h2>
            <div className="space-y-4">
              <input className="w-full p-3 bg-slate-50 border rounded-xl" placeholder="Tên mẫu" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <select className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.structure} onChange={e => setFormData({...formData, structure: e.target.value as any})}>
                <option value="AIDA">AIDA (Attention, Interest, Desire, Action)</option>
                <option value="PAS">PAS (Problem, Agitate, Solution)</option>
                <option value="Storytelling">Storytelling</option>
                <option value="H-P-I-S-C">Hook - Problem - Insight - Solution - CTA</option>
              </select>
              <textarea className="w-full p-3 bg-slate-50 border rounded-xl h-24" placeholder="Mô tả công dụng" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              <textarea className="w-full p-3 bg-slate-50 border rounded-xl h-32 font-mono text-xs" placeholder="Prompt skeleton (VD: Hãy viết theo cấu trúc...)" value={formData.prompt_skeleton} onChange={e => setFormData({...formData, prompt_skeleton: e.target.value})} />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-500">Hủy</button>
              <button onClick={async () => {
                const data = { ...formData, brand_id: brandId };
                if (editingTemplate) {
                  await db.collection('content_templates').doc(editingTemplate.id).update(data);
                } else {
                  const timestamp = Date.now();
                  const templateId = `TPL_${brandId}_${timestamp}`;
                  await db.collection('content_templates').doc(templateId).set({
                    ...data,
                    id: templateId
                  });
                }
                setIsModalOpen(false);
              }} className="px-6 py-2 bg-[#102d62] text-white rounded-xl font-bold">Lưu Mẫu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplatesTab;
