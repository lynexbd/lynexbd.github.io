// ======================================================
// LYNEX MAIN SCRIPT (With Custom Popup & Fixed Tabs)
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

document.addEventListener('DOMContentLoaded', function() {
    createPopupHTML(); // Initialize Popup

    const menuToggle = document.getElementById('menu-toggle');
    const navList = document.getElementById('nav-list');
    if (menuToggle) menuToggle.addEventListener('click', () => navList.classList.toggle('active'));
    
    updateCartCount();
    const path = window.location.pathname;
    const page = path.split("/").pop(); 

    if (page === 'index.html' || page === '') loadProductsDisplay(true);
    else if (page === 'products.html') loadProductsDisplay(false);
    else if (page === 'cart.html') loadCartDisplay();
    else if (page === 'checkout.html') { handleCheckoutForm(); loadCartSummaryForCheckout(); }
    else if (page === 'contact.html') handleContactForm();
    else if ([PAGE_DASHBOARD, PAGE_PRODUCTS, PAGE_ORDERS, PAGE_MESSAGES].includes(page)) {
        checkAdminAuth(); updateAdminSidebarBadges();
        if (page === PAGE_DASHBOARD) initAdminDashboard();
        if (page === PAGE_PRODUCTS) initAdminProducts();
        if (page === PAGE_ORDERS) initAdminOrders();
        if (page === PAGE_MESSAGES) initAdminMessages();
    }
    
    const loginForm = document.getElementById('secure-login-form');
    if (loginForm) {
        if(sessionStorage.getItem(KEY_ADMIN_TOKEN)) window.location.href = PAGE_DASHBOARD;
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (e.target.username.value === _u && e.target.password.value === _p) {
                sessionStorage.setItem(KEY_ADMIN_TOKEN, Math.random().toString(36).substr(2));
                window.location.href = PAGE_DASHBOARD;
            } else { showPopup('Error', 'Access Denied! Invalid credentials.', 'error'); e.target.reset(); }
        });
    }
});

// --- CUSTOM POPUP SYSTEM ---
function createPopupHTML() {
    if(!document.querySelector('.custom-popup-overlay')) {
        const popup = document.createElement('div');
        popup.className = 'custom-popup-overlay';
        popup.innerHTML = `
            <div class="custom-popup-box">
                <i class="fas fa-check-circle popup-icon"></i>
                <h3 class="popup-title">Title</h3>
                <p class="popup-msg">Message</p>
                <button class="btn primary-btn popup-btn">OK</button>
            </div>`;
        document.body.appendChild(popup);
        popup.querySelector('.popup-btn').addEventListener('click', () => {
            popup.classList.remove('active');
            if(window.popupRedirect) { window.location.href = window.popupRedirect; window.popupRedirect = null; }
        });
    }
}

function showPopup(title, msg, type='info', redirectUrl=null) {
    const overlay = document.querySelector('.custom-popup-overlay');
    const icon = overlay.querySelector('.popup-icon');
    const titleEl = overlay.querySelector('.popup-title');
    const msgEl = overlay.querySelector('.popup-msg');
    
    titleEl.innerText = title;
    // Allow HTML in message for line breaks
    msgEl.innerHTML = msg.replace(/\n/g, '<br>'); 
    
    // Icon & Color Logic
    if(type === 'success') { icon.className='fas fa-check-circle popup-icon popup-success'; }
    else if(type === 'error') { icon.className='fas fa-times-circle popup-icon popup-error'; }
    else { icon.className='fas fa-info-circle popup-icon popup-info'; }
    
    if(redirectUrl) window.popupRedirect = redirectUrl;
    overlay.classList.add('active');
}

