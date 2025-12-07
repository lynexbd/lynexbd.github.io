// ======================================================
// LYNEX FINAL SCRIPT (Stock & Size Management System)
// ======================================================

// --- 1. CONFIGURATION ---
const KEY_PRODUCTS = 'lynex_products';
const KEY_CART = 'lynex_cart';
const KEY_ORDERS = 'lynex_orders';
const KEY_MESSAGES = 'lynex_messages';
const KEY_ADMIN_TOKEN = 'lynex_secure_token_v99';
const KEY_ORDER_COUNT = 'lynex_order_counter';

// --- CREDENTIALS ---
const ADMIN_USER = "SysMaster_99";
const ADMIN_PASS = "L7n@x#Super!2025";

// --- FILE NAMES ---
const PAGE_LOGIN = 'k7_entry_point.html';
const PAGE_DASHBOARD = 'x_master_v9.html';

// --- BANGLADESH GEO DATA ---
const bdGeoData = {
    "Dhaka": { "Munshiganj": ["Munshiganj Sadar", "Sreenagar", "Sirajdikhan", "Louhajang", "Gajaria", "Tongibari"], "Dhaka": ["Savar", "Dhamrai", "Keraniganj", "Nawabganj", "Dohar", "Dhaka Sadar"], "Gazipur": ["Gazipur Sadar", "Kaliakair", "Kapasia", "Sreepur", "Kaliganj"], "Narayanganj": ["Narayanganj Sadar", "Bandar", "Araihazar", "Rupganj", "Sonargaon"] },
    "Chattogram": { "Chattogram": ["Chattogram Sadar", "Sitakunda", "Mirsharai", "Patiya", "Raozan"], "Cox's Bazar": ["Cox's Bazar Sadar", "Ramu", "Teknaf", "Ukhia"] },
    "Khulna": { "Khulna": ["Khulna Sadar", "Dumuria", "Phultala"], "Jessore": ["Jessore Sadar", "Benapole"] },
    "Rajshahi": { "Rajshahi": ["Rajshahi Sadar", "Godagari"], "Bogra": ["Bogra Sadar", "Sherpur"] },
    "Sylhet": { "Sylhet": ["Sylhet Sadar", "Beanibazar"], "Sunamganj": ["Sunamganj Sadar"] },
    "Barishal": { "Barishal": ["Barishal Sadar"], "Bhola": ["Bhola Sadar"] },
    "Rangpur": { "Rangpur": ["Rangpur Sadar"], "Dinajpur": ["Dinajpur Sadar"] },
    "Mymensingh": { "Mymensingh": ["Mymensingh Sadar", "Muktagachha"], "Jamalpur": ["Jamalpur Sadar"] }
};

// --- DATABASE SETUP (IndexedDB) ---
const DB_NAME = "Lynex_Reset_DB_V1"; 
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
        req.onerror = (e) => { alert("DB Error!"); resolve(null); };
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
        req.onerror = (e) => { console.error(e); resolve(false); };
    });
}

// --- 2. INITIALIZATION MANAGER ---
document.addEventListener('DOMContentLoaded', async function() {
    await initDB();
    createPopupHTML();

    const menuToggle = document.getElementById('menu-toggle');
    const navList = document.getElementById('nav-list');
    if (menuToggle) menuToggle.addEventListener('click', () => navList.classList.toggle('active'));
    
    await updateCartCount();

    // 1. LOGIN
    if (document.getElementById('secure-login-form')) handleLogin();

    // 2. ADMIN
    if (document.querySelector('.sidebar')) {
        if (!sessionStorage.getItem(KEY_ADMIN_TOKEN)) { window.location.href = PAGE_LOGIN; return; }
        await updateAdminSidebarBadges();
        if (document.getElementById('stat-revenue')) initAdminDashboard();
        if (document.getElementById('add-product-form')) initAdminProducts();
        if (document.getElementById('orders-table')) initAdminOrders();
        if (document.getElementById('messages-table')) initAdminMessages();
    }

    // 3. PUBLIC WEBSITE
    if (document.querySelector('.product-grid')) {
        const isHome = document.querySelector('.hero-section') !== null;
        loadProductsDisplay(isHome);
    }
    
    // 4. CHECKOUT
    if (document.getElementById('checkout-form')) {
        initAddressDropdowns();
        handleCheckoutForm();
        loadCartSummaryForCheckout();
    }
    if (document.querySelector('.cart-items') && !document.getElementById('checkout-form')) loadCartDisplay();
    if (document.getElementById('contact-form')) handleContactForm();
});

