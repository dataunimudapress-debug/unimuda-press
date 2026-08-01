import React, { useState } from 'react';
import { Transaction, NavigationTab } from '../types';
import { MONTHLY_TREND_DATA_2026, MONTHLY_TREND_DATA_2025, MONTHLY_TREND_DATA_2024 } from '../data/initialData';

interface DashboardViewProps {
  transactions: Transaction[];
  onNavigateTab: (tab: NavigationTab) => void;
  onOpenImageModal: (imageUrl: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  transactions,
  onNavigateTab,
  onOpenImageModal,
}) => {
  const [selectedYear, setSelectedYear] = useState<'2026' | '2025' | '2024'>('2026');

  const chartData =
    selectedYear === '2026'
      ? MONTHLY_TREND_DATA_2026
      : selectedYear === '2025'
      ? MONTHLY_TREND_DATA_2025
      : MONTHLY_TREND_DATA_2024;

  // Calculate live summary figures
  const totalRevenueMonth = transactions.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const todayRevenue = 4250000;
  const unpaidCount = transactions.filter(t => t.status === 'Belum Lunas' || t.status === 'DP (50%)').length + 11;

  const formatRupiah = (amount: number) => {
    return 'Rp ' + amount.toLocaleString('id-ID');
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Produksi':
        return 'bg-[#ffd600]/30 text-[#000000] font-bold';
      case 'Selesai':
      case 'Lunas':
        return 'bg-[#e1e3e4] text-[#414754] font-bold';
      case 'Belum Lunas':
        return 'bg-[#ffdad6] text-[#93000a] font-bold';
      default:
        return 'bg-[#edeeef] text-[#191c1d] font-bold';
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Header & Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-extrabold text-[#191c1d] tracking-tight">
            Dashboard Overview
          </h2>
          <p className="text-sm text-[#414754] mt-1">
            Selamat datang kembali, Admin. Berikut ringkasan operasional hari ini.
          </p>
        </div>
        <button
          onClick={() => onNavigateTab('new-transaction')}
          className="bg-[#0059bb] hover:bg-[#004493] text-white font-bold px-6 py-3 rounded-full flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-98 cursor-pointer shrink-0"
        >
          <span className="material-symbols-outlined text-xl">add</span>
          <span>Input Transaksi Baru</span>
        </button>
      </div>

      {/* Summary Cards Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Penghasilan Hari Ini */}
        <div className="tonal-card p-6 rounded-2xl border-l-4 border-l-[#0059bb] shadow-2xs">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-bold text-[#414754] uppercase tracking-wider">
              Penghasilan Hari Ini
            </p>
            <span className="material-symbols-outlined text-[#0059bb] bg-[#d8e2ff] p-2 rounded-xl">
              payments
            </span>
          </div>
          <h3 className="text-2xl lg:text-3xl font-bold text-[#191c1d] mt-1">
            {formatRupiah(todayRevenue)}
          </h3>
          <p className="text-xs font-medium text-emerald-600 flex items-center gap-1 mt-3">
            <span className="material-symbols-outlined text-base">trending_up</span>
            <span>+12.5% dari kemarin</span>
          </p>
        </div>

        {/* Card 2: Penghasilan Bulan Ini */}
        <div className="tonal-card p-6 rounded-2xl border-l-4 border-l-[#ffd600] shadow-2xs">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-bold text-[#414754] uppercase tracking-wider">
              Penghasilan Bulan Ini
            </p>
            <span className="material-symbols-outlined text-black bg-[#ffd600] p-2 rounded-xl">
              account_balance_wallet
            </span>
          </div>
          <h3 className="text-2xl lg:text-3xl font-bold text-[#191c1d] mt-1">
            {formatRupiah(totalRevenueMonth > 120000000 ? totalRevenueMonth : 128400000)}
          </h3>
          <p className="text-xs font-medium text-blue-600 flex items-center gap-1 mt-3">
            <span className="material-symbols-outlined text-base">trending_up</span>
            <span>+8.2% target bulanan</span>
          </p>
        </div>

        {/* Card 3: Transaksi Belum Lunas */}
        <div className="tonal-card p-6 rounded-2xl border-l-4 border-l-[#800000] shadow-2xs">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-bold text-[#414754] uppercase tracking-wider">
              Transaksi Belum Lunas
            </p>
            <span className="material-symbols-outlined text-white bg-[#800000] p-2 rounded-xl">
              pending_actions
            </span>
          </div>
          <h3 className="text-2xl lg:text-3xl font-bold text-[#191c1d] mt-1">
            {unpaidCount} Order
          </h3>
          <p className="text-xs font-medium text-red-600 flex items-center gap-1 mt-3">
            <span className="material-symbols-outlined text-base">warning</span>
            <span>3 Melewati tenggat</span>
          </p>
        </div>
      </div>

      {/* Charts & Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income Bar Chart */}
        <div className="lg:col-span-2 tonal-card p-6 rounded-2xl shadow-2xs">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h4 className="font-bold text-lg text-[#191c1d]">Monthly Income Trends</h4>
              <p className="text-xs text-gray-500">Statistik pendapatan cetak harian dan bulanan</p>
            </div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value as '2026' | '2025' | '2024')}
              className="bg-[#edeeef] border-none text-xs font-semibold rounded-lg px-3 py-2 outline-none cursor-pointer focus:ring-2 focus:ring-[#0059bb]"
            >
              <option value="2026">Tahun 2026 (Terbaru)</option>
              <option value="2025">Tahun 2025</option>
              <option value="2024">Tahun 2024</option>
            </select>
          </div>

          <div className="h-64 w-full flex items-end gap-2 md:gap-3 px-2 pt-6">
            {chartData.map((item) => (
              <div
                key={item.month}
                className="flex-1 bg-[#d8e2ff] hover:bg-[#0059bb] transition-all rounded-t-lg relative group cursor-pointer"
                style={{ height: `${item.percentageHeight}%` }}
              >
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-[#2e3132] text-white text-[11px] font-semibold py-1 px-2 rounded-md transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-md">
                  {item.month}: Rp {(item.income / 1000000).toFixed(1)}M
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between mt-4 text-[11px] text-[#414754] font-bold uppercase tracking-wider px-1">
            <span>Jan</span>
            <span>Mar</span>
            <span>Mei</span>
            <span>Jul</span>
            <span>Sep</span>
            <span>Des</span>
          </div>
        </div>

        {/* Order Breakdown */}
        <div className="tonal-card p-6 rounded-2xl shadow-2xs flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-lg text-[#191c1d] mb-5">Order Breakdown</h4>
            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-[#191c1d]">Spanduk</span>
                  <span className="text-[#0059bb]">45%</span>
                </div>
                <div className="w-full bg-[#e7e8e9] h-3 rounded-full overflow-hidden">
                  <div className="bg-[#0059bb] h-full rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-[#191c1d]">Banner (X/Y)</span>
                  <span className="text-[#d9a000]">30%</span>
                </div>
                <div className="w-full bg-[#e7e8e9] h-3 rounded-full overflow-hidden">
                  <div className="bg-[#ffd600] h-full rounded-full" style={{ width: '30%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-[#191c1d]">Baliho</span>
                  <span className="text-[#800000]">25%</span>
                </div>
                <div className="w-full bg-[#e7e8e9] h-3 rounded-full overflow-hidden">
                  <div className="bg-[#800000] h-full rounded-full" style={{ width: '25%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#e1e3e4] bg-[#ffd600]/10 p-3.5 rounded-xl">
            <p className="text-xs text-[#191c1d] leading-relaxed">
              <strong>Insight:</strong> Pesanan spanduk meningkat 15% pada minggu ini karena musim promosi sekolah & penerimaan mahasiswa baru.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="tonal-card rounded-2xl overflow-hidden shadow-2xs">
        <div className="px-6 py-4 bg-[#f3f4f5] flex justify-between items-center border-b border-[#e1e3e4]">
          <h4 className="font-bold text-lg text-[#191c1d]">Transaksi Terbaru</h4>
          <button
            onClick={() => onNavigateTab('history')}
            className="text-[#0059bb] font-bold text-xs hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>Lihat Semua</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-[#414754] font-bold text-xs border-b border-[#e1e3e4] uppercase tracking-wider">
                <th className="px-6 py-4">ORDER ID</th>
                <th className="px-6 py-4">PELANGGAN</th>
                <th className="px-6 py-4">TIPE ORDER</th>
                <th className="px-6 py-4">TOTAL</th>
                <th className="px-6 py-4">STATUS</th>
                <th className="px-6 py-4 text-right">DESAIN</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-[#e1e3e4]">
              {transactions.slice(0, 5).map((t) => (
                <tr key={t.id} className="hover:bg-[#f3f4f5] transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-[#0059bb]">{t.orderId}</td>
                  <td className="px-6 py-4 font-semibold text-[#191c1d]">{t.customerName}</td>
                  <td className="px-6 py-4 text-[#414754]">{t.orderType}</td>
                  <td className="px-6 py-4 font-mono font-bold">{formatRupiah(t.totalAmount)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[11px] uppercase tracking-wider ${getStatusBadgeClass(t.status)}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {t.imageUrl ? (
                      <button
                        onClick={() => onOpenImageModal(t.imageUrl)}
                        className="inline-flex items-center gap-1 text-xs text-[#0059bb] font-semibold hover:underline"
                      >
                        <span className="material-symbols-outlined text-base">visibility</span>
                        <span>Lihat</span>
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
