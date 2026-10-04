/**
 * iTicket API Client
 * - Manages Bearer Token authentication & automatic token refresh
 * - Injects CSRF token for mutating requests
 * - Normalizes backend error responses (422 ValidationError, 400 HttpError, TokenError, 500)
 */

(function () {
    const TOKEN_KEY = 'iticket_access_token';
    const REFRESH_KEY = 'iticket_refresh_token';

    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    class ApiError extends Error {
        constructor(message, status = 500, fieldErrors = null, raw = null) {
            super(message);
            this.name = 'ApiError';
            this.status = status;
            this.fieldErrors = fieldErrors || {};
            this.raw = raw;
        }
    }

    let isRefreshing = false;
    let refreshSubscribers = [];

    function subscribeTokenRefresh(cb) {
        refreshSubscribers.push(cb);
    }

    function onRefreshed(newToken) {
        refreshSubscribers.forEach((cb) => cb(newToken));
        refreshSubscribers = [];
    }

    async function doRefreshToken() {
        const refresh = localStorage.getItem(REFRESH_KEY);
        if (!refresh) return null;

        try {
            const res = await fetch('/refresh/token/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': (window.DJANGO_CONFIG && window.DJANGO_CONFIG.csrfToken) || getCookie('csrftoken') || '',
                },
                body: JSON.stringify({ refresh_token: refresh }),
            });

            if (!res.ok) {
                localStorage.removeItem(TOKEN_KEY);
                localStorage.removeItem(REFRESH_KEY);
                window.dispatchEvent(new CustomEvent('iticket:auth-changed', { detail: { authenticated: false } }));
                return null;
            }

            const data = await res.json();
            if (data.access_token) {
                localStorage.setItem(TOKEN_KEY, data.access_token);
                if (data.refresh_token) {
                    localStorage.setItem(REFRESH_KEY, data.refresh_token);
                }
                window.dispatchEvent(new CustomEvent('iticket:auth-changed', { detail: { authenticated: true } }));
                return data.access_token;
            }
        } catch (e) {
            console.error('Token refresh failed', e);
        }
        return null;
    }

    async function request(url, options = {}) {
        const fullUrl = url.startsWith('/') ? url : '/' + url;
        const headers = {
            'Accept': 'application/json',
            ...(options.headers || {}),
        };

        // Attach CSRF token for unsafe methods
        const method = (options.method || 'GET').toUpperCase();
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
            const csrf = (window.DJANGO_CONFIG && window.DJANGO_CONFIG.csrfToken) || getCookie('csrftoken') || '';
            if (csrf) {
                headers['X-CSRFToken'] = csrf;
            }
        }

        // Attach JWT token if available
        const token = localStorage.getItem(TOKEN_KEY);
        if (token && !headers['Authorization']) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(options.body);
        }

        let response;
        try {
            response = await fetch(fullUrl, {
                ...options,
                headers,
            });
        } catch (netErr) {
            throw new ApiError("Internet bilan aloqa yo'q yoki server javob bermadi", 0, null, netErr);
        }

        // Handle 401 Unauthorized or Token Expiry
        if (response.status === 401 && !options._retry && !url.includes('/login/') && !url.includes('/refresh/token/')) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    subscribeTokenRefresh((newToken) => {
                        if (!newToken) {
                            return reject(new ApiError('Sessiya muddati tugadi. Iltimos, qayta kiring.', 401));
                        }
                        options.headers = options.headers || {};
                        options.headers['Authorization'] = `Bearer ${newToken}`;
                        options._retry = true;
                        resolve(request(url, options));
                    });
                });
            }

            isRefreshing = true;
            try {
                const newToken = await doRefreshToken();
                isRefreshing = false;
                onRefreshed(newToken);

                if (newToken) {
                    options.headers = options.headers || {};
                    options.headers['Authorization'] = `Bearer ${newToken}`;
                    options._retry = true;
                    return request(url, options);
                } else {
                    throw new ApiError('Sessiya muddati tugadi. Iltimos, qayta kiring.', 401);
                }
            } catch (err) {
                isRefreshing = false;
                onRefreshed(null);
                throw err;
            }
        }

        // Parse response body
        let data = null;
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            try {
                data = await response.json();
            } catch (e) {
                data = null;
            }
        } else if (response.status !== 204) {
            try {
                data = await response.text();
            } catch (e) {
                data = null;
            }
        }

        // Handle error responses using apps/commons/exceptions.py pattern
        if (!response.ok) {
            let message = "Kutilmagan xatolik yuz berdi";
            let fieldErrors = {};

            if (data && typeof data === 'object') {
                // 1. ValidationError pattern (status 422)
                if (data.errors && typeof data.errors === 'object') {
                    fieldErrors = data.errors;
                    message = data.message || "Ma'lumotlar noto'g'ri kiritildi";
                }
                // 2. HttpError pattern: { status: false, status_code: ..., message: "..." }
                else if (data.message) {
                    message = data.message;
                }
                // 3. Fallback detail or non-standard format
                else if (data.detail) {
                    message = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
                }
            } else if (typeof data === 'string' && data.length < 200) {
                message = data;
            }

            throw new ApiError(message, response.status, fieldErrors, data);
        }

        return data;
    }

    window.apiClient = {
        request,
        get: (url, options = {}) => request(url, { ...options, method: 'GET' }),
        post: (url, body, options = {}) => request(url, { ...options, method: 'POST', body }),
        put: (url, body, options = {}) => request(url, { ...options, method: 'PUT', body }),
        patch: (url, body, options = {}) => request(url, { ...options, method: 'PATCH', body }),
        delete: (url, options = {}) => request(url, { ...options, method: 'DELETE' }),
        ApiError,
        TOKEN_KEY,
        REFRESH_KEY,
    };
})();
