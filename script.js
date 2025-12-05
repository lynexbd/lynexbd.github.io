// ======================================================
// LYNEX MAIN SCRIPT (Unlimited Storage - IndexedDB)
// ======================================================

const KEY_PRODUCTS = 'lynex_products';
const KEY_CART = 'lynex_cart';
const KEY_ORDERS = 'lynex_orders';
const KEY_MESSAGES = 'lynex_messages';
const KEY_ADMIN_TOKEN = 'lynex_secure_token_v99';
const KEY_ORDER_COUNT = 'lynex_order_counter';

// --- PAGE NAMES ---
const PAGE_LOGIN = 'k7_entry_point.html';
const PAGE_DASHBOARD = 'x_master_v9.html';
const PAGE_PRODUCTS = 'p_data_source_5.html';
const PAGE_ORDERS = 'o_log_file_22.html';
const PAGE_MESSAGES = 'm_feed_back_01.html';

// --- SECURITY: CREDENTIALS (HIDDEN) ---
const _u = "SysMaster_99";
const _p = "L7n@x#Super!2025";

// --- INDEXED DB SETUP (High Capacity Storage) ---
const DB_NAME = "LynexDatabase";
const DB_VERSION = 1;
let db;

function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onupgradeneeded = (e) => {
            db = e.target.result;
            if (!db.objectStoreNames.contains('store')) {
                db.createObjectStore('store'); // Simple Key-Value Store
            }
        };
        
        request.onsuccess = (e) => {
            db = e.target.result;
            resolve(db);
        };
        
        request.onerror = (e) => {
            console.error("DB Error:", e.target.error);
            reject("Database error");
        };
    });
}

async function getStorage(key) {
    return new Promise((resolve) => {
        const transaction = db.transaction(['store'], 'readonly');
        const store = transaction.objectStore('store');
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => resolve([]);
    });
}

async function setStorage(key, data) {
    return new Promise((resolve) => {
        const transaction = db.transaction(['store'], 'readwrite');
        const store = transaction.objectStore('store');
        const request = store.put(data, key);
        request.onsuccess = () => resolve(true);
        request.onerror = (e) => {
            alert("Error Saving Data: " + e.target.error.message);
            resolve(false);
        };
    });
}

// --- APP INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async function() {
    
    await initDB(); // Wait for Database to be ready
    
    // 1. Mobile Navigation
    const menuToggle = document.getElementById('menu-toggle');
    const navList = document.getElementById('nav-list');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => navList.classList.toggle('active'));
    }
    
    await updateCartCount(); // Update Cart Badge

    // 2. Routing Logic
    const path = window.location.pathname;
    const page = path.split("/").pop(); 

    // --- PUBLIC PAGES ---
    if (page === 'index.html' || page === '') await loadProductsDisplay(true);
    else if (page === 'products.html') await loadProductsDisplay(false);
    else if (page === 'cart.html') await loadCartDisplay();
    else if (page === 'checkout.html') { 
        handleCheckoutForm(); 
        await loadCartSummaryForCheckout(); 
    }
    else if (page === 'contact.html') handleContactForm();
    
    // --- ADMIN PAGES ---
    else if ([PAGE_DASHBOARD, PAGE_PRODUCTS, PAGE_ORDERS, PAGE_MESSAGES].includes(page)) {
        checkAdminAuth();
        await updateAdminSidebarBadges();
        
        if (page === PAGE_DASHBOARD) await initAdminDashboard();
        if (page === PAGE_PRODUCTS) await initAdminProducts();
        if (page === PAGE_ORDERS) await initAdminOrders();
        if (page === PAGE_MESSAGES) await initAdminMessages();
    }
    
    // --- LOGIN ---
    const loginForm = document.getElementById('secure-login-form');
    if (loginForm) {
        if(sessionStorage.getItem(KEY_ADMIN_TOKEN)) window.location.href = PAGE_DASHBOARD;
        
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (e.target.username.value === _u && e.target.password.value === _p) {
                const token = Math.random().toString(36).substr(2) + Date.now().toString(36);
                sessionStorage.setItem(KEY_ADMIN_TOKEN, token);
                window.location.href = PAGE_DASHBOARD;
            } else {
                alert('Access Denied!'); e.target.reset();
            }
        });
    }
});

// --- HELPER FUNCTIONS ---
async function updateCartCount() {
    const cart = await getStorage(KEY_CART);
    const totalQty = cart.reduce((sum, item) => sum + (parseInt(item.qty)||0), 0);
    document.querySelectorAll('.cart-count').forEach(el => el.innerText = `(${totalQty})`);
}

