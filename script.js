// ======================================================
// LYNEX MAIN SCRIPT (Final Complete)
// ======================================================

// --- CONFIG ---
const KEY_PRODUCTS = 'lynex_products';
const KEY_CART = 'lynex_cart';
const KEY_ORDERS = 'lynex_orders';
const KEY_MESSAGES = 'lynex_messages';
const KEY_ADMIN_TOKEN = 'lynex_secure_token_v99';
const KEY_ORDER_COUNT = 'lynex_order_counter';

// --- CREDENTIALS ---
const ADMIN_USER = "SysMaster_99";
const ADMIN_PASS = "L7n@x#Super!2025";

// --- INDEXEDDB SETUP ---
const DB_NAME = "LynexDB_Final_V5";
const DB_VERSION = 1;
let db;

function initDB() {
    return new Promise((resolve) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
            db = e.target.result;
            if(!db.objectStoreNames.contains('store')) db.createObjectStore('store');
        };
        req.onsuccess = (e) => { db = e.target.result; resolve(db); };
        req.onerror = (e) => { console.error("DB Error", e); resolve(null); };
    });
}

async function getStorage(key) {
    return new Promise((resolve) => {
        if(!db) { resolve([]); return; }
        const tx = db.transaction(['store'], 'readonly');
        const req = tx.objectStore('store').get(key);
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
    });
}

async function setStorage(key, data) {
    return new Promise((resolve) => {
        if(!db) { resolve(false); return; }
        const tx = db.transaction(['store'], 'readwrite');
        const req = tx.objectStore('store').put(data, key);
        req.onsuccess = () => resolve(true);
        req.onerror = (e) => { alert("Save Error: " + e.target.error); resolve(false); };
    });
}

// --- APP INIT ---
document.addEventListener('DOMContentLoaded', async function() {
    await initDB();
    createPopupHTML();

    const menuToggle = document.getElementById('menu-toggle');
    const navList = document.getElementById('nav-list');
    if (menuToggle) menuToggle.addEventListener('click', () => navList.classList.toggle('active'));
    
    await updateCartCount();

    // --- SMART ROUTING (Detect Elements) ---

    // 1. Login Page
    if (document.getElementById('secure-login-form')) {
        handleLogin();
    }

    // 2. Admin Features (If Sidebar Exists)
    if (document.querySelector('.sidebar')) {
        checkAdminAuth();
        updateAdminSidebarBadges();
        
        if (document.getElementById('stat-revenue')) initAdminDashboard();
        if (document.getElementById('add-product-form')) initAdminProducts();
        if (document.getElementById('orders-table')) initAdminOrders();
        if (document.getElementById('messages-table')) initAdminMessages();
    }

    // 3. Public Features
    if (document.querySelector('.product-grid')) {
        const isHome = document.querySelector('.hero-section') !== null;
        loadProductsDisplay(isHome);
    }
    
    if (document.getElementById('checkout-form')) {
        handleCheckoutForm();
        loadCartSummaryForCheckout();
    }
    
    if (document.querySelector('.cart-items') && !document.getElementById('checkout-form')) {
        loadCartDisplay();
    }
    
    if (document.getElementById('contact-form')) {
        handleContactForm();
    }
});

// --- AUTHENTICATION ---
function handleLogin() {
    if(sessionStorage.getItem(KEY_ADMIN_TOKEN)) {
        // Change this to your dashboard filename
        window.location.href = 'x_master_v9.html'; 
        return;
    }
    const form = document.getElementById('secure-login-form');
    form.onsubmit = (e) => {
        e.preventDefault();
        const u = form.username.value.trim();
        const p = form.password.value.trim();
        if (u === ADMIN_USER && p === ADMIN_PASS) {
            sessionStorage.setItem(KEY_ADMIN_TOKEN, Math.random().toString(36));
            window.location.href = 'x_master_v9.html';
        } else {
            showPopup('Error', 'Invalid ID or Key', 'error');
            form.reset();
        }
    };
}
function checkAdminAuth() { if (!sessionStorage.getItem(KEY_ADMIN_TOKEN)) window.location.href = 'k7_entry_point.html'; }
window.adminLogout = function() { sessionStorage.removeItem(KEY_ADMIN_TOKEN); window.location.href = 'k7_entry_point.html'; };

