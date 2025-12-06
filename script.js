// ======================================================
// LYNEX MAIN SCRIPT (Login Fixed)
// ======================================================

// --- KEYS ---
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

// --- DATABASE & INIT ---
// (IndexedDB কোড আগের মতই থাকবে, আমি মূল ফিক্সগুলো দেখাচ্ছি)
const DB_NAME = "LynexDB_Final";
const DB_VERSION = 1;
let db;

// [FIXED] Login Handler Function (Global Scope)
window.handleLogin = function(event) {
    event.preventDefault(); // এটি পেজ রিফ্রেশ বন্ধ করবে
    
    const uInput = document.getElementById('username').value;
    const pInput = document.getElementById('password').value;

    console.log("Attempting login..."); // ডিবাগিং এর জন্য

    if (uInput === _u && pInput === _p) {
        // টোকেন জেনারেট ও সেভ
        const token = Math.random().toString(36).substr(2);
        sessionStorage.setItem(KEY_ADMIN_TOKEN, token);
        
        alert('Access Granted!');
        // ড্যাশবোর্ডে রিডাইরেক্ট
        window.location.href = PAGE_DASHBOARD;
    } else {
        alert('Access Denied! Wrong Username or Password.');
        document.getElementById('secure-login-form').reset();
    }
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async function() {
    await initDB(); // DB কানেক্ট
    
    // Nav Toggle
    const menuToggle = document.getElementById('menu-toggle');
    const navList = document.getElementById('nav-list');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => navList.classList.toggle('active'));
    }
    
    await updateCartCount();

    const path = window.location.pathname;
    const page = path.split("/").pop(); 

    // --- ALREADY LOGGED IN CHECK ---
    // যদি কেউ লগইন পেজে থাকে এবং তার টোকেন থাকে, তবে তাকে ড্যাশবোর্ডে পাঠাবে
    if (page === PAGE_LOGIN) {
        if (sessionStorage.getItem(KEY_ADMIN_TOKEN)) {
            window.location.href = PAGE_DASHBOARD;
        }
    }

    // --- WEBSITE PAGES ---
    if (page === 'index.html' || page === '') await loadProductsDisplay(true);
    else if (page === 'products.html') await loadProductsDisplay(false);
    else if (page === 'cart.html') await loadCartDisplay();
    else if (page === 'checkout.html') { handleCheckoutForm(); await loadCartSummaryForCheckout(); }
    else if (page === 'contact.html') handleContactForm();
    
    // --- ADMIN PAGES SECURITY ---
    else if ([PAGE_DASHBOARD, PAGE_PRODUCTS, PAGE_ORDERS, PAGE_MESSAGES].includes(page)) {
        checkAdminAuth();
        updateAdminSidebarBadges();
        
        if (page === PAGE_DASHBOARD) await initAdminDashboard();
        if (page === PAGE_PRODUCTS) await initAdminProducts();
        if (page === PAGE_ORDERS) await initAdminOrders();
        if (page === PAGE_MESSAGES) await initAdminMessages();
    }
});

// --- HELPER FUNCTIONS (Database & Others) ---
function initDB() {
    return new Promise((resolve) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
            db = e.target.result;
            if(!db.objectStoreNames.contains('store')) db.createObjectStore('store');
        };
        req.onsuccess = (e) => { db = e.target.result; resolve(db); };
        req.onerror = (e) => { console.error(e); resolve(null); };
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
        req.onerror = (e) => { alert("Error: " + e.target.error); resolve(false); };
    });
}

async function updateCartCount() {
    const cart = await getStorage(KEY_CART);
    const t = cart.reduce((s, i) => s + (parseInt(i.qty)||0), 0);
    document.querySelectorAll('.cart-count').forEach(e => e.innerText = `(${t})`);
}

async function updateAdminSidebarBadges() {
    const o = await getStorage(KEY_ORDERS); const m = await getStorage(KEY_MESSAGES);
    if(o.some(x=>x.status==='Pending') && document.getElementById('nav-orders') && !location.pathname.includes(PAGE_ORDERS)) 
        document.getElementById('nav-orders').innerHTML += ' <span class="nav-badge"></span>';
    if(m.some(x=>!x.isRead) && document.getElementById('nav-messages') && !location.pathname.includes(PAGE_MESSAGES)) 
        document.getElementById('nav-messages').innerHTML += ' <span class="nav-badge"></span>';
}

