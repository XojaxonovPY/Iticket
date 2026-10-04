/**
 * iTicket CartPage Component
 * Displays items currently in user or guest session cart with quantities, price tally, and checkout CTA with i18n
 */

(function () {
    const { useState, useEffect } = React;
    const { t, formatPrice, formatEventDate } = window.i18n;

    function CartPage({
        onNavigate,
        onCartUpdated,
        onShowToast,
        language = 'uz',
    }) {
        const [cartEvents, setCartEvents] = useState([]);
        const [loading, setLoading] = useState(true);
        const [updatingTicketId, setUpdatingTicketId] = useState(null);
        const [timeLeft, setTimeLeft] = useState(null);

        async function loadCart() {
            setLoading(true);
            try {
                const data = await window.apiServices.cart.getCart(language);
                setCartEvents(data);
                if (data && data.length > 0) {
                    const firstEv = data[0];
                    if (firstEv?.expires_at) {
                        const remaining = Math.max(0, firstEv.expires_at - Math.floor(Date.now() / 1000));
                        setTimeLeft(remaining);
                    } else if (firstEv?.remaining_seconds != null) {
                        setTimeLeft(firstEv.remaining_seconds);
                    } else {
                        setTimeLeft(900);
                    }
                } else {
                    setTimeLeft(null);
                }
            } catch (err) {
                if (onShowToast) {
                    onShowToast({ type: 'error', message: err.message || (language === 'uz' ? "Savatni yuklab bo'lmadi" : "Failed to load cart") });
                }
            } finally {
                setLoading(false);
            }
        }

        useEffect(() => {
            loadCart();
        }, [language]);

        useEffect(() => {
            if (timeLeft === null || timeLeft <= 0) return;
            const timer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev === null) return null;
                    if (prev <= 1) {
                        clearInterval(timer);
                        if (onShowToast) {
                            onShowToast({
                                type: 'warning',
                                message: t('cart_time_expired_desc', language) || "Savatdagi band qilish vaqti tugadi!"
                            });
                        }
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }, [timeLeft, language]);

        function formatCountdown(totalSec) {
            if (totalSec == null || totalSec < 0) return "00:00";
            const m = Math.floor(totalSec / 60);
            const s = totalSec % 60;
            return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        }

        async function handleUpdateCount(ticketId, newCount) {
            if (newCount <= 0) {
                handleRemove(ticketId);
                return;
            }

            setUpdatingTicketId(ticketId);
            try {
                await window.apiServices.cart.addToCart(ticketId, newCount);
                await loadCart();
                if (onCartUpdated) onCartUpdated();
            } catch (err) {
                if (onShowToast) {
                    onShowToast({ type: 'error', message: err.message || (language === 'uz' ? "Chipta sonini o'zgartirib bo'lmadi" : "Could not update ticket quantity") });
                }
            } finally {
                setUpdatingTicketId(null);
            }
        }

        async function handleRemove(ticketId) {
            setUpdatingTicketId(ticketId);
            try {
                await window.apiServices.cart.removeFromCart(ticketId);
                await loadCart();
                if (onCartUpdated) onCartUpdated();
                if (onShowToast) {
                    onShowToast({
                        type: 'info',
                        message: language === 'uz' ? "Chipta savatdan o'chirildi" : (language === 'ru' ? "Билет удален из корзины" : "Ticket removed from cart")
                    });
                }
            } catch (err) {
                if (onShowToast) {
                    onShowToast({ type: 'error', message: err.message || (language === 'uz' ? "Chiptani o'chirishda xatolik" : "Error removing ticket") });
                }
            } finally {
                setUpdatingTicketId(null);
            }
        }

        // Calculate total amount & count
        let totalAmount = 0;
        let totalCount = 0;
        const allItems = [];

        cartEvents.forEach((ev) => {
            if (ev.tickets) {
                ev.tickets.forEach((tick) => {
                    const count = tick.purchase_count || 1;
                    totalCount += count;
                    totalAmount += count * Number(tick.price);
                    allItems.push({ event: ev, ticket: tick, count });
                });
            }
        });

        if (loading) {
            return (
                <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
                    <div className="w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-xs text-slate-500 font-medium">
                        {language === 'uz' ? "Savat yuklanmoqda..." : (language === 'ru' ? "Загрузка корзины..." : "Loading cart...")}
                    </p>
                </div>
            );
        }

        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-5">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                            <span>{t('shopping_cart', language)}</span>
                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                                {totalCount} {t('tickets_count', language)}
                            </span>
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {t('cart_subtitle', language)}
                        </p>
                    </div>

                    <button
                        onClick={() => onNavigate('home')}
                        className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition"
                    >
                        <i className="fa-solid fa-arrow-left"></i>
                        <span>{t('continue_shopping', language)}</span>
                    </button>
                </div>

                {allItems.length > 0 && timeLeft !== null && (
                    <div className={`p-4 sm:p-5 rounded-3xl border transition-all duration-300 ${
                        timeLeft === 0
                            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200'
                            : timeLeft <= 120
                                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100 shadow-sm animate-pulse'
                                : 'bg-gradient-to-r from-rose-50/80 via-white to-orange-50/60 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/80 border-rose-100 dark:border-slate-800 shadow-xs'
                    }`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3.5">
                                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg flex-shrink-0 ${
                                    timeLeft === 0
                                        ? 'bg-rose-600 text-white'
                                        : timeLeft <= 120
                                            ? 'bg-amber-500 text-white animate-bounce'
                                            : 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                                }`}>
                                    <i className={timeLeft === 0 ? "fa-solid fa-hourglass-end" : "fa-solid fa-stopwatch"}></i>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                                            {timeLeft === 0 ? t('cart_time_expired', language) : t('cart_reservation_title', language)}
                                        </h3>
                                        {timeLeft > 0 && (
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-xl">
                                        {timeLeft === 0 ? t('cart_time_expired_desc', language) : t('cart_reservation_desc', language)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 self-end sm:self-center">
                                {timeLeft === 0 ? (
                                    <button
                                        type="button"
                                        onClick={loadCart}
                                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
                                    >
                                        <i className="fa-solid fa-rotate-right"></i>
                                        <span>{t('refresh_cart', language)}</span>
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-2.5 bg-white dark:bg-slate-800 px-4 py-2.5 rounded-2xl border border-rose-100 dark:border-slate-700 shadow-2xs">
                                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                            {t('cart_time_remaining', language)}:
                                        </span>
                                        <span className={`font-mono text-xl font-black ${
                                            timeLeft <= 120 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                                        }`}>
                                            {formatCountdown(timeLeft)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Progress line */}
                        {timeLeft > 0 && (
                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-3.5 overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ${
                                        timeLeft <= 120 ? 'bg-amber-500' : 'bg-rose-600'
                                    }`}
                                    style={{ width: `${Math.min(100, Math.max(0, (timeLeft / 900) * 100))}%` }}
                                ></div>
                            </div>
                        )}
                    </div>
                )}

                {allItems.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* Cart items list */}
                        <div className="lg:col-span-8 space-y-4">
                            {allItems.map(({ event, ticket, count }) => {
                                const dateInfo = formatEventDate(event.start_datetime, language);
                                const isBusy = updatingTicketId === ticket.id;

                                return (
                                    <div
                                        key={ticket.id}
                                        className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between transition hover:border-slate-200 dark:hover:border-slate-700"
                                    >
                                        <div className="flex items-center gap-4">
                                            {/* Event Thumb */}
                                            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                                                <img
                                                    src={event.image || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80'}
                                                    alt={event.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>

                                            {/* Info */}
                                            <div className="space-y-1">
                                                <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase">
                                                    {event.category?.name || "Tadbir"}
                                                </span>
                                                <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                                                    {event.title}
                                                </h3>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                                    <span>{event.place?.title || event.place?.name}</span>
                                                    {dateInfo.full && (
                                                        <>
                                                            <span>•</span>
                                                            <span>{dateInfo.full}</span>
                                                        </>
                                                    )}
                                                </p>
                                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 pt-0.5">
                                                    {t('sector_type', language)}: <span className="text-slate-900 dark:text-white">{ticket.title}</span>
                                                </p>
                                            </div>
                                        </div>

                                        {/* Counter & Price */}
                                        <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                                            <div className="text-right">
                                                <span className="text-xs text-slate-400 block sm:hidden">{t('price', language)}</span>
                                                <span className="text-base font-extrabold text-slate-900 dark:text-white">
                                                    {formatPrice(Number(ticket.price) * count, language)}
                                                </span>
                                                <span className="text-[11px] text-slate-400 block">
                                                    1 x {formatPrice(ticket.price, language)}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                {/* Counter */}
                                                <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleUpdateCount(ticket.id, count - 1)}
                                                        disabled={isBusy}
                                                        className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center text-xs font-bold transition shadow-2xs disabled:opacity-40"
                                                    >
                                                        <i className="fa-solid fa-minus"></i>
                                                    </button>
                                                    <span className="w-8 text-center font-bold text-xs text-slate-900 dark:text-white">
                                                        {count}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleUpdateCount(ticket.id, count + 1)}
                                                        disabled={isBusy}
                                                        className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center text-xs font-bold transition shadow-2xs disabled:opacity-40"
                                                    >
                                                        <i className="fa-solid fa-plus"></i>
                                                    </button>
                                                </div>

                                                {/* Delete button */}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemove(ticket.id)}
                                                    disabled={isBusy}
                                                    className="w-8 h-8 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center transition"
                                                    title={language === 'uz' ? "O'chirish" : (language === 'ru' ? "Удалить" : "Delete")}
                                                >
                                                    <i className="fa-regular fa-trash-can text-sm"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Order Summary Box */}
                        <div className="lg:col-span-4 sticky top-24">
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl space-y-6">
                                <h3 className="text-base font-black text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                                    {t('order_summary', language)}
                                </h3>

                                <div className="space-y-3 text-xs">
                                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                        <span>{t('total_tickets', language)}:</span>
                                        <span className="font-bold text-slate-900 dark:text-white">{totalCount} {t('events_count', language)}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                        <span>{t('service_fee', language)}:</span>
                                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{t('free_service', language)}</span>
                                    </div>
                                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-baseline">
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">{t('total_payment', language)}:</span>
                                        <span className="text-xl font-black text-rose-600 dark:text-rose-500">
                                            {formatPrice(totalAmount, language)}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => onNavigate('checkout')}
                                    className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-rose-600/30 transition flex items-center justify-center gap-2"
                                >
                                    <span>{t('proceed_checkout', language)}</span>
                                    <i className="fa-solid fa-arrow-right text-xs"></i>
                                </button>

                                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl text-[11px] text-slate-500 dark:text-slate-400 space-y-2">
                                    <p className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300">
                                        <i className="fa-solid fa-shield-check text-emerald-600 dark:text-emerald-400 text-xs"></i>
                                        <span>{t('secure_payment_guarantee', language)}</span>
                                    </p>
                                    <p>{t('secure_payment_desc', language)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="py-20 text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center text-2xl">
                            <i className="fa-solid fa-basket-shopping"></i>
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-800">{t('cart_empty', language)}</h3>
                            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                                {t('cart_empty_desc', language)}
                            </p>
                        </div>
                        <button
                            onClick={() => onNavigate('home')}
                            className="px-5 py-2.5 bg-rose-600 text-white text-xs font-bold rounded-xl shadow-md hover:bg-rose-700 transition"
                        >
                            {t('explore_events', language)}
                        </button>
                    </div>
                )}
            </div>
        );
    }

    window.CartPage = CartPage;
})();
