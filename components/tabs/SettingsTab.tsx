
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
  const textareaClass = "w-full h-80 p-5 bg-slate-50 text-slate-800 font-mono text-sm rounded-2xl border border-slate-200 focus:bg-white focus:ring-4 focus:ring-[#01ccff]/10 focus:border-[#01ccff] outline-none leading-relaxed transition-all shadow-inner custom-scrollbar";

  return (
    <div className="animate-in fade-in max-w-6xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <SectionHeader title="Cấu hình hệ thống" subtitle="Quản lý Brand Voice & API Prompts (Dành cho Quản trị viên)" />
          <div className="flex gap-3 w-full md:w-auto">
            <button onClick={() => showConfirm("Reset Cấu hình", "Khôi phục toàn bộ prompt về mặc định? Mọi thay đổi hiện tại sẽ bị mất.", () => {
                localStorage.removeItem('moodbiz_prompts');
                setSystemPrompts({ generator: DEFAULT_GEN_PROMPT, auditor: { social: SOCIAL_AUDIT_PROMPT, website: WEBSITE_AUDIT_PROMPT } });
                setToast({type:'success', message: "Đã reset cấu hình về mặc định"});
            }, 'warning')} className="flex-1 md:flex-none px-4 py-2.5 rounded-xl text-slate-500 font-bold hover:bg-slate-100 flex items-center justify-center gap-2 transition-colors"><RotateCcw size={16}/> Reset</button>
            <button onClick={() => {
                localStorage.setItem('moodbiz_prompts', JSON.stringify(systemPrompts));
                setToast({type:'success', message: "Đã lưu cấu hình hệ thống"});
            }} className="flex-1 md:flex-none px-8 py-2.5 rounded-xl bg-[#102d62] text-white font-bold hover:bg-blue-900 shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"><Save size={18}/> Lưu Thay Đổi</button>
          </div>
      </div>

      <div className="space-y-10">
          {/* Generator Section */}
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#01ccff]/5 rounded-full -mr-16 -mt-16"></div>
            <div className="flex items-center gap-3 mb-6 text-[#102d62] relative z-10">
              <div className="p-2.5 bg-blue-50 rounded-xl text-[#102d62]"><PenTool size={22} /></div>
              <div>
                <h3 className="font-bold text-lg">Generator Prompt Template</h3>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-tight">Dùng để tạo nội dung mới từ Guideline</p>
              </div>
            </div>
            <textarea 
              className={textareaClass} 
              value={systemPrompts.generator} 
              onChange={e => setSystemPrompts({...systemPrompts, generator: e.target.value})} 
              placeholder="Nhập prompt điều khiển AI tạo nội dung..."
            />
          </div>

          {/* Auditors Grid */}
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-6 text-[#102d62]">
                  <div className="p-2.5 bg-cyan-50 rounded-xl text-cyan-600"><Activity size={22} /></div>
                  <div>
                    <h3 className="font-bold text-lg">Auditor Prompt (Social)</h3>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-tight">Dùng để kiểm duyệt các bài đăng mạng xã hội</p>
                  </div>
                </div>
                <textarea 
                  className={textareaClass} 
                  value={systemPrompts.auditor.social} 
                  onChange={e => setSystemPrompts({...systemPrompts, auditor: {...systemPrompts.auditor, social: e.target.value}})} 
                  placeholder="Nhập prompt điều khiển AI audit Social content..."
                />
            </div>

            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-6 text-[#102d62]">
                  <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600"><Activity size={22} /></div>
                  <div>
                    <h3 className="font-bold text-lg">Auditor Prompt (Website)</h3>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-tight">Dùng để kiểm duyệt bài viết Blog/SEO</p>
                  </div>
                </div>
                <textarea 
                  className={textareaClass} 
                  value={systemPrompts.auditor.website} 
                  onChange={e => setSystemPrompts({...systemPrompts, auditor: {...systemPrompts.auditor, website: e.target.value}})} 
                  placeholder="Nhập prompt điều khiển AI audit Website content..."
                />
            </div>
          </div>
          
          {/* Legend / Info */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
            <h4 className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2">💡 Hướng dẫn cấu hình Biến</h4>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-xs text-blue-700 bg-white/50 p-3 rounded-xl border border-blue-100">
                <code className="font-bold text-blue-900 bg-blue-100 px-1 rounded">{`{brand_name}`}</code>: Tên thương hiệu.
              </div>
              <div className="text-xs text-blue-700 bg-white/50 p-3 rounded-xl border border-blue-100">
                <code className="font-bold text-blue-900 bg-blue-100 px-1 rounded">{`{platform}`}</code>: Kênh đăng tải.
              </div>
              <div className="text-xs text-blue-700 bg-white/50 p-3 rounded-xl border border-blue-100">
                <code className="font-bold text-blue-900 bg-blue-100 px-1 rounded">{`{language}`}</code>: Ngôn ngữ bài viết.
              </div>
            </div>
          </div>
      </div>
    </div>
  );
};

export default SettingsTab;