// --- 3. LOGIN & AUTH ---
function handleLogin() {
    if(sessionStorage.getItem(KEY_ADMIN_TOKEN)) { window.location.href = PAGE_DASHBOARD; return; }
    const form = document.getElementById('secure-login-form');
    form.onsubmit = (e) => {
        e.preventDefault();
        if (form.username.value.trim() === ADMIN_USER && form.password.value.trim() === ADMIN_PASS) {
            sessionStorage.setItem(KEY_ADMIN_TOKEN, "LOGGED_IN");
            window.location.href = PAGE_DASHBOARD;
        } else showPopup('Error', 'Invalid Credentials!', 'error');
    };
}
window.adminLogout = function() { sessionStorage.removeItem(KEY_ADMIN_TOKEN); window.location.href = PAGE_LOGIN; };

// --- 4. WEBSITE FUNCTIONS (DISPLAY & CART) ---
async function loadProductsDisplay(isHome) {
    let grid = document.querySelector('.product-grid'); if (!grid) return;
    let p = await getStorage(KEY_PRODUCTS);
    if (isHome) p = p.filter(x => x.isNewArrival);

    grid.innerHTML = p.length ? p.map(i => {
        let priceHTML = `<span class="current-price">৳ ${i.price}</span>`;
        let badge = '';
        if (i.originalPrice && i.originalPrice > i.price) {
            const d = Math.round(((i.originalPrice - i.price) / i.originalPrice) * 100);
            priceHTML = `<span class="old-price">৳ ${i.originalPrice}</span> <span class="current-price">৳ ${i.price}</span>`;
            badge = `<span class="discount-badge">-${d}% OFF</span>`;
        }

        // STOCK LOGIC
        const totalStock = (parseInt(i.stock?.s)||0) + (parseInt(i.stock?.m)||0) + (parseInt(i.stock?.l)||0) + (parseInt(i.stock?.xl)||0) + (parseInt(i.stock?.xxl)||0);
        let actionBtns = `
            <button onclick="addToCart('${i.id}')" class="btn secondary-btn">Add to Cart</button>
            <button onclick="buyNow('${i.id}')" class="btn primary-btn">Buy Now</button>
        `;
        let overlay = '';

        if (totalStock === 0) {
            badge = `<span class="discount-badge" style="background:#e74c3c;">OUT OF STOCK</span>`;
            actionBtns = `<button disabled class="btn secondary-btn" style="opacity:0.5; cursor:not-allowed;">Out of Stock</button>`;
            overlay = `<div style="position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);display:flex;justify-content:center;align-items:center;z-index:4;pointer-events:none;"><h3 style="color:#fff;border:2px solid #fff;padding:10px 20px;transform:rotate(-15deg);">SOLD OUT</h3></div>`;
        }

        let images = i.images && i.images.length ? i.images : [''];
        let slides = images.map((src) => `<img src="${src}" class="slider-image">`).join('');
        
        return `
        <div class="product-card">
            ${badge}
            ${overlay}
            <div class="image-wrapper">
                <div class="slider-container" id="slider-${i.id}" onscroll="updateActiveDot(this, '${i.id}')">${slides}</div>
            </div>
            <div class="product-info">
                <h3>${i.name}</h3>
                <div class="price-container">${priceHTML}</div>
                <div class="product-actions">${actionBtns}</div>
            </div>
        </div>`;
    }).join('') : '<p style="text-align:center;width:100%;color:#777;padding:50px;">No products.</p>';
}

window.updateActiveDot = (el, id) => { /* simplified for brevity */ };

