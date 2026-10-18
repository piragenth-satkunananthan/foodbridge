import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {/* Toast Container */}
      <div className="toast-container">
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';

          return (
            <div key={toast.id} className={`toast-card toast-${toast.type}`}>
              <div className="toast-icon">
                {isSuccess && <CheckCircle2 size={18} />}
                {isError && <AlertCircle size={18} />}
                {!isSuccess && !isError && <Info size={18} />}
              </div>
              <div className="toast-message">{toast.message}</div>
              <button onClick={() => removeToast(toast.id)} className="toast-close">
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