async function updateAdminSidebarBadges() {
    const orders = await getStorage(KEY_ORDERS);
    const msgs = await getStorage(KEY_MESSAGES);
    
    const hasPending = orders.some(o => o.status === 'Pending');
    const hasUnread = msgs.some(m => !m.isRead);
    
    const oLink = document.getElementById('nav-orders');
    const mLink = document.getElementById('nav-messages');

    if(hasPending && oLink && !window.location.pathname.includes(PAGE_ORDERS)) 
        if(!oLink.querySelector('.nav-badge')) oLink.innerHTML += ' <span class="nav-badge"></span>';
    
    if(hasUnread && mLink && !window.location.pathname.includes(PAGE_MESSAGES)) 
        if(!mLink.querySelector('.nav-badge')) mLink.innerHTML += ' <span class="nav-badge"></span>';
}

function checkAdminAuth() {
    if (!sessionStorage.getItem(KEY_ADMIN_TOKEN)) window.location.replace(PAGE_LOGIN);
}
function adminLogout() {
    sessionStorage.removeItem(KEY_ADMIN_TOKEN);
    window.location.href = PAGE_LOGIN;
}

// ==========================================
//  WEBSITE LOGIC
// ==========================================

async function loadProductsDisplay(isHome) {
    let grid = document.querySelector('.product-grid');
    if (!grid) return;
    
    let products = await getStorage(KEY_PRODUCTS);
    
    if (isHome) products = products.filter(p => p.isNewArrival);

    grid.innerHTML = '';

    if (products.length === 0) {
        grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:50px; background:#1e1e1e; border-radius:8px; border:1px solid #333;"><h3 style="color:#fff;">No Products Found</h3></div>`;
        return;
    }

    products.forEach(p => {
        let priceHTML = `<span class="current-price">৳ ${p.price}</span>`;
        let badgeHTML = '';
        if (p.originalPrice && p.originalPrice > p.price) {
            priceHTML = `<span class="old-price">৳ ${p.originalPrice}</span> <span class="current-price">৳ ${p.price}</span>`;
            const d = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
            badgeHTML = `<span class="discount-badge">-${d}%</span>`;
        }
        let imgHTML = p.image 
            ? `<img src="${p.image}" alt="${p.name}">` 
            : `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#555;"><i class="fas fa-tshirt" style="font-size:3em;"></i></div>`;

        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `${badgeHTML}<div class="product-image">${imgHTML}</div><div class="product-info"><h3>${p.name}</h3><div class="price-container">${priceHTML}</div><div class="product-actions"><button onclick="addToCart('${p.id}')" class="btn secondary-btn">Add to Cart</button><button onclick="buyNow('${p.id}')" class="btn primary-btn">Buy Now</button></div></div>`;
        grid.appendChild(card);
    });
}

// গ্লোবাল ফাংশন হিসেবে তৈরি করা হলো যাতে HTML থেকে কল করা যায়
window.addToCart = async function(id) {
    const products = await getStorage(KEY_PRODUCTS);
    const product = products.find(p => p.id == id);
    if (product) { 
        let cart = await getStorage(KEY_CART); 
        let ex = cart.find(item => item.id == id);
        if(ex) ex.qty++; else cart.push({...product, qty:1});
        await setStorage(KEY_CART, cart); 
        await updateCartCount(); 
        alert('Product added to cart!');
    }
};
window.buyNow = async function(id) { await window.addToCart(id); window.location.href = 'checkout.html'; };

async function loadCartDisplay() {
    const c = document.querySelector('.cart-items'); const t = document.getElementById('cart-total');
    if(!c) return; 
    const cart = await getStorage(KEY_CART);
    
    if(cart.length===0) { 
        c.innerHTML='<p style="text-align:center;color:#aaa;">Cart is empty.</p>'; 
        if(t) t.innerText='0'; 
        const btn = document.querySelector('.checkout-btn'); if(btn) btn.style.display='none';
        return; 
    }
    
    let total = 0;
    c.innerHTML = cart.map((item, i) => {
        total += (item.price * item.qty);
        let img = item.image ? `<img src="${item.image}" style="width:60px;height:60px;object-fit:cover;border-radius:4px;">` : `<div style="width:60px;height:60px;background:#333;"></div>`;
        return `<div class="cart-item"><div class="cart-item-info">${img}<div><h4>${item.name}</h4><p>৳${item.price} x ${item.qty}</p><div class="qty-controls"><button class="qty-btn" onclick="upQty(${i},-1)">-</button><span>${item.qty}</span><button class="qty-btn" onclick="upQty(${i},1)">+</button></div></div></div><div style="text-align:right;"><p style="font-weight:bold;color:#ff9f43;">৳${item.price*item.qty}</p><button onclick="rmC(${i})" style="color:red;background:none;border:none;cursor:pointer;margin-top:5px;">Remove</button></div></div>`;
    }).join('');
    if(t) t.innerText = total;
}

