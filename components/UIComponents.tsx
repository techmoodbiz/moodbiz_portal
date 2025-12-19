
import React, { useState, useEffect, useRef } from 'react';
import { Building2, ChevronDown, BarChart2, LucideIcon, ArrowRight, AlertTriangle, X, Menu, PenTool, Activity, Send, MessageSquare } from 'lucide-react';
import { Brand, Comment, User } from '../types';
import { THEME } from '../constants';
import { db } from '../firebase';

// --- Mobile Menu Toggle ---
export const MenuToggle: React.FC<{ isOpen: boolean; toggle: () => void }> = ({ isOpen, toggle }) => (
  <button 
    onClick={toggle}
    className="md:hidden p-2 text-[#102d62] hover:bg-slate-100 rounded-lg transition-colors fixed top-4 left-4 z-50 bg-white/80 backdrop-blur-md shadow-sm border border-slate-200"
  >
    {isOpen ? <X size={24} /> : <Menu size={24} />}
  </button>
);

// --- Confirmation Modal ---
interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  type?: 'danger' | 'warning' | 'info';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message, type = 'danger' }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
        <div className="p-6 text-center">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${type === 'danger' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'}`}>
            <AlertTriangle size={32} />
          </div>
          <h3 className="text-xl font-bold text-[#102d62] mb-2">{title}</h3>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">{message}</p>
          <div className="flex gap-3 justify-center">
            <button 
              onClick={onClose} 
              className="px-5 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors text-sm"
            >
              Hủy bỏ
            </button>
            <button 
              onClick={() => { onConfirm(); onClose(); }} 
              className={`px-5 py-2.5 rounded-xl text-white font-bold shadow-lg transition-all transform active:scale-95 text-sm ${
                type === 'danger' 
                  ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' 
                  : 'bg-[#102d62] hover:bg-blue-900 shadow-blue-900/20'
              }`}
            >
              Xác nhận
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Brand Selector ---
interface BrandSelectorProps {
  availableBrands: Brand[];
  selectedBrandId: string;
  onChange: (id: string) => void;
  disabled?: boolean;
  showAllOption?: boolean;
}

export const BrandSelector: React.FC<BrandSelectorProps> = ({ availableBrands, selectedBrandId, onChange, disabled, showAllOption = false }) => {
  // Only show locked view if we are strictly selecting a single brand (not filtering with "All")
  if (availableBrands.length === 1 && !showAllOption) {
    const brand = availableBrands[0];
    return (
      <div className="flex items-center justify-between px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl text-[#102d62]">
        <div className="flex items-center gap-2 font-bold text-sm">
          <Building2 size={18} className="text-[#01ccff]" />
          {brand.name}
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-200 text-blue-800 rounded-full uppercase tracking-wide">Locked</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-4 top-3.5 text-[#102d62] pointer-events-none"><Building2 size={18} /></div>
      <div className="absolute right-4 top-4 text-slate-400 pointer-events-none"><ChevronDown size={16} /></div>
      <select
        value={selectedBrandId}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full pl-11 pr-10 py-3 bg-white border-2 border-slate-200 rounded-xl appearance-none font-bold text-[#102d62] focus:border-[#01ccff] outline-none transition-all cursor-pointer shadow-sm hover:border-blue-200 text-sm"
      >
        {showAllOption && <option value="all">Tất cả Brands</option>}
        {availableBrands.map(b => (
          <option key={b.id} value={b.id}>{b.name}</option>
        ))}
      </select>
    </div>
  );
};

// --- Stat Card (Upgraded) ---
export const StatCard: React.FC<{ value: string | number; label: string; icon?: LucideIcon; delay?: number }> = ({ value, label, icon: Icon, delay = 0 }) => (
  <div 
    className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
      {Icon && <Icon size={64} className="text-[#102d62]" />}
    </div>
    
    <div className="relative z-10">
      <div className="flex items-center gap-3 mb-3">
        {Icon && <div className="p-2 bg-blue-50 rounded-lg text-[#01ccff]"><Icon size={20} /></div>}
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</div>
      </div>
      <div className="text-4xl font-extrabold tracking-tight text-[#102d62] group-hover:text-[#01ccff] transition-colors">{value}</div>
    </div>
  </div>
);

// --- Feature Card (New) ---
export const FeatureCard: React.FC<{ title: string; desc: string; icon: LucideIcon; delay?: number }> = ({ title, desc, icon: Icon, delay = 0 }) => (
  <div 
    className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 group animate-in fade-in slide-in-from-bottom-8 fill-mode-backwards"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-[#102d62] mb-4 group-hover:bg-[#102d62] group-hover:text-[#01ccff] transition-colors duration-300">
      <Icon size={24} />
    </div>
    <h3 className="text-lg font-bold text-[#102d62] mb-2">{title}</h3>
    <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
  </div>
);

// --- Quick Action Card (New) ---
export const QuickActionCard: React.FC<{ title: string; desc: string; icon: LucideIcon; onClick: () => void; color?: string }> = ({ title, desc, icon: Icon, onClick, color = "blue" }) => (
  <button 
    onClick={onClick}
    className="w-full text-left p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex items-start gap-4"
  >
    <div className={`p-3 rounded-xl ${color === 'cyan' ? 'bg-cyan-50 text-cyan-600' : 'bg-blue-50 text-blue-600'} group-hover:scale-110 transition-transform duration-300`}>
      <Icon size={24} />
    </div>
    <div className="flex-1">
      <h3 className="text-lg font-bold text-[#102d62] group-hover:text-[#01ccff] transition-colors flex items-center gap-2">
        {title} <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
      </h3>
      <p className="text-sm text-slate-500 mt-1">{desc}</p>
    </div>
  </button>
);


// --- Section Header ---
export const SectionHeader: React.FC<{ title: string; subtitle?: string; light?: boolean }> = ({ title, subtitle, light = false }) => (
  <div className="mb-8">
    <div className="flex items-center gap-3 mb-2">
      <div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: THEME.cyan }}></div>
      <h2 className={`text-2xl font-bold uppercase tracking-tight ${light ? 'text-white' : 'text-[#102d62]'}`}>{title}</h2>
    </div>
    {subtitle && <p className={`${light ? 'text-blue-200' : 'text-slate-500'} text-sm ml-5`}>{subtitle}</p>}
  </div>
);

// --- Simple Bar Chart ---
export const SimpleBarChart: React.FC<{ data: { type: string; count: number }[] }> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <BarChart2 size={32} className="mx-auto mb-3 opacity-30" />
        <p>Chưa có dữ liệu thống kê</p>
      </div>
    );
  }
  const maxCount = Math.max(...data.map(d => d.count));
  return (
    <div className="space-y-4">
      {data.map((item, idx) => (
        <div key={idx} className="flex items-center gap-4">
          <div className="w-40 text-sm font-medium text-slate-700 truncate capitalize">
            {item.type}
          </div>
          <div className="flex-1 bg-slate-100 rounded-lg h-10 relative overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#102d62] to-[#01ccff] rounded-lg transition-all duration-500 flex items-center justify-end px-3"
              style={{ width: `${(item.count / maxCount) * 100}%` }}
            >
              <span className="text-white font-bold text-sm">{item.count}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// --- Skeleton Card ---
export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`bg-slate-100 animate-pulse rounded-2xl ${className || 'h-32'}`}></div>
);

// --- Activity Item ---
export const ActivityItem: React.FC<{ type: 'generator' | 'auditor'; title: string; subtitle: string; time: any }> = ({ type, title, subtitle, time }) => {
  const Icon = type === 'generator' ? PenTool : Activity;
  const colorClass = type === 'generator' ? 'bg-blue-50 text-blue-600' : 'bg-cyan-50 text-cyan-600';
  
  const formatTime = (ts: any) => {
    if (!ts) return '';
    try {
      if (ts.toDate) return ts.toDate().toLocaleString('vi-VN');
      return new Date(ts).toLocaleString('vi-VN');
    } catch (e) { return ''; }
  };

  return (
    <div className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-xl transition-colors border-b border-slate-50 last:border-0 group">
      <div className={`p-3 rounded-xl ${colorClass} group-hover:scale-110 transition-transform`}>
        <Icon size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-[#102d62] line-clamp-1">{title}</div>
        <div className="text-xs text-slate-500 truncate">{subtitle}</div>
      </div>
      <div className="text-right">
        <div className="text-xs font-bold text-slate-400">{formatTime(time).split(' ')[1]}</div>
        <div className="text-[10px] text-slate-300">{formatTime(time).split(' ')[0]}</div>
      </div>
    </div>
  );
};

// --- Template Card ---
export const TemplateCard: React.FC<{ title: string; desc: string; onClick: () => void }> = ({ title, desc, onClick }) => (
  <button onClick={onClick} className="w-full text-left p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-white hover:border-[#01ccff] hover:shadow-md transition-all group">
    <h4 className="font-bold text-[#102d62] text-sm mb-1 group-hover:text-[#01ccff] flex items-center justify-between">
       {title}
       <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
    </h4>
    <p className="text-xs text-slate-500 line-clamp-2">{desc}</p>
  </button>
);

// --- KPI Stat Card ---
export const KPIStatCard: React.FC<{ title: string; value: string | number; icon: LucideIcon; color?: string; subValue?: string }> = ({ title, value, icon: Icon, color = 'blue', subValue }) => {
   const getColor = (c: string) => {
      switch(c) {
          case 'emerald': return 'bg-emerald-50 text-emerald-600';
          case 'amber': return 'bg-amber-50 text-amber-600';
          case 'cyan': return 'bg-cyan-50 text-cyan-600';
          default: return 'bg-blue-50 text-blue-600';
      }
   }
   
   return (
     <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-lg transition-shadow">
        <div className={`p-3 rounded-xl ${getColor(color)}`}>
           <Icon size={24} />
        </div>
        <div>
           <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">{title}</p>
           <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-[#102d62]">{value}</span>
              {subValue && <span className="text-xs font-bold text-slate-400">{subValue}</span>}
           </div>
        </div>
     </div>
   );
};

// --- Comment Section ---
interface CommentSectionProps {
  parentId: string;
  currentUser: User;
  onAddComment: (content: string) => Promise<void>;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ parentId, currentUser, onAddComment }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    const unsubscribe = db.collection('generations').doc(parentId).collection('comments')
      .orderBy('timestamp', 'asc')
      .onSnapshot(
        snap => {
          const items: Comment[] = [];
          snap.forEach(doc => items.push({ id: doc.id, ...doc.data() } as Comment));
          setComments(items);
          setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        },
        err => {
          console.error("Error fetching comments:", err);
          setError("Không thể tải bình luận. Vui lòng kiểm tra quyền truy cập.");
        }
      );
    return unsubscribe;
  }, [parentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await onAddComment(newComment);
      setNewComment('');
    } catch (err: any) {
      console.error("Error adding comment:", err);
      setError("Không thể gửi bình luận. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 border-l border-slate-200 w-full md:w-80 shrink-0">
      <div className="p-4 border-b border-slate-200 bg-white font-bold text-[#102d62] text-sm flex items-center gap-2">
        <MessageSquare size={16} /> Bình luận & Ghi chú
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {error ? (
          <div className="text-center p-4 bg-red-50 text-red-500 rounded-xl text-xs font-medium border border-red-100 flex flex-col items-center gap-2">
            <AlertTriangle size={16} />
            {error}
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center text-slate-400 text-xs mt-10 italic">Chưa có bình luận nào.</div>
        ) : (
          comments.map(c => (
            <div key={c.id} className={`flex flex-col ${c.userId === currentUser.uid ? 'items-end' : 'items-start'}`}>
               <div className="flex items-center gap-2 mb-1">
                 <span className="text-[10px] font-bold text-slate-500">{c.userName}</span>
                 <span className="text-[9px] text-slate-300">
                    {c.timestamp?.toDate ? c.timestamp.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                 </span>
               </div>
               <div className={`p-3 rounded-xl text-xs max-w-[90%] ${c.userId === currentUser.uid ? 'bg-blue-100 text-[#102d62]' : 'bg-white border border-slate-200 text-slate-700'}`}>
                 {c.content}
               </div>
            </div>
          ))
        )}
        <div ref={scrollRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-slate-200">
        <div className="relative">
          <input 
            type="text" 
            className="w-full pl-3 pr-10 py-2.5 bg-slate-100 border-0 rounded-xl text-xs focus:ring-2 focus:ring-[#01ccff] outline-none"
            placeholder="Viết bình luận..."
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
          />
          <button type="submit" disabled={loading || !newComment.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-600 hover:bg-blue-100 p-1 rounded-full transition-colors disabled:opacity-50">
            <Send size={14} />
          </button>
        </div>
      </form>
    </div>
  );
};
