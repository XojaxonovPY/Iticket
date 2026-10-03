/**
 * iTicket EventDetailPage Component
 * Detailed view of an event, venue information, ticket selection matrix, and cart actions with i18n
 */

(function () {
    const { useState, useEffect } = React;
    const { t, formatEventDate, formatPrice } = window.i18n;

    function EventDetailPage({
        eventId,
        onBack,
        onNavigate,
        isWishlisted = false,
        onToggleWishlist,
        onCartUpdated,
        onShowToast,
        language = 'uz',
    }) {
        const [event, setEvent] = useState(null);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState(null);

        // Ticket quantities state: { [ticketId]: count }
        const [selectedTickets, setSelectedTickets] = useState({});
        const [addingToCart, setAddingToCart] = useState(false);

        useEffect(() => {
            let isMounted = true;
            async function fetchEvent() {
                setLoading(true);
                setError(null);
                try {
                    const data = await window.apiServices.event.getEvent(eventId, language);
                    if (isMounted) {
                        setEvent(data);
                        // Initialize ticket quantities
                        const initial = {};
                        if (data.tickets) {
                            data.tickets.forEach((t) => {
                                initial[t.id] = 0;
                            });
                        }
                        setSelectedTickets(initial);
                    }
                } catch (err) {
                    if (isMounted) {
                        setError(err.message || (language === 'uz' ? "Tadbir tafsilotlarini yuklab bo'lmadi" : (language === 'ru' ? "Не удалось загрузить данные мероприятия" : "Failed to load event details")));
                    }
                } finally {
                    if (isMounted) setLoading(false);
                }
            }

            if (eventId) {
                fetchEvent();
            }
            return () => { isMounted = false; };
        }, [eventId, language]);

        function updateTicketCount(ticketId, delta, maxAvailable) {
            setSelectedTickets((prev) => {
                const current = prev[ticketId] || 0;
                const updated = Math.max(0, Math.min(maxAvailable, current + delta));
                return { ...prev, [ticketId]: updated };
            });
        }

        // Calculate total count and total amount of chosen tickets
        const totalSelectedCount = Object.values(selectedTickets).reduce((sum, c) => sum + c, 0);
        let totalSelectedAmount = 0;
        if (event && event.tickets) {
            event.tickets.forEach((tick) => {
                const count = selectedTickets[tick.id] || 0;
                totalSelectedAmount += count * Number(tick.price);
            });
        }

        async function handleAddToCart(goToCheckout = false) {
            if (totalSelectedCount === 0) {
                if (onShowToast) {
                    onShowToast({
                        type: 'warning',
                        message: language === 'uz' ? "Iltimos, avval kamida bitta chipta tanlang" : (language === 'ru' ? "Пожалуйста, выберите хотя бы один билет" : "Please select at least one ticket")
                    });
                }
                return;
            }

            setAddingToCart(true);
            try {
                // Add each selected ticket to cart
                for (const [ticketId, count] of Object.entries(selectedTickets)) {
                    if (count > 0) {
                        await window.apiServices.cart.addToCart(ticketId, count);
                    }
                }

                if (onCartUpdated) onCartUpdated();

                if (onShowToast) {
                    onShowToast({
                        type: 'success',
                        message: language === 'uz' ? "Chiptalar muvaffaqiyatli savatga qo'shildi!" : (language === 'ru' ? "Билеты успешно добавлены в корзину!" : "Tickets successfully added to cart!")
                    });
                }

                if (goToCheckout) {
                    onNavigate('cart');
                }
            } catch (err) {
                if (onShowToast) {
                    onShowToast({ type: 'error', message: err.message || (language === 'uz' ? "Savatga qo'shishda xatolik" : "Error adding to cart") });
                }
            } finally {
                setAddingToCart(false);
            }
        }

        if (loading) {
            return (
                <div className="max-w-5xl mx-auto px-4 py-16 text-center space-y-4">
                    <div className="w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-xs text-slate-500 font-medium">
                        {language === 'uz' ? "Tadbir ma'lumotlari yuklanmoqda..." : (language === 'ru' ? "Загрузка информации о мероприятии..." : "Loading event details...")}
                    </p>
                </div>
            );
        }

        if (error || !event) {
            return (
                <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
                    <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center text-xl mx-auto">
                        <i className="fa-solid fa-triangle-exclamation"></i>
                    </div>
                    <h3 className="text-base font-bold text-slate-800">{error || t('no_events_found', language)}</h3>
                    <button
                        onClick={onBack}
                        className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition"
                    >
                        {t('back_home', language)}
                    </button>
                </div>
            );
        }

        const dateInfo = formatEventDate(event.start_datetime, language);

        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8 animate-fade-in">
                {/* Breadcrumbs & Navigation */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 py-2 px-3 rounded-xl hover:bg-slate-100 transition"
                    >
                        <i className="fa-solid fa-arrow-left"></i>
                        <span>{t('back_to_events', language)}</span>
                    </button>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onToggleWishlist(event.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition border ${
                                isWishlisted
                                    ? 'bg-rose-50 border-rose-200 text-rose-600'
                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                        >
                            <i className={`fa-heart ${isWishlisted ? 'fa-solid text-rose-600' : 'fa-regular'}`}></i>
                            <span>{isWishlisted ? t('in_wishlist', language) : t('add_to_wishlist', language)}</span>
                        </button>
                    </div>
                </div>

                {/* Hero Section */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Poster Card */}
                    <div className="lg:col-span-5">
                        <div className="sticky top-24 bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-xl">
                            <div className="relative aspect-[3/4] bg-slate-100">
                                <img
                                    src={event.image || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80'}
                                    alt={event.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80';
                                    }}
                                />
                                {dateInfo.day && (
                                    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-xs text-slate-900 px-3.5 py-1.5 rounded-2xl shadow-lg text-center">
                                        <span className="block text-base font-black leading-none text-rose-600">{dateInfo.day}</span>
                                        <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">{dateInfo.month}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Details & Ticket Matrix */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* Title & Metadata */}
                        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xs space-y-4">
                            <div className="flex flex-wrap items-center gap-2">
                                {event.category && (
                                    <span className="px-3 py-1 bg-rose-100 text-rose-700 text-xs font-bold rounded-full">
                                        {event.category.name}
                                    </span>
                                )}
                                {event.restriction?.age_limit !== undefined && (
                                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">
                                        {event.restriction.age_limit}+ {t('age_limit', language)}
                                    </span>
                                )}
                                {event.restriction?.dress_code && (
                                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-xs font-medium rounded-full capitalize">
                                        {t('dress_code', language)}: {event.restriction.dress_code}
                                    </span>
                                )}
                            </div>

                            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-snug">
                                {event.title}
                            </h1>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
                                <div className="p-3.5 bg-slate-50 rounded-2xl flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-white shadow-xs text-rose-600 flex items-center justify-center text-sm">
                                        <i className="fa-regular fa-calendar-check"></i>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block text-[11px]">{t('start_time', language)}</span>
                                        <span className="font-bold text-slate-800">{dateInfo.full || t('soon', language)}</span>
                                    </div>
                                </div>

                                <div className="p-3.5 bg-slate-50 rounded-2xl flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-white shadow-xs text-rose-600 flex items-center justify-center text-sm">
                                        <i className="fa-solid fa-location-dot"></i>
                                    </div>
                                    <div className="truncate">
                                        <span className="text-slate-400 block text-[11px]">{t('venue', language)}</span>
                                        <span className="font-bold text-slate-800 truncate block">
                                            {event.place?.title || event.place?.name || t('tashkent', language)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            {event.description && (
                                <div className="pt-2 border-t border-slate-100">
                                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">{t('about_event', language)}</h3>
                                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                                        {event.description}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Ticket Selection Matrix */}
                        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xs space-y-5">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                <div>
                                    <h2 className="text-base font-black text-slate-900">{t('available_tickets', language)}</h2>
                                    <p className="text-xs text-slate-500 mt-0.5">{t('choose_sector_count', language)}</p>
                                </div>
                                <span className="text-xs font-bold text-slate-600 px-2.5 py-1 bg-slate-100 rounded-lg">
                                    {event.tickets ? event.tickets.length : 0} {t('ticket_types_count', language)}
                                </span>
                            </div>

                            {event.tickets && event.tickets.length > 0 ? (
                                <div className="space-y-3">
                                    {event.tickets.map((ticket) => {
                                        const count = selectedTickets[ticket.id] || 0;
                                        const isOutOfStock = ticket.count <= 0;

                                        return (
                                            <div
                                                key={ticket.id}
                                                className={`p-4 rounded-2xl border transition-all ${
                                                    count > 0
                                                        ? 'bg-rose-50/50 border-rose-300 ring-2 ring-rose-200'
                                                        : isOutOfStock
                                                        ? 'bg-slate-50 border-slate-200 opacity-60'
                                                        : 'bg-white border-slate-200 hover:border-slate-300'
                                                }`}
                                            >
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-bold text-sm text-slate-900">{ticket.title}</h4>
                                                            {isOutOfStock ? (
                                                                <span className="text-[10px] font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded">
                                                                    {t('out_of_stock', language)}
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                                                                    {ticket.count} {t('left_count', language)}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {ticket.description && (
                                                            <p className="text-xs text-slate-500">{ticket.description}</p>
                                                        )}
                                                        <div className="text-sm font-extrabold text-rose-600 pt-1">
                                                            {formatPrice(ticket.price, language)}
                                                        </div>
                                                    </div>

                                                    {/* Quantity Controller */}
                                                    {!isOutOfStock && (
                                                        <div className="flex items-center gap-3 self-end sm:self-center">
                                                            <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateTicketCount(ticket.id, -1, ticket.count)}
                                                                    disabled={count === 0}
                                                                    className="w-8 h-8 rounded-lg bg-white text-slate-700 hover:bg-slate-200 flex items-center justify-center text-xs font-bold disabled:opacity-30 transition shadow-2xs"
                                                                >
                                                                    <i className="fa-solid fa-minus"></i>
                                                                </button>
                                                                <span className="w-10 text-center font-bold text-sm text-slate-900">
                                                                    {count}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateTicketCount(ticket.id, 1, ticket.count)}
                                                                    disabled={count >= ticket.count}
                                                                    className="w-8 h-8 rounded-lg bg-white text-slate-700 hover:bg-slate-200 flex items-center justify-center text-xs font-bold disabled:opacity-30 transition shadow-2xs"
                                                                >
                                                                    <i className="fa-solid fa-plus"></i>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-xs text-slate-500 py-4 text-center">{t('no_tickets', language)}</p>
                            )}

                            {/* Total & Checkout Bar */}
                            <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div>
                                    <span className="text-xs text-slate-400 block font-medium">
                                        {t('selected_count', language)}: {totalSelectedCount}
                                    </span>
                                    <span className="text-xl font-black text-slate-900">
                                        {formatPrice(totalSelectedAmount, language)}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                                    <button
                                        type="button"
                                        onClick={() => handleAddToCart(false)}
                                        disabled={addingToCart || totalSelectedCount === 0}
                                        className="flex-1 sm:flex-none px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-40"
                                    >
                                        <i className="fa-solid fa-basket-shopping"></i>
                                        <span>{t('add_to_cart', language)}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleAddToCart(true)}
                                        disabled={addingToCart || totalSelectedCount === 0}
                                        className="flex-1 sm:flex-none px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-rose-600/25 transition flex items-center justify-center gap-2 disabled:opacity-40"
                                    >
                                        <span>{t('checkout_now', language)}</span>
                                        <i className="fa-solid fa-arrow-right"></i>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Venue details box */}
                        {event.place && (
                            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl flex-shrink-0">
                                    <i className="fa-solid fa-landmark"></i>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-sm text-slate-900 truncate">
                                        {event.place.title || event.place.name}
                                    </h4>
                                    <p className="text-xs text-slate-500 truncate">
                                        {t('contact_venue', language)}: {event.place.phone_number || "+998 71 200 00 00"}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    window.EventDetailPage = EventDetailPage;
})();
