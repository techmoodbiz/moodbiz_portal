
import React, { useState, useEffect } from 'react';
import { FileText, Globe, X, Upload, Tag, Target, Palette, MessageSquare, Layers } from 'lucide-react';
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
  const [id, setId] = useState(brand?.id ?? Date.now().toString());
  const [name, setName] = useState(brand?.name ?? "");
  const [personality, setPersonality] = useState(brand?.personality ?? "");
  const [voice, setVoice] = useState(brand?.voice ?? "");

  const [initialGuidelineType, setInitialGuidelineType] = useState<"none" | "file" | "website">("none");
  const [guidelineFile, setGuidelineFile] = useState<File | null>(null);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [previewAnalysis, setPreviewAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzingPreview, setIsAnalyzingPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewError, setPreviewError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (brand) {
        setId(brand.id ?? Date.now().toString());
        setName(brand.name ?? "");
        setPersonality(brand.personality ?? "");
        setVoice(brand.voice ?? "");
      } else {
        setId(Date.now().toString());
        setName("");
        setPersonality("");
        setVoice("");
      }
      setInitialGuidelineType("none");
      setGuidelineFile(null);
      setWebsiteUrl("");
      setPreviewAnalysis(null);
    }
  }, [brand, isOpen]);

  const handleAnalyzeWebsite = async () => {
    let url = (websiteUrl || '').trim();
    setPreviewError('');
    if (!url) { setPreviewError('Vui lòng nhập URL'); return; }
    
    // Auto-add https if missing
    if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
    }

    setIsAnalyzingPreview(true);
    try {
        // Attempt 1: Try Original URL
        const data = await analyzeWebsite(url);
        setPreviewAnalysis(data);
        if (url !== websiteUrl) setWebsiteUrl(url);
    } catch (err: any) {
        // Attempt 2: Smart Retry (Toggle www.)
        // Fixes SSL issues where cert is valid for www but not root, or vice versa
        let retryUrl = url;
        if (url.includes('//www.')) {
            retryUrl = url.replace('//www.', '//');
        } else {
            retryUrl = url.replace('//', '//www.');
        }

        if (retryUrl !== url) {
            try {
                const data = await analyzeWebsite(retryUrl);
                setPreviewAnalysis(data);
                setWebsiteUrl(retryUrl); // Update UI to the working URL
                return; // Success on retry
            } catch (retryErr) {
                // Retry failed, fall through to error handler
            }
        }
        
        // Final Error Handling
        const msg = (err.message || '').toLowerCase();
        if (msg.includes('fetch failed') || msg.includes('certificate') || msg.includes('verify') || msg.includes('ssl')) {
            setPreviewError("Lỗi bảo mật SSL từ website đích hoặc website chặn bot. Vui lòng nhập thông tin thủ công hoặc upload file.");
        } else {
            setPreviewError(err.message || "Không thể phân tích website này.");
        }
    } finally {
        setIsAnalyzingPreview(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setToast({ type: "error", message: "Vui lòng nhập tên Brand" });
      return;
    }
    
    setIsSaving(true);
    try {
      await db.collection("brands").doc(id).set(
        { id, name, personality, voice },
        { merge: true }
      );

      if (initialGuidelineType === "file" && guidelineFile) {
        await createGuidelineFromFile(id, name, guidelineFile, currentUser);
      } else if (initialGuidelineType === "website" && websiteUrl.trim()) {
        const analysisResult = await analyzeWebsite(websiteUrl.trim());
        const analyzedAt = analysisResult.analyzedAt ? new Date(analysisResult.analyzedAt) : new Date();

        const guidelineText = `# ${analysisResult.brandName} Brand Guidelines
**Auto-generated from:** ${websiteUrl}
**Generated at:** ${analyzedAt.toLocaleString('vi-VN')}

## Brand Overview
${analysisResult.summary}

## Brand Identity
- **Industry:** ${analysisResult.industry}
- **Target Audience:** ${analysisResult.targetAudience}
- **Tone:** ${analysisResult.tone}

## Core Values
${(analysisResult.coreValues || []).map(v => `- ${v}`).join('\n')}

## Keywords
${(analysisResult.keywords || []).join(', ')}

## Visual Style
${analysisResult.visualStyle || ''}

## DO's
${(analysisResult.dos || []).map((d, i) => `${i + 1}. ${d}`).join('\n')}

## DON'Ts
${(analysisResult.donts || []).map((d, i) => `${i + 1}. ${d}`).join('\n')}
`;
        await db.collection("brand_guidelines").add({
            brand_id: id,
            type: "auto_generated",
            status: "pending",
            description: `Auto-generated from ${websiteUrl}`,
            file_name: `${analysisResult.brandName || name}-auto.md`,
            guideline_text: guidelineText,
            metadata: analysisResult,
            uploaded_by: currentUser?.email || "system",
            uploaded_role: currentUser?.role || "system",
            created_at: firebase.firestore.FieldValue.serverTimestamp(),
          });
          
          await db.collection("brands").doc(id).set(
            {
              name: analysisResult.brandName || name,
              personality: analysisResult.coreValues?.join(", "),
              voice: analysisResult.tone,
              summary: analysisResult.summary,
              last_guideline_updated_at: firebase.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
      }

      setToast({ type: "success", message: "Đã lưu brand thành công!" });
      onSave?.({ id, name, personality, voice });
      onClose();
    } catch (err: any) {
      console.error("Lỗi khi lưu brand / guideline:", err);
      setToast({ type: "error", message: err.message || "Lỗi khi lưu brand" });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const inputClass = "w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-[#102d62] placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#01ccff]/20 focus:border-[#01ccff] outline-none transition-all";
  const labelClass = "block text-xs font-bold text-[#102d62] uppercase tracking-wide mb-1.5 ml-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white z-10">
          <h2 className="text-xl font-bold text-[#102d62]">{brand ? "Chỉnh sửa Brand" : "Thêm Brand mới"}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-slate-50">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div>
              <label className={labelClass}>Tên Brand</label>
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Highlands Coffee" />
            </div>
            <div>
              <label className={labelClass}>ID Duy nhất</label>
              <input className={`${inputClass} ${brand ? 'opacity-70 cursor-not-allowed bg-slate-100' : ''}`} value={id} onChange={(e) => setId(e.target.value)} disabled={!!brand} />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
            <div>
              <label className={labelClass}>Personality (Tính cách)</label>
              <textarea className={`${inputClass} h-32 resize-none`} value={personality} onChange={(e) => setPersonality(e.target.value)} placeholder="Mô tả tính cách thương hiệu..." />
            </div>
            <div>
              <label className={labelClass}>Voice (Giọng văn)</label>
              <textarea className={`${inputClass} h-32 resize-none`} value={voice} onChange={(e) => setVoice(e.target.value)} placeholder="Mô tả giọng văn thương hiệu..." />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h3 className="text-sm font-bold text-[#102d62] mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-[#01ccff] rounded-full"></span>
              Thêm Brand Guideline (Tuỳ chọn)
            </h3>
            
            <div className="flex items-center gap-2 mb-5">
              <button type="button" onClick={() => setInitialGuidelineType("none")} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${initialGuidelineType === "none" ? "bg-slate-200 text-slate-700" : "bg-white border border-slate-200 text-slate-500 hover:border-[#01ccff] hover:text-[#01ccff]"}`}>Không thêm</button>
              <button type="button" onClick={() => setInitialGuidelineType("file")} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${initialGuidelineType === "file" ? "bg-[#102d62] text-white shadow-lg shadow-blue-900/20" : "bg-white border border-slate-200 text-slate-500 hover:border-[#01ccff] hover:text-[#01ccff]"}`}><FileText size={14} /> Từ file</button>
              <button type="button" onClick={() => setInitialGuidelineType("website")} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${initialGuidelineType === "website" ? "bg-[#102d62] text-white shadow-lg shadow-blue-900/20" : "bg-white border border-slate-200 text-slate-500 hover:border-[#01ccff] hover:text-[#01ccff]"}`}><Globe size={14} /> Từ website</button>
            </div>

            {initialGuidelineType === "file" && (
              <div className="bg-slate-50 p-6 rounded-xl border-2 border-dashed border-slate-200 hover:border-[#01ccff]/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center border border-slate-200 shadow-sm text-[#01ccff]">
                    {guidelineFile ? <FileText size={24} /> : <Upload size={24} />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-[#102d62]">Upload tài liệu Guideline</p>
                    <p className="text-xs text-slate-500 mt-1">Hỗ trợ PDF, DOCX, CSV. Tối đa 10MB.</p>
                    {guidelineFile && <p className="mt-2 text-xs font-semibold text-emerald-600 bg-emerald-50 inline-block px-2 py-1 rounded-lg border border-emerald-100">Đã chọn: {guidelineFile.name}</p>}
                  </div>
                  <input type="file" accept=".pdf,.doc,.docx,.csv" id={`brand-modal-guideline-file-${id}`} className="hidden" onChange={(e) => setGuidelineFile(e.target.files?.[0] || null)} />
                  <button type="button" onClick={() => document.getElementById(`brand-modal-guideline-file-${id}`)?.click()} className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-[#102d62] hover:bg-slate-50 transition-colors shadow-sm">Chọn file</button>
                </div>
              </div>
            )}

            {initialGuidelineType === "website" && (
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                <div className="grid md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className={labelClass}>URL Website</label>
                    <input type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://brand.com" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#01ccff] outline-none" />
                    {previewError && <p className="mt-2 text-xs text-red-500 font-medium flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> {previewError}</p>}
                  </div>
                  <div className="flex items-end">
                    <button type="button" onClick={handleAnalyzeWebsite} className="w-full px-4 py-2.5 rounded-xl bg-[#102d62] text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-70 hover:bg-blue-900 transition-all shadow-lg shadow-blue-900/10" disabled={isAnalyzingPreview}>
                      {isAnalyzingPreview ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Đang xử lý...</> : 'Phân tích'}
                    </button>
                  </div>
                </div>
                {previewAnalysis && (
                  <div className="mt-4 bg-white rounded-xl p-5 border border-emerald-100 shadow-sm space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                    {/* Header */}
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <p className="font-bold text-[#102d62] text-sm">Kết quả phân tích: {previewAnalysis.brandName || 'Brand'}</p>
                    </div>

                    {/* Summary */}
                    {previewAnalysis.summary && (
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                         <span className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">Overview</span>
                         <p className="text-xs text-slate-600 leading-relaxed italic">"{previewAnalysis.summary}"</p>
                      </div>
                    )}

                    {/* Key Details Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Industry */}
                      <div className="p-3 bg-white rounded-lg border border-slate-200">
                        <span className="flex items-center gap-1 text-slate-400 font-bold mb-1 uppercase text-[10px]"><Layers size={10}/> Industry</span>
                        <span className="text-xs font-semibold text-[#102d62]">{previewAnalysis.industry || 'N/A'}</span>
                      </div>
                      {/* Target Audience */}
                      <div className="p-3 bg-white rounded-lg border border-slate-200">
                        <span className="flex items-center gap-1 text-slate-400 font-bold mb-1 uppercase text-[10px]"><Target size={10}/> Audience</span>
                        <span className="text-xs font-semibold text-[#102d62]">{previewAnalysis.targetAudience || 'N/A'}</span>
                      </div>
                      {/* Tone */}
                      <div className="p-3 bg-white rounded-lg border border-slate-200">
                        <span className="flex items-center gap-1 text-slate-400 font-bold mb-1 uppercase text-[10px]"><MessageSquare size={10}/> Tone</span>
                        <span className="text-xs font-semibold text-[#102d62]">{previewAnalysis.tone || 'N/A'}</span>
                      </div>
                      {/* Visual Style */}
                      <div className="p-3 bg-white rounded-lg border border-slate-200">
                        <span className="flex items-center gap-1 text-slate-400 font-bold mb-1 uppercase text-[10px]"><Palette size={10}/> Style</span>
                        <span className="text-xs font-semibold text-[#102d62] line-clamp-2" title={previewAnalysis.visualStyle}>{previewAnalysis.visualStyle || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Core Values */}
                    {previewAnalysis.coreValues && previewAnalysis.coreValues.length > 0 && (
                      <div>
                        <span className="block text-slate-400 font-bold mb-2 uppercase text-[10px]">Core Values</span>
                        <div className="flex flex-wrap gap-2">
                          {previewAnalysis.coreValues.map((v, i) => (
                            <span key={i} className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-[10px] font-bold border border-blue-100 flex items-center gap-1">
                               <span className="w-1 h-1 rounded-full bg-blue-400"></span> {v}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Keywords */}
                    {previewAnalysis.keywords && previewAnalysis.keywords.length > 0 && (
                      <div>
                        <span className="block text-slate-400 font-bold mb-2 uppercase text-[10px] flex items-center gap-1"><Tag size={12}/> Keywords</span>
                        <div className="flex flex-wrap gap-2">
                          {previewAnalysis.keywords.map((k, i) => (
                            <span key={i} className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-medium border border-slate-200">#{k}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 z-10">
          <button type="button" onClick={onClose} disabled={isSaving} className="px-5 py-2.5 text-sm font-bold rounded-xl text-slate-600 hover:bg-slate-200 transition-colors">Hủy bỏ</button>
          <button type="button" onClick={handleSubmit} disabled={isSaving} className="px-6 py-2.5 text-sm font-bold rounded-xl bg-[#102d62] text-white hover:bg-blue-900 flex items-center gap-2 shadow-lg shadow-blue-900/20 disabled:opacity-70 disabled:cursor-not-allowed transition-all">
            {isSaving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Đang lưu...</> : "Lưu Thay Đổi"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BrandModal;
