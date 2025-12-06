// ======================================================
// LYNEX MAIN SCRIPT (Multi-Image Support)
// ======================================================

const KEY_PRODUCTS = 'lynex_products';
const KEY_CART = 'lynex_cart';
const KEY_ORDERS = 'lynex_orders';
const KEY_MESSAGES = 'lynex_messages';
const KEY_ADMIN_TOKEN = 'lynex_secure_token_v99';
const KEY_ORDER_COUNT = 'lynex_order_counter';

const PAGE_LOGIN = 'k7_entry_point.html';
const PAGE_DASHBOARD = 'x_master_v9.html';
const PAGE_PRODUCTS = 'p_data_source_5.html';
const PAGE_ORDERS = 'o_log_file_22.html';
const PAGE_MESSAGES = 'm_feed_back_01.html';

const _u = "SysMaster_99";
const _p = "L7n@x#Super!2025";

// --- INDEXEDDB SETUP ---
const DB_NAME = "LynexDB_Final";
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

document.addEventListener('DOMContentLoaded', async function() {
    await initDB();
    createPopupHTML();

    const menuToggle = document.getElementById('menu-toggle');
    const navList = document.getElementById('nav-list');
    if (menuToggle) menuToggle.addEventListener('click', () => navList.classList.toggle('active'));
    
    await updateCartCount();
    const path = window.location.pathname;
    const page = path.split("/").pop(); 

    // Public Pages
    if (page === 'index.html' || page === '') await loadProductsDisplay(true);
    else if (page === 'products.html') await loadProductsDisplay(false);
    else if (page === 'cart.html') await loadCartDisplay();
    else if (page === 'checkout.html') { handleCheckoutForm(); await loadCartSummaryForCheckout(); }
    else if (page === 'contact.html' || page === 'feedback.html') handleContactForm();
    
    // Admin Pages
    else if ([PAGE_DASHBOARD, PAGE_PRODUCTS, PAGE_ORDERS, PAGE_MESSAGES].includes(page)) {
        checkAdminAuth(); await updateAdminSidebarBadges();
        if (page === PAGE_DASHBOARD) await initAdminDashboard();
        if (page === PAGE_PRODUCTS) await initAdminProducts();
        if (page === PAGE_ORDERS) await initAdminOrders();
        if (page === PAGE_MESSAGES) await initAdminMessages();
    }
    
    const loginForm = document.getElementById('secure-login-form');
    if (loginForm) {
        if(sessionStorage.getItem(KEY_ADMIN_TOKEN)) window.location.href = PAGE_DASHBOARD;
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (e.target.username.value === _u && e.target.password.value === _p) {
                sessionStorage.setItem(KEY_ADMIN_TOKEN, Math.random().toString(36).substr(2));
                window.location.href = PAGE_DASHBOARD;
            } else { showPopup('Error', 'Access Denied!', 'error'); e.target.reset(); }
        });
    }
});

// --- SLIDER LOGIC ---
window.slideIndex = {}; 

window.changeSlide = (n, prodId) => {
    let slides = document.querySelectorAll(`#slider-${prodId} .slider-image`);
    let dots = document.querySelectorAll(`#slider-${prodId} .dot`);
    let current = window.slideIndex[prodId] || 0;
    
    slides[current].classList.remove('active');
    if(dots.length > 0) dots[current].classList.remove('active');
    
    current += n;
    if (current >= slides.length) current = 0;
    if (current < 0) current = slides.length - 1;
    
    slides[current].classList.add('active');
    if(dots.length > 0) dots[current].classList.add('active');
    window.slideIndex[prodId] = current;
};

window.goToSlide = (n, prodId) => {
    let slides = document.querySelectorAll(`#slider-${prodId} .slider-image`);
    let dots = document.querySelectorAll(`#slider-${prodId} .dot`);
    let current = window.slideIndex[prodId] || 0;

    slides[current].classList.remove('active');
    if(dots.length > 0) dots[current].classList.remove('active');

    current = n;
    slides[current].classList.add('active');
    if(dots.length > 0) dots[current].classList.add('active');
    window.slideIndex[prodId] = current;
};

