
import React, { useState, useMemo, useEffect } from 'react';
import { Hash, RefreshCw, Sparkles, Copy, Database, PenTool, Package, ChevronDown, Globe, Layout, Building2, Zap, BookOpen } from 'lucide-react';
import { Brand, SystemPrompts, User, Auditor, Guideline, Product } from '../../types';
import { SectionHeader, BrandSelector } from '../UIComponents';
import { SUPPORTED_LANGUAGES, PLATFORM_CONFIGS } from '../../constants';
import { generateContent } from '../../services/api';
import firebase, { db } from '../../firebase';

interface GeneratorTabProps {
  availableBrands: Brand[];
  selectedBrandId: string;
  setSelectedBrandId: (id: string) => void;
  systemPrompts: SystemPrompts;
  currentUser: User;
  setToast: (toast: any) => void;
  auditors: Auditor[];
  guidelines: Guideline[];
}

const GeneratorTab: React.FC<GeneratorTabProps> = ({ 
  availableBrands, 
  selectedBrandId, 
  setSelectedBrandId, 
  systemPrompts, 
  currentUser,
  setToast,
  auditors,
  guidelines
}) => {
  const [genTopic, setGenTopic] = useState('');
  const [genPlatform, setGenPlatform] = useState('Facebook Post');
  const [genLanguage, setGenLanguage] = useState('Vietnamese');
  const [genResult, setGenResult] = useState('');
  const [citations, setCitations] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');

  useEffect(() => {
    if (!selectedBrandId) return;
    const unsub = db.collection('products')
      .where('brand_id', '==', selectedBrandId)
      .onSnapshot(snap => {
        setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
        setSelectedProductId(''); 
      });
    return unsub;
  }, [selectedBrandId]);

  const approvedGuidelines = useMemo(() => 
    guidelines.filter(g => g.brand_id === selectedBrandId && g.status === 'approved'),
    [guidelines, selectedBrandId]
  );

  const handleGenerate = async () => {
    const brand = availableBrands.find(b => b.id === selectedBrandId);
    if (!brand) { setToast({type: 'error', message: "Chưa chọn thương hiệu."}); return; }
    
    setIsGenerating(true);
    setGenResult('');
    setCitations([]);
    
    const selectedProduct = products.find(p => p.id === selectedProductId);
    let productContext = '';
    if (selectedProduct) {
      productContext = `
[SẢN PHẨM/DỊCH VỤ: ${selectedProduct.name}]
- Category: ${selectedProduct.category}
- Mô tả: ${selectedProduct.marketing.short_desc}
- Đối tượng: ${selectedProduct.target_audience.type} ${selectedProduct.target_audience.industry || ''}
- KPI cam kết: ${JSON.stringify(selectedProduct.service_details?.kpis || {})}
- Phạm vi: ${JSON.stringify(selectedProduct.service_details?.scope || {})}
      `;
    }

    const systemPrompt = systemPrompts.generator
      .replace(/{brand_name}/g, brand.name)
      .replace(/{brand_personality}/g, brand.brand_personality?.join(', ') || brand.personality)
      .replace(/{brand_voice}/g, brand.tone_of_voice || brand.voice)
      .replace(/{language}/g, genLanguage)
      .replace(/{platform}/g, genPlatform)
      .replace(/{product_context}/g, productContext)
      .replace(/{rag_context}/g, `Sử dụng Brand Knowledge Base.`);

    const context = approvedGuidelines.map(g => `[${g.file_name}]: ${g.guideline_text || ''}`).join('\n\n---\n\n');

    try {
      const data = await generateContent({
        brand,
        topic: genTopic,
        platform: genPlatform,
        language: genLanguage,
        context,
        systemPrompt
      });

      setGenResult(data.result);
      setCitations(data.citations || []);
      
      const timestamp = Date.now();
      await db.collection('generations').doc(`GEN_${brand.id}_${timestamp}`).set({
        id: `GEN_${brand.id}_${timestamp}`,
        brand_id: brand.id,
        user_id: currentUser.uid,
        user_name: currentUser.name || currentUser.displayName,
        input_data: { platform: genPlatform, topic: genTopic, product_id: selectedProductId },
        output_data: data.result,
        citations: data.citations || [],
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      });
    } catch (e: any) {
      setGenResult("Lỗi: " + e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedBrand = availableBrands.find(b => b.id === selectedBrandId);

  return (
    <div className="animate-in fade-in h-full flex flex-col">
      <SectionHeader title="CONTENT GENERATOR" subtitle="Soạn thảo nội dung thông minh dựa trên Product Insight và Brand Voice." />
      
      <div className="grid lg:grid-cols-12 gap-10 flex-1">
        <div className="lg:col-span-4 bg-white p-7 rounded-[2rem] shadow-premium border border-slate-100 space-y-7 h-fit">
          <div>
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">THƯƠNG HIỆU</label>
            <BrandSelector availableBrands={availableBrands} selectedBrandId={selectedBrandId} onChange={setSelectedBrandId} />
          </div>

          <div>
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1 flex items-center gap-2">
              <Package size={14} className="text-blue-600"/> SẢN PHẨM / DỊCH VỤ MỤC TIÊU
            </label>
            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-600 pointer-events-none z-10">
                <Package size={20} strokeWidth={2.5} />
              </div>
              <select 
                className="w-full pl-14 pr-12 py-4 bg-white border border-slate-300 rounded-2xl text-[14px] appearance-none font-bold text-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all cursor-pointer hover:border-slate-400 shadow-sm"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
              >
                <option value="">Viết chung về thương hiệu</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none z-10">
                <ChevronDown size={20} strokeWidth={2.5} />
              </div>
            </div>
          </div>

          <div className={`px-5 py-4 rounded-xl border flex items-center gap-4 transition-colors ${approvedGuidelines.length > 0 ? 'bg-emerald-50/30 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
             <div className={`p-2.5 rounded-lg ${approvedGuidelines.length > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
               <Database size={18}/>
             </div>
             <div>
               <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">KNOWLEDGE BASE</div>
               <div className="text-[13px] font-black text-[#102d62]">
                 {approvedGuidelines.length > 0 ? `${approvedGuidelines.length} tài liệu nạp RAG` : 'Mặc định hồ sơ Brand'}
               </div>
             </div>
          </div>

          <div>
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1 flex items-center gap-2">
              <Hash size={14} className="text-blue-600"/> CHỦ ĐỀ & YÊU CẦU BỔ SUNG
            </label>
            <textarea 
              className="w-full p-5 bg-white border border-slate-300 rounded-2xl text-[14px] min-h-[140px] font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 placeholder:text-slate-400 transition-all shadow-sm" 
              placeholder="VD: Nhấn mạnh vào lợi thế cạnh tranh, khai trương chi nhánh mới..." 
              value={genTopic} 
              onChange={e => setGenTopic(e.target.value)} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2.5 block ml-1">NGÔN NGỮ</label>
                <div className="relative group">
                  <select 
                    className="w-full pl-4 pr-10 py-4 bg-white border border-slate-300 rounded-2xl text-[13px] font-bold text-slate-900 outline-none appearance-none cursor-pointer hover:border-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all shadow-sm" 
                    value={genLanguage} 
                    onChange={e => setGenLanguage(e.target.value)}
                  >
                      {SUPPORTED_LANGUAGES.map(l => (
                        <option key={l.code} value={l.code}>{l.label.split(' (')[0]}</option>
                      ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"/>
                </div>
             </div>
             <div>
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2.5 block ml-1">KÊNH ĐĂNG TẢI</label>
                <div className="relative group">
                  <select 
                    className="w-full pl-4 pr-10 py-4 bg-white border border-slate-300 rounded-2xl text-[13px] font-bold text-slate-900 outline-none appearance-none cursor-pointer hover:border-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all shadow-sm" 
                    value={genPlatform} 
                    onChange={e => setGenPlatform(e.target.value)}
                  >
                      {Object.keys(PLATFORM_CONFIGS).map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"/>
                </div>
             </div>
          </div>

          <button 
            onClick={handleGenerate} 
            disabled={isGenerating || (!genTopic && !selectedProductId)} 
            className="w-full py-4.5 bg-[#102d62] text-white rounded-xl font-black text-[15px] flex justify-center items-center gap-3 shadow-xl shadow-blue-900/10 hover:bg-[#1a3e7d] transition-all active:scale-[0.98] disabled:opacity-50 mt-2 uppercase tracking-widest"
          >
            {isGenerating ? <RefreshCw className="animate-spin" size={20} /> : <Zap size={20} className="text-[#01ccff]" />} 
            {isGenerating ? 'ĐANG SOẠN THẢO...' : 'BẮT ĐẦU TẠO NỘI DUNG'}
          </button>
        </div>

        <div className="lg:col-span-8 h-full">
          {genResult ? (
            <div className="bg-white p-10 rounded-[2.5rem] shadow-premium border border-slate-50 h-full flex flex-col animate-in zoom-in-95 overflow-hidden">
              <div className="flex justify-between items-center mb-6 pb-6 border-b border-slate-50 shrink-0">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#01ccff]/10 flex items-center justify-center text-[#01ccff]"><Sparkles size={24}/></div>
                    <div>
                      <h3 className="font-black text-[#102d62] text-lg uppercase tracking-tight">Bản nháp AI đề xuất</h3>
                      <p className="text-xs text-slate-400 font-bold">Chuẩn xác theo Brand Voice & Product Profile</p>
                    </div>
                 </div>
                 <button onClick={() => { navigator.clipboard.writeText(genResult); setToast({type:'success', message:'Đã copy!'}); }} className="px-6 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-[11px] font-black text-[#102d62] flex items-center gap-2 transition-all border border-slate-100 uppercase tracking-widest">
                   <Copy size={16}/> Copy
                 </button>
              </div>

              <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap flex-1 overflow-y-auto font-sans text-[16px] custom-scrollbar pr-4 mb-6">
                {genResult}
              </div>

              {citations.length > 0 && (
                <div className="pt-6 border-t border-slate-50 shrink-0">
                   <div className="flex items-center gap-2 mb-3">
                      <BookOpen size={14} className="text-[#01ccff]" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nguồn dữ liệu AI tham chiếu ({citations.length})</span>
                   </div>
                   <div className="flex flex-wrap gap-2">
                      {citations.map((source, i) => (
                        <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold border border-blue-100 flex items-center gap-1.5 animate-in fade-in fill-mode-backwards" style={{animationDelay: `${i * 100}ms`}}>
                           <div className="w-1.5 h-1.5 rounded-full bg-[#01ccff] shrink-0"></div>
                           {source}
                        </span>
                      ))}
                   </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 p-12 transition-all group hover:bg-white hover:border-[#01ccff]/30">
              <div className="w-24 h-24 bg-white rounded-3xl shadow-premium flex items-center justify-center mb-8 text-slate-200 group-hover:scale-105 transition-transform duration-500">
                <PenTool size={48} strokeWidth={1.5} />
              </div>
              <p className="font-black text-[#102d62] text-2xl mb-3 tracking-tight text-center">Sẵn sàng phục vụ</p>
              <p className="text-sm text-slate-400 text-center max-w-sm font-medium leading-relaxed">
                Chọn Brand, chọn Sản phẩm và nhập chủ đề để AI bắt đầu soạn thảo nội dung theo đúng hồ sơ năng lực.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeneratorTab;
