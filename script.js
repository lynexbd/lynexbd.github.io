// ======================================================
// LYNEX MAIN SCRIPT (Feedback Fixed)
// ======================================================

// --- KEYS ---
const KEY_PRODUCTS = 'lynex_products';
const KEY_CART = 'lynex_cart';
const KEY_ORDERS = 'lynex_orders';
const KEY_MESSAGES = 'lynex_messages'; // ফিডব্যাক কী
const KEY_ADMIN_TOKEN = 'lynex_secure_token_v99';
const KEY_ORDER_COUNT = 'lynex_order_counter';

// --- PAGE NAMES (ফাইলের নামগুলো যেন হুবহু এমন থাকে) ---
const PAGE_LOGIN = 'k7_entry_point.html';
const PAGE_DASHBOARD = 'x_master_v9.html';
const PAGE_PRODUCTS = 'p_data_source_5.html';
const PAGE_ORDERS = 'o_log_file_22.html';
const PAGE_MESSAGES = 'm_feed_back_01.html';

const _u = "SysMaster_99";
const _p = "L7n@x#Super!2025";

// --- DATABASE (IndexedDB) ---
const DB_NAME = "LynexDB_Final_V5"; // ভার্সন আপডেট করা হয়েছে
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
        req.onerror = (e) => { alert("Save Error: " + e.target.error); resolve(false); };
    });
}

