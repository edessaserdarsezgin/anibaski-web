"use client";

type Props = {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
};

export default function LegalModal({ title, children, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <h2 className="font-serif text-xl text-text">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-bg flex items-center justify-center text-text-light hover:bg-border transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {children}
        </div>
        <div className="px-6 py-4 border-t border-border flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 border border-border rounded-full text-sm font-semibold text-text-light hover:border-primary hover:text-primary transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
