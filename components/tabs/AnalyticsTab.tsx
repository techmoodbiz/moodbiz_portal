
import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, AlertTriangle, BarChart2, ShieldAlert } from 'lucide-react';
import { Brand } from '../../types';
import { SectionHeader, KPIStatCard, BrandSelector, SimpleBarChart } from '../UIComponents';
import { db } from '../../firebase';

interface AnalyticsTabProps {
  availableBrands: Brand[];
}

interface BrandAnalyticsData {
  total_audits: number;
  issue_counts: Record<string, number>;
}

const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ availableBrands }) => {
  const [selectedAnalyticsBrand, setSelectedAnalyticsBrand] = useState('all');
  const [analyticsData, setAnalyticsData] = useState<BrandAnalyticsData>({ total_audits: 0, issue_counts: {} });
  const [errorStats, setErrorStats] = useState<{type: string, count: number}[]>([]);
  const [permissionError, setPermissionError] = useState(false);

  // Fetch Analytics from Firestore 'brand_analytics' collection
  useEffect(() => {
    let unsubscribe: () => void;
    setPermissionError(false);

    const aggregateData = (docs: any[]) => {
      let total = 0;
      const counts: Record<string, number> = {};

      docs.forEach(doc => {
        const data = doc.data() as BrandAnalyticsData;
        total += (data.total_audits || 0);
        if (data.issue_counts) {
          Object.entries(data.issue_counts).forEach(([key, val]) => {
            // Fix: Cast val to any or number to satisfy arithmetic operation requirements if inference fails
            counts[key] = (counts[key] || 0) + (val as number);
          });
        }
      });
      return { total_audits: total, issue_counts: counts };
    };

    const handleError = (error: any) => {
      console.error("Lỗi khi tải dữ liệu Analytics:", error);
      if (error?.code === 'permission-denied') {
        setPermissionError(true);
      }
    };

    if (selectedAnalyticsBrand === 'all') {
      unsubscribe = db.collection('brand_analytics').onSnapshot(snapshot => {
        const relevantDocs = snapshot.docs.filter(doc => availableBrands.some(b => b.id === doc.id));
        setAnalyticsData(aggregateData(relevantDocs));
      }, handleError);
    } else {
      unsubscribe = db.collection('brand_analytics').doc(selectedAnalyticsBrand).onSnapshot(doc => {
        if (doc.exists) {
          const data = doc.data() as BrandAnalyticsData;
          setAnalyticsData({
            total_audits: data.total_audits || 0,
            issue_counts: data.issue_counts || {}
          });
        } else {
          setAnalyticsData({ total_audits: 0, issue_counts: {} });
        }
      }, handleError);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [selectedAnalyticsBrand, availableBrands]);

  // Process data for Chart
  useEffect(() => {
    const stats = Object.entries(analyticsData.issue_counts)
      // Fix: Explicitly cast count to number to ensure sort arithmetic works correctly
      .map(([type, count]) => ({ type, count: count as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    setErrorStats(stats);
  }, [analyticsData]);

  if (permissionError) {
    return (
      <div className="animate-in fade-in max-w-6xl mx-auto pb-20 pt-10 text-center">
        <div className="bg-red-50 inline-block p-6 rounded-full text-red-500 mb-4">
          <ShieldAlert size={48} />
        </div>
        <h3 className="text-xl font-bold text-[#102d62]">Không có quyền truy cập</h3>
        <p className="text-slate-500 mt-2">Bạn không có quyền xem dữ liệu thống kê này. Vui lòng kiểm tra lại Rules hoặc liên hệ Admin.</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in max-w-6xl mx-auto pb-20">
      <SectionHeader title="Thống Kê Lỗi Auditor" subtitle="Các lỗi phổ biến phát hiện từ hệ thống (trừ lỗi nhỏ)" />
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <KPIStatCard title="Tổng số Audit" value={analyticsData.total_audits} icon={Activity} color="blue" />
        <KPIStatCard title="Lỗi phổ biến nhất" value={errorStats[0]?.type || "N/A"} icon={AlertTriangle} color="amber" subValue={errorStats[0] ? `${errorStats[0].count} lần` : ''} />
        <KPIStatCard title="Độ phủ dữ liệu" value={selectedAnalyticsBrand === 'all' ? availableBrands.length : 1} icon={TrendingUp} color="emerald" subValue="Brands" />
      </div>
      
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-8">
        <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-[#102d62] flex items-center gap-2"><BarChart2 className="text-[#01ccff]"/> Phân bố loại lỗi</h3>
            <div className="w-64">
              <BrandSelector 
                availableBrands={availableBrands} 
                selectedBrandId={selectedAnalyticsBrand} 
                onChange={setSelectedAnalyticsBrand} 
                showAllOption={true} 
              />
            </div>
        </div>
        <SimpleBarChart data={errorStats} />
      </div>
    </div>
  );
};

export default AnalyticsTab;
