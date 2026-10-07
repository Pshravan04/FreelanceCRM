import { ReactNode, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

export function BottomSheet({ isOpen, onClose, children, title }: BottomSheetProps) {
  const [isRendered, setIsRendered] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      document.body.style.overflow = 'hidden';
    } else {
      setTimeout(() => setIsRendered(false), 300); // Wait for transition
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isRendered) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div 
        className={cn(
          "absolute inset-0 bg-black/40 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0"
        )} 
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div 
        className={cn(
          "relative bg-[var(--color-background)] w-full rounded-t-2xl shadow-2xl transition-transform duration-300 transform",
          isOpen ? "translate-y-0" : "translate-y-full"
        )}
        style={{
          paddingBottom: 'env(safe-area-inset-bottom)',
          maxHeight: '90vh'
        }}
      >
        {/* Handle */}
        <div className="w-full flex justify-center pt-3 pb-2" onClick={onClose}>
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>
        
        {/* Header */}
        {(title) && (
          <div className="px-6 pb-4 pt-2 flex justify-between items-center border-b border-[var(--color-border)]">
            <h3 className="font-semibold text-lg">{title}</h3>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-[var(--color-muted)]">
              <X size={20} />
            </button>
          </div>
        )}
        
        {/* Content */}
        <div className="overflow-y-auto px-6 py-6 max-h-[calc(90vh-60px)]">
          {children}
        </div>
      </div>
    </div>
  );
}
