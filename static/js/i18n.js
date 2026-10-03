/**
 * iTicket Localization (i18n) Engine
 * Asynchronously loads JSON translation bundles from /static/locales/{lang}.json,
 * provides instant in-memory caching and universal key lookup
 */

(function () {
    const translationsCache = {};
    const flatCache = {};

    function flatten(obj, prefix = '') {
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                Object.assign(result, flatten(value, prefix ? `${prefix}.${key}` : key));
                // Also store direct keys for convenient t('key') access
                for (const [subKey, subVal] of Object.entries(value)) {
                    if (typeof subVal === 'string') {
                        result[subKey] = subVal;
                    }
                }
            } else {
                if (prefix) {
                    result[`${prefix}.${key}`] = value;
                }
                result[key] = value;
            }
        }
        return result;
    }

    async function loadLocale(lang = 'uz') {
        if (translationsCache[lang]) {
            return translationsCache[lang];
        }
        try {
            const res = await fetch(`/static/locales/${lang}.json`);
            if (res.ok) {
                const data = await res.json();
                translationsCache[lang] = data;
                flatCache[lang] = flatten(data);
                window.dispatchEvent(new CustomEvent('iticket:locale-loaded', { detail: { lang } }));
                return data;
            }
        } catch (e) {
            console.error(`Error loading locale JSON for ${lang}:`, e);
        }
        return null;
    }

    // Immediately load the active language from localStorage/default
    const initialLang = localStorage.getItem('iticket_lang') || 'uz';
    loadLocale(initialLang);

    // Preload remaining languages in background for zero-latency switching
    ['uz', 'ru', 'en'].forEach((lng) => {
        if (lng !== initialLang) {
            loadLocale(lng);
        }
    });

    function t(key, lang = 'uz') {
        const activeDict = flatCache[lang] || flatCache[initialLang] || flatCache.uz || {};
        if (activeDict[key] !== undefined) {
            return activeDict[key];
        }
        // Fallback to uz
        if (flatCache.uz && flatCache.uz[key] !== undefined) {
            return flatCache.uz[key];
        }
        return key;
    }

    function formatEventDate(dateString, lang = 'uz') {
        if (!dateString) return { day: '', month: '', time: '', full: '' };
        try {
            const date = new Date(dateString);
            const months = (translationsCache[lang] && translationsCache[lang].months) ||
                           (translationsCache.uz && translationsCache.uz.months) ||
                           ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
            const day = date.getDate();
            const month = months[date.getMonth()];
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return {
                day,
                month,
                time: `${hours}:${minutes}`,
                full: `${day} ${month}, ${hours}:${minutes}`,
            };
        } catch (e) {
            return { day: '', month: '', time: '', full: '' };
        }
    }

    function formatPrice(price, lang = 'uz') {
        if (!price && price !== 0) return null;
        const num = Math.round(Number(price));
        const currency = t('currency', lang);
        const locale = lang === 'uz' ? 'uz-UZ' : (lang === 'ru' ? 'ru-RU' : 'en-US');
        return num.toLocaleString(locale) + " " + currency;
    }

    window.i18n = {
        loadLocale,
        t,
        formatEventDate,
        formatPrice,
        translationsCache,
    };
})();
