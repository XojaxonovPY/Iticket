/**
 * iTicket AuthModal Component
 * Handles Login and Register forms with validation, error states, and i18n
 */

(function () {
    const { useState } = React;
    const { FieldError } = window;
    const { t } = window.i18n;

    function AuthModal({ isOpen, onClose, onSuccess, initialTab = 'login', onShowToast, language = 'uz' }) {
        if (!isOpen) return null;

        const [tab, setTab] = useState(initialTab); // 'login' | 'register'
        const [showPassword, setShowPassword] = useState(false);
        const [loading, setLoading] = useState(false);

        // Login form state
        const [loginData, setLoginData] = useState({
            identifier: '', // Can be phone or email
            password: '',
        });

        // Register form state
        const [regData, setRegData] = useState({
            first_name: '',
            last_name: '',
            email: '',
            phone_number: '',
            password: '',
            confirm_password: '',
        });

        // Error states
        const [generalError, setGeneralError] = useState('');
        const [fieldErrors, setFieldErrors] = useState({});

        function resetForm() {
            setGeneralError('');
            setFieldErrors({});
            setLoading(false);
        }

        async function handleLoginSubmit(e) {
            e.preventDefault();
            resetForm();

            if (!loginData.identifier || !loginData.password) {
                setGeneralError(t('fill_all_fields', language));
                return;
            }

            setLoading(true);
            try {
                const isEmail = loginData.identifier.includes('@');
                const payload = {
                    password: loginData.password,
                    ...(isEmail ? { email: loginData.identifier } : { phone_number: loginData.identifier.replace(/\D/g, '') })
                };

                await window.apiServices.auth.login(payload);
                if (onShowToast) {
                    onShowToast({
                        type: 'success',
                        message: language === 'uz' ? "Tizimga muvaffaqiyatli kirdingiz!" : (language === 'ru' ? "Вы успешно вошли в систему!" : "Signed in successfully!")
                    });
                }
                onSuccess();
                onClose();
            } catch (err) {
                setGeneralError(err.message || (language === 'uz' ? "Kirishda xatolik yuz berdi" : (language === 'ru' ? "Ошибка входа" : "Login error")));
                if (err.fieldErrors) {
                    setFieldErrors(err.fieldErrors);
                }
            } finally {
                setLoading(false);
            }
        }

        async function handleRegisterSubmit(e) {
            e.preventDefault();
            resetForm();

            if (regData.password !== regData.confirm_password) {
                setFieldErrors({ confirm_password: [t('passwords_dont_match', language)] });
                return;
            }

            setLoading(true);
            try {
                const cleanedPhone = regData.phone_number.replace(/\D/g, '');
                const payload = {
                    first_name: regData.first_name.trim(),
                    last_name: regData.last_name.trim(),
                    email: regData.email.trim(),
                    phone_number: cleanedPhone,
                    password: regData.password,
                    confirm_password: regData.confirm_password,
                };

                await window.apiServices.auth.register(payload);
                if (onShowToast) {
                    onShowToast({
                        type: 'success',
                        title: language === 'uz' ? "Muvaffaqiyatli ro'yxatdan o'tdingiz!" : (language === 'ru' ? "Успешная регистрация!" : "Registered successfully!"),
                        message: language === 'uz' ? "Endi login orqali tizimga kirishingiz mumkin." : (language === 'ru' ? "Теперь вы можете войти в систему." : "You can now log in.")
                    });
                }
                // Switch to login tab with prefilled values
                setLoginData({ identifier: payload.phone_number, password: payload.password });
                setTab('login');
            } catch (err) {
                setGeneralError(err.message || (language === 'uz' ? "Ro'yxatdan o'tishda xatolik yuz berdi" : (language === 'ru' ? "Ошибка регистрации" : "Registration error")));
                if (err.fieldErrors) {
                    setFieldErrors(err.fieldErrors);
                }
            } finally {
                setLoading(false);
            }
        }

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
                <div
                    className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-6 pb-0 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold">
                                <i className="fa-solid fa-ticket-simple -rotate-12 text-sm"></i>
                            </div>
                            <span className="text-lg font-black text-slate-900">
                                iTicket<span className="text-rose-600">.uz</span>
                            </span>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition"
                        >
                            <i className="fa-solid fa-xmark text-sm"></i>
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="px-6 pt-4">
                        <div className="flex bg-slate-100 p-1 rounded-2xl">
                            <button
                                onClick={() => {
                                    setTab('login');
                                    resetForm();
                                }}
                                className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                                    tab === 'login'
                                        ? 'bg-white text-slate-900 shadow-xs'
                                        : 'text-slate-500 hover:text-slate-900'
                                }`}
                            >
                                {t('login_tab', language)}
                            </button>
                            <button
                                onClick={() => {
                                    setTab('register');
                                    resetForm();
                                }}
                                className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                                    tab === 'register'
                                        ? 'bg-white text-slate-900 shadow-xs'
                                        : 'text-slate-500 hover:text-slate-900'
                                }`}
                            >
                                {t('register_tab', language)}
                            </button>
                        </div>
                    </div>

                    {/* General Error Alert */}
                    {generalError && (
                        <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-fade-in">
                            <i className="fa-solid fa-circle-exclamation flex-shrink-0"></i>
                            <span>{generalError}</span>
                        </div>
                    )}

                    {/* Tab Contents */}
                    <div className="p-6">
                        {tab === 'login' ? (
                            <form onSubmit={handleLoginSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                        {t('phone_or_email', language)}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={loginData.identifier}
                                            onChange={(e) => setLoginData({ ...loginData, identifier: e.target.value })}
                                            placeholder="+998 90 123 45 67 / example@mail.uz"
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none transition"
                                            required
                                        />
                                    </div>
                                    <FieldError error={fieldErrors.phone_number || fieldErrors.email} />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                        {t('password', language)}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={loginData.password}
                                            onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none transition pr-10"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                                        >
                                            <i className={`fa-solid text-xs ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                        </button>
                                    </div>
                                    <FieldError error={fieldErrors.password} />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-500/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <i className="fa-solid fa-circle-notch fa-spin text-sm"></i>
                                    ) : (
                                        <span>{t('sign_in_btn', language)}</span>
                                    )}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleRegisterSubmit} className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            {t('first_name', language)}
                                        </label>
                                        <input
                                            type="text"
                                            value={regData.first_name}
                                            onChange={(e) => setRegData({ ...regData, first_name: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none transition"
                                            required
                                        />
                                        <FieldError error={fieldErrors.first_name} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            {t('last_name', language)}
                                        </label>
                                        <input
                                            type="text"
                                            value={regData.last_name}
                                            onChange={(e) => setRegData({ ...regData, last_name: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none transition"
                                            required
                                        />
                                        <FieldError error={fieldErrors.last_name} />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        {t('phone_number', language)}
                                    </label>
                                    <input
                                        type="tel"
                                        value={regData.phone_number}
                                        onChange={(e) => setRegData({ ...regData, phone_number: e.target.value })}
                                        placeholder="+998901234567"
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none transition"
                                        required
                                    />
                                    <FieldError error={fieldErrors.phone_number} />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        {t('email', language)}
                                    </label>
                                    <input
                                        type="email"
                                        value={regData.email}
                                        onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                                        placeholder="example@mail.uz"
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none transition"
                                        required
                                    />
                                    <FieldError error={fieldErrors.email} />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            {t('password', language)}
                                        </label>
                                        <input
                                            type="password"
                                            value={regData.password}
                                            onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none transition"
                                            required
                                            minLength={3}
                                            maxLength={10}
                                        />
                                        <FieldError error={fieldErrors.password} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            {t('password_confirm', language)}
                                        </label>
                                        <input
                                            type="password"
                                            value={regData.confirm_password}
                                            onChange={(e) => setRegData({ ...regData, confirm_password: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none transition"
                                            required
                                            minLength={3}
                                            maxLength={10}
                                        />
                                        <FieldError error={fieldErrors.confirm_password} />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full mt-2 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-500/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <i className="fa-solid fa-circle-notch fa-spin text-sm"></i>
                                    ) : (
                                        <span>{t('register_btn', language)}</span>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    window.AuthModal = AuthModal;
})();
