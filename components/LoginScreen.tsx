
import React, { useState } from 'react';
import { Sparkles, AlertTriangle, User as UserIcon, Lock, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import { auth, db } from '../firebase';
import { User } from '../types';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      const fbUser = userCredential.user;

      if (!fbUser) throw new Error("No user returned");

      let userData: User = {
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName || fbUser.email,
        role: 'viewer',
      };

      try {
        const docRef = db.collection('users').doc(fbUser.uid);
        const snap = await docRef.get();
        if (snap.exists) {
          userData = { ...userData, ...snap.data() as any };
        }
      } catch (innerErr) {
        console.error('Lỗi đọc user metadata từ Firestore', innerErr);
      }

      onLogin(userData);
    } catch (err) {
      console.error('Lỗi đăng nhập Firebase', err);
      setError('Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-[#f8fafc] flex items-center justify-center p-4 font-sans overflow-hidden">
      
      {/* Background Blobs */}
      <div className="absolute top-[-10%] left-[-5%] w-[45%] h-[45%] bg-blue-100/40 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[45%] h-[45%] bg-cyan-100/30 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-premium w-full max-w-[440px] relative z-10 animate-in zoom-in-95 border border-white/50">
        
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 md:w-18 md:h-18 bg-[#102d62] rounded-2xl flex items-center justify-center shadow-xl shadow-blue-900/10 mb-6 transition-transform hover:scale-105 duration-300">
            <Sparkles size={32} className="text-[#01ccff]" />
          </div>
          <h1 className="text-3xl font-black text-[#102d62] mb-2 tracking-tight font-head text-center">
            MOODBIZ <span className="text-[#01ccff]">Portal</span>
          </h1>
          <p className="text-slate-600 font-bold text-sm md:text-base text-center tracking-tight opacity-80">
            Hệ thống quản trị Đa thương hiệu (RBAC)
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-600 text-xs font-bold animate-in">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[11px] font-black text-[#102d62] uppercase tracking-[0.12em] ml-1">Email đăng nhập</label>
            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#102d62] transition-colors">
                <UserIcon size={20} strokeWidth={2} />
              </div>
              <input 
                type="email" 
                className="w-full pl-14 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-[#102d62]/20 outline-none font-bold text-[#102d62] text-sm placeholder:text-slate-400 placeholder:font-semibold transition-all shadow-inner-soft" 
                placeholder="VD: user@moodbiz.vn" 
                value={email} 
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black text-[#102d62] uppercase tracking-[0.12em] ml-1">Mật khẩu</label>
            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#102d62] transition-colors">
                <Lock size={20} strokeWidth={2} />
              </div>
              <input 
                type={showPassword ? "text" : "password"}
                className="w-full pl-14 pr-14 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-[#102d62]/20 outline-none font-bold text-[#102d62] text-sm placeholder:text-slate-400 transition-all shadow-inner-soft" 
                placeholder="••••••••" 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#102d62] transition-colors p-1"
              >
                {showPassword ? <EyeOff size={20} strokeWidth={1.5} /> : <Eye size={20} strokeWidth={1.5} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between px-1 pt-1">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${rememberMe ? 'bg-[#102d62] border-[#102d62]' : 'bg-white border-slate-300'}`}>
                {rememberMe && <div className="w-2 h-2 bg-white rounded-sm"></div>}
              </div>
              <input type="checkbox" className="hidden" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} />
              <span className="text-xs font-bold text-slate-600 group-hover:text-[#102d62] transition-colors">Ghi nhớ tôi</span>
            </label>
            {/* Link "Quên mật khẩu?" đã được xóa theo yêu cầu */}
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-4 bg-[#102d62] text-white rounded-[1.25rem] font-black hover:bg-[#0a1d40] active:scale-[0.98] transition-all shadow-xl shadow-blue-900/20 flex items-center justify-center gap-3 disabled:opacity-70 text-base md:text-lg"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <>
                  Đăng Nhập <ArrowRight size={22} strokeWidth={3} />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-slate-50 text-center">
          <p className="text-[10px] md:text-xs text-slate-500 font-black tracking-[0.2em] uppercase opacity-60">
            © 2024 MOODBIZ Technology.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
