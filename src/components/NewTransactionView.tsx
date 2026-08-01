import React, { useState, useEffect } from 'react';
import { Transaction, CustomerCategory, PaymentStatus, RoundingOption } from '../types';
import { getPricePerMeter, applyRounding, CATEGORY_PRICING_TABLE } from '../utils/pricing';

interface NewTransactionViewProps {
  onSaveTransaction: (transaction: Omit<Transaction, 'id' | 'orderId'>) => void;
  onCancel: () => void;
  roundingOption: RoundingOption;
  roundingEnabled: boolean;
  onUpdateRoundingConfig: (option: RoundingOption, enabled: boolean) => void;
}

export const NewTransactionView: React.FC<NewTransactionViewProps> = ({
  onSaveTransaction,
  onCancel,
  roundingOption,
  roundingEnabled,
  onUpdateRoundingConfig,
}) => {
  const [date, setDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [customerName, setCustomerName] = useState<string>('');
  const [customerCategory, setCustomerCategory] = useState<CustomerCategory>('Umum');
  const [orderType, setOrderType] = useState<string>('Spanduk (Flexi Outdoor)');
  const [serviceType, setServiceType] = useState<'design_print' | 'print_only'>('design_print');
  
  // Rate state auto-calculated from category + serviceType
  const [pricePerMeter, setPricePerMeter] = useState<number>(50000);

  const [lengthMeters, setLengthMeters] = useState<number>(1.0);
  const [widthMeters, setWidthMeters] = useState<number>(1.0);
  const [qty, setQty] = useState<number>(1);
  const [useFrame, setUseFrame] = useState<boolean>(false);
  const [customSubtotal, setCustomSubtotal] = useState<number | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Lunas');
  const [notes, setNotes] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>(
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBN8RC8kJUSMeYXjLSoSvKy07wjaG-MzDwX8TVfnM3d_4RM6RY30PgrSHcxuIkFL6PImr4UJbuIDiXG3-Sty9LtTBPL9u0K-FXxE-95v7OOEs66psbIDgqUGm_X5owkO5SrQQo7wPYzo1_VONVdf5gF-d-2xKb4_ArR9nFc1K-3WWLLj4FnFauwEt4zIQ8Le_OZOyZIflJXJEEimVtweK38MbLsoUzUGcDPYL57yw2STcJ__F8qFymVEQ'
  );
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Auto-update price per meter whenever category or serviceType changes
  useEffect(() => {
    let currentService = serviceType;
    if (customerCategory === 'Mitra' && serviceType === 'design_print') {
      currentService = 'print_only';
      setServiceType('print_only');
    }
    const autoPrice = getPricePerMeter(customerCategory, currentService);
    setPricePerMeter(autoPrice);
  }, [customerCategory, serviceType]);

  // Compute area and subtotal
  const rawArea = Math.max(0, lengthMeters) * Math.max(0, widthMeters);
  const isUnderMinArea = rawArea > 0 && rawArea < 1.0;
  const effectiveArea = isUnderMinArea ? 1.0 : rawArea;
  const frameCost = useFrame ? 100000 * Math.max(1, qty) : 0;
  
  const autoRawSubtotal = Math.round(effectiveArea * pricePerMeter * Math.max(1, qty)) + frameCost;
  const rawSubtotal = (isUnderMinArea && customSubtotal !== null) ? customSubtotal : autoRawSubtotal;
  
  // Final total with user rounding rule
  const totalAmount = applyRounding(rawSubtotal, roundingOption, roundingEnabled);
  const roundingDifference = totalAmount - rawSubtotal;

  const formatRupiah = (num: number) => {
    return 'Rp ' + num.toLocaleString('id-ID');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreviewImage(result);
        setImageUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!customerName.trim()) {
      setFormError('Mohon isi nama pelanggan terlebih dahulu!');
      return;
    }

    onSaveTransaction({
      customerName: customerName.trim(),
      customerCategory,
      orderType,
      serviceType,
      lengthMeters,
      widthMeters,
      qty,
      pricePerMeter,
      totalAmount,
      status: paymentStatus,
      date,
      imageUrl: previewImage || imageUrl,
      useFrame,
      notes: notes.trim(),
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Title */}
      <div>
        <h2 className="text-2xl lg:text-3xl font-extrabold text-[#191c1d] tracking-tight">
          New Transaction
        </h2>
        <p className="text-sm text-[#414754] mt-1">
          Input transaksi cetak baru dengan kalkulasi harga otomatis per meter & pembulatan.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {formError && (
          <div className="lg:col-span-12 p-3.5 bg-red-50 text-[#ba1a1a] text-xs font-bold rounded-xl flex items-center gap-2 border border-red-200 animate-fadeIn">
            <span className="material-symbols-outlined text-lg">error</span>
            <span>{formError}</span>
          </div>
        )}
        {/* Left Column - Form Sections */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section 1: Informasi Umum & Kategori Pelanggan */}
          <div className="bg-white border border-[#e1e3e4] p-6 rounded-2xl shadow-2xs">
            <div className="flex items-center gap-2 mb-4 text-[#0059bb]">
              <span className="material-symbols-outlined">person</span>
              <h3 className="font-bold uppercase text-xs tracking-wider">
                Informasi Pelanggan & Jenis Pesanan
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#414754] mb-1.5">
                  Tanggal Pesanan
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[#f8f9fa] border border-[#c1c6d7] rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#0059bb] focus:border-[#0059bb] outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#414754] mb-1.5">
                  Nama Pelanggan *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masukkan nama lengkap"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-[#f8f9fa] border border-[#c1c6d7] rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#0059bb] focus:border-[#0059bb] outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#414754] mb-1.5">
                  Kategori Pelanggan (Penentu Tarif)
                </label>
                <select
                  value={customerCategory}
                  onChange={(e) => setCustomerCategory(e.target.value as CustomerCategory)}
                  className="w-full bg-[#f8f9fa] border border-[#0059bb] rounded-xl p-3 text-sm font-bold text-[#0059bb] focus:ring-2 focus:ring-[#0059bb] outline-none transition-all cursor-pointer"
                >
                  <option value="Umum">Umum (Desain: Rp50k | Cetak: Rp48k)</option>
                  <option value="Persyarikatan">Persyarikatan (Desain: Rp48k | Cetak: Rp45k)</option>
                  <option value="Mitra">Mitra (Cetak Saja: Rp40k)</option>
                  <option value="Kampus">Kampus (Desain: Rp40k | Cetak: Rp38k)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#414754] mb-1.5">
                  Jenis Pesanan Cetak
                </label>
                <select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value)}
                  className="w-full bg-[#f8f9fa] border border-[#c1c6d7] rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#0059bb] focus:border-[#0059bb] outline-none transition-all cursor-pointer font-medium"
                >
                  <option value="Spanduk (Flexi Outdoor)">Spanduk (Flexi Outdoor)</option>
                  <option value="Banner (X-Banner / Roll Up)">Banner (X-Banner / Y-Banner / Roll Up)</option>
                  <option value="Baliho (Large Format)">Baliho (Large Format)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Spesifikasi Cetak & Tarif Otomatis */}
          <div className="bg-white border border-[#e1e3e4] p-6 rounded-2xl shadow-2xs">
            <div className="flex items-center gap-2 mb-4 text-[#0059bb]">
              <span className="material-symbols-outlined">straighten</span>
              <h3 className="font-bold uppercase text-xs tracking-wider">
                Spesifikasi Cetak & Layanan
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#414754] mb-2">
                  Jenis Layanan
                </label>
                <div className="flex flex-wrap gap-6">
                  <label
                    className={`flex items-center gap-2 cursor-pointer group ${
                      customerCategory === 'Mitra' ? 'opacity-40 cursor-not-allowed' : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="serviceType"
                      value="design_print"
                      disabled={customerCategory === 'Mitra'}
                      checked={serviceType === 'design_print'}
                      onChange={() => setServiceType('design_print')}
                      className="text-[#0059bb] focus:ring-[#0059bb]"
                    />
                    <span className="text-sm font-medium group-hover:text-[#0059bb]">
                      Desain + Cetak
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="serviceType"
                      value="print_only"
                      checked={serviceType === 'print_only'}
                      onChange={() => setServiceType('print_only')}
                      className="text-[#0059bb] focus:ring-[#0059bb]"
                    />
                    <span className="text-sm font-medium group-hover:text-[#0059bb]">
                      Cetak Saja
                    </span>
                  </label>
                </div>
                {customerCategory === 'Mitra' && (
                  <p className="text-[11px] text-amber-700 font-medium mt-1">
                    * Kategori Mitra hanya berlaku untuk opsi <strong>Cetak Saja</strong> (Rp 40.000/m²).
                  </p>
                )}
              </div>

              {/* Opsi Rangka */}
              <div>
                <label className="block text-xs font-bold text-[#414754] mb-2">
                  Opsi Rangka
                </label>
                <div className="flex flex-wrap gap-6 bg-[#f8f9fa] border border-[#c1c6d7] p-3 rounded-xl">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="useFrame"
                      checked={!useFrame}
                      onChange={() => setUseFrame(false)}
                      className="text-[#0059bb] focus:ring-[#0059bb]"
                    />
                    <span className="text-sm font-medium group-hover:text-[#0059bb]">
                      Tanpa Rangka
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="useFrame"
                      checked={useFrame}
                      onChange={() => setUseFrame(true)}
                      className="text-[#0059bb] focus:ring-[#0059bb]"
                    />
                    <span className="text-sm font-bold text-[#0059bb] group-hover:underline">
                      Pakai Rangka (+Rp 100.000 / unit)
                    </span>
                  </label>
                </div>
              </div>

              {/* Price Rate Automatic Banner */}
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[#0059bb] text-xl">
                    sell
                  </span>
                  <div>
                    <span className="text-xs font-bold text-[#191c1d]">
                      Harga Otomatis per Meter ({customerCategory} - {serviceType === 'design_print' ? 'Desain+Cetak' : 'Cetak Saja'}):
                    </span>
                    <p className="text-xs text-[#414754]">Ditentukan langsung berdasarkan aturan kategori pelanggan.</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-[#0059bb] text-white px-3 py-1 rounded-lg font-mono font-extrabold text-sm shadow-2xs">
                  {formatRupiah(pricePerMeter)}/m²
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#414754] mb-1.5">
                    Panjang (meter)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={lengthMeters}
                    onChange={(e) => setLengthMeters(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#f8f9fa] border border-[#c1c6d7] rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#0059bb] outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#414754] mb-1.5">
                    Lebar (meter)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={widthMeters}
                    onChange={(e) => setWidthMeters(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#f8f9fa] border border-[#c1c6d7] rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#0059bb] outline-none font-bold"
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-bold text-[#414754] mb-1.5">
                    Jumlah (Qty)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={qty}
                    onChange={(e) => setQty(parseInt(e.target.value) || 1)}
                    className="w-full bg-[#f8f9fa] border border-[#c1c6d7] rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#0059bb] outline-none font-bold"
                  />
                </div>
              </div>

              <div className="p-3 bg-gray-100 rounded-xl flex items-center justify-between text-xs text-gray-600">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">straighten</span>
                  <span>Perhitungan Luas: {lengthMeters}m × {widthMeters}m = {rawArea.toFixed(2)} m² (Min. 1.00 m²)</span>
                </span>
                <span className="font-bold text-gray-800 font-mono">
                  {isUnderMinArea && customSubtotal !== null
                    ? `Manual: ${formatRupiah(customSubtotal)}`
                    : `Efektif: ${effectiveArea.toFixed(2)} m²`}
                </span>
              </div>

              {/* Input Manual Subtotal jika ukuran di bawah 1.00 m² */}
              {isUnderMinArea && (
                <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl space-y-2.5 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                      <span className="material-symbols-outlined text-amber-600 text-base">edit_note</span>
                      <span>Ukuran di bawah 1.00 m² ({rawArea.toFixed(2)} m²) — Isi Subtotal Manual</span>
                    </div>
                    {customSubtotal !== null && (
                      <button
                        type="button"
                        onClick={() => setCustomSubtotal(null)}
                        className="text-[11px] text-amber-800 underline font-semibold hover:text-amber-950 cursor-pointer"
                      >
                        Reset ke Otomatis
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-amber-900 font-bold whitespace-nowrap">
                      Subtotal Manual (Rp):
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      placeholder={`Contoh: ${autoRawSubtotal}`}
                      value={customSubtotal !== null ? customSubtotal : ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomSubtotal(val === '' ? null : Math.max(0, parseInt(val) || 0));
                      }}
                      className="w-full bg-white border border-amber-300 rounded-lg px-3 py-2 text-sm font-bold font-mono text-gray-900 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-amber-800">
                    *Karena ukuran cetak di bawah 1.00 m², Anda dapat mengetik nominal subtotal khusus secara manual.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Aset & Catatan */}
          <div className="bg-white border border-[#e1e3e4] p-6 rounded-2xl shadow-2xs">
            <div className="flex items-center gap-2 mb-4 text-[#0059bb]">
              <span className="material-symbols-outlined">cloud_upload</span>
              <h3 className="font-bold uppercase text-xs tracking-wider">
                Aset Desain & Catatan Produksi
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#414754] mb-1.5">
                  Upload Foto Desain
                </label>
                <div className="border-2 border-dashed border-[#c1c6d7] rounded-2xl p-6 flex flex-col items-center justify-center text-[#414754] hover:border-[#0059bb] hover:bg-blue-50/30 transition-all cursor-pointer relative overflow-hidden group">
                  {previewImage ? (
                    <div className="w-full flex flex-col items-center gap-2">
                      <img
                        src={previewImage}
                        alt="Design Preview"
                        className="h-32 object-contain rounded-lg border border-gray-200"
                      />
                      <p className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        <span>File berhasil diunggah! Klik untuk ganti.</span>
                      </p>
                    </div>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-4xl mb-2 text-[#0059bb]">
                        image
                      </span>
                      <p className="text-sm font-semibold text-[#191c1d]">
                        Tarik file ke sini atau klik untuk browse
                      </p>
                      <p className="text-xs text-gray-500 mt-1">JPG, PNG, PDF (Maks. 25MB)</p>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#414754] mb-1.5">
                  Catatan Tambahan
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Finishing mata ayam 4 sudut, dipress rapi..."
                  className="w-full bg-[#f8f9fa] border border-[#c1c6d7] rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#0059bb] outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Ringkasan Biaya & Pembulatan */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-[#e1e3e4] p-6 rounded-2xl shadow-sm sticky top-6">
            <h3 className="font-bold text-lg text-[#191c1d] mb-4">Ringkasan Biaya</h3>

            <div className="space-y-3 mb-6 text-sm">
              <div className="flex justify-between items-center py-1 border-b border-gray-100">
                <span className="text-[#414754]">Kategori</span>
                <span className="font-bold text-[#0059bb]">{customerCategory}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-100">
                <span className="text-[#414754]">Harga / Meter</span>
                <span className="font-bold text-[#191c1d]">{formatRupiah(pricePerMeter)}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-100">
                <span className="text-[#414754]">Total Luas ({qty}x)</span>
                <span className="font-bold text-[#191c1d]">{(effectiveArea * qty).toFixed(2)} m²</span>
              </div>
              {useFrame && (
                <div className="flex justify-between items-center py-1 border-b border-gray-100 text-xs text-[#0059bb]">
                  <span>Tambahan Rangka ({qty}x)</span>
                  <span className="font-bold font-mono">+{formatRupiah(100000 * qty)}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-1 border-b border-gray-100">
                <span className="text-[#414754]">Subtotal Awal</span>
                <span className="font-mono text-[#191c1d] font-semibold">{formatRupiah(rawSubtotal)}</span>
              </div>
            </div>

            {/* Config Control Section for Rounding directly in form */}
            <div className="mb-5 p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 flex items-center gap-1">
                  <span className="material-symbols-outlined text-base text-[#0059bb]">tune</span>
                  <span>Pengaturan Pembulatan</span>
                </span>
                <button
                  type="button"
                  onClick={() => onUpdateRoundingConfig(roundingOption, !roundingEnabled)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase cursor-pointer ${
                    roundingEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {roundingEnabled ? 'Aktif (Ke Atas)' : 'Matikan'}
                </button>
              </div>

              {roundingEnabled && (
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => onUpdateRoundingConfig('100', true)}
                    className={`py-1 px-2 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                      roundingOption === '100'
                        ? 'bg-[#0059bb] text-white'
                        : 'bg-white border text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Ratusan (+100)
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateRoundingConfig('1000', true)}
                    className={`py-1 px-2 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                      roundingOption === '1000'
                        ? 'bg-[#0059bb] text-white'
                        : 'bg-white border text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Ribuan (+1.000)
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateRoundingConfig('10000', true)}
                    className={`py-1 px-2 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                      roundingOption === '10000'
                        ? 'bg-[#0059bb] text-white'
                        : 'bg-white border text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Puluh Ribuan
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateRoundingConfig('off', false)}
                    className={`py-1 px-2 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                      roundingOption === 'off' || !roundingEnabled
                        ? 'bg-[#0059bb] text-white'
                        : 'bg-white border text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Tanpa Pembulatan
                  </button>
                </div>
              )}

              {roundingEnabled && roundingOption !== 'off' && roundingDifference > 0 && (
                <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg flex justify-between items-center">
                  <span>Dibulatkan Ke Atas:</span>
                  <span className="font-mono font-bold">+{formatRupiah(roundingDifference)}</span>
                </div>
              )}
            </div>

            {/* Calculation Highlight Bar */}
            <div className="calculation-bar p-4 rounded-xl mb-6 text-center shadow-2xs border-2 border-[#ffd600]">
              <p className="text-xs font-bold text-[#000000] uppercase tracking-wider mb-1">
                TOTAL HARGA AKHIR
              </p>
              <p className="text-2xl lg:text-3xl font-extrabold text-[#000000]">
                {formatRupiah(totalAmount)}
              </p>
            </div>

            <hr className="border-[#e1e3e4] mb-6" />

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-[#414754] mb-1.5">
                  Status Pembayaran
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                  className="w-full bg-[#f8f9fa] border border-[#c1c6d7] rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#0059bb] outline-none cursor-pointer font-medium"
                >
                  <option value="Lunas">Lunas</option>
                  <option value="Belum Lunas">Belum Lunas</option>
                  <option value="DP (50%)">DP (Uang Muka 50%)</option>
                  <option value="Produksi">Produksi</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#800000] hover:bg-[#600000] text-white py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">save</span>
              <span>Simpan Transaksi</span>
            </button>

            <button
              type="button"
              onClick={onCancel}
              className="w-full border border-gray-300 text-gray-700 py-2.5 rounded-xl font-bold text-sm mt-3 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Batal
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