window.upQty = async (i, v) => { 
    let cart = await getStorage(KEY_CART); 
    cart[i].qty+=v; 
    if(cart[i].qty<1) { if(confirm("Remove?")) cart.splice(i,1); else cart[i].qty=1; } 
    await setStorage(KEY_CART, cart); 
    await loadCartDisplay(); 
    await updateCartCount(); 
};
window.rmC = async (i) => { 
    let cart = await getStorage(KEY_CART); 
    cart.splice(i,1); 
    await setStorage(KEY_CART, cart); 
    await loadCartDisplay(); 
    await updateCartCount(); 
};

function handleCheckoutForm() {
    const form = document.getElementById('checkout-form');
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const cart = await getStorage(KEY_CART);
            if(cart.length === 0) return alert("Cart is empty!");

            let count = parseInt(localStorage.getItem(KEY_ORDER_COUNT)) || 0; count++; 
            localStorage.setItem(KEY_ORDER_COUNT, count);
            const orderId = 'ORD-' + String(count).padStart(3, '0');
            const total = cart.reduce((s, i) => s + (parseFloat(i.price) * parseInt(i.qty)), 0);

            const order = {
                id: orderId, date: new Date().toLocaleDateString(),
                customer: { name: e.target.name.value, phone: e.target.phone.value, address: e.target.address.value },
                items: cart, total: total, status: 'Pending'
            };

            const orders = await getStorage(KEY_ORDERS); 
            orders.unshift(order); 
            await setStorage(KEY_ORDERS, orders);
            await setStorage(KEY_CART, []); 
            await updateCartCount();
            
            alert(`Order Confirmed!\nID: ${orderId}`); 
            window.location.href = 'index.html';
        };
    }
}

async function loadCartSummaryForCheckout() { 
    const el = document.getElementById('checkout-total'); 
    if(el) { 
        const c = await getStorage(KEY_CART); 
        el.innerText = c.reduce((s, i) => s + (parseFloat(i.price) * parseInt(i.qty)), 0); 
    } 
}

function handleContactForm() {
    const form = document.getElementById('contact-form');
    if(form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const msg = { id: Date.now(), date: new Date().toLocaleDateString(), name: e.target.name.value, email: e.target.email.value, subject: e.target.subject.value, text: e.target.message.value, isRead: false };
            const msgs = await getStorage(KEY_MESSAGES); 
            msgs.unshift(msg); 
            await setStorage(KEY_MESSAGES, msgs); 
            e.target.reset(); 
            alert('Message Sent!');
        };
    }
}

// ==========================================
//  ADMIN LOGIC (Async)
// ==========================================

async function initAdminDashboard() {
    const orders = await getStorage(KEY_ORDERS);
    const products = await getStorage(KEY_PRODUCTS);
    const rev = orders.filter(x => x.status === 'Delivered').reduce((s, i) => s + parseFloat(i.total), 0);
    
    const setVal = (id, v) => { if(document.getElementById(id)) document.getElementById(id).innerText = v; };
    setVal('stat-revenue', '৳ ' + rev);
    setVal('stat-pending', orders.filter(o => o.status === 'Pending').length);
    setVal('stat-shipped', orders.filter(o => o.status === 'Shipped').length);
    setVal('stat-delivered', orders.filter(o => o.status === 'Delivered').length);
    setVal('stat-cancelled', orders.filter(o => o.status === 'Cancelled').length);
    setVal('stat-products', products.length);
}

function initAdminProducts() {
    const form = document.getElementById('add-product-form');
    const tbody = document.querySelector('#product-table tbody');

    const renderTable = async () => {
        const products = await getStorage(KEY_PRODUCTS);
        if (products.length === 0) { tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Empty</td></tr>'; document.getElementById('current-product-count').innerText = 0; return; }
        tbody.innerHTML = products.map((p, i) => `<tr><td><img src="${p.image||''}" style="width:40px;height:40px;object-fit:cover;border-radius:4px;"></td><td>${p.name} ${p.isNewArrival?'<span style="color:#2ecc71;">(New)</span>':''}</td><td>৳ ${p.price}</td><td><button onclick="delP(${i})" style="color:red;border:none;background:none;cursor:pointer;">Del</button></td></tr>`).join('');
        document.getElementById('current-product-count').innerText = products.length;
    };
    renderTable();

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const file = e.target.image.files[0];
            const reader = new FileReader();
            
            const save = async (imgData) => {
                const p = await getStorage(KEY_PRODUCTS);
                p.push({
                    id: Date.now(), name: e.target.name.value, price: parseFloat(e.target.price.value),
                    originalPrice: e.target.oldPrice.value ? parseFloat(e.target.oldPrice.value) : null,
                    isNewArrival: e.target.isNew.checked, image: imgData
                });
                await setStorage(KEY_PRODUCTS, p);
                e.target.reset(); renderTable(); alert('Added!');
            };

            if (file) {
                // Unlimited size allowed (IndexedDB can handle it)
                reader.onload = (ev) => save(ev.target.result);
                reader.readAsDataURL(file);
            } else {
                save(null);
            }
        });
    }
    window.delP = async (i) => { if(confirm('Delete?')) { const p = await getStorage(KEY_PRODUCTS); p.splice(i, 1); await setStorage(KEY_PRODUCTS, p); renderTable(); } };
}

