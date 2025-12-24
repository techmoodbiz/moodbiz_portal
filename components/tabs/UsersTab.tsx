
import React from 'react';
import { PlusCircle, Edit3, Trash2 } from 'lucide-react';
import { User, Brand } from '../../types';
import { SectionHeader } from '../UIComponents';

interface UsersTabProps {
  users: User[];
  brands: Brand[];
  currentUser: User;
  setEditingUser: (user: User | null) => void;
  setIsUserModalOpen: (isOpen: boolean) => void;
  handleDeleteUser: (id: string) => void;
}

const UsersTab: React.FC<UsersTabProps> = ({ users, brands, currentUser, setEditingUser, setIsUserModalOpen, handleDeleteUser }) => {
  return (
    <div className="animate-in fade-in max-w-6xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-8">
        <SectionHeader title="User Management" subtitle="Quản lý tài khoản người dùng trong hệ thống" />
        <button onClick={() => { setEditingUser(null); setIsUserModalOpen(true); }} className="px-6 py-3 bg-[#102d62] text-white rounded-xl font-bold hover:bg-blue-900 shadow-lg flex items-center gap-2"><PlusCircle size={20} /> Thêm Tài Khoản</button>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-[#102d62] uppercase tracking-wide">
            <tr><th className="px-6 py-4 text-left">Tên</th><th className="px-6 py-4 text-left">Email</th><th className="px-6 py-4 text-left">Vai trò</th><th className="px-6 py-4 text-left">Brand</th><th className="px-6 py-4 text-right">Thao tác</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.filter(u => currentUser.role === 'admin' || u.role !== 'admin').map(u => {
              // Logic for Brand Owner viewing creators
              if (currentUser.role === 'brand_owner' && u.role === 'content_creator') {
                const hasSharedBrand = u.assignedBrandIds?.some(id => currentUser.ownedBrandIds?.includes(id));
                if (!hasSharedBrand) return null;
              }
              const brandsList = (u.role === 'brand_owner' ? u.ownedBrandIds : u.assignedBrandIds)?.map(id => brands.find(b => b.id === id)?.name).filter(Boolean).join(', ') || '-';
              return (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-bold text-[#102d62]">{u.name || u.displayName || u.email}</td>
                  <td className="px-6 py-4 text-slate-600">{u.email}</td>
                  <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : u.role === 'brand_owner' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>{u.role.replace('_', ' ')}</span></td>
                  <td className="px-6 py-4 text-slate-600 max-w-xs truncate">{brandsList}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setEditingUser(u); setIsUserModalOpen(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit3 size={18} /></button>
                      <button onClick={() => handleDeleteUser(u.id!)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersTab;
