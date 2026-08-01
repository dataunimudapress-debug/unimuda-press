import React, { useState } from 'react';
import { Transaction, PaymentStatus, CustomerCategory, RoundingOption } from '../types';
import { getPricePerMeter, applyRounding } from '../utils/pricing';

interface TransactionHistoryViewProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
  onUpdateStatus: (id: string, newStatus: PaymentStatus) => void;
  onUpdateTransaction: (updatedTx: Transaction) => void;
  roundingOption: RoundingOption;
  roundingEnabled: boolean;
  onOpenImageModal: (imageUrl: string) => void;
}

export const TransactionHistoryView: React.FC<TransactionHistoryViewProps> = ({
  transactions,
  onDeleteTransaction,
  onUpdateStatus,
  onUpdateTransaction,
  roundingOption,
  roundingEnabled,
  onOpenImageModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('All Types');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('Status: All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Custom UI Modals State
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);

  // Filter logic
  const filteredTransactions = transactions.filter((t) => {
    if (!t) return false;
    const customerNameStr = t.customerName || '';
    const orderIdStr = t.orderId || '';
    const orderTypeStr = t.orderType || '';

    const matchesSearch =
      customerNameStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      orderIdStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      orderTypeStr.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      selectedTypeFilter === 'All Types' ||
      orderTypeStr.toLowerCase().includes(selectedTypeFilter.toLowerCase());

    const matchesStatus =
      selectedStatusFilter === 'Status: All' ||
      t.status === selectedStatusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatRupiah = (num: number) => {
    return 'Rp ' + num.toLocaleString('id-ID');
  };

  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'Lunas':
      case 'Selesai':
        return 'bg-[#ffd600] text-[#000000] font-bold';
      case 'DP (50%)':
        return 'bg-[#e1e3e4] text-[#414754] font-bold';
      case 'Produksi':
        return 'bg-[#d8e2ff] text-[#004493] font-bold';
      case 'Belum Lunas':
      default:
        return 'bg-[#ffdad6] text-[#93000a] font-bold';
    }
  };

  const handleExportCSV = () => {
    const headers = ['Order ID', 'Tanggal', 'Pelanggan', 'Kategori', 'Tipe Order', 'Total Amount', 'Status'];
    const csvRows = [
      headers.join(','),
      ...filteredTransactions.map((t) =>
        [t.orderId, t.date, `"${t.customerName}"`, t.customerCategory, `"${t.orderType}"`, t.totalAmount, t.status].join(',')
      ),
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Unimuda_Press_Laporan_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleConfirmDelete = () => {
    if (deletingTransaction) {
      onDeleteTransaction(deletingTransaction.id);
      setDeletingTransaction(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn relative">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-extrabold text-[#191c1d] tracking-tight">
            Transaction History
          </h2>
          <p className="text-sm text-[#414754] mt-1">
            Kelola, edit detail orderan, dan pantau seluruh transaksi pemesanan cetak Unimuda Press.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#800000] hover:bg-[#600000] text-white rounded-full font-bold text-xs shadow-xs active:scale-95 transition-transform cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">download</span>
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar Section */}
      <div className="bg-white border border-[#e1e3e4] p-4 lg:p-5 rounded-2xl shadow-2xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Search Input */}
          <div className="lg:col-span-4 relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#414754]">
              search
            </span>
            <input
              type="text"
              placeholder="Search customer name or ID..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-[#f8f9fa] border border-[#c1c6d7] rounded-xl text-sm focus:ring-2 focus:ring-[#0059bb] outline-none transition-all"
            />
          </div>

          {/* Chips Group focused on Spanduk, Banner, and Baliho */}
          <div className="lg:col-span-8 flex flex-wrap gap-2 items-center overflow-x-auto scrollbar-hide">
            {['All Types', 'Spanduk', 'Banner', 'Baliho'].map((type) => (
              <button
                key={type}
                onClick={() => {
                  setSelectedTypeFilter(type);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedTypeFilter === type
                    ? 'bg-[#ffd600] text-[#000000] shadow-2xs'
                    : 'bg-[#e7e8e9] text-[#414754] hover:bg-[#c1c6d7]'
                }`}
              >
                {type}
              </button>
            ))}

            <div className="h-5 w-px bg-[#c1c6d7] mx-1"></div>

            <select
              value={selectedStatusFilter}
              onChange={(e) => {
                setSelectedStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-[#f3f4f5] border border-[#c1c6d7] rounded-full text-xs font-bold text-[#414754] cursor-pointer outline-none"
            >
              <option value="Status: All">Status: All</option>
              <option value="Lunas">Lunas</option>
              <option value="Belum Lunas">Belum Lunas</option>
              <option value="DP (50%)">DP (50%)</option>
              <option value="Produksi">Produksi</option>
              <option value="Selesai">Selesai</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Section (Desktop View) */}
      <div className="hidden md:block bg-white border border-[#e1e3e4] rounded-2xl overflow-hidden shadow-2xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f3f4f5] text-[#414754] uppercase text-[11px] font-bold tracking-wider border-b border-[#e1e3e4]">
              <th className="px-6 py-4">DESIGN</th>
              <th className="px-6 py-4">DATE</th>
              <th className="px-6 py-4">CUSTOMER</th>
              <th className="px-6 py-4">ORDER TYPE</th>
              <th className="px-6 py-4 text-right">AMOUNT</th>
              <th className="px-6 py-4">STATUS</th>
              <th className="px-6 py-4 text-center">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e1e3e4] text-sm">
            {paginatedTransactions.length > 0 ? (
              paginatedTransactions.map((t) => (
                <tr key={t.id} className="hover:bg-[#f8f9fa] transition-colors">
                  <td className="px-6 py-4">
                    <div
                      onClick={() => onOpenImageModal(t.imageUrl)}
                      className="w-12 h-12 rounded-lg bg-[#e7e8e9] cursor-pointer overflow-hidden border border-[#c1c6d7] hover:opacity-80 transition-opacity flex items-center justify-center group"
                      title="Klik untuk perbesar foto desain"
                    >
                      <img
                        src={t.imageUrl}
                        alt="Design Thumbnail"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[#191c1d] font-semibold whitespace-nowrap">
                    {t.date}
                  </td>
                  <td className="px-6 py-4 text-[#191c1d]">
                    <div className="font-bold">{t.customerName}</div>
                    <span className="text-[11px] text-gray-500">{t.orderId} • {t.customerCategory}</span>
                  </td>
                  <td className="px-6 py-4 text-[#414754]">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span>{t.orderType}</span>
                      {t.useFrame && (
                        <span className="px-2 py-0.5 bg-blue-100 text-[#0059bb] text-[10px] font-bold rounded-md">
                          + Rangka
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-400 font-mono">
                      {t.lengthMeters}m × {t.widthMeters}m (Qty: {t.qty})
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-[#191c1d]">
                    {formatRupiah(t.totalAmount)}
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={t.status}
                      onChange={(e) => onUpdateStatus(t.id, e.target.value as PaymentStatus)}
                      className={`px-3 py-1 rounded-full text-[11px] uppercase tracking-wider cursor-pointer border-none outline-none font-bold ${getStatusBadge(
                        t.status
                      )}`}
                    >
                      <option value="Lunas">Lunas</option>
                      <option value="Belum Lunas">Belum Lunas</option>
                      <option value="DP (50%)">DP (50%)</option>
                      <option value="Produksi">Produksi</option>
                      <option value="Selesai">Selesai</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-1">
                      <button
                        onClick={() => setEditingTransaction(t)}
                        className="p-2 text-[#0059bb] hover:bg-[#d8e2ff] rounded-full transition-colors cursor-pointer flex items-center gap-1 font-bold text-xs"
                        title="Edit Detail Orderan"
                      >
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button
                        onClick={() => setDeletingTransaction(t)}
                        className="p-2 text-[#ba1a1a] hover:bg-red-50 rounded-full transition-colors cursor-pointer"
                        title="Hapus Transaksi"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500">
                  Tidak ada data transaksi yang sesuai dengan pencarian/filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Grid View */}
      <div className="md:hidden grid grid-cols-1 gap-4">
        {paginatedTransactions.map((t) => (
          <div
            key={t.id}
            className="bg-white border border-[#e1e3e4] rounded-2xl p-4 shadow-2xs space-y-3"
          >
            <div className="flex justify-between items-start">
              <div className="flex gap-3">
                <div
                  onClick={() => onOpenImageModal(t.imageUrl)}
                  className="w-14 h-14 rounded-xl overflow-hidden border border-[#c1c6d7] cursor-pointer shrink-0"
                >
                  <img
                    src={t.imageUrl}
                    alt="Design"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-[#191c1d] leading-tight">{t.customerName}</h3>
                  <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                    <p className="text-xs text-[#414754] font-medium">{t.orderType}</p>
                    {t.useFrame && (
                      <span className="px-1.5 py-0.2 bg-blue-100 text-[#0059bb] text-[9px] font-bold rounded">
                        + Rangka
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">{t.orderId} • {t.date}</p>
                </div>
              </div>

              <select
                value={t.status}
                onChange={(e) => onUpdateStatus(t.id, e.target.value as PaymentStatus)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold outline-none cursor-pointer border-none ${getStatusBadge(
                  t.status
                )}`}
              >
                <option value="Lunas">Lunas</option>
                <option value="Belum Lunas">Belum Lunas</option>
                <option value="DP (50%)">DP (50%)</option>
                <option value="Produksi">Produksi</option>
                <option value="Selesai">Selesai</option>
              </select>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-[#e1e3e4]">
              <div>
                <p className="text-[10px] uppercase font-bold text-[#414754]">TOTAL AMOUNT</p>
                <p className="font-bold text-[#191c1d] font-mono text-sm">{formatRupiah(t.totalAmount)}</p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setEditingTransaction(t)}
                  className="p-2 text-[#0059bb] hover:bg-blue-50 rounded-full cursor-pointer"
                  title="Edit Detail Orderan"
                >
                  <span className="material-symbols-outlined text-lg">edit</span>
                </button>
                <button
                  onClick={() => setDeletingTransaction(t)}
                  className="p-2 text-[#ba1a1a] hover:bg-red-50 rounded-full cursor-pointer"
                  title="Hapus Transaksi"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between pt-4">
        <p className="text-xs text-[#414754] font-medium hidden md:block">
          Showing {filteredTransactions.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{' '}
          {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of{' '}
          {filteredTransactions.length} entries
        </p>

        <div className="flex items-center gap-1.5 mx-auto md:mx-0">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 border border-[#c1c6d7] rounded-xl hover:bg-[#f3f4f5] transition-colors disabled:opacity-30 cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">chevron_left</span>
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => setCurrentPage(pageNum)}
              className={`w-9 h-9 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                currentPage === pageNum
                  ? 'bg-[#800000] text-white shadow-2xs'
                  : 'border border-[#c1c6d7] text-[#414754] hover:bg-[#f3f4f5]'
              }`}
            >
              {pageNum}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 border border-[#c1c6d7] rounded-xl hover:bg-[#f3f4f5] transition-colors disabled:opacity-30 cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">chevron_right</span>
          </button>
        </div>
      </div>

      {/* EDIT FULL ORDER MODAL */}
      {editingTransaction && (
        <EditOrderModal
          transaction={editingTransaction}
          onSave={(updatedTx) => {
            onUpdateTransaction(updatedTx);
            setEditingTransaction(null);
          }}
          onClose={() => setEditingTransaction(null)}
          roundingOption={roundingOption}
          roundingEnabled={roundingEnabled}
        />
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 text-center space-y-4">
            <div className="w-12 h-12 bg-red-100 text-[#ba1a1a] rounded-full flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-2xl">warning</span>
            </div>

            <div>
              <h3 className="font-bold text-lg text-gray-900">Hapus Transaksi?</h3>
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                Apakah Anda yakin ingin menghapus transaksi{' '}
                <strong className="font-mono text-gray-900">{deletingTransaction.orderId}</strong> atas nama{' '}
                <strong className="text-gray-900">{deletingTransaction.customerName}</strong>?
              </p>
              <p className="text-[11px] text-red-600 font-semibold mt-1">
                * Data yang dihapus tidak dapat dikembalikan.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeletingTransaction(null)}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl font-bold text-xs text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 bg-[#ba1a1a] hover:bg-[#93000a] text-white rounded-xl font-bold text-xs shadow-md transition-colors cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-component for Full Order Editing Modal
interface EditOrderModalProps {
  transaction: Transaction;
  onSave: (updatedTx: Transaction) => void;
  onClose: () => void;
  roundingOption: RoundingOption;
  roundingEnabled: boolean;
}

const EditOrderModal: React.FC<EditOrderModalProps> = ({
  transaction,
  onSave,
  onClose,
  roundingOption,
  roundingEnabled,
}) => {
  const [date, setDate] = useState<string>(transaction.date);
  const [customerName, setCustomerName] = useState<string>(transaction.customerName);
  const [customerCategory, setCustomerCategory] = useState<CustomerCategory>(transaction.customerCategory);
  const [orderType, setOrderType] = useState<string>(
    transaction.orderType || 'Spanduk (Flexi Outdoor)'
  );
  const [serviceType, setServiceType] = useState<'design_print' | 'print_only'>(
    transaction.serviceType || 'design_print'
  );
  const [lengthMeters, setLengthMeters] = useState<number>(transaction.lengthMeters || 1.0);
  const [widthMeters, setWidthMeters] = useState<number>(transaction.widthMeters || 1.0);
  const [qty, setQty] = useState<number>(transaction.qty || 1);
  const [useFrame, setUseFrame] = useState<boolean>(transaction.useFrame || false);
  const [customSubtotal, setCustomSubtotal] = useState<number | null>(null);
  const [status, setStatus] = useState<PaymentStatus>(transaction.status);
  const [notes, setNotes] = useState<string>(transaction.notes || '');
  const [imageUrl, setImageUrl] = useState<string>(transaction.imageUrl);
  const [formError, setFormError] = useState<string | null>(null);

  // Auto-calculated rate & total amount
  const currentService = customerCategory === 'Mitra' ? 'print_only' : serviceType;
  const pricePerMeter = getPricePerMeter(customerCategory, currentService);

  const rawArea = Math.max(0, lengthMeters) * Math.max(0, widthMeters);
  const isUnderMinArea = rawArea > 0 && rawArea < 1.0;
  const effectiveArea = isUnderMinArea ? 1.0 : rawArea;
  const frameCost = useFrame ? 100000 * Math.max(1, qty) : 0;
  
  const autoRawSubtotal = Math.round(effectiveArea * pricePerMeter * Math.max(1, qty)) + frameCost;
  const rawSubtotal = (isUnderMinArea && customSubtotal !== null) ? customSubtotal : autoRawSubtotal;
  const totalAmount = applyRounding(rawSubtotal, roundingOption, roundingEnabled);

  const formatRupiah = (num: number) => 'Rp ' + num.toLocaleString('id-ID');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setImageUrl(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!customerName.trim()) {
      setFormError('Nama pelanggan wajib diisi!');
      return;
    }

    onSave({
      ...transaction,
      date,
      customerName: customerName.trim(),
      customerCategory,
      orderType,
      serviceType: currentService,
      lengthMeters,
      widthMeters,
      qty,
      pricePerMeter,
      totalAmount,
      status,
      useFrame,
      notes: notes.trim(),
      imageUrl,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full my-8 p-6 shadow-2xl border border-gray-100 space-y-5 relative">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-200">
          <div className="flex items-center gap-2 text-[#0059bb]">
            <span className="material-symbols-outlined text-2xl">edit_square</span>
            <div>
              <h3 className="font-bold text-lg text-[#191c1d]">Edit Detail Transaksi</h3>
              <p className="text-xs text-gray-500 font-mono">Order ID: {transaction.orderId}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full cursor-pointer"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 text-[#ba1a1a] text-xs font-bold rounded-xl flex items-center gap-2 border border-red-200 animate-fadeIn">
              <span className="material-symbols-outlined text-lg">error</span>
              <span>{formError}</span>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tanggal */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Tanggal Pesanan</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#f8f9fa] border border-[#c1c6d7] rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-[#0059bb] outline-none"
              />
            </div>

            {/* Nama Pelanggan */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Nama Pelanggan *</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-[#f8f9fa] border border-[#c1c6d7] rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-[#0059bb] outline-none"
              />
            </div>

            {/* Kategori Pelanggan */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Kategori Pelanggan</label>
              <select
                value={customerCategory}
                onChange={(e) => setCustomerCategory(e.target.value as CustomerCategory)}
                className="w-full bg-[#f8f9fa] border border-[#0059bb] text-[#0059bb] font-bold rounded-xl p-2.5 text-sm outline-none"
              >
                <option value="Umum">Umum (Desain: Rp50k | Cetak: Rp48k)</option>
                <option value="Persyarikatan">Persyarikatan (Desain: Rp48k | Cetak: Rp45k)</option>
                <option value="Mitra">Mitra (Cetak Saja: Rp40k)</option>
                <option value="Kampus">Kampus (Desain: Rp40k | Cetak: Rp38k)</option>
              </select>
            </div>

            {/* Jenis Pesanan (3 Fokus) */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Jenis Pesanan Cetak</label>
              <select
                value={orderType}
                onChange={(e) => setOrderType(e.target.value)}
                className="w-full bg-[#f8f9fa] border border-[#c1c6d7] rounded-xl p-2.5 text-sm font-medium focus:ring-2 focus:ring-[#0059bb] outline-none"
              >
                <option value="Spanduk (Flexi Outdoor)">Spanduk (Flexi Outdoor)</option>
                <option value="Banner (X-Banner / Roll Up)">Banner (X-Banner / Y-Banner / Roll Up)</option>
                <option value="Baliho (Large Format)">Baliho (Large Format)</option>
              </select>
            </div>
          </div>

          {/* Jenis Layanan */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Jenis Layanan</label>
            <div className="flex gap-6">
              <label className={`flex items-center gap-2 cursor-pointer text-xs font-medium ${customerCategory === 'Mitra' ? 'opacity-40' : ''}`}>
                <input
                  type="radio"
                  name="editServiceType"
                  value="design_print"
                  disabled={customerCategory === 'Mitra'}
                  checked={serviceType === 'design_print' && customerCategory !== 'Mitra'}
                  onChange={() => setServiceType('design_print')}
                  className="text-[#0059bb] focus:ring-[#0059bb]"
                />
                <span>Desain + Cetak</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
                <input
                  type="radio"
                  name="editServiceType"
                  value="print_only"
                  checked={serviceType === 'print_only' || customerCategory === 'Mitra'}
                  onChange={() => setServiceType('print_only')}
                  className="text-[#0059bb] focus:ring-[#0059bb]"
                />
                <span>Cetak Saja</span>
              </label>
            </div>
          </div>

          {/* Opsi Rangka */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Opsi Rangka</label>
            <div className="flex gap-6 bg-gray-50 border border-gray-200 p-2.5 rounded-xl">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
                <input
                  type="radio"
                  name="editUseFrame"
                  checked={!useFrame}
                  onChange={() => setUseFrame(false)}
                  className="text-[#0059bb] focus:ring-[#0059bb]"
                />
                <span>Tanpa Rangka</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#0059bb]">
                <input
                  type="radio"
                  name="editUseFrame"
                  checked={useFrame}
                  onChange={() => setUseFrame(true)}
                  className="text-[#0059bb] focus:ring-[#0059bb]"
                />
                <span>Pakai Rangka (+Rp 100.000 / unit)</span>
              </label>
            </div>
          </div>

          {/* Ukuran & Qty */}
          <div className="grid grid-cols-3 gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">Panjang (m)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={lengthMeters}
                onChange={(e) => setLengthMeters(parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">Lebar (m)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={widthMeters}
                onChange={(e) => setWidthMeters(parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">Qty</label>
              <input
                type="number"
                min="1"
                value={qty}
                onChange={(e) => setQty(parseInt(e.target.value) || 1)}
                className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs font-bold"
              />
            </div>
          </div>

          {/* Subtotal Manual jika ukuran < 1 m² */}
          {isUnderMinArea && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-amber-600">edit_note</span>
                  Ukuran &lt; 1.00 m² ({rawArea.toFixed(2)} m²) — Subtotal Manual
                </span>
                {customSubtotal !== null && (
                  <button
                    type="button"
                    onClick={() => setCustomSubtotal(null)}
                    className="text-[10px] text-amber-800 underline font-semibold hover:text-amber-950 cursor-pointer"
                  >
                    Reset Otomatis
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-amber-900 font-semibold whitespace-nowrap">
                  Subtotal (Rp):
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  placeholder={`Otomatis: ${autoRawSubtotal}`}
                  value={customSubtotal !== null ? customSubtotal : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomSubtotal(val === '' ? null : Math.max(0, parseInt(val) || 0));
                  }}
                  className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 text-xs font-bold font-mono text-gray-900 outline-none"
                />
              </div>
            </div>
          )}

          {/* Foto Desain Edit */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Foto Desain</label>
            <div className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
              <img
                src={imageUrl}
                alt="Design Preview"
                className="w-14 h-14 object-cover rounded-lg border border-gray-300 shrink-0"
              />
              <div className="flex-1 text-xs">
                <p className="font-semibold text-gray-800">Ubah Foto Desain</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="mt-1 text-xs text-gray-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#0059bb] file:text-white hover:file:bg-[#004493] cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Status & Total Calculation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Status Pembayaran</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PaymentStatus)}
                className="w-full bg-[#f8f9fa] border border-[#c1c6d7] rounded-xl p-2.5 text-sm font-bold text-gray-800 cursor-pointer outline-none"
              >
                <option value="Lunas">Lunas</option>
                <option value="Belum Lunas">Belum Lunas</option>
                <option value="DP (50%)">DP (50%)</option>
                <option value="Produksi">Produksi</option>
                <option value="Selesai">Selesai</option>
              </select>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-right">
              <p className="text-[10px] uppercase font-bold text-gray-500">Kalkulasi Ulang Total</p>
              <p className="text-xl font-extrabold text-[#0059bb]">{formatRupiah(totalAmount)}</p>
              <p className="text-[10px] text-gray-500 font-mono">
                {formatRupiah(pricePerMeter)}/m² • {effectiveArea.toFixed(2)} m²
              </p>
            </div>
          </div>

          {/* Catatan */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Catatan Tambahan</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#f8f9fa] border border-[#c1c6d7] rounded-xl p-2.5 text-xs outline-none"
              placeholder="Catatan pengerjaan atau finishing..."
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-300 rounded-xl font-bold text-xs text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-[#800000] hover:bg-[#600000] text-white rounded-xl font-bold text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1"
            >
              <span className="material-symbols-outlined text-base">save</span>
              <span>Simpan Perubahan Order</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
