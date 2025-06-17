// public/app.js

document.addEventListener('DOMContentLoaded', async () => {
    // Dil tərcüməsini yüklə
    await i18n.loadTranslations(localStorage.getItem('lang') || 'az');
    i18n.translatePage();

    i18n.setupLanguageSwitcher('lang-switcher-main', () => {
        // Dil dəyişdikdən sonra cədvəlləri yenidən render et
        fetchOrdersAndRender();
        fetchAndRenderDebts();
    });

    // --- Global Değişkenler ---
    let currentUserRole = null;
    let currentUserDisplayName = null;
    let currentUserPermissions = {};
    let currentOrders = [];
    let editingOrderId = null;
    let wanderingInterval = null;
    let stealAnimationTimeout = null; 

    // --- DOM Elementleri ---
    const addOrderForm = document.getElementById('addOrderForm');
    const modal = document.getElementById('addOrderModal');
    const showAddOrderFormBtn = document.getElementById('showAddOrderFormBtn');
    const addHotelBtn = document.getElementById('addHotelBtn');
    const hotelEntriesContainer = document.getElementById('hotelEntriesContainer');
    const ordersTableBody = document.getElementById('ordersTableBody');
    const modalTitle = modal?.querySelector('h3');
    const modalSubmitButton = modal?.querySelector('button[type="submit"]');
    const closeButton = modal?.querySelector('.modal-content .close-button');
    const navSatishlarBtn = document.getElementById('navSatishlarBtn');
    const navRezervasiyalarBtn = document.getElementById('navRezervasiyalarBtn');
    const navAxtarishBtn = document.getElementById('navAxtarishBtn');
    const navHesabatBtn = document.getElementById('navHesabatBtn');
    const navBildirishlerBtn = document.getElementById('navBildirishlerBtn');
    const navChatBtn = document.getElementById('navChatBtn');
    const navBorclarBtn = document.getElementById('navBorclarBtn');
    const satishlarView = document.getElementById('satishlarView');
    const rezervasiyalarView = document.getElementById('rezervasiyalarView');
    const bildirishlerView = document.getElementById('bildirishlerView');
    const chatView = document.getElementById('chatView');
    const searchView = document.getElementById('searchView');
    const hesabatView = document.getElementById('hesabatView');
    const borclarView = document.getElementById('borclarView');
    const searchInputRezNomresi = document.getElementById('searchInputRezNomresi');
    const searchButton = document.getElementById('searchButton');
    const searchResultDisplay = document.getElementById('searchResultDisplay');
    const noteModal = document.getElementById('noteModal');
    const closeNoteModalBtn = document.getElementById('closeNoteModalBtn');
    const noteForm = document.getElementById('noteForm');
    const noteSatisNoInput = document.getElementById('noteSatisNo');
    const noteTextInput = document.getElementById('noteText');
    const noteModalTitle = document.getElementById('noteModalTitle');
    const notificationsTableBody = document.getElementById('notificationsTableBody');
    const notificationCountBadge = document.getElementById('notification-count');
    const reservationsTableBody = document.getElementById('reservationsTableBody');
    const reservationFilterHotelNameInput = document.getElementById('reservationFilterHotelName');
    const reservationFilterMonthInput = document.getElementById('reservationFilterMonth');
    const reservationFilterDateInput = document.getElementById('reservationFilterDate');
    const reservationSortOrderSelect = document.getElementById('reservationSortOrder');
    const applyReservationFiltersBtn = document.getElementById('applyReservationFiltersBtn');
    const resetReservationFiltersBtn = document.getElementById('resetReservationFiltersBtn');
    const reportResultDisplay = document.getElementById('reportResultDisplay');
    const generateReportBtn = document.getElementById('generateReportBtn');
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    const totalOrdersEl = document.getElementById('totalOrders');
    const totalsByCurrencyContainer = document.getElementById('totalsByCurrencyContainer');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send-btn');
    const borclarSearchInput = document.getElementById('borclarSearchInput');
    const borclarSearchBtn = document.getElementById('borclarSearchBtn');
    const borclarTableBody = document.getElementById('borclarTableBody');
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsPanel = document.getElementById('settingsPanel');
    const closeSettingsPanelBtn = document.getElementById('closeSettingsPanelBtn');
    const mascotOnBtn = document.getElementById('mascotOnBtn');
    const mascotOffBtn = document.getElementById('mascotOffBtn');
    const mascotContainer = document.getElementById('mascot-container');
    const mascotBubble = document.getElementById('mascot-bubble');
    const mobileMenuToggleBtn = document.getElementById('mobileMenuToggleBtn');
    const navContainer = document.getElementById('navContainer');
    const viewOrderModal = document.getElementById('viewOrderModal');
    const closeViewModalBtn = document.getElementById('closeViewModalBtn');
    const viewModalTitle = document.getElementById('viewModalTitle');
    const viewOrderContent = document.getElementById('viewOrderContent');
    const printOrderBtn = document.getElementById('printOrderBtn');

    // --- MASKOT HƏYAT DÖVRÜ FUNKSİYALARI ---
    const stopMascotLifeCycle = () => {
        if (wanderingInterval) {
            clearInterval(wanderingInterval);
            wanderingInterval = null;
        }
    };
    const startMascotLifeCycle = () => {
        if (wanderingInterval || !mascotContainer) return;
        wanderingInterval = setInterval(() => {
            if (localStorage.getItem('mascot_enabled') === 'false') return;
            const screenWidth = window.innerWidth;
            const screenHeight = window.innerHeight;
            const mascotWidth = mascotContainer.offsetWidth;
            const mascotHeight = mascotContainer.offsetHeight;
            const maxX = screenWidth - mascotWidth;
            const minX = screenWidth - 400;
            const maxY = screenHeight - mascotHeight;
            const minY = screenHeight - 300;
            const randomX = Math.floor(Math.random() * (maxX - minX + 1)) + minX;
            const randomY = Math.floor(Math.random() * (maxY - minY + 1)) + minY;
            mascotContainer.style.transform = `translate(${randomX - (screenWidth - mascotWidth - 20)}px, ${randomY - (screenHeight - mascotHeight - 20)}px)`;
        }, 5000);
    };
    const resetMascotPosition = () => {
        if (!mascotContainer) return;
        stopMascotLifeCycle();
        mascotContainer.style.transition = 'transform 1.5s ease-in-out';
        mascotContainer.style.transform = 'translate(0, 0)';
        updateMascotBubble("Gününüz uğurlu keçsin!");
        startMascotLifeCycle();
    };
    const moveMascotToElement = (element, message) => {
        if (!element || localStorage.getItem('mascot_enabled') === 'false') return;
        stopMascotLifeCycle();
        const rect = element.getBoundingClientRect();
        const mascotWidth = mascotContainer.offsetWidth;
        const targetX = rect.left - mascotWidth + 20;
        const targetY = rect.top - 100;
        mascotContainer.style.transition = 'transform 0.8s cubic-bezier(0.68, -0.55, 0.27, 1.55)';
        mascotContainer.style.transform = `translate(${targetX}px, ${targetY}px)`;
        updateMascotBubble(message);
    };
    const updateMascotBubble = (message) => {
        if (!mascotBubble || localStorage.getItem('mascot_enabled') === 'false') return;
        if (message) {
            mascotBubble.textContent = message;
            mascotBubble.classList.add('visible');
        } else {
            mascotBubble.classList.remove('visible');
        }
    };

    // --- İstifadəçi Məlumatları və İcazələrin Yüklənməsi ---
    try {
        const [userRes, permsRes] = await Promise.all([
            fetch('/api/user/me'),
            fetch('/api/user/permissions')
        ]);
        if (!userRes.ok || !permsRes.ok) {
            window.location.href = '/login.html';
            return;
        }
        const user = await userRes.json();
        currentUserRole = user.role;
        currentUserDisplayName = user.displayName;
        currentUserPermissions = await permsRes.json();
        const headerTitle = document.getElementById('main-header-title');
        if (headerTitle && currentUserDisplayName) {
            headerTitle.textContent = currentUserDisplayName;
        }
        const navUsersBtn = document.getElementById('navUsersBtn');
        if (currentUserRole === 'owner' && navUsersBtn) {
            navUsersBtn.style.display = 'inline-block';
        }
    } catch (error) {
        console.error('Giriş bilgileri veya izinler alınamadı:', error);
        window.location.href = '/login.html';
        return;
    }

    // --- FORMA MƏNTİQİ ---
    if (addOrderForm) {
        const mascotTips = {
            'turist': 'Bura turist və ya qrup adını daxil edin.',
            'xariciSirket': 'Partnyor şirkətin adını qeyd edə bilərsiniz.',
            'adultGuests': 'Böyük qonaqların sayını daxil edin.',
            'childGuests': 'Uşaq sayını qeyd edin (əgər varsa).',
            'rezNomresi': 'Bu sifariş üçün rezervasiya nömrəsini yazın.',
            'hotel_otelAdi': 'Otel adını bu xanaya daxil edin.',
            'transport_surucuMelumatlari': 'Sürücü və ya transfer məlumatları üçün bu xanadan istifadə edin.',
            'alishAmount': 'Bu xana avtomatik hesablanır, amma maliyyə icazəniz varsa dəyişə bilərsiniz.',
            'satishAmount': 'Müştəriyə təqdim edilən yekun satış qiymətini yazın.'
        };
        addOrderForm.addEventListener('focusin', (event) => {
            const input = event.target;
            const inputId = input.id || (input.classList.contains('hotel_otelAdi') ? 'hotel_otelAdi' : null);
            if (inputId && mascotTips[inputId]) {
                updateMascotBubble(mascotTips[inputId]);
            }
        });
        addOrderForm.addEventListener('focusout', () => {
            updateMascotBubble(null);
        });
    }

    // --- TƏNZİMLƏMƏLƏR PANELİ ---
    if (settingsBtn && settingsPanel) {
        settingsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            settingsPanel.classList.toggle('visible');
        });
        closeSettingsPanelBtn.addEventListener('click', () => {
            settingsPanel.classList.remove('visible');
        });
        document.addEventListener('click', (e) => {
            if (!settingsPanel.contains(e.target) && !settingsBtn.contains(e.target)) {
                settingsPanel.classList.remove('visible');
            }
        });
    }

    function updateMascotButtons(isMascotEnabled) {
        if (!mascotOnBtn || !mascotOffBtn) return;
        if (isMascotEnabled) {
            mascotOnBtn.classList.add('active');
            mascotOffBtn.classList.remove('active');
            if (mascotContainer) mascotContainer.style.display = 'block';
        } else {
            mascotOffBtn.classList.add('active');
            mascotOnBtn.classList.remove('active');
            if (mascotContainer) mascotContainer.style.display = 'none';
        }
    }
    
    if (mascotOnBtn && mascotOffBtn) {
        mascotOnBtn.addEventListener('click', () => {
            localStorage.setItem('mascot_enabled', 'true');
            updateMascotButtons(true);
        });
        mascotOffBtn.addEventListener('click', () => {
            localStorage.setItem('mascot_enabled', 'false');
            updateMascotButtons(false);
        });
    }
    
    let isMascotEnabled = localStorage.getItem('mascot_enabled') !== 'false';
    updateMascotButtons(isMascotEnabled);

    // --- FUNKSİYALAR ---
    const addHotelEntry = (hotel = {}) => {
        if (!hotelEntriesContainer) return;
        const hotelEntryDiv = document.createElement('div');
        hotelEntryDiv.className = 'hotel-entry';
        hotelEntryDiv.innerHTML = `
            <div class="form-group-inline">
                <input type="text" class="hotel_otelAdi" placeholder="Otel Adı" value="${hotel.otelAdi || ''}">
                <input type="number" step="0.01" class="hotel-price-input" placeholder="Qiymət" value="${hotel.qiymet || 0}">
                <button type="button" class="action-btn-small remove-hotel-btn">-</button>
            </div>
            <div class="form-group-inline">
                <input type="text" class="hotel_otaqKategoriyasi" placeholder="Otaq Kateqoriyası" value="${hotel.otaqKategoriyasi || ''}">
            </div>
            <div class="form-group-inline">
                <div><label>Giriş Tarixi:</label><input type="date" class="hotel_girisTarixi" value="${hotel.girisTarixi || ''}"></div>
                <div><label>Çıxış Tarixi:</label><input type="date" class="hotel_cixisTarixi" value="${hotel.cixisTarixi || ''}"></div>
            </div>
            <hr class="dashed">
        `;
        hotelEntriesContainer.appendChild(hotelEntryDiv);
    };
    
    const calculateGelir = (order) => {
        const alishAmount = order.alish?.amount || 0;
        const satishAmount = order.satish?.amount || 0;
        if (order.alish?.currency === order.satish?.currency) {
            return { amount: parseFloat((satishAmount - alishAmount).toFixed(2)), currency: order.satish.currency };
        }
        return { amount: 0, currency: 'N/A', note: 'Fərqli valyutalar' };
    };

    const calculateTotalCost = () => {
        let total = 0;
        document.querySelectorAll('.cost-input, .hotel-price-input').forEach(input => {
            if (!input.disabled) {
                total += parseFloat(input.value) || 0;
            }
        });
        const alishAmountInput = document.getElementById('alishAmount');
        if (alishAmountInput) alishAmountInput.value = total.toFixed(2);
    };

    const resetModalToCreateMode = () => {
        if (addOrderForm) addOrderForm.reset();
        if (hotelEntriesContainer) hotelEntriesContainer.innerHTML = '';
        addHotelEntry();
        calculateTotalCost();
        if (modalTitle) modalTitle.textContent = i18n.t('modalTitleNewOrder');
        if (modalSubmitButton) modalSubmitButton.textContent = i18n.t('addOrderButton');
        editingOrderId = null;
        document.querySelectorAll('#addOrderForm input, #addOrderForm select, #addOrderForm textarea').forEach(el => el.disabled = false);
        document.getElementById('alishAmount').readOnly = true;
    };
    
    const fetchOrdersAndRender = async () => {
        try {
            const response = await fetch('/api/orders');
            if (!response.ok) throw new Error(i18n.t('errorLoadingOrders'));
            currentOrders = await response.json();
            renderOrdersTable(currentOrders);
        } catch (error) {
            console.error('Sifarişlər yüklənərkən xəta:', error);
            if (ordersTableBody) ordersTableBody.innerHTML = `<tr><td colspan="14" style="text-align:center; color:red;">${error.message}</td></tr>`;
        }
    };
    
    const renderOrdersTable = (orders) => {
        if (!ordersTableBody) return;
        ordersTableBody.innerHTML = '';
        const sortOrder = document.getElementById('sortOrder').value;
        orders.sort((a, b) => (sortOrder === 'asc' ? new Date(a.creationTimestamp) - new Date(b.creationTimestamp) : new Date(b.creationTimestamp) - new Date(a.creationTimestamp)));
        const totals = { AZN: { alish: 0, satish: 0, gelir: 0, debt: 0 }, USD: { alish: 0, satish: 0, gelir: 0, debt: 0 }, EUR: { alish: 0, satish: 0, gelir: 0, debt: 0 } };
        if (totalOrdersEl) totalOrdersEl.textContent = orders.length;
        if (orders.length === 0) {
            ordersTableBody.innerHTML = '<tr><td colspan="14" style="text-align:center;">Heç bir sifariş tapılmadı.</td></tr>';
            if (totalsByCurrencyContainer) totalsByCurrencyContainer.innerHTML = '';
            return;
        }
        orders.forEach(order => {
            const row = ordersTableBody.insertRow();
            const headers = i18n.translations;
            row.insertCell().setAttribute('data-label', headers.tableHeaderSalesNo || 'Satış №'); row.cells[0].textContent = order.satisNo || '-';
            row.insertCell().setAttribute('data-label', headers.tableHeaderCreationDate || 'Yaradılma Tarixi'); row.cells[1].textContent = new Date(order.creationTimestamp).toLocaleString('az-AZ');
            row.insertCell().setAttribute('data-label', headers.tableHeaderRezNo || 'Rez. №'); row.cells[2].textContent = order.rezNomresi || '-';
            row.insertCell().setAttribute('data-label', headers.tableHeaderTourist || 'Turist'); row.cells[3].textContent = order.turist || '-';
            row.insertCell().setAttribute('data-label', headers.tableHeaderAdult || 'Böyük'); row.cells[4].textContent = order.adultGuests || '0';
            row.insertCell().setAttribute('data-label', headers.tableHeaderChild || 'Uşaq'); row.cells[5].textContent = order.childGuests || '0';
            row.insertCell().setAttribute('data-label', headers.tableHeaderForeignCompany || 'Xarici şirkət'); row.cells[6].textContent = order.xariciSirket || '-';
            row.insertCell().setAttribute('data-label', headers.tableHeaderHotel || 'Otel Adı'); row.cells[7].textContent = (order.hotels && order.hotels.length > 0) ? order.hotels[0].otelAdi : '-';
            row.insertCell().setAttribute('data-label', headers.tableHeaderPurchasePrice || 'Alış Qiyməti'); row.cells[8].textContent = `${(order.alish || { amount: 0, currency: 'AZN' }).amount.toFixed(2)} ${(order.alish || {}).currency}`;
            row.insertCell().setAttribute('data-label', headers.tableHeaderSalePrice || 'Satış Qiyməti'); row.cells[9].textContent = `${(order.satish || { amount: 0, currency: 'AZN' }).amount.toFixed(2)} ${(order.satish || {}).currency}`;
            row.insertCell().setAttribute('data-label', headers.tableHeaderIncome || 'Gəlir'); const gelir = order.gelir || calculateGelir(order); row.cells[10].textContent = `${gelir.amount.toFixed(2)} ${gelir.currency || 'N/A'}`;
            row.insertCell().setAttribute('data-label', headers.tableHeaderStatus || 'Status');
            const statusKeyMap = { 'Davam edir': 'InProgress', 'Bitdi': 'Completed', 'Ləğv edildi': 'Cancelled' };
            const statusKeySuffix = statusKeyMap[order.status] || 'InProgress';
            row.cells[11].textContent = i18n.t(`status${statusKeySuffix}`);
            const operationsCell = row.insertCell(); operationsCell.setAttribute('data-label', headers.tableHeaderOperations || 'Əməliyyatlar');
            if (currentUserPermissions.canEditOrder) {
                const editButton = document.createElement('button'); editButton.className = 'action-btn edit'; editButton.innerHTML = '✏️'; editButton.title = 'Düzəliş et'; editButton.onclick = () => handleEditOrder(order.satisNo); operationsCell.appendChild(editButton);
            }
            if (currentUserPermissions.canDeleteOrder) {
                const deleteButton = document.createElement('button'); deleteButton.className = 'action-btn delete'; deleteButton.innerHTML = '🗑️'; deleteButton.title = 'Sifarişi sil'; deleteButton.onclick = () => handleDeleteOrder(order.satisNo); operationsCell.appendChild(deleteButton);
            }
            const infoButton = document.createElement('button'); infoButton.className = 'action-btn info'; infoButton.innerHTML = 'i'; infoButton.title = 'Ətraflı Məlumat'; infoButton.onclick = () => handleViewOrder(order.satisNo); operationsCell.appendChild(infoButton);
            const qeydCell = row.insertCell(); qeydCell.setAttribute('data-label', headers.tableHeaderNote || 'Qeyd');
            const noteButton = document.createElement('button'); noteButton.className = 'action-btn note'; noteButton.innerHTML = '📄'; noteButton.onclick = () => handleShowNoteModal(order.satisNo); qeydCell.appendChild(noteButton);
            ['alish', 'satish', 'gelir'].forEach(type => {
                const data = order[type] || { amount: 0 };
                if (data.currency && totals[data.currency] && typeof data.amount === 'number' && !data.note) {
                    totals[data.currency][type] += data.amount;
                }
            });
            if ((!order.paymentStatus || order.paymentStatus === 'Ödənilməyib') && order.satish?.currency && totals[order.satish.currency]) {
                totals[order.satish.currency].debt += (order.satish.amount || 0);
            }
        });
        if (totalsByCurrencyContainer) {
            totalsByCurrencyContainer.innerHTML = '';
            if (Object.values(totals).some(c => c.alish !== 0 || c.satish !== 0 || c.gelir !== 0 || c.debt !== 0)) {
                Object.keys(totals).forEach(currency => {
                    if (totals[currency].alish !== 0 || totals[currency].satish !== 0 || totals[currency].gelir !== 0 || totals[currency].debt !== 0) {
                        const currencyCard = document.createElement('div'); currencyCard.className = 'currency-card';
                        currencyCard.innerHTML = `<h4>Yekun (${currency})</h4><p><span>Alış:</span> <strong>${totals[currency].alish.toFixed(2)}</strong></p><p><span>Satış:</span> <strong>${totals[currency].satish.toFixed(2)}</strong></p><p><span>Gəlir:</span> <strong class="${totals[currency].gelir < 0 ? 'text-danger' : 'text-success'}">${totals[currency].gelir.toFixed(2)}</strong></p><p><span>Borclar:</span> <strong class="text-danger">${totals[currency].debt.toFixed(2)}</strong></p>`;
                        totalsByCurrencyContainer.appendChild(currencyCard);
                    }
                });
            }
        }
    };

    function handleEditOrder(satisNo) {
        const orderToEdit = currentOrders.find(order => String(order.satisNo) === String(satisNo));
        if (!orderToEdit) return;
        resetModalToCreateMode();
        editingOrderId = satisNo;
        const setInputValue = (id, value) => { const el = document.getElementById(id); if (el) el.value = value || ''; };
        setInputValue('turist', orderToEdit.turist); setInputValue('xariciSirket', orderToEdit.xariciSirket); setInputValue('adultGuests', orderToEdit.adultGuests); setInputValue('childGuests', orderToEdit.childGuests); setInputValue('vizaSayi', orderToEdit.vizaSayi || 0); setInputValue('rezNomresi', orderToEdit.rezNomresi);
        setInputValue('transport_surucuMelumatlari', orderToEdit.transport?.surucuMelumatlari); setInputValue('transport_odenisKartMelumatlari', orderToEdit.transport?.odenisKartMelumatlari); setInputValue('transport_turTevsiri', orderToEdit.transport?.turTevsiri); setInputValue('transport_elaveXidmetler', orderToEdit.transport?.elaveXidmetler);
        setInputValue('status', orderToEdit.status); setInputValue('qeyd', orderToEdit.qeyd); setInputValue('satishAmount', orderToEdit.satish?.amount); setInputValue('satishCurrency', orderToEdit.satish?.currency); setInputValue('paymentStatus', orderToEdit.paymentStatus || 'Ödənilməyib'); setInputValue('paymentDueDate', orderToEdit.paymentDueDate || '');
        const costs = orderToEdit.detailedCosts || {};
        document.querySelectorAll('.cost-input').forEach(input => { const key = input.id.replace('detailedCost_', '') + 'Xerci'; input.value = costs[key] || 0; });
        if (hotelEntriesContainer) hotelEntriesContainer.innerHTML = ''; 
        if (orderToEdit.hotels && orderToEdit.hotels.length > 0) { orderToEdit.hotels.forEach(hotel => addHotelEntry(hotel)); } else { addHotelEntry(); }
        calculateTotalCost();
        const isFinancialEditForbidden = !currentUserPermissions.canEditFinancials;
        document.querySelectorAll('.cost-input, .hotel-price-input, #satishAmount, #satishCurrency, #alishCurrency').forEach(field => { field.disabled = isFinancialEditForbidden; });
        if (modalTitle) modalTitle.textContent = i18n.t('modalTitleEditOrder', { satisNo: satisNo });
        if (modalSubmitButton) modalSubmitButton.textContent = i18n.t('saveOrderButton');
        modal.style.display = 'block';
        stopMascotLifeCycle();
        moveMascotToElement(document.getElementById('turist'), 'Düzəlişlərə başlayaq!');
    }
    
    // ... (rest of the functions: form submit, delete, note, reservations, reports, etc.) ...
    
    function handleViewOrder(satisNo) {
        const order = currentOrders.find(o => String(o.satisNo) === String(satisNo));
        if (!order) return;
        viewModalTitle.textContent = `Sifariş № ${order.satisNo} | Ətraflı Məlumat`;
        const createInfoItem = (label, value) => `<div class="info-item"><label>${label}</label><span>${value || '-'}</span></div>`;
        let hotelsHtml = '';
        if (order.hotels && order.hotels.length > 0) {
            order.hotels.forEach((hotel, index) => {
                hotelsHtml += `<div class="info-item info-full-width"><label>Otel ${index + 1}</label><span>${hotel.otelAdi || ''} (${hotel.otaqKategoriyasi || 'N/A'})</span></div>
                ${createInfoItem('Giriş Tarixi', hotel.girisTarixi)}
                ${createInfoItem('Çıxış Tarixi', hotel.cixisTarixi)}
                ${createInfoItem('Otel Qiyməti', `${(hotel.qiymet || 0).toFixed(2)} ${order.alish.currency}`)}`;
            });
        } else { hotelsHtml = '<p>Otel məlumatı daxil edilməyib.</p>'; }
        const gelir = order.gelir || calculateGelir(order);
        viewOrderContent.innerHTML = `
            <div class="info-section"><h4>Əsas Məlumatlar</h4><div class="info-grid">
            ${createInfoItem('Turist / Qrup', order.turist)} ${createInfoItem('Xarici Şirkət', order.xariciSirket)} ${createInfoItem('Böyük Sayı', order.adultGuests)} ${createInfoItem('Uşaq Sayı', order.childGuests)} ${createInfoItem('Viza Sayı', order.vizaSayi)} ${createInfoItem('Rezervasiya №', order.rezNomresi)}
            ${createInfoItem('Status', i18n.t(`status${(statusKeyMap[order.status] || 'InProgress')}`))}
            ${createInfoItem('Yaradan', order.createdBy)} ${createInfoItem('Yaradılma Tarixi', new Date(order.creationTimestamp).toLocaleString('az-AZ'))}
            </div></div>
            <div class="info-section"><h4>Maliyyə Məlumatları</h4><div class="info-grid">
            ${createInfoItem('Alış Qiyməti', `${(order.alish?.amount || 0).toFixed(2)} ${order.alish?.currency}`)} ${createInfoItem('Satış Qiyməti', `${(order.satish?.amount || 0).toFixed(2)} ${order.satish?.currency}`)}
            ${createInfoItem('Gəlir', `${gelir.amount.toFixed(2)} ${gelir.currency}`)}
            ${createInfoItem('Ödəniş Statusu', i18n.t(`status${(order.paymentStatus || 'Unpaid').replace(/\s+/g, '')}`))}
            ${createInfoItem('Son Ödəmə Tarixi', order.paymentDueDate)}
            </div></div>
            <div class="info-section"><h4>Otel Məlumatları</h4><div class="info-grid">${hotelsHtml}</div></div>
            <div class="info-section"><h4>Transport Məlumatları</h4><div class="info-grid">
            ${createInfoItem('Tur/Sürücü Məlumatları', order.transport?.surucuMelumatlari)} ${createInfoItem('Tur Təsviri', order.transport?.turTevsiri)} ${createInfoItem('Əlavə Xidmətlər', order.transport?.elaveXidmetler)}
            </div></div>
            <div class="info-section"><h4>Qeyd</h4><div class="info-item info-full-width"><span>${order.qeyd || 'Xüsusi qeyd yoxdur.'}</span></div></div>`;
        viewOrderModal.style.display = 'block';
    }

    if (closeViewModalBtn) { closeViewModalBtn.addEventListener('click', () => { viewOrderModal.style.display = 'none'; }); }
    if (printOrderBtn) { printOrderBtn.addEventListener('click', () => { window.print(); }); }
    window.addEventListener('click', (e) => { if(e.target === viewOrderModal) { viewOrderModal.style.display = 'none'; } });

    // --- MOBİL MENYU MƏNTİQİ ---
    if (mobileMenuToggleBtn && navContainer) {
        mobileMenuToggleBtn.addEventListener('click', () => {
            navContainer.classList.toggle('mobile-active');
        });
        document.addEventListener('click', (e) => {
            if (!navContainer.contains(e.target) && !mobileMenuToggleBtn.contains(e.target)) {
                navContainer.classList.remove('mobile-active');
            }
        });
    }

    // --- İlkin Yükləmə ---
    const nav = setupNavigation(); // Assuming setupNavigation is defined elsewhere in the file
    fetchOrdersAndRender();
    fetchAndRenderNotifications();
    startMascotLifeCycle(); 
});