// --- CART & STOCK LOGIC ---
window.addToCart = async (id) => {
    const p = (await getStorage(KEY_PRODUCTS)).find(x => x.id == id);
    if (!p) return;

    // 1. Check Total Stock
    const s = p.stock || {s:0, m:0, l:0, xl:0, xxl:0};
    const total = parseInt(s.s)+parseInt(s.m)+parseInt(s.l)+parseInt(s.xl)+parseInt(s.xxl);
    if(total <= 0) return showPopup('Sorry', 'This product is Out of Stock', 'error');

    // 2. Ask for Size (Simple Prompt)
    let availableSizes = [];
    if(s.s > 0) availableSizes.push('S');
    if(s.m > 0) availableSizes.push('M');
    if(s.l > 0) availableSizes.push('L');
    if(s.xl > 0) availableSizes.push('XL');
    if(s.xxl > 0) availableSizes.push('XXL');

    if(availableSizes.length === 0) return showPopup('Sorry', 'Stock Error', 'error');

    let size = prompt(`Select Size:\nAvailable: ${availableSizes.join(", ")}\n\nType the size name (e.g., M):`);
    if(!size) return;
    size = size.toUpperCase().trim();

    if(!availableSizes.includes(size)) {
        return showPopup('Invalid Size', `Please select from: ${availableSizes.join(", ")}`, 'error');
    }

    // 3. Check specific size stock vs Current Cart
    const currentStock = parseInt(s[size.toLowerCase()]);
    let c = await getStorage(KEY_CART);
    let ex = c.find(x => x.id == id && x.size == size);
    let currentQtyInCart = ex ? ex.qty : 0;

    if(currentQtyInCart + 1 > currentStock) {
        return showPopup('Stock Limited', `Only ${currentStock} items available in size ${size}.`, 'error');
    }

    // 4. Add
    if(ex) ex.qty++; else c.push({...p, size: size, qty: 1}); // Store size in cart
    await setStorage(KEY_CART, c); 
    await updateCartCount(); 
    showPopup('Success', `Added to Cart (Size: ${size})`, 'success');
};

window.buyNow = async (id) => { await window.addToCart(id); setTimeout(()=>window.location.href='checkout.html', 500); };

async function loadCartDisplay() {
    const c = document.querySelector('.cart-items'); const t = document.getElementById('cart-total'); if(!c) return;
    const cart = await getStorage(KEY_CART);
    if(cart.length===0) { c.innerHTML='<p style="text-align:center;">Empty</p>'; if(t)t.innerText='0'; return; }
    
    // Validate stock on load (in case admin changed it)
    let finalCart = [];
    let stockChanged = false;
    const products = await getStorage(KEY_PRODUCTS);

    for(let item of cart) {
        const prod = products.find(p => p.id == item.id);
        if(prod) {
            const available = parseInt(prod.stock[item.size.toLowerCase()] || 0);
            if(item.qty > available) {
                item.qty = available;
                stockChanged = true;
            }
            if(item.qty > 0) finalCart.push(item);
        }
    }
    if(stockChanged) {
        await setStorage(KEY_CART, finalCart);
        alert("Some items in your cart were adjusted due to stock availability.");
    }

    c.innerHTML = finalCart.map((x,i)=> `
        <div class="cart-item">
            <div class="cart-item-info">
                <img src="${x.images[0]||''}" style="width:60px;height:60px;object-fit:cover;border-radius:4px;">
                <div>
                    <h4>${x.name} <span style="font-size:0.8em; color:#ff9f43;">(Size: ${x.size})</span></h4>
                    <p>৳${x.price} x ${x.qty}</p>
                    <div class="qty-controls">
                        <button class="qty-btn" onclick="upQty(${i},-1)">-</button>
                        <span>${x.qty}</span>
                        <button class="qty-btn" onclick="upQty(${i},1)">+</button>
                    </div>
                </div>
            </div>
            <div style="text-align:right;">
                <p style="font-weight:bold;color:#ff9f43;">৳${x.price*x.qty}</p>
                <button onclick="rmC(${i})" style="color:#e74c3c;background:none;border:none;cursor:pointer;">Remove</button>
            </div>
        </div>`).join('');
    if(t) t.innerText = finalCart.reduce((s,i)=>s+(i.price*i.qty),0);
}

