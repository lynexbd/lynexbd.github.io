// ======================================================
// LYNEX ULTIMATE SCRIPT (Final Fixed Version)
// ======================================================

// --- CONFIG ---
const DB_NAME = "LynexDB_V5_Final"; // Version changed to reset bad data
const DB_VERSION = 1;

const KEY_PRODUCTS = 'lynex_products';
const KEY_CART = 'lynex_cart';
const KEY_ORDERS = 'lynex_orders';
const KEY_MESSAGES = 'lynex_messages';
const KEY_ADMIN_TOKEN = 'lynex_secure_token_v99';
const KEY_ORDER_COUNT = 'lynex_order_counter';

// Login Info
const ADMIN_USER = "SysMaster_99";
const ADMIN_PASS = "L7n@x#Super!2025";

// File Names
const PAGE_LOGIN = 'k7_entry_point.html';
const PAGE_DASHBOARD = 'x_master_v9.html';

let db;

// --- 1. DATABASE SYSTEM ---
function initDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
            db = e.target.result;
            if (!db.objectStoreNames.contains('store')) db.createObjectStore('store');
        };
        req.onsuccess = (e) => { db = e.target.result; resolve(db); };
        req.onerror = (e) => { console.error("DB Error", e); alert("Database Error!"); resolve(null); };
    });
}

async function getStorage(key) {
    return new Promise((resolve) => {
        if (!db) { resolve([]); return; }
        const tx = db.transaction(['store'], 'readonly');
        const req = tx.objectStore('store').get(key);
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
    });
}

async function setStorage(key, data) {
    return new Promise((resolve) => {
        if (!db) { resolve(false); return; }
        const tx = db.transaction(['store'], 'readwrite');
        const req = tx.objectStore('store').put(data, key);
        req.onsuccess = () => resolve(true);
        req.onerror = (e) => { alert("Save Failed: " + e.target.error); resolve(false); };
    });
}

// --- 2. INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async function() {
    await initDB(); // Wait for DB
    createPopupHTML(); 

    // Mobile Menu
    const menuToggle = document.getElementById('menu-toggle');
    const navList = document.getElementById('nav-list');
    if (menuToggle) menuToggle.addEventListener('click', () => navList.classList.toggle('active'));
    
    await updateCartCount();

    // --- ROUTING LOGIC ---
    const path = window.location.pathname;
    
    // Admin Login Page
    if (path.includes(PAGE_LOGIN)) {
        initLoginPage();
    }
    // Admin Internal Pages
    else if (document.querySelector('.sidebar')) {
        checkAdminAuth();
        updateAdminSidebarBadges();
        if (document.getElementById('stat-revenue')) initAdminDashboard();
        if (document.getElementById('add-product-form')) initAdminProducts();
        if (document.getElementById('orders-table')) initAdminOrders();
        if (document.getElementById('messages-table')) initAdminMessages();
    }
    // Website Pages
    else {
        if (document.querySelector('.product-grid')) {
            // Home page check (Hero section exists only on home)
            const isHome = document.querySelector('.hero-section') !== null;
            loadProductsDisplay(isHome);
        }
        if (document.querySelector('.cart-items')) {
            if(document.getElementById('checkout-form')) {
                handleCheckoutForm();
                loadCartSummaryForCheckout();
            } else {
                loadCartDisplay();
            }
        }
        if (document.getElementById('contact-form')) {
            handleContactForm();
        }
    }
});

// --- 3. AUTHENTICATION ---
function initLoginPage() {
    if (sessionStorage.getItem(KEY_ADMIN_TOKEN)) {
        window.location.href = PAGE_DASHBOARD;
        return;
    }
    const form = document.getElementById('secure-login-form');
    if(form) {
        form.onsubmit = (e) => {
            e.preventDefault();
            const u = form.username.value.trim();
            const p = form.password.value.trim();
            if (u === ADMIN_USER && p === ADMIN_PASS) {
                sessionStorage.setItem(KEY_ADMIN_TOKEN, 'active_' + Date.now());
                window.location.href = PAGE_DASHBOARD;
            } else {
                showPopup('Error', 'Invalid ID or Password', 'error');
                form.reset();
            }
        };
    }
}

