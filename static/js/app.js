/**
 * iTicket Main Application
 * State orchestration, Hash Router, Global Auth & Cart sync, and Layout rendering with full i18n
 */

(function () {
    const { useState, useEffect, useCallback } = React;
    const {
        Navbar,
        Footer,
        ToastContainer,
        AuthModal,
        HomePage,
        EventDetailPage,
        CartPage,
        CheckoutPage,
        ProfilePage,
        WishlistPage,
        OutletsPage,
        FAQPage,
    } = window;
    const { t } = window.i18n;

    function App() {
        // Language state: 'uz' | 'ru' | 'en'
        const [language, setLanguage] = useState(() => {
            return localStorage.getItem('iticket_lang') || 'uz';
        });
        const [, setLocaleTick] = useState(0);

        useEffect(() => {
            function onLocaleLoaded() {
                setLocaleTick((v) => v + 1);
            }
            window.addEventListener('iticket:locale-loaded', onLocaleLoaded);
            return () => window.removeEventListener('iticket:locale-loaded', onLocaleLoaded);
        }, []);

        // Theme state: 'light' | 'dark' driven by central ThemeManager
        const [theme, setTheme] = useState(() => {
            return window.ThemeManager ? window.ThemeManager.getTheme() : (localStorage.getItem('iticket_theme') || 'light');
        });

        useEffect(() => {
            if (window.ThemeManager) {
                return window.ThemeManager.onThemeChange((newTheme) => {
                    setTheme(newTheme);
                });
            }
        }, []);

        const toggleTheme = useCallback(() => {
            if (window.ThemeManager) {
                const next = window.ThemeManager.toggle();
                setTheme(next);
            } else {
                setTheme((prev) => {
                    const next = prev === 'dark' ? 'light' : 'dark';
                    if (next === 'dark') document.documentElement.classList.add('dark');
                    else document.documentElement.classList.remove('dark');
                    localStorage.setItem('iticket_theme', next);
                    return next;
                });
            }
        }, []);

        // Router state
        const [route, setRoute] = useState({ path: 'home', params: {} });

        // Global User state
        const [currentUser, setCurrentUser] = useState(null);
        const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

        // Categories & Events
        const [categories, setCategories] = useState([]);
        const [selectedCategory, setSelectedCategory] = useState(null);
        const [searchQuery, setSearchQuery] = useState('');
        const [events, setEvents] = useState([]);
        const [loadingEvents, setLoadingEvents] = useState(true);

        // Cart & Wishlist counters
        const [cartCount, setCartCount] = useState(0);
        const [wishlistIds, setWishlistIds] = useState([]);

        // Toast notifications
        const [toasts, setToasts] = useState([]);

        const showToast = useCallback((toast) => {
            const id = Date.now() + Math.random().toString(36).substring(2, 5);
            const newToast = { id, ...toast };
            setToasts((prev) => [...prev, newToast]);
            setTimeout(() => {
                setToasts((prev) => prev.filter((item) => item.id !== id));
            }, 5000);
        }, []);

        const removeToast = useCallback((id) => {
            setToasts((prev) => prev.filter((item) => item.id !== id));
        }, []);

        // Parse hash on URL change
        const parseHash = useCallback(() => {
            const hash = window.location.hash.replace(/^#\/?/, '');
            if (!hash || hash === '') {
                setRoute({ path: 'home', params: {} });
            } else if (hash.startsWith('event/')) {
                const id = hash.split('/')[1];
                setRoute({ path: 'event-detail', params: { id } });
            } else if (hash === 'cart') {
                setRoute({ path: 'cart', params: {} });
            } else if (hash === 'checkout') {
                setRoute({ path: 'checkout', params: {} });
            } else if (hash === 'profile') {
                setRoute({ path: 'profile', params: { tab: 'profile' } });
            } else if (hash === 'orders') {
                setRoute({ path: 'profile', params: { tab: 'orders' } });
            } else if (hash === 'wishlist') {
                setRoute({ path: 'wishlist', params: {} });
            } else if (hash === 'outlets') {
                setRoute({ path: 'outlets', params: {} });
            } else if (hash === 'faq') {
                setRoute({ path: 'faq', params: {} });
            } else {
                setRoute({ path: 'home', params: {} });
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, []);

        useEffect(() => {
            parseHash();
            window.addEventListener('hashchange', parseHash);
            return () => window.removeEventListener('hashchange', parseHash);
        }, [parseHash]);

        function navigate(path, params = {}) {
            if (path === 'home') {
                window.location.hash = '';
            } else if (path === 'event-detail') {
                window.location.hash = `event/${params.id}`;
            } else {
                window.location.hash = path;
            }
        }

        // Fetch User Profile
        const fetchUserProfile = useCallback(async () => {
            if (!window.apiServices.auth.isAuthenticated()) {
                setCurrentUser(null);
                return;
            }
            try {
                const user = await window.apiServices.user.getProfile();
                setCurrentUser(user);
            } catch (e) {
                setCurrentUser(null);
            }
        }, []);

        // Fetch Cart Count
        const fetchCartCount = useCallback(async () => {
            try {
                const cartData = await window.apiServices.cart.getCart(language);
                let total = 0;
                if (Array.isArray(cartData)) {
                    cartData.forEach((ev) => {
                        if (ev.tickets) {
                            ev.tickets.forEach((tick) => {
                                total += tick.purchase_count || 1;
                            });
                        }
                    });
                }
                setCartCount(total);
            } catch (e) {
                setCartCount(0);
            }
        }, [language]);

        // Fetch Wishlist IDs
        const fetchWishlist = useCallback(async () => {
            if (!window.apiServices.auth.isAuthenticated()) {
                setWishlistIds([]);
                return;
            }
            try {
                const res = await window.apiServices.event.getWishlist({}, language);
                if (res.items) {
                    setWishlistIds(res.items.map((ev) => ev.id));
                }
            } catch (e) {
                setWishlistIds([]);
            }
        }, [language]);

        // Initial Data Loading
        useEffect(() => {
            fetchUserProfile();
            fetchCartCount();
            fetchWishlist();

            const handleAuthChanged = () => {
                fetchUserProfile();
                fetchCartCount();
                fetchWishlist();
            };
            window.addEventListener('iticket:auth-changed', handleAuthChanged);
            return () => window.removeEventListener('iticket:auth-changed', handleAuthChanged);
        }, [fetchUserProfile, fetchCartCount, fetchWishlist]);

        // Fetch Categories on language change
        useEffect(() => {
            async function loadCategories() {
                try {
                    const data = await window.apiServices.event.getCategories(language);
                    setCategories(data);
                } catch (e) {
                    console.error("Categories load error", e);
                }
            }
            loadCategories();
        }, [language]);

        // Fetch Events when category, search, or language changes
        useEffect(() => {
            let isCurrent = true;
            async function loadEvents() {
                setLoadingEvents(true);
                try {
                    const params = {};
                    if (selectedCategory) params.category_id = selectedCategory;
                    if (searchQuery.trim()) params.title = searchQuery.trim();

                    const res = await window.apiServices.event.getEvents(params, language);
                    if (isCurrent) {
                        setEvents(res.items || []);
                    }
                } catch (e) {
                    if (isCurrent) {
                        setEvents([]);
                    }
                } finally {
                    if (isCurrent) setLoadingEvents(false);
                }
            }

            const debounceTimer = setTimeout(loadEvents, 300);
            return () => {
                isCurrent = false;
                clearTimeout(debounceTimer);
            };
        }, [selectedCategory, searchQuery, language]);

        // Wishlist Toggle Handler
        async function handleToggleWishlist(eventId) {
            if (!window.apiServices.auth.isAuthenticated()) {
                setIsAuthModalOpen(true);
                showToast({
                    type: 'info',
                    message: language === 'uz' ? "Sevimlilarga qo'shish uchun avval tizimga kiring" : (language === 'ru' ? "Войдите, чтобы добавить в избранное" : "Please log in to add to wishlist")
                });
                return;
            }

            try {
                await window.apiServices.event.toggleWishlist(eventId, language);
                setWishlistIds((prev) => {
                    const isAdded = !prev.includes(eventId);
                    if (isAdded) {
                        showToast({
                            type: 'success',
                            message: language === 'uz' ? "Tadbir sevimlilarga qo'shildi!" : (language === 'ru' ? "Мероприятие добавлено в избранное!" : "Added to wishlist!")
                        });
                        return [...prev, eventId];
                    } else {
                        showToast({
                            type: 'info',
                            message: language === 'uz' ? "Tadbir sevimlilardan o'chirildi" : (language === 'ru' ? "Удалено из избранного" : "Removed from wishlist")
                        });
                        return prev.filter((id) => id !== eventId);
                    }
                });
            } catch (err) {
                showToast({ type: 'error', message: err.message || "Xatolik yuz berdi" });
            }
        }

        async function handleLanguageChange(newLang) {
            await window.i18n.loadLocale(newLang);
            setLanguage(newLang);
            localStorage.setItem('iticket_lang', newLang);
            // Synchronize with Django session cookie
            document.cookie = `django_language=${newLang};path=/;max-age=31536000`;
            showToast({
                type: 'info',
                message: newLang === 'uz' ? "Til O'zbekchaga o'zgartirildi" : (newLang === 'ru' ? "Язык переключен на русский" : "Language switched to English")
            });
        }

        function handleLogout() {
            window.apiServices.auth.logout();
            setCurrentUser(null);
            showToast({
                type: 'info',
                message: language === 'uz' ? "Tizimdan muvaffaqiyatli chiqdingiz" : (language === 'ru' ? "Вы вышли из системы" : "Signed out successfully")
            });
            if (route.path === 'profile') {
                navigate('home');
            }
        }

        return (
            <div className="min-h-screen flex flex-col justify-between">
                {/* Navbar */}
                <Navbar
                    categories={categories}
                    selectedCategory={selectedCategory}
                    onSelectCategory={(catId) => {
                        setSelectedCategory(catId);
                        if (route.path !== 'home') navigate('home');
                    }}
                    searchQuery={searchQuery}
                    onSearchChange={(q) => {
                        setSearchQuery(q);
                        if (route.path !== 'home') navigate('home');
                    }}
                    currentLanguage={language}
                    onLanguageChange={handleLanguageChange}
                    currentTheme={theme}
                    onToggleTheme={toggleTheme}
                    cartCount={cartCount}
                    wishlistCount={wishlistIds.length}
                    currentUser={currentUser}
                    onOpenAuth={() => setIsAuthModalOpen(true)}
                    onLogout={handleLogout}
                    onNavigate={navigate}
                />

                {/* Main Content Pages */}
                <main className="flex-1">
                    {route.path === 'home' && (
                        <HomePage
                            events={events}
                            loading={loadingEvents}
                            categories={categories}
                            selectedCategory={selectedCategory}
                            onSelectCategory={setSelectedCategory}
                            searchQuery={searchQuery}
                            wishlistIds={wishlistIds}
                            onToggleWishlist={handleToggleWishlist}
                            onSelectEvent={(id) => navigate('event-detail', { id })}
                            onNavigate={navigate}
                            language={language}
                        />
                    )}

                    {route.path === 'event-detail' && (
                        <EventDetailPage
                            eventId={route.params.id}
                            onBack={() => navigate('home')}
                            onNavigate={navigate}
                            isWishlisted={wishlistIds.includes(Number(route.params.id))}
                            onToggleWishlist={handleToggleWishlist}
                            onCartUpdated={fetchCartCount}
                            onShowToast={showToast}
                            language={language}
                        />
                    )}

                    {route.path === 'cart' && (
                        <CartPage
                            onNavigate={navigate}
                            onCartUpdated={fetchCartCount}
                            onShowToast={showToast}
                            language={language}
                        />
                    )}

                    {route.path === 'checkout' && (
                        <CheckoutPage
                            currentUser={currentUser}
                            onNavigate={navigate}
                            onCartUpdated={fetchCartCount}
                            onShowToast={showToast}
                            language={language}
                        />
                    )}

                    {route.path === 'profile' && (
                        <ProfilePage
                            currentUser={currentUser}
                            onUpdateUser={setCurrentUser}
                            onLogout={handleLogout}
                            onShowToast={showToast}
                            onNavigate={navigate}
                            language={language}
                            initialTab={route.params.tab || 'profile'}
                        />
                    )}

                    {route.path === 'wishlist' && (
                        <WishlistPage
                            wishlistIds={wishlistIds}
                            onToggleWishlist={handleToggleWishlist}
                            onSelectEvent={(id) => navigate('event-detail', { id })}
                            onNavigate={navigate}
                            language={language}
                        />
                    )}

                    {route.path === 'outlets' && (
                        <OutletsPage
                            onNavigate={navigate}
                            language={language}
                        />
                    )}

                    {route.path === 'faq' && (
                        <FAQPage
                            onNavigate={navigate}
                            language={language}
                        />
                    )}
                </main>

                {/* Footer */}
                <Footer onNavigate={navigate} language={language} />

                {/* Auth Modal */}
                <AuthModal
                    isOpen={isAuthModalOpen}
                    onClose={() => setIsAuthModalOpen(false)}
                    onSuccess={() => {
                        fetchUserProfile();
                        fetchCartCount();
                        fetchWishlist();
                    }}
                    onShowToast={showToast}
                    language={language}
                />

                {/* Global Toast Container */}
                <ToastContainer toasts={toasts} onRemove={removeToast} />
            </div>
        );
    }

    // Mount to DOM root
    const rootEl = document.getElementById('root');
    if (rootEl) {
        const root = ReactDOM.createRoot(rootEl);
        root.render(<App />);
    }
})();