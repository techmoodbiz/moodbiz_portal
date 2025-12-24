
import React, { useState, useEffect } from 'react';
import {
  Package, Plus, Trash2, Edit3, CheckCircle2, Loader2,
  Target, Briefcase, Zap, Info, X, ChevronRight, ChevronDown, Users,
  ShoppingCart, ShieldCheck, MessageSquare, Tag
} from 'lucide-react';
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
  const [isSaving, setIsSaving] = useState(false);

  const initialFormData: Partial<Product> = {
    name: '',
    type: 'service',
    category: '',
    status: 'Active',
    target_audience: '',
    benefits: '',
    usp: '',
    description: ''
  };

  const [formData, setFormData] = useState<Partial<Product>>(initialFormData);

  useEffect(() => {
    if (!brandId) return;
    return db.collection('products').where('brand_id', '==', brandId).onSnapshot(snap => {
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    });
  }, [brandId]);

  const handleSave = async () => {
    if (!formData.name?.trim()) return;
    setIsSaving(true);
    try {
      const data = { ...formData, brand_id: brandId };
      if (editingProduct) {
        await db.collection('products').doc(editingProduct.id).update(data);
      } else {
        const id = `PROD_${brandId}_${Date.now()}`;
        await db.collection('products').doc(id).set({ ...data, id });
      }
      setIsModalOpen(false);
      setFormData(initialFormData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass = "w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-[14px] font-bold text-[#102d62] outline-none focus:bg-white focus:border-[#102d62]/20 focus:ring-4 focus:ring-blue-500/5 transition-all shadow-inner-soft placeholder:text-slate-400";
  const labelClass = "block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1";

  return (
    <div className="animate-in fade-in max-w-[1400px] mx-auto pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <SectionHeader title="Products & Services" subtitle="Quản lý thông tin cốt lõi của giải pháp để AI tối ưu nội dung bán hàng." />
        <button
          onClick={() => { setEditingProduct(null); setFormData(initialFormData); setIsModalOpen(true); }}
          className="px-8 py-4 bg-[#102d62] text-white rounded-2xl font-black flex items-center gap-3 shadow-xl hover:bg-[#1a3e7d] transition-all active:scale-95"
        >
          <Plus size={20} strokeWidth={3} /> THÊM SẢN PHẨM
        </button>
      </div>

      <div className="mb-10 w-full max-w-sm">
        <label className={labelClass}>Chọn Thương Hiệu</label>
        <BrandSelector availableBrands={availableBrands} selectedBrandId={brandId} onChange={setBrandId} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.length === 0 ? (
          <div className="col-span-full py-24 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-400">
            <Package size={48} className="mb-4 opacity-20" />
            <p className="font-bold text-slate-400">Chưa có sản phẩm nào cho thương hiệu này</p>
          </div>
        ) : products.map(p => (
          <div key={p.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium hover:shadow-2xl transition-all duration-300 flex flex-col group relative">
            <div className="flex justify-between items-start mb-6">
              <div className={`p-3.5 rounded-2xl ${p.type === 'service' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                {p.type === 'service' ? <Briefcase size={24} /> : <ShoppingCart size={24} />}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={() => { setEditingProduct(p); setFormData(p); setIsModalOpen(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Edit3 size={16} /></button>
                <button onClick={() => { if (confirm('Xóa giải pháp này?')) db.collection('products').doc(p.id).delete(); }} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16} /></button>
              </div>
            </div>

            <div className="flex-1">
              <h3 className="text-xl font-black text-[#102d62] mb-2 group-hover:text-[#01ccff] transition-colors">{p.name}</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Tag size={12} className="text-[#01ccff]" /> {p.category || 'Chưa phân loại'}
              </p>

              <div className="space-y-4 mb-6">
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Tệp khách hàng</span>
                  <p className="text-[12px] text-slate-600 font-bold line-clamp-1">{p.target_audience || 'Chưa xác định'}</p>
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Công dụng chính</span>
                  <p className="text-[12px] text-slate-600 font-medium line-clamp-2 leading-relaxed">{p.benefits || 'Chưa cập nhật'}</p>
                </div>
              </div>
            </div>

            <div className="pt-5 border-t border-slate-50 flex justify-between items-center">
              <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${p.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                {p.status}
              </span>
              <button onClick={() => { setEditingProduct(p); setFormData(p); setIsModalOpen(true); }} className="text-[10px] font-black text-[#102d62] uppercase tracking-widest flex items-center gap-1 hover:text-[#01ccff] transition-colors">
                Chi tiết <ChevronRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL ĐƠN GIẢN HÓA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#102d62] text-white flex items-center justify-center shadow-lg">
                  {formData.type === 'service' ? <Zap size={20} fill="currentColor" /> : <Package size={20} fill="currentColor" />}
                </div>
                <h2 className="text-xl font-black text-[#102d62] uppercase tracking-tight">
                  {editingProduct ? 'Cập nhật thông tin' : 'Thêm giải pháp mới'}
                </h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-300 hover:text-red-500 transition-all">
                <X size={28} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className={labelClass}>Tên Sản phẩm / Dịch vụ *</label>
                  <input className={inputClass} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="VD: Gói Marketing Tổng Thể" />
                </div>
                <div>
                  <label className={labelClass}>Loại hình</label>
                  <div className="relative">
                    <select className={inputClass + " appearance-none cursor-pointer"} value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as any })}>
                      <option value="service">Dịch vụ (Service)</option>
                      <option value="good">Sản phẩm (Good)</option>
                    </select>
                    <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Category / Nhóm ngành</label>
                  <input className={inputClass} value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} placeholder="VD: Digital Marketing" />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Tệp khách hàng mục tiêu</label>
                  <input className={inputClass} value={formData.target_audience} onChange={e => setFormData({ ...formData, target_audience: e.target.value })} placeholder="VD: Doanh nghiệp SME ngành F&B tại Việt Nam" />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Công dụng & Lợi ích chính (Benefits)</label>
                  <textarea className={inputClass + " h-24"} value={formData.benefits} onChange={e => setFormData({ ...formData, benefits: e.target.value })} placeholder="Sản phẩm giúp khách hàng giải quyết vấn đề gì?"></textarea>
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Lợi thế độc bản (USP)</label>
                  <textarea className={inputClass + " h-24"} value={formData.usp} onChange={e => setFormData({ ...formData, usp: e.target.value })} placeholder="Tại sao khách hàng nên chọn bạn thay vì đối thủ?"></textarea>
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Mô tả ngắn gọn (Option)</label>
                  <textarea className={inputClass + " h-20"} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Thông tin bổ sung khác..."></textarea>
                </div>
              </div>
            </div>

            <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/50 flex justify-end items-center gap-4 shrink-0">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 font-black text-slate-500 uppercase text-[11px] tracking-widest hover:text-slate-700 transition-colors">Hủy</button>
              <button
                onClick={handleSave}
                disabled={isSaving || !formData.name}
                className="px-10 py-3.5 bg-[#102d62] text-white rounded-2xl font-black shadow-xl flex items-center gap-2 uppercase text-[11px] tracking-widest hover:bg-[#0a1d40] transition-all disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} className="text-[#01ccff]" />}
                {editingProduct ? 'Cập Nhật' : 'Lưu Giải Pháp'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsTab;
