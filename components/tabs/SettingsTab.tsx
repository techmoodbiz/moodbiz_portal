

import React, { useState } from 'react';
import { RotateCcw, Save, PenTool, Activity, Plus, FileCode, Trash2, Edit3, X } from 'lucide-react';
import { SystemPrompts, AuditRule } from '../../types';
import { SectionHeader } from '../UIComponents';
import { DEFAULT_GEN_PROMPT, SOCIAL_AUDIT_PROMPT, WEBSITE_AUDIT_PROMPT } from '../../constants';
import { db } from '../../firebase';
import firebase from '../../firebase';

interface SettingsTabProps {
  systemPrompts: SystemPrompts;
  setSystemPrompts: (prompts: SystemPrompts) => void;
  /* Fixed: made type optional to match App.tsx definition */
  showConfirm: (title: string, message: string, onConfirm: () => void, type?: 'danger' | 'warning' | 'info') => void;
  setToast: (toast: any) => void;
  auditRules: AuditRule[];
}

const SettingsTab: React.FC<SettingsTabProps> = ({ systemPrompts, setSystemPrompts, showConfirm, setToast, auditRules }) => {
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<Partial<AuditRule> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const textareaClass = "w-full h-80 p-5 bg-slate-50 text-slate-800 font-mono text-sm rounded-2xl border border-slate-200 focus:bg-white focus:ring-4 focus:ring-[#01ccff]/10 focus:border-[#01ccff] outline-none leading-relaxed transition-all shadow-inner custom-scrollbar";
  const inputClass = "w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-[#102d62] outline-none transition-all";

  const handleSaveRule = async () => {
    if (!editingRule?.label || !editingRule?.content) return;
    setIsSaving(true);
    try {
      const id = editingRule.id || `RULE_${Date.now()}`;
      await db.collection('audit_rules').doc(id).set({
        ...editingRule,
        id,
        updated_at: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      setIsRuleModalOpen(false);
      setToast({ type: 'success', message: 'Đã lưu quy tắc SOP' });
    } catch (e: any) {
      setToast({ type: 'error', message: 'Lỗi: ' + e.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRule = (id: string) => {
    showConfirm("Xóa quy tắc", "Bạn có chắc chắn muốn xóa file SOP này?", async () => {
      await db.collection('audit_rules').doc(id).delete();
      setToast({ type: 'success', message: 'Đã xóa quy tắc' });
    });
  };

  return (
    <div className="animate-in fade-in max-w-6xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <SectionHeader title="Cấu hình hệ thống" subtitle="Quản lý Prompts & Markdown SOP Rules cho AI Auditor." />
          <div className="flex gap-3 w-full md:w-auto">
            <button onClick={() => showConfirm("Reset Prompts", "Khôi phục prompt về mặc định?", () => {
                setSystemPrompts({ generator: DEFAULT_GEN_PROMPT, auditor: { social: SOCIAL_AUDIT_PROMPT, website: WEBSITE_AUDIT_PROMPT } });
                setToast({type:'success', message: "Đã reset prompt"});
            })} className="flex-1 md:flex-none px-4 py-2.5 rounded-xl text-slate-500 font-bold hover:bg-slate-100 flex items-center justify-center gap-2"><RotateCcw size={16}/> Reset Prompts</button>
            <button onClick={() => {
                localStorage.setItem('moodbiz_prompts', JSON.stringify(systemPrompts));
                setToast({type:'success', message: "Đã lưu prompt"});
            }} className="flex-1 md:flex-none px-8 py-2.5 rounded-xl bg-[#102d62] text-white font-bold hover:bg-blue-900 shadow-lg flex items-center justify-center gap-2 transition-all"><Save size={18}/> Lưu Prompts</button>
          </div>
      </div>

      <div className="space-y-12">
          {/* Audit SOP Rules Manager */}
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-50 rounded-xl text-purple-600"><FileCode size={22} /></div>
                <div>
                  <h3 className="font-bold text-lg">Audit SOPs (Markdown Rules)</h3>
                  <p className="text-xs text-slate-400 font-medium">Hệ thống nạp các file MD này vào AI để đối soát lỗi.</p>
                </div>
              </div>
              <button onClick={() => { setEditingRule({ type: 'ai_logic', code: 'Global', label: '', content: '' }); setIsRuleModalOpen(true); }} className="px-5 py-2 bg-purple-600 text-white rounded-xl text-xs font-black flex items-center gap-2 hover:bg-purple-700 transition-all">
                <Plus size={16}/> Thêm Quy Tắc
              </button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {auditRules.map(rule => (
                <div key={rule.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-200 hover:border-purple-300 transition-all group">
                   <div className="flex justify-between items-start mb-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${rule.type === 'language' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                        {rule.type} • {rule.code}
                      </span>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                         <button onClick={() => { setEditingRule(rule); setIsRuleModalOpen(true); }} className="p-1.5 text-blue-600 hover:bg-white rounded-lg shadow-sm"><Edit3 size={14}/></button>
                         <button onClick={() => handleDeleteRule(rule.id)} className="p-1.5 text-red-500 hover:bg-white rounded-lg shadow-sm"><Trash2 size={14}/></button>
                      </div>
                   </div>
                   <h4 className="font-bold text-[#102d62] text-sm mb-2">{rule.label}</h4>
                   <p className="text-[11px] text-slate-500 line-clamp-3 leading-relaxed">{rule.content}</p>
                </div>
              ))}
              {auditRules.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-400 border-2 border-dashed border-slate-100 rounded-3xl">Chưa có quy tắc SOP nào. Hãy thêm file MD đầu tiên.</div>
              )}
            </div>
          </div>

          {/* Generator Section */}
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-blue-50 rounded-xl text-[#102d62]"><PenTool size={22} /></div>
              <h3 className="font-bold text-lg">Generator Prompt Template</h3>
            </div>
            <textarea className={textareaClass} value={systemPrompts.generator} onChange={e => setSystemPrompts({...systemPrompts, generator: e.target.value})} />
          </div>

          {/* Auditors Prompts */}
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-cyan-50 rounded-xl text-cyan-600"><Activity size={22} /></div>
                  <h3 className="font-bold text-lg">Auditor Prompt (Social)</h3>
                </div>
                <textarea className={textareaClass} value={systemPrompts.auditor.social} onChange={e => setSystemPrompts({...systemPrompts, auditor: {...systemPrompts.auditor, social: e.target.value}})} />
            </div>
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600"><Activity size={22} /></div>
                  <h3 className="font-bold text-lg">Auditor Prompt (Website)</h3>
                </div>
                <textarea className={textareaClass} value={systemPrompts.auditor.website} onChange={e => setSystemPrompts({...systemPrompts, auditor: {...systemPrompts.auditor, website: e.target.value}})} />
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
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Hệ thống sẽ nạp file MD này vào Knowledge Base của Auditor</p>
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
                   <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Mã định danh (Code)</label>
                      <input className={inputClass} value={editingRule.code} onChange={e => setEditingRule({...editingRule, code: e.target.value})} placeholder="VD: Vietnamese, Global_AI..." />
                   </div>
                   <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Tên hiển thị (Label)</label>
                      <input className={inputClass} value={editingRule.label} onChange={e => setEditingRule({...editingRule, label: e.target.value})} placeholder="VD: Quy chuẩn viết số..." />
                   </div>
                </div>
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Nội dung Markdown (SOP Content)</label>
                   <textarea className={`${textareaClass} h-[400px]`} value={editingRule.content} onChange={e => setEditingRule({...editingRule, content: e.target.value})} placeholder="# Hướng dẫn viết số...&#10;- Không dùng dấu phẩy tùy tiện..."></textarea>
                </div>
             </div>
             <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                <button onClick={() => setIsRuleModalOpen(false)} className="px-6 py-3 text-xs font-black text-slate-500 uppercase tracking-widest">Hủy bỏ</button>
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