// --- WEBSITE DISPLAY ---
async function loadProductsDisplay(isHome) {
    let grid = document.querySelector('.product-grid'); if (!grid) return;
    let products = await getStorage(KEY_PRODUCTS);
    if (isHome) products = products.filter(p => p.isNewArrival);

    grid.innerHTML = products.length ? products.map(p => {
        let priceHTML = `<span class="current-price">৳ ${p.price}</span>`;
        let badgeHTML = '';
        if (p.originalPrice && parseFloat(p.originalPrice) > parseFloat(p.price)) {
            priceHTML = `<span class="old-price">৳ ${p.originalPrice}</span> <span class="current-price">৳ ${p.price}</span>`;
            const d = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
            badgeHTML = `<span class="discount-badge">-${d}% OFF</span>`;
        }

        // Image Array Handling
        let images = Array.isArray(p.images) ? p.images : (p.image ? [p.image] : []);
        if(images.length === 0) images = [''];

        // Slides HTML
        let slidesHTML = images.map((img, idx) => 
            `<img src="${img}" class="slider-image ${idx===0?'active':''}" alt="${p.name}">`
        ).join('');

        // Dots HTML
        let dotsHTML = '';
        if(images.length > 1) {
            dotsHTML = `<div class="slider-dots">` + 
                images.map((_, idx) => `<span class="dot ${idx===0?'active':''}" onclick="goToSlide(${idx}, '${p.id}')"></span>`).join('') + 
                `</div>`;
        }

        // Arrows HTML
        let arrowsHTML = '';
        if(images.length > 1) {
            arrowsHTML = `<a class="prev" onclick="changeSlide(-1, '${p.id}')">&#10094;</a><a class="next" onclick="changeSlide(1, '${p.id}')">&#10095;</a>`;
        }

        window.slideIndex[p.id] = 0; // Initialize state

        return `
        <div class="product-card">
            ${badgeHTML}
            <div class="slider-container" id="slider-${p.id}">
                ${slidesHTML}
                ${arrowsHTML}
                ${dotsHTML}
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
    }).join('') : '<p style="text-align:center;width:100%;color:#777;">No products.</p>';
}

// --- CART & CHECKOUT ---
window.addToCart = async (id) => { const p=(await getStorage(KEY_PRODUCTS)).find(x=>x.id==id); if(p) { let c=await getStorage(KEY_CART); let ex=c.find(x=>x.id==id); if(ex) ex.qty++; else c.push({...p, qty:1}); await setStorage(KEY_CART, c); await updateCartCount(); showPopup('Success', 'Product Added!', 'success'); } };
window.buyNow = async (id) => { await window.addToCart(id); setTimeout(()=>window.location.href='checkout.html', 500); };

async function loadCartDisplay() {
    const c = document.querySelector('.cart-items'); const t = document.getElementById('cart-total'); if(!c) return;
    const cart = await getStorage(KEY_CART);
    if(cart.length===0) { c.innerHTML='<p style="text-align:center;color:#aaa;">Empty</p>'; if(t) t.innerText='0'; if(document.querySelector('.checkout-btn')) document.querySelector('.checkout-btn').style.display='none'; return; }
    
    c.innerHTML = cart.map((item, i) => {
        // Use first image as thumbnail
        let thumb = Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : (item.image || '');
        return `<div class="cart-item"><div class="cart-item-info"><img src="${thumb}" style="width:60px;height:60px;object-fit:cover;border-radius:4px;background:#333;"><div><h4>${item.name}</h4><p>৳${item.price} x ${item.qty}</p><div class="qty-controls"><button class="qty-btn" onclick="upQty(${i},-1)">-</button><span>${item.qty}</span><button class="qty-btn" onclick="upQty(${i},1)">+</button></div></div></div><div style="text-align:right;"><p style="font-weight:bold;color:#ff9f43;">৳${item.price*item.qty}</p><button onclick="rmC(${i})" style="color:#e74c3c;background:none;border:none;cursor:pointer;margin-top:5px;">Remove</button></div></div>`;
    }).join('');
    if(t) t.innerText = cart.reduce((s, i) => s + (i.price * i.qty), 0);
}
window.upQty = async (i, v) => { let c=await getStorage(KEY_CART); c[i].qty+=v; if(c[i].qty<1) { if(confirm("Remove?")) c.splice(i,1); else c[i].qty=1; } await setStorage(KEY_CART, c); await loadCartDisplay(); await updateCartCount(); };
window.rmC = async (i) => { let c=await getStorage(KEY_CART); c.splice(i,1); await setStorage(KEY_CART, c); await loadCartDisplay(); await updateCartCount(); };

function handleCheckoutForm() {
    const f = document.getElementById('checkout-form');
    if(f) {
        f.onsubmit = async (e) => {
            e.preventDefault();
            const c = await getStorage(KEY_CART);
            if(c.length===0) return showPopup('Error', 'Cart Empty', 'error');
            let cnt = parseInt(await getStorage(KEY_ORDER_COUNT))||0; cnt++; await setStorage(KEY_ORDER_COUNT, cnt);
            const ordId = 'ORD-'+String(cnt).padStart(3,'0');
            const total = c.reduce((s,i)=>s+(i.price*i.qty),0);
            const ord = { id: ordId, date: new Date().toLocaleDateString(), customer: { name: e.target.name.value, phone: e.target.phone.value, address: e.target.address.value }, items: c, total: total, status: 'Pending' };
            const orders = await getStorage(KEY_ORDERS); orders.unshift(ord); 
            await setStorage(KEY_ORDERS, orders); await setStorage(KEY_CART, []); await updateCartCount();
            const itemsList = c.map(i => `- ${i.name} (x${i.qty})`).join('\n');
            showPopup('Order Confirmed!', `ID: ${ordId}\nName: ${ord.customer.name}\nPhone: ${ord.customer.phone}\nAddress: ${ord.customer.address}\n\n${itemsList}\n\nTotal: ৳${total}\n\n* ডেলিভারি চার্জ এবং সকল তথ্যের জন্যে আপনাকে কল করা হবে।`, 'success', 'index.html');
        };
    }
}
async function loadCartSummaryForCheckout() { const el=document.getElementById('checkout-total'); if(el) { const c=await getStorage(KEY_CART); el.innerText=c.reduce((s,i)=>s+(i.price*i.qty),0); }}
function handleContactForm() { const f=document.getElementById('contact-form'); if(f) f.onsubmit = async (e) => { e.preventDefault(); const m={id:Date.now(), date:new Date().toLocaleDateString(), name:e.target.name.value, email:e.target.email.value, subject:e.target.subject.value, text:e.target.message.value, isRead:false}; const ms = await getStorage(KEY_MESSAGES); ms.unshift(m); await setStorage(KEY_MESSAGES, ms); e.target.reset(); showPopup('Sent', 'Feedback Sent!', 'success'); }; }

// --- ADMIN: MULTIPLE IMAGE UPLOAD FIX ---
function initAdminProducts() {
    const f=document.getElementById('add-product-form'); const tb=document.querySelector('#product-table tbody');
    const render = async () => {
        const p = await getStorage(KEY_PRODUCTS);
        if (p.length === 0) { tb.innerHTML = '<tr><td colspan="4" style="text-align:center;">Empty</td></tr>'; document.getElementById('current-product-count').innerText=0; return; }
        
        tb.innerHTML = p.map((x,i)=> {
            let thumb = Array.isArray(x.images) && x.images.length > 0 ? x.images[0] : (x.image || '');
            return `<tr><td><img src="${thumb}" style="width:40px;height:40px;object-fit:cover;border-radius:4px;"></td><td>${x.name}</td><td>৳${x.price}</td><td><button onclick="delP(${i})" style="color:red;border:none;background:none;cursor:pointer;">Del</button></td></tr>`;
        }).join('');
        document.getElementById('current-product-count').innerText=p.length;
    };
    render();

    if(f) {
        f.addEventListener('submit', async (e) => {
            e.preventDefault();
            const files = e.target.image.files; // Multiple files

            // Read all files as Base64
            const readFiles = (fileList) => {
                const promises = [];
                for(let i=0; i<fileList.length; i++) {
                    promises.push(new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onload = (ev) => resolve(ev.target.result);
                        reader.readAsDataURL(fileList[i]);
                    }));
                }
                return Promise.all(promises);
            };

            let imgDataArray = [];
            if (files && files.length > 0) {
                imgDataArray = await readFiles(files);
            }

            const p = await getStorage(KEY_PRODUCTS);
            p.push({
                id: Date.now(),
                name: e.target.name.value,
                price: parseFloat(e.target.price.value),
                originalPrice: e.target.oldPrice.value ? parseFloat(e.target.oldPrice.value) : null,
                isNewArrival: e.target.isNew.checked,
                images: imgDataArray // Store array of images
            });

            await setStorage(KEY_PRODUCTS, p);
            e.target.reset();
            render();
            showPopup('Success', 'Product Added!', 'success');
        });
    }
    window.delP = async (i) => { if(confirm('Delete?')) { const p = await getStorage(KEY_PRODUCTS); p.splice(i, 1); await setStorage(KEY_PRODUCTS, p); render(); } };
}

// ... (Other Admin Functions same as before) ...
async function initAdminDashboard() { const o = await getStorage(KEY_ORDERS); const p = await getStorage(KEY_PRODUCTS); const rev = o.filter(x => x.status === 'Delivered').reduce((s, i) => s + parseFloat(i.total), 0); const setT = (id, v) => { if(document.getElementById(id)) document.getElementById(id).innerText = v; }; setT('stat-revenue', '৳ ' + rev); setT('stat-pending', o.filter(x => x.status === 'Pending').length); setT('stat-shipped', o.filter(x => x.status === 'Shipped').length); setT('stat-delivered', o.filter(x => x.status === 'Delivered').length); setT('stat-cancelled', o.filter(x => x.status === 'Cancelled').length); setT('stat-products', p.length); }
function initAdminOrders() { const tb=document.querySelector('#orders-table tbody'); let flt='All'; const ren=async()=>{ const all=await getStorage(KEY_ORDERS); const l=flt==='All' ? all : all.filter(x=>x.status===flt); document.querySelectorAll('.filter-btn').forEach(b => { if(b.innerText.includes(flt)||(flt==='All'&&b.innerText==='All')||(flt==='Delivered'&&b.innerText==='Completed')) b.classList.add('active'); else b.classList.remove('active'); }); if(l.length===0) { tb.innerHTML='<tr><td colspan="5" style="text-align:center;">No Orders</td></tr>'; return; } tb.innerHTML = l.map(o => { const ix=all.findIndex(x=>x.id===o.id); let c='#ff9f43'; if(o.status==='Shipped')c='#3498db'; if(o.status==='Delivered')c='#2ecc71'; if(o.status==='Cancelled')c='#e74c3c'; return `<tr><td>${o.id}</td><td>${o.customer.name}</td><td>৳${o.total}</td><td><select onchange="upS(${ix},this.value)" style="color:${c};background:#222;border:1px solid ${c}"><option ${o.status==='Pending'?'selected':''}>Pending</option><option ${o.status==='Shipped'?'selected':''}>Shipped</option><option ${o.status==='Delivered'?'selected':''}>Delivered</option><option ${o.status==='Cancelled'?'selected':''}>Cancelled</option></select></td><td><button onclick="vOrd('${o.id}')" style="color:#fff;background:none;border:none;cursor:pointer;">View</button></td></tr>`; }).join(''); }; ren(); window.filterOrders=(s)=>{flt=s; ren();}; window.upS=async(i,v)=>{ const o=await getStorage(KEY_ORDERS); o[i].status=v; await setStorage(KEY_ORDERS,o); ren(); }; window.vOrd=async(id)=>{ const o=(await getStorage(KEY_ORDERS)).find(x=>x.id===id); if(!o)return; const items=o.items.map(i=>`- ${i.name} x${i.qty} (৳${i.price})`).join('\n'); showPopup('Order Details', `ID: ${o.id}\nName: ${o.customer.name}\nPhone: ${o.customer.phone}\nAddress: ${o.customer.address}\n\n${items}\n\nTotal: ৳${o.total}`, 'info'); }; }
function initAdminMessages() { const tb=document.querySelector('#messages-table tbody'); let vm='New'; const ren=async()=>{ const all=await getStorage(KEY_MESSAGES); const l=vm==='New'?all.filter(x=>!x.isRead):all.filter(x=>x.isRead); document.querySelectorAll('.filter-btn').forEach(b => { if(b.innerText.includes(vm)) b.classList.add('active'); else b.classList.remove('active'); }); if(l.length===0) { tb.innerHTML='<tr><td colspan="5" style="text-align:center;">No Messages</td></tr>'; } else { tb.innerHTML = l.map(m => { const ix=all.findIndex(x=>x.id===m.id); return `<tr><td>${m.date}</td><td>${m.name}<br><small style="color:#aaa;">${m.email}</small></td><td>${m.subject}</td><td>${m.text}</td><td>${!m.isRead?`<button onclick="mkR(${ix})" style="color:green;background:none;border:none;cursor:pointer;margin-right:5px;">Mark Read</button>`:''}<button onclick="delMsg(${idx})" style="color:red;background:none;border:none;cursor:pointer;">Del</button></td></tr>`; }).join(''); } }; ren(); window.filterMsgs=(m)=>{vm=m;ren();}; window.mkR=async(i)=>{const m=await getStorage(KEY_MESSAGES); m[i].isRead=true; await setStorage(KEY_MESSAGES, m); ren();}; window.delMsg=async(i)=>{if(confirm('Delete?')){const m=await getStorage(KEY_MESSAGES); m.splice(i,1); await setStorage(KEY_MESSAGES, m); ren();}}; }

// POPUP
function createPopupHTML() { if(!document.querySelector('.custom-popup-overlay')) { const p=document.createElement('div'); p.className='custom-popup-overlay'; p.innerHTML=`<div class="custom-popup-box"><i class="fas fa-check-circle popup-icon"></i><h3 class="popup-title"></h3><p class="popup-msg"></p><button class="btn primary-btn popup-btn">OK</button></div>`; document.body.appendChild(p); p.querySelector('.popup-btn').addEventListener('click', () => { p.classList.remove('active'); if(window.popupRedirect) { window.location.href=window.popupRedirect; window.popupRedirect=null; } }); } }
function showPopup(title, msg, type='info', url=null) { const o=document.querySelector('.custom-popup-overlay'); const i=o.querySelector('.popup-icon'); o.querySelector('.popup-title').innerText=title; o.querySelector('.popup-msg').innerHTML=msg.replace(/\n/g, '<br>'); if(type==='success') i.className='fas fa-check-circle popup-icon popup-success'; else if(type==='error') i.className='fas fa-times-circle popup-icon popup-error'; else i.className='fas fa-info-circle popup-icon popup-info'; if(url) window.popupRedirect=url; o.classList.add('active'); }
function updateAdminSidebarBadges() { const o = getStorage(KEY_ORDERS); const m = getStorage(KEY_MESSAGES); if(o.some(x=>x.status==='Pending') && document.getElementById('nav-orders') && !location.pathname.includes(PAGE_ORDERS)) document.getElementById('nav-orders').innerHTML += ' <span class="nav-badge"></span>'; if(m.some(x=>!x.isRead) && document.getElementById('nav-messages') && !location.pathname.includes(PAGE_MESSAGES)) document.getElementById('nav-messages').innerHTML += ' <span class="nav-badge"></span>'; }
function checkAdminAuth() { if (!sessionStorage.getItem(KEY_ADMIN_TOKEN)) window.location.replace(PAGE_LOGIN); }
function adminLogout() { sessionStorage.removeItem(KEY_ADMIN_TOKEN); window.location.href = PAGE_LOGIN; }
