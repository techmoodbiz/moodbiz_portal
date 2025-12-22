
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Hash, RefreshCw, Sparkles, Copy, Database, PenTool, Package, 
  ChevronDown, Globe, Layout, Building2, Zap, BookOpen, 
  AlertTriangle, Lightbulb, ShieldCheck, CheckCircle2, Languages
} from 'lucide-react';
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
  const [selectedProductId, setSelectedProductId] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  // Aggregate mistakes from history based on the 4 mandatory blocks
  const learningInsights = useMemo(() => {
    if (!auditors || !selectedBrandId) return { language: [], ai_logic: [], brand: [], product: [] };
    const brandAudits = auditors.filter(a => a.brand_id === selectedBrandId).slice(0, 30);
    
    const aggregated: any = { language: [], ai_logic: [], brand: [], product: [] };
    brandAudits.forEach(audit => {
      const issues = audit.output_data?.identified_issues || [];
      issues.forEach((issue: any) => {
        const cat = (issue.category || 'language').toLowerCase();
        if (cat.includes('language') && aggregated.language.length < 3) aggregated.language.push(issue.reason);
        else if (cat.includes('logic') && aggregated.ai_logic.length < 3) aggregated.ai_logic.push(issue.reason);
        else if (cat.includes('brand') && aggregated.brand.length < 3) aggregated.brand.push(issue.reason);
        else if (cat.includes('product') && aggregated.product.length < 3) aggregated.product.push(issue.reason);
      });
    });
    return aggregated;
  }, [auditors, selectedBrandId]);

  useEffect(() => {
    if (!selectedBrandId) return;
    const unsub = db.collection('products').where('brand_id', '==', selectedBrandId).onSnapshot(snap => {
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    });
    return unsub;
  }, [selectedBrandId]);

  const handleGenerate = async () => {
    const brand = availableBrands.find(b => b.id === selectedBrandId);
    if (!brand) { setToast({type: 'error', message: "Chưa chọn thương hiệu."}); return; }
    setIsGenerating(true);
    setGenResult('');
    
    const selectedProduct = products.find(p => p.id === selectedProductId);
    let productContext = '[DỮ LIỆU SẢN PHẨM] Không có.';
    if (selectedProduct) {
      productContext = `[SẢN PHẨM: ${selectedProduct.name}]\n- USP: ${selectedProduct.value_prop.usp.join(', ')}\n- Benefits: ${selectedProduct.value_prop.benefits.join(', ')}`;
    }

    // Dynamic Learning Context from the 4 blocks
    const pastMistakes = `
[LỊCH SỬ LỖI CẦN TRÁNH]
- Language: ${learningInsights.language.join('; ') || 'Không có'}
- AI Logic: ${learningInsights.ai_logic.join('; ') || 'Không có'}
- Brand: ${learningInsights.brand.join('; ') || 'Không có'}
- Product: ${learningInsights.product.join('; ') || 'Không có'}
    `;

    const systemPrompt = systemPrompts.generator
      .replace(/{brand_name}/g, brand.name)
      .replace(/{brand_personality}/g, brand.brand_personality?.join(', ') || brand.personality)
      .replace(/{brand_voice}/g, brand.tone_of_voice || brand.voice)
      .replace(/{core_values}/g, brand.core_values?.join(', ') || 'N/A')
      .replace(/{do_words}/g, brand.do_words?.join(', ') || 'N/A')
      .replace(/{dont_words}/g, brand.dont_words?.join(', ') || 'N/A')
      .replace(/{common_mistakes}/g, pastMistakes) // Injecting the 4-block mistakes
      .replace(/{language}/g, genLanguage)
      .replace(/{platform}/g, genPlatform)
      .replace(/{product_context}/g, productContext);

    const approvedGuidelines = guidelines.filter(g => g.brand_id === selectedBrandId && g.status === 'approved');
    const context = approvedGuidelines.map(g => `[Guide: ${g.file_name}]: ${g.guideline_text || ''}`).join('\n\n');

    try {
      const data = await generateContent({ brand, topic: genTopic, platform: genPlatform, language: genLanguage, context, systemPrompt });
      setGenResult(data.result);
      setCitations(data.citations || []);
      
      const timestamp = Date.now();
      await db.collection('generations').doc(`GEN_${brand.id}_${timestamp}`).set({
        id: `GEN_${brand.id}_${timestamp}`,
        brand_id: brand.id,
        user_id: currentUser.uid,
        user_name: currentUser.name || currentUser.displayName,
        input_data: { platform: genPlatform, topic: genTopic, language: genLanguage, product_id: selectedProductId },
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

  return (
    <div className="animate-in fade-in h-full flex flex-col">
      <SectionHeader title="Content Generator" subtitle="Soạn thảo thông minh chuẩn Brand Persona & Insight khách hàng.">
        <div className="flex items-center gap-3">
           <div className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-100 flex items-center gap-2">
              <Layout size={14}/> {genPlatform}
           </div>
           <div className="px-4 py-2 bg-cyan-50 text-cyan-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-cyan-100 flex items-center gap-2">
              <Languages size={14}/> {genLanguage}
           </div>
        </div>
      </SectionHeader>
      
      <div className="grid lg:grid-cols-12 gap-8 flex-1">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-7 rounded-[2.5rem] shadow-premium border border-slate-100 flex flex-col gap-6">
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2.5 block ml-1">THƯƠNG HIỆU ĐANG CHỌN</label>
              <BrandSelector availableBrands={availableBrands} selectedBrandId={selectedBrandId} onChange={setSelectedBrandId} />
            </div>

            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2.5 block ml-1">SẢN PHẨM / DỊCH VỤ</label>
              <div className="relative group">
                <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold text-[#102d62] outline-none appearance-none" value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)}>
                  <option value="">Nội dung chung về Brand</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Learning Insight Block - 4 Grid */}
            <div className="bg-[#102d62] p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
               <div className="flex items-center gap-2 mb-5">
                  <Sparkles size={18} className="text-[#01ccff]" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#01ccff]">Learning Insight Hub</span>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Language', count: learningInsights.language.length, color: 'text-blue-400' },
                    { label: 'AI Logic', count: learningInsights.ai_logic.length, color: 'text-purple-400' },
                    { label: 'Brand', count: learningInsights.brand.length, color: 'text-[#01ccff]' },
                    { label: 'Product', count: learningInsights.product.length, color: 'text-emerald-400' }
                  ].map((block, i) => (
                    <div key={i} className="bg-white/5 p-3 rounded-2xl border border-white/5">
                       <div className={`text-[9px] font-black uppercase mb-1 ${block.color}`}>{block.label}</div>
                       <div className="text-lg font-black">{block.count === 0 ? '✓ Clean' : `${block.count} Risks`}</div>
                    </div>
                  ))}
               </div>
            </div>

            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2.5 block ml-1">YÊU CẦU NỘI DUNG (BRIEF)</label>
              <textarea className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-[13px] min-h-[160px] font-medium text-[#102d62] outline-none focus:bg-white focus:ring-4 focus:ring-[#01ccff]/5 transition-all shadow-inner-soft custom-scrollbar" placeholder="Nhập chủ đề hoặc yêu cầu chi tiết..." value={genTopic} onChange={e => setGenTopic(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
               <div className="relative group">
                  <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold text-[#102d62] outline-none appearance-none" value={genLanguage} onChange={e => setGenLanguage(e.target.value)}>
                      {SUPPORTED_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
               </div>
               <div className="relative group">
                  <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold text-[#102d62] outline-none appearance-none" value={genPlatform} onChange={e => setGenPlatform(e.target.value)}>
                      {Object.keys(PLATFORM_CONFIGS).map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
               </div>
            </div>

            <button onClick={handleGenerate} disabled={isGenerating || !genTopic} className="w-full py-5 bg-[#102d62] text-white rounded-2xl font-black text-sm flex justify-center items-center gap-3 shadow-xl hover:bg-[#0a1d40] transition-all active:scale-95 disabled:opacity-50 uppercase tracking-widest">
              {isGenerating ? <RefreshCw className="animate-spin" size={22} /> : <Zap size={22} className="text-[#01ccff]" />} 
              {isGenerating ? 'ĐANG TỔNG HỢP...' : 'KHỞI TẠO BẢN THẢO'}
            </button>
          </div>
        </div>

        <div className="lg:col-span-8 h-full">
          {genResult ? (
            <div className="bg-white p-10 rounded-[3rem] shadow-premium border border-slate-50 h-full flex flex-col animate-in zoom-in-95 overflow-hidden">
              <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-50 shrink-0">
                 <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#01ccff]/10 flex items-center justify-center text-[#01ccff] shadow-inner"><Sparkles size={28}/></div>
                    <div>
                      <h3 className="font-black text-[#102d62] text-2xl uppercase tracking-tight leading-none mb-2">Refined Content</h3>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-black uppercase">{genPlatform}</span>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-black uppercase">{genLanguage}</span>
                      </div>
                    </div>
                 </div>
                 <button onClick={() => { navigator.clipboard.writeText(genResult); setToast({type:'success', message:'Đã copy!'}); }} className="px-6 py-3 bg-slate-50 border border-slate-100 hover:bg-white hover:border-[#01ccff] rounded-2xl text-[11px] font-black text-[#102d62] flex items-center gap-2 transition-all shadow-sm uppercase tracking-widest">
                   <Copy size={18}/> Copy Result
                 </button>
              </div>
              <div className="prose prose-sm max-w-none text-slate-700 leading-[1.9] whitespace-pre-wrap flex-1 overflow-y-auto font-sans text-[17px] custom-scrollbar pr-6 mb-6 selection:bg-[#01ccff]/20">
                {genResult}
              </div>
              {citations.length > 0 && (
                <div className="pt-6 border-t border-slate-50 shrink-0">
                   <div className="flex items-center gap-2 mb-4">
                      <BookOpen size={16} className="text-[#01ccff]" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Contextual Sources ({citations.length})</span>
                   </div>
                   <div className="flex flex-wrap gap-2">
                      {citations.map((source, i) => (
                        <span key={i} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-bold border border-blue-100 flex items-center gap-2 shadow-sm">
                           <div className="w-1.5 h-1.5 rounded-full bg-[#01ccff] shrink-0"></div>
                           {source}
                        </span>
                      ))}
                   </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full bg-slate-50/50 rounded-[4rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 p-12 group transition-all hover:bg-white">
              <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-premium flex items-center justify-center mb-8 text-slate-200 group-hover:scale-110 transition-all duration-500 group-hover:text-[#01ccff]">
                <PenTool size={48} strokeWidth={1} />
              </div>
              <h3 className="font-black text-[#102d62] text-2xl mb-4 tracking-tight uppercase">AI Content Studio</h3>
              <p className="text-[14px] text-slate-400 text-center max-w-sm font-medium leading-relaxed">
                Vui lòng cấu hình Thương hiệu và Sản phẩm bên trái để AI bắt đầu quá trình soạn thảo tối ưu.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeneratorTab;
