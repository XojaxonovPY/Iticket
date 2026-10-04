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
                        className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white py-2 px-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                        <i className="fa-solid fa-arrow-left"></i>
                        <span>{t('back_to_events', language)}</span>
                    </button>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onToggleWishlist(event.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition border ${
                                isWishlisted
                                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400'
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                            }`}
                        >
                            <i className={`fa-heart ${isWishlisted ? 'fa-solid text-rose-600 dark:text-rose-400' : 'fa-regular'}`}></i>
                            <span>{isWishlisted ? t('in_wishlist', language) : t('add_to_wishlist', language)}</span>
                        </button>
                    </div>
                </div>

                {/* Hero Section */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Poster Card */}
                    <div className="lg:col-span-5">
                        <div className="sticky top-24 bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-xl">
                            <div className="relative aspect-[3/4] bg-slate-100 dark:bg-slate-800">
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
                                    <div className="absolute top-4 left-4 bg-white/95 dark:bg-slate-900/90 backdrop-blur-xs text-slate-900 dark:text-white px-3.5 py-1.5 rounded-2xl shadow-lg text-center">
                                        <span className="block text-base font-black leading-none text-rose-600 dark:text-rose-500">{dateInfo.day}</span>
                                        <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">{dateInfo.month}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Details & Ticket Matrix */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* Title & Metadata */}
                        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xs space-y-4">
                            <div className="flex flex-wrap items-center gap-2">
                                {event.category && (
                                    <span className="px-3 py-1 bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-bold rounded-full">
                                        {event.category.name}
                                    </span>
                                )}
                                {event.restriction?.age_limit !== undefined && (
                                    <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-full">
                                        {event.restriction.age_limit}+ {t('age_limit', language)}
                                    </span>
                                )}
                                {event.restriction?.dress_code && (
                                    <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-full capitalize">
                                        {t('dress_code', language)}: {event.restriction.dress_code}
                                    </span>
                                )}
                            </div>

                            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-snug">
                                {event.title}
                            </h1>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
                                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-700 shadow-xs text-rose-600 dark:text-rose-400 flex items-center justify-center text-sm">
                                        <i className="fa-regular fa-calendar-check"></i>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 dark:text-slate-400 block text-[11px]">{t('start_time', language)}</span>
                                        <span className="font-bold text-slate-800 dark:text-slate-100">{dateInfo.full || t('soon', language)}</span>
                                    </div>
                                </div>

                                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl flex items-center gap-3">
                                    {event.place?.image ? (
                                        <img
                                            src={event.place.image}
                                            alt={event.place?.title || event.place?.name}
                                            className="w-10 h-10 rounded-xl object-cover shadow-xs border border-slate-200 dark:border-slate-700 flex-shrink-0"
                                        />
                                    ) : (
                                        <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-700 shadow-xs text-rose-600 dark:text-rose-400 flex items-center justify-center text-sm">
                                            <i className="fa-solid fa-location-dot"></i>
                                        </div>
                                    )}
                                    <div className="truncate">
                                        <span className="text-slate-400 dark:text-slate-400 block text-[11px]">{t('venue', language)}</span>
                                        <span className="font-bold text-slate-800 dark:text-slate-100 truncate block">
                                            {event.place?.title || event.place?.name || t('tashkent', language)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            {event.description && (
                                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">{t('about_event', language)}</h3>
                                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                                        {event.description}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Ticket Selection Matrix */}
                        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xs space-y-5">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                                <div>
                                    <h2 className="text-base font-black text-slate-900 dark:text-white">{t('available_tickets', language)}</h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t('choose_sector_count', language)}</p>
                                </div>
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
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
                                                        ? 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 ring-2 ring-rose-200 dark:ring-rose-900/50'
                                                        : isOutOfStock
                                                        ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-60'
                                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                                }`}
                                            >
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-bold text-sm text-slate-900 dark:text-white">{ticket.title}</h4>
                                                            {isOutOfStock ? (
                                                                <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/60 px-2 py-0.5 rounded">
                                                                    {t('out_of_stock', language)}
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                                                                    {ticket.count} {t('left_count', language)}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {ticket.description && (
                                                            <p className="text-xs text-slate-500 dark:text-slate-400">{ticket.description}</p>
                                                        )}
                                                        <div className="text-sm font-extrabold text-rose-600 dark:text-rose-500 pt-1">
                                                            {formatPrice(ticket.price, language)}
                                                        </div>
                                                    </div>

                                                    {/* Quantity Controller */}
                                                    {!isOutOfStock && (
                                                        <div className="flex items-center gap-3 self-end sm:self-center">
                                                            <div className="flex items-center bg-slate-100 dark:bg-slate-700/60 rounded-xl p-1 border border-slate-200 dark:border-slate-600">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateTicketCount(ticket.id, -1, ticket.count)}
                                                                    disabled={count === 0}
                                                                    className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-xs font-bold disabled:opacity-30 transition shadow-2xs"
                                                                >
                                                                    <i className="fa-solid fa-minus"></i>
                                                                </button>
                                                                <span className="w-10 text-center font-bold text-sm text-slate-900 dark:text-white">
                                                                    {count}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateTicketCount(ticket.id, 1, ticket.count)}
                                                                    disabled={count >= ticket.count}
                                                                    className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-xs font-bold disabled:opacity-30 transition shadow-2xs"
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
                                <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">{t('no_tickets', language)}</p>
                            )}

                            {/* Total & Checkout Bar */}
                            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div>
                                    <span className="text-xs text-slate-400 block font-medium">
                                        {t('selected_count', language)}: {totalSelectedCount}
                                    </span>
                                    <span className="text-xl font-black text-slate-900 dark:text-white">
                                        {formatPrice(totalSelectedAmount, language)}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                                    <button
                                        type="button"
                                        onClick={() => handleAddToCart(false)}
                                        disabled={addingToCart || totalSelectedCount === 0}
                                        className="flex-1 sm:flex-none px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-40"
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
                            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xs overflow-hidden">
                                {event.place.image && (
                                    <div className="w-full h-44 bg-slate-100 dark:bg-slate-800 relative overflow-hidden group">
                                        <img
                                            src={event.place.image}
                                            alt={event.place.title || event.place.name}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent"></div>
                                        <div className="absolute bottom-3 left-4 right-4">
                                            <span className="inline-block px-2 py-0.5 rounded-md bg-rose-600/90 text-white text-[10px] font-bold uppercase tracking-wider mb-1">
                                                {t('venue', language)}
                                            </span>
                                            <h4 className="font-extrabold text-white text-base leading-tight drop-shadow-sm truncate">
                                                {event.place.title || event.place.name}
                                            </h4>
                                        </div>
                                    </div>
                                )}
                                <div className="p-5 space-y-3">
                                    {!event.place.image && (
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center text-xl flex-shrink-0">
                                                <i className="fa-solid fa-landmark"></i>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className="text-[11px] font-semibold text-slate-400 block">{t('venue', language)}</span>
                                                <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                                    {event.place.title || event.place.name}
                                                </h4>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                                        <span className="flex items-center gap-2">
                                            <i className="fa-solid fa-phone text-rose-500"></i>
                                            <span>{event.place.phone_number || "+998 71 200 00 00"}</span>
                                        </span>
                                        {event.latitude && event.longitude && (
                                            <a
                                                href={`https://maps.google.com/?q=${event.latitude},${event.longitude}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-bold transition"
                                            >
                                                <span>{t('view_on_map', language)}</span>
                                                <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                                            </a>
                                        )}
                                    </div>
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
