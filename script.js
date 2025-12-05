// ======================================================
// LYNEX MAIN SCRIPT (SECURE & RENAMED PATHS)
// ======================================================

// --- STORAGE KEYS ---
const KEY_PRODUCTS = 'lynex_products';
const KEY_CART = 'lynex_cart';
const KEY_ORDERS = 'lynex_orders';
const KEY_MESSAGES = 'lynex_messages';
const KEY_ADMIN_TOKEN = 'lynex_secure_token_v99';
const KEY_ORDER_COUNT = 'lynex_order_counter';

// --- SECURITY: CREDENTIAL PARTS (HIDDEN) ---
const _u_part = "SysMaster";
const _u_suffix = "_99";
const _p_1 = "L7n";
const _p_4 = "2025";
const _p_2 = "@x#";
const _p_3 = "Super!";

// --- PAGE NAMES (আপনার দেওয়া নতুন নামগুলো) ---
const PAGE_LOGIN = 'k7_entry_point.html';       // Login Page
const PAGE_DASHBOARD = 'x_master_v9.html';      // Dashboard
const PAGE_PRODUCTS = 'p_data_source_5.html';   // Products
const PAGE_ORDERS = 'o_log_file_22.html';       // Orders
const PAGE_MESSAGES = 'm_feed_back_01.html';    // Messages

document.addEventListener('DOMContentLoaded', function() {
    
    // 1. Navigation Toggle
    const menuToggle = document.getElementById('menu-toggle');
    const navList = document.getElementById('nav-list');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => navList.classList.toggle('active'));
    }
    
    // 2. Cart Count
    updateCartCount();

    // 3. Routing Logic
    const path = window.location.pathname;
    const page = path.split("/").pop(); 

    // --- PUBLIC PAGES ---
    if (page === 'index.html' || page === '') loadProductsDisplay(true);
    else if (page === 'products.html') loadProductsDisplay(false);
    else if (page === 'cart.html') loadCartDisplay();
    else if (page === 'checkout.html') { handleCheckoutForm(); loadCartSummaryForCheckout(); }
    else if (page === 'contact.html') handleContactForm();
    
    // --- ADMIN PAGES SECURITY ---
    // নতুন নামগুলো চেক করা হচ্ছে
    else if (page === PAGE_DASHBOARD || page === PAGE_PRODUCTS || page === PAGE_ORDERS || page === PAGE_MESSAGES) {
        
        checkAdminAuth(); // Security Check
        updateAdminSidebarBadges(); // Notifications
        
        if (page === PAGE_DASHBOARD) initAdminDashboard();
        if (page === PAGE_PRODUCTS) initAdminProducts();
        if (page === PAGE_ORDERS) initAdminOrders();
        if (page === PAGE_MESSAGES) initAdminMessages();
    }
    
    // --- SECURE LOGIN LOGIC ---
    const loginForm = document.getElementById('secure-login-form'); // HTML এ ID পরিবর্তন করতে ভুলবেন না
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const inputUser = e.target.username.value;
            const inputPass = e.target.password.value;
            
            // Reassemble Credentials
            const realUser = _u_part + _u_suffix; // SysMaster_99
            const realPass = _p_1 + _p_2 + _p_3 + _p_4; // L7n@x#Super!2025

            if (inputUser === realUser && inputPass === realPass) {
                const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
                sessionStorage.setItem(KEY_ADMIN_TOKEN, token);
                
                // [গুরুত্বপূর্ণ] সফল লগইনের পর নতুন ড্যাশবোর্ড ফাইলে যাবে
                window.location.href = PAGE_DASHBOARD; 
            } else {
                alert('Access Denied! Invalid Credentials.');
                e.target.reset();
            }
        });
    }
});

// --- HELPER FUNCTIONS ---
function getStorage(key) { return JSON.parse(localStorage.getItem(key)) || []; }
function setStorage(key, data) { localStorage.setItem(key, JSON.stringify(data)); }

function updateCartCount() {
    const cart = getStorage(KEY_CART);
    const totalQty = cart.reduce((sum, item) => sum + (parseInt(item.qty) || 0), 0);
    document.querySelectorAll('.cart-count').forEach(el => el.innerText = `(${totalQty})`);
}

