/**
 * iTicket Central Theme Manager Architecture
 * Single source of truth for theme state, persistence, system sync, and reactive listeners
 */

(function () {
    const STORAGE_KEY = 'iticket_theme';

    function getSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    function getInitialTheme() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved === 'dark' || saved === 'light') {
                return saved;
            }
        } catch (e) {}
        return getSystemTheme();
    }

    let currentTheme = getInitialTheme();

    function applyThemeToDOM(theme) {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }

    function notifyListeners(theme) {
        window.dispatchEvent(
            new CustomEvent('theme:changed', {
                detail: {
                    theme: theme,
                    isDark: theme === 'dark',
                },
            })
        );
    }

    const ThemeManager = {
        getTheme: function () {
            return currentTheme;
        },

        isDark: function () {
            return currentTheme === 'dark';
        },

        setTheme: function (theme) {
            if (theme !== 'dark' && theme !== 'light') return;
            currentTheme = theme;
            try {
                localStorage.setItem(STORAGE_KEY, theme);
            } catch (e) {}
            applyThemeToDOM(theme);
            notifyListeners(theme);
            return currentTheme;
        },

        toggle: function () {
            const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
            return this.setTheme(nextTheme);
        },

        onThemeChange: function (callback) {
            function handler(e) {
                callback(e.detail.theme, e.detail.isDark);
            }
            window.addEventListener('theme:changed', handler);
            return function unsubscribe() {
                window.removeEventListener('theme:changed', handler);
            };
        },
    };

    // Apply immediately on script load
    applyThemeToDOM(currentTheme);

    // Watch for OS theme changes if user has not explicitly chosen
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
            const userStored = localStorage.getItem(STORAGE_KEY);
            if (!userStored) {
                ThemeManager.setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    window.ThemeManager = ThemeManager;
})();