// --- HELPERS ---
function getStorage(key) { try { return JSON.parse(localStorage.getItem(key)) || []; } catch (e) { return []; } }
function setStorage(key, data) { try { localStorage.setItem(key, JSON.stringify(data)); return true; } catch (e) { showPopup('Error', 'Storage Full! Use smaller images.', 'error'); return false; } }
function updateCartCount() {
    const c = getStorage(KEY_CART); const t = c.reduce((s, i) => s + (parseInt(i.qty)||0), 0);
    document.querySelectorAll('.cart-count').forEach(e => e.innerText = `(${t})`);
}
function updateAdminSidebarBadges() {
    const o = getStorage(KEY_ORDERS); const m = getStorage(KEY_MESSAGES);
    if(o.some(x=>x.status==='Pending') && document.getElementById('nav-orders') && !location.pathname.includes(PAGE_ORDERS)) document.getElementById('nav-orders').innerHTML += ' <span class="nav-badge"></span>';
    if(m.some(x=>!x.isRead) && document.getElementById('nav-messages') && !location.pathname.includes(PAGE_MESSAGES)) document.getElementById('nav-messages').innerHTML += ' <span class="nav-badge"></span>';
}
function checkAdminAuth() { if (!sessionStorage.getItem(KEY_ADMIN_TOKEN)) window.location.replace(PAGE_LOGIN); }
function adminLogout() { sessionStorage.removeItem(KEY_ADMIN_TOKEN); window.location.href = PAGE_LOGIN; }

// --- WEBSITE ---
function loadProductsDisplay(isHome) {
    let grid = document.querySelector('.product-grid'); if (!grid) return;
    let p = getStorage(KEY_PRODUCTS); if (isHome) p = p.filter(x => x.isNewArrival);
    grid.innerHTML = p.length ? p.map(i => {
        let badge = i.originalPrice > i.price ? `<span class="discount-badge">-${Math.round(((i.originalPrice-i.price)/i.originalPrice)*100)}%</span>` : '';
        let img = i.image ? `<img src="${i.image}" alt="${i.name}">` : `<div style="height:100%;display:flex;align-items:center;justify-content:center;color:#555;"><i class="fas fa-tshirt" style="font-size:3em;"></i></div>`;
        return `<div class="product-card">${badge}<div class="product-image">${img}</div><div class="product-info"><h3>${i.name}</h3><div class="price-container"><span class="current-price">৳${i.price}</span></div><div class="product-actions"><button onclick="addToCart('${i.id}')" class="btn secondary-btn">Add</button><button onclick="buyNow('${i.id}')" class="btn primary-btn">Buy</button></div></div></div>`;
    }).join('') : '<p style="text-align:center;width:100%;color:#777;">No products.</p>';
}
window.addToCart = (id) => { const p = getStorage(KEY_PRODUCTS).find(x => x.id == id); if (p) { let c = getStorage(KEY_CART); let ex = c.find(x => x.id == id); if(ex) ex.qty++; else c.push({...p, qty:1}); if(setStorage(KEY_CART, c)) { updateCartCount(); showPopup('Success', 'Product added to cart!', 'success'); } } };
window.buyNow = (id) => { window.addToCart(id); setTimeout(()=>window.location.href='checkout.html', 1000); };
function loadCartDisplay() {
    const c = document.querySelector('.cart-items'); const t = document.getElementById('cart-total'); if(!c) return;
    const cart = getStorage(KEY_CART);
    if(cart.length===0) { c.innerHTML='<p style="text-align:center;">Empty</p>'; if(t) t.innerText='0'; if(document.querySelector('.checkout-btn')) document.querySelector('.checkout-btn').style.display='none'; return; }
    c.innerHTML = cart.map((x,i)=>`<div class="cart-item"><div style="display:flex;gap:10px;align-items:center"><img src="${x.image||''}" style="width:60px;height:60px;object-fit:cover;border-radius:4px;"><div><h4>${x.name}</h4><p>৳${x.price} x ${x.qty}</p><div class="qty-controls"><button class="qty-btn" onclick="upQty(${i},-1)">-</button><span>${x.qty}</span><button class="qty-btn" onclick="upQty(${i},1)">+</button></div></div></div><div style="text-align:right;"><p style="font-weight:bold;color:#ff9f43;">৳${x.price*x.qty}</p><button onclick="rmC(${i})" style="color:red;border:none;background:none;cursor:pointer;">Remove</button></div></div>`).join('');
    if(t) t.innerText = cart.reduce((s, i) => s + (i.price * i.qty), 0);
}
window.upQty = (i, v) => { let c=getStorage(KEY_CART); c[i].qty+=v; if(c[i].qty<1) { if(confirm("Remove?")) c.splice(i,1); else c[i].qty=1; } setStorage(KEY_CART, c); loadCartDisplay(); updateCartCount(); };
window.rmC = (i) => { let c=getStorage(KEY_CART); c.splice(i,1); setStorage(KEY_CART, c); loadCartDisplay(); updateCartCount(); };
function handleCheckoutForm() {
    const f = document.getElementById('checkout-form');
    if(f) {
        f.onsubmit = (e) => {
            e.preventDefault();
            const c = getStorage(KEY_CART);
            if(c.length===0) return showPopup('Error', 'Cart Empty', 'error');
            let cnt = parseInt(localStorage.getItem(KEY_ORDER_COUNT))||0; cnt++; localStorage.setItem(KEY_ORDER_COUNT, cnt);
            const ordId = 'ORD-'+String(cnt).padStart(3,'0');
            const total = c.reduce((s,i)=>s+(i.price*i.qty),0);
            const ord = { id: ordId, date: new Date().toLocaleDateString(), customer: { name: e.target.name.value, phone: e.target.phone.value, address: e.target.address.value }, items: c, total: total, status: 'Pending' };
            const orders = getStorage(KEY_ORDERS); orders.unshift(ord); 
            if(setStorage(KEY_ORDERS, orders)) { setStorage(KEY_CART, []); updateCartCount(); showPopup('Success', `Order Confirmed!\nID: ${ordId}\nWe will contact you soon.`, 'success', 'index.html'); }
        };
    }
}
function loadCartSummaryForCheckout() { const el=document.getElementById('checkout-total'); if(el) { const c=getStorage(KEY_CART); el.innerText=c.reduce((s,i)=>s+(i.price*i.qty),0); }}
function handleContactForm() { const f=document.getElementById('contact-form'); if(f) f.onsubmit=(e)=>{ e.preventDefault(); const m={id:Date.now(), date:new Date().toLocaleDateString(), name:e.target.name.value, email:e.target.email.value, subject:e.target.subject.value, text:e.target.message.value, isRead:false}; const ms=getStorage(KEY_MESSAGES); ms.unshift(m); if(setStorage(KEY_MESSAGES, ms)){ e.target.reset(); showPopup('Sent', 'Message sent successfully!', 'success'); } }; }