function checkAdminAuth() {
    if (!sessionStorage.getItem(KEY_ADMIN_TOKEN)) window.location.replace(PAGE_LOGIN);
}

function adminLogout() {
    sessionStorage.removeItem(KEY_ADMIN_TOKEN);
    window.location.href = PAGE_LOGIN;
}

// --- [বাকি ফাংশনগুলো আগের মতোই থাকবে (loadProductsDisplay, addToCart ইত্যাদি)] ---
// (নিচে আমি বাকি অংশ সংক্ষিপ্ত আকারে দিচ্ছি, আপনি আগের কোড থেকে রাখতে পারেন বা এখান থেকে নিতে পারেন)

// WEBSITE FUNCTIONS
async function loadProductsDisplay(isHome) {
    let grid = document.querySelector('.product-grid'); if (!grid) return;
    let p = await getStorage(KEY_PRODUCTS);
    if (isHome) p = p.filter(x => x.isNewArrival);
    grid.innerHTML = p.length ? p.map(i => {
        let badge = i.originalPrice > i.price ? `<span class="discount-badge">-${Math.round(((i.originalPrice-i.price)/i.originalPrice)*100)}%</span>` : '';
        let img = i.image ? `<img src="${i.image}" alt="${i.name}">` : `<div style="height:100%;display:flex;align-items:center;justify-content:center;color:#555;"><i class="fas fa-tshirt" style="font-size:3em;"></i></div>`;
        let priceHTML = `<span class="current-price">৳ ${i.price}</span>`;
        if (i.originalPrice && parseFloat(i.originalPrice) > parseFloat(i.price)) {
             priceHTML = `<span class="old-price">৳ ${i.originalPrice}</span> <span class="current-price">৳ ${i.price}</span>`;
        }
        return `<div class="product-card">${badge}<div class="product-image">${img}</div><div class="product-info"><h3>${i.name}</h3><div class="price-container">${priceHTML}</div><div class="product-actions"><button onclick="addToCart('${i.id}')" class="btn secondary-btn">Add to Cart</button><button onclick="buyNow('${i.id}')" class="btn primary-btn">Buy Now</button></div></div></div>`;
    }).join('') : '<p style="text-align:center;width:100%;color:#777;">No products.</p>';
}

window.addToCart = async (id) => { const p=(await getStorage(KEY_PRODUCTS)).find(x=>x.id==id); if(p) { let c=await getStorage(KEY_CART); let ex=c.find(x=>x.id==id); if(ex) ex.qty++; else c.push({...p, qty:1}); await setStorage(KEY_CART, c); await updateCartCount(); alert('Added!'); } };
window.buyNow = async (id) => { await window.addToCart(id); setTimeout(()=>window.location.href='checkout.html', 500); };

async function loadCartDisplay() {
    const c = document.querySelector('.cart-items'); const t = document.getElementById('cart-total'); if(!c) return;
    const cart = await getStorage(KEY_CART);
    if(cart.length===0) { c.innerHTML='<p style="text-align:center;color:#aaa;">Empty</p>'; if(t) t.innerText='0'; if(document.querySelector('.checkout-btn')) document.querySelector('.checkout-btn').style.display='none'; return; }
    c.innerHTML = cart.map((x,i)=>`<div class="cart-item"><div class="cart-item-info"><img src="${x.image||''}" style="width:60px;height:60px;object-fit:cover;border-radius:4px;background:#333;"><div><h4>${x.name}</h4><p>৳${x.price} x ${x.qty}</p><div class="qty-controls"><button class="qty-btn" onclick="upQty(${i},-1)">-</button><span>${x.qty}</span><button class="qty-btn" onclick="upQty(${i},1)">+</button></div></div></div><div style="text-align:right;"><p style="font-weight:bold;color:#ff9f43;">৳${x.price*x.qty}</p><button onclick="rmC(${i})" style="color:#e74c3c;background:none;border:none;cursor:pointer;margin-top:5px;">Remove</button></div></div>`).join('');
    if(t) t.innerText = cart.reduce((s, i) => s + (i.price * i.qty), 0);
}
window.upQty = async (i, v) => { let c = await getStorage(KEY_CART); c[i].qty+=v; if(c[i].qty<1) { if(confirm("Remove?")) c.splice(i,1); else c[i].qty=1; } await setStorage(KEY_CART, c); await loadCartDisplay(); await updateCartCount(); };
window.rmC = async (i) => { let c = await getStorage(KEY_CART); c.splice(i,1); await setStorage(KEY_CART, c); await loadCartDisplay(); await updateCartCount(); };

