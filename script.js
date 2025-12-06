// ======================================================
// LYNEX ULTIMATE SCRIPT (Auto-Detect Logic)
// ======================================================

// --- CONFIGURATION ---
const DB_NAME = "LynexDB_Ultimate_V3"; // New Version to reset potential errors
const DB_VERSION = 1;

const KEY_PRODUCTS = 'lynex_products';
const KEY_CART = 'lynex_cart';
const KEY_ORDERS = 'lynex_orders';
const KEY_MESSAGES = 'lynex_messages';
const KEY_ADMIN_TOKEN = 'lynex_secure_token_v99';
const KEY_ORDER_COUNT = 'lynex_order_counter';

// --- LOGIN CREDENTIALS ---
const ADMIN_USER = "SysMaster_99";
const ADMIN_PASS = "L7n@x#Super!2025";

let db;

// --- 1. DATABASE SYSTEM (IndexedDB) ---
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
            console.log("Database Connected");
            resolve(db);
        };
        
        request.onerror = (e) => {
            console.error("DB Error:", e.target.error);
            alert("Database Error! Please allow storage permission.");
            resolve(null);
        };
    });
}

async function getStorage(key) {
    return new Promise((resolve) => {
        if (!db) { resolve([]); return; }
        const tx = db.transaction(['store'], 'readonly');
        const store = tx.objectStore('store');
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
    });
}

async function setStorage(key, data) {
    return new Promise((resolve) => {
        if (!db) { resolve(false); return; }
        const tx = db.transaction(['store'], 'readwrite');
        const store = tx.objectStore('store');
        const req = store.put(data, key);
        req.onsuccess = () => resolve(true);
        req.onerror = (e) => {
            alert("Save Failed: " + e.target.error);
            resolve(false);
        };
    });
}

// --- 2. INITIALIZATION MANAGER ---
document.addEventListener('DOMContentLoaded', async function() {
    await initDB(); // Connect DB First
    createPopupHTML(); // Init UI Components

    // --- GLOBAL NAV ---
    const menuToggle = document.getElementById('menu-toggle');
    const navList = document.getElementById('nav-list');
    if (menuToggle && navList) {
        menuToggle.addEventListener('click', () => navList.classList.toggle('active'));
    }
    updateCartCount();

    // --- FEATURE DETECTION (Page Agnostic Logic) ---
    
    // 1. Login Page Logic
    if (document.getElementById('secure-login-form')) {
        initLogin();
    }

    // 2. Admin Features (Check if Sidebar exists)
    if (document.querySelector('.sidebar')) {
        checkAdminAuth(); // Security
        updateAdminSidebarBadges(); // Notifications
        
        if (document.getElementById('stat-revenue')) initAdminDashboard(); // Dashboard
        if (document.getElementById('add-product-form')) initAdminProducts(); // Product Add
        if (document.getElementById('orders-table')) initAdminOrders(); // Orders
        if (document.getElementById('messages-table')) initAdminMessages(); // Messages
    }

    // 3. Website Features
    if (document.querySelector('.product-grid')) {
        // Check if we are on home page to filter New Arrivals
        // Simple check: if url has 'index' or is empty root
        const isHome = window.location.pathname.includes('index') || window.location.pathname.endsWith('/'); 
        loadProductsDisplay(isHome);
    }

    if (document.getElementById('checkout-form')) {
        handleCheckoutForm();
        loadCartSummaryForCheckout();
    }

    if (document.querySelector('.cart-items') && !document.getElementById('checkout-form')) {
        loadCartDisplay(); // Cart Page
    }

    if (document.getElementById('contact-form')) {
        handleContactForm();
    }
});

// --- 3. AUTHENTICATION ---
function initLogin() {
    if (sessionStorage.getItem(KEY_ADMIN_TOKEN)) {
        // Redirect to dashboard if already logged in
        // Try finding dashboard file based on typical naming, or alert
        window.location.href = 'x_master_v9.html'; 
        return;
    }

    const form = document.getElementById('secure-login-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const u = form.username.value.trim();
        const p = form.password.value.trim();

        if (u === ADMIN_USER && p === ADMIN_PASS) {
            const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
            sessionStorage.setItem(KEY_ADMIN_TOKEN, token);
            window.location.href = 'x_master_v9.html'; // Redirect to Dashboard
        } else {
            showPopup('Error', 'Access Denied! Wrong Credentials.', 'error');
            form.reset();
        }
    });
}

