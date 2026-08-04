import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, RoundingOption } from '../types';
import { CATEGORY_PRICING_TABLE } from '../utils/pricing';

interface ReportsSettingsViewProps {
  transactions: Transaction[];
  currentRoundingOption: RoundingOption;
  currentRoundingEnabled: boolean;
  onSaveRoundingConfig: (option: RoundingOption, enabled: boolean) => void;
}

export const ReportsSettingsView: React.FC<ReportsSettingsViewProps> = ({
  transactions,
  currentRoundingOption,
  currentRoundingEnabled,
  onSaveRoundingConfig,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState('2024-01-01');
  const [toDate, setToDate] = useState(todayStr);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('Semua');
  const [selectedRounding, setSelectedRounding] = useState<RoundingOption>(currentRoundingOption);
  const [roundingEnabled, setRoundingEnabled] = useState(currentRoundingEnabled);
  const [savedSuccessMessage, setSavedSuccessMessage] = useState(false);
  const [reportNotification, setReportNotification] = useState<string | null>(null);

  const formatRupiah = (num: number) => {
    return 'Rp ' + num.toLocaleString('id-ID');
  };

  const getFilteredTransactions = (categoryOverride?: string) => {
    const categoryToUse = categoryOverride !== undefined ? categoryOverride : selectedCategoryFilter;
    return transactions.filter((t) => {
      if (t.date && (t.date < fromDate || t.date > toDate)) {
        return false;
      }
      if (categoryToUse !== 'Semua') {
        const categoryStr = (t.customerCategory || '').toLowerCase();
        if (categoryStr !== categoryToUse.toLowerCase()) {
          return false;
        }
      }
      return true;
    });
  };

  const handleDownloadPdf = (categoryOverride?: string) => {
    try {
      const categoryToUse = categoryOverride !== undefined ? categoryOverride : selectedCategoryFilter;
      const filtered = getFilteredTransactions(categoryToUse);
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

      // Header Brand
      doc.setFillColor(128, 0, 0); // Maroon #800000
      doc.rect(0, 0, 297, 22, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(255, 255, 255);
      const headerTitle = categoryToUse === 'Semua' 
        ? 'UNIMUDA PRESS - LAPORAN PERIODE TRANSAKSI' 
        : `UNIMUDA PRESS - LAPORAN TRANSAKSI KATEGORI ${categoryToUse.toUpperCase()}`;
      doc.text(headerTitle, 14, 14);

      // Period Info
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text(`Periode Laporan: ${fromDate} s/d ${toDate}`, 14, 30);
      doc.text(`Kategori Pelanggan: ${categoryToUse === 'Semua' ? 'Semua Kategori (Kampus, Umum, Mitra, Persyarikatan)' : categoryToUse}`, 14, 35);
      doc.text(`Tanggal Export: ${new Date().toLocaleDateString('id-ID')} | Total: ${filtered.length} transaksi`, 14, 40);

      const totalRevenue = filtered.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
      const totalLunas = filtered.filter(t => t.status === 'Lunas' || t.status === 'Selesai').reduce((sum, t) => sum + t.totalAmount, 0);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(128, 0, 0);
      doc.text(`Total Omset: ${formatRupiah(totalRevenue)}`, 200, 30);
      doc.setTextColor(0, 128, 0);
      doc.text(`Lunas/Selesai: ${formatRupiah(totalLunas)}`, 200, 35);

      // Table Data
      const tableRows = filtered.map((t, index) => [
        index + 1,
        t.orderId || '-',
        t.date || '-',
        t.customerName || '-',
        t.customerCategory || '-',
        `${t.orderType}${t.useFrame ? ' (+Rangka)' : ''}`,
        `${t.lengthMeters}m x ${t.widthMeters}m (${t.qty}x)`,
        formatRupiah(t.totalAmount || 0),
        t.status || '-',
      ]);

      autoTable(doc, {
        startY: 45,
        head: [['No', 'ID Order', 'Tanggal', 'Pelanggan', 'Kategori', 'Jenis Layanan', 'Ukuran & Qty', 'Total (Rp)', 'Status']],
        body: tableRows,
        headStyles: {
          fillColor: [128, 0, 0],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250],
        },
        styles: {
          fontSize: 8.5,
          cellPadding: 3,
        },
        columnStyles: {
          0: { cellWidth: 12 },
          1: { cellWidth: 25 },
          2: { cellWidth: 25 },
          3: { cellWidth: 45 },
          4: { cellWidth: 30 },
          5: { cellWidth: 45 },
          6: { cellWidth: 35 },
          7: { cellWidth: 32, fontStyle: 'bold' },
          8: { cellWidth: 25 },
        },
        foot: [
          [
            '',
            '',
            '',
            '',
            '',
            '',
            'TOTAL PENDAPATAN:',
            formatRupiah(totalRevenue),
            `${filtered.length} Transaksi`,
          ],
        ],
        footStyles: {
          fillColor: [240, 240, 240],
          textColor: [128, 0, 0],
          fontStyle: 'bold',
          fontSize: 9,
        },
      });

      const catSuffix = categoryToUse === 'Semua' ? '' : `_${categoryToUse}`;
      doc.save(`Laporan_UnimudaPress${catSuffix}_${fromDate}_sd_${toDate}.pdf`);
      setReportNotification(`File PDF Laporan [${categoryToUse}] periode ${fromDate} s/d ${toDate} berhasil di-download!`);
      setTimeout(() => setReportNotification(null), 5000);
    } catch (err) {
      console.error('PDF Generation error:', err);
      setReportNotification('Gagal mengunduh file PDF. Silakan coba lagi.');
    }
  };

  const handleDownloadExcel = (categoryOverride?: string) => {
    try {
      const categoryToUse = categoryOverride !== undefined ? categoryOverride : selectedCategoryFilter;
      const filtered = getFilteredTransactions(categoryToUse);

      // Create CSV with UTF-8 BOM so Excel opens accented characters and numbers cleanly
      let csv = '\uFEFF';
      csv += `LAPORAN TRANSAKSI UNIMUDA PRESS - KATEGORI: ${categoryToUse.toUpperCase()}\n`;
      csv += `Periode Laporan:,${fromDate} s/d ${toDate}\n`;
      csv += `Kategori Pelanggan:,${categoryToUse}\n`;
      csv += `Tanggal Export:,${new Date().toLocaleDateString('id-ID')}\n`;
      csv += `Total Transaksi:,${filtered.length}\n\n`;

      csv += 'No,ID Order,Tanggal,Nama Pelanggan,Kategori,Jenis Layanan,Pakai Rangka,Panjang (m),Lebar (m),Luas (m2),Qty,Harga/m (Rp),Total (Rp),Status,Catatan\n';

      let totalRevenue = 0;
      filtered.forEach((t, idx) => {
        totalRevenue += t.totalAmount || 0;
        const area = (t.lengthMeters * t.widthMeters).toFixed(2);
        const useFrameStr = t.useFrame ? 'Ya (+100.000)' : 'Tidak';
        const cleanNotes = (t.notes || '').replace(/"/g, '""');

        csv += `${idx + 1},"${t.orderId || ''}","${t.date || ''}","${t.customerName || ''}","${t.customerCategory || ''}","${t.orderType || ''}","${useFrameStr}",${t.lengthMeters},${t.widthMeters},${area},${t.qty},${t.pricePerMeter},${t.totalAmount},"${t.status}","${cleanNotes}"\n`;
      });

      csv += `\n,,,,,,,,,,,TOTAL OMSET:,${totalRevenue},,\n`;

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const catSuffix = categoryToUse === 'Semua' ? '' : `_${categoryToUse}`;
      a.download = `Laporan_UnimudaPress${catSuffix}_${fromDate}_sd_${toDate}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setReportNotification(`File Excel/CSV Laporan [${categoryToUse}] periode ${fromDate} s/d ${toDate} berhasil di-download!`);
      setTimeout(() => setReportNotification(null), 5000);
    } catch (err) {
      console.error('Excel Download error:', err);
      setReportNotification('Gagal mengunduh file Excel. Silakan coba lagi.');
    }
  };

  const handleSaveConfig = () => {
    onSaveRoundingConfig(selectedRounding, roundingEnabled);
    setSavedSuccessMessage(true);
    setTimeout(() => setSavedSuccessMessage(false), 3000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Section */}
      <div>
        <h2 className="text-2xl lg:text-3xl font-extrabold text-[#191c1d] tracking-tight">
          Reports & Settings
        </h2>
        <p className="text-sm text-[#414754] mt-1">
          Konfigurasi aturan tarif cetak per meter dan pembulatan transaksi Unimuda Press.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section 1: Aturan Tarif Otomatis per Meter */}
          <div className="bg-white border border-[#e1e3e4] p-6 rounded-2xl shadow-2xs">
            <div className="flex items-center gap-2 mb-4 text-[#0059bb]">
              <span className="material-symbols-outlined">sell</span>
              <h3 className="font-bold text-[#191c1d] text-base">
                Aturan Tarif Otomatis Per Meter
              </h3>
            </div>

            <div className="overflow-x-auto mb-4">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f3f4f5] text-[#414754] text-xs font-bold uppercase border-b border-[#e1e3e4]">
                    <th className="px-4 py-3">KATEGORI PELANGGAN</th>
                    <th className="px-4 py-3">DESAIN + CETAK</th>
                    <th className="px-4 py-3">CETAK SAJA</th>
                    <th className="px-4 py-3">KETERANGAN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e1e3e4] text-sm">
                  {CATEGORY_PRICING_TABLE.map((row) => (
                    <tr key={row.category} className="hover:bg-[#f8f9fa] transition-colors">
                      <td className="px-4 py-3.5 font-bold text-[#191c1d]">{row.category}</td>
                      <td className="px-4 py-3.5 font-mono text-[#0059bb] font-bold">
                        {row.designPrint ? formatRupiah(row.designPrint) + '/m²' : <span className="text-gray-400 font-normal italic">- (Tidak Ada)</span>}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[#0059bb] font-bold">
                        {formatRupiah(row.printOnly)}/m²
                      </td>
                      <td className="px-4 py-3.5 text-xs text-[#414754]">{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3.5 bg-blue-50/80 rounded-xl border border-blue-200 flex items-start gap-3">
              <span className="material-symbols-outlined text-[#0059bb] text-xl shrink-0 mt-0.5">
                info
              </span>
              <p className="text-xs text-[#191c1d] leading-relaxed">
                <strong>Sistem Otomatis:</strong> Saat menginput transaksi baru, memilih Kategori Pelanggan & Layanan akan langsung mengisi tarif per meter secara presisi sesuai tabel di atas.
              </p>
            </div>
          </div>

          {/* Section 2: Generate Reports */}
          <div className="bg-white border border-[#e1e3e4] p-6 rounded-2xl shadow-2xs space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e1e3e4] pb-4">
              <div className="flex items-center gap-2 text-[#800000]">
                <span className="material-symbols-outlined">calendar_month</span>
                <h3 className="font-bold uppercase text-xs tracking-wider text-[#191c1d]">
                  Export Laporan Periode
                </h3>
              </div>
              <div className="flex flex-wrap gap-1.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setFromDate('2024-01-01');
                    setToDate(todayStr);
                  }}
                  className={`px-3 py-1 rounded-full border cursor-pointer transition-colors ${
                    fromDate === '2024-01-01' && toDate === todayStr
                      ? 'bg-[#800000] text-white border-[#800000]'
                      : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  2024 s/d Terbaru
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFromDate('2024-01-01');
                    setToDate('2024-12-31');
                  }}
                  className={`px-3 py-1 rounded-full border cursor-pointer transition-colors ${
                    fromDate === '2024-01-01' && toDate === '2024-12-31'
                      ? 'bg-[#800000] text-white border-[#800000]'
                      : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  Tahun 2024
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFromDate('2025-01-01');
                    setToDate('2025-12-31');
                  }}
                  className={`px-3 py-1 rounded-full border cursor-pointer transition-colors ${
                    fromDate === '2025-01-01' && toDate === '2025-12-31'
                      ? 'bg-[#800000] text-white border-[#800000]'
                      : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  Tahun 2025
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFromDate('2026-01-01');
                    setToDate(todayStr);
                  }}
                  className={`px-3 py-1 rounded-full border cursor-pointer transition-colors ${
                    fromDate === '2026-01-01' && toDate === todayStr
                      ? 'bg-[#800000] text-white border-[#800000]'
                      : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  Tahun 2026 (Terbaru)
                </button>
              </div>
            </div>

            {/* Date Range Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#414754] mb-1.5">Dari Tanggal</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full bg-[#f8f9fa] border border-[#c1c6d7] rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#0059bb] outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#414754] mb-1.5">Sampai Tanggal</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full bg-[#f8f9fa] border border-[#c1c6d7] rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#0059bb] outline-none font-medium"
                />
              </div>
            </div>

            {/* Customer Category Filter Menu Options */}
            <div>
              <label className="block text-xs font-bold text-[#414754] mb-2 flex items-center justify-between">
                <span>FILTER KATEGORI PELANGGAN</span>
                <span className="text-blue-700 text-[11px] font-semibold">
                  Dipilih: {selectedCategoryFilter}
                </span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { id: 'Semua', label: 'Semua Kategori', icon: 'apps' },
                  { id: 'Kampus', label: 'Kampus', icon: 'school' },
                  { id: 'Umum', label: 'Umum', icon: 'person' },
                  { id: 'Mitra', label: 'Mitra', icon: 'handshake' },
                  { id: 'Persyarikatan', label: 'Persyarikatan', icon: 'corporate_fare' },
                ].map((cat) => {
                  const isSelected = selectedCategoryFilter === cat.id;
                  const count = getFilteredTransactions(cat.id).length;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategoryFilter(cat.id)}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#800000] text-white border-[#800000] shadow-sm ring-2 ring-offset-1 ring-[#800000]'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                      }`}
                    >
                      <span className="material-symbols-outlined text-xl">{cat.icon}</span>
                      <span className="text-xs font-bold leading-none">{cat.label}</span>
                      <span className={`text-[10px] ${isSelected ? 'text-red-100' : 'text-gray-500'}`}>
                        ({count} Transaksi)
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {reportNotification && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2 animate-fadeIn">
                <span className="material-symbols-outlined text-base">check_circle</span>
                <span>{reportNotification}</span>
              </div>
            )}

            {/* Primary Action Download Buttons for Currently Selected Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
              <button
                onClick={() => handleDownloadPdf()}
                className="bg-[#800000] hover:bg-[#600000] text-white py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-98"
              >
                <span className="material-symbols-outlined text-xl">picture_as_pdf</span>
                <span>Download Laporan PDF ({selectedCategoryFilter})</span>
              </button>

              <button
                onClick={() => handleDownloadExcel()}
                className="bg-white border border-gray-300 text-gray-800 hover:bg-gray-50 py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer active:scale-98"
              >
                <span className="material-symbols-outlined text-xl text-emerald-600">table_view</span>
                <span>Download Laporan Excel ({selectedCategoryFilter})</span>
              </button>
            </div>

            {/* Quick Menu Category Download Cards */}
            <div className="pt-4 border-t border-gray-100 space-y-3">
              <h4 className="font-extrabold text-xs text-[#191c1d] uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-[#0059bb]">folder_zip</span>
                <span>Menu Pilihan Download Laporan Per Kategori</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {[
                  {
                    name: 'Kampus',
                    icon: 'school',
                    desc: 'Mahasiswa, Dosen, Fakultas, & Unit Unimuda',
                    color: 'bg-blue-50/50 border-blue-200 text-blue-900',
                    iconBg: 'bg-blue-600 text-white',
                  },
                  {
                    name: 'Umum',
                    icon: 'person',
                    desc: 'Masyarakat umum & perorangan',
                    color: 'bg-emerald-50/50 border-emerald-200 text-emerald-900',
                    iconBg: 'bg-emerald-600 text-white',
                  },
                  {
                    name: 'Mitra',
                    icon: 'handshake',
                    desc: 'Perusahaan, instansi & vendor mitra',
                    color: 'bg-amber-50/50 border-amber-200 text-amber-900',
                    iconBg: 'bg-amber-600 text-white',
                  },
                  {
                    name: 'Persyarikatan',
                    icon: 'corporate_fare',
                    desc: 'Muhammadiyah, Aisyiyah, Ortom & Amal Usaha',
                    color: 'bg-purple-50/50 border-purple-200 text-purple-900',
                    iconBg: 'bg-purple-600 text-white',
                  },
                ].map((cat) => {
                  const catTxs = getFilteredTransactions(cat.name);
                  const catRevenue = catTxs.reduce((acc, t) => acc + (t.totalAmount || 0), 0);
                  return (
                    <div
                      key={cat.name}
                      className={`p-4 rounded-xl border ${cat.color} flex flex-col justify-between gap-3 transition-all hover:shadow-xs`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2.5 rounded-lg ${cat.iconBg} shrink-0`}>
                          <span className="material-symbols-outlined text-xl">{cat.icon}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <h5 className="font-extrabold text-sm text-[#191c1d]">
                              Laporan {cat.name}
                            </h5>
                            <span className="text-[11px] font-bold bg-white/80 px-2 py-0.5 rounded-md border border-gray-200">
                              {catTxs.length} Transaksi
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-600 mt-0.5 truncate">{cat.desc}</p>
                          <p className="text-xs font-bold text-[#800000] mt-1">
                            Total: {formatRupiah(catRevenue)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1 border-t border-gray-200/60">
                        <button
                          type="button"
                          onClick={() => handleDownloadPdf(cat.name)}
                          className="flex-1 bg-[#800000] hover:bg-[#600000] text-white py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                          <span>PDF</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadExcel(cat.name)}
                          className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm text-emerald-600">table_view</span>
                          <span>Excel</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Rounding Configuration */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-[#e1e3e4] p-6 rounded-2xl shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0059bb]">calculate</span>
                <h3 className="font-bold text-base text-[#191c1d]">Pengaturan Pembulatan</h3>
              </div>
              <button
                type="button"
                onClick={() => setRoundingEnabled(!roundingEnabled)}
                className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer ${
                  roundingEnabled ? 'bg-[#0059bb]' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                    roundingEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <p className="text-xs text-[#414754] leading-relaxed">
              Atur bagaimana total harga transaksi dibulatkan ke atas untuk kemudahan pembayaran pelanggan.
            </p>

            <div className="space-y-3 pt-2">
              <label
                className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  selectedRounding === 'off' || !roundingEnabled
                    ? 'border-[#0059bb] bg-blue-50/40 shadow-2xs'
                    : 'border-[#e1e3e4] hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="roundingOption"
                  value="off"
                  checked={selectedRounding === 'off' || !roundingEnabled}
                  onChange={() => {
                    setSelectedRounding('off');
                    setRoundingEnabled(false);
                  }}
                  className="mt-1 text-[#0059bb] focus:ring-[#0059bb]"
                />
                <div>
                  <p className="text-sm font-bold text-[#191c1d]">Tanpa Pembulatan (Off)</p>
                  <p className="text-xs text-gray-500">Nominal persis sesuai hasil perkalian luas</p>
                </div>
              </label>

              <label
                className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  roundingEnabled && selectedRounding === '100'
                    ? 'border-[#0059bb] bg-blue-50/40 shadow-2xs'
                    : 'border-[#e1e3e4] hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="roundingOption"
                  value="100"
                  checked={roundingEnabled && selectedRounding === '100'}
                  onChange={() => {
                    setSelectedRounding('100');
                    setRoundingEnabled(true);
                  }}
                  className="mt-1 text-[#0059bb] focus:ring-[#0059bb]"
                />
                <div>
                  <p className="text-sm font-bold text-[#191c1d]">Bulatkan ke Ratusan (+100)</p>
                  <p className="text-xs text-gray-500">Contoh: Rp 127.350 → Rp 127.400</p>
                </div>
              </label>

              <label
                className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  roundingEnabled && selectedRounding === '1000'
                    ? 'border-[#0059bb] bg-blue-50/40 shadow-2xs'
                    : 'border-[#e1e3e4] hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="roundingOption"
                  value="1000"
                  checked={roundingEnabled && selectedRounding === '1000'}
                  onChange={() => {
                    setSelectedRounding('1000');
                    setRoundingEnabled(true);
                  }}
                  className="mt-1 text-[#0059bb] focus:ring-[#0059bb]"
                />
                <div>
                  <p className="text-sm font-bold text-[#191c1d]">Bulatkan ke Ribuan (+1.000)</p>
                  <p className="text-xs text-gray-500">Contoh: Rp 127.350 → Rp 128.000</p>
                </div>
              </label>

              <label
                className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  roundingEnabled && selectedRounding === '10000'
                    ? 'border-[#0059bb] bg-blue-50/40 shadow-2xs'
                    : 'border-[#e1e3e4] hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="roundingOption"
                  value="10000"
                  checked={roundingEnabled && selectedRounding === '10000'}
                  onChange={() => {
                    setSelectedRounding('10000');
                    setRoundingEnabled(true);
                  }}
                  className="mt-1 text-[#0059bb] focus:ring-[#0059bb]"
                />
                <div>
                  <p className="text-sm font-bold text-[#191c1d]">Bulatkan ke Puluh Ribuan (+10.000)</p>
                  <p className="text-xs text-gray-500">Contoh: Rp 127.350 → Rp 130.000</p>
                </div>
              </label>
            </div>

            {savedSuccessMessage && (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2 border border-emerald-200 animate-fadeIn">
                <span className="material-symbols-outlined text-base">check_circle</span>
                <span>Konfigurasi pembulatan berhasil disimpan!</span>
              </div>
            )}

            <button
              onClick={handleSaveConfig}
              className="w-full bg-[#800000] hover:bg-[#600000] text-white py-3.5 rounded-xl font-bold text-sm shadow-md active:scale-98 transition-all cursor-pointer"
            >
              Simpan Konfigurasi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
