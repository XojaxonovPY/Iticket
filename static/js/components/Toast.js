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
                                ? 'bg-emerald-50 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                                : toast.type === 'error'
                                ? 'bg-rose-50 dark:bg-rose-950/90 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                                : toast.type === 'warning'
                                ? 'bg-amber-50 dark:bg-amber-950/90 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
                                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                        }`}
                    >
                        <div className="mr-3 mt-0.5 text-base flex-shrink-0">
                            {toast.type === 'success' && <i className="fa-solid fa-circle-check text-emerald-600 dark:text-emerald-400"></i>}
                            {toast.type === 'error' && <i className="fa-solid fa-circle-exclamation text-rose-600 dark:text-rose-400"></i>}
                            {toast.type === 'warning' && <i className="fa-solid fa-triangle-exclamation text-amber-600 dark:text-amber-400"></i>}
                            {toast.type === 'info' && <i className="fa-solid fa-circle-info text-indigo-600 dark:text-indigo-400"></i>}
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
                            className="ml-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
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
