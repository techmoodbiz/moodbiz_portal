
import React from 'react';
import { RotateCcw, Save, PenTool, Activity } from 'lucide-react';
import { SystemPrompts } from '../../types';
import { SectionHeader } from '../UIComponents';
import { DEFAULT_GEN_PROMPT, SOCIAL_AUDIT_PROMPT, WEBSITE_AUDIT_PROMPT } from '../../constants';

interface SettingsTabProps {
  systemPrompts: SystemPrompts;
  setSystemPrompts: (prompts: SystemPrompts) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void, type: 'danger' | 'warning' | 'info') => void;
  setToast: (toast: any) => void;
}

const SettingsTab: React.FC<SettingsTabProps> = ({ systemPrompts, setSystemPrompts, showConfirm, setToast }) => {
  return (
    <div className="animate-in fade-in max-w-5xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-8">
          <SectionHeader title="Cấu hình hệ thống" subtitle="Quản lý Brand Voice & API Prompts" />
          <div className="flex gap-3">
            <button onClick={() => showConfirm("Reset Cấu hình", "Khôi phục toàn bộ prompt về mặc định?", () => {
                localStorage.removeItem('moodbiz_prompts');
                setSystemPrompts({ generator: DEFAULT_GEN_PROMPT, auditor: { social: SOCIAL_AUDIT_PROMPT, website: WEBSITE_AUDIT_PROMPT } });
                setToast({type:'success', message: "Đã reset cấu hình"});
            }, 'warning')} className="px-4 py-2 rounded-xl text-slate-500 font-bold hover:bg-slate-100 flex items-center gap-2"><RotateCcw size={16}/> Reset</button>
            <button onClick={() => {
                localStorage.setItem('moodbiz_prompts', JSON.stringify(systemPrompts));
                setToast({type:'success', message: "Đã lưu cấu hình"});
            }} className="px-6 py-2 rounded-xl bg-[#102d62] text-white font-bold hover:bg-blue-900 shadow-lg flex items-center gap-2"><Save size={18}/> Lưu Thay Đổi</button>
          </div>
      </div>
      <div className="space-y-8">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-6 text-[#102d62] font-bold"><PenTool size={20} className="text-[#01ccff]"/> Generator Prompt Template</div>
            <textarea className="w-full h-64 p-4 bg-slate-900 text-blue-300 font-mono text-xs rounded-xl border border-slate-700 focus:ring-2 focus:ring-[#01ccff] outline-none leading-relaxed" value={systemPrompts.generator} onChange={e => setSystemPrompts({...systemPrompts, generator: e.target.value})} />
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-6 text-[#102d62] font-bold"><Activity size={20} className="text-[#01ccff]"/> Auditor Prompt (Social)</div>
                <textarea className="w-full h-64 p-4 bg-slate-900 text-blue-300 font-mono text-xs rounded-xl border border-slate-700 focus:ring-2 focus:ring-[#01ccff] outline-none leading-relaxed" value={systemPrompts.auditor.social} onChange={e => setSystemPrompts({...systemPrompts, auditor: {...systemPrompts.auditor, social: e.target.value}})} />
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-6 text-[#102d62] font-bold"><Activity size={20} className="text-[#01ccff]"/> Auditor Prompt (Website)</div>
                <textarea className="w-full h-64 p-4 bg-slate-900 text-blue-300 font-mono text-xs rounded-xl border border-slate-700 focus:ring-2 focus:ring-[#01ccff] outline-none leading-relaxed" value={systemPrompts.auditor.website} onChange={e => setSystemPrompts({...systemPrompts, auditor: {...systemPrompts.auditor, website: e.target.value}})} />
            </div>
          </div>
      </div>
    </div>
  );
};

export default SettingsTab;