window.upQty = async (i, v) => {
    let c = await getStorage(KEY_CART);
    const item = c[i];
    
    // Check Stock Limit before increasing
    if (v > 0) {
        const products = await getStorage(KEY_PRODUCTS);
        const prod = products.find(p => p.id == item.id);
        const available = parseInt(prod.stock[item.size.toLowerCase()] || 0);
        if (item.qty + 1 > available) {
            return alert(`Sorry, only ${available} items in stock for size ${item.size}.`);
        }
    }

    item.qty += v;
    if(item.qty < 1) { if(confirm("Remove?")) c.splice(i,1); else item.qty=1; }
    await setStorage(KEY_CART, c);
    await loadCartDisplay();
    await updateCartCount();
};
window.rmC = async(i)=>{ let c=await getStorage(KEY_CART); c.splice(i,1); await setStorage(KEY_CART,c); await loadCartDisplay(); await updateCartCount(); };

// --- 5. ADMIN FUNCTIONS (WITH SIZE/STOCK) ---
function initAdminProducts() {
    const f=document.getElementById('add-product-form'); const tb=document.querySelector('#product-table tbody'); const input=document.getElementById('imageInput');
    
    const render = async () => {
        const p = await getStorage(KEY_PRODUCTS);
        document.getElementById('current-product-count').innerText = p.length;
        if(p.length===0){ tb.innerHTML='<tr><td colspan="5" style="text-align:center;">Empty</td></tr>'; return; }
        
        tb.innerHTML = p.map((x,i)=> {
            const s = x.stock || {s:0, m:0, l:0, xl:0, xxl:0};
            const stockStr = `S:${s.s}, M:${s.m}, L:${s.l}, XL:${s.xl}, XXL:${s.xxl}`;
            return `<tr>
                <td><img src="${x.images[0]}" style="width:40px;"></td>
                <td>${x.name}</td>
                <td>৳${x.price}</td>
                <td>
                    <small style="color:#aaa;">${stockStr}</small><br>
                    <button onclick="openStockModal('${x.id}')" style="color:#ff9f43; background:none; border:1px solid #ff9f43; padding:2px 5px; cursor:pointer; font-size:0.8em;">Edit Stock</button>
                </td>
                <td style="text-align:right;"><button onclick="delP(${i})" style="color:red;border:none;background:none;">Del</button></td>
            </tr>`;
        }).join('');
    };
    render();

    if(f) f.addEventListener('submit',async(e)=>{
        e.preventDefault();
        const files=Array.from(input.files); 
        const readFiles=(fl)=>Promise.all(fl.map(f=>new Promise(r=>{const fr=new FileReader(); fr.onload=()=>r(fr.result); fr.readAsDataURL(f);}))); 
        let imgData=[]; if(files.length) imgData=await readFiles(files);
        
        // Capture Stock
        const stock = {
            s: parseInt(f.stock_s.value)||0,
            m: parseInt(f.stock_m.value)||0,
            l: parseInt(f.stock_l.value)||0,
            xl: parseInt(f.stock_xl.value)||0,
            xxl: parseInt(f.stock_xxl.value)||0
        };

        const p = await getStorage(KEY_PRODUCTS);
        p.push({
            id: Date.now(), 
            name: f.name.value, 
            price: parseFloat(f.price.value), 
            originalPrice: f.oldPrice.value?parseFloat(f.oldPrice.value):null, 
            isNewArrival: f.isNew.checked, 
            images: imgData,
            stock: stock // Save Stock Object
        });
        await setStorage(KEY_PRODUCTS, p); 
        f.reset(); render(); showPopup('Success', 'Product Added!', 'success');
    });

    window.delP=async(i)=>{if(confirm('Delete?')){const p=await getStorage(KEY_PRODUCTS);p.splice(i,1);await setStorage(KEY_PRODUCTS,p);render();}};
    
    // Edit Stock Modal Logic
    window.openStockModal = async (id) => {
        const p = await getStorage(KEY_PRODUCTS);
        const prod = p.find(x => x.id == id);
        if(!prod) return;
        const s = prod.stock || {s:0, m:0, l:0, xl:0, xxl:0};
        
        document.getElementById('edit-prod-id').value = id;
        document.getElementById('edit-s').value = s.s;
        document.getElementById('edit-m').value = s.m;
        document.getElementById('edit-l').value = s.l;
        document.getElementById('edit-xl').value = s.xl;
        document.getElementById('edit-xxl').value = s.xxl;
        document.getElementById('editStockModal').classList.add('active');
    };

    window.closeStockModal = () => document.getElementById('editStockModal').classList.remove('active');

    window.saveStockUpdate = async () => {
        const id = document.getElementById('edit-prod-id').value;
        const p = await getStorage(KEY_PRODUCTS);
        const prod = p.find(x => x.id == id);
        if(prod) {
            prod.stock = {
                s: parseInt(document.getElementById('edit-s').value)||0,
                m: parseInt(document.getElementById('edit-m').value)||0,
                l: parseInt(document.getElementById('edit-l').value)||0,
                xl: parseInt(document.getElementById('edit-xl').value)||0,
                xxl: parseInt(document.getElementById('edit-xxl').value)||0
            };
            await setStorage(KEY_PRODUCTS, p);
            closeStockModal();
            render();
            showPopup('Success', 'Stock Updated!', 'success');
        }
    };
}