// --- ADMIN ---
function initAdminDashboard() {
    const o = getStorage(KEY_ORDERS); const p = getStorage(KEY_PRODUCTS);
    const rev = o.filter(x => x.status === 'Delivered').reduce((s, i) => s + parseFloat(i.total), 0);
    const setT = (id, v) => { if(document.getElementById(id)) document.getElementById(id).innerText = v; };
    setT('stat-revenue', '৳ ' + rev); setT('stat-pending', o.filter(x => x.status === 'Pending').length);
    setT('stat-shipped', o.filter(x => x.status === 'Shipped').length); setT('stat-delivered', o.filter(x => x.status === 'Delivered').length);
    setT('stat-cancelled', o.filter(x => x.status === 'Cancelled').length); setT('stat-products', p.length);
}

function initAdminProducts() {
    const f=document.getElementById('add-product-form'); const tb=document.querySelector('#product-table tbody');
    const ren=()=>{ const p=getStorage(KEY_PRODUCTS); tb.innerHTML=p.length ? p.map((x,i)=>`<tr><td><img src="${x.image||''}" style="width:40px;height:40px;object-fit:cover;border-radius:4px;"></td><td>${x.name} ${x.isNewArrival?'<span style="color:#2ecc71;">(New)</span>':''}</td><td>৳${x.price}</td><td><button onclick="delP(${i})" style="color:red;border:none;background:none;cursor:pointer;">Del</button></td></tr>`).join('') : '<tr><td colspan="4" style="text-align:center;">Empty</td></tr>'; document.getElementById('current-product-count').innerText=p.length; };
    ren();
    if(f) {
        f.addEventListener('submit', (e) => {
            e.preventDefault();
            const file = e.target.image.files[0]; const reader = new FileReader();
            const save = (img) => { const p=getStorage(KEY_PRODUCTS); p.push({id:Date.now(), name:e.target.name.value, price:e.target.price.value, originalPrice:e.target.oldPrice.value, isNewArrival:e.target.isNew.checked, image:img}); if(setStorage(KEY_PRODUCTS, p)) { e.target.reset(); ren(); showPopup('Success', 'Product Added!', 'success'); }};
            if(file) { 
                if(file.size > 500000) return showPopup('Error', 'File too big (>500KB)', 'error'); 
                reader.onload=(ev)=>save(ev.target.result); reader.readAsDataURL(file); 
            } else save(null);
        });
    }
    window.delP = (i) => { if(confirm('Delete?')) { const p = getStorage(KEY_PRODUCTS); p.splice(i, 1); setStorage(KEY_PRODUCTS, p); ren(); } };
}

