import React from 'react';

interface HeaderProps {
  activeTab: string;
  onMobileMenuToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onMobileMenuToggle,
}) => {
  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-[#e1e3e4] px-4 py-3 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          className="p-1.5 text-[#0059bb] hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Toggle Menu"
        >
          <span className="material-symbols-outlined text-2xl">menu</span>
        </button>
        <div className="flex items-center gap-2">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBToZeAfFxyZYmKSGSH38c62UZbCq5wIChepsJesICYKwagjrUhRLZntwJxh6Pj-D7W7kR2Ksmy-d5tDgVsIASmRzIrGAPbf8k_-fHrHhwH0faC3fVX4O9veuL8cXChx0sKhX6s-kSqO_7tYzGKdc42HQy3iREz-Ys1LUBNqCQ5NY4fqIHwaFUHN1sPHzxPHza7dp5hvAIqOu4brE1vV2c0_lIlpkY8oLADWNpqKNTsWHf1YWTr7Fub14of_Z1-wznOPtc"
            alt="Unimuda Press Logo"
            className="w-8 h-8 object-contain"
          />
          <div>
            <h1 className="font-bold text-base text-[#0059bb] leading-tight">Unimuda Press</h1>
            <p className="text-[10px] text-[#414754]">Management Portal</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="p-2 text-[#414754] hover:bg-gray-100 rounded-full transition-colors relative">
          <span className="material-symbols-outlined text-xl">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <button className="p-1.5 text-[#414754] hover:bg-gray-100 rounded-full transition-colors">
          <span className="material-symbols-outlined text-2xl">account_circle</span>
        </button>
      </div>
    </header>
  );
};
