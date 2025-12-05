// ======================================================
// LYNEX MAIN SCRIPT (IndexedDB & Fixed Labels)
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

// --- LOGIN CREDENTIALS ---
const _u = "SysMaster_99";
const _p = "L7n@x#Super!2025";

// --- INDEXED DB CONFIG (UNLIMITED STORAGE) ---
const DB_NAME = "LynexDB_Final";
const DB_VERSION = 1;
let db;

function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (e) => {
            db = e.target.result;
            if (!db.objectStoreNames.contains('store')) {
                db.createObjectStore('store');
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

// Async Storage Functions
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
            alert("Error saving data: " + e.target.error.message);
            resolve(false);
        };
    });
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async function() {
    
    await initDB(); // Initialize Database first

    // Nav Toggle
    const menuToggle = document.getElementById('menu-toggle');
    const navList = document.getElementById('nav-list');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => navList.classList.toggle('active'));
    }
    
    await updateCartCount();

    const path = window.location.pathname;
    const page = path.split("/").pop(); 

    // --- PUBLIC PAGES ---
    if (page === 'index.html' || page === '') await loadProductsDisplay(true);
    else if (page === 'products.html') await loadProductsDisplay(false);
    else if (page === 'cart.html') await loadCartDisplay();
    else if (page === 'checkout.html') { handleCheckoutForm(); await loadCartSummaryForCheckout(); }
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
                const token = Math.random().toString(36).substr(2);
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

