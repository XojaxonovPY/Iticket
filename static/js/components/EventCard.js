/**
 * iTicket EventCard Component
 * Displays single event card with date badge, place, price and wishlist toggle with i18n
 */

(function () {
    const { t, formatEventDate, formatPrice } = window.i18n;

    function EventCard({
        event,
        isWishlisted = false,
        onToggleWishlist,
        onSelectEvent,
        language = 'uz',
    }) {
        if (!event) return null;

        const dateInfo = formatEventDate(event.start_datetime, language);

        // Find minimum ticket price
        let minPrice = null;
        if (event.tickets && event.tickets.length > 0) {
            const prices = event.tickets.map((t) => Number(t.price)).filter((p) => !isNaN(p));
            if (prices.length > 0) {
                minPrice = Math.min(...prices);
            }
        }

        const imageUrl = event.image || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80';

        return (
            <div className="event-card group bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs hover:shadow-xl transition-all flex flex-col justify-between cursor-pointer">
                {/* Image & Badges Container */}
                <div
                    className="relative w-full aspect-[16/10] overflow-hidden bg-slate-100"
                    onClick={() => onSelectEvent(event.id)}
                >
                    <img
                        src={imageUrl}
                        alt={event.title}
                        className="event-card-image w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80';
                        }}
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-black/20 pointer-events-none"></div>

                    {/* Date Badge */}
                    {dateInfo.day && (
                        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs text-slate-900 px-3 py-1 rounded-xl shadow-md text-center">
                            <span className="block text-sm font-black leading-none text-rose-600">{dateInfo.day}</span>
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">{dateInfo.month}</span>
                        </div>
                    )}

                    {/* Wishlist Button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleWishlist(event.id);
                        }}
                        className={`absolute top-3 right-3 w-9 h-9 rounded-full backdrop-blur-md flex items-center justify-center transition shadow-md ${
                            isWishlisted
                                ? 'bg-rose-600 text-white hover:bg-rose-700'
                                : 'bg-white/80 text-slate-700 hover:bg-white hover:text-rose-600'
                        }`}
                        title={isWishlisted ? t('remove_from_wishlist', language) : t('add_to_wishlist', language)}
                    >
                        <i className={`fa-heart text-sm ${isWishlisted ? 'fa-solid' : 'fa-regular'}`}></i>
                    </button>

                    {/* Category Pill */}
                    {event.category && (
                        <span className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-md">
                            {event.category.name}
                        </span>
                    )}

                    {/* Age Limit */}
                    {event.restriction && event.restriction.age_limit !== undefined && (
                        <span className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded">
                            {event.restriction.age_limit}+
                        </span>
                    )}
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between" onClick={() => onSelectEvent(event.id)}>
                    <div>
                        {/* Place & Time */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5 truncate">
                            <i className="fa-solid fa-location-dot text-rose-500 text-[11px] flex-shrink-0"></i>
                            <span className="truncate">{event.place?.title || event.place?.name || t('tashkent', language)}</span>
                            {dateInfo.time && (
                                <>
                                    <span className="text-slate-300">•</span>
                                    <span className="flex-shrink-0">{dateInfo.time}</span>
                                </>
                            )}
                        </div>

                        {/* Title */}
                        <h3 className="font-bold text-slate-900 text-sm md:text-base line-clamp-2 leading-snug group-hover:text-rose-600 transition">
                            {event.title}
                        </h3>
                    </div>

                    {/* Price & Action */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div>
                            <span className="text-[10px] text-slate-400 block font-medium">{t('start_price', language)}</span>
                            <span className="text-sm md:text-base font-extrabold text-slate-900">
                                {minPrice !== null ? formatPrice(minPrice, language) : t('free', language)}
                            </span>
                        </div>
                        <span className="px-3 py-1.5 bg-rose-50 group-hover:bg-rose-600 text-rose-600 group-hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5">
                            <span>{t('buy', language)}</span>
                            <i className="fa-solid fa-chevron-right text-[10px]"></i>
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    window.EventCard = EventCard;
})();
