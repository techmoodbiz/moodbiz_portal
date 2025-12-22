
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Hash, RefreshCw, Sparkles, Copy, Database, PenTool, Package, 
  ChevronDown, Globe, Layout, Building2, Zap, BookOpen, 
  AlertTriangle, Lightbulb, ShieldCheck, CheckCircle2 
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
  const getSavedState = () => {
    try {
      const saved = localStorage.getItem('moodbiz_gen_state');
      return saved ? JSON.parse(saved) : {};
    } catch (e) { return {}; }
  };

  const savedState = getSavedState();
  const [genTopic, setGenTopic] = useState(savedState.topic || '');
  const [genPlatform, setGenPlatform] = useState(savedState.platform || 'Facebook Post');
  const [genLanguage, setGenLanguage] = useState(savedState.language || 'Vietnamese');
  const [genResult, setGenResult] = useState(savedState.result || '');
  const [citations, setCitations] = useState<string[]>(savedState.citations || []);
  const [selectedProductId, setSelectedProductId] = useState(savedState.productId || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  const categorizedMistakes = useMemo(() => {
    if (!auditors || !auditors.length || !selectedBrandId) return { accuracy: 0, relevance: 0, compliance: 0, details: [] };
    const brandAudits = auditors.filter(a => a.brand_id === selectedBrandId).slice(0, 50);
    const stats = { accuracy: 0, relevance: 0, compliance: 0 };
    const details: string[] = [];
    brandAudits.forEach(audit => {
      const issues = audit.output_data?.identified_issues;
      if (Array.isArray(issues)) {
        issues.forEach((issue: any) => {
          const type = (issue.issue_type || '').toLowerCase();
          if (type.includes('accuracy') || type.includes('đúng')) stats.accuracy++;
          else if (type.includes('relevance') || type.includes('chuẩn') || type.includes('voice')) stats.relevance++;
          else if (type.includes('compliance') || type.includes('an toàn') || type.includes('safety')) stats.compliance++;
          if (issue.reason && details.length < 10) details.push(issue.reason);
        });
      }
    });
    return { ...stats, details };
  }, [auditors, selectedBrandId]);

  const mistakesPromptString = useMemo(() => {
    if (categorizedMistakes.details.length === 0) return "Chưa có dữ liệu kiểm duyệt trước đó.";
    return categorizedMistakes.details.map((d, i) => `${i+1}. ${d}`).join('\n');
  }, [categorizedMistakes]);

  useEffect(() => {
    const state = { topic: genTopic, platform: genPlatform, language: genLanguage, result: genResult, citations: citations, productId: selectedProductId };
    localStorage.setItem('moodbiz_gen_state', JSON.stringify(state));
  }, [genTopic, genPlatform, genLanguage, genResult, citations, selectedProductId]);

  useEffect(() => {
    if (!selectedBrandId) return;
    const unsub = db.collection('products').where('brand_id', '==', selectedBrandId).onSnapshot(snap => {
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    });
    return unsub;
  }, [selectedBrandId]);

  const approvedGuidelines = useMemo(() => guidelines.filter(g => g.brand_id === selectedBrandId && g.status === 'approved'), [guidelines, selectedBrandId]);

  const handleGenerate = async () => {
    const brand = availableBrands.find(b => b.id === selectedBrandId);
    if (!brand) { setToast({type: 'error', message: "Chưa chọn thương hiệu."}); return; }
    setIsGenerating(true);
    setGenResult('');
    setCitations([]);
    const selectedProduct = products.find(p => p.id === selectedProductId);
    let productContext = 'Không xác định';
    if (selectedProduct) {
      productContext = `[THÔNG TIN GIẢI PHÁP: ${selectedProduct.name}]\n- USP: ${selectedProduct.value_prop.usp.join(', ')}\n- Lợi ích: ${selectedProduct.value_prop.benefits.join(', ')}\n- Messages: ${selectedProduct.marketing.key_messages?.join(', ') || 'N/A'}`;
    }
    const systemPrompt = systemPrompts.generator
      .replace(/{brand_name}/g, brand.name)
      .replace(/{brand_personality}/g, brand.brand_personality?.join(', ') || brand.personality)
      .replace(/{brand_voice}/g, brand.tone_of_voice || brand.voice)
      .replace(/{core_values}/g, brand.core_values?.join(', ') || 'N/A')
      .replace(/{do_words}/g, brand.do_words?.join(', ') || 'N/A')
      .replace(/{dont_words}/g, brand.dont_words?.join(', ') || 'N/A')
      .replace(/{common_mistakes}/g, mistakesPromptString)
      .replace(/{language}/g, genLanguage)
      .replace(/{platform}/g, genPlatform)
      .replace(/{product_context}/g, productContext)
      .replace(/{rag_context}/g, approvedGuidelines.length > 0 ? `[QUAN TRỌNG] Sử dụng dữ liệu từ Knowledge Base.` : '');
    const context = approvedGuidelines.map(g => `[Tài liệu: ${g.file_name}]: ${g.guideline_text || ''}`).join('\n\n---\n\n');
    try {
      const data = await generateContent({ brand, topic: genTopic, platform: genPlatform, language: genLanguage, context, systemPrompt });
      setGenResult(data.result);
      setCitations(data.citations || []);
      const timestamp = Date.now();
      await db.collection('generations').doc(`GEN_${brand.id}_${timestamp}`).set({
        id: `GEN_${brand.id}_${timestamp}`,
        brand_id: brand.id, user_id: currentUser.uid, user_name: currentUser.name || currentUser.displayName,
        input_data: { platform: genPlatform, topic: genTopic, product_id: selectedProductId },
        output_data: data.result, citations: data.citations || [], timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      });
    } catch (e: any) {
      setGenResult("Lỗi: " + e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="animate-in fade-in h-full flex flex-col">
      <SectionHeader title="CONTENT GENERATOR" subtitle="Soạn thảo nội dung thông minh dựa trên Framework Đúng - Chuẩn - An Toàn." />
      
      <div className="grid lg:grid-cols-12 gap-8 flex-1">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-premium border border-slate-100 flex flex-col gap-6">
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2.5 block ml-1">THƯƠNG HIỆU</label>
              <BrandSelector availableBrands={availableBrands} selectedBrandId={selectedBrandId} onChange={setSelectedBrandId} />
            </div>

            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1 flex items-center gap-1.5"><Package size={12} className="text-[#01ccff]"/> GIẢI PHÁP MỤC TIÊU</label>
              <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-bold text-[#102d62] outline-none" value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)}>
                <option value="">Nội dung chung về Brand</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div className="bg-[#102d62] p-5 rounded-2xl text-white relative overflow-hidden">
               <div className="flex items-center gap-2 mb-4">
                  <Lightbulb size={16} className="text-[#01ccff]" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Quality Insight Learning</span>
               </div>
               <div className="space-y-3">
                  {[
                    { label: 'Đúng (Accuracy)', value: categorizedMistakes.accuracy, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
                    { label: 'Chuẩn (Relevance)', value: categorizedMistakes.relevance, icon: Layout, color: 'text-blue-400', bg: 'bg-blue-400/10' },
                    { label: 'An Toàn (Safety)', value: categorizedMistakes.compliance, icon: ShieldCheck, color: 'text-amber-400', bg: 'bg-amber-400/10' }
                  ].map((stat, i) => (
                    <div key={i} className="flex flex-col gap-1.5">
                       <div className="flex items-center justify-between text-[10px] font-bold">
                          <span className="text-white/70">{stat.label}</span>
                          <span className={stat.value > 0 ? 'text-red-400' : 'text-emerald-400'}>{stat.value > 0 ? `${stat.value} lỗi` : '✓ Clean'}</span>
                       </div>
                       <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className={`h-full ${stat.value > 0 ? 'bg-red-400' : 'bg-emerald-400'}`} style={{ width: stat.value > 0 ? `${Math.min(stat.value * 20, 100)}%` : '100%' }}></div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">BRIEF & TOPIC</label>
              <textarea className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-[13px] min-h-[140px] font-medium text-[#102d62] outline-none focus:bg-white transition-all shadow-inner-soft custom-scrollbar" placeholder="Nhập yêu cầu..." value={genTopic} onChange={e => setGenTopic(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
               <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">NGÔN NGỮ</label>
                  <select className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-[#102d62] outline-none" value={genLanguage} onChange={e => setGenLanguage(e.target.value)}>
                      {SUPPORTED_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label.split(' ')[0]}</option>)}
                  </select>
               </div>
               <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">KÊNH ĐĂNG</label>
                  <select className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-[#102d62] outline-none" value={genPlatform} onChange={e => setGenPlatform(e.target.value)}>
                      {Object.keys(PLATFORM_CONFIGS).map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
               </div>
            </div>

            <button onClick={handleGenerate} disabled={isGenerating || (!genTopic && !selectedProductId)} className="w-full py-5 bg-[#102d62] text-white rounded-xl font-black text-[14px] flex justify-center items-center gap-2 shadow-lg hover:bg-blue-900 transition-all active:scale-95 disabled:opacity-50 uppercase tracking-widest">
              {isGenerating ? <RefreshCw className="animate-spin" size={20} /> : <Zap size={20} className="text-[#01ccff]" />} 
              {isGenerating ? 'ĐANG SOẠN...' : 'TẠO NỘI DUNG'}
            </button>
          </div>
        </div>

        <div className="lg:col-span-8 h-full">
          {genResult ? (
            <div className="bg-white p-10 rounded-[2.5rem] shadow-premium border border-slate-50 h-full flex flex-col animate-in zoom-in-95 overflow-hidden">
              <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-50 shrink-0">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#01ccff]/10 flex items-center justify-center text-[#01ccff] shadow-sm"><Sparkles size={24}/></div>
                    <div>
                      <h3 className="font-black text-[#102d62] text-xl uppercase tracking-tight">AI Generated Content</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Tối ưu theo Profile {availableBrands.find(b => b.id === selectedBrandId)?.name}</p>
                    </div>
                 </div>
                 <button onClick={() => { navigator.clipboard.writeText(genResult); setToast({type:'success', message:'Đã copy!'}); }} className="px-6 py-3 bg-white border border-slate-100 hover:bg-slate-50 rounded-xl text-[10px] font-black text-[#102d62] flex items-center gap-2 transition-all shadow-sm uppercase tracking-widest">
                   <Copy size={16}/> Copy Draft
                 </button>
              </div>
              <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap flex-1 overflow-y-auto font-sans text-[16px] custom-scrollbar pr-4 mb-6">
                {genResult}
              </div>
              {citations.length > 0 && (
                <div className="pt-6 border-t border-slate-50 shrink-0">
                   <div className="flex items-center gap-2 mb-3">
                      <BookOpen size={14} className="text-[#01ccff]" />
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nguồn tham chiếu RAG ({citations.length})</span>
                   </div>
                   <div className="flex flex-wrap gap-2">
                      {citations.map((source, i) => (
                        <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-bold border border-blue-100 flex items-center gap-2">
                           <div className="w-1 h-1 rounded-full bg-[#01ccff]"></div>
                           {source}
                        </span>
                      ))}
                   </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 p-12 group transition-all hover:bg-white">
              <div className="w-20 h-20 bg-white rounded-[2rem] shadow-premium flex items-center justify-center mb-6 text-slate-200 group-hover:scale-110 transition-all duration-500">
                <PenTool size={40} strokeWidth={1} />
              </div>
              <p className="font-black text-[#102d62] text-xl mb-3 tracking-tight uppercase">AI Content Lab is Ready</p>
              <p className="text-[13px] text-slate-400 text-center max-w-xs font-medium leading-relaxed">Nhập yêu cầu để bắt đầu soạn thảo nội dung chuẩn Brand Voice & Tone.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeneratorTab;