function checkAdminAuth() {
    if (!sessionStorage.getItem(KEY_ADMIN_TOKEN)) window.location.replace(PAGE_LOGIN);
}

window.adminLogout = function() {
    sessionStorage.removeItem(KEY_ADMIN_TOKEN);
    window.location.href = PAGE_LOGIN;
};

// --- 4. WEBSITE FUNCTIONS ---
async function loadProductsDisplay(isHome) {
    const grid = document.querySelector('.product-grid');
    let products = await getStorage(KEY_PRODUCTS);
    if (isHome) products = products.filter(p => p.isNewArrival);

    if (products.length === 0) {
        grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:50px;color:#777;">No Products Available</div>`;
        return;
    }

    grid.innerHTML = products.map(p => {
        let priceHTML = `<span class="current-price">৳ ${p.price}</span>`;
        let badge = '';
        if(p.originalPrice > p.price) {
            const d = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
            priceHTML = `<span class="old-price">৳ ${p.originalPrice}</span> <span class="current-price">৳ ${p.price}</span>`;
            badge = `<span class="discount-badge">-${d}% OFF</span>`;
        }
        
        let images = p.images && p.images.length ? p.images : [''];
        let slides = images.map((src, i) => `<img src="${src}" class="slider-image ${i===0?'active':''}">`).join('');
        let dots = images.length > 1 ? `<div class="slider-dots">${images.map((_,i)=>`<span class="dot ${i===0?'active':''}" onclick="goToSlide(${i}, '${p.id}')"></span>`).join('')}</div>` : '';
        
        // Touch/Swipe Support added via inline event
        return `
        <div class="product-card">
            ${badge}
            <div class="slider-container" id="slider-${p.id}" onclick="changeSlide(1, '${p.id}')">${slides}${dots}</div>
            <div class="product-info">
                <h3>${p.name}</h3>
                <div class="price-container">${priceHTML}</div>
                <div class="product-actions">
                    <button onclick="addToCart('${p.id}')" class="btn secondary-btn">Add to Cart</button>
                    <button onclick="buyNow('${p.id}')" class="btn primary-btn">Buy Now</button>
                </div>
            </div>
        </div>`;
    }).join('');
}

// Slider
window.slideIndex = {};
window.changeSlide = (n, id) => {
    let s = document.querySelectorAll(`#slider-${id} .slider-image`);
    let d = document.querySelectorAll(`#slider-${id} .dot`);
    if(s.length <= 1) return;
    
    let c = window.slideIndex[id] || 0;
    s[c].classList.remove('active');
    if(d.length) d[c].classList.remove('active');
    
    c += n;
    if(c >= s.length) c = 0;
    if(c < 0) c = s.length - 1;
    
    s[c].classList.add('active');
    if(d.length) d[c].classList.add('active');
    window.slideIndex[id] = c;
};
window.goToSlide = (n, id) => { /* Logic reused inside map */ };

// Cart
window.addToCart = async (id) => {
    const p = (await getStorage(KEY_PRODUCTS)).find(x => x.id == id);
    if (p) {
        let c = await getStorage(KEY_CART);
        let ex = c.find(x => x.id == id);
        if(ex) ex.qty++; else c.push({...p, qty: 1});
        await setStorage(KEY_CART, c);
        await updateCartCount();
        showPopup('Success', 'Added to Cart!', 'success');
    }
};
window.buyNow = async (id) => { await window.addToCart(id); setTimeout(()=>window.location.href='checkout.html', 300); };