function checkAdminAuth() {
    if (!sessionStorage.getItem(KEY_ADMIN_TOKEN)) {
        window.location.replace('k7_entry_point.html'); // Redirect to Login
    }
}

window.adminLogout = function() {
    sessionStorage.removeItem(KEY_ADMIN_TOKEN);
    window.location.href = 'k7_entry_point.html';
};

// --- 4. WEBSITE FUNCTIONS ---

// Product Display
async function loadProductsDisplay(isHome) {
    const grid = document.querySelector('.product-grid');
    let products = await getStorage(KEY_PRODUCTS);
    
    if (isHome) products = products.filter(p => p.isNewArrival);

    if (products.length === 0) {
        grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:50px; color:#aaa;">No Products Available</div>`;
        return;
    }

    grid.innerHTML = products.map(p => {
        // Price Logic
        let priceHTML = `<span class="current-price">৳ ${p.price}</span>`;
        let badgeHTML = '';
        if (p.originalPrice && parseFloat(p.originalPrice) > parseFloat(p.price)) {
            const d = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
            priceHTML = `<span class="old-price">৳ ${p.originalPrice}</span> <span class="current-price">৳ ${p.price}</span>`;
            badgeHTML = `<span class="discount-badge">-${d}% OFF</span>`;
        }
        
        // Image
        let images = Array.isArray(p.images) && p.images.length ? p.images : (p.image ? [p.image] : []);
        if(images.length === 0) images = [''];
        
        // Slider Generation
        let slides = images.map((img, i) => `<img src="${img}" class="slider-image ${i===0?'active':''}" alt="${p.name}">`).join('');
        let dots = images.length > 1 ? `<div class="slider-dots">${images.map((_,i)=>`<span class="dot ${i===0?'active':''}" onclick="goToSlide(${i}, '${p.id}')"></span>`).join('')}</div>` : '';
        let arrows = images.length > 1 ? `<a class="prev" onclick="changeSlide(-1,'${p.id}')">&#10094;</a><a class="next" onclick="changeSlide(1,'${p.id}')">&#10095;</a>` : '';
        window.slideIndex = window.slideIndex || {}; window.slideIndex[p.id] = 0;

        return `
        <div class="product-card">
            ${badgeHTML}
            <div class="slider-container" id="slider-${p.id}">
                ${slides}${arrows}${dots}
            </div>
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

// Slider Logic
window.changeSlide = (n, id) => showSlides(window.slideIndex[id] += n, id);
window.goToSlide = (n, id) => showSlides(window.slideIndex[id] = n, id);
function showSlides(n, id) {
    let slides = document.querySelectorAll(`#slider-${id} .slider-image`);
    let dots = document.querySelectorAll(`#slider-${id} .dot`);
    if(n >= slides.length) window.slideIndex[id] = 0;
    if(n < 0) window.slideIndex[id] = slides.length - 1;
    slides.forEach(s => s.classList.remove('active'));
    dots.forEach(d => d.classList.remove('active'));
    slides[window.slideIndex[id]].classList.add('active');
    if(dots.length) dots[window.slideIndex[id]].classList.add('active');
}

// Cart & Checkout
window.addToCart = async (id) => {
    const p = (await getStorage(KEY_PRODUCTS)).find(x => x.id == id);
    if (p) {
        let c = await getStorage(KEY_CART);
        let ex = c.find(x => x.id == id);
        if(ex) ex.qty++; else c.push({...p, qty: 1});
        if(await setStorage(KEY_CART, c)) { updateCartCount(); showPopup('Success', 'Added to Cart!', 'success'); }
    }
};
window.buyNow = async (id) => { await window.addToCart(id); setTimeout(()=>window.location.href='checkout.html', 500); };

async function loadCartDisplay() {
    const c = document.querySelector('.cart-items');
    const t = document.getElementById('cart-total');
    if(!c) return;
    
    const cart = await getStorage(KEY_CART);
    if(cart.length===0) { 
        c.innerHTML='<p style="text-align:center; color:#aaa;">Cart Empty</p>'; 
        if(t) t.innerText='0'; 
        if(document.querySelector('.checkout-btn')) document.querySelector('.checkout-btn').style.display='none';
        return; 
    }
    
    c.innerHTML = cart.map((x,i) => {
        let img = Array.isArray(x.images) && x.images.length ? x.images[0] : (x.image||'');
        return `<div class="cart-item"><div class="cart-item-info"><img src="${img}" style="width:60px;height:60px;object-fit:cover;border-radius:4px;"><div><h4>${x.name}</h4><p>৳${x.price} x ${x.qty}</p><div class="qty-controls"><button class="qty-btn" onclick="upQty(${i},-1)">-</button><span>${x.qty}</span><button class="qty-btn" onclick="upQty(${i},1)">+</button></div></div></div><div style="text-align:right;"><p style="font-weight:bold;color:#ff9f43;">৳${x.price*x.qty}</p><button onclick="rmC(${i})" style="color:#e74c3c;background:none;border:none;cursor:pointer;">Remove</button></div></div>`;
    }).join('');
    if(t) t.innerText = cart.reduce((s,i)=>s+(i.price*i.qty),0);
}

window.upQty = async (i, v) => { let c = await getStorage(KEY_CART); c[i].qty+=v; if(c[i].qty<1) { if(confirm("Remove?")) c.splice(i,1); else c[i].qty=1; } await setStorage(KEY_CART, c); loadCartDisplay(); updateCartCount(); };
window.rmC = async (i) => { let c = await getStorage(KEY_CART); c.splice(i,1); await setStorage(KEY_CART, c); loadCartDisplay(); updateCartCount(); };

function handleCheckoutForm() {
    const form = document.getElementById('checkout-form');
    if(form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const cart = await getStorage(KEY_CART);
            if(cart.length === 0) return showPopup('Error', 'Cart Empty', 'error');

            let count = parseInt(await getStorage(KEY_ORDER_COUNT)) || 0; count++;
            await setStorage(KEY_ORDER_COUNT, count);
            const ordId = 'ORD-' + String(count).padStart(3, '0');
            const total = cart.reduce((s,i)=>s+(i.price*i.qty),0);

            const order = {
                id: ordId, date: new Date().toLocaleDateString(),
                customer: { name: form.name.value, phone: form.phone.value, address: form.address.value },
                items: cart, total: total, status: 'Pending'
            };

            const orders = await getStorage(KEY_ORDERS); orders.unshift(order);
            if(await setStorage(KEY_ORDERS, orders)) {
                await setStorage(KEY_CART, []);
                updateCartCount();
                const list = cart.map(i => `- ${i.name} (x${i.qty})`).join('\n');
                showPopup('Confirmed!', `ID: ${ordId}\nTotal: ৳${total}\n\n${list}\n\n* We will call you shortly.`, 'success', 'index.html');
            }
        };
    }
}

async function loadCartSummaryForCheckout() {
    const el = document.getElementById('checkout-total');
    if(el) { const c = await getStorage(KEY_CART); el.innerText = c.reduce((s,i)=>s+(i.price*i.qty),0); }
}

function handleContactForm() {
    const form = document.getElementById('contact-form');
    if(form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const msg = { id: Date.now(), date: new Date().toLocaleDateString(), name: form.name.value, email: form.email.value, subject: form.subject.value, text: form.message.value, isRead: false };
            const msgs = await getStorage(KEY_MESSAGES); msgs.unshift(msg);
            await setStorage(KEY_MESSAGES, msgs); form.reset();
            showPopup('Success', 'Feedback Sent!', 'success');
        };
    }
}

