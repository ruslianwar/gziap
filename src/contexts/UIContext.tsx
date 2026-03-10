import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface UIContextType {
    showToast: (message: string, type?: ToastType) => void;
    showConfirm: (message: string, onConfirm: () => void, onCancel?: () => void) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const useUI = () => {
    const context = useContext(UIContext);
    if (!context) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
};

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
    const [confirmState, setConfirmState] = useState<{
        message: string;
        onConfirm: () => void;
        onCancel?: () => void;
    } | null>(null);

    const showToast = (message: string, type: ToastType = 'info') => {
        setToast({ message, type });
        setTimeout(() => {
            setToast(null);
        }, 3500);
    };

    const showConfirm = (message: string, onConfirm: () => void, onCancel?: () => void) => {
        setConfirmState({ message, onConfirm, onCancel });
    };

    const handleConfirm = () => {
        if (confirmState?.onConfirm) confirmState.onConfirm();
        setConfirmState(null);
    };

    const handleCancel = () => {
        if (confirmState?.onCancel) confirmState.onCancel();
        setConfirmState(null);
    };

    return (
        <UIContext.Provider value={{ showToast, showConfirm }}>
            {children}

            {/* GLOBAL TOAST - BOTTOM RIGHT */}
            {toast && (
                <div style={{
                    position: 'fixed',
                    bottom: 24,
                    right: 24,
                    zIndex: 9999,
                    background: toast.type === 'success' ? '#10b981' :
                        toast.type === 'error' ? '#ef4444' :
                            toast.type === 'warning' ? '#f59e0b' : '#3b82f6',
                    color: '#fff',
                    padding: '16px 24px',
                    borderRadius: 12,
                    fontWeight: 600,
                    fontSize: 14,
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    animation: 'slideInRight 0.3s ease-out'
                }}>
                    <span style={{ fontSize: 18 }}>
                        {toast.type === 'success' && '✅'}
                        {toast.type === 'error' && '❌'}
                        {toast.type === 'warning' && '⚠️'}
                        {toast.type === 'info' && 'ℹ️'}
                    </span>
                    {toast.message}
                </div>
            )}

            {/* GLOBAL CONFIRM MODAL */}
            {confirmState && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15, 23, 42, 0.6)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10000,
                    animation: 'fadeIn 0.2s ease-out'
                }}>
                    <div style={{
                        background: '#fff',
                        padding: 32,
                        borderRadius: 16,
                        width: '90%',
                        maxWidth: 400,
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
                        <h3 style={{ margin: '0 0 12px 0', fontSize: 20, color: '#1e293b' }}>Konfirmasi Tindakan</h3>
                        <p style={{ color: '#64748b', fontSize: 15, marginBottom: 28, lineHeight: 1.5 }}>
                            {confirmState.message.split('\n').map((line, i) => (
                                <React.Fragment key={i}>{line}<br /></React.Fragment>
                            ))}
                        </p>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                            <button
                                onClick={handleCancel}
                                style={{
                                    padding: '10px 20px',
                                    background: '#f1f5f9',
                                    color: '#475569',
                                    border: 'none',
                                    borderRadius: 8,
                                    fontWeight: 600,
                                    fontSize: 14,
                                    cursor: 'pointer',
                                    flex: 1
                                }}
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleConfirm}
                                style={{
                                    padding: '10px 20px',
                                    background: '#ef4444',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 8,
                                    fontWeight: 600,
                                    fontSize: 14,
                                    cursor: 'pointer',
                                    flex: 1
                                }}
                            >
                                Ya, Lanjutkan
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Hapus CSS animation lokal dan pertimbangkan pindah ke index.css nantiya. Sementara inline ok karena fallback browser */}
            <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
        </UIContext.Provider>
    );
};
