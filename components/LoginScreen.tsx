import React, { useState } from 'react';
import { Sparkles, AlertTriangle, User as UserIcon, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
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
      setError('Sai email hoặc mật khẩu hoặc tài khoản chưa được tạo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center p-4 relative font-sans">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/50 rounded-full blur-3xl opacity-60"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-100/50 rounded-full blur-3xl opacity-60"></div>
      </div>

      <div className="bg-white p-8 md:p-12 rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] w-full max-w-[480px] relative z-10 border border-white/50 backdrop-blur-sm">
        
        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#102d62] rounded-2xl shadow-lg shadow-blue-900/20 mb-6 transform rotate-3 hover:rotate-6 transition-transform duration-300">
            <Sparkles size={28} className="text-[#01ccff]" />
          </div>
          <h1 className="text-3xl font-extrabold text-[#102d62] mb-2 font-head tracking-tight">MOODBIZ Portal</h1>
          <p className="text-slate-500 font-medium text-sm">Hệ thống quản trị Đa thương hiệu (RBAC)</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600 text-sm font-medium animate-in fade-in slide-in-from-top-2">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#102d62] uppercase tracking-wide ml-1">Email đăng nhập</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#01ccff] transition-colors">
                <UserIcon size={20} />
              </div>
              <input 
                type="email" 
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#01ccff]/20 focus:border-[#01ccff] outline-none font-medium text-[#102d62] placeholder:text-slate-400 transition-all" 
                placeholder="VD: user@moodbiz.vn" 
                value={email} 
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[#102d62] uppercase tracking-wide ml-1">Mật khẩu</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#01ccff] transition-colors">
                <Lock size={20} />
              </div>
              <input 
                type={showPassword ? "text" : "password"}
                className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#01ccff]/20 focus:border-[#01ccff] outline-none font-medium text-[#102d62] placeholder:text-slate-400 transition-all" 
                placeholder="••••••••" 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#102d62] transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-4 bg-[#102d62] text-white rounded-xl font-bold hover:bg-blue-900 active:scale-[0.99] transition-all shadow-lg shadow-blue-900/10 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  Đăng Nhập <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-10 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400 font-medium">
            © 2024 MOODBIZ Technology. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;