function handleCheckoutForm() {
    const f = document.getElementById('checkout-form');
    if(f) {
        f.onsubmit = async (e) => {
            e.preventDefault();
            const c = await getStorage(KEY_CART);
            if(c.length===0) return alert('Cart Empty');
            let cnt = parseInt(await getStorage(KEY_ORDER_COUNT))||0; cnt++; await setStorage(KEY_ORDER_COUNT, cnt);
            const ordId = 'ORD-'+String(cnt).padStart(3,'0');
            const total = c.reduce((s,i)=>s+(i.price*i.qty),0);
            const ord = { id: ordId, date: new Date().toLocaleDateString(), customer: { name: e.target.name.value, phone: e.target.phone.value, address: e.target.address.value }, items: c, total: total, status: 'Pending' };
            const orders = await getStorage(KEY_ORDERS); orders.unshift(ord); 
            await setStorage(KEY_ORDERS, orders); await setStorage(KEY_CART, []); await updateCartCount();
            const itemsList = c.map(i => `- ${i.name} (x${i.qty})`).join('\n');
            alert(`Order Confirmed!\nID: ${ordId}\nTotal: ৳${total}`); window.location.href = 'index.html';
        };
    }
}
async function loadCartSummaryForCheckout() { const el=document.getElementById('checkout-total'); if(el) { const c = await getStorage(KEY_CART); el.innerText=c.reduce((s,i)=>s+(i.price*i.qty),0); }}
function handleContactForm() { const f=document.getElementById('contact-form'); if(f) f.onsubmit = async (e) => { e.preventDefault(); const m={id:Date.now(), date:new Date().toLocaleDateString(), name:e.target.name.value, email:e.target.email.value, subject:e.target.subject.value, text:e.target.message.value, isRead:false}; const ms = await getStorage(KEY_MESSAGES); ms.unshift(m); await setStorage(KEY_MESSAGES, ms); e.target.reset(); alert('Sent!'); }; }