// --- WEBSITE LOGIC ---

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

        // [UPDATED] Button Text: Add & Buy
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            ${badgeHTML}
            <div class="product-image">${imgHTML}</div>
            <div class="product-info">
                <h3>${p.name}</h3>
                <div class="price-container">${priceHTML}</div>
                <div class="product-actions">
                    <button onclick="addToCart('${p.id}')" class="btn secondary-btn">Add</button>
                    <button onclick="buyNow('${p.id}')" class="btn primary-btn">Buy</button>
                </div>
            </div>`;
        grid.appendChild(card);
    });
}

// Made global for HTML access
window.addToCart = async function(id) {
    const products = await getStorage(KEY_PRODUCTS);
    const product = products.find(p => p.id == id);
    if (product) {
        let cart = await getStorage(KEY_CART);
        const exIdx = cart.findIndex(item => item.id == id);
        if (exIdx > -1) cart[exIdx].qty += 1; else cart.push({ ...product, qty: 1 });
        await setStorage(KEY_CART, cart);
        await updateCartCount();
        alert('Product Added!');
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
        return `<div class="cart-item"><div class="cart-item-info">${img}<div><h4>${item.name}</h4><p>৳ ${item.price} x ${item.qty}</p><div class="qty-controls"><button class="qty-btn" onclick="upQty(${i},-1)">-</button><span style="color:#fff;">${item.qty}</span><button class="qty-btn" onclick="upQty(${i},1)">+</button></div></div></div><div style="text-align:right;"><p style="font-weight:bold;color:#ff9f43;">৳ ${item.price*item.qty}</p><button onclick="rmC(${i})" style="color:#e74c3c;background:none;border:none;cursor:pointer;margin-top:5px;">Remove</button></div></div>`;
    }).join('');
    if(t) t.innerText = total;
}

window.upQty = async (i, v) => { 
    let c = await getStorage(KEY_CART); c[i].qty+=v; 
    if(c[i].qty<1) { if(confirm("Remove?")) c.splice(i,1); else c[i].qty=1; } 
    await setStorage(KEY_CART, c); await loadCartDisplay(); await updateCartCount(); 
};
window.rmC = async (i) => { 
    let c = await getStorage(KEY_CART); c.splice(i,1); 
    await setStorage(KEY_CART, c); await loadCartDisplay(); await updateCartCount(); 
};

function handleCheckoutForm() {
    const f = document.getElementById('checkout-form');
    if(f) {
        f.onsubmit = async (e) => {
            e.preventDefault();
            const c = await getStorage(KEY_CART);
            if(c.length===0) return alert('Cart Empty');
            
            let cnt = parseInt(localStorage.getItem(KEY_ORDER_COUNT))||0; cnt++; localStorage.setItem(KEY_ORDER_COUNT, cnt);
            const ordId = 'ORD-'+String(cnt).padStart(3,'0');
            const total = c.reduce((s,i)=>s+(i.price*i.qty),0);
            
            const ord = { id: ordId, date: new Date().toLocaleDateString(), customer: {name: e.target.name.value, phone: e.target.phone.value, address: e.target.address.value}, items: c, total: total, status: 'Pending' };
            const orders = await getStorage(KEY_ORDERS); orders.unshift(ord); 
            
            await setStorage(KEY_ORDERS, orders);
            await setStorage(KEY_CART, []); await updateCartCount();
            alert(`Order Confirmed!\nID: ${ordId}`); window.location.href='index.html';
        };
    }
}
async function loadCartSummaryForCheckout() { const el=document.getElementById('checkout-total'); if(el) { const c = await getStorage(KEY_CART); el.innerText=c.reduce((s,i)=>s+(i.price*i.qty),0); } }

function handleContactForm() {
    const f=document.getElementById('contact-form');
    if(f) {
        f.onsubmit = async (e) => {
            e.preventDefault();
            const m={id:Date.now(), date:new Date().toLocaleDateString(), name:e.target.name.value, email:e.target.email.value, subject:e.target.subject.value, text:e.target.message.value, isRead:false};
            const ms = await getStorage(KEY_MESSAGES); ms.unshift(m); 
            await setStorage(KEY_MESSAGES, ms); e.target.reset(); alert('Sent!');
        };
    }
}

// --- ADMIN LOGIC ---

async function initAdminDashboard() {
    const o = await getStorage(KEY_ORDERS);
    const p = await getStorage(KEY_PRODUCTS);
    const rev = o.filter(x => x.status === 'Delivered').reduce((s, i) => s + parseFloat(i.total), 0);
    
    const setT = (id, v) => { if(document.getElementById(id)) document.getElementById(id).innerText = v; };
    setT('stat-revenue', '৳ ' + rev);
    setT('stat-pending', o.filter(x => x.status === 'Pending').length);
    setT('stat-shipped', o.filter(x => x.status === 'Shipped').length);
    setT('stat-delivered', o.filter(x => x.status === 'Delivered').length);
    setT('stat-cancelled', o.filter(x => x.status === 'Cancelled').length);
    setT('stat-products', p.length);
}

function initAdminProducts() {
    const f=document.getElementById('add-product-form'); const tb=document.querySelector('#product-table tbody');
    const render = async () => {
        const p = await getStorage(KEY_PRODUCTS);
        if (p.length === 0) { tb.innerHTML = '<tr><td colspan="4" style="text-align:center;">Empty</td></tr>'; document.getElementById('current-product-count').innerText=0; return; }
        tb.innerHTML = p.map((x, i) => `<tr><td><img src="${x.image||''}" style="width:40px;height:40px;object-fit:cover;border-radius:4px;"></td><td>${x.name}</td><td>৳${x.price}</td><td><button onclick="delP(${i})" style="color:red;border:none;background:none;cursor:pointer;">Del</button></td></tr>`).join('');
        document.getElementById('current-product-count').innerText = p.length;
    };
    render();
    if(f) {
        f.addEventListener('submit', (e) => {
            e.preventDefault();
            const file = e.target.image.files[0];
            const reader = new FileReader();
            const save = async (img) => {
                const p = await getStorage(KEY_PRODUCTS);
                p.push({ id: Date.now(), name: e.target.name.value, price: parseFloat(e.target.price.value), originalPrice: e.target.oldPrice.value ? parseFloat(e.target.oldPrice.value) : null, isNewArrival: e.target.isNew.checked, image: img });
                await setStorage(KEY_PRODUCTS, p); e.target.reset(); render(); alert('Added!');
            };
            if(file) { reader.onload = (ev) => save(ev.target.result); reader.readAsDataURL(file); } else save(null);
        });
    }
    window.delP = async (i) => { if(confirm('Delete?')) { const p = await getStorage(KEY_PRODUCTS); p.splice(i, 1); await setStorage(KEY_PRODUCTS, p); render(); } };
}

function initAdminOrders() {
    const tb=document.querySelector('#orders-table tbody'); let flt='All';
    const render = async () => {
        const all = await getStorage(KEY_ORDERS);
        const l = flt==='All' ? all : all.filter(x => x.status === flt);
        
        document.querySelectorAll('.filter-btn').forEach(b => {
            if(b.innerText.includes(flt) || (flt==='All'&&b.innerText==='All')) b.classList.add('active'); else b.classList.remove('active');
        });

        if (l.length === 0) { tb.innerHTML = '<tr><td colspan="5" style="text-align:center;">No Orders</td></tr>'; return; }
        tb.innerHTML = l.map(o => {
            const ix = all.findIndex(x => x.id === o.id);
            let c='#ff9f43'; if(o.status==='Shipped')c='#3498db'; if(o.status==='Delivered')c='#2ecc71'; if(o.status==='Cancelled')c='#e74c3c';
            return `<tr><td>${o.id}</td><td>${o.customer.name}</td><td>৳${o.total}</td><td><select onchange="upS(${ix},this.value)" style="color:${c};background:#222;border:1px solid ${c}"><option ${o.status==='Pending'?'selected':''}>Pending</option><option ${o.status==='Shipped'?'selected':''}>Shipped</option><option ${o.status==='Delivered'?'selected':''}>Delivered</option><option ${o.status==='Cancelled'?'selected':''}>Cancelled</option></select></td><td><button onclick="vOrd('${o.id}')" style="color:#fff;background:none;border:none;cursor:pointer;">View</button></td></tr>`;
        }).join('');
    };
    render();
    window.filterOrders = (s) => { flt = s; render(); };
    window.upS = async (i, v) => { const o = await getStorage(KEY_ORDERS); o[i].status = v; await setStorage(KEY_ORDERS, o); render(); };
    window.vOrd = async (id) => { const o = (await getStorage(KEY_ORDERS)).find(x => x.id === id); if(!o) return; const its = o.items.map(i=>`- ${i.name} x${i.qty} (৳${i.price})`).join('\n'); alert(`ID: ${o.id}\nInfo: ${o.customer.name}\n${o.customer.phone}\n${o.customer.address}\n\nItems:\n${its}\nTotal: ৳${o.total}`); };
}

function initAdminMessages() {
    const tb=document.querySelector('#messages-table tbody'); let vm='New';
    const render = async () => {
        const all = await getStorage(KEY_MESSAGES);
        const l = vm==='New' ? all.filter(m => !m.isRead) : all.filter(m => m.isRead);
        
        document.querySelectorAll('.filter-btn').forEach(b => {
            if(b.innerText.includes(vm)) b.classList.add('active'); else b.classList.remove('active');
        });

        if (l.length === 0) { tb.innerHTML = '<tr><td colspan="5" style="text-align:center;">No Messages</td></tr>'; }
        else {
            tb.innerHTML = l.map(m => {
                const idx = all.findIndex(x => x.id === m.id);
                return `<tr><td>${m.date}</td><td>${m.name}<br><small>${m.email}</small></td><td>${m.subject}</td><td>${m.text}</td><td>${!m.isRead?`<button onclick="mkR(${idx})" style="color:green;background:none;border:none;cursor:pointer;">Read</button>`:''}<button onclick="delMsg(${idx})" style="color:red;background:none;border:none;cursor:pointer;">Del</button></td></tr>`;
            }).join('');
        }
    };
    render();
    window.filterMsgs = (m) => { vm = m; render(); };
    window.mkR = async (i) => { const m = await getStorage(KEY_MESSAGES); m[i].isRead = true; await setStorage(KEY_MESSAGES, m); render(); };
    window.delMsg = async (i) => { if(confirm('Del?')) { const m = await getStorage(KEY_MESSAGES); m.splice(i, 1); await setStorage(KEY_MESSAGES, m); render(); }};
}
