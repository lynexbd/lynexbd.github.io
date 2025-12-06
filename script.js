// ======================================================
// LYNEX MAIN SCRIPT (Fixed Product Add & Layout)
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
const DB_NAME = "LynexDB_Final_V2"; // Version updated to force reset schema if needed
const DB_VERSION = 1;
let db;

function initDB() {
    return new Promise((resolve, reject) => {
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
        req.onerror = (e) => { 
            console.error("DB Save Error:", e);
            alert("Error saving data! Database might be full or corrupt."); 
            resolve(false); 
        };
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

    if (page === 'index.html' || page === '') await loadProductsDisplay(true);
    else if (page === 'products.html') await loadProductsDisplay(false);
    else if (page === 'cart.html') await loadCartDisplay();
    else if (page === 'checkout.html') { handleCheckoutForm(); await loadCartSummaryForCheckout(); }
    else if (page === 'feedback.html') handleContactForm();
    
    else if ([PAGE_DASHBOARD, PAGE_PRODUCTS, PAGE_ORDERS, PAGE_MESSAGES].includes(page)) {
        checkAdminAuth(); await updateAdminSidebarBadges();
        if (page === PAGE_DASHBOARD) await initAdminDashboard();
        if (page === PAGE_PRODUCTS) await initAdminProducts(); // Fixed Function Call
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

// ... (Helper Functions: Popup, Auth, Cart Updates remain same) ...
function createPopupHTML() { if(!document.querySelector('.custom-popup-overlay')) { const p=document.createElement('div'); p.className='custom-popup-overlay'; p.innerHTML=`<div class="custom-popup-box"><i class="fas fa-check-circle popup-icon"></i><h3 class="popup-title"></h3><p class="popup-msg"></p><button class="btn primary-btn popup-btn">OK</button></div>`; document.body.appendChild(p); p.querySelector('.popup-btn').addEventListener('click', () => { p.classList.remove('active'); if(window.popupRedirect) { window.location.href=window.popupRedirect; window.popupRedirect=null; } }); } }
function showPopup(title, msg, type='info', url=null) { const o=document.querySelector('.custom-popup-overlay'); const i=o.querySelector('.popup-icon'); o.querySelector('.popup-title').innerText=title; o.querySelector('.popup-msg').innerHTML=msg.replace(/\n/g, '<br>'); if(type==='success') i.className='fas fa-check-circle popup-icon popup-success'; else if(type==='error') i.className='fas fa-times-circle popup-icon popup-error'; else i.className='fas fa-info-circle popup-icon popup-info'; if(url) window.popupRedirect=url; o.classList.add('active'); }
async function updateCartCount() { const c = await getStorage(KEY_CART); const t = c.reduce((s, i) => s + (parseInt(i.qty)||0), 0); document.querySelectorAll('.cart-count').forEach(e => e.innerText = `(${t})`); }
async function updateAdminSidebarBadges() { const o = await getStorage(KEY_ORDERS); const m = await getStorage(KEY_MESSAGES); if(o.some(x=>x.status==='Pending') && document.getElementById('nav-orders') && !location.pathname.includes(PAGE_ORDERS)) document.getElementById('nav-orders').innerHTML += ' <span class="nav-badge"></span>'; if(m.some(x=>!x.isRead) && document.getElementById('nav-messages') && !location.pathname.includes(PAGE_MESSAGES)) document.getElementById('nav-messages').innerHTML += ' <span class="nav-badge"></span>'; }
function checkAdminAuth() { if (!sessionStorage.getItem(KEY_ADMIN_TOKEN)) window.location.replace(PAGE_LOGIN); }
function adminLogout() { sessionStorage.removeItem(KEY_ADMIN_TOKEN); window.location.href = PAGE_LOGIN; }

// --- WEBSITE LOGIC ---
// (Products, Cart, Checkout functions from previous response - Ensure they are included)
async function loadProductsDisplay(isHome) {
    let grid = document.querySelector('.product-grid'); if (!grid) return;
    let p = await getStorage(KEY_PRODUCTS);
    if (isHome) p = p.filter(x => x.isNewArrival);
    grid.innerHTML = p.length ? p.map(i => {
        let badge = i.originalPrice > i.price ? `<span class="discount-badge">-${Math.round(((i.originalPrice-i.price)/i.originalPrice)*100)}%</span>` : '';
        
        // Image Logic
        let images = Array.isArray(i.images) ? i.images : (i.image ? [i.image] : []);
        if(images.length === 0) images = [''];
        
        // Slider HTML
        let slidesHTML = images.map((img, idx) => `<img src="${img}" class="slider-image ${idx===0?'active':''}" alt="${i.name}">`).join('');
        let dotsHTML = images.length > 1 ? `<div class="slider-dots">${images.map((_, idx) => `<span class="dot ${idx===0?'active':''}" onclick="goToSlide(${idx}, '${i.id}')"></span>`).join('')}</div>` : '';
        let arrowsHTML = images.length > 1 ? `<a class="prev" onclick="changeSlide(-1, '${i.id}')">&#10094;</a><a class="next" onclick="changeSlide(1, '${i.id}')">&#10095;</a>` : '';
        window.slideIndex = window.slideIndex || {}; window.slideIndex[i.id] = 0;

        let priceHTML = `<span class="current-price">৳ ${i.price}</span>`;
        if (i.originalPrice && parseFloat(i.originalPrice) > parseFloat(i.price)) {
            priceHTML = `<span class="old-price">৳ ${i.originalPrice}</span> <span class="current-price">৳ ${i.price}</span>`;
        }

        return `<div class="product-card">${badge}<div class="slider-container" id="slider-${i.id}">${slidesHTML}${arrowsHTML}${dotsHTML}</div><div class="product-info"><h3>${i.name}</h3><div class="price-container">${priceHTML}</div><div class="product-actions"><button onclick="addToCart('${i.id}')" class="btn secondary-btn">Add to Cart</button><button onclick="buyNow('${i.id}')" class="btn primary-btn">Buy Now</button></div></div></div>`;
    }).join('') : '<p style="text-align:center;width:100%;color:#777;">No products available.</p>';
}

// Slider Helper
window.changeSlide = (n, prodId) => { let s=document.querySelectorAll(`#slider-${prodId} .slider-image`), d=document.querySelectorAll(`#slider-${prodId} .dot`), c=window.slideIndex[prodId]||0; s[c].classList.remove('active'); if(d.length)d[c].classList.remove('active'); c+=n; if(c>=s.length)c=0; if(c<0)c=s.length-1; s[c].classList.add('active'); if(d.length)d[c].classList.add('active'); window.slideIndex[prodId]=c; };
window.goToSlide = (n, prodId) => { let s=document.querySelectorAll(`#slider-${prodId} .slider-image`), d=document.querySelectorAll(`#slider-${prodId} .dot`); s[window.slideIndex[prodId]].classList.remove('active'); if(d.length)d[window.slideIndex[prodId]].classList.remove('active'); window.slideIndex[prodId]=n; s[n].classList.add('active'); if(d.length)d[n].classList.add('active'); };

window.addToCart = async (id) => { const p=(await getStorage(KEY_PRODUCTS)).find(x=>x.id==id); if(p) { let c=await getStorage(KEY_CART); let ex=c.find(x=>x.id==id); if(ex) ex.qty++; else c.push({...p, qty:1}); await setStorage(KEY_CART, c); await updateCartCount(); showPopup('Success', 'Product added to cart!', 'success'); } };
window.buyNow = async (id) => { await window.addToCart(id); setTimeout(()=>window.location.href='checkout.html', 500); };
async function loadCartDisplay() { const c=document.querySelector('.cart-items'), t=document.getElementById('cart-total'); if(!c)return; const cart=await getStorage(KEY_CART); if(cart.length===0){c.innerHTML='<p style="text-align:center;">Cart Empty</p>';if(t)t.innerText='0';if(document.querySelector('.checkout-btn'))document.querySelector('.checkout-btn').style.display='none';return;} c.innerHTML=cart.map((x,i)=>{ let img=Array.isArray(x.images)&&x.images.length>0?x.images[0]:(x.image||''); return `<div class="cart-item"><div class="cart-item-info"><img src="${img}" style="width:60px;height:60px;object-fit:cover;border-radius:4px;"><div><h4>${x.name}</h4><p>৳${x.price} x ${x.qty}</p><div class="qty-controls"><button class="qty-btn" onclick="upQty(${i},-1)">-</button><span>${x.qty}</span><button class="qty-btn" onclick="upQty(${i},1)">+</button></div></div></div><div style="text-align:right;"><p style="font-weight:bold;color:#ff9f43;">৳${x.price*x.qty}</p><button onclick="rmC(${i})" style="color:#e74c3c;background:none;border:none;cursor:pointer;">Remove</button></div></div>`; }).join(''); if(t)t.innerText=cart.reduce((s,i)=>s+(i.price*i.qty),0); }
window.upQty=async(i,v)=>{let c=await getStorage(KEY_CART);c[i].qty+=v;if(c[i].qty<1){if(confirm("Remove?"))c.splice(i,1);else c[i].qty=1;}await setStorage(KEY_CART,c);await loadCartDisplay();await updateCartCount();}; window.rmC=async(i)=>{let c=await getStorage(KEY_CART);c.splice(i,1);await setStorage(KEY_CART,c);await loadCartDisplay();await updateCartCount();};
function handleCheckoutForm(){const f=document.getElementById('checkout-form');if(f){f.onsubmit=async(e)=>{e.preventDefault();const c=await getStorage(KEY_CART);if(c.length===0)return showPopup('Error','Empty Cart','error');let cnt=parseInt(await getStorage(KEY_ORDER_COUNT))||0;cnt++;await setStorage(KEY_ORDER_COUNT,cnt);const id='ORD-'+String(cnt).padStart(3,'0'),tot=c.reduce((s,i)=>s+(i.price*i.qty),0),ord={id:id,date:new Date().toLocaleDateString(),customer:{name:e.target.name.value,phone:e.target.phone.value,address:e.target.address.value},items:c,total:tot,status:'Pending'};const o=await getStorage(KEY_ORDERS);o.unshift(ord);await setStorage(KEY_ORDERS,o);await setStorage(KEY_CART,[]);await updateCartCount();const lst=c.map(i=>`- ${i.name} (x${i.qty})`).join('\n');showPopup('Order Confirmed!',`ID: ${id}\nName: ${ord.customer.name}\nPhone: ${ord.customer.phone}\n\n${lst}\n\nTotal: ৳${tot}\n\n* We will contact you soon.`,'success','index.html');};}}
async function loadCartSummaryForCheckout(){const el=document.getElementById('checkout-total');if(el){const c=await getStorage(KEY_CART);el.innerText=c.reduce((s,i)=>s+(i.price*i.qty),0);}}
function handleContactForm(){const f=document.getElementById('contact-form');if(f)f.onsubmit=async(e)=>{e.preventDefault();const m={id:Date.now(),date:new Date().toLocaleDateString(),name:e.target.name.value,email:e.target.email.value,subject:e.target.subject.value,text:e.target.message.value,isRead:false};const ms=await getStorage(KEY_MESSAGES);ms.unshift(m);await setStorage(KEY_MESSAGES,ms);e.target.reset();showPopup('Sent','Feedback Sent!','success');};}

// --- ADMIN: PRODUCT ADD (FIXED) ---
function initAdminProducts() {
    const form = document.getElementById('add-product-form');
    const tbody = document.querySelector('#product-table tbody');
    const previewContainer = document.getElementById('image-preview-container');
    const imageInput = document.getElementById('imageInput');

    // Render Product List
    const render = async () => {
        const p = await getStorage(KEY_PRODUCTS);
        if (p.length === 0) { tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px;">No Products Added</td></tr>'; document.getElementById('current-product-count').innerText = 0; return; }
        
        tbody.innerHTML = p.map((x,i)=> {
            let thumb = Array.isArray(x.images) && x.images.length > 0 ? x.images[0] : (x.image || '');
            return `
            <tr style="border-bottom:1px solid #333;">
                <td style="padding:10px;"><img src="${thumb}" style="width:50px;height:50px;object-fit:cover;border-radius:4px;"></td>
                <td style="padding:10px;">${x.name} ${x.isNewArrival?'<span style="color:#2ecc71;font-size:0.8em;">(New)</span>':''}</td>
                <td style="padding:10px;">৳${x.price}</td>
                <td style="padding:10px;text-align:right;"><button onclick="delP(${i})" style="color:#e74c3c;border:none;background:none;cursor:pointer;font-weight:bold;">Delete</button></td>
            </tr>`;
        }).join('');
        document.getElementById('current-product-count').innerText = p.length;
    };
    render();

    // Image Preview Logic
    let selectedFiles = [];
    if(imageInput) {
        imageInput.addEventListener('change', () => {
            previewContainer.innerHTML = '';
            selectedFiles = Array.from(imageInput.files); // Store files
            
            selectedFiles.forEach(file => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    previewContainer.innerHTML += `<img src="${e.target.result}" style="width:60px;height:60px;object-fit:cover;border-radius:4px;border:1px solid #555;">`;
                };
                reader.readAsDataURL(file);
            });
        });
    }

    // Form Submit Logic
    if(form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Process Images
            const readFiles = (files) => {
                const promises = [];
                for(let i=0; i<files.length; i++) {
                    promises.push(new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onload = (ev) => resolve(ev.target.result);
                        reader.readAsDataURL(files[i]);
                    }));
                }
                return Promise.all(promises);
            };

            let imgDataArray = [];
            if (selectedFiles.length > 0) {
                imgDataArray = await readFiles(selectedFiles);
            }

            // Save Product
            const p = await getStorage(KEY_PRODUCTS);
            p.push({
                id: Date.now(),
                name: document.getElementById('prodName').value,
                price: parseFloat(document.getElementById('prodPrice').value),
                originalPrice: document.getElementById('prodOldPrice').value ? parseFloat(document.getElementById('prodOldPrice').value) : null,
                isNewArrival: document.getElementById('isNew').checked,
                images: imgDataArray // Store Array
            });

            if(await setStorage(KEY_PRODUCTS, p)) {
                form.reset();
                previewContainer.innerHTML = '';
                selectedFiles = [];
                render();
                showPopup('Success', 'Product Added Successfully!', 'success');
            }
        });
    }

    window.delP = async (i) => { 
        if(confirm('Delete this product?')) { 
            const p = await getStorage(KEY_PRODUCTS); 
            p.splice(i, 1); 
            await setStorage(KEY_PRODUCTS, p); 
            render(); 
        } 
    };
}

