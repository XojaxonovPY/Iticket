/**
 * iTicket OutletsPage Component
 * Official sales outlets (kassalar) directory with hours, phones, and location details with i18n
 */

(function () {
    const { useState, useEffect } = React;
    const { t } = window.i18n;

    function OutletsPage({ onNavigate, language = 'uz' }) {
        const [outlets, setOutlets] = useState([]);
        const [loading, setLoading] = useState(true);

        useEffect(() => {
            async function fetchOutlets() {
                setLoading(true);
                try {
                    const data = await window.apiServices.system.getSalesOutlets(language);
                    setOutlets(data);
                } catch (e) {
                    console.error("Sales outlets error:", e);
                } finally {
                    setLoading(false);
                }
            }
            fetchOutlets();
        }, [language]);

        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white">{t('outlets_title', language)}</h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {t('outlets_desc', language)}
                    </p>
                </div>

                {loading ? (
                    <div className="py-20 text-center space-y-4">
                        <div className="w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{language === 'uz' ? "Kassalar ro'yxati yuklanmoqda..." : "Loading outlets..."}</p>
                    </div>
                ) : outlets.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {outlets.map((outlet) => {
                            const phones = Array.isArray(outlet.phone_number)
                                ? outlet.phone_number
                                : [outlet.place?.phone_number || "+998 71 207 10 71"];

                            const startTime = outlet.start_time ? outlet.start_time.slice(0, 5) : "09:00";
                            const endTime = outlet.end_time ? outlet.end_time.slice(0, 5) : "20:00";

                            return (
                                <div
                                    key={outlet.id}
                                    className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-xs hover:shadow-lg transition space-y-4 flex flex-col justify-between"
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold flex-shrink-0">
                                                <i className="fa-solid fa-store"></i>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                                                    {outlet.place?.title || outlet.place?.name || t('official_kassa', language)}
                                                </h3>
                                                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                                                    {t('official_kassa', language)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-1">
                                            <div className="flex items-center gap-2">
                                                <i className="fa-regular fa-clock text-slate-400 dark:text-slate-500 w-4 text-center"></i>
                                                <span>{t('working_hours', language)}: <strong className="text-slate-800 dark:text-slate-200">{startTime} - {endTime}</strong></span>
                                            </div>

                                            <div className="flex items-start gap-2">
                                                <i className="fa-solid fa-phone text-slate-400 dark:text-slate-500 w-4 text-center mt-0.5"></i>
                                                <div className="flex flex-wrap gap-x-2">
                                                    {phones.map((phone, idx) => (
                                                        <a
                                                            key={idx}
                                                            href={`tel:${phone.replace(/\s+/g, '')}`}
                                                            className="text-rose-600 dark:text-rose-400 font-semibold hover:underline"
                                                        >
                                                            {phone}
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {outlet.latitude && outlet.longitude && (
                                        <a
                                            href={`https://yandex.uz/maps/?pt=${outlet.longitude},${outlet.latitude}&z=16&l=map`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="w-full py-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs text-center transition flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700"
                                        >
                                            <i className="fa-solid fa-location-arrow text-rose-500"></i>
                                            <span>{t('view_on_map', language)}</span>
                                        </a>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
                        {t('no_events_found', language)}
                    </div>
                )}
            </div>
        );
    }

    window.OutletsPage = OutletsPage;
})();
