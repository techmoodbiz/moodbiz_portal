
import React, { useEffect, useState } from 'react';
import { PenTool, Activity, Building2, Zap, Users, TrendingUp, ShieldCheck } from 'lucide-react';
import { User, Brand, Generation, Auditor } from '../../types';
import { CORE_VALUES } from '../../constants';
import { StatCard, FeatureCard, QuickActionCard, SectionHeader, SkeletonCard, ActivityItem } from '../UIComponents';
import { db } from '../../firebase';

interface DashboardTabProps {
  currentUser: User;
  showLoading: boolean;
  availableBrands: Brand[];
  setActiveTab: (tab: string) => void;
  generations: Generation[];
  auditors: Auditor[];
}

const DashboardTab: React.FC<DashboardTabProps> = ({ 
  currentUser, 
  showLoading, 
  availableBrands, 
  setActiveTab, 
  generations, 
  auditors 
}) => {
  // State lưu trữ số liệu thống kê thực tế
  const [stats, setStats] = useState([
    { label: 'Brands', value: '0', icon: Building2 },
    { label: 'Generations', value: '0', icon: Zap },
    { label: 'Audits', value: '0', icon: ShieldCheck },
    { label: 'Users', value: '0', icon: Users },
  ]);

  // Effect lắng nghe dữ liệu từ Firestore
  useEffect(() => {
    // 1. Lắng nghe số lượng Brands
    const unsubBrands = db.collection('brands').onSnapshot(snap => {
      setStats(prev => {
        const newStats = [...prev];
        newStats[0].value = snap.size.toString();
        return newStats;
      });
    });

    // 2. Lắng nghe số lượng Generations
    const unsubGen = db.collection('generations').onSnapshot(snap => {
      setStats(prev => {
        const newStats = [...prev];
        newStats[1].value = snap.size.toString();
        return newStats;
      });
    });

    // 3. Lắng nghe số lượng Auditors
    const unsubAudit = db.collection('auditors').onSnapshot(snap => {
      setStats(prev => {
        const newStats = [...prev];
        newStats[2].value = snap.size.toString();
        return newStats;
      });
    });

    // 4. Lắng nghe số lượng Users - CHỈ DÀNH CHO ADMIN HOẶC BRAND OWNER
    let unsubUsers = () => {};
    if (currentUser.role === 'admin' || currentUser.role === 'brand_owner') {
      unsubUsers = db.collection('users').onSnapshot(snap => {
        setStats(prev => {
          const newStats = [...prev];
          newStats[3].value = snap.size.toString();
          return newStats;
        });
      }, (error) => {
        console.warn("User stats permission check failed:", error.message);
      });
    }

    // Cleanup listeners khi component unmount
    return () => {
      unsubBrands();
      unsubGen();
      unsubAudit();
      unsubUsers();
    };
  }, [currentUser.role]);

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4">
      {showLoading ? <SkeletonCard className="h-64" /> : (
        <div className="bg-[#102d62] rounded-3xl p-8 md:p-12 shadow-xl relative overflow-hidden text-white">
           <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#01ccff] rounded-full mix-blend-overlay opacity-20 blur-[100px] -mr-32 -mt-32 pointer-events-none"></div>
           <div className="relative z-10 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-blue-200 text-xs font-bold mb-6">
                <span className="w-2 h-2 rounded-full bg-[#01ccff] animate-pulse"></span>
                DIGITAL GROWTH PARTNER
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold leading-tight mb-6">
                Xin chào, <span className="text-[#01ccff]">{currentUser.name || currentUser.displayName || currentUser.email}</span>
              </h1>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                <div><p className="text-blue-300 text-xs uppercase font-bold mb-1">Vai trò</p><p className="text-xl font-bold capitalize">{currentUser.role.replace('_', ' ')}</p></div>
                <div><p className="text-blue-300 text-xs uppercase font-bold mb-1">Brands Available</p><p className="text-xl font-bold">{availableBrands.length}</p></div>
              </div>
           </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <QuickActionCard title="Tạo Nội Dung Mới" desc="Sử dụng AI để viết bài cho Social, Blog, Email..." icon={PenTool} onClick={() => setActiveTab('generator')} color="blue" />
        <QuickActionCard title="Kiểm Tra Brand Voice" desc="Audit nội dung để đảm bảo chuẩn giọng văn thương hiệu" icon={Activity} onClick={() => setActiveTab('auditor')} color="cyan" />
      </div>

      {/* Stats & Values - Updated with Real Data */}
      <div>
        <SectionHeader title="Con Số Ấn Tượng" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, idx) => {
             // Ẩn Users stat nếu không phải admin/owner
             if (stat.label === 'Users' && !(currentUser.role === 'admin' || currentUser.role === 'brand_owner')) return null;
             
             return (
               <StatCard key={idx} label={stat.label} value={stat.value} delay={idx * 100} icon={stat.icon} />
             );
          })}
        </div>
      </div>

      {/* Core Values */}
      <div>
        <SectionHeader title="Giá Trị Cốt Lõi" />
        <div className="grid md:grid-cols-4 gap-6">
          {CORE_VALUES.map((val, idx) => (
            <FeatureCard key={idx} {...val} delay={idx * 150} />
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      {(generations.length > 0 || auditors.length > 0) && (
        <div>
           <SectionHeader title="Hoạt động gần đây" subtitle="Các tác vụ AI vừa thực hiện" />
           <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
              <div className="space-y-4">
                {generations.slice(0, 3).map(g => (
                  <ActivityItem key={g.id} type="generator" title={g.input_data.topic} subtitle={g.input_data.platform} time={g.timestamp} />
                ))}
                {auditors.slice(0, 2).map(a => (
                  <ActivityItem key={a.id} type="auditor" title="Audit Content" subtitle={a.brand_name || 'Brand'} time={a.timestamp} />
                ))}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default DashboardTab;