function updateAdminSidebarBadges() {
    const orders = getStorage(KEY_ORDERS);
    const msgs = getStorage(KEY_MESSAGES);
    
    const hasPending = orders.some(o => o.status === 'Pending');
    const hasUnread = msgs.some(m => !m.isRead);
    
    const oLink = document.getElementById('nav-orders');
    const mLink = document.getElementById('nav-messages');

    // নতুন নাম অনুযায়ী চেক করা হচ্ছে
    if(hasPending && oLink && !window.location.pathname.includes(PAGE_ORDERS)) {
        if(!oLink.querySelector('.nav-badge')) oLink.innerHTML += ' <span class="nav-badge"></span>';
    }
    if(hasUnread && mLink && !window.location.pathname.includes(PAGE_MESSAGES)) {
        if(!mLink.querySelector('.nav-badge')) mLink.innerHTML += ' <span class="nav-badge"></span>';
    }
}

// --- ADMIN SECURITY ---
function checkAdminAuth() {
    if (!sessionStorage.getItem(KEY_ADMIN_TOKEN)) {
        window.location.replace(PAGE_LOGIN); // টোকেন না থাকলে লগইন পেজে পাঠাবে
    }
}

function adminLogout() {
    sessionStorage.removeItem(KEY_ADMIN_TOKEN);
    window.location.href = PAGE_LOGIN; // লগআউট হলে লগইন পেজে পাঠাবে
}

// ==========================================
//  WEBSITE LOGIC
// ==========================================

function loadProductsDisplay(isHome) {
    let grid = document.querySelector('.product-grid');
    if (!grid) return;
    
    let products = getStorage(KEY_PRODUCTS);
    if (isHome) products = products.filter(p => p.isNewArrival);

    grid.innerHTML = products.length ? products.map(p => {
        let priceHTML = `<span class="current-price">৳ ${p.price}</span>`;
        let badgeHTML = '';
        if (p.originalPrice && p.originalPrice > p.price) {
            priceHTML = `<span class="old-price">৳ ${p.originalPrice}</span> <span class="current-price">৳ ${p.price}</span>`;
            const disc = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
            badgeHTML = `<span class="discount-badge">-${disc}%</span>`;
        }
        let imgHTML = p.image ? `<img src="${p.image}" alt="${p.name}">` : `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#555;"><i class="fas fa-tshirt" style="font-size:3em;"></i></div>`;

        return `<div class="product-card">${badgeHTML}<div class="product-image">${imgHTML}</div><div class="product-info"><h3>${p.name}</h3><div class="price-container">${priceHTML}</div><div class="product-actions"><button onclick="addToCart('${p.id}')" class="btn secondary-btn">Add to Cart</button><button onclick="buyNow('${p.id}')" class="btn primary-btn">Buy Now</button></div></div></div>`;
    }).join('') : '<p style="text-align:center;width:100%;color:#777;">No products available.</p>';
}

window.addToCart = function(id) {
    const products = getStorage(KEY_PRODUCTS);
    const product = products.find(p => p.id == id);
    if (product) {
        let cart = getStorage(KEY_CART);
        const exIdx = cart.findIndex(item => item.id == id);
        if (exIdx > -1) cart[exIdx].qty += 1; else cart.push({ ...product, qty: 1 });
        setStorage(KEY_CART, cart); updateCartCount(); alert('Product added to cart!');
    }
};
window.buyNow = (id) => { window.addToCart(id); window.location.href = 'checkout.html'; };

function loadCartDisplay() {
    const container = document.querySelector('.cart-items');
    const totalEl = document.getElementById('cart-total');
    if (!container) return;
    const cart = getStorage(KEY_CART);
    
    if (cart.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:20px; color:#aaa;">Your cart is empty.</p>';
        if(totalEl) totalEl.innerText = '0';
        const btn = document.querySelector('.checkout-btn'); if(btn) btn.style.display = 'none';
        return;
    }

    let totalAmount = 0;
    container.innerHTML = cart.map((item, index) => {
        totalAmount += (item.price * item.qty);
        let imgDisplay = item.image ? `<img src="${item.image}" style="width:60px;height:60px;object-fit:cover;border-radius:4px;">` : `<div style="width:60px;height:60px;background:#333;"></div>`;
        return `<div class="cart-item"><div class="cart-item-info">${imgDisplay}<div><h4 style="margin:0;font-size:1em;color:#fff;">${item.name}</h4><p style="margin:5px 0;color:#aaa;font-size:0.9em;">৳ ${item.price} x ${item.qty}</p><div class="qty-controls"><button class="qty-btn" onclick="updateQty(${index}, -1)">-</button><span style="color:#fff;">${item.qty}</span><button class="qty-btn" onclick="updateQty(${index}, 1)">+</button></div></div></div><div style="text-align:right;"><p style="font-weight:bold;color:#ff9f43;">৳ ${item.price * item.qty}</p><button onclick="removeFromCart(${index})" style="color:#e74c3c;background:none;border:none;cursor:pointer;margin-top:5px;font-size:0.9em;">Remove</button></div></div>`;
    }).join('');
    if(totalEl) totalEl.innerText = totalAmount;
}

