
import React from 'react';
import { PenTool, Activity, Building2, Zap, Users, TrendingUp } from 'lucide-react';
import { User, Brand, Generation, Auditor } from '../../types';
import { COMPANY_STATS, CORE_VALUES } from '../../constants';
import { StatCard, FeatureCard, QuickActionCard, SectionHeader, SkeletonCard, ActivityItem } from '../UIComponents';

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

      {/* Stats & Values */}
      <div>
        <SectionHeader title="Con Số Ấn Tượng" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {COMPANY_STATS.map((stat, idx) => (
            <StatCard key={idx} {...stat} delay={idx * 100} icon={[Building2, Zap, Users, TrendingUp][idx]} />
          ))}
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
