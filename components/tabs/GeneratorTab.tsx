
import React, { useState, useMemo, useEffect } from 'react';
import {
  RefreshCw, Sparkles, Copy, PenTool, Package,
  ChevronDown, Globe, Layout, Building2, Zap, BookOpen,
  Languages, Mail, Facebook, Linkedin, LayoutDashboard, ShoppingBag,
  UserCircle, Users, Award
} from 'lucide-react';
import { Brand, SystemPrompts, User, Auditor, Guideline, Product, Persona } from '../../types';
import { SectionHeader, BrandSelector, CustomSelect, MultiSelect } from '../UIComponents';
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
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedPersonaId, setSelectedPersonaId] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);

  useEffect(() => {
    if (!selectedBrandId) return;
    
    // Fetch Products
    const unsubProducts = db.collection('products').where('brand_id', '==', selectedBrandId).onSnapshot(snap => {
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
      setSelectedProductIds([]); // Reset on brand change
    });

    // Fetch Personas
    const unsubPersonas = db.collection('personas').where('brand_id', '==', selectedBrandId).onSnapshot(snap => {
      setPersonas(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Persona)));
    });

    return () => {
      unsubProducts();
      unsubPersonas();
    }
  }, [selectedBrandId]);

  const platformOptions = useMemo(() => {
    return Object.keys(PLATFORM_CONFIGS).map(key => {
      let icon = Layout;
      if (key.includes('Facebook')) icon = Facebook;
      if (key.includes('LinkedIn')) icon = Linkedin;
      if (key.includes('Email')) icon = Mail;
      if (key.includes('Website')) icon = Globe;
      return { value: key, label: key, icon };
    });
  }, []);

  const languageOptions = useMemo(() => {
    return SUPPORTED_LANGUAGES.map(l => ({
      value: l.code,
      label: l.label,
      icon: l.flag
    }));
  }, []);

  const productOptions = useMemo(() => {
    const opts = [{ value: '', label: 'Chung (Toàn thương hiệu)', icon: Award }];
    products.forEach(p => {
      opts.push({ value: p.id, label: p.name, icon: ShoppingBag });
    });
    return opts;
  }, [products]);

  const personaOptions = useMemo(() => {
    const opts = [{ value: '', label: 'Khách hàng mục tiêu chung', icon: Users }];
    personas.forEach(p => {
      opts.push({ value: p.id, label: p.name, icon: UserCircle });
    });
    return opts;
  }, [personas]);

  // --- LOGIC CẢI TIẾN: LEARNING FROM MISTAKES ---
  const learningInsights = useMemo(() => {
    if (!auditors || !selectedBrandId) return { language: [], ai_logic: [], brand: [], product: [] };
    
    // 1. Lấy 50 bài audit gần nhất của Brand này để phân tích xu hướng lỗi
    const brandAudits = auditors
      .filter(a => a.brand_id === selectedBrandId)
      .sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)) // Sort mới nhất trước
      .slice(0, 50);

    // 2. Sử dụng Set để khử trùng lặp (Deduplication) - Tránh việc AI bị spam bởi cùng 1 lỗi
    const uniqueIssues = {
      language: new Set<string>(),
      ai_logic: new Set<string>(),
      brand: new Set<string>(),
      product: new Set<string>()
    };

    brandAudits.forEach(audit => {
      const issues = audit.output_data?.identified_issues || [];
      issues.forEach((issue: any) => {
        const cat = (issue.category || 'language').toLowerCase();
        // Chỉ lấy lý do (reason) ngắn gọn để đưa vào prompt
        const reasonShort = issue.reason?.split('.')[0] || issue.reason; 
        
        if (cat.includes('language')) uniqueIssues.language.add(reasonShort);
        else if (cat.includes('logic') || cat.includes('ai')) uniqueIssues.ai_logic.add(reasonShort);
        else if (cat.includes('brand')) uniqueIssues.brand.add(reasonShort);
        else if (cat.includes('product')) uniqueIssues.product.add(reasonShort);
      });
    });

    // 3. Chuyển về Array và giới hạn số lượng (Top 5 lỗi unique mỗi loại)
    return {
      language: Array.from(uniqueIssues.language).slice(0, 5),
      ai_logic: Array.from(uniqueIssues.ai_logic).slice(0, 5),
      brand: Array.from(uniqueIssues.brand).slice(0, 5),
      product: Array.from(uniqueIssues.product).slice(0, 5)
    };
  }, [auditors, selectedBrandId]);

  const handleGenerate = async () => {
    const brand = availableBrands.find(b => b.id === selectedBrandId);
    if (!brand) { setToast({ type: 'error', message: "Chưa chọn thương hiệu." }); return; }
    setIsGenerating(true);
    setGenResult('');

    const selectedProducts = products.filter(p => selectedProductIds.includes(p.id));
    const selectedPersona = personas.find(p => p.id === selectedPersonaId);
    
    let contextData = '';
    
    if (selectedProducts.length > 0) {
      selectedProducts.forEach((p, index) => {
        contextData += `[SẢN PHẨM/DỊCH VỤ ${index + 1}: ${p.name}]\n- Tệp khách hàng mục tiêu: ${p.target_audience}\n- Công dụng/Lợi ích: ${p.benefits}\n- USP (Lợi thế bán hàng): ${p.usp}\n\n`;
      });
    }

    if (selectedPersona) {
      contextData += `[KHÁCH HÀNG MỤC TIÊU CỤ THỂ (PERSONA): ${selectedPersona.name}]\n- Công việc/Vị trí: ${selectedPersona.jobTitle} (${selectedPersona.industry})\n- Mục tiêu/Khao khát: ${selectedPersona.goals}\n- Nỗi đau/Rào cản (Pain Points): ${selectedPersona.painPoints}\n- Ngôn ngữ ưa thích: ${selectedPersona.preferredLanguage}\n`;
    }

    if (!contextData) contextData = '[SẢN PHẨM & PERSONA] Sử dụng thông tin chung từ Brand Profile.';

    // --- PROMPT ENGINEERING: NEGATIVE CONSTRAINTS ---
    const pastMistakes = `
[NEGATIVE KNOWLEDGE - CÁC LỖI ĐÃ TỪNG VI PHẠM (TUYỆT ĐỐI TRÁNH)]
Dưới đây là danh sách các lỗi mà hệ thống Auditor đã phát hiện trong quá khứ. Bạn KHÔNG ĐƯỢC lặp lại chúng:

1. NGÔN NGỮ & TRÌNH BÀY:
${learningInsights.language.length > 0 ? learningInsights.language.map(r => `- ${r}`).join('\n') : '- (Chưa có dữ liệu vi phạm)'}

2. LOGIC & SỰ THẬT:
${learningInsights.ai_logic.length > 0 ? learningInsights.ai_logic.map(r => `- ${r}`).join('\n') : '- (Chưa có dữ liệu vi phạm)'}

3. NHẬN DIỆN THƯƠNG HIỆU (Voice/Tone):
${learningInsights.brand.length > 0 ? learningInsights.brand.map(r => `- ${r}`).join('\n') : '- (Chưa có dữ liệu vi phạm)'}

4. HIỂU BIẾT SẢN PHẨM:
${learningInsights.product.length > 0 ? learningInsights.product.map(r => `- ${r}`).join('\n') : '- (Chưa có dữ liệu vi phạm)'}
    `;

    const basePromptTemplate = systemPrompts.generator[genPlatform] || Object.values(systemPrompts.generator)[0];

    const systemPrompt = basePromptTemplate
      .replace(/{brand_name}/g, brand.name)
      .replace(/{brand_personality}/g, brand.brand_personality?.join(', ') || brand.personality)
      .replace(/{brand_voice}/g, brand.tone_of_voice || brand.voice)
      .replace(/{dont_words}/g, brand.dont_words?.join(', ') || 'N/A')
      .replace(/{do_words}/g, brand.do_words?.join(', ') || 'N/A')
      .replace(/{common_mistakes}/g, pastMistakes)
      .replace(/{language}/g, genLanguage)
      .replace(/{platform}/g, genPlatform)
      .replace(/{product_context}/g, contextData);

    const approvedGuidelines = guidelines.filter(g => g.brand_id === selectedBrandId && g.status === 'approved');
    const context = approvedGuidelines.map(g => `[Data Source: ${g.file_name}]: ${g.guideline_text || ''}`).join('\n\n');

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
        input_data: { 
          platform: genPlatform, 
          topic: genTopic, 
          language: genLanguage, 
          product_ids: selectedProductIds,
          product_id: selectedProductIds[0] || '', // Backward compatibility
          persona_id: selectedPersonaId
        },
        output_data: data.result,
        citations: data.citations || [],
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      });
    } catch (e: any) {
      setGenResult("Lỗi hệ thống: " + e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="animate-in fade-in h-full flex flex-col">
      <SectionHeader title="Content Generator" subtitle="Tạo nội dung tối ưu theo từng nền tảng & ngôn ngữ." />

      <div className="grid lg:grid-cols-12 gap-8 flex-1">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-7 rounded-[2.5rem] shadow-premium border border-slate-100 flex flex-col gap-5">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">THƯƠNG HIỆU</label>
              <BrandSelector availableBrands={availableBrands} selectedBrandId={selectedBrandId} onChange={setSelectedBrandId} />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">SẢN PHẨM / DỊCH VỤ (TÙY CHỌN)</label>
              <MultiSelect
                options={productOptions}
                value={selectedProductIds}
                onChange={setSelectedProductIds}
                placeholder="Chọn sản phẩm để tập trung"
                icon={ShoppingBag}
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">ĐỐI TƯỢNG MỤC TIÊU (PERSONA)</label>
              <CustomSelect
                options={personaOptions}
                value={selectedPersonaId}
                onChange={setSelectedPersonaId}
                placeholder="Khách hàng mục tiêu chung"
              />
            </div>

            {/* HIỂN THỊ ĐỦ 4 KHỐI INSIGHT TẠI ĐÂY */}
            <div className="bg-[#102d62] p-6 rounded-3xl text-white shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#01ccff] rounded-full blur-[60px] opacity-10 -mr-10 -mt-10 group-hover:opacity-20 transition-opacity"></div>
              <div className="flex items-center gap-2 mb-5 relative z-10">
                <Sparkles size={18} className="text-[#01ccff]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#01ccff]">4-Layer Risk Control</span>
              </div>
              <p className="text-[10px] text-slate-300 mb-4 leading-relaxed">
                AI đang học từ <strong className="text-white">{learningInsights.language.length + learningInsights.ai_logic.length + learningInsights.brand.length + learningInsights.product.length}</strong> lỗi vi phạm trong quá khứ để tránh lặp lại.
              </p>
              <div className="grid grid-cols-2 gap-3 relative z-10">
                {[
                  { label: 'Language', items: learningInsights.language, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                  { label: 'AI Logic', items: learningInsights.ai_logic, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                  { label: 'Brand', items: learningInsights.brand, color: 'text-[#01ccff]', bg: 'bg-cyan-500/10' },
                  { label: 'Product', items: learningInsights.product, color: 'text-emerald-400', bg: 'bg-emerald-500/10' }
                ].map((block, i) => (
                  <div key={i} className={`p-3 rounded-2xl border border-white/5 ${block.bg}`}>
                    <div className={`text-[9px] font-black uppercase mb-1 ${block.color}`}>{block.label}</div>
                    <div className="text-lg font-black">{block.items.length === 0 ? '✓' : `${block.items.length} Risks`}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">NHẬP CHỦ ĐỀ</label>
              <textarea className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-[13px] min-h-[140px] font-medium text-[#102d62] outline-none focus:bg-white focus:ring-4 focus:ring-[#01ccff]/5 transition-all shadow-inner-soft custom-scrollbar" placeholder="Nhập chủ đề hoặc yêu cầu chi tiết..." value={genTopic} onChange={e => setGenTopic(e.target.value)} />
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">NGÔN NGỮ</label>
                <CustomSelect options={languageOptions} value={genLanguage} onChange={setGenLanguage} icon={Globe} />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">KÊNH ĐĂNG TẢI</label>
                <CustomSelect options={platformOptions} value={genPlatform} onChange={setGenPlatform} />
              </div>
            </div>

            <button onClick={handleGenerate} disabled={isGenerating || !genTopic} className="w-full py-5 bg-[#102d62] text-white rounded-2xl font-black text-sm flex justify-center items-center gap-3 shadow-xl hover:bg-[#1a3e7d] transition-all active:scale-95 disabled:opacity-50 uppercase tracking-widest">
              {isGenerating ? <RefreshCw className="animate-spin" size={22} /> : <Zap size={22} className="text-[#01ccff]" />}
              {isGenerating ? 'ĐANG KHỞI TẠO...' : 'BẮT ĐẦU GENERATE'}
            </button>
          </div>
        </div>

        <div className="lg:col-span-8 h-full">
          {genResult ? (
            <div className="bg-white p-10 rounded-[3rem] shadow-premium border border-slate-50 h-full flex flex-col animate-in zoom-in-95 overflow-hidden">
              <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-50 shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#01ccff]/10 flex items-center justify-center text-[#01ccff] shadow-inner"><Sparkles size={28} /></div>
                  <div>
                    <h3 className="font-black text-[#102d62] text-2xl uppercase tracking-tight leading-none mb-2">Refined Content</h3>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded text-[9px] font-black uppercase">{genPlatform}</span>
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded text-[9px] font-black uppercase">{genLanguage}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => { navigator.clipboard.writeText(genResult); setToast({ type: 'success', message: 'Đã copy!' }); }} className="px-6 py-3 bg-slate-50 border border-slate-100 hover:bg-white hover:border-[#01ccff] rounded-2xl text-[11px] font-black text-[#102d62] flex items-center gap-2 transition-all shadow-sm uppercase tracking-widest">
                  <Copy size={18} /> Copy Result
                </button>
              </div>
              <div className="prose prose-sm max-w-none text-slate-700 leading-[1.9] whitespace-pre-wrap flex-1 overflow-y-auto font-sans text-[17px] custom-scrollbar pr-6 mb-6 selection:bg-[#01ccff]/20">
                {genResult}
              </div>
              {citations.length > 0 && (
                <div className="pt-6 border-t border-slate-50 shrink-0">
                  <div className="flex items-center gap-2 mb-4">
                    <BookOpen size={16} className="text-[#01ccff]" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">RAG Context ({citations.length})</span>
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
              <h3 className="font-black text-[#102d62] text-2xl mb-4 tracking-tight uppercase">Sẵn sàng khởi tạo</h3>
              <p className="text-[14px] text-slate-400 text-center max-w-sm font-medium leading-relaxed">
                Hệ thống sẽ đối soát 4 khối tiêu chuẩn MOODBIZ để đảm bảo nội dung đạt chuẩn QC cao nhất.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeneratorTab;