async function loadCartDisplay() {
    const c = document.querySelector('.cart-items');
    const t = document.getElementById('cart-total');
    if(!c) return;
    const cart = await getStorage(KEY_CART);
    
    if(cart.length===0) { 
        c.innerHTML='<p style="text-align:center;color:#aaa;">Cart is empty</p>'; 
        if(t) t.innerText='0'; 
        if(document.querySelector('.checkout-btn')) document.querySelector('.checkout-btn').style.display='none';
        return; 
    }
    
    c.innerHTML = cart.map((x,i) => {
        let img = x.images && x.images.length ? x.images[0] : '';
        return `<div class="cart-item"><div class="cart-item-info"><img src="${img}" style="width:60px;height:60px;object-fit:cover;border-radius:4px;"><div><h4>${x.name}</h4><p>৳${x.price} x ${x.qty}</p><div class="qty-controls"><button class="qty-btn" onclick="upQty(${i},-1)">-</button><span>${x.qty}</span><button class="qty-btn" onclick="upQty(${i},1)">+</button></div></div></div><div style="text-align:right;"><p style="font-weight:bold;color:#ff9f43;">৳${x.price*x.qty}</p><button onclick="rmC(${i})" style="color:#e74c3c;background:none;border:none;cursor:pointer;">Remove</button></div></div>`;
    }).join('');
    if(t) t.innerText = cart.reduce((s,i)=>s+(i.price*i.qty),0);
}
window.upQty = async (i, v) => { let c = await getStorage(KEY_CART); c[i].qty+=v; if(c[i].qty<1) { if(confirm("Remove?")) c.splice(i,1); else c[i].qty=1; } await setStorage(KEY_CART, c); loadCartDisplay(); updateCartCount(); };
window.rmC = async (i) => { let c = await getStorage(KEY_CART); c.splice(i,1); await setStorage(KEY_CART, c); loadCartDisplay(); updateCartCount(); };

// Checkout
function handleCheckoutForm() {
    const f = document.getElementById('checkout-form');
    if(f) {
        f.onsubmit = async (e) => {
            e.preventDefault();
            const cart = await getStorage(KEY_CART);
            if(cart.length === 0) return showPopup('Error', 'Cart Empty', 'error');
            
            let cnt = (await getStorage(KEY_ORDER_COUNT)) || 0;
            if(typeof cnt !== 'number') cnt = 0;
            cnt++;
            await setStorage(KEY_ORDER_COUNT, cnt);
            
            const id = 'ORD-' + String(cnt).padStart(3, '0');
            const total = cart.reduce((s,i)=>s+(i.price*i.qty),0);
            
            const ord = {
                id: id, date: new Date().toLocaleDateString(),
                customer: { name: f.name.value, phone: f.phone.value, address: f.address.value },
                items: cart, total: total, status: 'Pending'
            };

            const orders = await getStorage(KEY_ORDERS);
            orders.unshift(ord);
            await setStorage(KEY_ORDERS, orders);
            await setStorage(KEY_CART, []);
            
            const list = cart.map(i => `- ${i.name} (x${i.qty})`).join('\n');
            showPopup('Order Confirmed!', `ID: ${id}\nTotal: ৳${total}\n\n${list}\n\n* We will call you soon.`, 'success', 'index.html');
        };
    }
}
async function loadCartSummaryForCheckout() { const el = document.getElementById('checkout-total'); if(el) { const c = await getStorage(KEY_CART); el.innerText = c.reduce((s,i)=>s+(i.price*i.qty),0); } }

// Contact
function handleContactForm() {
    const f = document.getElementById('contact-form');
    if(f) {
        f.onsubmit = async (e) => {
            e.preventDefault();
            const msg = { id: Date.now(), date: new Date().toLocaleDateString(), name: f.name.value, email: f.email.value, subject: f.subject.value, text: f.message.value, isRead: false };
            const msgs = await getStorage(KEY_MESSAGES); msgs.unshift(msg); await setStorage(KEY_MESSAGES, msgs); f.reset(); showPopup('Success', 'Feedback Sent!', 'success');
        };
    }
}

