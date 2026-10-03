/**
 * iTicket Navbar Component
 * Replicates the authentic iticket.uz navigation bar & category header with multi-language support
 */

(function () {
    const { useState, useEffect, useRef } = React;
    const { t } = window.i18n;

    function Navbar({
        categories = [],
        selectedCategory,
        onSelectCategory,
        searchQuery,
        onSearchChange,
        currentLanguage = 'uz',
        onLanguageChange,
        currentTheme = 'light',
        onToggleTheme,
        cartCount = 0,
        wishlistCount = 0,
        currentUser,
        onOpenAuth,
        onLogout,
        onNavigate,
    }) {
        const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
        const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
        const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
        const userMenuRef = useRef(null);
        const langMenuRef = useRef(null);

        // Close dropdowns on outside click
        useEffect(() => {
            function handleClickOutside(e) {
                if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
                    setIsUserMenuOpen(false);
                }
                if (langMenuRef.current && !langMenuRef.current.contains(e.target)) {
                    setIsLangMenuOpen(false);
                }
            }
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }, []);

        const languages = [
            { code: 'uz', label: "O'zbekcha", flag: '🇺🇿' },
            { code: 'ru', label: 'Русский', flag: '🇷🇺' },
            { code: 'en', label: 'English', flag: '🇬🇧' },
        ];

        return (
            <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 shadow-xs transition-colors duration-200">
                {/* Top Info Bar */}
                <div className="bg-slate-900 dark:bg-slate-950 text-slate-300 text-xs py-1.5 px-4 hidden md:block border-b border-slate-800/60">
                    <div className="max-w-7xl mx-auto flex justify-between items-center">
                        <div className="flex items-center gap-6">
                            <span className="flex items-center gap-2">
                                <i className="fa-solid fa-phone text-rose-500 text-[11px]"></i>
                                <a href="tel:+998712071071" className="hover:text-white transition font-medium">
                                    +998 71 207 10 71
                                </a>
                            </span>
                            <span className="flex items-center gap-2 text-slate-400">
                                <i className="fa-regular fa-clock text-[11px]"></i>
                                <span>{t('phone_hours', currentLanguage)}</span>
                            </span>
                        </div>
                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => onNavigate('outlets')}
                                className="hover:text-white transition flex items-center gap-1.5"
                            >
                                <i className="fa-solid fa-location-dot text-rose-500"></i>
                                <span>{t('sales_outlets', currentLanguage)}</span>
                            </button>
                            <button
                                onClick={() => onNavigate('faq')}
                                className="hover:text-white transition flex items-center gap-1.5"
                            >
                                <i className="fa-regular fa-circle-question text-rose-500"></i>
                                <span>{t('faq', currentLanguage)}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Navigation Bar */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
                    <div className="flex items-center justify-between gap-4">
                        {/* Mobile Menu Button & Brand */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white focus:outline-none"
                                aria-label="Menyu"
                            >
                                <i className="fa-solid fa-bars text-xl"></i>
                            </button>

                            <button
                                onClick={() => onNavigate('home')}
                                className="flex items-center gap-2.5 focus:outline-none group"
                            >
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-red-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20 group-hover:scale-105 transition">
                                    <i className="fa-solid fa-ticket-simple text-xl -rotate-12"></i>
                                </div>
                                <div className="text-left">
                                    <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                                        iTicket<span className="text-rose-600">.uz</span>
                                    </span>
                                </div>
                            </button>
                        </div>

                        {/* Search Bar */}
                        <div className="flex-1 max-w-md hidden md:block">
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                    <i className="fa-solid fa-magnifying-glass text-sm"></i>
                                </span>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => onSearchChange(e.target.value)}
                                    placeholder={t('search_placeholder', currentLanguage)}
                                    className="w-full pl-10 pr-9 py-2.5 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-full border border-transparent dark:border-slate-700 focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20 transition outline-none"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => onSearchChange('')}
                                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                    >
                                        <i className="fa-solid fa-xmark text-xs"></i>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Actions (Theme, Language, Wishlist, Cart, User) */}
                        <div className="flex items-center gap-2 sm:gap-3">
                            {/* Theme Toggle Button */}
                            <button
                                onClick={onToggleTheme}
                                className="flex items-center gap-1.5 px-2.5 py-2 text-xs font-semibold rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition"
                                title={currentTheme === 'dark' ? t('theme_light', currentLanguage) : t('theme_dark', currentLanguage)}
                                aria-label="Mavzuni almashtirish"
                            >
                                {currentTheme === 'dark' ? (
                                    <>
                                        <i className="fa-solid fa-sun text-amber-400 text-sm"></i>
                                        <span className="hidden xl:inline text-[11px]">{t('theme_light', currentLanguage)}</span>
                                    </>
                                ) : (
                                    <>
                                        <i className="fa-solid fa-moon text-indigo-500 text-sm"></i>
                                        <span className="hidden xl:inline text-[11px]">{t('theme_dark', currentLanguage)}</span>
                                    </>
                                )}
                            </button>

                            {/* Language Switcher */}
                            <div className="relative" ref={langMenuRef}>
                                <button
                                    onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 transition"
                                >
                                    <span>{languages.find((l) => l.code === currentLanguage)?.flag}</span>
                                    <span className="uppercase">{currentLanguage}</span>
                                    <i className="fa-solid fa-chevron-down text-[10px] text-slate-400"></i>
                                </button>

                                {isLangMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-1.5 z-50 animate-fade-in">
                                        {languages.map((l) => (
                                            <button
                                                key={l.code}
                                                onClick={() => {
                                                    onLanguageChange(l.code);
                                                    setIsLangMenuOpen(false);
                                                }}
                                                className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/60 transition ${
                                                    currentLanguage === l.code ? 'font-bold text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-200'
                                                }`}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <span>{l.flag}</span>
                                                    <span>{l.label}</span>
                                                </span>
                                                {currentLanguage === l.code && (
                                                    <i className="fa-solid fa-check text-rose-600 dark:text-rose-400 text-xs"></i>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Wishlist Button */}
                            <button
                                onClick={() => onNavigate('wishlist')}
                                className="relative p-2.5 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-full transition"
                                title={t('wishlist', currentLanguage)}
                            >
                                <i className="fa-regular fa-heart text-lg"></i>
                                {wishlistCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 bg-rose-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                                        {wishlistCount > 9 ? '9+' : wishlistCount}
                                    </span>
                                )}
                            </button>

                            {/* Cart Button */}
                            <button
                                onClick={() => onNavigate('cart')}
                                className="relative p-2.5 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-full transition"
                                title={t('cart', currentLanguage)}
                            >
                                <i className="fa-solid fa-basket-shopping text-lg"></i>
                                {cartCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 bg-rose-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                                        {cartCount > 9 ? '9+' : cartCount}
                                    </span>
                                )}
                            </button>

                            {/* User Account / Login Button */}
                            {currentUser ? (
                                <div className="relative" ref={userMenuRef}>
                                    <button
                                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                        className="flex items-center gap-2 pl-2 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-full text-xs font-semibold transition"
                                    >
                                        <div className="w-7 h-7 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs font-bold">
                                            {currentUser.first_name ? currentUser.first_name[0].toUpperCase() : 'U'}
                                        </div>
                                        <span className="hidden sm:inline-block max-w-[100px] truncate">
                                            {currentUser.first_name || currentUser.phone_number || t('profile', currentLanguage)}
                                        </span>
                                        <i className="fa-solid fa-chevron-down text-[10px] text-slate-400"></i>
                                    </button>

                                    {isUserMenuOpen && (
                                        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 py-2 z-50 animate-fade-in">
                                            <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700">
                                                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                                    {currentUser.first_name ? `${currentUser.first_name} ${currentUser.last_name || ''}` : t('profile', currentLanguage)}
                                                </p>
                                                <p className="text-[11px] text-slate-400 truncate">
                                                    {currentUser.phone_number || currentUser.email}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setIsUserMenuOpen(false);
                                                    onNavigate('profile');
                                                }}
                                                className="w-full px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center gap-2.5 transition"
                                            >
                                                <i className="fa-regular fa-user text-slate-400 w-4 text-center"></i>
                                                <span>{t('my_profile', currentLanguage)}</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIsUserMenuOpen(false);
                                                    onNavigate('orders');
                                                }}
                                                className="w-full px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center gap-2.5 transition"
                                            >
                                                <i className="fa-solid fa-receipt text-slate-400 w-4 text-center"></i>
                                                <span>{t('my_orders', currentLanguage)}</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIsUserMenuOpen(false);
                                                    onNavigate('wishlist');
                                                }}
                                                className="w-full px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center gap-2.5 transition"
                                            >
                                                <i className="fa-regular fa-heart text-slate-400 w-4 text-center"></i>
                                                <span>{t('wishlist', currentLanguage)}</span>
                                            </button>
                                            <div className="my-1 border-t border-slate-100 dark:border-slate-700"></div>
                                            <button
                                                onClick={() => {
                                                    setIsUserMenuOpen(false);
                                                    onLogout();
                                                }}
                                                className="w-full px-4 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5 font-medium transition"
                                            >
                                                <i className="fa-solid fa-arrow-right-from-bracket text-rose-500 w-4 text-center"></i>
                                                <span>{t('logout', currentLanguage)}</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <button
                                    onClick={onOpenAuth}
                                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-full text-xs font-semibold shadow-md shadow-rose-500/20 transition flex items-center gap-2"
                                >
                                    <i className="fa-solid fa-arrow-right-to-bracket text-xs"></i>
                                    <span>{t('login', currentLanguage)}</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Mobile Search Bar */}
                    <div className="mt-3 md:hidden">
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                <i className="fa-solid fa-magnifying-glass text-sm"></i>
                            </span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                                placeholder={t('search_placeholder', currentLanguage)}
                                className="w-full pl-9 pr-8 py-2 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm rounded-full border border-transparent dark:border-slate-700 focus:border-rose-400 focus:bg-white dark:focus:bg-slate-900 outline-none"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => onSearchChange('')}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                >
                                    <i className="fa-solid fa-xmark text-xs"></i>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Categories Bar */}
                <div className="bg-slate-50/80 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 overflow-x-auto scrollbar-none transition-colors duration-200">
                    <div className="max-w-7xl mx-auto px-4 flex items-center gap-2 py-2">
                        <button
                            onClick={() => onSelectCategory(null)}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                                selectedCategory === null
                                    ? 'bg-rose-600 text-white shadow-xs'
                                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800'
                            }`}
                        >
                            {t('all', currentLanguage)}
                        </button>
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => onSelectCategory(cat.id)}
                                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                                    selectedCategory === cat.id
                                        ? 'bg-rose-600 text-white shadow-xs'
                                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800'
                                }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Mobile Drawer Menu */}
                {isMobileMenuOpen && (
                    <div className="fixed inset-0 z-50 flex md:hidden">
                        <div
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
                            onClick={() => setIsMobileMenuOpen(false)}
                        ></div>
                        <div className="relative w-72 max-w-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 h-full shadow-2xl p-5 flex flex-col justify-between z-10 animate-fade-in transition-colors duration-200">
                            <div>
                                <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
                                    <span className="text-xl font-black text-slate-900 dark:text-white">
                                        iTicket<span className="text-rose-600">.uz</span>
                                    </span>
                                    <button
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                    >
                                        <i className="fa-solid fa-xmark text-lg"></i>
                                    </button>
                                </div>

                                <div className="py-4 space-y-1">
                                    <button
                                        onClick={() => {
                                            setIsMobileMenuOpen(false);
                                            onNavigate('home');
                                        }}
                                        className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3 transition"
                                    >
                                        <i className="fa-solid fa-house text-slate-400"></i>
                                        <span>{t('home', currentLanguage)}</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsMobileMenuOpen(false);
                                            onNavigate('outlets');
                                        }}
                                        className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3 transition"
                                    >
                                        <i className="fa-solid fa-location-dot text-slate-400"></i>
                                        <span>{t('sales_outlets', currentLanguage)}</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsMobileMenuOpen(false);
                                            onNavigate('faq');
                                        }}
                                        className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3 transition"
                                    >
                                        <i className="fa-regular fa-circle-question text-slate-400"></i>
                                        <span>{t('faq', currentLanguage)}</span>
                                    </button>

                                    {/* Mobile Theme Toggle */}
                                    <div className="pt-2">
                                        <button
                                            onClick={() => {
                                                onToggleTheme();
                                            }}
                                            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between transition"
                                        >
                                            <span className="flex items-center gap-3">
                                                {currentTheme === 'dark' ? (
                                                    <i className="fa-solid fa-sun text-amber-400 text-base"></i>
                                                ) : (
                                                    <i className="fa-solid fa-moon text-indigo-500 text-base"></i>
                                                )}
                                                <span>{currentTheme === 'dark' ? t('theme_light', currentLanguage) : t('theme_dark', currentLanguage)}</span>
                                            </span>
                                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold uppercase">
                                                {currentTheme}
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                                <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('support_service', currentLanguage)}</p>
                                <a href="tel:+998712071071" className="text-rose-600 dark:text-rose-400 font-bold block mb-1">
                                    +998 71 207 10 71
                                </a>
                                <p>{t('phone_hours', currentLanguage)}</p>
                            </div>
                        </div>
                    </div>
                )}
            </header>
        );
    }

    window.Navbar = Navbar;
})();