// ADMIN
async function initAdminDashboard() { const o = await getStorage(KEY_ORDERS); const p = await getStorage(KEY_PRODUCTS); const rev = o.filter(x => x.status === 'Delivered').reduce((s, i) => s + parseFloat(i.total), 0); const setT = (id, v) => { if(document.getElementById(id)) document.getElementById(id).innerText = v; }; setT('stat-revenue', '৳ ' + rev); setT('stat-pending', o.filter(x => x.status === 'Pending').length); setT('stat-shipped', o.filter(x => x.status === 'Shipped').length); setT('stat-delivered', o.filter(x => x.status === 'Delivered').length); setT('stat-cancelled', o.filter(x => x.status === 'Cancelled').length); setT('stat-products', p.length); }
function initAdminProducts() { const f=document.getElementById('add-product-form'); const tb=document.querySelector('#product-table tbody'); const ren=async()=>{ const p=await getStorage(KEY_PRODUCTS); tb.innerHTML=p.length ? p.map((x,i)=>`<tr><td><img src="${x.image||''}" style="width:40px;height:40px;object-fit:cover;border-radius:4px;"></td><td>${x.name}</td><td>৳${x.price}</td><td><button onclick="delP(${i})" style="color:red;border:none;background:none;cursor:pointer;">Del</button></td></tr>`).join('') : '<tr><td colspan="4" style="text-align:center;">Empty</td></tr>'; document.getElementById('current-product-count').innerText=p.length; }; ren(); if(f) { f.addEventListener('submit', (e) => { e.preventDefault(); const file = e.target.image.files[0]; const reader = new FileReader(); const save = async (img) => { const p=await getStorage(KEY_PRODUCTS); p.push({id:Date.now(), name:e.target.name.value, price:parseFloat(e.target.price.value), originalPrice:e.target.oldPrice.value, isNewArrival:e.target.isNew.checked, image:img}); await setStorage(KEY_PRODUCTS, p); e.target.reset(); ren(); alert('Added!'); }; if(file) { reader.onload=(ev)=>save(ev.target.result); reader.readAsDataURL(file); } else save(null); }); } window.delP = async (i) => { if(confirm('Delete?')) { const p = await getStorage(KEY_PRODUCTS); p.splice(i, 1); await setStorage(KEY_PRODUCTS, p); ren(); } }; }
function initAdminOrders() { const tb=document.querySelector('#orders-table tbody'); let flt='All'; const ren=async()=>{ const all=await getStorage(KEY_ORDERS); const l=flt==='All' ? all : all.filter(x=>x.status===flt); document.querySelectorAll('.filter-btn').forEach(b => { if(b.innerText.includes(flt)||(flt==='All'&&b.innerText==='All')||(flt==='Delivered'&&b.innerText==='Completed')) b.classList.add('active'); else b.classList.remove('active'); }); if(l.length===0) { tb.innerHTML='<tr><td colspan="5" style="text-align:center;">No Orders</td></tr>'; return; } tb.innerHTML = l.map(o => { const ix=all.findIndex(x=>x.id===o.id); let c='#ff9f43'; if(o.status==='Shipped')c='#3498db'; if(o.status==='Delivered')c='#2ecc71'; if(o.status==='Cancelled')c='#e74c3c'; return `<tr><td>${o.id}</td><td>${o.customer.name}</td><td>৳${o.total}</td><td><select onchange="upS(${ix},this.value)" style="color:${c};background:#222;border:1px solid ${c}"><option ${o.status==='Pending'?'selected':''}>Pending</option><option ${o.status==='Shipped'?'selected':''}>Shipped</option><option ${o.status==='Delivered'?'selected':''}>Delivered</option><option ${o.status==='Cancelled'?'selected':''}>Cancelled</option></select></td><td><button onclick="vOrd('${o.id}')" style="color:#fff;background:none;border:none;cursor:pointer;">View</button></td></tr>`; }).join(''); }; ren(); window.filterOrders=(s)=>{flt=s; ren();}; window.upS=async(i,v)=>{ const o=await getStorage(KEY_ORDERS); o[i].status=v; await setStorage(KEY_ORDERS,o); ren(); }; window.vOrd=async(id)=>{ const o=(await getStorage(KEY_ORDERS)).find(x=>x.id===id); if(!o)return; const items=o.items.map(i=>`- ${i.name} x${i.qty} (৳${i.price})`).join('\n'); alert(`ID: ${o.id}\nName: ${o.customer.name}\nPhone: ${o.customer.phone}\nAddress: ${o.customer.address}\n\n${items}\n\nTotal: ৳${o.total}`); }; }
function initAdminMessages() { const tb=document.querySelector('#messages-table tbody'); let vm='New'; const ren=async()=>{ const all=await getStorage(KEY_MESSAGES); const l=vm==='New'?all.filter(x=>!x.isRead):all.filter(x=>x.isRead); document.querySelectorAll('.filter-btn').forEach(b => { if(b.innerText.includes(vm)) b.classList.add('active'); else b.classList.remove('active'); }); if(l.length===0) { tb.innerHTML='<tr><td colspan="5" style="text-align:center;">No Messages</td></tr>'; } else { tb.innerHTML = l.map(m => { const ix=all.findIndex(x=>x.id===m.id); return `<tr><td>${m.date}</td><td>${m.name}<br><small style="color:#aaa;">${m.email}</small></td><td>${m.subject}</td><td>${m.text}</td><td>${!m.isRead?`<button onclick="mkR(${ix})" style="color:green;background:none;border:none;cursor:pointer;margin-right:5px;">Mark Read</button>`:''}<button onclick="delMsg(${idx})" style="color:red;background:none;border:none;cursor:pointer;">Del</button></td></tr>`; }).join(''); } }; ren(); window.filterMsgs=(m)=>{vm=m;ren();}; window.mkR=async(i)=>{const m=await getStorage(KEY_MESSAGES); m[i].isRead=true; await setStorage(KEY_MESSAGES, m); ren();}; window.delMsg=async(i)=>{if(confirm('Delete?')){const m=await getStorage(KEY_MESSAGES); m.splice(i,1); await setStorage(KEY_MESSAGES, m); ren();}}; }
