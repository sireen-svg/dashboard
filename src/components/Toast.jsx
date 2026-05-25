import { useState, useEffect, useCallback } from 'react';

let toastListener = null;

export function showToast(message, type = 'success') {
  if (toastListener) {
    toastListener({ message, type, id: Date.now() });
  }
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    toastListener = (toast) => {
      setToasts((prev) => [...prev, toast]);
    };
    return () => { toastListener = null; };
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.map((t) =>
      t.id === id ? { ...t, leaving: true } : t
    ));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 200);
  }, []);

  useEffect(() => {
    if (toasts.length === 0) return;
    const latest = toasts[toasts.length - 1];
    if (latest.leaving) return;
    const timer = setTimeout(() => removeToast(latest.id), 3000);
    return () => clearTimeout(timer);
  }, [toasts, removeToast]);

  const icons = {
    success: 'bi-check-circle-fill',
    error: 'bi-exclamation-circle-fill',
    info: 'bi-info-circle-fill',
  };

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast-snackbar ${toast.type} ${toast.leaving ? 'leaving' : ''}`}
          onClick={() => removeToast(toast.id)}
        >
          <i className={`bi ${icons[toast.type] || icons.info}`}></i>
          {toast.message}
        </div>
      ))}
    </div>
  );
}
