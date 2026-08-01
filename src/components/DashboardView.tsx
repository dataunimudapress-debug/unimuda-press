import React, { useState, useMemo } from 'react';
import { Transaction, NavigationTab, PaymentStatus } from '../types';
import {
  MONTHLY_TREND_DATA_2026,
  MONTHLY_TREND_DATA_2025,
  MONTHLY_TREND_DATA_2024,
  MONTHLY_TREND_DATA_2023,
} from '../data/initialData';

interface DashboardViewProps {
  transactions: Transaction[];
  onNavigateTab: (tab: NavigationTab) => void;
  onOpenImageModal: (imageUrl: string) => void;
  onUpdateStatus?: (id: string, newStatus: PaymentStatus) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  transactions,
  onNavigateTab,
  onOpenImageModal,
  onUpdateStatus,
}) => {
  const [selectedYear, setSelectedYear] = useState<'2026' | '2025' | '2024' | '2023'>('2026');
  
  // Interactive filters triggered by clicking Cards, Chart, or Breakdown
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string | null>(null);

  // Modals for deep detail inspection
  const [activeModal, setActiveModal] = useState<'today' | 'month' | 'unpaid' | 'detail' | null>(null);
  const [selectedTxDetail, setSelectedTxDetail] = useState<Transaction | null>(null);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Formatters
  const formatRupiah = (amount: number) => {
    return 'Rp ' + amount.toLocaleString('id-ID');
  };

  const getStatusBadgeClass = (status: PaymentStatus) => {
    switch (status) {
      case 'Lunas':
      case 'Selesai':
        return 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold';
      case 'Produksi':
        return 'bg-amber-100 text-amber-900 border border-amber-300 font-bold';
      case 'DP (50%)':
        return 'bg-blue-100 text-blue-900 border border-blue-300 font-bold';
      case 'Belum Lunas':
      default:
        return 'bg-red-100 text-red-800 border border-red-300 font-bold';
    }
  };

  // 1. DYNAMIC CALCULATIONS FOR SUMMARY CARDS (100% synchronized with transactions)
  const todayTransactions = useMemo(() => {
    return transactions.filter((t) => t.date === todayStr);
  }, [transactions, todayStr]);

  const displayTodayRevenue = useMemo(() => {
    return todayTransactions.reduce((acc, t) => acc + t.totalAmount, 0);
  }, [todayTransactions]);

  const currentYearNum = new Date().getFullYear();
  const currentMonthNum = new Date().getMonth() + 1;
  const currentYearMonthPrefix = `${currentYearNum}-${String(currentMonthNum).padStart(2, '0')}`;

  const currentMonthTransactions = useMemo(() => {
    return transactions.filter((t) => t.date && t.date.startsWith(currentYearMonthPrefix));
  }, [transactions, currentYearMonthPrefix]);

  const displayMonthRevenue = useMemo(() => {
    return currentMonthTransactions.reduce((acc, t) => acc + t.totalAmount, 0);
  }, [currentMonthTransactions]);

  const monthlyTarget = 15000000; // Target Rp 15.000.000
  const monthTargetPercentage = Math.min(
    100,
    Math.round((displayMonthRevenue / Math.max(1, monthlyTarget)) * 100)
  );

  const unpaidTransactions = useMemo(() => {
    return transactions.filter((t) => t.status === 'Belum Lunas' || t.status === 'DP (50%)');
  }, [transactions]);

  const unpaidTotalAmount = useMemo(() => {
    return unpaidTransactions.reduce((acc, t) => acc + t.totalAmount, 0);
  }, [unpaidTransactions]);

  // 2. DYNAMIC MONTHLY CHART DATA (Synchronized strictly with transactions: 0 = Down, >0 = Up)
  const chartData = useMemo(() => {
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES'];

    // Collect totals from real transactions for selected year
    const realMonthTotals: { [monthCode: string]: number } = {};
    transactions.forEach((t) => {
      if (!t.date) return;
      const [yr, moStr] = t.date.split('-');
      if (yr === selectedYear) {
        const mIdx = parseInt(moStr, 10) - 1;
        if (mIdx >= 0 && mIdx < 12) {
          const code = monthNames[mIdx];
          realMonthTotals[code] = (realMonthTotals[code] || 0) + t.totalAmount;
        }
      }
    });

    const months = monthNames.map((month) => {
      const income = realMonthTotals[month] || 0;
      return { month, income };
    });

    const maxIncome = Math.max(...months.map((m) => m.income), 0);

    return months.map((m) => {
      if (m.income === 0) {
        return {
          month: m.month,
          income: 0,
          percentageHeight: 3, // Flat bar down when 0 transactions
        };
      }
      // Proportional bar height (range 20% to 100%) when transactions exist
      const ratio = maxIncome > 0 ? m.income / maxIncome : 0;
      const height = Math.max(20, Math.round(ratio * 100));
      return {
        month: m.month,
        income: m.income,
        percentageHeight: height,
      };
    });
  }, [transactions, selectedYear]);

  // 3. DYNAMIC ORDER BREAKDOWN CALCULATION - FOKUS 3 ASPEK: SPANDUK, BANNER, BALIHO
  const categoryBreakdown = useMemo(() => {
    const counts: Record<'Spanduk' | 'Banner' | 'Baliho', number> = {
      Spanduk: 0,
      Banner: 0,
      Baliho: 0,
    };

    transactions.forEach((t) => {
      const type = (t.orderType || '').toLowerCase();
      if (type.includes('spanduk')) {
        counts['Spanduk']++;
      } else if (type.includes('baliho')) {
        counts['Baliho']++;
      } else {
        // Banner (Roll Up Banner, X-Banner, or other banner printings)
        counts['Banner']++;
      }
    });

    const totalOrders = Math.max(1, transactions.length);

    const items = (['Spanduk', 'Banner', 'Baliho'] as const).map((cat) => {
      const cnt = counts[cat];
      const pct = Math.round((cnt / totalOrders) * 100);
      return {
        category: cat,
        count: cnt,
        percentage: pct,
      };
    });

    items.sort((a, b) => b.count - a.count);

    return {
      items,
      totalOrders: transactions.length,
      topCategory: items[0] || { category: 'Spanduk', percentage: 50 },
    };
  }, [transactions]);

  // 4. FILTERED TRANSACTIONS FOR RECENT TABLE
  const filteredTableTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Filter by Date (e.g. Today)
      if (selectedDateFilter && t.date !== selectedDateFilter) {
        return false;
      }

      // Filter by Month
      if (selectedMonthFilter) {
        const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES'];
        const mIdx = monthNames.indexOf(selectedMonthFilter.toUpperCase());
        if (mIdx !== -1 && t.date) {
          const [, mStr] = t.date.split('-');
          if (parseInt(mStr, 10) !== mIdx + 1) return false;
        }
      }

      // Filter by Category (Focus: Spanduk, Banner, Baliho)
      if (selectedCategoryFilter) {
        const cat = selectedCategoryFilter.toLowerCase();
        const type = (t.orderType || '').toLowerCase();
        if (cat === 'spanduk') {
          if (!type.includes('spanduk')) return false;
        } else if (cat === 'baliho') {
          if (!type.includes('baliho')) return false;
        } else if (cat === 'banner') {
          if (type.includes('spanduk') || type.includes('baliho')) return false;
        } else if (!type.includes(cat)) {
          return false;
        }
      }

      // Filter by Status
      if (selectedStatusFilter) {
        if (selectedStatusFilter === 'Belum Lunas') {
          if (t.status !== 'Belum Lunas' && t.status !== 'DP (50%)') return false;
        } else if (t.status !== selectedStatusFilter) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, selectedDateFilter, selectedMonthFilter, selectedCategoryFilter, selectedStatusFilter]);

  const clearAllFilters = () => {
    setSelectedDateFilter(null);
    setSelectedMonthFilter(null);
    setSelectedCategoryFilter(null);
    setSelectedStatusFilter(null);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Header & Quick Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-extrabold text-[#191c1d] tracking-tight">
            Dashboard Overview
          </h2>
          <p className="text-sm text-[#414754] mt-1">
            Portal Managemen Unimuda Press — Ringkasan Realtime Pendapatan & Pesanan.
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

      {/* 1. INTERACTIVE SUMMARY CARDS BENTO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Penghasilan Hari Ini */}
        <div
          onClick={() => {
            if (selectedDateFilter === todayStr) {
              setSelectedDateFilter(null);
            } else {
              setSelectedDateFilter(todayStr);
            }
          }}
          className={`tonal-card p-6 rounded-2xl border-l-4 border-l-[#0059bb] shadow-2xs hover:shadow-md transition-all cursor-pointer group relative ${
            selectedDateFilter === todayStr ? 'ring-2 ring-[#0059bb] bg-blue-50/20' : ''
          }`}
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-xs font-bold text-[#414754] uppercase tracking-wider">
                Penghasilan Hari Ini
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {todayTransactions.length} transaksi baru hari ini
              </p>
            </div>
            <span className="material-symbols-outlined text-[#0059bb] bg-[#d8e2ff] p-2.5 rounded-xl group-hover:scale-110 transition-transform">
              payments
            </span>
          </div>

          <h3 className="text-2xl lg:text-3xl font-extrabold text-[#191c1d] mt-2">
            {formatRupiah(displayTodayRevenue)}
          </h3>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
            <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <span className="material-symbols-outlined text-base">filter_alt</span>
              <span>
                {selectedDateFilter === todayStr ? 'Filter Hari Ini Aktif' : 'Klik untuk Filter'}
              </span>
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveModal('today');
              }}
              className="text-xs font-bold text-[#0059bb] hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>Detail</span>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Card 2: Penghasilan Bulan Ini */}
        <div
          onClick={() => {
            const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES'];
            const curMonthCode = monthNames[new Date().getMonth()];
            if (selectedMonthFilter === curMonthCode) {
              setSelectedMonthFilter(null);
            } else {
              setSelectedMonthFilter(curMonthCode);
            }
          }}
          className={`tonal-card p-6 rounded-2xl border-l-4 border-l-[#ffd600] shadow-2xs hover:shadow-md transition-all cursor-pointer group relative ${
            selectedMonthFilter ? 'ring-2 ring-[#ffd600] bg-yellow-50/20' : ''
          }`}
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-xs font-bold text-[#414754] uppercase tracking-wider">
                Penghasilan Bulan Ini
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Target: {formatRupiah(monthlyTarget)}
              </p>
            </div>
            <span className="material-symbols-outlined text-black bg-[#ffd600] p-2.5 rounded-xl group-hover:scale-110 transition-transform">
              account_balance_wallet
            </span>
          </div>

          <h3 className="text-2xl lg:text-3xl font-extrabold text-[#191c1d] mt-2">
            {formatRupiah(displayMonthRevenue)}
          </h3>

          {/* Progress Bar */}
          <div className="mt-3 space-y-1">
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#ffd600] h-full rounded-full transition-all duration-500"
                style={{ width: `${monthTargetPercentage}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] text-gray-600 font-semibold pt-1">
              <span className="text-blue-700 flex items-center gap-0.5">
                <span className="material-symbols-outlined text-xs">trending_up</span>
                <span>{monthTargetPercentage}% Target ({currentMonthTransactions.length} Order)</span>
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveModal('month');
                }}
                className="text-[#0059bb] hover:underline flex items-center gap-0.5 font-bold cursor-pointer"
              >
                <span>Rincian</span>
                <span className="material-symbols-outlined text-xs">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        {/* Card 3: Transaksi Belum Lunas */}
        <div
          onClick={() => {
            if (selectedStatusFilter === 'Belum Lunas') {
              setSelectedStatusFilter(null);
            } else {
              setSelectedStatusFilter('Belum Lunas');
            }
          }}
          className={`tonal-card p-6 rounded-2xl border-l-4 border-l-[#800000] shadow-2xs hover:shadow-md transition-all cursor-pointer group relative ${
            selectedStatusFilter === 'Belum Lunas' ? 'ring-2 ring-[#800000] bg-red-50/20' : ''
          }`}
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-xs font-bold text-[#414754] uppercase tracking-wider">
                Transaksi Belum Lunas
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Total Tertunda: {formatRupiah(unpaidTotalAmount)}
              </p>
            </div>
            <span className="material-symbols-outlined text-white bg-[#800000] p-2.5 rounded-xl group-hover:scale-110 transition-transform">
              pending_actions
            </span>
          </div>

          <h3 className="text-2xl lg:text-3xl font-extrabold text-[#191c1d] mt-2">
            {unpaidTransactions.length} Order
          </h3>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
            <p className="text-xs font-bold text-red-600 flex items-center gap-1">
              <span className="material-symbols-outlined text-base">warning</span>
              <span>
                {selectedStatusFilter === 'Belum Lunas' ? 'Filter Belum Lunas Aktif' : 'Klik untuk Filter'}
              </span>
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveModal('unpaid');
              }}
              className="text-xs font-bold text-[#800000] hover:underline flex items-center gap-0.5"
            >
              <span>Kelola</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. CHARTS & ORDER BREAKDOWN SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income Bar Chart */}
        <div className="lg:col-span-2 tonal-card p-6 rounded-2xl shadow-2xs space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
            <div>
              <h4 className="font-extrabold text-lg text-[#191c1d]">Monthly Income Trends</h4>
              <p className="text-xs text-gray-500">
                Klik pada batang bulan untuk memfilter transaksi per bulan
              </p>
            </div>

            <div className="flex items-center gap-2">
              {selectedMonthFilter && (
                <button
                  onClick={() => setSelectedMonthFilter(null)}
                  className="bg-blue-50 text-[#0059bb] hover:bg-blue-100 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Bulan: {selectedMonthFilter}</span>
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              )}

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value as '2026' | '2025' | '2024' | '2023')}
                className="bg-[#edeeef] border border-gray-300 text-xs font-bold rounded-lg px-3 py-2 outline-none cursor-pointer focus:ring-2 focus:ring-[#0059bb]"
              >
                <option value="2026">Tahun 2026 (Terbaru)</option>
                <option value="2025">Tahun 2025</option>
                <option value="2024">Tahun 2024</option>
                <option value="2023">Tahun 2023</option>
              </select>
            </div>
          </div>

          <div className="h-64 w-full flex items-end gap-2 md:gap-3 px-2 pt-8 pb-2 border-b border-gray-200">
            {chartData.map((item) => {
              const isSelected = selectedMonthFilter === item.month;
              const hasData = item.income > 0;
              return (
                <div
                  key={item.month}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedMonthFilter(null);
                    } else {
                      setSelectedMonthFilter(item.month);
                    }
                  }}
                  className={`flex-1 transition-all rounded-t-md relative group cursor-pointer ${
                    isSelected
                      ? 'bg-[#0059bb] ring-2 ring-offset-2 ring-[#0059bb] shadow-md'
                      : hasData
                      ? 'bg-[#0059bb] hover:bg-[#003d82]'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                  style={{ height: `${item.percentageHeight}%` }}
                >
                  {/* Tooltip */}
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-[#191c1d] text-white text-[11px] font-bold py-1 px-2.5 rounded-lg transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-lg">
                    {item.month}: {hasData ? formatRupiah(item.income) : 'Rp 0 (Belum ada transaksi)'}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between text-[11px] text-[#414754] font-bold uppercase tracking-wider px-1">
            {chartData.map((item) => (
              <span
                key={item.month}
                onClick={() => {
                  if (selectedMonthFilter === item.month) {
                    setSelectedMonthFilter(null);
                  } else {
                    setSelectedMonthFilter(item.month);
                  }
                }}
                className={`cursor-pointer hover:text-[#0059bb] transition-colors ${
                  selectedMonthFilter === item.month ? 'text-[#0059bb] font-extrabold underline' : ''
                }`}
              >
                {item.month}
              </span>
            ))}
          </div>
        </div>

        {/* 3. ORDER BREAKDOWN CARD */}
        <div className="tonal-card p-6 rounded-2xl shadow-2xs flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-extrabold text-lg text-[#191c1d]">Order Breakdown</h4>
              {selectedCategoryFilter && (
                <button
                  onClick={() => setSelectedCategoryFilter(null)}
                  className="text-[11px] font-bold text-[#0059bb] hover:underline"
                >
                  Reset Filter
                </button>
              )}
            </div>

            <div className="space-y-4">
              {categoryBreakdown.items.map((item) => {
                const isSelected =
                  selectedCategoryFilter?.toLowerCase() === item.category.toLowerCase();
                return (
                  <div
                    key={item.category}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedCategoryFilter(null);
                      } else {
                        setSelectedCategoryFilter(item.category);
                      }
                    }}
                    className={`p-2.5 rounded-xl transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-blue-50 border-[#0059bb] shadow-xs'
                        : 'bg-white border-transparent hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between text-xs font-bold mb-1.5">
                      <span className="text-[#191c1d] flex items-center gap-1.5">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            item.category === 'Spanduk'
                              ? 'bg-[#0059bb]'
                              : item.category === 'Banner'
                              ? 'bg-[#ffd600]'
                              : item.category === 'Baliho'
                              ? 'bg-[#800000]'
                              : 'bg-emerald-600'
                          }`}
                        />
                        <span>{item.category}</span>
                        <span className="text-[10px] text-gray-500 font-normal">
                          ({item.count} pesanan)
                        </span>
                      </span>
                      <span className="text-[#0059bb] font-extrabold">{item.percentage}%</span>
                    </div>

                    <div className="w-full bg-[#e7e8e9] h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          item.category === 'Spanduk'
                            ? 'bg-[#0059bb]'
                            : item.category === 'Banner'
                            ? 'bg-[#ffd600]'
                            : item.category === 'Baliho'
                            ? 'bg-[#800000]'
                            : 'bg-emerald-600'
                        }`}
                        style={{ width: `${Math.max(5, item.percentage)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-[#e1e3e4] bg-[#ffd600]/10 p-3.5 rounded-xl">
            <p className="text-xs text-[#191c1d] leading-relaxed">
              <strong>Insight Realtime:</strong> Kategori{' '}
              <span className="font-extrabold text-[#0059bb]">
                {categoryBreakdown.topCategory.category}
              </span>{' '}
              mendominasi dengan {categoryBreakdown.topCategory.percentage}% dari total{' '}
              {categoryBreakdown.totalOrders} transaksi yang tercatat.
            </p>
          </div>
        </div>
      </div>

      {/* 4. RECENT TRANSACTIONS TABLE & ACTIVE FILTERS */}
      <div className="tonal-card rounded-2xl overflow-hidden shadow-2xs space-y-0">
        <div className="px-6 py-4 bg-[#f3f4f5] flex flex-wrap justify-between items-center border-b border-[#e1e3e4] gap-3">
          <div className="flex items-center gap-3">
            <h4 className="font-extrabold text-lg text-[#191c1d]">Transaksi Terbaru</h4>

            {/* Active Filter Badges */}
            {(selectedDateFilter || selectedMonthFilter || selectedCategoryFilter || selectedStatusFilter) && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-gray-500 font-medium">Filter Aktif:</span>
                {selectedDateFilter && (
                  <span className="bg-[#0059bb] text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                    Hari Ini ({selectedDateFilter})
                    <button onClick={() => setSelectedDateFilter(null)} className="hover:opacity-80 cursor-pointer">
                      ✕
                    </button>
                  </span>
                )}
                {selectedMonthFilter && (
                  <span className="bg-[#0059bb] text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                    Bulan: {selectedMonthFilter}
                    <button onClick={() => setSelectedMonthFilter(null)} className="hover:opacity-80 cursor-pointer">
                      ✕
                    </button>
                  </span>
                )}
                {selectedCategoryFilter && (
                  <span className="bg-[#0059bb] text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                    Kategori: {selectedCategoryFilter}
                    <button onClick={() => setSelectedCategoryFilter(null)} className="hover:opacity-80">
                      ✕
                    </button>
                  </span>
                )}
                {selectedStatusFilter && (
                  <span className="bg-[#800000] text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                    Status: {selectedStatusFilter}
                    <button onClick={() => setSelectedStatusFilter(null)} className="hover:opacity-80">
                      ✕
                    </button>
                  </span>
                )}
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-red-600 font-bold hover:underline ml-1"
                >
                  Reset Semua
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigateTab('history')}
            className="text-[#0059bb] font-extrabold text-xs hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>Buka Seluruh Riwayat Transaksi</span>
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
                <th className="px-6 py-4">TANGGAL</th>
                <th className="px-6 py-4">TOTAL</th>
                <th className="px-6 py-4">STATUS PAYMENT</th>
                <th className="px-6 py-4 text-right">AKSI / DESAIN</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-[#e1e3e4]">
              {filteredTableTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500 text-xs">
                    Tidak ada transaksi yang sesuai dengan filter yang dipilih.{' '}
                    <button onClick={clearAllFilters} className="text-[#0059bb] font-bold underline ml-1">
                      Reset Filter
                    </button>
                  </td>
                </tr>
              ) : (
                filteredTableTransactions.slice(0, 8).map((t) => (
                  <tr key={t.id} className="hover:bg-[#f8f9fa] transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-[#0059bb]">{t.orderId}</td>
                    <td className="px-6 py-4 font-semibold text-[#191c1d]">
                      {t.customerName}
                      <span className="block text-[11px] text-gray-500 font-normal">
                        Category: {t.customerCategory}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[#414754]">
                      {t.orderType}
                      <span className="block text-[11px] text-gray-500">
                        {t.lengthMeters}m x {t.widthMeters}m (Qty: {t.qty})
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-600 font-medium">
                      {t.date || '2026-08-01'}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold">{formatRupiah(t.totalAmount)}</td>
                    <td className="px-6 py-4">
                      {onUpdateStatus ? (
                        <select
                          value={t.status}
                          onChange={(e) => onUpdateStatus(t.id, e.target.value as PaymentStatus)}
                          className={`text-xs px-3 py-1.5 rounded-full outline-none cursor-pointer border ${getStatusBadgeClass(
                            t.status
                          )}`}
                        >
                          <option value="Belum Lunas">Belum Lunas</option>
                          <option value="DP (50%)">DP (50%)</option>
                          <option value="Produksi">Produksi</option>
                          <option value="Selesai">Selesai</option>
                          <option value="Lunas">Lunas</option>
                        </select>
                      ) : (
                        <span
                          className={`px-3 py-1 rounded-full text-[11px] uppercase tracking-wider ${getStatusBadgeClass(
                            t.status
                          )}`}
                        >
                          {t.status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setSelectedTxDetail(t);
                          setActiveModal('detail');
                        }}
                        className="inline-flex items-center gap-1 text-xs text-gray-700 font-bold bg-gray-100 hover:bg-gray-200 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">info</span>
                        <span>Detail</span>
                      </button>

                      {t.imageUrl && (
                        <button
                          onClick={() => onOpenImageModal(t.imageUrl)}
                          className="inline-flex items-center gap-1 text-xs text-[#0059bb] font-bold bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm">visibility</span>
                          <span>Desain</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: TODAY'S REVENUE BREAKDOWN */}
      {activeModal === 'today' && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-[#0059bb]">
                <span className="material-symbols-outlined text-2xl">payments</span>
                <h3 className="font-extrabold text-lg text-gray-900">Rincian Penghasilan Hari Ini</h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
              <p className="text-xs font-bold text-blue-900 uppercase">Total Pendapatan Hari Ini</p>
              <h2 className="text-2xl font-extrabold text-[#0059bb]">
                {formatRupiah(displayTodayRevenue)}
              </h2>
              <p className="text-xs text-blue-700">
                Terdiri dari transaksi langsung portal dan order tercatat hari ini.
              </p>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              <h4 className="font-bold text-xs text-gray-700 uppercase">Transaksi Hari Ini ({todayTransactions.length})</h4>
              {todayTransactions.length === 0 ? (
                <p className="text-xs text-gray-500 py-4 text-center bg-gray-50 rounded-xl border">
                  Belum ada transaksi baru yang diinput khusus tanggal hari ini.
                </p>
              ) : (
                todayTransactions.map((t) => (
                  <div key={t.id} className="p-3 bg-gray-50 rounded-xl border flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-gray-900">{t.orderId} - {t.customerName}</p>
                      <p className="text-gray-500">{t.orderType}</p>
                    </div>
                    <p className="font-mono font-bold text-[#0059bb]">{formatRupiah(t.totalAmount)}</p>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => {
                  setActiveModal(null);
                  onNavigateTab('new-transaction');
                }}
                className="px-4 py-2 bg-[#0059bb] text-white rounded-xl text-xs font-bold hover:bg-[#004493] transition-colors cursor-pointer"
              >
                + Input Order Hari Ini
              </button>
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-gray-100 text-gray-800 rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: MONTHLY REVENUE DETAILS */}
      {activeModal === 'month' && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-[#ffd600]">
                <span className="material-symbols-outlined text-2xl text-amber-600">
                  account_balance_wallet
                </span>
                <h3 className="font-extrabold text-lg text-gray-900">Rincian Penghasilan Bulan Ini</h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-xs font-bold text-amber-900 uppercase">Target Bulan Ini</p>
                <p className="text-xs font-extrabold text-amber-900">{monthTargetPercentage}%</p>
              </div>
              <h2 className="text-2xl font-extrabold text-amber-900">
                {formatRupiah(displayMonthRevenue)}
              </h2>
              <div className="w-full bg-amber-200 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-600 h-full rounded-full"
                  style={{ width: `${monthTargetPercentage}%` }}
                />
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-3 bg-gray-50 rounded-xl border">
                <span className="text-gray-600">Target Bulanan Operasional:</span>
                <span className="font-bold text-gray-900">{formatRupiah(monthlyTarget)}</span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded-xl border">
                <span className="text-gray-600">Sisa Target Pencapaian:</span>
                <span className="font-bold text-emerald-700">
                  {monthlyTarget - displayMonthRevenue > 0
                    ? formatRupiah(monthlyTarget - displayMonthRevenue)
                    : 'Target Terlampaui! 🎉'}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => {
                  setActiveModal(null);
                  onNavigateTab('reports-settings');
                }}
                className="px-4 py-2 bg-[#0059bb] text-white rounded-xl text-xs font-bold hover:bg-[#004493] transition-colors cursor-pointer"
              >
                Buka Laporan Keuangan
              </button>
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-gray-100 text-gray-800 rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: UNPAID TRANSACTIONS DRAWER */}
      {activeModal === 'unpaid' && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-[#800000]">
                <span className="material-symbols-outlined text-2xl">pending_actions</span>
                <h3 className="font-extrabold text-lg text-gray-900">
                  Daftar Transaksi Belum Lunas ({unpaidTransactions.length})
                </h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-3 bg-red-50 border border-red-200 text-red-900 text-xs rounded-xl flex justify-between items-center font-semibold">
              <span>Total Nominal Tertunda:</span>
              <span className="font-bold text-base">{formatRupiah(unpaidTotalAmount)}</span>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {unpaidTransactions.map((t) => (
                <div
                  key={t.id}
                  className="p-3.5 bg-gray-50 rounded-xl border flex flex-wrap justify-between items-center gap-2"
                >
                  <div>
                    <span className="font-bold text-xs text-[#0059bb]">{t.orderId}</span> -{' '}
                    <span className="font-bold text-xs text-gray-900">{t.customerName}</span>
                    <p className="text-[11px] text-gray-500">
                      {t.orderType} | Total: {formatRupiah(t.totalAmount)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {onUpdateStatus && (
                      <button
                        onClick={() => {
                          onUpdateStatus(t.id, 'Lunas');
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        Tandai Lunas
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => {
                  setActiveModal(null);
                  setSelectedStatusFilter('Belum Lunas');
                }}
                className="px-4 py-2 bg-[#800000] text-white rounded-xl text-xs font-bold hover:bg-red-900 transition-colors cursor-pointer"
              >
                Filter Di Tabel Dashboard
              </button>
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-gray-100 text-gray-800 rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: TRANSACTION DETAIL INSPECTION */}
      {activeModal === 'detail' && selectedTxDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-[#0059bb]">
                  {selectedTxDetail.orderId}
                </span>
                <h3 className="font-extrabold text-lg text-gray-900">
                  {selectedTxDetail.customerName}
                </h3>
              </div>
              <button
                onClick={() => {
                  setActiveModal(null);
                  setSelectedTxDetail(null);
                }}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl border">
                <p className="text-gray-500 font-medium">Kategori Pelanggan</p>
                <p className="font-bold text-gray-900 mt-0.5">{selectedTxDetail.customerCategory}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border">
                <p className="text-gray-500 font-medium">Status Pembayaran</p>
                <span
                  className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold ${getStatusBadgeClass(
                    selectedTxDetail.status
                  )}`}
                >
                  {selectedTxDetail.status}
                </span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border">
                <p className="text-gray-500 font-medium">Dimensi & Qty</p>
                <p className="font-bold text-gray-900 mt-0.5">
                  {selectedTxDetail.lengthMeters}m × {selectedTxDetail.widthMeters}m ({selectedTxDetail.qty} pcs)
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border">
                <p className="text-gray-500 font-medium">Total Harga</p>
                <p className="font-bold text-[#0059bb] mt-0.5">{formatRupiah(selectedTxDetail.totalAmount)}</p>
              </div>
            </div>

            {selectedTxDetail.notes && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs">
                <p className="font-bold text-amber-900">Catatan Khusus Pesanan:</p>
                <p className="text-amber-800 mt-1">{selectedTxDetail.notes}</p>
              </div>
            )}

            {selectedTxDetail.imageUrl && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-700">Lampiran Preview Desain:</p>
                <img
                  src={selectedTxDetail.imageUrl}
                  alt="Desain Order"
                  onClick={() => onOpenImageModal(selectedTxDetail.imageUrl)}
                  className="w-full h-40 object-cover rounded-xl border border-gray-200 hover:opacity-90 transition-opacity cursor-pointer"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => {
                  setActiveModal(null);
                  onNavigateTab('history');
                }}
                className="px-4 py-2 bg-[#0059bb] text-white rounded-xl text-xs font-bold hover:bg-[#004493] transition-colors cursor-pointer"
              >
                Buka di Riwayat Lengkap
              </button>
              <button
                onClick={() => {
                  setActiveModal(null);
                  setSelectedTxDetail(null);
                }}
                className="px-4 py-2 bg-gray-100 text-gray-800 rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
