
import React, { useState, useEffect } from 'react';
import { 
  Package, Plus, Trash2, Edit3, CheckCircle2, Star, Loader2, AlertCircle, 
  Target, Briefcase, Globe, TrendingUp, Search, MousePointer, Layout, 
  Zap, Info, ListChecks, FileText, BarChart3, Layers, Settings2, ShoppingCart,
  ArrowRight, ShieldCheck, HelpCircle, X, ChevronRight, ChevronDown, Users
} from 'lucide-react';
import { Brand, Product } from '../../types';
import { SectionHeader, BrandSelector } from '../UIComponents';
import { db } from '../../firebase';

interface ProductsTabProps {
  availableBrands: Brand[];
  selectedBrandId: string;
}

type ProductTabType = 'core' | 'specialized' | 'marketing' | 'assets';

const ProductsTab: React.FC<ProductsTabProps> = ({ availableBrands, selectedBrandId: initialBrandId }) => {
  const [brandId, setBrandId] = useState(initialBrandId);
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ProductTabType>('core');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const initialFormData: Partial<Product> = {
    name: '', type: 'service', category: '', sub_category: '', status: 'Active',
    target_audience: { type: 'B2B', industry: '', market: 'VN' },
    value_prop: { pain_points: [], benefits: [], usp: [], use_cases: [] },
    marketing: { short_desc: '', key_messages: [], funnel_stage: 'All' },
    assets: { testimonials: [], key_results: [], media_links: [] },
    service_details: { 
      scope: { items: [] }, 
      process: { phases: [] }, 
      kpis: {}, 
      input_reqs: [] 
    },
    physical_details: {
      technical: {},
      usage: {},
      commerce: { channels: [] }
    }
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
    } catch (err) { console.error(err); } finally { setIsSaving(false); }
  };

  const inputClass = "w-full p-4 bg-white border border-slate-300 rounded-2xl text-[14px] font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all shadow-sm placeholder:text-slate-400";
  const labelClass = "block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5 ml-1";
  const sectionTitleClass = "flex items-center gap-2 text-[13px] font-black text-[#102d62] uppercase tracking-wider mb-6 pb-2 border-b-2 border-[#01ccff]/20";

  return (
    <div className="animate-in fade-in max-w-[1600px] mx-auto pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <SectionHeader title="Product & Service Profiles" subtitle="Hệ thống quản lý dữ liệu sản phẩm chuẩn hóa dành riêng cho AI Content Generation." />
        <button 
          onClick={() => { setEditingProduct(null); setFormData(initialFormData); setActiveTab('core'); setIsModalOpen(true); }} 
          className="px-8 py-4 bg-[#102d62] text-white rounded-2xl font-black flex items-center gap-3 shadow-xl hover:bg-[#1a3e7d] transition-all hover:-translate-y-1 active:scale-95"
        >
          <Plus size={24} strokeWidth={3} /> THÊM GIẢI PHÁP MỚI
        </button>
      </div>

      <div className="mb-12 w-full max-w-sm">
        <label className={labelClass}>Chọn Thương Hiệu</label>
        <BrandSelector availableBrands={availableBrands} selectedBrandId={brandId} onChange={setBrandId} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-8">
        {products.length === 0 ? (
          <div className="col-span-full py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
            <Layers size={64} className="mb-6 opacity-20" />
            <p className="font-bold text-lg">Chưa có sản phẩm hoặc dịch vụ nào</p>
            <p className="text-sm">Hãy bắt đầu bằng cách thêm giải pháp đầu tiên cho thương hiệu này.</p>
          </div>
        ) : products.map(p => (
          <div key={p.id} className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-premium group hover:shadow-2xl transition-all duration-500 flex flex-col relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-32 h-32 opacity-5 pointer-events-none transition-transform group-hover:scale-150 duration-700 ${p.type === 'service' ? 'text-blue-600' : 'text-emerald-600'}`}>
               {p.type === 'service' ? <Briefcase size={128}/> : <ShoppingCart size={128}/>}
            </div>

            <div className="flex justify-between items-start mb-8 relative z-10">
              <div className="flex items-center gap-5">
                <div className={`p-4 rounded-2xl transition-all group-hover:rotate-6 ${p.type === 'service' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                  {p.type === 'service' ? <Zap size={32} fill="currentColor"/> : <Package size={32} fill="currentColor"/>}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-[#102d62] leading-tight line-clamp-1">{p.name}</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-wider">{p.category}</span>
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${p.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{p.status}</span>
                    <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-700 text-[9px] font-black uppercase tracking-wider">{p.version || 'Standard'}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={() => { setEditingProduct(p); setFormData(p); setActiveTab('core'); setIsModalOpen(true); }} className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-blue-100"><Edit3 size={18}/></button>
                <button onClick={() => { if(confirm('Xóa?')) db.collection('products').doc(p.id).delete(); }} className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all border border-red-100"><Trash2 size={18}/></button>
              </div>
            </div>

            <div className="mb-8 flex-1 relative z-10">
              <p className="text-[15px] text-slate-600 font-medium leading-relaxed line-clamp-3 mb-6">{p.marketing.short_desc}</p>
              
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Target size={12}/> Đối tượng</span>
                    <span className="text-[13px] font-bold text-[#102d62]">{p.target_audience.type} • {p.target_audience.market}</span>
                 </div>
                 <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Zap size={12}/> USP cốt lõi</span>
                    <span className="text-[13px] font-bold text-[#102d62] line-clamp-1">{p.value_prop.usp[0] || 'N/A'}</span>
                 </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-between items-center relative z-10">
               <div className="flex items-center gap-2">
                 <div className={`w-2 h-2 rounded-full ${p.type === 'service' ? 'bg-blue-500' : 'bg-emerald-500'} animate-pulse`}></div>
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.type === 'service' ? 'Service Model' : 'Physical Product'}</span>
               </div>
               <button onClick={() => { setEditingProduct(p); setFormData(p); setIsModalOpen(true); }} className="text-[11px] font-black text-[#102d62] uppercase tracking-wider flex items-center gap-1 hover:text-[#01ccff] transition-colors">
                  Xem chi tiết <ChevronRight size={14} />
               </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL CẤU TRÚC 3 TẦNG */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md overflow-hidden">
          <div className="bg-white w-full max-w-6xl rounded-[3rem] shadow-2xl flex flex-col h-[90vh] animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
               <div>
                 <div className="flex items-center gap-3 mb-1">
                   <div className="w-10 h-10 rounded-xl bg-[#102d62] text-white flex items-center justify-center">
                     {formData.type === 'service' ? <Briefcase size={20}/> : <ShoppingCart size={20}/>}
                   </div>
                   <h2 className="text-2xl font-black text-[#102d62] uppercase tracking-tight">
                     {editingProduct ? 'Cập nhật giải pháp' : 'Thêm giải pháp mới'}
                   </h2>
                 </div>
                 <p className="text-sm font-bold text-slate-400 ml-13">Chuẩn hóa dữ liệu "Xương sống" cho AI Agent</p>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-slate-50 rounded-2xl text-slate-300 hover:text-red-500 transition-all">
                 <X size={32} />
               </button>
            </div>

            {/* Modal Sub-Tabs Navigation */}
            <div className="px-10 py-3 bg-slate-50/50 border-b border-slate-100 flex gap-4 overflow-x-auto custom-scrollbar shrink-0">
               {[
                 { id: 'core', label: 'Thông tin cốt lõi', icon: ListChecks },
                 { id: 'specialized', label: 'Đặc thù loại hình', icon: Layers },
                 { id: 'marketing', label: 'Marketing & Funnel', icon: FileText },
                 { id: 'assets', label: 'Tài nguyên & Asset', icon: BarChart3 },
               ].map(tab => (
                 <button 
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id as any)}
                   className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl font-black text-[12px] uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-[#102d62] text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                 >
                   <tab.icon size={18} /> {tab.label}
                 </button>
               ))}
            </div>

            {/* Modal Body Content */}
            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-white">
               {activeTab === 'core' && (
                 <div className="space-y-10 animate-in fade-in">
                    {/* Identification */}
                    <section>
                      <h4 className={sectionTitleClass}><Info size={16}/> 1. Thông tin nhận diện</h4>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                          <label className={labelClass}>Tên Sản phẩm / Dịch vụ *</label>
                          <input className={inputClass} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="VD: SEO Growth Impact 2024" />
                        </div>
                        <div>
                          <label className={labelClass}>Loại hình</label>
                          <div className="relative group">
                            <select className={inputClass + " appearance-none"} value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}>
                              <option value="service">Dịch vụ (Service)</option>
                              <option value="good">Hàng hóa (Physical Product)</option>
                            </select>
                            <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                          </div>
                        </div>
                        <div>
                          <label className={labelClass}>Category</label>
                          <input className={inputClass} value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} placeholder="VD: Digital Marketing" />
                        </div>
                        <div>
                          <label className={labelClass}>Phiên bản / Gói</label>
                          <input className={inputClass} value={formData.version} onChange={e => setFormData({...formData, version: e.target.value})} placeholder="VD: Premium / Enterprise" />
                        </div>
                        <div>
                          <label className={labelClass}>Trạng thái</label>
                          <div className="relative group">
                             <select className={inputClass + " appearance-none"} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                               <option value="Active">Đang triển khai (Active)</option>
                               <option value="Paused">Tạm dừng (Paused)</option>
                             </select>
                             <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* Customers & Values */}
                    <section>
                      {/* Fixed missing import for 'Users' icon from lucide-react */}
                      <h4 className={sectionTitleClass}><Users size={16}/> 2. Giá trị & Khách hàng</h4>
                      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div>
                          <label className={labelClass}>Loại khách hàng</label>
                          <select className={inputClass} value={formData.target_audience?.type} onChange={e => setFormData({...formData, target_audience: {...formData.target_audience!, type: e.target.value as any}})}>
                            <option value="B2B">Doanh nghiệp (B2B)</option>
                            <option value="B2C">Cá nhân (B2C)</option>
                            <option value="Both">Cả hai</option>
                          </select>
                        </div>
                        <div className="lg:col-span-2">
                          <label className={labelClass}>Ngành nghề / Quy mô ưu tiên</label>
                          <input className={inputClass} value={formData.target_audience?.industry} onChange={e => setFormData({...formData, target_audience: {...formData.target_audience!, industry: e.target.value}})} placeholder="VD: F&B, Logistics, SME..." />
                        </div>
                        <div>
                          <label className={labelClass}>Thị trường</label>
                          <input className={inputClass} value={formData.target_audience?.market} onChange={e => setFormData({...formData, target_audience: {...formData.target_audience!, market: e.target.value}})} placeholder="VN / Global..." />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-8">
                         <div className="p-6 bg-red-50/50 rounded-3xl border border-red-100">
                            <label className="text-[11px] font-black text-red-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                              <span className="w-2 h-4 bg-red-500 rounded-full"></span> Pain Points (Nỗi đau khách hàng)
                            </label>
                            <textarea 
                              className="w-full p-4 bg-white border border-red-100 rounded-2xl h-32 text-sm font-bold text-red-900 outline-none focus:ring-4 focus:ring-red-500/5 transition-all" 
                              placeholder="Nhập mỗi nỗi đau 1 dòng..." 
                              value={formData.value_prop?.pain_points.join('\n')}
                              onChange={e => setFormData({...formData, value_prop: {...formData.value_prop!, pain_points: e.target.value.split('\n')}})}
                            />
                         </div>
                         <div className="p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100">
                            <label className="text-[11px] font-black text-emerald-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                              <span className="w-2 h-4 bg-emerald-500 rounded-full"></span> Lợi ích & USP (Lợi thế độc bản)
                            </label>
                            <textarea 
                              className="w-full p-4 bg-white border border-emerald-100 rounded-2xl h-32 text-sm font-bold text-emerald-900 outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all" 
                              placeholder="Nhập mỗi lợi ích/USP 1 dòng..." 
                              value={formData.value_prop?.usp.join('\n')}
                              onChange={e => setFormData({...formData, value_prop: {...formData.value_prop!, usp: e.target.value.split('\n')}})}
                            />
                         </div>
                      </div>
                    </section>
                 </div>
               )}

               {activeTab === 'specialized' && (
                 <div className="space-y-10 animate-in fade-in">
                    {formData.type === 'service' ? (
                      <>
                        <section>
                          <h4 className={sectionTitleClass}><ListChecks size={16}/> Cấu hình Dịch Vụ (Services Layer)</h4>
                          <div className="grid lg:grid-cols-2 gap-8">
                             <div>
                                <label className={labelClass}>KPI cam kết & Tiêu chuẩn</label>
                                <div className="grid grid-cols-2 gap-4">
                                  <input className={inputClass} placeholder="Traffic Growth (%)" value={formData.service_details?.kpis.traffic} onChange={e => setFormData({...formData, service_details: {...formData.service_details!, kpis: {...formData.service_details!.kpis, traffic: e.target.value}}})} />
                                  <input className={inputClass} placeholder="Leads Growth" value={formData.service_details?.kpis.leads} onChange={e => setFormData({...formData, service_details: {...formData.service_details!, kpis: {...formData.service_details!.kpis, leads: e.target.value}}})} />
                                  <input className={inputClass} placeholder="CPL / CPA" value={formData.service_details?.kpis.cpl_cpa} onChange={e => setFormData({...formData, service_details: {...formData.service_details!, kpis: {...formData.service_details!.kpis, cpl_cpa: e.target.value}}})} />
                                  <input className={inputClass} placeholder="Thời gian tối thiểu" value={formData.service_details?.kpis.commitment_min} onChange={e => setFormData({...formData, service_details: {...formData.service_details!, kpis: {...formData.service_details!.kpis, commitment_min: e.target.value}}})} />
                                </div>
                             </div>
                             <div>
                                <label className={labelClass}>Điều kiện triển khai (Input Required)</label>
                                <textarea className={inputClass + " h-[120px]"} placeholder="VD: Tài khoản GA4, Ngân sách Ads tối thiểu 20tr/tháng..." value={formData.service_details?.input_reqs.join(', ')} onChange={e => setFormData({...formData, service_details: {...formData.service_details!, input_reqs: e.target.value.split(', ')}})} />
                             </div>
                          </div>
                        </section>
                        <section>
                           <label className={labelClass}>Quy trình triển khai (Phases)</label>
                           <textarea className={inputClass + " h-[150px]"} placeholder="Phase 1: Audit & Research (1 tuần)&#10;Phase 2: On-site Optimization (2 tuần)..." />
                        </section>
                      </>
                    ) : (
                      <>
                        <section>
                          <h4 className={sectionTitleClass}><ShoppingCart size={16}/> Cấu hình Hàng Hóa (Goods Layer)</h4>
                          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                             <div>
                               <label className={labelClass}>Giá niêm yết</label>
                               <input type="number" className={inputClass} value={formData.physical_details?.commerce.price_list} onChange={e => setFormData({...formData, physical_details: {...formData.physical_details!, commerce: {...formData.physical_details!.commerce, price_list: Number(e.target.value)}}})} />
                             </div>
                             <div>
                               <label className={labelClass}>Đơn vị tính / MOQ</label>
                               <input className={inputClass} value={formData.physical_details?.commerce.unit} placeholder="Hộp / Thùng / Cái..." />
                             </div>
                             <div>
                               <label className={labelClass}>Tiêu chuẩn / Giấy phép</label>
                               <input className={inputClass} placeholder="ISO 9001, FDA, OCOP..." />
                             </div>
                             <div className="md:col-span-2">
                               <label className={labelClass}>Thành phần / Thông số kỹ thuật</label>
                               <textarea className={inputClass + " h-24"} placeholder="Thông số chi tiết cho AI tham chiếu..." />
                             </div>
                             <div>
                               <label className={labelClass}>Kênh phân phối</label>
                               <div className="space-y-2 pt-2">
                                  {['Online Store', 'Offline / Agent', 'Shopee / Lazada'].map(ch => (
                                    <label key={ch} className="flex items-center gap-2 cursor-pointer group">
                                      <div className="w-4 h-4 rounded border-2 border-slate-300 group-hover:border-blue-500 transition-colors"></div>
                                      <span className="text-xs font-bold text-slate-600">{ch}</span>
                                    </label>
                                  ))}
                               </div>
                             </div>
                          </div>
                        </section>
                      </>
                    )}
                 </div>
               )}

               {activeTab === 'marketing' && (
                 <div className="space-y-8 animate-in fade-in">
                    <section>
                      <h4 className={sectionTitleClass}><FileText size={16}/> Marketing Content Chuẩn Hóa</h4>
                      <div className="space-y-6">
                        <div>
                           <label className={labelClass}>Short Description (1-2 câu quan trọng nhất)</label>
                           <textarea className={inputClass + " h-20"} value={formData.marketing?.short_desc} onChange={e => setFormData({...formData, marketing: {...formData.marketing!, short_desc: e.target.value}})} />
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                           <div>
                              <label className={labelClass}>Giai đoạn phễu (Funnel Stage)</label>
                              <select className={inputClass} value={formData.marketing?.funnel_stage} onChange={e => setFormData({...formData, marketing: {...formData.marketing!, funnel_stage: e.target.value as any}})}>
                                <option value="TOFU">Nhận diện (TOFU)</option>
                                <option value="MOFU">Cân nhắc (MOFU)</option>
                                <option value="BOFU">Chuyển đổi (BOFU)</option>
                                <option value="All">Xuyên suốt (All)</option>
                              </select>
                           </div>
                           <div>
                              <label className={labelClass}>CTA mặc định</label>
                              <input className={inputClass} value={formData.marketing?.default_cta} placeholder="VD: Nhận tư vấn 1-1 miễn phí" />
                           </div>
                        </div>
                        <div>
                           <label className={labelClass}>Key Messages / Bullet Benefits (Thông điệp lõi)</label>
                           <textarea className={inputClass + " h-32"} placeholder="Nhập mỗi thông điệp 1 dòng..." />
                        </div>
                      </div>
                    </section>
                 </div>
               )}

               {activeTab === 'assets' && (
                 <div className="space-y-8 animate-in fade-in">
                    <section>
                       <h4 className={sectionTitleClass}><BarChart3 size={16}/> Bằng chứng & Assets</h4>
                       <div className="grid md:grid-cols-2 gap-8">
                          <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                             <label className={labelClass}>Kết quả thực tế (Key Results)</label>
                             <textarea className="w-full p-4 bg-white border border-slate-200 rounded-2xl h-40 text-sm font-bold text-slate-700 outline-none" placeholder="VD: Tăng 200% traffic sau 3 tháng, Giảm 40% CPL..." />
                          </div>
                          <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                             <label className={labelClass}>Link Media / Brochure / Landing mẫu</label>
                             <textarea className="w-full p-4 bg-white border border-slate-200 rounded-2xl h-40 text-sm font-bold text-slate-700 outline-none" placeholder="Dán các link tài liệu tham khảo cho AI..." />
                          </div>
                       </div>
                    </section>
                 </div>
               )}
            </div>

            {/* Modal Footer */}
            <div className="px-10 py-6 border-t border-slate-100 bg-slate-50/50 flex justify-end items-center gap-4 shrink-0">
               <div className="mr-auto flex items-center gap-2 text-slate-400">
                  <HelpCircle size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Tất cả dữ liệu sẽ được mã hóa và nạp vào Vector Database</span>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="px-8 py-4 font-black text-slate-500 uppercase text-[12px] tracking-widest hover:text-slate-700 transition-colors">Hủy bỏ</button>
               <button 
                 onClick={handleSave} 
                 disabled={isSaving || !formData.name} 
                 className="px-12 py-4 bg-[#102d62] text-white rounded-2xl font-black shadow-xl shadow-blue-900/20 flex items-center gap-3 uppercase text-[12px] tracking-widest hover:bg-[#0a1d40] transition-all disabled:opacity-50"
               >
                 {isSaving ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={20} className="text-[#01ccff]" />} 
                 {editingProduct ? 'Cập Nhật Giải Pháp' : 'Lưu Vào Hệ Thống'}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsTab;
