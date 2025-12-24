
import React, { useState, useEffect } from 'react';
import { FileText, Globe, X, Upload, Tag, Target, Palette, MessageSquare, ShieldCheck, Heart, Zap, AlertTriangle, Book, Eye, Sparkles, RefreshCw, Loader2 } from 'lucide-react';
import { db } from '../firebase';
import firebase from '../firebase';
import { Brand, AnalysisResult, User } from '../types';
import { createGuidelineFromFile, analyzeWebsite } from '../services/api';

interface BrandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (brand: Brand) => void;
  brand: Brand | null;
  currentUser: User;
  setToast: (toast: any) => void;
}

const BrandModal: React.FC<BrandModalProps> = ({ isOpen, onClose, onSave, brand, currentUser, setToast }) => {
  const [activeTab, setActiveTab] = useState<'identity' | 'strategy' | 'rules' | 'guideline'>('identity');
  const [formData, setFormData] = useState<Partial<Brand>>({});
  const [initialGuidelineType, setInitialGuidelineType] = useState<"none" | "file" | "website">("none");
  const [guidelineFile, setGuidelineFile] = useState<File | null>(null);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [isAnalyzingPreview, setIsAnalyzingPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewError, setPreviewError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (brand) {
        setFormData({ 
          ...brand,
          secondary_colors: brand.secondary_colors || [],
          core_values: brand.core_values || [],
          usp: brand.usp || [],
          brand_personality: brand.brand_personality || [],
          do_words: brand.do_words || [],
          dont_words: brand.dont_words || []
        });
      } else {
        setFormData({
          id: Date.now().toString(),
          name: "",
          personality: "",
          voice: "",
          slug: "",
          slogan: "",
          tagline: "",
          industry: "",
          positioning_statement: "",
          primary_color: "#102d62",
          secondary_colors: [],
          core_values: [],
          usp: [],
          brand_personality: [],
          do_words: [],
          dont_words: [],
          style_rules: ""
        });
      }
      setActiveTab('identity');
      setInitialGuidelineType("none");
      setGuidelineFile(null);
      setWebsiteUrl("");
    }
  }, [brand, isOpen]);

  const updateField = (field: keyof Brand, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayInput = (field: keyof Brand, value: string) => {
    const items = value.split(',').map(i => i.trim()).filter(i => i !== "");
    updateField(field, items);
  };

  const applyAnalysisToBrand = (data: AnalysisResult) => {
    setFormData(prev => ({
      ...prev,
      name: data.brandName || prev.name,
      industry: data.industry || prev.industry,
      summary: data.summary || prev.summary,
      tone_of_voice: data.tone || prev.tone_of_voice,
      core_values: data.coreValues || prev.core_values,
      usp: data.keywords && data.keywords.length > 0 ? data.keywords : prev.usp,
      brand_personality: data.tone ? [data.tone] : prev.brand_personality,
      do_words: data.dos || prev.do_words,
      dont_words: data.donts || prev.dont_words,
      style_rules: data.visualStyle || prev.style_rules
    }));
    setToast({ type: 'success', message: 'Đã tự động điền hồ sơ thương hiệu từ dữ liệu phân tích!' });
    setActiveTab('identity');
  };

  const handleAnalyzeWebsite = async () => {
    let url = (websiteUrl || '').trim();
    setPreviewError('');
    if (!url) { setPreviewError('Vui lòng nhập URL'); return; }
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

    setIsAnalyzingPreview(true);
    try {
        const data = await analyzeWebsite(url);
        applyAnalysisToBrand(data);
    } catch (err: any) {
        setPreviewError(err.message || "Không thể phân tích website này.");
    } finally {
        setIsAnalyzingPreview(false);
    }
  };

  const handleSubmit = async () => {
    const brandName = formData.name?.trim();
    if (!brandName) {
      setToast({ type: "error", message: "Vui lòng nhập tên Brand" });
      return;
    }
    
    setIsSaving(true);
    try {
      const brandId = formData.id || Date.now().toString();
      const finalData: Brand = { 
        ...formData as Brand, 
        id: brandId,
        name: brandName,
        personality: formData.brand_personality?.join(', ') || formData.personality || '',
        voice: formData.tone_of_voice || formData.voice || ''
      };

      await db.collection("brands").doc(brandId).set(finalData, { merge: true });

      if (initialGuidelineType === "file" && guidelineFile) {
        await createGuidelineFromFile(brandId, brandName, guidelineFile, currentUser);
      } else if (initialGuidelineType === "website" && websiteUrl.trim()) {
        const timestamp = Date.now();
        const guideId = `GUIDE_${brandId}_AUTO_${timestamp}`;
        await db.collection("brand_guidelines").doc(guideId).set({
          id: guideId,
          brand_id: brandId,
          type: "auto_generated",
          status: "pending",
          description: `Auto-generated from ${websiteUrl}`,
          file_name: `${brandName}-auto.md`,
          guideline_text: `# Brand Analysis from ${websiteUrl}\n\n${formData.summary || ''}`,
          created_at: firebase.firestore.FieldValue.serverTimestamp(),
        });
      }

      setToast({ type: "success", message: "Đã lưu Brand thành công!" });
      onSave?.(finalData);
      onClose();
    } catch (err: any) {
      setToast({ type: "error", message: err.message || "Lỗi khi lưu brand" });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const inputClass = "w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-[#102d62] placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-[#102d62]/20 outline-none transition-all shadow-inner-soft";
  const labelClass = "block text-[11px] font-black text-[#102d62] uppercase tracking-[0.1em] mb-2 ml-1 opacity-90";

  const renderTabButton = (id: typeof activeTab, label: string, Icon: any) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-xl transition-all ${
        activeTab === id 
          ? 'bg-[#102d62] text-white shadow-lg shadow-blue-900/20' 
          : 'text-slate-500 hover:bg-slate-100'
      }`}
    >
      <Icon size={18} /> {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95">
        <div className="px-8 py-7 border-b border-slate-100 flex justify-between items-center bg-white relative z-10">
          <div>
            <h2 className="text-2xl font-black text-[#102d62]">{brand ? "Chỉnh sửa Brand" : "Thêm Brand mới"}</h2>
            <p className="text-sm text-slate-500 font-bold mt-1 opacity-70">Cấu hình hồ sơ năng lực và quy chuẩn AI</p>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-slate-50">
            <X size={28} />
          </button>
        </div>

        <div className="px-8 py-3 border-b border-slate-50 flex gap-2 bg-slate-50/20 overflow-x-auto custom-scrollbar">
          {renderTabButton('identity', 'Định danh', Palette)}
          {renderTabButton('strategy', 'Chiến lược', Target)}
          {renderTabButton('rules', 'Quy chuẩn AI', ShieldCheck)}
          {renderTabButton('guideline', 'Tài liệu', Book)}
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-white">
          {activeTab === 'identity' && (
            <div className="space-y-6 animate-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Tên thương hiệu *</label>
                  <input className={inputClass} value={formData.name || ''} onChange={(e) => updateField('name', e.target.value)} placeholder="VD: MOODBIZ" />
                </div>
                <div>
                  <label className={labelClass}>Lĩnh vực (Industry)</label>
                  <input className={inputClass} value={formData.industry || ''} onChange={(e) => updateField('industry', e.target.value)} placeholder="VD: Marketing, F&B..." />
                </div>
                <div>
                  <label className={labelClass}>Slogan</label>
                  <input className={inputClass} value={formData.slogan || ''} onChange={(e) => updateField('slogan', e.target.value)} placeholder="Vươn cao cùng đối tác..." />
                </div>
                <div>
                  <label className={labelClass}>Slug / ID</label>
                  <input className={`${inputClass} font-mono`} value={formData.id || ''} onChange={(e) => updateField('id', e.target.value)} disabled={!!brand} />
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                <label className={labelClass}><Palette size={14} className="inline mr-1" /> Màu sắc nhận diện</label>
                <div className="flex items-center gap-8 mt-2">
                  <div className="flex flex-col items-center gap-2">
                    <input type="color" className="w-14 h-14 rounded-2xl cursor-pointer border-none p-0 shadow-sm" value={formData.primary_color || '#102d62'} onChange={(e) => updateField('primary_color', e.target.value)} />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chính</span>
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Màu phụ (Hex code, cách nhau dấu phẩy)</label>
                    <input className={inputClass} value={formData.secondary_colors?.join(', ') || ''} onChange={(e) => handleArrayInput('secondary_colors', e.target.value)} placeholder="#FFFFFF, #01CCFF..." />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'strategy' && (
            <div className="space-y-6 animate-in">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}><Zap size={14} className="inline mr-1" /> USP (Lợi thế độc bản)</label>
                  <textarea className={`${inputClass} h-32 custom-scrollbar`} value={formData.usp?.join('\n') || ''} onChange={(e) => updateField('usp', (e.target.value || '').split('\n'))} placeholder="Mỗi dòng là 1 lợi thế..." />
                </div>
                <div>
                  <label className={labelClass}><Target size={14} className="inline mr-1" /> Định vị (Positioning)</label>
                  <textarea className={`${inputClass} h-32 custom-scrollbar`} value={formData.positioning_statement || ''} onChange={(e) => updateField('positioning_statement', e.target.value)} placeholder="Brand đứng ở đâu trong tâm trí khách hàng..." />
                </div>
              </div>

              <div>
                <label className={labelClass}>Giá trị cốt lõi (Core Values)</label>
                <input className={inputClass} value={formData.core_values?.join(', ') || ''} onChange={(e) => handleArrayInput('core_values', e.target.value)} placeholder="Chính trực, Sáng tạo, Đồng hành..." />
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="space-y-8 animate-in">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <label className={labelClass}><Tag size={14} className="inline mr-1" /> Tính cách (Personality)</label>
                  <input className={inputClass} value={formData.brand_personality?.join(', ') || ''} onChange={(e) => handleArrayInput('brand_personality', e.target.value)} placeholder="Professional, Strategic, Results-driven, Expert..." />
                </div>
                <div>
                  <label className={labelClass}><MessageSquare size={14} className="inline mr-1" /> Giọng văn (Tone of Voice)</label>
                  <input className={inputClass} value={formData.tone_of_voice || ''} onChange={(e) => updateField('tone_of_voice', e.target.value)} placeholder="VD: Trân trọng nhưng gần gũi..." />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-emerald-50/50 p-6 rounded-[2rem] border border-emerald-100 flex flex-col h-full">
                  <label className="text-[11px] font-black text-emerald-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-emerald-500 rounded-full"></span> Do-Words (Nên dùng)
                  </label>
                  <textarea className={`${inputClass} border-emerald-200/50 bg-white/50 focus:bg-white h-40 custom-scrollbar`} value={formData.do_words?.join(', ') || ''} onChange={(e) => handleArrayInput('do_words', e.target.value)} placeholder="Focus on measurable impact, Utilize advanced technology..." />
                </div>
                <div className="bg-red-50/50 p-6 rounded-[2rem] border border-red-100 flex flex-col h-full">
                  <label className="text-[11px] font-black text-red-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-red-500 rounded-full"></span> Don't-Words (Tránh dùng)
                  </label>
                  <textarea className={`${inputClass} border-red-200/50 bg-white/50 focus:bg-white h-40 custom-scrollbar`} value={formData.dont_words?.join(', ') || ''} onChange={(e) => handleArrayInput('dont_words', e.target.value)} placeholder="Don't focus on vanity metrics, Don't act merely as a vendor..." />
                </div>
              </div>

              <div>
                <label className={labelClass}><ShieldCheck size={14} className="inline mr-1" /> Quy tắc hành văn (Style Rules)</label>
                <textarea className={`${inputClass} h-32 custom-scrollbar`} value={formData.style_rules || ''} onChange={(e) => updateField('style_rules', e.target.value)} placeholder="VD: Xưng hô 'Chúng tôi' và 'Bạn', Viết hoa tên riêng..." />
              </div>
            </div>
          )}

          {activeTab === 'guideline' && (
            <div className="space-y-6 animate-in">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[#01ccff]/10 flex items-center justify-center text-[#01ccff]"><Book size={24}/></div>
                <div>
                  <h3 className="font-black text-lg text-[#102d62]">Nhập liệu Guideline thông minh</h3>
                  <p className="text-sm font-bold text-slate-500 opacity-70">Tự động hóa hồ sơ thương hiệu từ tài liệu sẵn có</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button type="button" onClick={() => setInitialGuidelineType("website")} className={`flex-1 p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 ${initialGuidelineType === "website" ? "border-[#102d62] bg-[#102d62]/5" : "border-slate-100 hover:border-blue-200"}`}>
                  <Globe size={28} className={initialGuidelineType === "website" ? "text-[#102d62]" : "text-slate-300"} />
                  <span className="text-xs font-black uppercase tracking-widest">Quét Website</span>
                </button>
                <button type="button" onClick={() => setInitialGuidelineType("file")} className={`flex-1 p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 ${initialGuidelineType === "file" ? "border-[#102d62] bg-[#102d62]/5" : "border-slate-100 hover:border-blue-200"}`}>
                  <Upload size={28} className={initialGuidelineType === "file" ? "text-[#102d62]" : "text-slate-300"} />
                  <span className="text-xs font-black uppercase tracking-widest">Upload File</span>
                </button>
              </div>

              {initialGuidelineType === "website" && (
                <div className="space-y-4 animate-in">
                  <div className="flex gap-3">
                    <input className={inputClass} value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://example.com" />
                    <button onClick={handleAnalyzeWebsite} disabled={isAnalyzingPreview} className="px-8 bg-[#102d62] text-white rounded-2xl font-black flex items-center gap-2 disabled:opacity-50 hover:bg-[#0a1d40] transition-colors shadow-lg shadow-blue-900/10">
                      {isAnalyzingPreview ? <RefreshCw className="animate-spin" size={18}/> : <Globe size={18} />} 
                      Phân tích
                    </button>
                  </div>
                  {previewError && <p className="text-xs text-red-600 font-bold flex items-center gap-1"><AlertTriangle size={14}/> {previewError}</p>}
                </div>
              )}

              {initialGuidelineType === "file" && (
                <div className="space-y-4 animate-in">
                  <div className="bg-slate-50 p-10 rounded-[2.5rem] border-2 border-dashed border-slate-200 text-center relative group transition-all hover:border-blue-200">
                    <input type="file" id="file-upload" className="hidden" onChange={(e) => setGuidelineFile(e.target.files?.[0] || null)} />
                    <label htmlFor="file-upload" className="cursor-pointer">
                        <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform">
                          <FileText size={36} className="text-[#01ccff]" />
                        </div>
                        <p className="text-base font-black text-[#102d62]">{guidelineFile ? guidelineFile.name : "Click để chọn file Guideline"}</p>
                        <p className="text-xs font-bold text-slate-400 mt-1">Hỗ trợ PDF, DOCX, MD...</p>
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-4 relative z-10">
          <button type="button" onClick={onClose} disabled={isSaving} className="px-8 py-3.5 text-sm font-black rounded-2xl text-slate-600 hover:bg-slate-200 transition-colors uppercase tracking-widest">Hủy bỏ</button>
          <button type="button" onClick={handleSubmit} disabled={isSaving} className="px-12 py-3.5 text-sm font-black rounded-2xl bg-[#102d62] text-white hover:bg-[#0a1d40] flex items-center gap-2 shadow-xl shadow-blue-900/20 disabled:opacity-70 transition-all uppercase tracking-widest">
            {isSaving ? <><Loader2 className="animate-spin" size={20} /> Đang lưu...</> : "Lưu Brand Profile"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BrandModal;