function initAdminOrders() {
    const tb=document.querySelector('#orders-table tbody'); let flt='All';
    const ren=()=>{ 
        const all=getStorage(KEY_ORDERS); const l=flt==='All' ? all : all.filter(x => x.status === flt);
        
        // Tab Highlight Fix
        document.querySelectorAll('.filter-btn').forEach(b => {
            const txt = b.innerText.trim();
            if(txt === flt || (flt==='All'&&txt==='All') || (flt==='Delivered'&&txt==='Completed')) b.classList.add('active'); 
            else b.classList.remove('active');
        });

        if (l.length === 0) { tb.innerHTML = '<tr><td colspan="5" style="text-align:center;">No Orders</td></tr>'; return; }
        tb.innerHTML = l.map(o => {
            const ix = all.findIndex(x => x.id === o.id);
            let c='#ff9f43'; if(o.status==='Shipped')c='#3498db'; if(o.status==='Delivered')c='#2ecc71'; if(o.status==='Cancelled')c='#e74c3c';
            return `<tr><td>${o.id}</td><td>${o.customer.name}</td><td>৳${o.total}</td><td><select onchange="upS(${ix},this.value)" style="color:${c};background:#222;border:1px solid ${c}"><option ${o.status==='Pending'?'selected':''}>Pending</option><option ${o.status==='Shipped'?'selected':''}>Shipped</option><option ${o.status==='Delivered'?'selected':''}>Delivered</option><option ${o.status==='Cancelled'?'selected':''}>Cancelled</option></select></td><td><button onclick="vOrd('${o.id}')" style="color:#fff;background:none;border:none;cursor:pointer;">View</button></td></tr>`;
        }).join('');
    };
    ren();
    window.filterOrders=(s)=>{flt=s; ren();}; window.upS=(i,v)=>{ const o=getStorage(KEY_ORDERS); o[i].status=v; setStorage(KEY_ORDERS,o); ren(); };
    window.vOrd=(id)=>{ const o=getStorage(KEY_ORDERS).find(x=>x.id===id); if(!o)return; const its=o.items.map(i=>`- ${i.name} x${i.qty} (৳${i.price})`).join('\n'); showPopup('Order Details', `ID: ${o.id}\nName: ${o.customer.name}\nPhone: ${o.customer.phone}\nAddress: ${o.customer.address}\n\n${its}\n\nTotal: ৳${o.total}`, 'info'); };
}

function initAdminMessages() {
    const tb=document.querySelector('#messages-table tbody'); let vm='New';
    const ren=()=>{ const all=getStorage(KEY_MESSAGES); const l=vm==='New'?all.filter(x=>!x.isRead):all.filter(x=>x.isRead);
        document.querySelectorAll('.filter-btn').forEach(b => { if(b.innerText.includes(vm)) b.classList.add('active'); else b.classList.remove('active'); });
        if (l.length === 0) { tb.innerHTML = '<tr><td colspan="5" style="text-align:center;">No Messages</td></tr>'; }
        else {
            tb.innerHTML = l.map(m => {
                const idx = all.findIndex(x => x.id === m.id);
                return `<tr><td>${m.date}</td><td>${m.name}<br><small style="color:#aaa;">${m.email}</small></td><td>${m.subject}</td><td>${m.text}</td><td>${!m.isRead?`<button onclick="mkR(${idx})" style="color:green;background:none;border:none;cursor:pointer;margin-right:5px;">Mark Read</button>`:''}<button onclick="delMsg(${idx})" style="color:red;background:none;border:none;cursor:pointer;">Del</button></td></tr>`;
            }).join('');
        }
    };
    ren();
    window.filterMsgs=(m)=>{vm=m;ren();}; 
    window.mkR=(i)=>{ const m=getStorage(KEY_MESSAGES); m[i].isRead=true; setStorage(KEY_MESSAGES, m); ren(); };
    window.delMsg=(i)=>{ if(confirm('Delete?')) { const m=getStorage(KEY_MESSAGES); m.splice(i,1); setStorage(KEY_MESSAGES, m); ren(); }};
}