// --- 5. ADMIN FUNCTIONS ---

// Dashboard
async function initAdminDashboard() {
    const o = await getStorage(KEY_ORDERS); const p = await getStorage(KEY_PRODUCTS);
    const setVal = (id, v) => { const el = document.getElementById(id); if(el) el.innerText = v; };
    
    setVal('stat-revenue', '৳ ' + o.filter(x=>x.status==='Delivered').reduce((s,i)=>s+parseFloat(i.total),0));
    setVal('stat-pending', o.filter(x=>x.status==='Pending').length);
    setVal('stat-shipped', o.filter(x=>x.status==='Shipped').length);
    setVal('stat-delivered', o.filter(x=>x.status==='Delivered').length);
    setVal('stat-cancelled', o.filter(x=>x.status==='Cancelled').length);
    setVal('stat-products', p.length);
}

// Product Add (Multiple Images)
function initAdminProducts() {
    const form = document.getElementById('add-product-form');
    const tbody = document.querySelector('#product-table tbody');
    const input = document.getElementById('imageInput');

    const render = async () => {
        const p = await getStorage(KEY_PRODUCTS);
        if(p.length===0) { tbody.innerHTML='<tr><td colspan="4" style="text-align:center;">Empty</td></tr>'; document.getElementById('current-product-count').innerText=0; return; }
        tbody.innerHTML = p.map((x,i)=> {
            let thumb = Array.isArray(x.images) && x.images.length ? x.images[0] : (x.image||'');
            return `<tr><td><img src="${thumb}" style="width:40px;height:40px;object-fit:cover;border-radius:4px;"></td><td>${x.name}</td><td>৳${x.price}</td><td><button onclick="delP(${i})" style="color:red;border:none;background:none;cursor:pointer;">Del</button></td></tr>`;
        }).join('');
        document.getElementById('current-product-count').innerText = p.length;
    };
    render();

    if(form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const files = Array.from(input.files);
            const readFiles = (fileList) => Promise.all(fileList.map(f => new Promise(r => { const fr = new FileReader(); fr.onload=()=>r(fr.result); fr.readAsDataURL(f); })));
            
            let imgData = [];
            if(files.length > 0) imgData = await readFiles(files);

            const p = await getStorage(KEY_PRODUCTS);
            p.push({
                id: Date.now(), name: form.name.value, price: parseFloat(form.price.value),
                originalPrice: form.oldPrice.value ? parseFloat(form.oldPrice.value) : null,
                isNewArrival: form.isNew.checked, images: imgData
            });

            await setStorage(KEY_PRODUCTS, p); form.reset(); render(); showPopup('Success', 'Added!', 'success');
        });
    }
    window.delP = async (i) => { if(confirm('Delete?')) { const p = await getStorage(KEY_PRODUCTS); p.splice(i, 1); await setStorage(KEY_PRODUCTS, p); render(); } };
}