// --- APP START ---
document.addEventListener('DOMContentLoaded', async function() {
    await initDB(); // ডাটাবেস কানেক্ট হওয়ার জন্য অপেক্ষা
    createPopupHTML();

    const menuToggle = document.getElementById('menu-toggle');
    const navList = document.getElementById('nav-list');
    if (menuToggle) menuToggle.addEventListener('click', () => navList.classList.toggle('active'));
    
    await updateCartCount();

    const path = window.location.pathname;
    
    // --- ROUTING LOGIC (Fixed) ---
    
    // Public Pages
    if (path.includes('index.html') || path.endsWith('/')) await loadProductsDisplay(true);
    else if (path.includes('products.html')) await loadProductsDisplay(false);
    else if (path.includes('cart.html')) await loadCartDisplay();
    else if (path.includes('checkout.html')) { handleCheckoutForm(); await loadCartSummaryForCheckout(); }
    else if (path.includes('feedback.html') || path.includes('contact.html')) handleContactForm(); // ফিডব্যাক হ্যান্ডলার
    
    // Admin Pages
    else if (path.includes(PAGE_DASHBOARD) || path.includes(PAGE_PRODUCTS) || path.includes(PAGE_ORDERS) || path.includes(PAGE_MESSAGES)) {
        checkAdminAuth(); 
        await updateAdminSidebarBadges();
        
        if (path.includes(PAGE_DASHBOARD)) await initAdminDashboard();
        if (path.includes(PAGE_PRODUCTS)) initAdminProducts();
        if (path.includes(PAGE_ORDERS)) initAdminOrders();
        if (path.includes(PAGE_MESSAGES)) initAdminMessages(); // ফিডব্যাক লোড
    }
    
    // Login
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

// --- WEBSITE FUNCTIONS ---
function handleContactForm() {
    const f = document.getElementById('contact-form');
    if(f) {
        f.onsubmit = async (e) => {
            e.preventDefault();
            
            const name = f.name.value.trim();
            const email = f.email.value.trim();
            const subject = f.subject.value.trim();
            const message = f.message.value.trim();

            if(!name || !email || !message) {
                return showPopup('Error', 'Please fill all fields!', 'error');
            }

            const msgData = {
                id: Date.now(),
                date: new Date().toLocaleDateString(),
                name: name,
                email: email,
                subject: subject,
                text: message,
                isRead: false
            };

            // Save to DB
            const msgs = await getStorage(KEY_MESSAGES);
            msgs.unshift(msgData);
            
            if(await setStorage(KEY_MESSAGES, msgs)) {
                f.reset();
                showPopup('Success', 'Feedback Sent Successfully!', 'success');
            }
        };
    }
}

// --- ADMIN FEEDBACK LOGIC ---
function initAdminMessages() {
    const tb = document.querySelector('#messages-table tbody');
    let viewMode = 'New'; 

    // Tab Buttons
    const newBtn = document.querySelector("button[onclick=\"filterMsgs('New')\"]");
    const readBtn = document.querySelector("button[onclick=\"filterMsgs('Read')\"]");

    const render = async () => {
        const allMsgs = await getStorage(KEY_MESSAGES);
        const list = viewMode === 'New' ? allMsgs.filter(m => !m.isRead) : allMsgs.filter(m => m.isRead);

        // Highlight Tabs
        if(viewMode === 'New') { newBtn.classList.add('active'); readBtn.classList.remove('active'); }
        else { readBtn.classList.add('active'); newBtn.classList.remove('active'); }

        if (list.length === 0) { 
            tb.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#ccc;">No Feedback Found</td></tr>'; 
        } else {
            tb.innerHTML = list.map(m => {
                const idx = allMsgs.findIndex(x => x.id === m.id); // Find real index
                return `
                <tr>
                    <td>${m.date}</td>
                    <td>${m.name}<br><small style="color:#aaa;">${m.email}</small></td>
                    <td>${m.subject}</td>
                    <td><div style="max-height:50px; overflow:auto;">${m.text}</div></td>
                    <td>
                        ${!m.isRead ? `<button onclick="mkR(${idx})" style="color:#2ecc71;background:none;border:1px solid #2ecc71;padding:5px;cursor:pointer;margin-right:5px;border-radius:4px;">Mark Read</button>` : ''}
                        <button onclick="delMsg(${idx})" style="color:#e74c3c;background:none;border:1px solid #e74c3c;padding:5px;cursor:pointer;border-radius:4px;">Del</button>
                    </td>
                </tr>`;
            }).join('');
        }
    };
    render();

    // Global Functions for Buttons
    window.filterMsgs = (m) => { viewMode = m; render(); };
    
    window.mkR = async (index) => { 
        const m = await getStorage(KEY_MESSAGES); 
        m[index].isRead = true; 
        await setStorage(KEY_MESSAGES, m); 
        render(); // Refresh list
        updateAdminSidebarBadges(); // Update red dot
    };
    
    window.delMsg = async (index) => { 
        if(confirm('Delete this feedback?')) { 
            const m = await getStorage(KEY_MESSAGES); 
            m.splice(index, 1); 
            await setStorage(KEY_MESSAGES, m); 
            render(); 
            updateAdminSidebarBadges();
        }
    };
}

// --- OTHER FUNCTIONS (Product, Order, Cart - As is) ---
async function loadProductsDisplay(isHome) {
    let grid = document.querySelector('.product-grid'); if (!grid) return;
    let p = await getStorage(KEY_PRODUCTS);
    if (isHome) p = p.filter(x => x.isNewArrival);
    grid.innerHTML = p.length ? p.map(i => {
        let badge = i.originalPrice > i.price ? `<span class="discount-badge">-${Math.round(((i.originalPrice-i.price)/i.originalPrice)*100)}%</span>` : '';
        let img = i.image ? `<img src="${i.image}" alt="${i.name}">` : `<div style="height:100%;display:flex;align-items:center;justify-content:center;color:#555;"><i class="fas fa-tshirt" style="font-size:3em;"></i></div>`;
        // Image check
        let images = Array.isArray(i.images) && i.images.length ? i.images : (i.image ? [i.image] : []);
        if(images.length === 0) images = [''];
        
        let slides = images.map((src, idx) => `<img src="${src}" class="slider-image ${idx===0?'active':''}" alt="${i.name}">`).join('');
        let dots = images.length > 1 ? `<div class="slider-dots">${images.map((_, idx) => `<span class="dot ${idx===0?'active':''}" onclick="goToSlide(${idx}, '${i.id}')"></span>`).join('')}</div>` : '';
        // No arrows, swipe/dot only
        window.slideIndex = window.slideIndex || {}; window.slideIndex[i.id] = 0;

        let price = `<span class="current-price">৳ ${i.price}</span>`;
        if(i.originalPrice > i.price) price = `<span class="old-price">৳ ${i.originalPrice}</span> ${price}`;

        return `<div class="product-card">${badge}<div class="slider-container" id="slider-${i.id}">${slides}${dots}</div><div class="product-info"><h3>${i.name}</h3><div class="price-container">${price}</div><div class="product-actions"><button onclick="addToCart('${i.id}')" class="btn secondary-btn">Add to Cart</button><button onclick="buyNow('${i.id}')" class="btn primary-btn">Buy Now</button></div></div></div>`;
    }).join('') : '<p style="text-align:center;width:100%;color:#777;">No products available.</p>';
}

// (Cart, Checkout, Admin Product/Order functions remain same - ensuring they are included in full file)
window.addToCart = async (id) => { const p=(await getStorage(KEY_PRODUCTS)).find(x=>x.id==id); if(p) { let c=await getStorage(KEY_CART); let ex=c.find(x=>x.id==id); if(ex) ex.qty++; else c.push({...p, qty:1}); await setStorage(KEY_CART, c); await updateCartCount(); showPopup('Success', 'Added to Cart!', 'success'); } };
window.buyNow = async (id) => { await window.addToCart(id); setTimeout(()=>window.location.href='checkout.html', 500); };
async function loadCartDisplay() { const c=document.querySelector('.cart-items'), t=document.getElementById('cart-total'); if(!c)return; const cart=await getStorage(KEY_CART); if(cart.length===0){c.innerHTML='<p style="text-align:center;">Empty</p>';if(t)t.innerText='0';if(document.querySelector('.checkout-btn'))document.querySelector('.checkout-btn').style.display='none';return;} c.innerHTML=cart.map((x,i)=>{ let thumb=Array.isArray(x.images)&&x.images.length?x.images[0]:(x.image||''); return `<div class="cart-item"><div class="cart-item-info"><img src="${thumb}" style="width:60px;height:60px;object-fit:cover;border-radius:4px;"><div><h4>${x.name}</h4><p>৳${x.price} x ${x.qty}</p><div class="qty-controls"><button class="qty-btn" onclick="upQty(${i},-1)">-</button><span>${x.qty}</span><button class="qty-btn" onclick="upQty(${i},1)">+</button></div></div></div><div style="text-align:right;"><p style="font-weight:bold;color:#ff9f43;">৳${x.price*x.qty}</p><button onclick="rmC(${i})" style="color:#e74c3c;background:none;border:none;cursor:pointer;">Remove</button></div></div>`; }).join(''); if(t)t.innerText=cart.reduce((s,i)=>s+(i.price*i.qty),0); }
window.upQty=async(i,v)=>{let c=await getStorage(KEY_CART);c[i].qty+=v;if(c[i].qty<1){if(confirm("Remove?"))c.splice(i,1);else c[i].qty=1;}await setStorage(KEY_CART,c);await loadCartDisplay();await updateCartCount();}; window.rmC=async(i)=>{let c=await getStorage(KEY_CART);c.splice(i,1);await setStorage(KEY_CART,c);await loadCartDisplay();await updateCartCount();};
function handleCheckoutForm(){const f=document.getElementById('checkout-form');if(f){f.onsubmit=async(e)=>{e.preventDefault();const c=await getStorage(KEY_CART);if(c.length===0)return showPopup('Error','Cart Empty','error');let cnt=parseInt(await getStorage(KEY_ORDER_COUNT))||0;cnt++;await setStorage(KEY_ORDER_COUNT,cnt);const id='ORD-'+String(cnt).padStart(3,'0'),tot=c.reduce((s,i)=>s+(i.price*i.qty),0),ord={id:id,date:new Date().toLocaleDateString(),customer:{name:e.target.name.value,phone:e.target.phone.value,address:e.target.address.value},items:c,total:tot,status:'Pending'};const o=await getStorage(KEY_ORDERS);o.unshift(ord);await setStorage(KEY_ORDERS,o);await setStorage(KEY_CART,[]);await updateCartCount();const lst=c.map(i=>`- ${i.name} (x${i.qty})`).join('\n');showPopup('Confirmed!',`ID: ${id}\nName: ${ord.customer.name}\nPhone: ${ord.customer.phone}\nAddress: ${ord.customer.address}\n\n${lst}\n\nTotal: ৳${tot}\n\n* We will call you soon.`,'success','index.html');};}}
async function loadCartSummaryForCheckout(){const el=document.getElementById('checkout-total');if(el){const c=await getStorage(KEY_CART);el.innerText=c.reduce((s,i)=>s+(i.price*i.qty),0);}}

function initAdminProducts(){const f=document.getElementById('add-product-form');const tb=document.querySelector('#product-table tbody');const input=document.getElementById('imageInput');const render=async()=>{const p=await getStorage(KEY_PRODUCTS);if(p.length===0){tb.innerHTML='<tr><td colspan="4" style="text-align:center;">Empty</td></tr>';document.getElementById('current-product-count').innerText=0;return;}tb.innerHTML=p.map((x,i)=>{let thumb=Array.isArray(x.images)&&x.images.length?x.images[0]:(x.image||'');return `<tr><td><img src="${thumb}" style="width:40px;height:40px;object-fit:cover;border-radius:4px;"></td><td>${x.name}</td><td>৳${x.price}</td><td><button onclick="delP(${i})" style="color:red;border:none;background:none;cursor:pointer;">Del</button></td></tr>`;}).join('');document.getElementById('current-product-count').innerText=p.length;};render();if(f){f.addEventListener('submit',async(e)=>{e.preventDefault();const files=Array.from(input.files);const readFiles=(fileList)=>Promise.all(fileList.map(f=>new Promise(r=>{const fr=new FileReader();fr.onload=()=>r(fr.result);fr.readAsDataURL(f);})));let imgData=[];if(files.length>0)imgData=await readFiles(files);const p=await getStorage(KEY_PRODUCTS);p.push({id:Date.now(),name:e.target.name.value,price:parseFloat(e.target.price.value),originalPrice:e.target.oldPrice.value?parseFloat(e.target.oldPrice.value):null,isNewArrival:e.target.isNew.checked,images:imgData});await setStorage(KEY_PRODUCTS,p);e.target.reset();render();showPopup('Success','Added!','success');});}window.delP=async(i)=>{if(confirm('Delete?')){const p=await getStorage(KEY_PRODUCTS);p.splice(i,1);await setStorage(KEY_PRODUCTS,p);render();}};}
function initAdminOrders(){const tb=document.querySelector('#orders-table tbody');let flt='All';const ren=async()=>{const all=await getStorage(KEY_ORDERS);const l=flt==='All'?all:all.filter(x=>x.status===flt);document.querySelectorAll('.filter-btn').forEach(b=>{if(b.innerText.includes(flt))b.classList.add('active');else b.classList.remove('active');});if(l.length===0){tb.innerHTML='<tr><td colspan="5" style="text-align:center;">No Orders</td></tr>';return;}tb.innerHTML=l.map(o=>{const ix=all.findIndex(x=>x.id===o.id);let c='#ff9f43';if(o.status==='Shipped')c='#3498db';if(o.status==='Delivered')c='#2ecc71';if(o.status==='Cancelled')c='#e74c3c';return `<tr><td>${o.id}</td><td>${o.customer.name}</td><td>৳${o.total}</td><td><select onchange="upS(${ix},this.value)" style="color:${c};background:#222;border:1px solid ${c}"><option ${o.status==='Pending'?'selected':''}>Pending</option><option ${o.status==='Shipped'?'selected':''}>Shipped</option><option ${o.status==='Delivered'?'selected':''}>Delivered</option><option ${o.status==='Cancelled'?'selected':''}>Cancelled</option></select></td><td><button onclick="vOrd('${o.id}')" style="color:#fff;background:none;border:none;cursor:pointer;">View</button></td></tr>`;}).join('');};ren();window.filterOrders=(s)=>{flt=s;ren();};window.upS=async(i,v)=>{const o=await getStorage(KEY_ORDERS);o[i].status=v;await setStorage(KEY_ORDERS,o);ren();};window.vOrd=async(id)=>{const o=(await getStorage(KEY_ORDERS)).find(x=>x.id===id);if(!o)return;const items=o.items.map(i=>`- ${i.name} x${i.qty}`).join('\n');showPopup('Details',`ID: ${o.id}\nName: ${o.customer.name}\nPhone: ${o.customer.phone}\nAddress: ${o.customer.address}\n\n${items}\n\nTotal: ৳${o.total}`,'info');};}
async function initAdminDashboard(){const o=await getStorage(KEY_ORDERS);const p=await getStorage(KEY_PRODUCTS);const rev=o.filter(x=>x.status==='Delivered').reduce((s,i)=>s+parseFloat(i.total),0);const setT=(id,v)=>{if(document.getElementById(id))document.getElementById(id).innerText=v;};setT('stat-revenue','৳ '+rev);setT('stat-pending',o.filter(x=>x.status==='Pending').length);setT('stat-shipped',o.filter(x=>x.status==='Shipped').length);setT('stat-delivered',o.filter(x=>x.status==='Delivered').length);setT('stat-cancelled',o.filter(x=>x.status==='Cancelled').length);setT('stat-products',p.length);}
// Slider
window.slideIndex = {}; window.changeSlide = (n, id) => showSlides(window.slideIndex[id] += n, id); window.goToSlide = (n, id) => showSlides(window.slideIndex[id] = n, id);
function showSlides(n, id) { let s=document.querySelectorAll(`#slider-${id} .slider-image`), d=document.querySelectorAll(`#slider-${id} .dot`); if(n>=s.length)window.slideIndex[id]=0; if(n<0)window.slideIndex[id]=s.length-1; s.forEach(el=>el.classList.remove('active')); d.forEach(el=>el.classList.remove('active')); s[window.slideIndex[id]].classList.add('active'); if(d.length)d[window.slideIndex[id]].classList.add('active'); }
function createPopupHTML() { if(!document.querySelector('.custom-popup-overlay')) { const p=document.createElement('div'); p.className='custom-popup-overlay'; p.innerHTML=`<div class="custom-popup-box"><i class="fas fa-info-circle popup-icon"></i><h3 class="popup-title"></h3><p class="popup-msg"></p><button class="btn primary-btn popup-btn">OK</button></div>`; document.body.appendChild(p); p.querySelector('.popup-btn').addEventListener('click', () => { p.classList.remove('active'); if(window.popupRedirect) { window.location.href=window.popupRedirect; window.popupRedirect=null; } }); } }
function showPopup(title, msg, type='info', url=null) { const o=document.querySelector('.custom-popup-overlay'); const i=o.querySelector('.popup-icon'); o.querySelector('.popup-title').innerText=title; o.querySelector('.popup-msg').innerHTML=msg.replace(/\n/g, '<br>'); if(type==='success') i.className='fas fa-check-circle popup-icon popup-success'; else if(type==='error') i.className='fas fa-times-circle popup-icon popup-error'; else i.className='fas fa-info-circle popup-icon popup-info'; if(url) window.popupRedirect=url; o.classList.add('active'); }
async function updateAdminSidebarBadges() { const o=await getStorage(KEY_ORDERS); const m=await getStorage(KEY_MESSAGES); if(o.some(x=>x.status==='Pending') && document.getElementById('nav-orders') && !location.pathname.includes(PAGE_ORDERS)) document.getElementById('nav-orders').innerHTML+=' <span class="nav-badge"></span>'; if(m.some(x=>!x.isRead) && document.getElementById('nav-messages') && !location.pathname.includes(PAGE_MESSAGES)) document.getElementById('nav-messages').innerHTML+=' <span class="nav-badge"></span>'; }
function checkAdminAuth() { if (!sessionStorage.getItem(KEY_ADMIN_TOKEN)) window.location.replace(PAGE_LOGIN); }
function adminLogout() { sessionStorage.removeItem(KEY_ADMIN_TOKEN); window.location.href = PAGE_LOGIN; }
