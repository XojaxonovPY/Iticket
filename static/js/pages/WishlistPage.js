/**
 * iTicket WishlistPage Component
 * Displays user's saved favorite events with i18n
 */

(function () {
    const { useState, useEffect } = React;
    const { EventCard } = window;
    const { t } = window.i18n;

    function WishlistPage({
        wishlistIds = [],
        onToggleWishlist,
        onSelectEvent,
        onNavigate,
        language = 'uz',
    }) {
        const [wishlistEvents, setWishlistEvents] = useState([]);
        const [loading, setLoading] = useState(true);

        useEffect(() => {
            async function fetchWishlist() {
                if (!window.apiServices.auth.isAuthenticated()) {
                    setLoading(false);
                    return;
                }
                setLoading(true);
                try {
                    const res = await window.apiServices.event.getWishlist({}, language);
                    setWishlistEvents(res.items || []);
                } catch (e) {
                    console.error("Wishlist load error:", e);
                } finally {
                    setLoading(false);
                }
            }
            fetchWishlist();
        }, [wishlistIds.length, language]);

        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-200 pb-5">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
                            <span>{t('wishlist', language)}</span>
                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700">
                                {wishlistEvents.length} {t('events_count', language)}
                            </span>
                        </h1>
                        <p className="text-xs text-slate-500 mt-1">{t('wishlist_empty_desc', language)}</p>
                    </div>

                    <button
                        onClick={() => onNavigate('home')}
                        className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition"
                    >
                        <i className="fa-solid fa-arrow-left"></i>
                        <span>{t('back_to_events', language)}</span>
                    </button>
                </div>

                {loading ? (
                    <div className="py-20 text-center space-y-4">
                        <div className="w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="text-xs text-slate-500">{language === 'uz' ? "Sevimlilar yuklanmoqda..." : "Loading wishlist..."}</p>
                    </div>
                ) : wishlistEvents.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {wishlistEvents.map((event) => (
                            <EventCard
                                key={event.id}
                                event={event}
                                isWishlisted={true}
                                onToggleWishlist={onToggleWishlist}
                                onSelectEvent={onSelectEvent}
                                language={language}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="py-20 text-center space-y-4 bg-white rounded-3xl border border-slate-100 p-8">
                        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 mx-auto flex items-center justify-center text-2xl">
                            <i className="fa-regular fa-heart"></i>
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-800">{t('wishlist_empty', language)}</h3>
                            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                                {t('wishlist_empty_desc', language)}
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

    window.WishlistPage = WishlistPage;
})();
