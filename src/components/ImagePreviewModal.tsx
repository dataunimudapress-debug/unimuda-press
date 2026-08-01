import React from 'react';

interface ImagePreviewModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  imageUrl,
  onClose,
}) => {
  if (!imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl w-full max-h-[85vh] bg-white rounded-2xl overflow-hidden shadow-2xl border border-gray-200 p-2 flex flex-col items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-white bg-black/60 hover:bg-black/80 p-2 rounded-full transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-2xl">close</span>
        </button>

        <img
          src={imageUrl}
          alt="Desain Cetak Full View"
          className="w-full max-h-[80vh] object-contain rounded-xl bg-gray-100"
        />

        <div className="w-full text-center py-2 text-xs text-gray-500 font-medium">
          Unimuda Press Design Preview
        </div>
      </div>
    </div>
  );
};