// --- WEBSITE ---
async function loadProductsDisplay(isHome) {
    const grid = document.querySelector('.product-grid');
    let products = await getStorage(KEY_PRODUCTS);
    if (isHome) products = products.filter(p => p.isNewArrival);

    grid.innerHTML = products.length ? products.map(p => {
        let priceHTML = `<span class="current-price">৳ ${p.price}</span>`;
        let badge = '';
        if(p.originalPrice > p.price) {
            const d = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
            priceHTML = `<span class="old-price">৳ ${p.originalPrice}</span> <span class="current-price">৳ ${p.price}</span>`;
            badge = `<span class="discount-badge">-${d}% OFF</span>`;
        }
        
        let images = p.images && p.images.length ? p.images : [''];
        let slides = images.map((src, i) => `<img src="${src}" class="slider-image ${i===0?'active':''}">`).join('');
        let dots = images.length > 1 ? `<div class="slider-dots" id="dots-${p.id}">${images.map((_,i)=>`<span class="dot ${i===0?'active':''}" onclick="goToSlide(${i}, '${p.id}')"></span>`).join('')}</div>` : '';
        window.slideIndex = window.slideIndex || {}; window.slideIndex[p.id] = 0;

        return `
        <div class="product-card">
            ${badge}
            <div class="slider-container" id="slider-${p.id}" onscroll="updateActiveDot(this, '${p.id}')">${slides}</div>
            ${dots}
            <div class="product-info">
                <h3>${p.name}</h3>
                <div class="price-container">${priceHTML}</div>
                <div class="product-actions">
                    <button onclick="addToCart('${p.id}')" class="btn secondary-btn">Add to Cart</button>
                    <button onclick="buyNow('${p.id}')" class="btn primary-btn">Buy Now</button>
                </div>
            </div>
        </div>`;
    }).join('') : '<p style="text-align:center;width:100%;color:#777;padding:50px;">No products.</p>';
}

// Slider
window.updateActiveDot = (el, id) => { const idx = Math.round(el.scrollLeft / el.offsetWidth); const dots = document.querySelectorAll(`#dots-${id} .dot`); dots.forEach(d => d.classList.remove('active')); if(dots[idx]) dots[idx].classList.add('active'); };
window.goToSlide = (n, id) => { const el = document.getElementById(`slider-${id}`); el.scrollTo({ left: el.offsetWidth * n, behavior: 'smooth' }); };

// Cart
window.addToCart = async (id) => {
    const p = (await getStorage(KEY_PRODUCTS)).find(x => x.id == id);
    if (p) {
        let c = await getStorage(KEY_CART);
        let ex = c.find(x => x.id == id);
        if(ex) ex.qty++; else c.push({...p, qty: 1});
        await setStorage(KEY_CART, c); await updateCartCount(); showPopup('Success', 'Added to Cart!', 'success');
    }
};
window.buyNow = async (id) => { await window.addToCart(id); setTimeout(()=>window.location.href='checkout.html', 500); };

async function loadCartDisplay() {
    const c = document.querySelector('.cart-items'); const t = document.getElementById('cart-total'); if(!c) return;
    const cart = await getStorage(KEY_CART);
    if(cart.length===0) { c.innerHTML='<p style="text-align:center;">Empty</p>'; if(t) t.innerText='0'; if(document.querySelector('.checkout-btn')) document.querySelector('.checkout-btn').style.display='none'; return; }
    c.innerHTML = cart.map((x,i)=> `<div class="cart-item"><div class="cart-item-info"><img src="${x.images[0]||''}" style="width:60px;"><div><h4>${x.name}</h4><p>৳${x.price} x ${x.qty}</p><div class="qty-controls"><button class="qty-btn" onclick="upQty(${i},-1)">-</button><span>${x.qty}</span><button class="qty-btn" onclick="upQty(${i},1)">+</button></div></div></div><div style="text-align:right;"><p style="font-weight:bold;color:#ff9f43;">৳${x.price*x.qty}</p><button onclick="rmC(${i})" style="color:#e74c3c;background:none;border:none;">Remove</button></div></div>`).join('');
    if(t) t.innerText = cart.reduce((s,i)=>s+(i.price*i.qty),0);
}
window.upQty = async (i, v) => { let c = await getStorage(KEY_CART); c[i].qty+=v; if(c[i].qty<1) { if(confirm("Remove?")) c.splice(i,1); else c[i].qty=1; } await setStorage(KEY_CART, c); loadCartDisplay(); updateCartCount(); };
window.rmC = async (i) => { let c = await getStorage(KEY_CART); c.splice(i,1); await setStorage(KEY_CART, c); loadCartDisplay(); updateCartCount(); };

