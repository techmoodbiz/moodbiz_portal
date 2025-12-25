
import React, { useState, useMemo } from 'react';
import { Activity, ShieldAlert, Languages, BrainCircuit, Award, ShoppingBag, BarChart2 } from 'lucide-react';
import { Brand, Auditor } from '../../types';
import { SectionHeader, BrandSelector } from '../UIComponents';
import { AUDIT_CATEGORIES } from '../../constants';

interface AnalyticsTabProps {
  availableBrands: Brand[];
  auditors: Auditor[];
}

const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ availableBrands, auditors }) => {
  const [selectedAnalyticsBrand, setSelectedAnalyticsBrand] = useState('all');

  const stats = useMemo(() => {
    const filtered = auditors.filter(a => selectedAnalyticsBrand === 'all' || a.brand_id === selectedAnalyticsBrand);
    const totals = { language: 0, ai_logic: 0, brand: 0, product: 0 };

    filtered.forEach(a => {
      const issues = a.output_data?.identified_issues || [];
      issues.forEach((issue: any) => {
        const cat = (issue.category || '').toLowerCase();
        if (cat.includes('language')) totals.language++;
        else if (cat.includes('logic')) totals.ai_logic++;
        else if (cat.includes('brand')) totals.brand++;
        else if (cat.includes('product')) totals.product++;
      });
    });
    return { totals, count: filtered.length };
  }, [auditors, selectedAnalyticsBrand]);

  const CategoryCard = ({ id, count }: { id: keyof typeof AUDIT_CATEGORIES, count: number }) => {
    const config = AUDIT_CATEGORIES[id];
    const Icon = config.icon;
    const percentage = stats.count > 0 ? Math.min(100, (count / (stats.count * 2)) * 100) : 0;

    return (
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium flex flex-col group hover:-translate-y-1 transition-all duration-300">
        <div className="flex justify-between items-start mb-6">
          <div className={`p-4 rounded-2xl ${config.bg} ${config.color} group-hover:scale-110 transition-transform`}>
            <Icon size={28} />
          </div>
          <div className="text-right">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tỉ lệ vi phạm</span>
            <div className="text-2xl font-black text-[#102d62]">{count} <span className="text-xs text-slate-300">issues</span></div>
          </div>
        </div>
        <h4 className="text-lg font-black text-[#102d62] uppercase tracking-tight mb-2">{config.label}</h4>
        <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6">{config.description}</p>
        <div className="mt-auto">
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full transition-all duration-1000 ${config.bg.replace('bg-', 'bg-').replace('-50', '-500')}`} style={{ width: `${percentage}%`, backgroundColor: 'currentColor' }}></div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-in fade-in space-y-10 pb-20">
      <SectionHeader title="Auditor Analytics" subtitle="Phân tích chất lượng nội dung dựa trên 4 khối tiêu chuẩn MOODBIZ.">
        <BrandSelector availableBrands={availableBrands} selectedBrandId={selectedAnalyticsBrand} onChange={setSelectedAnalyticsBrand} showAllOption={true} className="min-w-[280px]" />
      </SectionHeader>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <CategoryCard id="language" count={stats.totals.language} />
        <CategoryCard id="ai_logic" count={stats.totals.ai_logic} />
        <CategoryCard id="brand" count={stats.totals.brand} />
        <CategoryCard id="product" count={stats.totals.product} />
      </div>

      <div className="bg-[#102d62] rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#01ccff] rounded-full blur-[120px] opacity-10 -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl">
            <h3 className="text-2xl font-black uppercase tracking-tight mb-4">Tổng quan rủi ro hệ thống</h3>
            <p className="text-blue-100/70 font-medium leading-relaxed">
              Dữ liệu này được sử dụng để tối ưu hóa AI Generator. Các lỗi thường gặp trong quá khứ sẽ trở thành "Negative Knowledge" giúp AI tự động né tránh trong các lượt khởi tạo sau.
            </p>
          </div>
          <div className="flex gap-10">
            <div className="text-center">
              <div className="text-5xl font-black text-[#01ccff] mb-2">{stats.count}</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-blue-300">Tổng lượt Audit</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-black text-white mb-2">{stats.totals.language + stats.totals.ai_logic + stats.totals.brand + stats.totals.product}</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-blue-300">Tổng lỗi phát hiện</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;