// Orders
function initAdminOrders() {
    const tbody = document.querySelector('#orders-table tbody');
    let filter = 'All';

    const render = async () => {
        const all = await getStorage(KEY_ORDERS);
        const list = filter==='All' ? all : all.filter(o => o.status === filter);
        
        document.querySelectorAll('.filter-btn').forEach(b => {
            if(b.innerText.includes(filter) || (filter==='All'&&b.innerText==='All') || (filter==='Delivered'&&b.innerText==='Completed')) b.classList.add('active'); else b.classList.remove('active');
        });

        if(list.length===0) { tbody.innerHTML='<tr><td colspan="5" style="text-align:center;">No Orders</td></tr>'; return; }
        tbody.innerHTML = list.map(o => {
            const idx = all.findIndex(x => x.id === o.id);
            let c='#ff9f43'; if(o.status==='Shipped')c='#3498db'; if(o.status==='Delivered')c='#2ecc71'; if(o.status==='Cancelled')c='#e74c3c';
            return `<tr><td>${o.id}</td><td>${o.customer.name}</td><td>৳${o.total}</td><td><select onchange="upS(${idx},this.value)" style="color:${c};background:#222;border:1px solid ${c}"><option ${o.status==='Pending'?'selected':''}>Pending</option><option ${o.status==='Shipped'?'selected':''}>Shipped</option><option ${o.status==='Delivered'?'selected':''}>Delivered</option><option ${o.status==='Cancelled'?'selected':''}>Cancelled</option></select></td><td><button onclick="vOrd('${o.id}')" style="color:#fff;background:none;border:none;cursor:pointer;">View</button></td></tr>`;
        }).join('');
    };
    render();
    window.filterOrders = (s) => { filter = s; render(); };
    window.upS = async (i, v) => { const o = await getStorage(KEY_ORDERS); o[i].status = v; await setStorage(KEY_ORDERS, o); render(); };
    window.vOrd = async (id) => { const o=(await getStorage(KEY_ORDERS)).find(x=>x.id===id); if(o){ const its=o.items.map(i=>`- ${i.name} x${i.qty}`).join('\n'); showPopup('Details', `ID: ${o.id}\nName: ${o.customer.name}\nPhone: ${o.customer.phone}\nAddress: ${o.customer.address}\n\n${its}\n\nTotal: ৳${o.total}`, 'info'); }};
}