function handleCheckoutForm() {
    const f = document.getElementById('checkout-form');
    if(f) {
        f.onsubmit = async (e) => {
            e.preventDefault();
            const c = await getStorage(KEY_CART);
            if(c.length===0) return showPopup('Error', 'Cart Empty', 'error');
            let cnt = parseInt(await getStorage(KEY_ORDER_COUNT))||0; cnt++; await setStorage(KEY_ORDER_COUNT, cnt);
            const id = 'ORD-'+String(cnt).padStart(3,'0');
            const tot = c.reduce((s,i)=>s+(i.price*i.qty),0);
            const ord = { id: id, date: new Date().toLocaleDateString(), customer: { name: f.name.value, phone: f.phone.value, address: f.address.value }, items: c, total: tot, status: 'Pending' };
            const orders = await getStorage(KEY_ORDERS); orders.unshift(ord); 
            await setStorage(KEY_ORDERS, orders); await setStorage(KEY_CART, []); await updateCartCount();
            const lst = c.map(i => `- ${i.name} (x${i.qty})`).join('\n');
            showPopup('Confirmed!', `ID: ${id}\nName: ${ord.customer.name}\n\n${lst}\n\nTotal: ৳${tot}\n\n* We will call you soon.`, 'success', 'index.html');
        };
    }
}
async function loadCartSummaryForCheckout() { const el=document.getElementById('checkout-total'); if(el) { const c=await getStorage(KEY_CART); el.innerText=c.reduce((s,i)=>s+(i.price*i.qty),0); }}
function handleContactForm() { const f=document.getElementById('contact-form'); if(f) f.onsubmit = async (e) => { e.preventDefault(); const m={id:Date.now(), date:new Date().toLocaleDateString(), name:f.name.value, email:f.email.value, subject:f.subject.value, text:f.message.value, isRead:false}; const ms = await getStorage(KEY_MESSAGES); ms.unshift(m); await setStorage(KEY_MESSAGES, ms); f.reset(); showPopup('Sent', 'Message sent!', 'success'); }; }

// --- ADMIN ---
function initAdminProducts() {
    const f=document.getElementById('add-product-form'); const tb=document.querySelector('#product-table tbody');
    const input = document.getElementById('imageInput');
    const render = async () => {
        const p = await getStorage(KEY_PRODUCTS);
        if(p.length===0) { tb.innerHTML='<tr><td colspan="4" style="text-align:center;">Empty</td></tr>'; document.getElementById('current-product-count').innerText=0; return; }
        tb.innerHTML = p.map((x,i)=> `<tr><td><img src="${x.images[0]||''}" style="width:40px;"></td><td>${x.name}</td><td>৳${x.price}</td><td><button onclick="delP(${i})" style="color:red;border:none;background:none;">Del</button></td></tr>`).join('');
        document.getElementById('current-product-count').innerText = p.length;
    };
    render();
    if(f) {
        f.addEventListener('submit', async (e) => {
            e.preventDefault();
            const files = Array.from(input.files);
            const readFiles = (fl) => Promise.all(fl.map(f => new Promise(r => { const fr = new FileReader(); fr.onload=()=>r(fr.result); fr.readAsDataURL(f); })));
            let imgData = []; if(files.length) imgData = await readFiles(files);
            const p = await getStorage(KEY_PRODUCTS);
            p.push({ id: Date.now(), name: f.name.value, price: parseFloat(f.price.value), originalPrice: f.oldPrice.value ? parseFloat(f.oldPrice.value) : null, isNewArrival: f.isNew.checked, images: imgData });
            await setStorage(KEY_PRODUCTS, p); f.reset(); render(); showPopup('Success', 'Added!', 'success');
        });
    }
    window.delP = async (i) => { if(confirm('Delete?')) { const p = await getStorage(KEY_PRODUCTS); p.splice(i, 1); await setStorage(KEY_PRODUCTS, p); render(); } };
}

function initAdminOrders() {
    const tb=document.querySelector('#orders-table tbody'); let flt='All';
    const ren=async()=>{ 
        const all=await getStorage(KEY_ORDERS); const l=flt==='All' ? all : all.filter(o => o.status === flt);
        document.querySelectorAll('.filter-btn').forEach(b => { if(b.innerText.includes(flt)||(flt==='All'&&b.innerText==='All')) b.classList.add('active'); else b.classList.remove('active'); });
        if(l.length===0) { tb.innerHTML='<tr><td colspan="5" style="text-align:center;">No Orders</td></tr>'; return; }
        tb.innerHTML = l.map(o => { const ix=all.findIndex(x => x.id === o.id); let c='#ff9f43'; if(o.status==='Shipped')c='#3498db'; if(o.status==='Delivered')c='#2ecc71'; if(o.status==='Cancelled')c='#e74c3c'; return `<tr><td>${o.id}</td><td>${o.customer.name}</td><td>৳${o.total}</td><td><select onchange="upS(${ix},this.value)" style="color:${c};background:#222;border:1px solid ${c}"><option ${o.status==='Pending'?'selected':''}>Pending</option><option ${o.status==='Shipped'?'selected':''}>Shipped</option><option ${o.status==='Delivered'?'selected':''}>Delivered</option><option ${o.status==='Cancelled'?'selected':''}>Cancelled</option></select></td><td><button onclick="vOrd('${o.id}')" style="color:#fff;background:none;border:none;">View</button></td></tr>`; }).join('');
    };
    ren();
    window.filterOrders=(s)=>{flt=s; ren();}; window.upS=async(i,v)=>{ const o=await getStorage(KEY_ORDERS); o[i].status=v; await setStorage(KEY_ORDERS,o); ren(); };
    window.vOrd=async(id)=>{ const o=(await getStorage(KEY_ORDERS)).find(x=>x.id===id); if(!o)return; const items=o.items.map(i=>`- ${i.name} x${i.qty} (৳${i.price})`).join('\n'); showPopup('Details', `ID: ${o.id}\nName: ${o.customer.name}\nPhone: ${o.customer.phone}\nAddr: ${o.customer.address}\n\n${items}\n\nTotal: ৳${o.total}`, 'info'); };
}

