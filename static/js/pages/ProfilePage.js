/**
 * iTicket ProfilePage Component
 * Tabbed profile management: personal info, orders history, transactions, addresses CRUD, security with i18n
 */

(function () {
    const { useState, useEffect } = React;
    const { FieldError } = window;
    const { t, formatPrice } = window.i18n;

    function ProfilePage({
        currentUser,
        onUpdateUser,
        onLogout,
        onShowToast,
        onNavigate,
        language = 'uz',
        initialTab = 'profile',
    }) {
        const [activeTab, setActiveTab] = useState(initialTab);

        // Profile Form
        const [profileForm, setProfileForm] = useState({
            first_name: currentUser?.first_name || '',
            last_name: currentUser?.last_name || '',
            gender: currentUser?.gender || '',
            birth_date: currentUser?.birth_date || '',
            country_id: currentUser?.country || '',
        });
        const [savingProfile, setSavingProfile] = useState(false);

        // Orders state
        const [orders, setOrders] = useState([]);
        const [loadingOrders, setLoadingOrders] = useState(false);

        // Transactions state
        const [transactions, setTransactions] = useState({ payments: [], orders: [] });
        const [loadingTrans, setLoadingTrans] = useState(false);

        // Addresses state
        const [addresses, setAddresses] = useState([]);
        const [loadingAddresses, setLoadingAddresses] = useState(false);
        const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
        const [newAddress, setNewAddress] = useState({
            title: '',
            street: '',
            city: 'Toshkent',
            building: '',
            apparition: '',
            email_index: '',
            additional_information: '',
            country_id: 1,
        });

        // Countries list for address
        const [countries, setCountries] = useState([]);

        // Password change form
        const [pwdForm, setPwdForm] = useState({
            old_password: '',
            new_password: '',
            confirm_password: '',
        });
        const [savingPwd, setSavingPwd] = useState(false);
        const [pwdErrors, setPwdErrors] = useState({});

        useEffect(() => {
            if (currentUser) {
                setProfileForm({
                    first_name: currentUser.first_name || '',
                    last_name: currentUser.last_name || '',
                    gender: currentUser.gender || '',
                    birth_date: currentUser.birth_date || '',
                    country_id: currentUser.country || '',
                });
            }
        }, [currentUser]);

        // Load Countries
        useEffect(() => {
            async function fetchCountries() {
                try {
                    const list = await window.apiServices.user.getCountries(language);
                    setCountries(list);
                    if (list.length > 0 && !newAddress.country_id) {
                        setNewAddress((prev) => ({ ...prev, country_id: list[0].id }));
                    }
                } catch (e) {}
            }
            fetchCountries();
        }, [language]);

        // Load active tab data
        useEffect(() => {
            if (activeTab === 'orders') {
                loadOrders();
            } else if (activeTab === 'transactions') {
                loadTransactions();
            } else if (activeTab === 'addresses') {
                loadAddresses();
            }
        }, [activeTab]);

        async function loadOrders() {
            setLoadingOrders(true);
            try {
                const list = await window.apiServices.order.getOrders(language);
                setOrders(list);
            } catch (err) {
                if (onShowToast) onShowToast({ type: 'error', message: err.message || "Buyurtmalarni yuklab bo'lmadi" });
            } finally {
                setLoadingOrders(false);
            }
        }

        async function loadTransactions() {
            setLoadingTrans(true);
            try {
                const data = await window.apiServices.order.getTransactions('all');
                setTransactions(data || { payments: [], orders: [] });
            } catch (err) {
                if (onShowToast) onShowToast({ type: 'error', message: err.message || "Tranzaksiyalarni yuklab bo'lmadi" });
            } finally {
                setLoadingTrans(false);
            }
        }

        async function loadAddresses() {
            setLoadingAddresses(true);
            try {
                const list = await window.apiServices.user.getAddresses();
                setAddresses(list);
            } catch (err) {
                if (onShowToast) onShowToast({ type: 'error', message: err.message || "Manzillarni yuklab bo'lmadi" });
            } finally {
                setLoadingAddresses(false);
            }
        }

        async function handleProfileSave(e) {
            e.preventDefault();
            setSavingProfile(true);
            try {
                const payload = {
                    first_name: profileForm.first_name,
                    last_name: profileForm.last_name,
                    gender: profileForm.gender || null,
                    birth_date: profileForm.birth_date || null,
                };
                if (profileForm.country_id) {
                    payload.country_id = Number(profileForm.country_id);
                }
                const updated = await window.apiServices.user.updateProfile(payload);
                if (onUpdateUser) onUpdateUser(updated);
                if (onShowToast) onShowToast({
                    type: 'success',
                    message: language === 'uz' ? "Profil ma'lumotlari saqlandi" : (language === 'ru' ? "Данные профиля сохранены" : "Profile details saved")
                });
            } catch (err) {
                if (onShowToast) onShowToast({ type: 'error', message: err.message || "Error saving profile" });
            } finally {
                setSavingProfile(false);
            }
        }

        async function handlePayOrder(orderId, amount) {
            try {
                await window.apiServices.order.createPayment({
                    order_id: Number(orderId),
                    total_amount: amount,
                });
                if (onShowToast) onShowToast({
                    type: 'success',
                    message: language === 'uz' ? "To'lov muvaffaqiyatli amalga oshirildi!" : (language === 'ru' ? "Оплата успешно проведена!" : "Payment completed successfully!")
                });
                loadOrders();
            } catch (err) {
                if (onShowToast) onShowToast({ type: 'error', message: err.message || "Payment processing error" });
            }
        }

        async function handleCreateAddress(e) {
            e.preventDefault();
            try {
                await window.apiServices.user.createAddress({
                    ...newAddress,
                    country_id: Number(newAddress.country_id || 1),
                });
                setIsAddAddressOpen(false);
                setNewAddress({
                    title: '',
                    street: '',
                    city: 'Toshkent',
                    building: '',
                    apparition: '',
                    email_index: '',
                    additional_information: '',
                    country_id: countries[0]?.id || 1,
                });
                loadAddresses();
                if (onShowToast) onShowToast({
                    type: 'success',
                    message: language === 'uz' ? "Yangi manzil qo'shildi" : (language === 'ru' ? "Новый адрес добавлен" : "New address added")
                });
            } catch (err) {
                if (onShowToast) onShowToast({ type: 'error', message: err.message || "Error adding address" });
            }
        }

        async function handleDeleteAddress(pk) {
            try {
                await window.apiServices.user.deleteAddress(pk);
                loadAddresses();
                if (onShowToast) onShowToast({
                    type: 'info',
                    message: language === 'uz' ? "Manzil o'chirildi" : (language === 'ru' ? "Адрес удален" : "Address deleted")
                });
            } catch (err) {
                if (onShowToast) onShowToast({ type: 'error', message: err.message || "Error deleting address" });
            }
        }

        async function handlePasswordChange(e) {
            e.preventDefault();
            setPwdErrors({});
            if (pwdForm.new_password !== pwdForm.confirm_password) {
                setPwdErrors({ confirm_password: [t('passwords_dont_match', language)] });
                return;
            }
            setSavingPwd(true);
            try {
                await window.apiServices.user.updatePassword(pwdForm);
                setPwdForm({ old_password: '', new_password: '', confirm_password: '' });
                if (onShowToast) onShowToast({
                    type: 'success',
                    message: language === 'uz' ? "Parol muvaffaqiyatli yangilandi!" : (language === 'ru' ? "Пароль успешно обновлен!" : "Password successfully updated!")
                });
            } catch (err) {
                if (err.fieldErrors) setPwdErrors(err.fieldErrors);
                if (onShowToast) onShowToast({ type: 'error', message: err.message || "Error updating password" });
            } finally {
                setSavingPwd(false);
            }
        }

        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
                {/* Profile Header */}
                <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-500 text-white flex items-center justify-center text-2xl font-black shadow-lg shadow-rose-500/20">
                            {currentUser?.first_name ? currentUser.first_name[0].toUpperCase() : 'U'}
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-slate-900 dark:text-white">
                                {currentUser?.first_name ? `${currentUser.first_name} ${currentUser.last_name || ''}` : t('profile', language)}
                            </h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {currentUser?.phone_number} {currentUser?.email && `• ${currentUser.email}`}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onLogout}
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl text-xs font-bold transition flex items-center gap-2"
                    >
                        <i className="fa-solid fa-arrow-right-from-bracket"></i>
                        <span>{t('logout', language)}</span>
                    </button>
                </div>

                {/* Tabs Navigation */}
                <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl overflow-x-auto scrollbar-none text-xs font-bold gap-1">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`px-4 py-2.5 rounded-xl whitespace-nowrap transition flex items-center gap-2 ${
                            activeTab === 'profile' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <i className="fa-regular fa-user"></i>
                        <span>{t('personal_info', language)}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('orders')}
                        className={`px-4 py-2.5 rounded-xl whitespace-nowrap transition flex items-center gap-2 ${
                            activeTab === 'orders' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <i className="fa-solid fa-receipt"></i>
                        <span>{t('orders_history', language)}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('transactions')}
                        className={`px-4 py-2.5 rounded-xl whitespace-nowrap transition flex items-center gap-2 ${
                            activeTab === 'transactions' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <i className="fa-solid fa-credit-card"></i>
                        <span>{t('payment_history', language)}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('addresses')}
                        className={`px-4 py-2.5 rounded-xl whitespace-nowrap transition flex items-center gap-2 ${
                            activeTab === 'addresses' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <i className="fa-solid fa-location-dot"></i>
                        <span>{t('delivery_addresses', language)}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`px-4 py-2.5 rounded-xl whitespace-nowrap transition flex items-center gap-2 ${
                            activeTab === 'security' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <i className="fa-solid fa-shield-halved"></i>
                        <span>{t('security', language)}</span>
                    </button>
                </div>

                {/* Tab 1: Profile */}
                {activeTab === 'profile' && (
                    <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xs space-y-6 max-w-2xl">
                        <h2 className="text-base font-black text-slate-900 dark:text-white">{t('edit_personal_info', language)}</h2>

                        <form onSubmit={handleProfileSave} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('first_name', language)}</label>
                                    <input
                                        type="text"
                                        value={profileForm.first_name}
                                        onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-rose-500 outline-none transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('last_name', language)}</label>
                                    <input
                                        type="text"
                                        value={profileForm.last_name}
                                        onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-rose-500 outline-none transition"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('phone_number', language)}</label>
                                    <input
                                        type="text"
                                        value={currentUser?.phone_number || ''}
                                        disabled
                                        className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-500 dark:text-slate-500 cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('email', language)}</label>
                                    <input
                                        type="email"
                                        value={currentUser?.email || ''}
                                        disabled
                                        className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-500 dark:text-slate-500 cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('gender', language)}</label>
                                    <select
                                        value={profileForm.gender}
                                        onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-rose-500 outline-none transition"
                                    >
                                        <option value="">{t('not_specified', language)}</option>
                                        <option value="male">{t('male', language)}</option>
                                        <option value="female">{t('female', language)}</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('birth_date', language)}</label>
                                    <input
                                        type="date"
                                        value={profileForm.birth_date || ''}
                                        onChange={(e) => setProfileForm({ ...profileForm, birth_date: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-rose-500 outline-none transition"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={savingProfile}
                                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md shadow-rose-600/20 disabled:opacity-50"
                            >
                                {savingProfile ? <i className="fa-solid fa-circle-notch fa-spin"></i> : t('save', language)}
                            </button>
                        </form>
                    </div>
                )}

                {/* Tab 2: Orders */}
                {activeTab === 'orders' && (
                    <div className="space-y-4">
                        {loadingOrders ? (
                            <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
                                {language === 'uz' ? "Buyurtmalar yuklanmoqda..." : "Loading orders..."}
                            </div>
                        ) : orders.length > 0 ? (
                            orders.map((ord) => (
                                <div key={ord.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xs space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
                                        <div>
                                            <span className="text-xs font-black text-slate-900 dark:text-white">{t('order_num', language)}{ord.id}</span>
                                            <span className="text-slate-400 dark:text-slate-500 text-xs ml-3">
                                                {new Date(ord.created_at).toLocaleDateString(language === 'uz' ? 'uz-UZ' : (language === 'ru' ? 'ru-RU' : 'en-US'), {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric',
                                                })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                                                    ord.status === 'delivered'
                                                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                                                        : ord.status === 'pending'
                                                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                                                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                                                }`}
                                            >
                                                {ord.status === 'delivered' ? t('status_delivered', language) : (ord.status === 'pending' ? t('status_pending', language) : t('status_cancelled', language))}
                                            </span>
                                            {ord.status === 'pending' && Number(ord.total_paid) < Number(ord.total_amount) && (
                                                <button
                                                    onClick={() => handlePayOrder(ord.id, ord.total_amount)}
                                                    className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                                                >
                                                    {t('pay', language)}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Order Items */}
                                    <div className="space-y-2">
                                        {ord.order_item?.map((item) => (
                                            <div key={item.id} className="flex justify-between items-center text-xs py-1">
                                                <div>
                                                    <span className="font-bold text-slate-800 dark:text-slate-200">{item.ticket?.title || "Chipta"}</span>
                                                    <span className="text-slate-500 dark:text-slate-400 ml-2">x {item.count} {t('events_count', language)}</span>
                                                </div>
                                                <span className="font-bold text-slate-900 dark:text-white">{formatPrice(item.price_at_purchase * item.count, language)}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-baseline text-xs">
                                        <span className="text-slate-500 dark:text-slate-400">{t('total_payment', language)}:</span>
                                        <span className="text-base font-black text-rose-600 dark:text-rose-400">{formatPrice(ord.total_amount, language)}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-100 dark:border-slate-800 text-center space-y-2">
                                <i className="fa-solid fa-receipt text-3xl text-slate-300 dark:text-slate-600"></i>
                                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">{t('no_orders_yet', language)}</h3>
                                <p className="text-xs text-slate-400 dark:text-slate-500">{t('no_orders_desc', language)}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Tab 3: Transactions */}
                {activeTab === 'transactions' && (
                    <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xs space-y-6">
                        <h2 className="text-base font-black text-slate-900 dark:text-white">{t('payment_history', language)}</h2>
                        {loadingTrans ? (
                            <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                                {language === 'uz' ? "Tranzaksiyalar yuklanmoqda..." : "Loading transactions..."}
                            </div>
                        ) : transactions.payments && transactions.payments.length > 0 ? (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {transactions.payments.map((p) => (
                                    <div key={p.id} className="py-3.5 flex justify-between items-center text-xs">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-slate-800 dark:text-slate-200">To'lov #{p.id}</span>
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold uppercase">
                                                    {p.status}
                                                </span>
                                            </div>
                                            <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 block">
                                                {t('order_num', language)}{p.order} • {new Date(p.created_at).toLocaleString(language === 'uz' ? 'uz-UZ' : 'ru-RU')}
                                            </span>
                                        </div>
                                        <span className="font-black text-sm text-slate-900 dark:text-white">
                                            {formatPrice(p.total_amount, language)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-8">
                                {language === 'uz' ? "Hozircha hech qanday to'lov mavjud emas." : "No payment records found."}
                            </p>
                        )}
                    </div>
                )}

                {/* Tab 4: Addresses */}
                {activeTab === 'addresses' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-base font-black text-slate-900 dark:text-white">{t('delivery_addresses', language)}</h2>
                            <button
                                onClick={() => setIsAddAddressOpen(true)}
                                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-rose-600/20"
                            >
                                <i className="fa-solid fa-plus text-xs"></i>
                                <span>{t('new_address', language)}</span>
                            </button>
                        </div>

                        {/* Modal to add address */}
                        {isAddAddressOpen && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
                                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-4 shadow-2xl border border-slate-100 dark:border-slate-800">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-bold text-base text-slate-900 dark:text-white">{t('add_new_address', language)}</h3>
                                        <button onClick={() => setIsAddAddressOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                            <i className="fa-solid fa-xmark"></i>
                                        </button>
                                    </div>

                                    <form onSubmit={handleCreateAddress} className="space-y-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('address_title', language)}</label>
                                            <input
                                                type="text"
                                                value={newAddress.title}
                                                onChange={(e) => setNewAddress({ ...newAddress, title: e.target.value })}
                                                placeholder={t('address_title', language)}
                                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 outline-none"
                                                required
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('city', language)}</label>
                                                <input
                                                    type="text"
                                                    value={newAddress.city}
                                                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 outline-none"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('street', language)}</label>
                                                <input
                                                    type="text"
                                                    value={newAddress.street}
                                                    onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 outline-none"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-3">
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('building', language)}</label>
                                                <input
                                                    type="text"
                                                    value={newAddress.building}
                                                    onChange={(e) => setNewAddress({ ...newAddress, building: e.target.value })}
                                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 outline-none"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('apartment', language)}</label>
                                                <input
                                                    type="text"
                                                    value={newAddress.apparition}
                                                    onChange={(e) => setNewAddress({ ...newAddress, apparition: e.target.value })}
                                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 outline-none"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('postal_code', language)}</label>
                                                <input
                                                    type="text"
                                                    value={newAddress.email_index}
                                                    onChange={(e) => setNewAddress({ ...newAddress, email_index: e.target.value })}
                                                    placeholder="100000"
                                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 outline-none"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('additional_info', language)}</label>
                                            <textarea
                                                value={newAddress.additional_information}
                                                onChange={(e) => setNewAddress({ ...newAddress, additional_information: e.target.value })}
                                                rows="2"
                                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 outline-none"
                                                required
                                            ></textarea>
                                        </div>

                                        <button
                                            type="submit"
                                            className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition"
                                        >
                                            {t('save_address', language)}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}

                        {loadingAddresses ? (
                            <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                                {language === 'uz' ? "Manzillar yuklanmoqda..." : "Loading addresses..."}
                            </div>
                        ) : addresses.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {addresses.map((addr) => (
                                    <div key={addr.id} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xs flex justify-between items-start">
                                        <div className="space-y-1 text-xs">
                                            <h4 className="font-bold text-sm text-slate-900 dark:text-white">{addr.title}</h4>
                                            <p className="text-slate-600 dark:text-slate-300">{addr.city}, {addr.street}, {addr.building}, {addr.apparition}</p>
                                            <p className="text-[11px] text-slate-400 dark:text-slate-500">{t('postal_code', language)}: {addr.email_index}</p>
                                            {addr.additional_information && (
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic mt-1">{addr.additional_information}</p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleDeleteAddress(addr.id)}
                                            className="text-slate-400 hover:text-rose-600 p-2"
                                            title="Delete"
                                        >
                                            <i className="fa-regular fa-trash-can"></i>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-slate-900 p-10 rounded-3xl border border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
                                {t('no_addresses', language)}
                            </div>
                        )}
                    </div>
                )}

                {/* Tab 5: Security */}
                {activeTab === 'security' && (
                    <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xs space-y-6 max-w-md">
                        <h2 className="text-base font-black text-slate-900 dark:text-white">{t('change_password', language)}</h2>

                        <form onSubmit={handlePasswordChange} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('current_password', language)}</label>
                                <input
                                    type="password"
                                    value={pwdForm.old_password}
                                    onChange={(e) => setPwdForm({ ...pwdForm, old_password: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-rose-500 outline-none"
                                    required
                                />
                                <FieldError error={pwdErrors.old_password} />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('new_password', language)}</label>
                                <input
                                    type="password"
                                    value={pwdForm.new_password}
                                    onChange={(e) => setPwdForm({ ...pwdForm, new_password: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-rose-500 outline-none"
                                    required
                                    minLength={3}
                                    maxLength={10}
                                />
                                <FieldError error={pwdErrors.new_password} />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('confirm_new_password', language)}</label>
                                <input
                                    type="password"
                                    value={pwdForm.confirm_password}
                                    onChange={(e) => setPwdForm({ ...pwdForm, confirm_password: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 outline-none"
                                    required
                                    minLength={3}
                                    maxLength={10}
                                />
                                <FieldError error={pwdErrors.confirm_password} />
                            </div>

                            <button
                                type="submit"
                                disabled={savingPwd}
                                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-rose-600/20 disabled:opacity-50"
                            >
                                {savingPwd ? <i className="fa-solid fa-circle-notch fa-spin"></i> : t('update_password_btn', language)}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        );
    }

    window.ProfilePage = ProfilePage;
})();
