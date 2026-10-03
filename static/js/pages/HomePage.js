/**
 * iTicket HomePage Component
 * Includes Hero banner, category filters, event grid, search & features section with i18n
 */

(function () {
    const { useState, useEffect } = React;
    const { EventCard } = window;
    const { t } = window.i18n;

    function HomePage({
        events = [],
        loading = false,
        categories = [],
        selectedCategory,
        onSelectCategory,
        searchQuery,
        wishlistIds = [],
        onToggleWishlist,
        onSelectEvent,
        onNavigate,
        language = 'uz',
    }) {
        const [heroIndex, setHeroIndex] = useState(0);

        // Featured events for top banner
        const featuredEvents = events.slice(0, 5);

        // Rotate banner automatically every 6 seconds
        useEffect(() => {
            if (featuredEvents.length <= 1) return;
            const timer = setInterval(() => {
                setHeroIndex((prev) => (prev + 1) % featuredEvents.length);
            }, 6000);
            return () => clearInterval(timer);
        }, [featuredEvents.length]);

        const currentHero = featuredEvents[heroIndex] || events[0];

        return (
            <div className="space-y-10 pb-12">
                {/* Hero Banner Section */}
                {currentHero && (
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
                        <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-slate-950 aspect-[21/9] min-h-[340px] md:min-h-[420px] flex items-end">
                            {/* Background Image */}
                            <img
                                src={currentHero.image || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&auto=format&fit=crop&q=80'}
                                alt={currentHero.title}
                                className="absolute inset-0 w-full h-full object-cover object-center opacity-65 transition-all duration-700 ease-out transform scale-100 hover:scale-102"
                            />

                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent"></div>

                            {/* Content */}
                            <div className="relative z-10 p-6 md:p-12 w-full max-w-3xl space-y-3">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="px-3 py-1 bg-rose-600 text-white text-xs font-bold rounded-full uppercase tracking-wider">
                                        {currentHero.category?.name || "Tadbir"}
                                    </span>
                                    {currentHero.restriction?.age_limit !== undefined && (
                                        <span className="px-2 py-0.5 bg-white/20 backdrop-blur-md text-white text-xs font-bold rounded">
                                            {currentHero.restriction.age_limit}+
                                        </span>
                                    )}
                                </div>

                                <h1 className="text-2xl md:text-4xl lg:text-5xl font-black text-white leading-tight drop-shadow-md">
                                    {currentHero.title}
                                </h1>

                                <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm text-slate-300 pt-1">
                                    <span className="flex items-center gap-1.5">
                                        <i className="fa-solid fa-location-dot text-rose-500"></i>
                                        <span>{currentHero.place?.title || currentHero.place?.name}</span>
                                    </span>
                                    {currentHero.start_datetime && (
                                        <span className="flex items-center gap-1.5">
                                            <i className="fa-regular fa-calendar text-rose-500"></i>
                                            <span>
                                                {new Date(currentHero.start_datetime).toLocaleDateString(language === 'uz' ? 'uz-UZ' : (language === 'ru' ? 'ru-RU' : 'en-US'), {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </span>
                                        </span>
                                    )}
                                </div>

                                <div className="pt-3 flex items-center gap-3">
                                    <button
                                        onClick={() => onSelectEvent(currentHero.id)}
                                        className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl text-sm shadow-lg shadow-rose-600/30 transition transform hover:-translate-y-0.5 flex items-center gap-2"
                                    >
                                        <i className="fa-solid fa-ticket-simple"></i>
                                        <span>{t('buy_ticket', language)}</span>
                                    </button>
                                    <button
                                        onClick={() => onToggleWishlist(currentHero.id)}
                                        className={`w-12 h-12 rounded-2xl backdrop-blur-md border border-white/20 flex items-center justify-center transition ${
                                            wishlistIds.includes(currentHero.id)
                                                ? 'bg-rose-600 text-white'
                                                : 'bg-white/10 text-white hover:bg-white/20'
                                        }`}
                                    >
                                        <i className={`fa-heart text-base ${wishlistIds.includes(currentHero.id) ? 'fa-solid' : 'fa-regular'}`}></i>
                                    </button>
                                </div>
                            </div>

                            {/* Carousel Indicators */}
                            {featuredEvents.length > 1 && (
                                <div className="absolute bottom-6 right-6 z-10 hidden sm:flex items-center gap-1.5">
                                    {featuredEvents.map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setHeroIndex(i)}
                                            className={`h-2 rounded-full transition-all duration-300 ${
                                                i === heroIndex ? 'w-8 bg-rose-600' : 'w-2 bg-white/40 hover:bg-white/70'
                                            }`}
                                        ></button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Main Events Grid Header */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
                        <div>
                            <h2 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-2.5">
                                <span>
                                    {selectedCategory
                                        ? categories.find((c) => c.id === selectedCategory)?.name
                                        : (searchQuery ? `"${searchQuery}" ${t('search_results_for', language)}` : t('all_events', language))}
                                </span>
                                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                    {events.length} {t('events_count', language)}
                                </span>
                            </h2>
                            <p className="text-xs text-slate-500 mt-1">
                                {t('home_subtitle', language)}
                            </p>
                        </div>

                        {/* Quick filter pills */}
                        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
                            {selectedCategory && (
                                <button
                                    onClick={() => onSelectCategory(null)}
                                    className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
                                >
                                    <span>{t('clear_filter', language)}</span>
                                    <i className="fa-solid fa-xmark text-xs"></i>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Events Grid */}
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-6">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                                <div key={n} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs animate-pulse">
                                    <div className="aspect-[16/10] bg-slate-200"></div>
                                    <div className="p-4 space-y-3">
                                        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                                        <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                                        <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                                            <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                                            <div className="h-6 bg-slate-200 rounded w-16"></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : events.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-6">
                            {events.map((event) => (
                                <EventCard
                                    key={event.id}
                                    event={event}
                                    isWishlisted={wishlistIds.includes(event.id)}
                                    onToggleWishlist={onToggleWishlist}
                                    onSelectEvent={onSelectEvent}
                                    language={language}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="py-20 text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center text-2xl">
                                <i className="fa-solid fa-calendar-xmark"></i>
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-800">{t('no_events_found', language)}</h3>
                                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                                    {t('no_events_desc', language)}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    onSelectCategory(null);
                                }}
                                className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl shadow hover:bg-rose-700 transition"
                            >
                                {t('view_all_events', language)}
                            </button>
                        </div>
                    )}
                </div>

                {/* Features Section (Why iTicket) */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10">
                    <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 md:p-12 text-white">
                        <div className="text-center max-w-xl mx-auto mb-10">
                            <h2 className="text-xl md:text-2xl font-black">{t('why_iticket', language)}</h2>
                            <p className="text-xs text-slate-400 mt-1">
                                {t('why_subtitle', language)}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-rose-600/20 text-rose-500 flex items-center justify-center text-xl flex-shrink-0 border border-rose-500/20">
                                    <i className="fa-solid fa-bolt"></i>
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-white mb-1">{t('fast_easy', language)}</h4>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        {t('fast_easy_desc', language)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 text-emerald-500 flex items-center justify-center text-xl flex-shrink-0 border border-emerald-500/20">
                                    <i className="fa-solid fa-shield-check"></i>
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-white mb-1">{t('official_safe', language)}</h4>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        {t('official_safe_desc', language)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-500 flex items-center justify-center text-xl flex-shrink-0 border border-blue-500/20">
                                    <i className="fa-solid fa-headset"></i>
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-white mb-1">{t('support_247', language)}</h4>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        {t('support_247_desc', language)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    window.HomePage = HomePage;
})();
