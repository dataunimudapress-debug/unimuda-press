import React, { useState, useEffect } from 'react';
import { NavigationTab, Transaction, PaymentStatus, RoundingOption } from './types';
import { INITIAL_TRANSACTIONS } from './data/initialData';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { NewTransactionView } from './components/NewTransactionView';
import { TransactionHistoryView } from './components/TransactionHistoryView';
import { ReportsSettingsView } from './components/ReportsSettingsView';
import { ImagePreviewModal } from './components/ImagePreviewModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('unimuda_transactions');
      return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedImageModal, setSelectedImageModal] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // System Rounding Configurations
  const [roundingOption, setRoundingOption] = useState<RoundingOption>(() => {
    try {
      const saved = localStorage.getItem('unimuda_rounding_option');
      return (saved as RoundingOption) || '10000';
    } catch {
      return '10000';
    }
  });
  const [roundingEnabled, setRoundingEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('unimuda_rounding_enabled');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('unimuda_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('unimuda_rounding_option', roundingOption);
    localStorage.setItem('unimuda_rounding_enabled', JSON.stringify(roundingEnabled));
  }, [roundingOption, roundingEnabled]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleSaveTransaction = (
    newTxData: Omit<Transaction, 'id' | 'orderId'>
  ) => {
    const orderNum = Math.floor(9000 + Math.random() * 999);
    const newTx: Transaction = {
      ...newTxData,
      id: Date.now().toString(),
      orderId: `#UP-${orderNum}`,
    };

    setTransactions((prev) => [newTx, ...prev]);
    showToast(`Transaksi baru ${newTx.orderId} (${newTx.customerName}) berhasil disimpan!`);
    setActiveTab('history');
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    showToast('Transaksi berhasil dihapus dari sistem.');
  };

  const handleUpdateStatus = (id: string, newStatus: PaymentStatus) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );
    showToast(`Status transaksi berhasil diubah menjadi: ${newStatus}`);
  };

  const handleUpdateTransaction = (updatedTx: Transaction) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === updatedTx.id ? updatedTx : t))
    );
    showToast(`Transaksi ${updatedTx.orderId} (${updatedTx.customerName}) berhasil diperbarui!`);
  };

  const handleSaveRoundingConfig = (option: RoundingOption, enabled: boolean) => {
    setRoundingOption(option);
    setRoundingEnabled(enabled);
    showToast(`Pengaturan pembulatan (${!enabled || option === 'off' ? 'Off' : option}) berhasil diperbarui!`);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#191c1d] font-sans">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-[#191c1d] text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-gray-700 animate-slideDown">
          <span className="material-symbols-outlined text-emerald-400 text-xl">
            check_circle
          </span>
          <p className="text-xs font-semibold">{toastMessage}</p>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-gray-400 hover:text-white cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Header Bar */}
      <Header
        activeTab={activeTab}
        onMobileMenuToggle={() => setMobileMenuOpen(true)}
      />

      {/* Main Sidebar & Navigation */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        mobileMenuOpen={mobileMenuOpen}
        onCloseMobileMenu={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <main className="lg:ml-72 pt-16 lg:pt-8 min-h-screen pb-24 px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto">
        {activeTab === 'dashboard' && (
          <DashboardView
            transactions={transactions}
            onNavigateTab={(tab) => {
              setActiveTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenImageModal={(url) => setSelectedImageModal(url)}
          />
        )}

        {activeTab === 'new-transaction' && (
          <NewTransactionView
            onSaveTransaction={handleSaveTransaction}
            onCancel={() => setActiveTab('dashboard')}
            roundingOption={roundingOption}
            roundingEnabled={roundingEnabled}
            onUpdateRoundingConfig={handleSaveRoundingConfig}
          />
        )}

        {activeTab === 'history' && (
          <TransactionHistoryView
            transactions={transactions}
            onDeleteTransaction={handleDeleteTransaction}
            onUpdateStatus={handleUpdateStatus}
            onUpdateTransaction={handleUpdateTransaction}
            roundingOption={roundingOption}
            roundingEnabled={roundingEnabled}
            onOpenImageModal={(url) => setSelectedImageModal(url)}
          />
        )}

        {activeTab === 'reports-settings' && (
          <ReportsSettingsView
            transactions={transactions}
            currentRoundingOption={roundingOption}
            currentRoundingEnabled={roundingEnabled}
            onSaveRoundingConfig={handleSaveRoundingConfig}
          />
        )}
      </main>

      {/* Modals */}
      <ImagePreviewModal
        imageUrl={selectedImageModal}
        onClose={() => setSelectedImageModal(null)}
      />
    </div>
  );
}
