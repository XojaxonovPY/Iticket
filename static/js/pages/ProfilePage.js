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
        const [expandedOrders, setExpandedOrders] = useState({});

        // Transactions state
        const [transactions, setTransactions] = useState({ payments: [], orders: [] });
        const [loadingTrans, setLoadingTrans] = useState(false);
        const [transFilter, setTransFilter] = useState('all');
        const [expandedPayments, setExpandedPayments] = useState({});
        const [payingOrderId, setPayingOrderId] = useState(null);
        const [payModal, setPayModal] = useState(null);

        // Addresses state
        const [addresses, setAddresses] = useState([]);
        const [loadingAddresses, setLoadingAddresses] = useState(false);
        const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
        const [editingAddress, setEditingAddress] = useState(null);
        const [newAddress, setNewAddress] = useState({
            title: '',
            street: '',
            city: 'Toshkent',
            building: '',
            apparition: '',
            email_index: '',
            additional_information: '',
            country_id: '',
        });

        // Countries list for address & profile
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
                    setCountries(list || []);
                    if (list && list.length > 0) {
                        setNewAddress((prev) => ({
                            ...prev,
                            country_id: prev.country_id || list[0].id,
                        }));
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

        function toggleOrderExpand(orderId) {
            setExpandedOrders((prev) => ({
                ...prev,
                [orderId]: !prev[orderId],
            }));
        }

        function togglePaymentExpand(paymentId) {
            setExpandedPayments((prev) => ({
                ...prev,
                [paymentId]: !prev[paymentId],
            }));
        }

        async function loadTransactions(filter = transFilter) {
            setLoadingTrans(true);
            try {
                const data = await window.apiServices.order.getTransactions(filter, language);
                if (filter === 'all') {
                    setTransactions(data || { payments: [], orders: [] });
                } else if (filter === 'send') {
                    setTransactions({ payments: Array.isArray(data) ? data : [], orders: [] });
                } else if (filter === 'pending') {
                    setTransactions({ payments: [], orders: Array.isArray(data) ? data : [] });
                } else if (filter === 'receive') {
                    setTransactions({ payments: [], orders: Array.isArray(data) ? data : [] });
                }
            } catch (err) {
                if (onShowToast) onShowToast({ type: 'error', message: err.message || "Tranzaksiyalarni yuklab bo'lmadi" });
            } finally {
                setLoadingTrans(false);
            }
        }

        function handleFilterChange(newFilter) {
            setTransFilter(newFilter);
            loadTransactions(newFilter);
        }

        function openPayModal(orderId, totalAmount, totalPaid = 0) {
            const total = Number(totalAmount) || 0;
            const paid = Number(totalPaid) || 0;
            const unpaid = Math.max(0, total - paid);
            setPayModal({
                orderId: Number(orderId),
                totalAmount: total,
                totalPaid: paid,
                unpaidAmount: unpaid,
                payAmount: unpaid,
            });
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
                const patchPayload = {};
                if ((profileForm.first_name || '').trim() !== (currentUser?.first_name || '').trim()) {
                    patchPayload.first_name = (profileForm.first_name || '').trim();
                }
                if ((profileForm.last_name || '').trim() !== (currentUser?.last_name || '').trim()) {
                    patchPayload.last_name = (profileForm.last_name || '').trim();
                }
                if ((profileForm.gender || null) !== (currentUser?.gender || null)) {
                    patchPayload.gender = profileForm.gender || null;
                }
                if ((profileForm.birth_date || null) !== (currentUser?.birth_date || null)) {
                    patchPayload.birth_date = profileForm.birth_date || null;
                }
                const newCId = profileForm.country_id ? Number(profileForm.country_id) : null;
                const oldCId = currentUser?.country ? Number(currentUser.country) : null;
                if (newCId !== oldCId) {
                    patchPayload.country_id = newCId;
                }

                if (Object.keys(patchPayload).length === 0) {
                    if (onShowToast) onShowToast({
                        type: 'info',
                        message: language === 'uz' ? "Hech qanday o'zgarish kiritilmadi" : "No changes made"
                    });
                    setSavingProfile(false);
                    return;
                }

                const updated = await window.apiServices.user.updateProfile(patchPayload);
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
            if (!orderId || !amount || Number(amount) <= 0) return;
            setPayingOrderId(orderId);
            try {
                const res = await window.apiServices.order.createPayment({
                    order_id: Number(orderId),
                    total_amount: Number(amount),
                });
                if (onShowToast) onShowToast({
                    type: 'success',
                    message: res.message || (language === 'uz' ? "To'lov muvaffaqiyatli amalga oshirildi!" : (language === 'ru' ? "Оплата успешно проведена!" : "Payment completed successfully!"))
                });
                setPayModal(null);
                await loadOrders();
                await loadTransactions(transFilter);
            } catch (err) {
                if (onShowToast) onShowToast({ type: 'error', message: err.message || (language === 'uz' ? "To'lovda xatolik yuz berdi" : "Payment processing error") });
            } finally {
                setPayingOrderId(null);
            }
        }

        function openAddAddressModal() {
            setEditingAddress(null);
            setNewAddress({
                title: '',
                street: '',
                city: 'Toshkent',
                building: '',
                apparition: '',
                email_index: '',
                additional_information: '',
                country_id: countries[0]?.id || 22,
            });
            setIsAddAddressOpen(true);
        }

        function openEditAddressModal(addr) {
            setEditingAddress(addr);
            setNewAddress({
                title: addr.title || '',
                street: addr.street || '',
                city: addr.city || '',
                building: addr.building || '',
                apparition: addr.apparition || '',
                email_index: addr.email_index || '',
                additional_information: addr.additional_information || '',
                country_id: addr.country || (countries[0]?.id || 22),
            });
            setIsAddAddressOpen(true);
        }

        async function handleSaveAddress(e) {
            e.preventDefault();
            try {
                if (editingAddress) {
                    const patchPayload = {};
                    const stringFields = [
                        'title',
                        'city',
                        'street',
                        'building',
                        'apparition',
                        'email_index',
                        'additional_information',
                    ];

                    stringFields.forEach((field) => {
                        const newVal = (newAddress[field] || '').trim();
                        const oldVal = (editingAddress[field] || '').trim();
                        if (newVal !== oldVal) {
                            patchPayload[field] = newVal;
                        }
                    });

                    const origCountryId = Number(editingAddress.country) || null;
                    const newCountryId = Number(newAddress.country_id) || null;
                    if (newCountryId !== null && newCountryId !== origCountryId) {
                        patchPayload.country_id = newCountryId;
                    }

                    if (Object.keys(patchPayload).length === 0) {
                        if (onShowToast) onShowToast({
                            type: 'info',
                            message: language === 'uz' ? "Hech qanday o'zgarish kiritilmadi" : "No changes made"
                        });
                        setIsAddAddressOpen(false);
                        setEditingAddress(null);
                        return;
                    }

                    await window.apiServices.user.updateAddress(editingAddress.id, patchPayload);
                    if (onShowToast) onShowToast({
                        type: 'success',
                        message: language === 'uz' ? "Manzil muvaffaqiyatli yangilandi" : (language === 'ru' ? "Адрес успешно обновлен" : "Address updated successfully")
                    });
                } else {
                    const selectedCountryId = Number(newAddress.country_id) || (countries[0]?.id || 22);
                    const createPayload = {
                        ...newAddress,
                        country_id: selectedCountryId,
                    };
                    await window.apiServices.user.createAddress(createPayload);
                    if (onShowToast) onShowToast({
                        type: 'success',
                        message: language === 'uz' ? "Yangi manzil muvaffaqiyatli qo'shildi" : (language === 'ru' ? "Новый адрес успешно добавлен" : "New address added successfully")
                    });
                }
                setIsAddAddressOpen(false);
                setEditingAddress(null);
                setNewAddress({
                    title: '',
                    street: '',
                    city: 'Toshkent',
                    building: '',
                    apparition: '',
                    email_index: '',
                    additional_information: '',
                    country_id: countries[0]?.id || 22,
                });
                loadAddresses();
            } catch (err) {
                if (onShowToast) onShowToast({
                    type: 'error',
                    message: err.message || (language === 'uz' ? "Manzilni saqlashda xatolik yuz berdi" : "Error saving address")
                });
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
                                <i className="fa-solid fa-circle-notch fa-spin mr-2"></i>
                                {language === 'uz' ? "Buyurtmalar yuklanmoqda..." : "Loading orders..."}
                            </div>
                        ) : orders.length > 0 ? (
                            orders.map((ord) => {
                                const isExpanded = !!expandedOrders[ord.id];
                                const isDelivered = ord.status === 'delivered';
                                const isPending = ord.status === 'pending';
                                const isCancelled = ord.status === 'cancelled';
                                const unpaidAmount = Math.max(0, Number(ord.total_amount) - Number(ord.total_paid));
                                const canPay = (isPending || unpaidAmount > 0) && !isCancelled;

                                return (
                                    <div 
                                        key={ord.id} 
                                        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xs overflow-hidden transition"
                                    >
                                        {/* Order Header - Clickable Accordion Header */}
                                        <div 
                                            onClick={() => toggleOrderExpand(ord.id)}
                                            className="p-5 sm:p-6 cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200">
                                                    <i className="fa-solid fa-receipt text-sm"></i>
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-black text-slate-900 dark:text-white">
                                                            {t('order_num', language, 'Buyurtma #')}{ord.id}
                                                        </span>
                                                        <span
                                                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                                                isDelivered
                                                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50'
                                                                    : isPending
                                                                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50'
                                                                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50'
                                                            }`}
                                                        >
                                                            {isDelivered 
                                                                ? t('status_delivered', language, 'Yetkazildi / To\'landi') 
                                                                : (isPending 
                                                                    ? t('filter_pending', language, 'O\'tkazma kutilmoqda') 
                                                                    : t('status_cancelled', language, 'Bekor qilindi'))}
                                                        </span>
                                                    </div>
                                                    <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 block">
                                                        {new Date(ord.created_at).toLocaleDateString(language === 'uz' ? 'uz-UZ' : (language === 'ru' ? 'ru-RU' : 'en-US'), {
                                                            day: 'numeric',
                                                            month: 'long',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                        {ord.order_item?.length ? ` • ${ord.order_item.length} ta chipta turi` : ''}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between sm:justify-end gap-4">
                                                <div className="text-left sm:text-right">
                                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase font-medium">
                                                        {t('total_sum', language, 'Jami')}
                                                    </span>
                                                    <span className="text-sm font-black text-slate-900 dark:text-white">
                                                        {formatPrice(ord.total_amount, language)}
                                                    </span>
                                                </div>

                                                {canPay && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openPayModal(ord.id, ord.total_amount, ord.total_paid);
                                                        }}
                                                        disabled={payingOrderId === ord.id}
                                                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                                                    >
                                                        {payingOrderId === ord.id ? (
                                                            <i className="fa-solid fa-circle-notch fa-spin"></i>
                                                        ) : (
                                                            <i className="fa-solid fa-credit-card"></i>
                                                        )}
                                                        <span>{t('pay', language, "To'lash")}</span>
                                                    </button>
                                                )}

                                                <div className="text-slate-400 dark:text-slate-500 text-xs pl-1">
                                                    <i className={`fa-solid fa-chevron-down transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}></i>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Order Items Section - Accordion Body */}
                                        {isExpanded && (
                                            <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 p-5 sm:p-6 space-y-4 animate-fade-in">
                                                <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 pb-2 border-b border-slate-200/60 dark:border-slate-800">
                                                    <span>{t('order_items', language, 'Buyurtma tarkibi')}</span>
                                                    <span>{ord.order_item?.length || 0} {t('events_count', language, 'dona')}</span>
                                                </div>

                                                <div className="space-y-3">
                                                    {ord.order_item && ord.order_item.length > 0 ? (
                                                        ord.order_item.map((item) => (
                                                            <div 
                                                                key={item.id} 
                                                                className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center font-bold">
                                                                        <i className="fa-solid fa-ticket"></i>
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-bold text-slate-900 dark:text-white">
                                                                            {item.ticket?.title || t('ticket', language, 'Chipta')}
                                                                        </p>
                                                                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                                                            {formatPrice(item.price_at_purchase, language)} × {item.count} {t('events_count', language, 'dona')}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <span className="font-bold text-slate-900 dark:text-white">
                                                                    {formatPrice(item.price_at_purchase * item.count, language)}
                                                                </span>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p className="text-xs text-slate-400 text-center py-2">
                                                            {language === 'uz' ? "Buyurtma tarkibi mavjud emas" : "No items found"}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Summary inside expanded card */}
                                                <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                                    <div className="space-y-1 text-slate-500 dark:text-slate-400">
                                                        <div className="flex gap-4">
                                                            <span>{t('paid_amount_label', language, "To'langan")}:</span>
                                                            <span className="font-bold text-slate-800 dark:text-slate-200">
                                                                {formatPrice(ord.total_paid, language)}
                                                            </span>
                                                        </div>
                                                        {unpaidAmount > 0 && (
                                                            <div className="flex gap-4">
                                                                <span>{t('unpaid_balance', language, "To'lanishi kerak")}:</span>
                                                                <span className="font-bold text-rose-600 dark:text-rose-400">
                                                                    {formatPrice(unpaidAmount, language)}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {canPay && (
                                                        <button
                                                            type="button"
                                                            onClick={() => openPayModal(ord.id, ord.total_amount, ord.total_paid)}
                                                            disabled={payingOrderId === ord.id}
                                                            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-rose-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                                                        >
                                                            {payingOrderId === ord.id ? (
                                                                <i className="fa-solid fa-circle-notch fa-spin"></i>
                                                            ) : (
                                                                <i className="fa-solid fa-credit-card"></i>
                                                            )}
                                                            <span>{t('pay_order', language, "Buyurtmani to'lash")} ({formatPrice(unpaidAmount || ord.total_amount, language)})</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-100 dark:border-slate-800 text-center space-y-2">
                                <i className="fa-solid fa-receipt text-3xl text-slate-300 dark:text-slate-600"></i>
                                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">{t('no_orders_yet', language, "Sizda hali buyurtmalar yo'q")}</h3>
                                <p className="text-xs text-slate-400 dark:text-slate-500">{t('no_orders_desc', language, "Tadbir tanlab, chipta xarid qilishni boshlang!")}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Tab 3: Transactions */}
                {activeTab === 'transactions' && (
                    <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xs space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <h2 className="text-base font-black text-slate-900 dark:text-white">
                                {t('payment_history', language, "To'lovlar tarixi")}
                            </h2>
                        </div>

                        {/* Status Filter Pills (matching apps/filters.py & UI snapshot) */}
                        <div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
                            {[
                                { key: 'all', label: t('filter_all', language, 'Barchasi') },
                                { key: 'pending', label: t('filter_pending', language, "O'tkazma kutilmoqda") },
                                { key: 'send', label: t('filter_send', language, 'Yuborilgan') },
                                { key: 'receive', label: t('filter_receive', language, 'Qabul qilingan') },
                            ].map((f) => {
                                const isActive = transFilter === f.key;
                                return (
                                    <button
                                        key={f.key}
                                        type="button"
                                        onClick={() => handleFilterChange(f.key)}
                                        className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
                                            isActive
                                                ? 'bg-rose-600 text-white shadow-xs'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                        }`}
                                    >
                                        {f.label}
                                    </button>
                                );
                            })}
                        </div>

                        {loadingTrans ? (
                            <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
                                <i className="fa-solid fa-circle-notch fa-spin mr-2"></i>
                                {language === 'uz' ? "Ma'lumotlar yuklanmoqda..." : "Loading records..."}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* 1. PENDING FILTER (Orders where total_paid == 0) */}
                                {transFilter === 'pending' && (
                                    transactions.orders && transactions.orders.length > 0 ? (
                                        transactions.orders.map((ord) => {
                                            const isExpanded = !!expandedOrders[ord.id];
                                            return (
                                                <div 
                                                    key={ord.id} 
                                                    className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/80 overflow-hidden transition"
                                                >
                                                    <div 
                                                        onClick={() => toggleOrderExpand(ord.id)}
                                                        className="p-4 sm:p-5 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                                    >
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-slate-900 dark:text-white text-xs">
                                                                    {t('order_num', language, 'Buyurtma #')}{ord.id}
                                                                </span>
                                                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
                                                                    {t('filter_pending', language, "O'tkazma kutilmoqda")}
                                                                </span>
                                                            </div>
                                                            <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 block">
                                                                {new Date(ord.created_at).toLocaleString(language === 'uz' ? 'uz-UZ' : (language === 'ru' ? 'ru-RU' : 'en-US'))}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center justify-between sm:justify-end gap-3">
                                                            <span className="font-black text-sm text-slate-900 dark:text-white">
                                                                {formatPrice(ord.total_amount, language)}
                                                            </span>

                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    openPayModal(ord.id, ord.total_amount, ord.total_paid || 0);
                                                                }}
                                                                disabled={payingOrderId === ord.id}
                                                                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                                                            >
                                                                {payingOrderId === ord.id ? (
                                                                    <i className="fa-solid fa-circle-notch fa-spin"></i>
                                                                ) : (
                                                                    <i className="fa-solid fa-credit-card"></i>
                                                                )}
                                                                <span>{t('pay', language, "To'lash")}</span>
                                                            </button>

                                                            <i className={`fa-solid fa-chevron-down text-slate-400 text-xs transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}></i>
                                                        </div>
                                                    </div>

                                                    {/* Items inside pending order */}
                                                    {isExpanded && (
                                                        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-2 text-xs">
                                                            <span className="font-bold text-slate-600 dark:text-slate-400 block mb-2">
                                                                {t('order_items', language, 'Buyurtma tarkibi')}:
                                                            </span>
                                                            {ord.order_item?.map((item) => (
                                                                <div key={item.id} className="flex justify-between items-center py-1">
                                                                    <span className="text-slate-800 dark:text-slate-200">
                                                                        {item.ticket?.title || t('ticket', language, 'Chipta')} × {item.count}
                                                                    </span>
                                                                    <span className="font-bold text-slate-900 dark:text-white">
                                                                        {formatPrice(item.price_at_purchase * item.count, language)}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-10">
                                            {language === 'uz' ? "Kutilayotgan to'lovlar mavjud emas." : "No pending transfers found."}
                                        </p>
                                    )
                                )}

                                {/* 2. SEND FILTER (Payments with Transactions) */}
                                {transFilter === 'send' && (
                                    transactions.payments && transactions.payments.length > 0 ? (
                                        transactions.payments.map((p) => {
                                            const isExpanded = !!expandedPayments[p.id];
                                            const isCompleted = p.status === 'completed';
                                            const isPending = p.status === 'pending';
                                            const isCancelled = p.status === 'cancelled';

                                            return (
                                                <div 
                                                    key={p.id} 
                                                    className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 overflow-hidden transition"
                                                >
                                                    <div 
                                                        onClick={() => togglePaymentExpand(p.id)}
                                                        className="p-4 sm:p-5 cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none"
                                                    >
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                                                                    {t('payment_num', language, 'To\'lov #')}{p.id}
                                                                </span>
                                                                <span
                                                                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                                                                        isCompleted
                                                                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                                                                            : isPending
                                                                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60'
                                                                            : isCancelled
                                                                            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60'
                                                                            : 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/60'
                                                                    }`}
                                                                >
                                                                    {isCompleted 
                                                                        ? t('status_completed', language, 'Muvaffaqiyatli') 
                                                                        : (isPending 
                                                                            ? t('status_pending', language, 'Kutilmoqda') 
                                                                            : (isCancelled ? t('status_cancelled', language, 'Bekor qilindi') : p.status))}
                                                                </span>
                                                            </div>
                                                            <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 block">
                                                                {t('order_num', language, 'Buyurtma #')}{p.order} • {new Date(p.created_at).toLocaleString(language === 'uz' ? 'uz-UZ' : (language === 'ru' ? 'ru-RU' : 'en-US'))}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center justify-between sm:justify-end gap-3">
                                                            <span className="font-black text-sm text-slate-900 dark:text-white">
                                                                {formatPrice(p.total_amount, language)}
                                                            </span>

                                                            {isPending && (
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        openPayModal(p.order, p.total_amount, 0);
                                                                    }}
                                                                    disabled={payingOrderId === p.order}
                                                                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                                                                >
                                                                    {payingOrderId === p.order ? (
                                                                        <i className="fa-solid fa-circle-notch fa-spin"></i>
                                                                    ) : (
                                                                        <i className="fa-solid fa-credit-card"></i>
                                                                    )}
                                                                    <span>{t('pay', language, "To'lash")}</span>
                                                                </button>
                                                            )}

                                                            <div className="flex items-center gap-1 text-slate-400 text-xs">
                                                                <span className="text-[11px] font-medium hidden sm:inline">
                                                                    {p.transactions?.length || 0} ta tranzaksiya
                                                                </span>
                                                                <i className={`fa-solid fa-chevron-down transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}></i>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Transactions History Accordion */}
                                                    {isExpanded && (
                                                        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/30 space-y-3 animate-fade-in">
                                                            <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                                                                <span>{t('transactions_history', language, 'Tranzaksiyalar tarixi')}</span>
                                                                <span>{p.transactions?.length || 0} {t('events_count', language, 'dona')}</span>
                                                            </div>

                                                            {p.transactions && p.transactions.length > 0 ? (
                                                                <div className="space-y-2">
                                                                    {p.transactions.map((tx) => (
                                                                        <div 
                                                                            key={tx.id} 
                                                                            className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 flex justify-between items-center text-xs"
                                                                        >
                                                                            <div className="flex items-center gap-2.5">
                                                                                <div className={`w-2 h-2 rounded-full ${tx.status === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                                                                                <div>
                                                                                    <span className="font-bold text-slate-800 dark:text-slate-200">
                                                                                        {t('transaction_id', language, 'Tranzaksiya #')}{tx.id}
                                                                                    </span>
                                                                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-2">
                                                                                        {new Date(tx.created_at).toLocaleString(language === 'uz' ? 'uz-UZ' : (language === 'ru' ? 'ru-RU' : 'en-US'))}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex items-center gap-3">
                                                                                <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${
                                                                                    tx.status === 'success' 
                                                                                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' 
                                                                                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                                                                                }`}>
                                                                                    {tx.status === 'success' ? t('status_success', language, 'Muvaffaqiyatli') : t('status_failed', language, 'Muvaffaqiyatsiz')}
                                                                                </span>
                                                                                <span className="font-bold text-slate-900 dark:text-white">
                                                                                    {formatPrice(tx.amount, language)}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <p className="text-xs text-slate-400 text-center py-2">
                                                                    {t('no_transactions_yet', language, 'Tranzaksiyalar tarixi mavjud emas')}
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-10">
                                            {language === 'uz' ? "Yuborilgan to'lovlar mavjud emas." : "No sent payments found."}
                                        </p>
                                    )
                                )}

                                {/* 3. RECEIVE FILTER (Orders where total_paid > 0) */}
                                {transFilter === 'receive' && (
                                    transactions.orders && transactions.orders.length > 0 ? (
                                        transactions.orders.map((ord) => {
                                            const isExpanded = !!expandedOrders[ord.id];
                                            return (
                                                <div 
                                                    key={ord.id} 
                                                    className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 overflow-hidden transition"
                                                >
                                                    <div 
                                                        onClick={() => toggleOrderExpand(ord.id)}
                                                        className="p-4 sm:p-5 cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                                    >
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-slate-900 dark:text-white text-xs">
                                                                    {t('order_num', language, 'Buyurtma #')}{ord.id}
                                                                </span>
                                                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                                                                    {t('filter_receive', language, 'Qabul qilingan')}
                                                                </span>
                                                            </div>
                                                            <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 block">
                                                                {new Date(ord.created_at).toLocaleString(language === 'uz' ? 'uz-UZ' : (language === 'ru' ? 'ru-RU' : 'en-US'))}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center justify-between sm:justify-end gap-3">
                                                            <span className="font-black text-sm text-slate-900 dark:text-white">
                                                                {formatPrice(ord.total_paid, language)}
                                                            </span>
                                                            <i className={`fa-solid fa-chevron-down text-slate-400 text-xs transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}></i>
                                                        </div>
                                                    </div>

                                                    {isExpanded && (
                                                        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/30 space-y-2 text-xs">
                                                            <span className="font-bold text-slate-600 dark:text-slate-400 block mb-2">
                                                                {t('order_items', language, 'Buyurtma tarkibi')}:
                                                            </span>
                                                            {ord.order_item?.map((item) => (
                                                                <div key={item.id} className="flex justify-between items-center py-1">
                                                                    <span className="text-slate-800 dark:text-slate-200">
                                                                        {item.ticket?.title || t('ticket', language, 'Chipta')} × {item.count}
                                                                    </span>
                                                                    <span className="font-bold text-slate-900 dark:text-white">
                                                                        {formatPrice(item.price_at_purchase * item.count, language)}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-10">
                                            {language === 'uz' ? "Qabul qilingan to'lovlar mavjud emas." : "No received transactions found."}
                                        </p>
                                    )
                                )}

                                {/* 4. ALL FILTER (Both Payments and Orders) */}
                                {transFilter === 'all' && (
                                    (transactions.payments?.length > 0 || transactions.orders?.length > 0) ? (
                                        <div className="space-y-6">
                                            {/* Payments list with transactions history */}
                                            {transactions.payments?.length > 0 && (
                                                <div className="space-y-3">
                                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                        {t('payment_history', language, "To'lovlar")} ({transactions.payments.length})
                                                    </h3>
                                                    {transactions.payments.map((p) => {
                                                        const isExpanded = !!expandedPayments[p.id];
                                                        const isCompleted = p.status === 'completed';
                                                        const isPending = p.status === 'pending';
                                                        const isCancelled = p.status === 'cancelled';

                                                        return (
                                                            <div 
                                                                key={p.id} 
                                                                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 overflow-hidden transition"
                                                            >
                                                                <div 
                                                                    onClick={() => togglePaymentExpand(p.id)}
                                                                    className="p-4 sm:p-5 cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none"
                                                                >
                                                                    <div>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                                                                                {t('payment_num', language, 'To\'lov #')}{p.id}
                                                                            </span>
                                                                            <span
                                                                                className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                                                                                    isCompleted
                                                                                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                                                                                        : isPending
                                                                                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60'
                                                                                        : isCancelled
                                                                                        ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60'
                                                                                        : 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/60'
                                                                                }`}
                                                                            >
                                                                                {isCompleted 
                                                                                    ? t('status_completed', language, 'Muvaffaqiyatli') 
                                                                                    : (isPending 
                                                                                        ? t('status_pending', language, 'Kutilmoqda') 
                                                                                        : (isCancelled ? t('status_cancelled', language, 'Bekor qilindi') : p.status))}
                                                                            </span>
                                                                        </div>
                                                                        <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 block">
                                                                            {t('order_num', language, 'Buyurtma #')}{p.order} • {new Date(p.created_at).toLocaleString(language === 'uz' ? 'uz-UZ' : (language === 'ru' ? 'ru-RU' : 'en-US'))}
                                                                        </span>
                                                                    </div>

                                                                    <div className="flex items-center justify-between sm:justify-end gap-3">
                                                                        <span className="font-black text-sm text-slate-900 dark:text-white">
                                                                            {formatPrice(p.total_amount, language)}
                                                                        </span>

                                                                        {isPending && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    openPayModal(p.order, p.total_amount, 0);
                                                                                }}
                                                                                disabled={payingOrderId === p.order}
                                                                                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                                                                            >
                                                                                {payingOrderId === p.order ? (
                                                                                    <i className="fa-solid fa-circle-notch fa-spin"></i>
                                                                                ) : (
                                                                                    <i className="fa-solid fa-credit-card"></i>
                                                                                )}
                                                                                <span>{t('pay', language, "To'lash")}</span>
                                                                            </button>
                                                                        )}

                                                                        <div className="flex items-center gap-1 text-slate-400 text-xs">
                                                                            <span className="text-[11px] font-medium hidden sm:inline">
                                                                                {p.transactions?.length || 0} ta tranzaksiya
                                                                            </span>
                                                                            <i className={`fa-solid fa-chevron-down transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}></i>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Transactions inside payment */}
                                                                {isExpanded && (
                                                                    <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/30 space-y-3 animate-fade-in">
                                                                        <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                                                                            <span>{t('transactions_history', language, 'Tranzaksiyalar tarixi')}</span>
                                                                            <span>{p.transactions?.length || 0} {t('events_count', language, 'dona')}</span>
                                                                        </div>

                                                                        {p.transactions && p.transactions.length > 0 ? (
                                                                            <div className="space-y-2">
                                                                                {p.transactions.map((tx) => (
                                                                                    <div 
                                                                                        key={tx.id} 
                                                                                        className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 flex justify-between items-center text-xs"
                                                                                    >
                                                                                        <div className="flex items-center gap-2.5">
                                                                                            <div className={`w-2 h-2 rounded-full ${tx.status === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                                                                                            <div>
                                                                                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                                                                                    {t('transaction_id', language, 'Tranzaksiya #')}{tx.id}
                                                                                                </span>
                                                                                                <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-2">
                                                                                                    {new Date(tx.created_at).toLocaleString(language === 'uz' ? 'uz-UZ' : (language === 'ru' ? 'ru-RU' : 'en-US'))}
                                                                                                </span>
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="flex items-center gap-3">
                                                                                            <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${
                                                                                                tx.status === 'success' 
                                                                                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' 
                                                                                                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                                                                                            }`}>
                                                                                                {tx.status === 'success' ? t('status_success', language, 'Muvaffaqiyatli') : t('status_failed', language, 'Muvaffaqiyatsiz')}
                                                                                            </span>
                                                                                            <span className="font-bold text-slate-900 dark:text-white">
                                                                                                {formatPrice(tx.amount, language)}
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        ) : (
                                                                            <p className="text-xs text-slate-400 text-center py-2">
                                                                                {t('no_transactions_yet', language, 'Tranzaksiyalar tarixi mavjud emas')}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {/* Orders list with items */}
                                            {transactions.orders?.length > 0 && (
                                                <div className="space-y-3 pt-2">
                                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                        {t('orders_history', language, 'Buyurtmalar')} ({transactions.orders.length})
                                                    </h3>
                                                    {transactions.orders.map((ord) => {
                                                        const isExpanded = !!expandedOrders[ord.id];
                                                        const isPending = Number(ord.total_paid) === 0;

                                                        return (
                                                            <div 
                                                                key={ord.id} 
                                                                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 overflow-hidden transition"
                                                            >
                                                                <div 
                                                                    onClick={() => toggleOrderExpand(ord.id)}
                                                                    className="p-4 sm:p-5 cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                                                >
                                                                    <div>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="font-bold text-slate-900 dark:text-white text-xs">
                                                                                {t('order_num', language, 'Buyurtma #')}{ord.id}
                                                                            </span>
                                                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                                                                isPending 
                                                                                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60' 
                                                                                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                                                                            }`}>
                                                                                {isPending ? t('filter_pending', language, "O'tkazma kutilmoqda") : t('filter_receive', language, "Qabul qilingan")}
                                                                            </span>
                                                                        </div>
                                                                        <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 block">
                                                                            {new Date(ord.created_at).toLocaleString(language === 'uz' ? 'uz-UZ' : (language === 'ru' ? 'ru-RU' : 'en-US'))}
                                                                        </span>
                                                                    </div>

                                                                    <div className="flex items-center justify-between sm:justify-end gap-3">
                                                                        <span className="font-black text-sm text-slate-900 dark:text-white">
                                                                            {formatPrice(ord.total_amount, language)}
                                                                        </span>

                                                                        {isPending && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    openPayModal(ord.id, ord.total_amount, ord.total_paid || 0);
                                                                                }}
                                                                                disabled={payingOrderId === ord.id}
                                                                                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                                                                            >
                                                                                {payingOrderId === ord.id ? (
                                                                                    <i className="fa-solid fa-circle-notch fa-spin"></i>
                                                                                ) : (
                                                                                    <i className="fa-solid fa-credit-card"></i>
                                                                                )}
                                                                                <span>{t('pay', language, "To'lash")}</span>
                                                                            </button>
                                                                        )}

                                                                        <i className={`fa-solid fa-chevron-down text-slate-400 text-xs transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}></i>
                                                                    </div>
                                                                </div>

                                                                {isExpanded && (
                                                                    <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/30 space-y-2 text-xs">
                                                                        <span className="font-bold text-slate-600 dark:text-slate-400 block mb-2">
                                                                            {t('order_items', language, 'Buyurtma tarkibi')}:
                                                                        </span>
                                                                        {ord.order_item?.map((item) => (
                                                                            <div key={item.id} className="flex justify-between items-center py-1">
                                                                                <span className="text-slate-800 dark:text-slate-200">
                                                                                    {item.ticket?.title || t('ticket', language, 'Chipta')} × {item.count}
                                                                                </span>
                                                                                <span className="font-bold text-slate-900 dark:text-white">
                                                                                    {formatPrice(item.price_at_purchase * item.count, language)}
                                                                                </span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-10">
                                            {language === 'uz' ? "Hozircha hech qanday tranzaksiya mavjud emas." : "No transactions found."}
                                        </p>
                                    )
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Tab 4: Addresses */}
                {activeTab === 'addresses' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-base font-black text-slate-900 dark:text-white">{t('delivery_addresses', language)}</h2>
                            <button
                                onClick={openAddAddressModal}
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
                                        <h3 className="font-bold text-base text-slate-900 dark:text-white">
                                            {editingAddress ? t('edit_address', language) : t('add_new_address', language)}
                                        </h3>
                                        <button onClick={() => { setIsAddAddressOpen(false); setEditingAddress(null); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                            <i className="fa-solid fa-xmark"></i>
                                        </button>
                                    </div>

                                    <form onSubmit={handleSaveAddress} className="space-y-3">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                                    {t('address_title', language)} <span className="text-rose-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={newAddress.title}
                                                    onChange={(e) => setNewAddress({ ...newAddress, title: e.target.value })}
                                                    placeholder={t('address_title', language)}
                                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 outline-none"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                                    {t('country', language)} <span className="text-rose-500">*</span>
                                                </label>
                                                <select
                                                    value={newAddress.country_id || (countries[0]?.id || '')}
                                                    onChange={(e) => setNewAddress({ ...newAddress, country_id: Number(e.target.value) })}
                                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 outline-none"
                                                    required
                                                >
                                                    {countries.map((c) => (
                                                        <option key={c.id} value={c.id}>
                                                            {c.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                                    {t('city', language)} <span className="text-rose-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={newAddress.city}
                                                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 outline-none"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                                    {t('street', language)} <span className="text-rose-500">*</span>
                                                </label>
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
                                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                                    {t('building', language)} <span className="text-rose-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={newAddress.building}
                                                    onChange={(e) => setNewAddress({ ...newAddress, building: e.target.value })}
                                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 outline-none"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                                    {t('apartment', language)} <span className="text-rose-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={newAddress.apparition}
                                                    onChange={(e) => setNewAddress({ ...newAddress, apparition: e.target.value })}
                                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 outline-none"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                                    {t('postal_code', language)} <span className="text-rose-500">*</span>
                                                </label>
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
                                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                                {t('additional_info', language)} <span className="text-rose-500">*</span>
                                            </label>
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
                                            className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-rose-600/20"
                                        >
                                            {editingAddress ? t('update_address', language) : t('save_address', language)}
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
                                {addresses.map((addr) => {
                                    const countryObj = countries.find((c) => c.id === addr.country);
                                    return (
                                        <div key={addr.id} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xs flex justify-between items-start">
                                            <div className="space-y-1 text-xs">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{addr.title}</h4>
                                                    {countryObj && (
                                                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                                                            {countryObj.name}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-slate-600 dark:text-slate-300">
                                                    {addr.city}, {addr.street}, {addr.building}, {addr.apparition}
                                                </p>
                                                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                                    {t('postal_code', language)}: {addr.email_index}
                                                </p>
                                                {addr.additional_information && (
                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 italic mt-1">{addr.additional_information}</p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => openEditAddressModal(addr)}
                                                    className="w-8 h-8 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center transition"
                                                    title={language === 'uz' ? "Tahrirlash" : (language === 'ru' ? "Редактировать" : "Edit")}
                                                >
                                                    <i className="fa-regular fa-pen-to-square"></i>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteAddress(addr.id)}
                                                    className="w-8 h-8 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center transition"
                                                    title={language === 'uz' ? "O'chirish" : (language === 'ru' ? "Удалить" : "Delete")}
                                                >
                                                    <i className="fa-regular fa-trash-can"></i>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
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

                {/* Partial Payment (Bo'lib to'lash) Modal */}
                {payModal && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
                        <div 
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 animate-scale-up"
                        >
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                                <div>
                                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                                        {t('make_payment', language, "To'lovni amalga oshirish")}
                                    </h3>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                                        {t('order_num', language, 'Buyurtma #')}{payModal.orderId}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setPayModal(null)}
                                    className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition"
                                >
                                    <i className="fa-solid fa-xmark text-sm"></i>
                                </button>
                            </div>

                            {/* Financial Overview Card */}
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl text-xs space-y-2 border border-slate-100 dark:border-slate-800">
                                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                    <span>{t('total_sum', language, "Jami buyurtma summasi")}:</span>
                                    <span className="font-bold text-slate-900 dark:text-white">
                                        {formatPrice(payModal.totalAmount, language)}
                                    </span>
                                </div>
                                {payModal.totalPaid > 0 && (
                                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                                        <span>{t('already_paid', language, "Oldin to'langan")}:</span>
                                        <span className="font-bold">
                                            {formatPrice(payModal.totalPaid, language)}
                                        </span>
                                    </div>
                                )}
                                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-baseline">
                                    <span className="font-bold text-slate-900 dark:text-white">
                                        {t('unpaid_balance', language, "To'lanishi kerak bo'lgan qoldiq")}:
                                    </span>
                                    <span className="font-black text-rose-600 dark:text-rose-400 text-sm">
                                        {formatPrice(payModal.unpaidAmount, language)}
                                    </span>
                                </div>
                            </div>

                            {/* Amount input & presets for Partial Payment */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                        {t('payment_amount', language, "To'lanadigan summa")}
                                    </label>
                                    <span className="text-[11px] text-slate-400">
                                        {t('partial_payment_desc', language, "Summani to'liq yoki bo'lib to'lashingiz mumkin")}
                                    </span>
                                </div>

                                <div className="relative">
                                    <input
                                        type="number"
                                        min="1000"
                                        max={payModal.unpaidAmount}
                                        step="1000"
                                        value={payModal.payAmount}
                                        onChange={(e) => {
                                            const val = Number(e.target.value) || 0;
                                            setPayModal((prev) => ({
                                                ...prev,
                                                payAmount: Math.min(prev.unpaidAmount, Math.max(0, val)),
                                            }));
                                        }}
                                        className="w-full pl-4 pr-16 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-base font-black text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-rose-500 outline-none transition"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                        UZS
                                    </span>
                                </div>

                                {/* Quick Presets */}
                                <div className="flex items-center gap-2 pt-1">
                                    {[
                                        { label: '25%', value: Math.round(payModal.unpaidAmount * 0.25) },
                                        { label: '50%', value: Math.round(payModal.unpaidAmount * 0.5) },
                                        { label: t('full_amount', language, "To'liq summa"), value: payModal.unpaidAmount },
                                    ].map((p, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setPayModal((prev) => ({ ...prev, payAmount: p.value }))}
                                            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition border ${
                                                payModal.payAmount === p.value
                                                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-600 dark:text-rose-400'
                                                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                                            }`}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Modal Actions */}
                            <div className="pt-2 flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setPayModal(null)}
                                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition"
                                >
                                    {t('cancel', language, "Bekor qilish")}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handlePayOrder(payModal.orderId, payModal.payAmount)}
                                    disabled={payingOrderId === payModal.orderId || payModal.payAmount <= 0}
                                    className="flex-2 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-rose-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {payingOrderId === payModal.orderId ? (
                                        <i className="fa-solid fa-circle-notch fa-spin"></i>
                                    ) : (
                                        <i className="fa-solid fa-check"></i>
                                    )}
                                    <span>{t('confirm_payment', language, "To'lovni tasdiqlash")} ({formatPrice(payModal.payAmount, language)})</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    window.ProfilePage = ProfilePage;
})();
