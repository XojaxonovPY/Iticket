/**
 * iTicket API Services
 * Modular abstraction layer connecting to backend Django Ninja endpoints
 */

(function () {
    const { get, post, patch, put, delete: del, TOKEN_KEY, REFRESH_KEY } = window.apiClient;

    const authService = {
        async register(payload) {
            return await post('/register/', payload);
        },

        async login(payload) {
            const data = await post('/login/', payload);
            if (data.access_token) {
                localStorage.setItem(TOKEN_KEY, data.access_token);
                if (data.refresh_token) {
                    localStorage.setItem(REFRESH_KEY, data.refresh_token);
                }
                window.dispatchEvent(new CustomEvent('iticket:auth-changed', { detail: { authenticated: true } }));
            }
            return data;
        },

        logout() {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(REFRESH_KEY);
            window.dispatchEvent(new CustomEvent('iticket:auth-changed', { detail: { authenticated: false } }));
        },

        isAuthenticated() {
            return !!localStorage.getItem(TOKEN_KEY);
        }
    };

    const eventService = {
        async getCategories(lang = 'uz') {
            const res = await get(`/categories/?lang=${encodeURIComponent(lang)}`);
            // Ninja paginated returns { items: [...], count: ... } or array
            return res.items ? res.items : (Array.isArray(res) ? res : []);
        },

        async getEvents(params = {}, lang = 'uz') {
            const query = new URLSearchParams();
            query.append('lang', lang);
            if (params.category_id) query.append('category_id', params.category_id);
            if (params.title) query.append('title', params.title);
            if (params.min_price) query.append('min_price', params.min_price);
            if (params.max_price) query.append('max_price', params.max_price);
            if (params.page) query.append('page', params.page);

            const res = await get(`/events/?${query.toString()}`);
            return {
                items: res.items ? res.items : (Array.isArray(res) ? res : []),
                count: res.count || (Array.isArray(res) ? res.length : 0),
            };
        },

        async getEvent(pk, lang = 'uz') {
            return await get(`/event/${pk}/?lang=${encodeURIComponent(lang)}`);
        },

        async toggleWishlist(eventId, lang = 'uz') {
            return await post(`/wishlist/?lang=${encodeURIComponent(lang)}`, { event_id: Number(eventId) });
        },

        async getWishlist(params = {}, lang = 'uz') {
            const query = new URLSearchParams();
            query.append('lang', lang);
            if (params.page) query.append('page', params.page);
            const res = await get(`/wishlist/?${query.toString()}`);
            return {
                items: res.items ? res.items : (Array.isArray(res) ? res : []),
                count: res.count || (Array.isArray(res) ? res.length : 0),
            };
        }
    };

    const cartService = {
        async getCart(lang = 'uz') {
            const res = await get(`/cards/?lang=${encodeURIComponent(lang)}`);
            return Array.isArray(res) ? res : [];
        },

        async addToCart(ticketId, count = 1) {
            return await post('/cards/', {
                ticket_id: Number(ticketId),
                count: Number(count)
            });
        },

        async removeFromCart(ticketId) {
            return await del(`/cards/${ticketId}`);
        }
    };

    const orderService = {
        async createOrder(payload) {
            return await post('/orders/', payload);
        },

        async getOrders(lang = 'uz') {
            const res = await get(`/orders/?lang=${encodeURIComponent(lang)}`);
            return Array.isArray(res) ? res : [];
        },

        async createPayment(payload) {
            // payload: { order_id: int, total_amount: number/string }
            return await post('/payment/', payload);
        },

        async getTransactions(filter = 'all') {
            return await get(`/transactions/?filters=${encodeURIComponent(filter)}`);
        }
    };

    const userService = {
        async getProfile() {
            return await get('/profile/');
        },

        async updateProfile(payload) {
            return await patch('/profile/', payload);
        },

        async updatePassword(payload) {
            return await put('/update/password/', payload);
        },

        async getCountries(lang = 'uz') {
            const res = await get(`/country/?lang=${encodeURIComponent(lang)}`);
            return Array.isArray(res) ? res : [];
        },

        async getAddresses() {
            const res = await get('/address/');
            return Array.isArray(res) ? res : [];
        },

        async createAddress(payload) {
            return await post('/address/', payload);
        },

        async updateAddress(pk, payload) {
            return await patch(`/address/${pk}`, payload);
        },

        async deleteAddress(pk) {
            return await del(`/address/${pk}`);
        }
    };

    const systemService = {
        async getSalesOutlets(lang = 'uz') {
            const res = await get(`/salet/outlets/?lang=${encodeURIComponent(lang)}`);
            return Array.isArray(res) ? res : [];
        },

        async getQuestions() {
            const res = await get('/questions/');
            return Array.isArray(res) ? res : [];
        }
    };

    window.apiServices = {
        auth: authService,
        event: eventService,
        cart: cartService,
        order: orderService,
        user: userService,
        system: systemService,
    };
})();
