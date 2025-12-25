
import React, { useState, useMemo } from 'react';
import { RotateCcw, Save, PenTool, Activity, Plus, FileCode, Trash2, Edit3, X, Layout, Globe, Mail, Facebook, Linkedin } from 'lucide-react';
import { SystemPrompts, AuditRule } from '../../types';
import { SectionHeader } from '../UIComponents';
import { AUDIT_PROMPTS_DEFAULTS, GEN_PROMPTS_DEFAULTS, PLATFORM_CONFIGS } from '../../constants';
import { db } from '../../firebase';
import firebase from '../../firebase';

interface SettingsTabProps {
  systemPrompts: SystemPrompts;
  setSystemPrompts: (prompts: SystemPrompts) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void, type?: 'danger' | 'warning' | 'info') => void;
  setToast: (toast: any) => void;
  auditRules: AuditRule[];
}

const SettingsTab: React.FC<SettingsTabProps> = ({ systemPrompts, setSystemPrompts, showConfirm, setToast, auditRules }) => {
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<Partial<AuditRule> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPromptPlatform, setSelectedPromptPlatform] = useState('Facebook Post');
  const [activePromptType, setActivePromptType] = useState<'generator' | 'auditor'>('generator');

  const textareaClass = "w-full h-80 p-6 bg-slate-50 text-slate-800 font-mono text-[13px] rounded-2xl border border-slate-200 focus:bg-white focus:ring-4 focus:ring-[#01ccff]/10 focus:border-[#01ccff] outline-none leading-relaxed transition-all shadow-inner custom-scrollbar";
  const inputClass = "w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-[#102d62] outline-none transition-all";

  const handleSaveRule = async () => {
    if (!editingRule?.label || !editingRule?.content) return;
    setIsSaving(true);
    try {
      const id = editingRule.id || `RULE_${Date.now()}`;
      await db.collection('audit_rules').doc(id).set({
        ...editingRule,
        apply_to_language: editingRule.apply_to_language || 'all',
        id,
        updated_at: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      setIsRuleModalOpen(false);
      setToast({ type: 'success', message: 'Đã lưu SOP Rule' });
    } catch (e: any) {
      setToast({ type: 'error', message: 'Lỗi: ' + e.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRule = (id: string) => {
    showConfirm("Xóa quy tắc", "Xác nhận xóa SOP Rule này?", async () => {
      await db.collection('audit_rules').doc(id).delete();
      setToast({ type: 'success', message: 'Đã xóa quy tắc' });
    });
  };

  const updatePrompt = (type: 'generator' | 'auditor', platform: string, newVal: string) => {
    setSystemPrompts({
      ...systemPrompts,
      [type]: {
        ...systemPrompts[type],
        [platform]: newVal
      }
    });
  };

  return (
    <div className="animate-in fade-in max-w-6xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <SectionHeader title="Hệ thống Prompts" subtitle="Cấu hình Platform-Specific Prompts cho cả Generator & Auditor." />
          <div className="flex gap-3 w-full md:w-auto">
            <button onClick={() => showConfirm("Reset Prompts", "Khôi phục toàn bộ prompt về mặc định?", () => {
                setSystemPrompts({ generator: GEN_PROMPTS_DEFAULTS, auditor: AUDIT_PROMPTS_DEFAULTS });
                setToast({type:'success', message: "Đã reset prompt"});
            })} className="flex-1 md:flex-none px-4 py-2.5 rounded-xl text-slate-500 font-bold hover:bg-slate-100 flex items-center justify-center gap-2"><RotateCcw size={16}/> Reset</button>
            <button onClick={() => {
                localStorage.setItem('moodbiz_prompts', JSON.stringify(systemPrompts));
                setToast({type:'success', message: "Đã lưu vĩnh viễn"});
            }} className="flex-1 md:flex-none px-8 py-2.5 rounded-xl bg-[#102d62] text-white font-bold hover:bg-blue-900 shadow-lg flex items-center justify-center gap-2 transition-all"><Save size={18}/> Lưu Tất Cả</button>
          </div>
      </div>

      <div className="space-y-12">
          {/* SOP Rules Section */}
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-50 rounded-xl text-purple-600"><FileCode size={22} /></div>
                <div>
                  <h3 className="font-bold text-lg">SOP (Markdown Rules)</h3>
                  <p className="text-xs text-slate-400 font-medium">Đối soát rủi ro dựa trên bộ luật MD.</p>
                </div>
              </div>
              <button onClick={() => { setEditingRule({ type: 'ai_logic', code: 'Global', label: '', content: '', apply_to_language: 'all' }); setIsRuleModalOpen(true); }} className="px-5 py-2 bg-purple-600 text-white rounded-xl text-xs font-black flex items-center gap-2 hover:bg-purple-700 transition-all">
                <Plus size={16}/> Thêm Quy Tắc
              </button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {auditRules.map(rule => (
                <div key={rule.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-200 hover:border-purple-300 transition-all group">
                   <div className="flex justify-between items-start mb-4">
                      <div className="flex flex-col gap-1">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase w-fit ${rule.type === 'language' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                          {rule.type} • {rule.code}
                        </span>
                        {rule.type === 'language' && (
                          <span className="text-[9px] font-bold text-slate-400 uppercase">
                            Lang: {rule.apply_to_language === 'all' || !rule.apply_to_language ? 'Tất cả' : rule.apply_to_language === 'vi' ? 'Tiếng Việt' : rule.apply_to_language === 'en' ? 'English' : 'Japanese'}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                         <button onClick={() => { setEditingRule(rule); setIsRuleModalOpen(true); }} className="p-1.5 text-blue-600 hover:bg-white rounded-lg shadow-sm"><Edit3 size={14}/></button>
                         <button onClick={() => handleDeleteRule(rule.id)} className="p-1.5 text-red-500 hover:bg-white rounded-lg shadow-sm"><Trash2 size={14}/></button>
                      </div>
                   </div>
                   <h4 className="font-bold text-[#102d62] text-sm mb-2">{rule.label}</h4>
                   <p className="text-[11px] text-slate-500 line-clamp-3 leading-relaxed">{rule.content}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Unified Prompt Editor Section */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-premium border border-slate-100 overflow-hidden">
             <div className="flex flex-col lg:flex-row gap-8">
                <div className="lg:w-72 shrink-0 border-r border-slate-50 pr-8 space-y-8">
                   {/* Type Selector */}
                   <div className="flex bg-slate-100 p-1 rounded-2xl">
                      <button onClick={() => setActivePromptType('generator')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activePromptType === 'generator' ? 'bg-[#102d62] text-white shadow-sm' : 'text-slate-400'}`}>Generator</button>
                      <button onClick={() => setActivePromptType('auditor')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activePromptType === 'auditor' ? 'bg-[#102d62] text-white shadow-sm' : 'text-slate-400'}`}>Auditor</button>
                   </div>

                   <div>
                      <div className="flex items-center gap-3 mb-6">
                        <div className={`p-2.5 rounded-xl text-white shadow-lg ${activePromptType === 'generator' ? 'bg-blue-600' : 'bg-cyan-600'}`}>
                          {activePromptType === 'generator' ? <PenTool size={20}/> : <Activity size={20}/>}
                        </div>
                        <h3 className="font-black text-[#102d62] text-sm uppercase tracking-tight">{activePromptType} Models</h3>
                      </div>
                      <div className="space-y-1">
                          {Object.keys(PLATFORM_CONFIGS).map(platform => (
                            <button 
                              key={platform}
                              onClick={() => setSelectedPromptPlatform(platform)}
                              className={`w-full text-left px-5 py-3.5 rounded-2xl text-[12px] font-bold transition-all flex items-center gap-3 ${selectedPromptPlatform === platform ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' : 'text-slate-400 hover:bg-slate-50'}`}
                            >
                               {platform.includes('Facebook') && <Facebook size={14}/>}
                               {platform.includes('LinkedIn') && <Linkedin size={14}/>}
                               {platform.includes('Website') && <Globe size={14}/>}
                               {platform.includes('Email') && <Mail size={14}/>}
                               <span className="truncate">{platform}</span>
                            </button>
                          ))}
                      </div>
                   </div>
                </div>

                <div className="flex-1 animate-in fade-in" key={`${activePromptType}-${selectedPromptPlatform}`}>
                   <div className="mb-6 flex justify-between items-end">
                      <div>
                        <h4 className="text-xl font-black text-[#102d62] mb-1">{selectedPromptPlatform} {activePromptType === 'generator' ? 'Drafting' : 'Auditing'} Prompt</h4>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{PLATFORM_CONFIGS[selectedPromptPlatform]?.desc}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${activePromptType === 'generator' ? 'bg-blue-100 text-blue-600' : 'bg-cyan-100 text-cyan-700'}`}>
                        {activePromptType} LAYER
                      </span>
                   </div>
                   <textarea 
                     className={textareaClass} 
                     value={systemPrompts[activePromptType][selectedPromptPlatform] || ''} 
                     onChange={e => updatePrompt(activePromptType, selectedPromptPlatform, e.target.value)}
                     placeholder={`Nhập ${activePromptType} prompt cho ${selectedPromptPlatform}...`}
                   />
                   <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm text-blue-500"><Plus size={14}/></div>
                      <p className="text-[11px] text-slate-400 font-bold uppercase">Biến khả dụng: {'{brand_name}, {brand_voice}, {product_context}, {dont_words}, {do_words}, {guideline}'}</p>
                   </div>
                </div>
             </div>
          </div>
      </div>

      {/* Rule Edit Modal */}
      {isRuleModalOpen && editingRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl flex flex-col h-[85vh] overflow-hidden animate-in zoom-in-95">
             <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white">
                <div>
                  <h3 className="text-xl font-black text-[#102d62]">{editingRule.id ? 'Sửa Quy Tắc SOP' : 'Thêm Quy Tắc SOP'}</h3>
                </div>
                <button onClick={() => setIsRuleModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-full text-slate-300 transition-all"><X size={28}/></button>
             </div>
             <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                   <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Loại quy tắc</label>
                      <select className={inputClass} value={editingRule.type} onChange={e => setEditingRule({...editingRule, type: e.target.value as any})}>
                        <option value="ai_logic">AI Logic & Accuracy</option>
                        <option value="language">Ngôn ngữ (Grammar/Style)</option>
                        <option value="brand">Brand Standard</option>
                        <option value="product">Product Alignment</option>
                      </select>
                   </div>
                   
                   {/* Language Selector Conditional Render */}
                   {editingRule.type === 'language' && (
                     <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Áp dụng ngôn ngữ</label>
                        <select 
                          className={inputClass} 
                          value={editingRule.apply_to_language || 'all'} 
                          onChange={e => setEditingRule({...editingRule, apply_to_language: e.target.value as any})}
                        >
                          <option value="all">Tất cả ngôn ngữ</option>
                          <option value="vi">Tiếng Việt (Vietnamese)</option>
                          <option value="en">Tiếng Anh (English)</option>
                          <option value="ja">Tiếng Nhật (Japanese)</option>
                        </select>
                     </div>
                   )}

                   <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Code</label>
                      <input className={inputClass} value={editingRule.code} onChange={e => setEditingRule({...editingRule, code: e.target.value})} placeholder="VD: Vietnamese..." />
                   </div>
                   <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Tên hiển thị</label>
                      <input className={inputClass} value={editingRule.label} onChange={e => setEditingRule({...editingRule, label: e.target.value})} placeholder="VD: Quy chuẩn viết số..." />
                   </div>
                </div>
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Nội dung Markdown</label>
                   <textarea className={`${textareaClass} h-[400px]`} value={editingRule.content} onChange={e => setEditingRule({...editingRule, content: e.target.value})} />
                </div>
             </div>
             <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                <button onClick={() => setIsRuleModalOpen(false)} className="px-6 py-3 text-xs font-black text-slate-500 uppercase tracking-widest">Hủy</button>
                <button onClick={handleSaveRule} disabled={isSaving} className="px-10 py-3 bg-[#102d62] text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg flex items-center gap-2">
                   {isSaving ? <RotateCcw className="animate-spin" size={16}/> : <Save size={16}/>} Lưu SOP Rule
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsTab;