// --- ADMIN FUNCTIONS ---
async function initAdminDashboard() {
    const o = await getStorage(KEY_ORDERS); const p = await getStorage(KEY_PRODUCTS);
    const rev = o.filter(x => x.status === 'Delivered').reduce((s, i) => s + parseFloat(i.total), 0);
    const setT = (id, v) => { if(document.getElementById(id)) document.getElementById(id).innerText = v; };
    setT('stat-revenue', '৳ ' + rev); setT('stat-pending', o.filter(x=>x.status==='Pending').length);
    setT('stat-shipped', o.filter(x=>x.status==='Shipped').length); setT('stat-delivered', o.filter(x=>x.status==='Delivered').length);
    setT('stat-cancelled', o.filter(x=>x.status==='Cancelled').length); setT('stat-products', p.length);
}

function initAdminProducts() {
    const f = document.getElementById('add-product-form');
    const tb = document.querySelector('#product-table tbody');
    const input = document.getElementById('imageInput');

    const render = async () => {
        const p = await getStorage(KEY_PRODUCTS);
        if(p.length===0) { tb.innerHTML='<tr><td colspan="4" style="text-align:center;">Empty</td></tr>'; document.getElementById('current-product-count').innerText=0; return; }
        tb.innerHTML = p.map((x,i)=> `<tr><td><img src="${x.images[0]||''}" style="width:40px;"></td><td>${x.name}</td><td>৳${x.price}</td><td><button onclick="delP(${i})" style="color:red;border:none;background:none;">Del</button></td></tr>`).join('');
        document.getElementById('current-product-count').innerText = p.length;
    };
    render();

    if(f) {
        f.onsubmit = async (e) => {
            e.preventDefault();
            const files = Array.from(input.files);
            const readFiles = (fl) => Promise.all(fl.map(f => new Promise(r => { const fr = new FileReader(); fr.onload=()=>r(fr.result); fr.readAsDataURL(f); })));
            let imgData = [];
            if(files.length > 0) imgData = await readFiles(files);

            const p = await getStorage(KEY_PRODUCTS);
            p.push({ id: Date.now(), name: f.name.value, price: parseFloat(f.price.value), originalPrice: f.oldPrice.value ? parseFloat(f.oldPrice.value) : null, isNewArrival: f.isNew.checked, images: imgData });
            await setStorage(KEY_PRODUCTS, p); f.reset(); render(); showPopup('Success', 'Added!', 'success');
        };
    }
    window.delP = async (i) => { if(confirm('Delete?')) { const p = await getStorage(KEY_PRODUCTS); p.splice(i, 1); await setStorage(KEY_PRODUCTS, p); render(); } };
}

function initAdminOrders() {
    const tb = document.querySelector('#orders-table tbody');
    let filter = 'All';
    const render = async () => {
        const all = await getStorage(KEY_ORDERS);
        const l = filter==='All' ? all : all.filter(o => o.status === filter);
        document.querySelectorAll('.filter-btn').forEach(b => { if(b.innerText.includes(filter)) b.classList.add('active'); else b.classList.remove('active'); });
        
        if(l.length===0) { tb.innerHTML='<tr><td colspan="5" style="text-align:center;">No Orders</td></tr>'; return; }
        tb.innerHTML = l.map(o => {
            const idx = all.findIndex(x => x.id === o.id);
            let c='#ff9f43'; if(o.status==='Shipped')c='#3498db'; if(o.status==='Delivered')c='#2ecc71'; if(o.status==='Cancelled')c='#e74c3c';
            return `<tr><td>${o.id}</td><td>${o.customer.name}</td><td>৳${o.total}</td><td><select onchange="upS(${idx},this.value)" style="color:${c};background:#222;border:1px solid ${c}"><option ${o.status==='Pending'?'selected':''}>Pending</option><option ${o.status==='Shipped'?'selected':''}>Shipped</option><option ${o.status==='Delivered'?'selected':''}>Delivered</option><option ${o.status==='Cancelled'?'selected':''}>Cancelled</option></select></td><td><button onclick="vOrd('${o.id}')" style="color:#fff;background:none;border:none;">View</button></td></tr>`;
        }).join('');
    };
    render();
    window.filterOrders = (s) => { filter = s; render(); };
    window.upS = async (i, v) => { const o = await getStorage(KEY_ORDERS); o[i].status = v; await setStorage(KEY_ORDERS, o); render(); };
    window.vOrd = async (id) => { const o = (await getStorage(KEY_ORDERS)).find(x => x.id === id); if(!o)return; const items = o.items.map(i=>`- ${i.name} x${i.qty}`).join('\n'); showPopup('Details', `ID: ${o.id}\nName: ${o.customer.name}\nPhone: ${o.customer.phone}\nAddr: ${o.customer.address}\n\n${items}\n\nTotal: ৳${o.total}`, 'info'); };
}

