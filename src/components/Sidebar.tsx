import React from 'react';
import { NavigationTab } from '../types';

interface SidebarProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  mobileMenuOpen: boolean;
  onCloseMobileMenu: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  mobileMenuOpen,
  onCloseMobileMenu,
}) => {
  return (
    <>
      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 lg:hidden transition-opacity"
          onClick={onCloseMobileMenu}
        />
      )}

      {/* Desktop Sidebar & Mobile Drawer Navigation */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-white border-r border-[#e1e3e4] z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Logo & Header */}
        <div className="p-6 pb-4 border-b border-[#e1e3e4]/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBToZeAfFxyZYmKSGSH38c62UZbCq5wIChepsJesICYKwagjrUhRLZntwJxh6Pj-D7W7kR2Ksmy-d5tDgVsIASmRzIrGAPbf8k_-fHrHhwH0faC3fVX4O9veuL8cXChx0sKhX6s-kSqO_7tYzGKdc42HQy3iREz-Ys1LUBNqCQ5NY4fqIHwaFUHN1sPHzxPHza7dp5hvAIqOu4brE1vV2c0_lIlpkY8oLADWNpqKNTsWHf1YWTr7Fub14of_Z1-wznOPtc"
              alt="Unimuda Press Logo"
              className="w-12 h-12 object-contain"
            />
            <div>
              <h1 className="font-bold text-xl text-[#0059bb] tracking-tight">Unimuda Press</h1>
              <p className="text-xs text-[#414754] font-medium">Management Portal</p>
            </div>
          </div>
          <button
            onClick={onCloseMobileMenu}
            className="lg:hidden text-gray-500 hover:text-gray-700 p-1 rounded-lg"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Main Navigation Items */}
        <nav className="flex-1 px-3 py-2 space-y-1.5 overflow-y-auto">
          <button
            onClick={() => {
              onTabChange('dashboard');
              onCloseMobileMenu();
            }}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-full font-semibold text-sm transition-all ${
              activeTab === 'dashboard'
                ? 'bg-[#0070ea] text-white shadow-md shadow-blue-500/20'
                : 'text-[#414754] hover:bg-[#e7e8e9]/60 hover:text-[#191c1d]'
            }`}
          >
            <span
              className={`material-symbols-outlined ${
                activeTab === 'dashboard' ? 'material-symbols-filled' : ''
              }`}
            >
              dashboard
            </span>
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => {
              onTabChange('new-transaction');
              onCloseMobileMenu();
            }}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-full font-semibold text-sm transition-all ${
              activeTab === 'new-transaction'
                ? 'bg-[#0070ea] text-white shadow-md shadow-blue-500/20'
                : 'text-[#414754] hover:bg-[#e7e8e9]/60 hover:text-[#191c1d]'
            }`}
          >
            <span
              className={`material-symbols-outlined ${
                activeTab === 'new-transaction' ? 'material-symbols-filled' : ''
              }`}
            >
              add_box
            </span>
            <span>New Transaction</span>
          </button>

          <button
            onClick={() => {
              onTabChange('history');
              onCloseMobileMenu();
            }}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-full font-semibold text-sm transition-all ${
              activeTab === 'history'
                ? 'bg-[#0070ea] text-white shadow-md shadow-blue-500/20'
                : 'text-[#414754] hover:bg-[#e7e8e9]/60 hover:text-[#191c1d]'
            }`}
          >
            <span
              className={`material-symbols-outlined ${
                activeTab === 'history' ? 'material-symbols-filled' : ''
              }`}
            >
              history
            </span>
            <span>History</span>
          </button>

          <button
            onClick={() => {
              onTabChange('reports-settings');
              onCloseMobileMenu();
            }}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-full font-semibold text-sm transition-all ${
              activeTab === 'reports-settings'
                ? 'bg-[#0070ea] text-white shadow-md shadow-blue-500/20'
                : 'text-[#414754] hover:bg-[#e7e8e9]/60 hover:text-[#191c1d]'
            }`}
          >
            <span
              className={`material-symbols-outlined ${
                activeTab === 'reports-settings' ? 'material-symbols-filled' : ''
              }`}
            >
              assessment
            </span>
            <span>Reports & Settings</span>
          </button>
        </nav>

        {/* Footer Support & Logout */}
        <div className="mt-auto p-4 border-t border-[#e1e3e4] space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-2.5 text-[#414754] hover:bg-[#e7e8e9] rounded-full text-sm font-medium transition-colors">
            <span className="material-symbols-outlined text-xl">help</span>
            <span>Support</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 text-[#ba1a1a] hover:bg-red-50 rounded-full text-sm font-medium transition-colors">
            <span className="material-symbols-outlined text-xl">logout</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Shell */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 z-40 lg:hidden bg-white border-t border-[#e1e3e4] flex justify-around items-center px-2 shadow-lg">
        <button
          onClick={() => onTabChange('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            activeTab === 'dashboard'
              ? 'text-[#0059bb] font-bold scale-105'
              : 'text-[#414754]'
          }`}
        >
          <span className={`material-symbols-outlined text-2xl ${activeTab === 'dashboard' ? 'material-symbols-filled' : ''}`}>
            dashboard
          </span>
          <span className="text-[10px] tracking-tight">Home</span>
        </button>

        <button
          onClick={() => onTabChange('new-transaction')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            activeTab === 'new-transaction'
              ? 'text-[#0059bb] font-bold scale-105'
              : 'text-[#414754]'
          }`}
        >
          <span className={`material-symbols-outlined text-2xl ${activeTab === 'new-transaction' ? 'material-symbols-filled' : ''}`}>
            add_circle
          </span>
          <span className="text-[10px] tracking-tight">Order</span>
        </button>

        <button
          onClick={() => onTabChange('history')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            activeTab === 'history'
              ? 'text-[#0059bb] font-bold scale-105'
              : 'text-[#414754]'
          }`}
        >
          <span className={`material-symbols-outlined text-2xl ${activeTab === 'history' ? 'material-symbols-filled' : ''}`}>
            receipt_long
          </span>
          <span className="text-[10px] tracking-tight">History</span>
        </button>

        <button
          onClick={() => onTabChange('reports-settings')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            activeTab === 'reports-settings'
              ? 'text-[#0059bb] font-bold scale-105'
              : 'text-[#414754]'
          }`}
        >
          <span className={`material-symbols-outlined text-2xl ${activeTab === 'reports-settings' ? 'material-symbols-filled' : ''}`}>
            bar_chart
          </span>
          <span className="text-[10px] tracking-tight">Reports</span>
        </button>
      </nav>
    </>
  );
};