async function initAdminDashboard() { const o = await getStorage(KEY_ORDERS); const p = await getStorage(KEY_PRODUCTS); const rev = o.filter(x => x.status === 'Delivered').reduce((s, i) => s + parseFloat(i.total), 0); const setT = (id, v) => { if(document.getElementById(id)) document.getElementById(id).innerText = v; }; setT('stat-revenue', '৳ ' + rev); setT('stat-pending', o.filter(x=>x.status==='Pending').length); setT('stat-shipped', o.filter(x=>x.status==='Shipped').length); setT('stat-delivered', o.filter(x=>x.status==='Delivered').length); setT('stat-cancelled', o.filter(x=>x.status==='Cancelled').length); setT('stat-products', p.length); }
function initAdminMessages() { const tb=document.querySelector('#messages-table tbody'); let vm='New'; const ren=async()=>{ const all=await getStorage(KEY_MESSAGES); const l=vm==='New'?all.filter(x=>!x.isRead):all.filter(x=>x.isRead); document.querySelectorAll('.filter-btn').forEach(b => { if(b.innerText.includes(vm)) b.classList.add('active'); else b.classList.remove('active'); }); if(l.length===0) { tb.innerHTML='<tr><td colspan="5" style="text-align:center;">No Messages</td></tr>'; return; } tb.innerHTML = l.map(m => { const ix=all.findIndex(x=>x.id===m.id); return `<tr><td>${m.date}</td><td>${m.name}</td><td>${m.subject}</td><td>${m.text}</td><td>${!m.isRead?`<button onclick="mkR(${ix})" style="color:green;background:none;border:none;">Read</button>`:''}<button onclick="delMsg(${idx})" style="color:red;background:none;border:none;">Del</button></td></tr>`; }).join(''); }; ren(); window.filterMsgs=(m)=>{vm=m;ren();}; window.mkR=async(i)=>{ const m=await getStorage(KEY_MESSAGES); m[i].isRead=true; await setStorage(KEY_MESSAGES, m); ren(); }; window.delMsg=async(i)=>{ if(confirm('Delete?')){ const m=await getStorage(KEY_MESSAGES); m.splice(i,1); await setStorage(KEY_MESSAGES, m); ren(); }}; }

function createPopupHTML() { if(!document.querySelector('.custom-popup-overlay')) { const p=document.createElement('div'); p.className='custom-popup-overlay'; p.innerHTML=`<div class="custom-popup-box"><i class="fas fa-info-circle popup-icon"></i><h3 class="popup-title"></h3><p class="popup-msg"></p><button class="btn primary-btn popup-btn">OK</button></div>`; document.body.appendChild(p); p.querySelector('.popup-btn').addEventListener('click', () => { p.classList.remove('active'); if(window.popupRedirect) { window.location.href=window.popupRedirect; window.popupRedirect=null; } }); } }
function showPopup(title, msg, type='info', url=null) { const o=document.querySelector('.custom-popup-overlay'); const i=o.querySelector('.popup-icon'); o.querySelector('.popup-title').innerText=title; o.querySelector('.popup-msg').innerHTML=msg.replace(/\n/g, '<br>'); if(type==='success') i.className='fas fa-check-circle popup-icon popup-success'; else if(type==='error') i.className='fas fa-times-circle popup-icon popup-error'; else i.className='fas fa-info-circle popup-icon popup-info'; if(url) window.popupRedirect=url; o.classList.add('active'); }
async function updateAdminSidebarBadges() { const o = await getStorage(KEY_ORDERS); const m = await getStorage(KEY_MESSAGES); if(o.some(x=>x.status==='Pending') && document.getElementById('nav-orders')) document.getElementById('nav-orders').innerHTML += ' <span class="nav-badge"></span>'; if(m.some(x=>!x.isRead) && document.getElementById('nav-messages')) document.getElementById('nav-messages').innerHTML += ' <span class="nav-badge"></span>'; }
async function updateCartCount() { const c = await getStorage(KEY_CART); const t = c.reduce((s, i) => s + (parseInt(i.qty)||0), 0); document.querySelectorAll('.cart-count').forEach(e => e.innerText = `(${t})`); }