function initAdminMessages() {
    const tb = document.querySelector('#messages-table tbody');
    let mode = 'New';
    const render = async () => {
        const all = await getStorage(KEY_MESSAGES);
        const l = mode==='New' ? all.filter(m => !m.isRead) : all.filter(m => m.isRead);
        document.querySelectorAll('.filter-btn').forEach(b => { if(b.innerText.includes(mode)) b.classList.add('active'); else b.classList.remove('active'); });
        
        if(l.length===0) { tb.innerHTML='<tr><td colspan="5" style="text-align:center;">No Messages</td></tr>'; return; }
        tb.innerHTML = l.map(m => {
            const idx = all.findIndex(x => x.id === m.id);
            return `<tr><td>${m.date}</td><td>${m.name}<br><small>${m.email}</small></td><td>${m.subject}</td><td>${m.text}</td><td>${!m.isRead?`<button onclick="mkR(${idx})" style="color:green;border:none;background:none;">Read</button>`:''}<button onclick="dlM(${idx})" style="color:red;border:none;background:none;">Del</button></td></tr>`;
        }).join('');
    };
    render();
    window.filterMsgs = (m) => { mode = m; render(); };
    window.mkR = async (i) => { const m = await getStorage(KEY_MESSAGES); m[i].isRead = true; await setStorage(KEY_MESSAGES, m); render(); };
    window.dlM = async (i) => { if(confirm('Del?')){ const m = await getStorage(KEY_MESSAGES); m.splice(i, 1); await setStorage(KEY_MESSAGES, m); render(); }};
}

// Helpers
function createPopupHTML() { if(!document.querySelector('.custom-popup-overlay')) { const p=document.createElement('div'); p.className='custom-popup-overlay'; p.innerHTML=`<div class="custom-popup-box"><i class="fas fa-info-circle popup-icon"></i><h3 class="popup-title"></h3><p class="popup-msg"></p><button class="btn primary-btn popup-btn">OK</button></div>`; document.body.appendChild(p); p.querySelector('.popup-btn').addEventListener('click', () => { p.classList.remove('active'); if(window.popupRedirect) { window.location.href=window.popupRedirect; window.popupRedirect=null; } }); } }
function showPopup(title, msg, type='info', url=null) { const o=document.querySelector('.custom-popup-overlay'); const i=o.querySelector('.popup-icon'); o.querySelector('.popup-title').innerText=title; o.querySelector('.popup-msg').innerHTML=msg.replace(/\n/g, '<br>'); if(type==='success') i.className='fas fa-check-circle popup-icon popup-success'; else if(type==='error') i.className='fas fa-times-circle popup-icon popup-error'; else i.className='fas fa-info-circle popup-icon popup-info'; if(url) window.popupRedirect=url; o.classList.add('active'); }
async function updateCartCount() { const c = await getStorage(KEY_CART); const t = c.reduce((s, i) => s + (parseInt(i.qty)||0), 0); document.querySelectorAll('.cart-count').forEach(e => e.innerText = `(${t})`); }
async function updateAdminSidebarBadges() { const o = await getStorage(KEY_ORDERS); const m = await getStorage(KEY_MESSAGES); if(o.some(x=>x.status==='Pending') && document.getElementById('nav-orders') && !location.pathname.includes(PAGE_ORDERS)) document.getElementById('nav-orders').innerHTML += ' <span class="nav-badge"></span>'; if(m.some(x=>!x.isRead) && document.getElementById('nav-messages') && !location.pathname.includes(PAGE_MESSAGES)) document.getElementById('nav-messages').innerHTML += ' <span class="nav-badge"></span>'; }