// --- CHECKOUT & OTHERS (Standard) ---
function initAddressDropdowns() {
    const divisionSelect = document.getElementById("division"); if (!divisionSelect) return;
    for (let div in bdGeoData) { let option = document.createElement("option"); option.value = div; option.text = div; divisionSelect.appendChild(option); }
}
window.loadDistricts = function() {
    const division = document.getElementById("division").value; const districtSelect = document.getElementById("district"); const upazilaSelect = document.getElementById("upazila");
    districtSelect.innerHTML = '<option value="">Select District</option>'; upazilaSelect.innerHTML = '<option value="">Select Upazila</option>'; districtSelect.disabled = true; upazilaSelect.disabled = true;
    if (division && bdGeoData[division]) { districtSelect.disabled = false; for (let dist in bdGeoData[division]) { let option = document.createElement("option"); option.value = dist; option.text = dist; districtSelect.appendChild(option); } } calculateTotal();
}
window.loadUpazilas = function() {
    const division = document.getElementById("division").value; const district = document.getElementById("district").value; const upazilaSelect = document.getElementById("upazila");
    upazilaSelect.innerHTML = '<option value="">Select Upazila</option>'; upazilaSelect.disabled = true;
    if (district && bdGeoData[division][district]) { upazilaSelect.disabled = false; bdGeoData[division][district].forEach(function(upazila) { let option = document.createElement("option"); option.value = upazila; option.text = upazila; upazilaSelect.appendChild(option); }); } calculateTotal();
}
window.calculateTotal = function() {
    const dist = document.getElementById('district').value; const upz = document.getElementById('upazila').value; const subTotalElem = document.getElementById('checkout-subtotal'); const chargeElem = document.getElementById('delivery-charge'); const grandElem = document.getElementById('checkout-grand-total'); if(!subTotalElem) return;
    let charge = 0; if (dist === "Munshiganj") { charge = (upz === "Munshiganj Sadar") ? 60 : (upz ? 120 : 0); } else if (dist) { charge = 120; }
    const subTotal = parseInt(subTotalElem.innerText) || 0; chargeElem.innerText = charge; grandElem.innerText = subTotal + charge;
}
function handleCheckoutForm() {
    const f = document.getElementById('checkout-form');
    if(f) {
        f.onsubmit = async (e) => {
            e.preventDefault();
            const phoneInput = document.getElementById('phone'); const phoneVal = phoneInput.value.trim(); const validPrefixes = ['017', '019', '018', '014', '015', '013', '016'];
            if (phoneVal.length !== 11 || !validPrefixes.includes(phoneVal.substring(0, 3))) { return alert("Invalid Phone Number"); }
            const div = document.getElementById('division').value; const dist = document.getElementById('district').value; const upz = document.getElementById('upazila').value; const vill = document.getElementById('village').value;
            if(!div || !dist || !upz || !vill) { return showPopup('Missing Info', 'Address incomplete', 'error'); }

            const c = await getStorage(KEY_CART); if(c.length===0) return showPopup('Error', 'Cart Empty', 'error');
            
            // Reduce Stock Logic Here
            const products = await getStorage(KEY_PRODUCTS);
            for(let item of c) {
                const p = products.find(x => x.id == item.id);
                if(p) {
                    p.stock[item.size.toLowerCase()] -= item.qty; // Deduct stock
                    if(p.stock[item.size.toLowerCase()] < 0) p.stock[item.size.toLowerCase()] = 0; // Safety check
                }
            }
            await setStorage(KEY_PRODUCTS, products); // Save updated stock

            let cnt = parseInt(await getStorage(KEY_ORDER_COUNT))||0; cnt++; await setStorage(KEY_ORDER_COUNT, cnt);
            const id = 'ORD-'+String(cnt).padStart(3,'0'); const deliveryCharge = parseInt(document.getElementById('delivery-charge').innerText) || 0; const subTot = c.reduce((s,i)=>s+(i.price*i.qty),0); const grandTot = subTot + deliveryCharge;
            const fullAddress = `Vill: ${vill}, ${f.landmark?f.landmark.value:''}, Upz: ${upz}, Dist: ${dist}, Div: ${div}`;
            const ord = { id: id, date: new Date().toLocaleDateString(), customer: { name: f.name.value, phone: phoneVal, address: fullAddress }, items: c, subTotal: subTot, deliveryCharge: deliveryCharge, total: grandTot, status: 'Pending' };
            const o = await getStorage(KEY_ORDERS); o.unshift(ord); await setStorage(KEY_ORDERS, o); await setStorage(KEY_CART, []); await updateCartCount();
            showPopup('Order Confirmed!', `ID: ${id}`, 'success', 'index.html');
        };
    }
}
async function loadCartSummaryForCheckout() { const el = document.getElementById('checkout-subtotal'); if(el) { const c = await getStorage(KEY_CART); const sub = c.reduce((s,i)=>s+(i.price*i.qty),0); el.innerText = sub; calculateTotal(); } }

