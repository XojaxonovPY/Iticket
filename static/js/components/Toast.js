/**
 * Toast Notification System & Form Validation Helpers
 */

(function () {
    const { useState, useEffect } = React;

    function ToastContainer({ toasts, onRemove }) {
        if (!toasts || toasts.length === 0) return null;

        return (
            <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-3 max-w-md w-full px-4 pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto transform transition-all duration-300 ease-out flex items-start p-4 rounded-xl shadow-lg border text-sm animate-fade-in ${
                            toast.type === 'success'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                : toast.type === 'error'
                                ? 'bg-rose-50 border-rose-200 text-rose-800'
                                : toast.type === 'warning'
                                ? 'bg-amber-50 border-amber-200 text-amber-800'
                                : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                    >
                        <div className="mr-3 mt-0.5 text-base flex-shrink-0">
                            {toast.type === 'success' && <i className="fa-solid fa-circle-check text-emerald-600"></i>}
                            {toast.type === 'error' && <i className="fa-solid fa-circle-exclamation text-rose-600"></i>}
                            {toast.type === 'warning' && <i className="fa-solid fa-triangle-exclamation text-amber-600"></i>}
                            {toast.type === 'info' && <i className="fa-solid fa-circle-info text-indigo-600"></i>}
                        </div>
                        <div className="flex-1">
                            {toast.title && <h5 className="font-semibold mb-0.5">{toast.title}</h5>}
                            <p className="leading-snug">{toast.message}</p>
                            {toast.fieldErrors && Object.keys(toast.fieldErrors).length > 0 && (
                                <ul className="mt-2 text-xs space-y-1 pl-4 list-disc opacity-90">
                                    {Object.entries(toast.fieldErrors).map(([field, msgs]) => (
                                        <li key={field}>
                                            <span className="font-semibold capitalize">{field.replace('_', ' ')}:</span> {Array.isArray(msgs) ? msgs.join(', ') : msgs}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <button
                            onClick={() => onRemove(toast.id)}
                            className="ml-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                        >
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                ))}
            </div>
        );
    }

    function FieldError({ error }) {
        if (!error) return null;
        const msg = Array.isArray(error) ? error[0] : error;
        return (
            <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 animate-fade-in">
                <i className="fa-solid fa-circle-exclamation text-[10px]"></i>
                <span>{msg}</span>
            </p>
        );
    }

    window.ToastContainer = ToastContainer;
    window.FieldError = FieldError;
})();
