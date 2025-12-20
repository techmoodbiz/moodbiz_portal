
import React, { useState, useMemo } from 'react';
import { Hash, RefreshCw, Sparkles, Copy, Database, PenTool } from 'lucide-react';
import { Brand, SystemPrompts, User, Auditor, Guideline } from '../../types';
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
  const [isGenerating, setIsGenerating] = useState(false);

  const approvedGuidelines = useMemo(() => 
    guidelines.filter(g => g.brand_id === selectedBrandId && g.status === 'approved'),
    [guidelines, selectedBrandId]
  );

  const commonMistakes = useMemo(() => {
    if (!auditors || !auditors.length || !selectedBrandId) return [];
    const brandAudits = auditors.filter(a => a.brand_id === selectedBrandId);
    const counts: Record<string, number> = {};
    brandAudits.forEach(audit => {
      const issues = audit.output_data?.identified_issues;
      if (Array.isArray(issues)) {
        issues.forEach((issue: any) => {
          const type = (issue.issue_type || 'Unknown').split('/')[0].trim().toLowerCase();
          counts[type] = (counts[type] || 0) + 1;
        });
      }
    });
    return Object.entries(counts).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [auditors, selectedBrandId]);

  const handleGenerate = async () => {
    const brand = availableBrands.find(b => b.id === selectedBrandId);

    if (!brand) { setToast({type: 'error', message: "Chưa chọn thương hiệu."}); return; }
    
    setIsGenerating(true);
    setGenResult('');
    
    const mistakesText = commonMistakes.length > 0 
      ? commonMistakes.map(m => `- ${m.type} (lặp lại ${m.count} lần)`).join('\n') 
      : 'Chưa có dữ liệu lỗi quan trọng.';
    
    const platformRules = PLATFORM_CONFIGS[genPlatform] || '';

    const systemPrompt = systemPrompts.generator
      .replace(/{brand_name}/g, brand.name)
      .replace(/{brand_personality}/g, brand.brand_personality?.join(', ') || brand.personality)
      .replace(/{brand_voice}/g, brand.tone_of_voice || brand.voice)
      .replace(/{language}/g, genLanguage)
      .replace(/{platform}/g, genPlatform)
      .replace(/{platform_rules}/g, platformRules)
      .replace(/{common_mistakes}/g, mistakesText)
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
      
      const timestamp = Date.now();
      const genId = `GEN_${brand.id}_${timestamp}`;
      
      await db.collection('generations').doc(genId).set({
        id: genId,
        brand_id: brand.id,
        user_id: currentUser.uid,
        user_name: currentUser.name || currentUser.displayName,
        input_data: { platform: genPlatform, topic: genTopic },
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
      <SectionHeader title="Content Generator" subtitle="AI tự động soạn thảo nội dung từ hồ sơ thương hiệu Approved." />
      
      <div className="grid lg:grid-cols-12 gap-8 flex-1">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100 space-y-5">
            <div>
              <label className="text-xs font-bold text-[#102d62] uppercase tracking-wide mb-2 block">Thương Hiệu</label>
              <BrandSelector availableBrands={availableBrands} selectedBrandId={selectedBrandId} onChange={setSelectedBrandId} />
            </div>

            <div className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${approvedGuidelines.length > 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
               <div className={`p-2 rounded-lg ${approvedGuidelines.length > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                 <Database size={16}/>
               </div>
               <div>
                 <div className="text-[10px] font-bold text-slate-500 uppercase">Knowledge Base</div>
                 <div className="text-xs font-bold text-[#102d62]">
                   {approvedGuidelines.length > 0 ? `${approvedGuidelines.length} tài liệu đang hỗ trợ` : 'Dùng hồ sơ Brand mặc định'}
                 </div>
               </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#102d62] uppercase tracking-wide mb-2 flex items-center gap-2"><Hash size={14}/> Chủ đề hoặc Yêu cầu</label>
              <textarea className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm min-h-[120px] font-medium outline-none focus:border-[#01ccff] placeholder:text-slate-300" placeholder="VD: Khai trương chi nhánh mới..." value={genTopic} onChange={e => setGenTopic(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <select className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-[#102d62] outline-none" value={genLanguage} onChange={e => setGenLanguage(e.target.value)}>
                  {SUPPORTED_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.flag} {l.label}</option>)}
               </select>
               <select className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-[#102d62] outline-none" value={genPlatform} onChange={e => setGenPlatform(e.target.value)}>
                  {Object.keys(PLATFORM_CONFIGS).map(p => <option key={p} value={p}>{p}</option>)}
               </select>
            </div>

            <button onClick={handleGenerate} disabled={isGenerating || !genTopic} className="w-full py-4 bg-[#102d62] text-white rounded-xl font-bold flex justify-center items-center gap-2 shadow-lg shadow-blue-900/20 hover:bg-blue-900 transition-all active:scale-[0.98] disabled:opacity-70">
              {isGenerating ? <RefreshCw className="animate-spin" /> : <Sparkles size={18} />} {isGenerating ? 'Đang soạn thảo...' : 'Bắt Đầu Tạo Nội Dung'}
            </button>
          </div>
        </div>

        <div className="lg:col-span-8 h-full">
          {genResult ? (
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 h-full flex flex-col animate-in fade-in zoom-in-95 duration-300">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-50">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#01ccff]/10 flex items-center justify-center text-[#01ccff]"><Sparkles size={16}/></div>
                    <div className="font-bold text-[#102d62]">Bản nháp AI đề xuất</div>
                 </div>
                 <button onClick={() => { navigator.clipboard.writeText(genResult); setToast({type:'success', message:'Copied!'}); }} className="px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-[#102d62] flex items-center gap-2 transition-all"><Copy size={16}/> Copy nội dung</button>
              </div>
              <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap flex-1 overflow-y-auto font-sans text-sm">{genResult}</div>
            </div>
          ) : (
            <div className="h-full bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 p-12 transition-all">
              <div className="w-20 h-20 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 text-slate-200">
                <PenTool size={40} />
              </div>
              <p className="font-extrabold text-[#102d62] text-xl mb-2">Sẵn sàng phục vụ</p>
              <p className="text-sm text-slate-400 text-center max-w-xs">Chọn Brand và nhập chủ đề để AI bắt đầu soạn thảo nội dung theo đúng Knowledge Base.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeneratorTab;
