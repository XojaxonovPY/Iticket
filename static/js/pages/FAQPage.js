/**
 * iTicket FAQPage Component
 * Frequently Asked Questions accordion from /questions/ with i18n
 */

(function () {
    const { useState, useEffect } = React;
    const { t } = window.i18n;

    function FAQPage({ onNavigate, language = 'uz' }) {
        const [questions, setQuestions] = useState([]);
        const [loading, setLoading] = useState(true);
        const [openIndex, setOpenIndex] = useState(null);

        useEffect(() => {
            async function fetchQuestions() {
                setLoading(true);
                try {
                    const data = await window.apiServices.system.getQuestions();
                    setQuestions(data);
                    if (data && data.length > 0) {
                        setOpenIndex(0);
                    }
                } catch (e) {
                    console.error("Questions load error:", e);
                } finally {
                    setLoading(false);
                }
            }
            fetchQuestions();
        }, []);

        function toggleQuestion(idx) {
            setOpenIndex(openIndex === idx ? null : idx);
        }

        return (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
                <div className="text-center space-y-2 max-w-xl mx-auto">
                    <span className="px-3 py-1 bg-rose-50 text-rose-600 text-xs font-bold rounded-full uppercase">
                        {t('help_center', language)}
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900">{t('faq_title', language)}</h1>
                    <p className="text-xs sm:text-sm text-slate-500">
                        {t('faq_desc', language)}
                    </p>
                </div>

                {loading ? (
                    <div className="py-20 text-center space-y-4">
                        <div className="w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="text-xs text-slate-500">{language === 'uz' ? "Savol-javoblar yuklanmoqda..." : "Loading FAQ..."}</p>
                    </div>
                ) : questions.length > 0 ? (
                    <div className="space-y-3">
                        {questions.map((q, idx) => {
                            const isOpen = openIndex === idx;
                            return (
                                <div
                                    key={q.id}
                                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs transition"
                                >
                                    <button
                                        onClick={() => toggleQuestion(idx)}
                                        className="w-full p-5 text-left flex justify-between items-center gap-4 hover:bg-slate-50 transition"
                                    >
                                        <span className="font-bold text-sm text-slate-900 leading-snug">
                                            {q.question}
                                        </span>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition flex-shrink-0 ${
                                            isOpen ? 'bg-rose-600 text-white rotate-180' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                            <i className="fa-solid fa-chevron-down text-xs"></i>
                                        </div>
                                    </button>

                                    {isOpen && (
                                        <div className="px-5 pb-5 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 animate-fade-in whitespace-pre-line">
                                            {q.answer}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center text-xs text-slate-500">
                        {language === 'uz' ? "Savollar hozircha mavjud emas." : "No questions available."}
                    </div>
                )}

                {/* Still have questions banner */}
                <div className="bg-slate-100 rounded-3xl p-6 sm:p-8 text-center space-y-3">
                    <h3 className="font-bold text-sm text-slate-900">{t('cant_find_answer', language)}</h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                        {t('cant_find_desc', language)}
                    </p>
                    <a
                        href="tel:+998712071071"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-rose-600/20"
                    >
                        <i className="fa-solid fa-phone"></i>
                        <span>+998 71 207 10 71</span>
                    </a>
                </div>
            </div>
        );
    }

    window.FAQPage = FAQPage;
})();