window.updateQty = function(index, change) {
    let cart = getStorage(KEY_CART);
    cart[index].qty += change;
    if (cart[index].qty <= 0) { if(confirm("Remove item?")) cart.splice(index, 1); else cart[index].qty = 1; }
    setStorage(KEY_CART, cart); loadCartDisplay(); updateCartCount();
};
window.removeFromCart = function(index) {
    let cart = getStorage(KEY_CART); cart.splice(index, 1); setStorage(KEY_CART, cart); loadCartDisplay(); updateCartCount();
};

function handleCheckoutForm() {
    const form = document.getElementById('checkout-form');
    if (form) {
        form.onsubmit = function(e) {
            e.preventDefault();
            const cart = getStorage(KEY_CART);
            if(cart.length === 0) return alert("Your cart is empty!");

            let count = parseInt(localStorage.getItem(KEY_ORDER_COUNT)) || 0; count++; 
            localStorage.setItem(KEY_ORDER_COUNT, count);
            const orderId = 'ORD-' + String(count).padStart(3, '0');
            const total = cart.reduce((s, i) => s + (parseFloat(i.price) * parseInt(i.qty)), 0);

            const order = {
                id: orderId, date: new Date().toLocaleDateString(),
                customer: { name: e.target.name.value, phone: e.target.phone.value, address: e.target.address.value },
                items: cart, total: total, status: 'Pending'
            };

            const orders = getStorage(KEY_ORDERS); orders.unshift(order); setStorage(KEY_ORDERS, orders);
            setStorage(KEY_CART, []); updateCartCount();
            alert(`Order Confirmed!\nID: ${orderId}\nWe will contact you soon.`); window.location.href = 'index.html';
        };
    }
}
function loadCartSummaryForCheckout() { const el = document.getElementById('checkout-total'); if(el) { const c = getStorage(KEY_CART); el.innerText = c.reduce((s, i) => s + (parseFloat(i.price) * parseInt(i.qty)), 0); } }

function handleContactForm() {
    const form = document.getElementById('contact-form');
    if(form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const msg = { id: Date.now(), date: new Date().toLocaleDateString(), name: e.target.name.value, email: e.target.email.value, subject: e.target.subject.value, text: e.target.message.value, isRead: false };
            const msgs = getStorage(KEY_MESSAGES); msgs.unshift(msg); setStorage(KEY_MESSAGES, msgs); e.target.reset(); alert('Message Sent Successfully!');
        });
    }
}

// --- ADMIN LOGIC ---
function initAdminDashboard() {
    const orders = getStorage(KEY_ORDERS);
    const products = getStorage(KEY_PRODUCTS);
    const delivered = orders.filter(o => o.status === 'Delivered');
    const revenue = delivered.reduce((sum, o) => sum + parseFloat(o.total), 0);
    const setVal = (id, v) => { if(document.getElementById(id)) document.getElementById(id).innerText = v; };
    setVal('stat-revenue', '৳ ' + revenue);
    setVal('stat-pending', orders.filter(o => o.status === 'Pending').length);
    setVal('stat-shipped', orders.filter(o => o.status === 'Shipped').length);
    setVal('stat-delivered', delivered.length);
    setVal('stat-cancelled', orders.filter(o => o.status === 'Cancelled').length);
    setVal('stat-products', products.length);
}

function initAdminProducts() {
    const form = document.getElementById('add-product-form');
    const tbody = document.querySelector('#product-table tbody');
    const renderTable = () => {
        const products = getStorage(KEY_PRODUCTS);
        if (products.length === 0) { tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No Products Added</td></tr>'; document.getElementById('current-product-count').innerText = 0; return; }
        tbody.innerHTML = products.map((p, i) => `<tr><td><img src="${p.image||''}" style="width:40px;height:40px;object-fit:cover;background:#333;border-radius:4px;"></td><td>${p.name} ${p.isNewArrival?'<span style="color:#2ecc71;">(New)</span>':''}</td><td>৳ ${p.price}</td><td><button onclick="deleteProduct(${i})" style="color:#e74c3c;background:none;border:none;cursor:pointer;">Delete</button></td></tr>`).join('');
        document.getElementById('current-product-count').innerText = products.length;
    };
    renderTable();
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const file = e.target.image.files[0];
            const reader = new FileReader();
            const save = (imgData) => {
                const p = getStorage(KEY_PRODUCTS);
                p.push({ id: Date.now(), name: e.target.name.value, price: parseFloat(e.target.price.value), originalPrice: e.target.oldPrice.value ? parseFloat(e.target.oldPrice.value) : null, isNewArrival: e.target.isNew.checked, image: imgData });
                setStorage(KEY_PRODUCTS, p); e.target.reset(); renderTable(); alert('Product Added!');
            };
            if (file) { reader.onload = (ev) => save(ev.target.result); reader.readAsDataURL(file); } else save(null);
        });
    }
    window.deleteProduct = (index) => { if (confirm('Are you sure?')) { const p = getStorage(KEY_PRODUCTS); p.splice(index, 1); setStorage(KEY_PRODUCTS, p); renderTable(); } };
}

