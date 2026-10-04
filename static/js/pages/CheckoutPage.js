/**
 * iTicket CheckoutPage Component
 * Handles customer contact info, order creation via POST /orders/, and payment integration with i18n
 */

(function () {
    const { useState, useEffect } = React;
    const { FieldError } = window;
    const { t, formatPrice } = window.i18n;

    function CheckoutPage({
        currentUser,
        onNavigate,
        onCartUpdated,
        onShowToast,
        language = 'uz',
    }) {
        const [cartEvents, setCartEvents] = useState([]);
        const [loadingCart, setLoadingCart] = useState(true);
        const [submitting, setSubmitting] = useState(false);
        const [orderSuccess, setOrderSuccess] = useState(false);
        const [createdOrderInfo, setCreatedOrderInfo] = useState(null);
        const [timeLeft, setTimeLeft] = useState(null);

        // Buyer details
        const [formData, setFormData] = useState({
            first_name: currentUser?.first_name || '',
            last_name: currentUser?.last_name || '',
            email: currentUser?.email || '',
            phone_number: currentUser?.phone_number || '',
        });

        const [fieldErrors, setFieldErrors] = useState({});
        const [generalError, setGeneralError] = useState('');

        useEffect(() => {
            if (currentUser) {
                setFormData((prev) => ({
                    ...prev,
                    first_name: prev.first_name || currentUser.first_name || '',
                    last_name: prev.last_name || currentUser.last_name || '',
                    email: prev.email || currentUser.email || '',
                    phone_number: prev.phone_number || currentUser.phone_number || '',
                }));
            }
        }, [currentUser]);

        async function loadCart() {
            setLoadingCart(true);
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
                    onShowToast({ type: 'error', message: "Savatni yuklab bo'lmadi" });
                }
            } finally {
                setLoadingCart(false);
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
                                message: t('cart_time_expired_desc', language) || "Band qilish vaqti tugadi!"
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

        // Flatten cart items
        const ticketItems = [];
        let totalAmount = 0;
        let totalCount = 0;

        cartEvents.forEach((ev) => {
            if (ev.tickets) {
                ev.tickets.forEach((tick) => {
                    const count = tick.purchase_count || 1;
                    totalCount += count;
                    totalAmount += count * Number(tick.price);
                    ticketItems.push({
                        ticket_id: tick.id,
                        count: count,
                        title: tick.title,
                        price: tick.price,
                        event_title: ev.title,
                    });
                });
            }
        });

        async function handleSubmitOrder(e) {
            e.preventDefault();
            setFieldErrors({});
            setGeneralError('');

            if (ticketItems.length === 0) {
                setGeneralError(t('cart_empty_desc', language));
                return;
            }

            setSubmitting(true);
            try {
                const cleanedPhone = formData.phone_number.replace(/\D/g, '');
                const payload = {
                    ticket: ticketItems.map((item) => ({
                        ticket_id: item.ticket_id,
                        count: item.count,
                    })),
                    first_name: formData.first_name.trim(),
                    last_name: formData.last_name.trim(),
                    email: formData.email.trim(),
                    phone_number: cleanedPhone,
                };

                const res = await window.apiServices.order.createOrder(payload);

                // Clear cart items in backend
                for (const item of ticketItems) {
                    try {
                        await window.apiServices.cart.removeFromCart(item.ticket_id);
                    } catch (ignore) {}
                }

                if (onCartUpdated) onCartUpdated();

                setCreatedOrderInfo({
                    first_name: formData.first_name,
                    phone_number: formData.phone_number,
                    total_amount: totalAmount,
                    total_count: totalCount,
                    message: res.message || t('order_success', language),
                });
                setOrderSuccess(true);

                if (onShowToast) {
                    onShowToast({
                        type: 'success',
                        title: t('order_success', language, "Buyurtma qabul qilindi!"),
                        message: language === 'uz' ? "Buyurtmangiz qabul qilindi. To'lovni 'Buyurtmalarim' bo'limida amalga oshirishingiz mumkin." : (language === 'ru' ? "Ваш заказ оформлен. Вы можете оплатить его в разделе 'Мои заказы'." : "Your order has been placed. You can proceed with payment in 'My Orders'.")
                    });
                }
            } catch (err) {
                setGeneralError(err.message || (language === 'uz' ? "Buyurtma yaratishda xatolik yuz berdi" : "Error creating order"));
                if (err.fieldErrors) {
                    setFieldErrors(err.fieldErrors);
                }
            } finally {
                setSubmitting(false);
            }
        }

        if (loadingCart) {
            return (
                <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
                    <div className="w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-xs text-slate-500 font-medium">
                        {language === 'uz' ? "Buyurtma ma'lumotlari tayyorlanmoqda..." : (language === 'ru' ? "Подготовка данных заказа..." : "Preparing checkout details...")}
                    </p>
                </div>
            );
        }

        // Order Confirmed State
        if (orderSuccess && createdOrderInfo) {
            return (
                <div className="max-w-2xl mx-auto px-4 py-16 animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-10 border border-slate-100 dark:border-slate-800 shadow-xl text-center space-y-6">
                        <div className="w-20 h-20 bg-amber-50 dark:bg-amber-950/40 text-amber-500 rounded-full flex items-center justify-center text-3xl mx-auto shadow-inner">
                            <i className="fa-solid fa-receipt"></i>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                                {createdOrderInfo.message}
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                                {t('order_pending_payment_notice', language, "Buyurtmangiz muvaffaqiyatli qabul qilindi. To'lovni amalga oshirish uchun 'Buyurtmalarim' bo'limiga o'ting.")}
                            </p>
                        </div>

                        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl text-xs space-y-2.5 text-left max-w-md mx-auto border border-slate-100 dark:border-slate-800">
                            <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                <span>{t('buyer', language, "Xaridor")}:</span>
                                <span className="font-bold text-slate-900 dark:text-white">{createdOrderInfo.first_name}</span>
                            </div>
                            <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                <span>{t('phone_number', language, "Telefon")}:</span>
                                <span className="font-bold text-slate-900 dark:text-white">{createdOrderInfo.phone_number}</span>
                            </div>
                            <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                <span>{t('total_tickets', language, "Jami chiptalar")}:</span>
                                <span className="font-bold text-slate-900 dark:text-white">{createdOrderInfo.total_count} {t('events_count', language, "dona")}</span>
                            </div>
                            <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                <span>Status:</span>
                                <span className="font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-[11px]">
                                    {t('filter_pending', language, "O'tkazma kutilmoqda")}
                                </span>
                            </div>
                            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-baseline">
                                <span className="font-bold text-slate-900 dark:text-white">{t('total_sum', language, "Jami to'lov")}:</span>
                                <span className="font-extrabold text-rose-600 dark:text-rose-400 text-sm">{formatPrice(createdOrderInfo.total_amount, language)}</span>
                            </div>
                        </div>

                        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                            <button
                                onClick={() => onNavigate('orders')}
                                className="w-full sm:w-auto px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-rose-600/25 flex items-center justify-center gap-2"
                            >
                                <i className="fa-solid fa-credit-card"></i>
                                <span>{t('view_my_orders', language, "Buyurtmalarimga o'tish (To'lash)")}</span>
                            </button>
                            <button
                                onClick={() => onNavigate('home')}
                                className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
                            >
                                <i className="fa-solid fa-house"></i>
                                <span>{t('back_home', language, "Bosh sahifa")}</span>
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-5">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white">{t('checkout_title', language)}</h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('checkout_desc', language)}</p>
                    </div>

                    <button
                        onClick={() => onNavigate('cart')}
                        className="text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-1.5 transition"
                    >
                        <i className="fa-solid fa-arrow-left"></i>
                        <span>{t('back_to_cart', language)}</span>
                    </button>
                </div>

                {/* Reservation Countdown Alert */}
                {timeLeft !== null && (
                    <div className={`p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-4 ${
                        timeLeft === 0
                            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200'
                            : timeLeft <= 120
                                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100 shadow-sm animate-pulse'
                                : 'bg-rose-50/70 dark:bg-slate-900 border-rose-100 dark:border-slate-800 shadow-2xs'
                    }`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0 ${
                                timeLeft === 0 ? 'bg-rose-600 text-white' : 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                            }`}>
                                <i className="fa-solid fa-stopwatch"></i>
                            </div>
                            <div>
                                <span className="font-bold text-xs text-slate-900 dark:text-white block">
                                    {timeLeft === 0 ? t('cart_time_expired', language) : t('cart_reservation_title', language)}
                                </span>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                    {timeLeft === 0 ? t('cart_time_expired_desc', language) : t('cart_reservation_desc', language)}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-rose-100 dark:border-slate-700 font-mono text-sm font-black text-rose-600 dark:text-rose-400 flex-shrink-0">
                            <i className="fa-regular fa-clock text-xs"></i>
                            <span>{formatCountdown(timeLeft)}</span>
                        </div>
                    </div>
                )}

                {generalError && (
                    <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 text-xs rounded-2xl flex items-center gap-3">
                        <i className="fa-solid fa-circle-exclamation text-base flex-shrink-0"></i>
                        <span>{generalError}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Buyer Information Form */}
                    <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xs space-y-6">
                        <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <i className="fa-regular fa-user text-rose-600"></i>
                            <span>{t('buyer_info', language)}</span>
                        </h2>

                        <form onSubmit={handleSubmitOrder} id="checkout-form" className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                        {t('first_name', language)} <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.first_name}
                                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                        placeholder={t('first_name', language)}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 dark:focus:ring-rose-900/30 outline-none transition"
                                        required
                                    />
                                    <FieldError error={fieldErrors.first_name} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                        {t('last_name', language)} <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.last_name}
                                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                        placeholder={t('last_name', language)}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 dark:focus:ring-rose-900/30 outline-none transition"
                                        required
                                    />
                                    <FieldError error={fieldErrors.last_name} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                        {t('phone_number', language)} <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.phone_number}
                                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                        placeholder="+998901234567"
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 dark:focus:ring-rose-900/30 outline-none transition"
                                        required
                                    />
                                    <FieldError error={fieldErrors.phone_number} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                        {t('email', language)} <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="example@mail.uz"
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 dark:focus:ring-rose-900/30 outline-none transition"
                                        required
                                    />
                                    <FieldError error={fieldErrors.email} />
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-xs text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800 flex items-start gap-2.5">
                                <i className="fa-solid fa-envelope-circle-check text-rose-600 mt-0.5 text-sm"></i>
                                <span>{t('email_tickets_notice', language)}</span>
                            </div>
                        </form>
                    </div>

                    {/* Order summary sidebar */}
                    <div className="lg:col-span-5 sticky top-24 space-y-6">
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl space-y-5">
                            <h3 className="text-base font-black text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                                {t('selected_tickets_summary', language)}
                            </h3>

                            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                                {ticketItems.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-start text-xs pb-3 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0">
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white">{item.event_title}</p>
                                            <p className="text-slate-500 dark:text-slate-400">{item.title} x {item.count}</p>
                                        </div>
                                        <span className="font-extrabold text-slate-900 dark:text-white whitespace-nowrap">
                                            {formatPrice(Number(item.price) * item.count, language)}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                    <span>{t('total_tickets', language)}:</span>
                                    <span className="font-bold text-slate-900 dark:text-white">{totalCount} {t('events_count', language)}</span>
                                </div>
                                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                    <span>{t('service_fee', language)}:</span>
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{t('free_service', language)}</span>
                                </div>
                                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-baseline">
                                    <span className="text-sm font-bold text-slate-900 dark:text-white">{t('total_sum', language)}:</span>
                                    <span className="text-xl font-black text-rose-600 dark:text-rose-400">
                                        {formatPrice(totalAmount, language)}
                                    </span>
                                </div>
                            </div>

                            <button
                                type="submit"
                                form="checkout-form"
                                disabled={submitting || ticketItems.length === 0}
                                className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-rose-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {submitting ? (
                                    <i className="fa-solid fa-circle-notch fa-spin"></i>
                                ) : (
                                    <>
                                        <i className="fa-solid fa-check"></i>
                                        <span>{t('confirm_order', language)}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    window.CheckoutPage = CheckoutPage;
})();
