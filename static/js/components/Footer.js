/**
 * iTicket Footer Component
 * Matches the iticket.uz footer with multi-language support
 */

(function () {
    const { t } = window.i18n;

    function Footer({ onNavigate, language = 'uz' }) {
        return (
            <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 mt-16">
                {/* Main Links */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {/* Column 1: Brand & Contact */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-rose-600 flex items-center justify-center text-white font-bold">
                                    <i className="fa-solid fa-ticket-simple -rotate-12 text-base"></i>
                                </div>
                                <span className="text-xl font-black text-white">
                                    iTicket<span className="text-rose-600">.uz</span>
                                </span>
                            </div>
                            <p className="text-slate-400 leading-relaxed text-xs">
                                {t('footer_desc', language)}
                            </p>
                            <div className="pt-2">
                                <span className="block text-[11px] text-slate-500 font-medium">{t('single_contact_center', language)}</span>
                                <a href="tel:+998712071071" className="text-base font-bold text-white hover:text-rose-500 transition">
                                    +998 71 207 10 71
                                </a>
                                <p className="text-slate-500 text-[11px] mt-0.5">{t('daily_working_hours', language)}</p>
                            </div>
                        </div>

                        {/* Column 2: Navigation */}
                        <div>
                            <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">{t('sections', language)}</h4>
                            <ul className="space-y-2.5">
                                <li>
                                    <button onClick={() => onNavigate('home')} className="hover:text-white transition">
                                        {t('home', language)}
                                    </button>
                                </li>
                                <li>
                                    <button onClick={() => onNavigate('outlets')} className="hover:text-white transition">
                                        {t('sales_outlets', language)}
                                    </button>
                                </li>
                                <li>
                                    <button onClick={() => onNavigate('faq')} className="hover:text-white transition">
                                        {t('faq', language)}
                                    </button>
                                </li>
                                <li>
                                    <button onClick={() => onNavigate('wishlist')} className="hover:text-white transition">
                                        {t('wishlist', language)}
                                    </button>
                                </li>
                                <li>
                                    <button onClick={() => onNavigate('cart')} className="hover:text-white transition">
                                        {t('cart', language)}
                                    </button>
                                </li>
                            </ul>
                        </div>

                        {/* Column 3: Rules & Legal */}
                        <div>
                            <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">{t('info', language)}</h4>
                            <ul className="space-y-2.5">
                                <li>
                                    <a href="#" className="hover:text-white transition" onClick={(e) => { e.preventDefault(); onNavigate('faq'); }}>
                                        {t('refund_policy', language)}
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="hover:text-white transition" onClick={(e) => { e.preventDefault(); onNavigate('faq'); }}>
                                        {t('public_offer', language)}
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="hover:text-white transition" onClick={(e) => { e.preventDefault(); onNavigate('faq'); }}>
                                        {t('privacy_policy', language)}
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="hover:text-white transition" onClick={(e) => { e.preventDefault(); onNavigate('outlets'); }}>
                                        {t('organizer_coop', language)}
                                    </a>
                                </li>
                            </ul>
                        </div>

                        {/* Column 4: Payment systems & Socials */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">{t('social_media', language)}</h4>
                            <div className="flex items-center gap-3">
                                <a
                                    href="https://t.me/iticket_uz"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-sky-600 text-white flex items-center justify-center transition"
                                >
                                    <i className="fa-brands fa-telegram text-base"></i>
                                </a>
                                <a
                                    href="https://instagram.com/iticket.uz"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-pink-600 text-white flex items-center justify-center transition"
                                >
                                    <i className="fa-brands fa-instagram text-base"></i>
                                </a>
                                <a
                                    href="https://facebook.com/iticket.uz"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-blue-600 text-white flex items-center justify-center transition"
                                >
                                    <i className="fa-brands fa-facebook-f text-base"></i>
                                </a>
                            </div>

                            <div className="pt-2">
                                <span className="block text-xs font-semibold text-slate-300 mb-2">{t('payment_methods', language)}</span>
                                <div className="flex flex-wrap gap-2 items-center">
                                    <span className="px-2.5 py-1 bg-slate-800 text-emerald-400 font-bold rounded text-[11px] border border-slate-700">
                                        UZCARD
                                    </span>
                                    <span className="px-2.5 py-1 bg-slate-800 text-amber-400 font-bold rounded text-[11px] border border-slate-700">
                                        HUMO
                                    </span>
                                    <span className="px-2.5 py-1 bg-slate-800 text-blue-400 font-bold rounded text-[11px] border border-slate-700">
                                        VISA
                                    </span>
                                    <span className="px-2.5 py-1 bg-slate-800 text-rose-400 font-bold rounded text-[11px] border border-slate-700">
                                        Mastercard
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-slate-800 py-4 bg-slate-950/60 text-slate-500 text-[11px]">
                    <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
                        <p>© {new Date().getFullYear()} iTicket.uz. {t('all_rights_reserved', language)}</p>
                        <p className="flex items-center gap-1">
                            <span>{t('secure_tickets', language)}</span>
                            <i className="fa-solid fa-shield-halved text-emerald-500"></i>
                        </p>
                    </div>
                </div>
            </footer>
        );
    }

    window.Footer = Footer;
})();