// ... (Other Admin functions: Dashboard, Orders, Messages same as before) ...
async function initAdminDashboard() { const o = await getStorage(KEY_ORDERS); const p = await getStorage(KEY_PRODUCTS); const rev = o.filter(x => x.status === 'Delivered').reduce((s, i) => s + parseFloat(i.total), 0); const setT = (id, v) => { if(document.getElementById(id)) document.getElementById(id).innerText = v; }; setT('stat-revenue', '৳ ' + rev); setT('stat-pending', o.filter(x => x.status === 'Pending').length); setT('stat-shipped', o.filter(x => x.status === 'Shipped').length); setT('stat-delivered', o.filter(x => x.status === 'Delivered').length); setT('stat-cancelled', o.filter(x => x.status === 'Cancelled').length); setT('stat-products', p.length); }
function initAdminOrders() { const tb=document.querySelector('#orders-table tbody'); let flt='All'; const ren=async()=>{ const all=await getStorage(KEY_ORDERS); const l=flt==='All' ? all : all.filter(x=>x.status===flt); document.querySelectorAll('.filter-btn').forEach(b => { if(b.innerText.includes(flt)||(flt==='All'&&b.innerText==='All')||(flt==='Delivered'&&b.innerText==='Completed')) b.classList.add('active'); else b.classList.remove('active'); }); if(l.length===0) { tb.innerHTML='<tr><td colspan="5" style="text-align:center;">No Orders</td></tr>'; return; } tb.innerHTML = l.map(o => { const ix=all.findIndex(x=>x.id===o.id); let c='#ff9f43'; if(o.status==='Shipped')c='#3498db'; if(o.status==='Delivered')c='#2ecc71'; if(o.status==='Cancelled')c='#e74c3c'; return `<tr><td>${o.id}</td><td>${o.customer.name}</td><td>৳${o.total}</td><td><select onchange="upS(${ix},this.value)" style="color:${c};background:#222;border:1px solid ${c}"><option ${o.status==='Pending'?'selected':''}>Pending</option><option ${o.status==='Shipped'?'selected':''}>Shipped</option><option ${o.status==='Delivered'?'selected':''}>Delivered</option><option ${o.status==='Cancelled'?'selected':''}>Cancelled</option></select></td><td><button onclick="vOrd('${o.id}')" style="color:#fff;background:none;border:none;cursor:pointer;">View</button></td></tr>`; }).join(''); }; ren(); window.filterOrders=(s)=>{flt=s; ren();}; window.upS=async(i,v)=>{ const o=await getStorage(KEY_ORDERS); o[i].status=v; await setStorage(KEY_ORDERS,o); ren(); }; window.vOrd=async(id)=>{ const o=(await getStorage(KEY_ORDERS)).find(x=>x.id===id); if(!o)return; const items=o.items.map(i=>`- ${i.name} x${i.qty} (৳${i.price})`).join('\n'); showPopup('Order Details', `ID: ${o.id}\nName: ${o.customer.name}\nPhone: ${o.customer.phone}\nAddress: ${o.customer.address}\n\n${items}\n\nTotal: ৳${o.total}`, 'info'); }; }
function initAdminMessages() { const tb=document.querySelector('#messages-table tbody'); let vm='New'; const ren=async()=>{ const all=await getStorage(KEY_MESSAGES); const l=vm==='New'?all.filter(x=>!x.isRead):all.filter(x=>x.isRead); document.querySelectorAll('.filter-btn').forEach(b => { if(b.innerText.includes(vm)) b.classList.add('active'); else b.classList.remove('active'); }); if(l.length===0) { tb.innerHTML='<tr><td colspan="5" style="text-align:center;">No Messages</td></tr>'; } else { tb.innerHTML = l.map(m => { const ix=all.findIndex(x=>x.id===m.id); return `<tr><td>${m.date}</td><td>${m.name}<br><small style="color:#aaa;">${m.email}</small></td><td>${m.subject}</td><td>${m.text}</td><td>${!m.isRead?`<button onclick="mkR(${ix})" style="color:green;background:none;border:none;cursor:pointer;margin-right:5px;">Mark Read</button>`:''}<button onclick="delMsg(${idx})" style="color:red;background:none;border:none;cursor:pointer;">Del</button></td></tr>`; }).join(''); } }; ren(); window.filterMsgs=(m)=>{vm=m;ren();}; window.mkR=async(i)=>{const m=await getStorage(KEY_MESSAGES); m[i].isRead=true; await setStorage(KEY_MESSAGES, m); ren();}; window.delMsg=async(i)=>{if(confirm('Delete?')){const m=await getStorage(KEY_MESSAGES); m.splice(i,1); await setStorage(KEY_MESSAGES, m); ren();}}; }