// Messages
function initAdminMessages() {
    const tbody = document.querySelector('#messages-table tbody');
    let mode = 'New';
    const render = async () => {
        const all = await getStorage(KEY_MESSAGES);
        const list = mode==='New' ? all.filter(m => !m.isRead) : all.filter(m => m.isRead);
        
        document.querySelectorAll('.filter-btn').forEach(b => { if(b.innerText.includes(mode)) b.classList.add('active'); else b.classList.remove('active'); });

        if(list.length===0) { tbody.innerHTML='<tr><td colspan="5" style="text-align:center;">No Messages</td></tr>'; }
        else {
            tbody.innerHTML = list.map(m => {
                const idx = all.findIndex(x => x.id === m.id);
                return `<tr><td>${m.date}</td><td>${m.name}<br><small>${m.email}</small></td><td>${m.subject}</td><td>${m.text}</td><td>${!m.isRead?`<button onclick="mkR(${idx})" style="color:green;background:none;border:none;cursor:pointer;margin-right:5px;">Read</button>`:''}<button onclick="delM(${idx})" style="color:red;background:none;border:none;cursor:pointer;">Del</button></td></tr>`;
            }).join('');
        }
    };
    render();
    window.filterMsgs=(m)=>{mode=m;render();}; window.mkR=async(i)=>{const m=await getStorage(KEY_MESSAGES);m[i].isRead=true;await setStorage(KEY_MESSAGES,m);render();}; window.delM=async(i)=>{if(confirm('Del?')){const m=await getStorage(KEY_MESSAGES);m.splice(i,1);await setStorage(KEY_MESSAGES,m);render();}};
}

// --- COMMON UI ---
function createPopupHTML() { if(!document.querySelector('.custom-popup-overlay')) { const p=document.createElement('div'); p.className='custom-popup-overlay'; p.innerHTML=`<div class="custom-popup-box"><i class="fas fa-check-circle popup-icon"></i><h3 class="popup-title"></h3><p class="popup-msg"></p><button class="btn primary-btn popup-btn">OK</button></div>`; document.body.appendChild(p); p.querySelector('.popup-btn').addEventListener('click', () => { p.classList.remove('active'); if(window.popupRedirect) { window.location.href=window.popupRedirect; window.popupRedirect=null; } }); } }
function showPopup(title, msg, type='info', url=null) { const o=document.querySelector('.custom-popup-overlay'); const i=o.querySelector('.popup-icon'); o.querySelector('.popup-title').innerText=title; o.querySelector('.popup-msg').innerHTML=msg.replace(/\n/g, '<br>'); if(type==='success') i.className='fas fa-check-circle popup-icon popup-success'; else if(type==='error') i.className='fas fa-times-circle popup-icon popup-error'; else i.className='fas fa-info-circle popup-icon popup-info'; if(url) window.popupRedirect=url; o.classList.add('active'); }
async function updateAdminSidebarBadges() { const o=await getStorage(KEY_ORDERS); const m=await getStorage(KEY_MESSAGES); if(o.some(x=>x.status==='Pending') && document.getElementById('nav-orders')) document.getElementById('nav-orders').innerHTML+=' <span class="nav-badge"></span>'; if(m.some(x=>!x.isRead) && document.getElementById('nav-messages')) document.getElementById('nav-messages').innerHTML+=' <span class="nav-badge"></span>'; }
async function updateCartCount() { const c=await getStorage(KEY_CART); const t=c.reduce((s,i)=>s+(parseInt(i.qty)||0),0); document.querySelectorAll('.cart-count').forEach(e=>e.innerText=`(${t})`); }
