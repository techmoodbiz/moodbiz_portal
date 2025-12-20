
import React, { useState, useEffect } from 'react';
import { Package, Plus, Trash2, Edit3, CheckCircle2, Star } from 'lucide-react';
import { Brand, Product } from '../../types';
import { SectionHeader, BrandSelector } from '../UIComponents';
import { db } from '../../firebase';

interface ProductsTabProps {
  availableBrands: Brand[];
  selectedBrandId: string;
}

const ProductsTab: React.FC<ProductsTabProps> = ({ availableBrands, selectedBrandId: initialBrandId }) => {
  const [brandId, setBrandId] = useState(initialBrandId);
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState<Partial<Product>>({
    name: '', description: '', features: [], benefits: [], usp: '', pricing: ''
  });

  useEffect(() => {
    if (!brandId) return;
    return db.collection('products').where('brand_id', '==', brandId).onSnapshot(snap => {
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    });
  }, [brandId]);

  const handleSave = async () => {
    const data = { ...formData, brand_id: brandId };
    if (editingProduct) {
      await db.collection('products').doc(editingProduct.id).update(data);
    } else {
      const timestamp = Date.now();
      const productId = `PROD_${brandId}_${timestamp}`;
      await db.collection('products').doc(productId).set({
        ...data,
        id: productId
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="animate-in fade-in">
      <div className="flex justify-between items-center mb-8">
        <SectionHeader title="Products & Services" subtitle="Cung cấp dữ liệu sản phẩm chi tiết để AI không 'chém gió' sai sự thật." />
        <button onClick={() => { setEditingProduct(null); setFormData({name:'', description:'', features:[], benefits:[], usp:'', pricing:''}); setIsModalOpen(true); }} className="px-5 py-2.5 bg-[#102d62] text-white rounded-xl font-bold flex items-center gap-2 shadow-lg">
          <Plus size={18} /> Thêm Sản Phẩm
        </button>
      </div>

      <div className="mb-6 w-72">
        <BrandSelector availableBrands={availableBrands} selectedBrandId={brandId} onChange={setBrandId} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {products.map(p => (
          <div key={p.id} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm group hover:shadow-xl transition-all">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-cyan-50 text-[#01ccff] rounded-2xl group-hover:bg-[#102d62] transition-colors"><Package size={28}/></div>
                <div>
                  <h3 className="text-2xl font-bold text-[#102d62]">{p.name}</h3>
                  <div className="text-sm font-bold text-slate-400">{p.pricing || 'Giá thỏa thuận'}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setEditingProduct(p); setFormData(p); setIsModalOpen(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit3 size={18}/></button>
                <button onClick={() => db.collection('products').doc(p.id).delete()} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={18}/></button>
              </div>
            </div>

            <div className="space-y-6">
              <p className="text-sm text-slate-600 leading-relaxed">{p.description}</p>
              
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-2 mb-2"><Star size={12}/> USP (Lợi thế độc bản)</span>
                <p className="text-sm font-bold text-[#102d62]">{p.usp}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 mb-2 block">Tính năng</span>
                  <div className="space-y-1">
                    {(p.features || []).map((f, i) => <div key={i} className="text-xs text-slate-600 flex items-start gap-2"><CheckCircle2 size={12} className="text-cyan-500 mt-0.5"/> {f}</div>)}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 mb-2 block">Lợi ích</span>
                  <div className="space-y-1">
                    {(p.benefits || []).map((b, i) => <div key={i} className="text-xs text-slate-600 flex items-start gap-2"><CheckCircle2 size={12} className="text-emerald-500 mt-0.5"/> {b}</div>)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-3xl p-8 shadow-2xl my-10">
            <h2 className="text-2xl font-bold text-[#102d62] mb-6">Chi tiết Sản Phẩm/Dịch Vụ</h2>
            <div className="space-y-4">
              <input className="w-full p-3 bg-slate-50 border rounded-xl" placeholder="Tên sản phẩm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <textarea className="w-full p-3 bg-slate-50 border rounded-xl h-24" placeholder="Mô tả sản phẩm" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              <input className="w-full p-3 bg-slate-50 border rounded-xl" placeholder="USP (Unique Selling Proposition)" value={formData.usp} onChange={e => setFormData({...formData, usp: e.target.value})} />
              <input className="w-full p-3 bg-slate-50 border rounded-xl" placeholder="Giá / Khoảng giá" value={formData.pricing} onChange={e => setFormData({...formData, pricing: e.target.value})} />
              <div className="text-xs text-slate-400 italic">* Các tính năng và lợi ích sẽ được tự động phân tách khi lưu.</div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 font-bold text-slate-500">Đóng</button>
              <button onClick={handleSave} className="px-8 py-2.5 bg-[#102d62] text-white rounded-xl font-bold shadow-lg">Lưu Thông Tin</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsTab;