function initAdminOrders() {
    const tbody = document.querySelector('#orders-table tbody');
    let currentFilter = 'All';
    const render = () => {
        const allOrders = getStorage(KEY_ORDERS);
        const filtered = currentFilter === 'All' ? allOrders : allOrders.filter(o => o.status === currentFilter);
        if (filtered.length === 0) { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No Orders Found</td></tr>'; return; }
        tbody.innerHTML = filtered.map(o => {
            const realIdx = allOrders.findIndex(x => x.id === o.id);
            let color = '#ff9f43'; if(o.status==='Shipped')color='#3498db'; if(o.status==='Delivered')color='#2ecc71'; if(o.status==='Cancelled')color='#e74c3c';
            return `<tr><td>${o.id}</td><td>${o.customer.name}</td><td>৳ ${o.total}</td><td><select onchange="updateStatus(${realIdx}, this.value)" style="color:${color};border:1px solid ${color};background:#222;"><option value="Pending" ${o.status==='Pending'?'selected':''}>Pending</option><option value="Shipped" ${o.status==='Shipped'?'selected':''}>Shipped</option><option value="Delivered" ${o.status==='Delivered'?'selected':''}>Delivered</option><option value="Cancelled" ${o.status==='Cancelled'?'selected':''}>Cancelled</option></select></td><td><button onclick="viewOrder('${o.id}')" style="color:#fff;background:none;border:none;cursor:pointer;">View</button></td></tr>`;
        }).join('');
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b.innerText.includes(currentFilter)));
    };
    render();
    window.filterOrders = (s) => { currentFilter = s; render(); };
    window.updateStatus = (index, val) => { const orders = getStorage(KEY_ORDERS); orders[index].status = val; setStorage(KEY_ORDERS, orders); render(); };
    window.viewOrder = (id) => { const o = getStorage(KEY_ORDERS).find(x => x.id === id); if(!o) return; const items = o.items.map(i=>`- ${i.name} x${i.qty} (৳${i.price})`).join('\n'); alert(`ORDER ID: ${o.id}\n\nCustomer: ${o.customer.name}\nPhone: ${o.customer.phone}\nAddress: ${o.customer.address}\n\nItems:\n${items}\n\nTOTAL: ৳${o.total}`); };
}

function initAdminMessages() {
    const tbody = document.querySelector('#messages-table tbody');
    let viewMode = 'New'; 
    const render = () => {
        const allMsgs = getStorage(KEY_MESSAGES);
        const list = viewMode === 'New' ? allMsgs.filter(m => !m.isRead) : allMsgs.filter(m => m.isRead);
        if (list.length === 0) { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No Messages</td></tr>'; }
        else {
            tbody.innerHTML = list.map(m => {
                const idx = allMsgs.findIndex(x => x.id === m.id);
                return `<tr><td>${m.date}</td><td>${m.name}<br><small style="color:#aaa;">${m.email}</small></td><td>${m.subject}</td><td>${m.text}</td><td>${!m.isRead?`<button onclick="mkRead(${idx})" style="color:green;background:none;border:1px solid #2ecc71;margin-right:5px;cursor:pointer;">Mark Read</button>` : ''}<button onclick="deleteMsg(${idx})" style="color:red;background:none;border:none;cursor:pointer;">Del</button></td></tr>`;
            }).join('');
        }
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b.innerText.includes(viewMode)));
    };
    render();
    window.filterMsgs = (mode) => { viewMode = mode; render(); };
    window.markRead = (index) => { const msgs = getStorage(KEY_MESSAGES); msgs[index].isRead = true; setStorage(KEY_MESSAGES, msgs); render(); };
    window.deleteMsg = (index) => { if(confirm('Delete Message?')) { const msgs = getStorage(KEY_MESSAGES); msgs.splice(index, 1); setStorage(KEY_MESSAGES, msgs); render(); }};
}
