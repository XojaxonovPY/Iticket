/**
 * iTicket Reusable UI Primitives Library
 * Standard, theme-driven atomic components (Card, Button, Input, Badge)
 * Automatically inherits design tokens without writing duplicate dark:... classes
 */

(function () {
    const UI = {};

    /**
     * Card Component
     * Standard container with theme background, borders, and shadows
     */
    UI.Card = function Card({ children, className = '', hoverable = false, ...props }) {
        const hoverClasses = hoverable ? 'hover:shadow-md hover:border-border-hover cursor-pointer' : '';
        return (
            <div
                className={`bg-card text-text-main border border-border-card rounded-3xl p-6 shadow-xs transition-all duration-200 ${hoverClasses} ${className}`}
                {...props}
            >
                {children}
            </div>
        );
    };

    /**
     * Button Component
     * Standard interactive button with primary, secondary, outline, ghost styles & loading state
     */
    UI.Button = function Button({
        children,
        variant = 'primary',
        size = 'md',
        loading = false,
        disabled = false,
        className = '',
        icon = null,
        ...props
    }) {
        const baseClasses = 'inline-flex items-center justify-center font-bold rounded-xl transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed';

        const sizeClasses = {
            sm: 'px-3 py-1.5 text-xs gap-1.5',
            md: 'px-5 py-2.5 text-xs gap-2',
            lg: 'px-6 py-3.5 text-sm gap-2.5',
        }[size] || 'px-5 py-2.5 text-xs gap-2';

        const variantClasses = {
            primary: 'bg-primary hover:bg-primary-hover text-white shadow-md shadow-primary/25',
            secondary: 'bg-subtle hover:bg-card-hover text-text-main border border-border-subtle',
            outline: 'bg-transparent border border-border-card text-text-main hover:bg-subtle',
            ghost: 'bg-transparent text-text-secondary hover:text-text-main hover:bg-subtle',
            danger: 'bg-status-danger hover:opacity-90 text-white shadow-md shadow-status-danger/25',
        }[variant] || 'bg-primary text-white';

        return (
            <button
                disabled={disabled || loading}
                className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
                {...props}
            >
                {loading ? (
                    <i className="fa-solid fa-circle-notch fa-spin text-sm"></i>
                ) : (
                    <>
                        {icon && <i className={icon}></i>}
                        {children}
                    </>
                )}
            </button>
        );
    };

    /**
     * Input Component
     * Standard text/number/email/tel input with theme styling and error border
     */
    UI.Input = function Input({
        error = null,
        className = '',
        ...props
    }) {
        const errorClasses = error
            ? 'border-status-danger focus:ring-status-danger/30'
            : 'border-border-subtle focus:border-primary focus:ring-primary/20';

        return (
            <input
                className={`w-full px-4 py-2.5 bg-input text-text-main placeholder-text-muted rounded-xl text-sm border focus:bg-card focus:ring-2 outline-none transition duration-150 ${errorClasses} ${className}`}
                {...props}
            />
        );
    };

    /**
     * Badge Component
     * Status indicator (success, warning, danger, neutral, primary)
     */
    UI.Badge = function Badge({
        children,
        variant = 'neutral',
        size = 'md',
        className = '',
        ...props
    }) {
        const sizeClasses = {
            sm: 'px-2 py-0.5 text-[10px]',
            md: 'px-2.5 py-1 text-xs',
            lg: 'px-3 py-1.5 text-sm',
        }[size] || 'px-2.5 py-1 text-xs';

        const variantClasses = {
            primary: 'bg-primary-light text-primary',
            success: 'bg-status-success-bg text-status-success',
            warning: 'bg-status-warning-bg text-status-warning',
            danger: 'bg-status-danger-bg text-status-danger',
            info: 'bg-status-info-bg text-status-info',
            neutral: 'bg-subtle text-text-secondary',
        }[variant] || 'bg-subtle text-text-secondary';

        return (
            <span
                className={`inline-flex items-center font-bold rounded-full ${sizeClasses} ${variantClasses} ${className}`}
                {...props}
            >
                {children}
            </span>
        );
    };

    window.UI = UI;
})();