function initAdminOrders() {
    const tbody = document.querySelector('#orders-table tbody');
    let currentFilter = 'All';

    const render = async () => {
        const allOrders = await getStorage(KEY_ORDERS);
        const list = currentFilter === 'All' ? allOrders : allOrders.filter(o => o.status === currentFilter);
        
        document.querySelectorAll('.filter-btn').forEach(b => {
            if(b.innerText.includes(currentFilter)) b.classList.add('active'); else b.classList.remove('active');
        });

        if (list.length === 0) { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No Orders</td></tr>'; return; }

        tbody.innerHTML = list.map(o => {
            const idx = allOrders.findIndex(x => x.id === o.id);
            let c = '#ff9f43'; if(o.status==='Shipped')c='#3498db'; if(o.status==='Delivered')c='#2ecc71'; if(o.status==='Cancelled')c='#e74c3c';
            return `<tr><td>${o.id}</td><td>${o.customer.name}</td><td>৳ ${o.total}</td><td><select onchange="upS(${idx},this.value)" style="color:${c};background:#222;border:1px solid ${c}"><option ${o.status==='Pending'?'selected':''}>Pending</option><option ${o.status==='Shipped'?'selected':''}>Shipped</option><option ${o.status==='Delivered'?'selected':''}>Delivered</option><option ${o.status==='Cancelled'?'selected':''}>Cancelled</option></select></td><td><button onclick="vOrd('${o.id}')" style="color:#fff;background:none;border:none;cursor:pointer;">View</button></td></tr>`;
        }).join('');
    };
    render();

    window.filterOrders = (s) => { currentFilter = s; render(); };
    window.upS = async (i, v) => { const o = await getStorage(KEY_ORDERS); o[i].status = v; await setStorage(KEY_ORDERS, o); render(); };
    window.vOrd = async (id) => { const o = (await getStorage(KEY_ORDERS)).find(x => x.id === id); if(!o) return; const items = o.items.map(i=>`- ${i.name} x${i.qty} (৳${i.price})`).join('\n'); alert(`ID: ${o.id}\nInfo: ${o.customer.name}\nAddr: ${o.customer.address}\n\nItems:\n${items}\nTotal: ৳${o.total}`); };
}

function initAdminMessages() {
    const tbody = document.querySelector('#messages-table tbody');
    let viewMode = 'New'; 

    const render = async () => {
        const allMsgs = await getStorage(KEY_MESSAGES);
        const list = viewMode === 'New' ? allMsgs.filter(m => !m.isRead) : allMsgs.filter(m => m.isRead);
        
        document.querySelectorAll('.filter-btn').forEach(b => {
            if(b.innerText.includes(viewMode)) b.classList.add('active'); else b.classList.remove('active');
        });

        if (list.length === 0) { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No Messages</td></tr>'; }
        else {
            tbody.innerHTML = list.map(m => {
                const idx = allMsgs.findIndex(x => x.id === m.id);
                return `<tr><td>${m.date}</td><td>${m.name}<br><small style="color:#aaa;">${m.email}</small></td><td>${m.subject}</td><td>${m.text}</td><td>${!m.isRead?`<button onclick="mkR(${idx})" style="color:green;background:none;border:none;cursor:pointer;">Mark Read</button>`:''}<button onclick="dlM(${idx})" style="color:red;background:none;border:none;cursor:pointer;">Del</button></td></tr>`;
            }).join('');
        }
    };
    render();

    window.filterMsgs = (m) => { viewMode = m; render(); };
    window.mkR = async (i) => { const m = await getStorage(KEY_MESSAGES); m[i].isRead = true; await setStorage(KEY_MESSAGES, m); render(); };
    window.dlM = async (i) => { if(confirm('Del?')) { const m = await getStorage(KEY_MESSAGES); m.splice(i, 1); await setStorage(KEY_MESSAGES, m); render(); }};
}