function initAdminOrders() { /* ...Same as before... */ const tb=document.querySelector('#orders-table tbody'); let flt='All'; const ren=async()=>{ const all=await getStorage(KEY_ORDERS); const l=flt==='All'?all:all.filter(o=>o.status===flt); if(l.length===0){tb.innerHTML='<tr><td colspan="5">No Orders</td></tr>';return;} tb.innerHTML=l.map((o,ix)=>`<tr><td>${o.id}</td><td>${o.customer.name}</td><td>৳${o.total}</td><td>${o.status}</td><td><button onclick="vOrd('${o.id}')">View</button></td></tr>`).join(''); }; ren(); window.vOrd=async(id)=>{const o=(await getStorage(KEY_ORDERS)).find(x=>x.id===id);if(!o)return;const items=o.items.map(i=>`- ${i.name} (${i.size}) x${i.qty}`).join('\n');showPopup('Details',`ID: ${o.id}\n${items}\nTotal: ৳${o.total}`,'info');}; }
function initAdminMessages() { /* ...Same as before... */ }
async function initAdminDashboard() { /* ...Same as before... */ }
function createPopupHTML() { if(!document.querySelector('.custom-popup-overlay')) { const p=document.createElement('div'); p.className='custom-popup-overlay'; p.innerHTML=`<div class="custom-popup-box"><i class="fas fa-info-circle popup-icon"></i><h3 class="popup-title"></h3><p class="popup-msg"></p><button class="btn primary-btn popup-btn">OK</button></div>`; document.body.appendChild(p); p.querySelector('.popup-btn').addEventListener('click', () => { p.classList.remove('active'); if(window.popupRedirect) { window.location.href=window.popupRedirect; window.popupRedirect=null; } }); } }
function showPopup(title, msg, type='info', url=null) { const o=document.querySelector('.custom-popup-overlay'); if(!o) return alert(msg); const i=o.querySelector('.popup-icon'); o.querySelector('.popup-title').innerText=title; o.querySelector('.popup-msg').innerHTML=msg.replace(/\n/g, '<br>'); if(type==='success') i.className='fas fa-check-circle popup-icon popup-success'; else if(type==='error') i.className='fas fa-times-circle popup-icon popup-error'; else i.className='fas fa-info-circle popup-icon popup-info'; if(url) window.popupRedirect=url; o.classList.add('active'); }
async function updateAdminSidebarBadges() { /* ... */ }
async function updateCartCount() { const c = await getStorage(KEY_CART); const t = c.reduce((s, i) => s + (parseInt(i.qty)||0), 0); document.querySelectorAll('.cart-count').forEach(e => e.innerText = `(${t})`); }
