// ======================================================
// LYNEX FINAL SCRIPT (Fixed Admin Order Filter Tab)
// ======================================================

// --- 1. CONFIGURATION ---
const KEY_PRODUCTS = 'lynex_products';
const KEY_CART = 'lynex_cart';
const KEY_ORDERS = 'lynex_orders';
const KEY_MESSAGES = 'lynex_messages';
const KEY_ADMIN_TOKEN = 'lynex_secure_token_v99';
const KEY_ORDER_COUNT = 'lynex_order_counter';
const KEY_DIRECT_BUY = 'lynex_direct_buy'; 

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

// --- DATABASE SETUP ---
const DB_NAME = "Lynex_Reset_DB_V14"; 
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
        req.onerror = (e) => { console.error(e); resolve(false); };
    });
}

// --- 2. INITIALIZATION MANAGER ---
document.addEventListener('DOMContentLoaded', async function() {
    await initDB();
    createPopupHTML();
    createSizeModalHTML();

    if (window.location.pathname.includes('cart.html')) {
        sessionStorage.removeItem(KEY_DIRECT_BUY);
    }

    const menuToggle = document.getElementById('menu-toggle');
    const navList = document.getElementById('nav-list');
    if (menuToggle) menuToggle.addEventListener('click', () => navList.classList.toggle('active'));
    
    await updateCartCount();

    if (document.getElementById('secure-login-form')) handleLogin();

    if (document.querySelector('.sidebar')) {
        if (!sessionStorage.getItem(KEY_ADMIN_TOKEN)) { window.location.href = PAGE_LOGIN; return; }
        highlightAdminNav();
        await updateAdminSidebarBadges();
        if (document.getElementById('stat-revenue')) initAdminDashboard();
        if (document.getElementById('add-product-form')) initAdminProducts();
        if (document.getElementById('orders-table')) initAdminOrders();
        if (document.getElementById('messages-table')) initAdminMessages();
    }

    if (document.querySelector('.product-grid')) {
        const isHome = document.querySelector('.hero-section') !== null;
        loadProductsDisplay(isHome);
    }
    
    if (document.getElementById('checkout-form')) {
        initAddressDropdowns();
        handleCheckoutForm();
        loadCartSummaryForCheckout();
    }
    
    if (document.querySelector('.cart-items') && !document.getElementById('checkout-form')) loadCartDisplay();
    
    const contactForm = document.getElementById('contact-form') || document.querySelector('form[action="feedback.html"]');
    if (contactForm) handleContactForm(contactForm);
});

function highlightAdminNav() {
    const path = window.location.pathname;
    const page = path.split("/").pop();
    document.querySelectorAll('.sidebar ul li a').forEach(a => {
        a.classList.remove('admin-active');
        if(a.getAttribute('href') === page) a.classList.add('admin-active');
    });
}

// --- 3. LOGIN ---
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

// --- 4. DISPLAY PRODUCTS ---
async function loadProductsDisplay(isHome) {
    let grid = document.querySelector('.product-grid'); if (!grid) return;
    let p = await getStorage(KEY_PRODUCTS);
    if (isHome) p = p.filter(x => x.isNewArrival);

    grid.innerHTML = p.length ? p.map(i => {
        let priceHTML = `<span class="current-price">৳ ${i.price}</span>`;
        let discountBadge = '';
        if (i.originalPrice && i.originalPrice > i.price) {
            const d = Math.round(((i.originalPrice - i.price) / i.originalPrice) * 100);
            priceHTML = `<span class="old-price">৳ ${i.originalPrice}</span> <span class="current-price">৳ ${i.price}</span>`;
            discountBadge = `<span class="discount-badge">-${d}% OFF</span>`;
        }

        const s = i.stock || {s:0, m:0, l:0, xl:0, xxl:0};
        const totalStock = (parseInt(s.s)||0) + (parseInt(s.m)||0) + (parseInt(s.l)||0) + (parseInt(s.xl)||0) + (parseInt(s.xxl)||0);
        let stockRibbon = '', btnState = '', cardClass = '';

        if (totalStock === 0) {
            stockRibbon = `<div class="stock-ribbon">STOCK OUT</div>`;
            btnState = 'disabled style="opacity:0.5; cursor:not-allowed;"';
            cardClass = 'out-of-stock';
        }

        let images = i.images && i.images.length ? i.images : [''];
        let slides = images.map((src) => `<img src="${src}" class="slider-image">`).join('');
        let dots = '';
        if (images.length > 1) {
            dots = `<div class="slider-dots" id="dots-${i.id}">
                ${images.map((_, idx) => `<span class="dot ${idx===0?'active':''}" onclick="goToSlide(${idx}, '${i.id}')"></span>`).join('')}
            </div>`;
        }
        
        return `
        <div class="product-card ${cardClass}">
            <div class="image-wrapper">
                ${discountBadge}
                ${stockRibbon}
                <div class="slider-container" id="slider-${i.id}" onscroll="updateActiveDot(this, '${i.id}')">${slides}</div>
                ${dots}
            </div>
            <div class="product-info">
                <h3>${i.name}</h3>
                <div class="price-container">${priceHTML}</div>
                <div class="product-actions">
                    <button onclick="openSizeSelector('${i.id}', 'cart')" class="btn secondary-btn" ${btnState}>Add to Cart</button>
                    <button onclick="openSizeSelector('${i.id}', 'buy')" class="btn primary-btn" ${btnState}>Buy Now</button>
                </div>
            </div>
        </div>`;
    }).join('') : '<p style="text-align:center;width:100%;color:#777;padding:50px;">No products.</p>';
}

window.updateActiveDot = (el, id) => { 
    const idx = Math.round(el.scrollLeft / el.offsetWidth);
    const dots = document.querySelectorAll(`#dots-${id} .dot`);
    dots.forEach(d => d.classList.remove('active'));
    if(dots[idx]) dots[idx].classList.add('active');
};
window.goToSlide = (n, id) => { 
    const el = document.getElementById(`slider-${id}`); 
    el.scrollTo({ left: el.offsetWidth * n, behavior: 'smooth' }); 
};

// --- 5. SIZE MODAL ---
function createSizeModalHTML() {
    if(document.querySelector('.size-modal-overlay')) return;
    const html = `
    <div class="size-modal-overlay" id="sizeModal">
        <div class="size-modal-box">
            <button class="close-modal-btn" onclick="closeSizeModal()">&times;</button>
            <h3 style="color:#fff; margin-bottom:10px;">Select Size</h3>
            <p id="modal-product-name" style="color:#aaa; font-size:0.9em; margin-bottom:20px;"></p>
            <div class="size-grid" id="modal-size-container"></div>
            <div id="modal-qty-area" style="display:none;">
                <p style="color:#ccc; margin-bottom:10px;">Quantity</p>
                <div class="qty-selector">
                    <button class="qty-action-btn" onclick="adjustModalQty(-1)"><i class="fas fa-minus"></i></button>
                    <span class="qty-display" id="modal-qty-val">1</span>
                    <button class="qty-action-btn" onclick="adjustModalQty(1)"><i class="fas fa-plus"></i></button>
                </div>
                <button id="modal-confirm-btn" class="btn primary-btn" style="width:100%; padding:12px;">CONFIRM</button>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
}

let currentModalProductId = null, currentModalAction = null, currentSelectedSize = null, currentModalQty = 1, currentMaxStock = 0;

window.openSizeSelector = async (id, action) => {
    const products = await getStorage(KEY_PRODUCTS);
    const p = products.find(x => x.id == id);
    if (!p) return;

    currentModalProductId = id; currentModalAction = action; currentSelectedSize = null; currentModalQty = 1;
    document.getElementById('modal-product-name').innerText = p.name;
    document.getElementById('modal-qty-val').innerText = '1';
    document.getElementById('modal-qty-area').style.display = 'none';
    
    const sizeContainer = document.getElementById('modal-size-container');
    sizeContainer.innerHTML = '';

    const s = p.stock || {s:0, m:0, l:0, xl:0, xxl:0};
    const sizes = ['s', 'm', 'l', 'xl', 'xxl'];
    let hasStock = false;

    sizes.forEach(sizeKey => {
        const stockCount = parseInt(s[sizeKey]) || 0;
        if (stockCount > 0) {
            hasStock = true;
            const btn = document.createElement('button');
            btn.className = 'size-btn';
            btn.innerText = sizeKey.toUpperCase();
            btn.onclick = () => selectSizeInModal(sizeKey.toUpperCase(), stockCount, btn);
            sizeContainer.appendChild(btn);
        }
    });

    if (!hasStock) return showPopup('Stock Out', 'Sorry, this product is out of stock.', 'error');
    document.getElementById('sizeModal').classList.add('active');
    document.getElementById('modal-confirm-btn').onclick = confirmSizeSelection;
};

function selectSizeInModal(size, maxStock, btnElement) {
    currentSelectedSize = size; currentMaxStock = maxStock; currentModalQty = 1; 
    document.getElementById('modal-qty-val').innerText = '1';
    document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected'));
    btnElement.classList.add('selected');
    document.getElementById('modal-qty-area').style.display = 'block';
}

window.adjustModalQty = (change) => {
    let newQty = currentModalQty + change;
    if (newQty < 1) newQty = 1;
    if (newQty > currentMaxStock) { newQty = currentMaxStock; alert(`Stock Limit: Only ${currentMaxStock} available.`); }
    currentModalQty = newQty;
    document.getElementById('modal-qty-val').innerText = currentModalQty;
};

async function confirmSizeSelection() {
    if (!currentSelectedSize || !currentModalProductId) return;
    const p = (await getStorage(KEY_PRODUCTS)).find(x => x.id == currentModalProductId);
    
    if (currentModalAction === 'buy') {
        const directItem = [{ ...p, size: currentSelectedSize, qty: currentModalQty }];
        sessionStorage.setItem(KEY_DIRECT_BUY, JSON.stringify(directItem));
        closeSizeModal();
        window.location.href = 'checkout.html';
        return;
    }

    sessionStorage.removeItem(KEY_DIRECT_BUY); 
    let c = await getStorage(KEY_CART);
    let ex = c.find(x => x.id == currentModalProductId && x.size == currentSelectedSize);
    
    if (ex) {
        if (ex.qty + currentModalQty > currentMaxStock) return alert(`Cart limit reached.`);
        ex.qty += currentModalQty;
    } else {
        c.push({ ...p, size: currentSelectedSize, qty: currentModalQty });
    }

    await setStorage(KEY_CART, c); await updateCartCount(); closeSizeModal();
    showPopup('Success', `Added to Cart!<br>${p.name}<br>Size: ${currentSelectedSize}, Qty: ${currentModalQty}`, 'success');
}

window.closeSizeModal = () => { document.getElementById('sizeModal').classList.remove('active'); };

// --- 6. CHECKOUT LOGIC ---
async function getCheckoutItems() {
    const directBuyData = sessionStorage.getItem(KEY_DIRECT_BUY);
    if (directBuyData) {
        return JSON.parse(directBuyData); 
    } else {
        return await getStorage(KEY_CART); 
    }
}

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

// Validation Helper
function showError(inputId, errorId) {
    document.getElementById(inputId).classList.add('input-error');
    document.getElementById(errorId).style.display = 'block';
}
function clearError(inputId, errorId) {
    document.getElementById(inputId).classList.remove('input-error');
    document.getElementById(errorId).style.display = 'none';
}

function handleCheckoutForm() {
    const f = document.getElementById('checkout-form');
    if(f) {
        f.onsubmit = async (e) => {
            e.preventDefault();
            
            let isValid = true;
            if (f.name.value.trim() === "") { showError('name', 'name-error'); isValid = false; } else { clearError('name', 'name-error'); }
            const phoneVal = f.phone.value.trim();
            const validPrefixes = ['017', '019', '018', '014', '015', '013', '016'];
            if (phoneVal.length !== 11 || !validPrefixes.includes(phoneVal.substring(0, 3))) { showError('phone', 'phone-error'); isValid = false; } else { clearError('phone', 'phone-error'); }
            const div = document.getElementById('division'); if(div.value==="") { showError('division','division-error'); isValid=false; } else clearError('division','division-error');
            const dist = document.getElementById('district'); if(dist.value==="") { showError('district','district-error'); isValid=false; } else clearError('district','district-error');
            const upz = document.getElementById('upazila'); if(upz.value==="") { showError('upazila','upazila-error'); isValid=false; } else clearError('upazila','upazila-error');
            const vill = document.getElementById('village'); if(vill.value.trim()==="") { showError('village','village-error'); isValid=false; } else clearError('village','village-error');

            if(!isValid) {
                const firstError = document.querySelector('.input-error');
                if(firstError) firstError.scrollIntoView({behavior: "smooth", block: "center"});
                return;
            }

            const c = await getCheckoutItems(); 
            if(c.length===0) return showPopup('Error', 'No items to checkout!', 'error');
            
            const products = await getStorage(KEY_PRODUCTS);
            for(let item of c) {
                const p = products.find(x => x.id == item.id);
                if(p) { p.stock[item.size.toLowerCase()] -= item.qty; if(p.stock[item.size.toLowerCase()] < 0) p.stock[item.size.toLowerCase()] = 0; }
            }
            await setStorage(KEY_PRODUCTS, products);

            let cnt = parseInt(await getStorage(KEY_ORDER_COUNT))||0; cnt++; await setStorage(KEY_ORDER_COUNT, cnt);
            const id = 'ORD-'+String(cnt).padStart(3,'0'); const deliveryCharge = parseInt(document.getElementById('delivery-charge').innerText) || 0; const subTot = c.reduce((s,i)=>s+(i.price*i.qty),0); const grandTot = subTot + deliveryCharge;
            const fullAddress = `Vill: ${vill.value}, ${document.getElementById('landmark').value}, Upz: ${upz.value}, Dist: ${dist.value}, Div: ${div.value}`;
            const ord = { id: id, date: new Date().toLocaleDateString(), customer: { name: f.name.value, phone: phoneVal, address: fullAddress }, items: c, subTotal: subTot, deliveryCharge: deliveryCharge, total: grandTot, status: 'Pending' };
            
            const o = await getStorage(KEY_ORDERS); o.unshift(ord); await setStorage(KEY_ORDERS, o);
            
            if(sessionStorage.getItem(KEY_DIRECT_BUY)) sessionStorage.removeItem(KEY_DIRECT_BUY);
            else { await setStorage(KEY_CART, []); await updateCartCount(); }
            
            const itemDetails = c.map(i => `
                <div style="display:flex; justify-content:space-between; font-size:0.9em; margin-bottom:5px; border-bottom: 1px dashed #444; padding-bottom: 3px;">
                    <span>${i.name} (${i.size})</span>
                    <span>৳${i.price} x ${i.qty} = <b style="color:#fff;">৳${i.price*i.qty}</b></span>
                </div>
            `).join('');

            const msg = `
                <div style="text-align:left; font-size:0.95em;">
                    <p style="margin-bottom:5px;"><strong>Name:</strong> ${f.name.value}</p>
                    <p style="margin-bottom:5px;"><strong>Phone:</strong> ${phoneVal}</p>
                    <p style="margin-bottom:10px; color:#aaa; font-size:0.85em;"><strong>Address:</strong> ${fullAddress}</p>
                    <p style="margin-bottom:5px; color:#ff9f43; margin-top:15px;"><strong>Order Items:</strong></p>
                    ${itemDetails}
                    <div style="margin-top: 15px; border-top: 1px solid #555; padding-top: 10px;">
                        <div style="display:flex; justify-content:space-between;"><span>Subtotal:</span><span>৳${subTot}</span></div>
                        <div style="display:flex; justify-content:space-between;"><span>Delivery:</span><span>৳${deliveryCharge}</span></div>
                        <div style="display:flex; justify-content:space-between; font-size:1.3em; color:#ff9f43; font-weight:bold; margin-top:5px;"><span>Total:</span><span>৳${grandTot}</span></div>
                    </div>
                    <p style="margin-top:15px; text-align:center; font-size:0.8em; color:#777;">Order ID: ${id}</p>
                </div>`;
            showPopup('Order Placed Successfully!', msg, 'success', 'index.html');
        };
    }
}

async function loadCartSummaryForCheckout() { 
    const el = document.getElementById('checkout-subtotal'); 
    const listEl = document.getElementById('checkout-items-list');
    
    if(el && listEl) { 
        const c = await getCheckoutItems();
        
        listEl.innerHTML = c.map(item => `
            <div class="checkout-item-preview">
                <img src="${item.images[0]||''}" class="checkout-item-img">
                <div class="checkout-item-details" style="flex:1;">
                    <h4 style="font-size:0.95em; margin-bottom:4px;">${item.name} <span style="font-size:0.8em; color:#aaa;">(${item.size})</span></h4>
                    <div style="display:flex; justify-content:space-between; font-size:0.9em;">
                        <span style="color:#ccc;">৳${item.price} x ${item.qty}</span>
                        <span style="color:#ff9f43; font-weight:bold;">= ৳${item.price * item.qty}</span>
                    </div>
                </div>
            </div>`).join('');

        const sub = c.reduce((s,i)=>s+(i.price*i.qty),0); 
        el.innerText = sub; 
        calculateTotal(); 
    } 
}

// --- CART DISPLAY (Empty State) ---
async function loadCartDisplay() {
    const c = document.querySelector('.cart-items'); const t = document.getElementById('cart-total'); 
    const summarySection = document.querySelector('.cart-summary');
    if(!c) return;

    const cart = await getStorage(KEY_CART);
    
    if(cart.length===0) { 
        c.innerHTML=`
            <div style="text-align:center; padding: 40px 0;">
                <i class="fas fa-shopping-basket" style="font-size: 3em; color: #444; margin-bottom: 20px;"></i>
                <h3 style="color:#fff; margin-bottom: 10px;">Your Cart is Empty</h3>
                <p style="color:#aaa; margin-bottom: 25px;">Looks like you haven't added anything yet.</p>
                <a href="products.html" class="btn primary-btn">SHOP COLLECTION</a>
            </div>`; 
        if(t) t.innerText='0'; 
        if(summarySection) summarySection.style.display = 'none'; 
        return; 
    }

    if(summarySection) summarySection.style.display = 'block';

    c.innerHTML = cart.map((x,i)=> `
        <div class="cart-item">
            <div class="cart-item-info">
                <img src="${x.images[0]||''}" style="width:60px;height:60px;object-fit:cover;border-radius:4px;">
                <div>
                    <h4>${x.name} <span style="background:#333; padding:2px 6px; border-radius:4px; font-size:0.8em; color:#ff9f43; margin-left:5px;">Size: ${x.size}</span></h4>
                    <p>৳${x.price} x ${x.qty}</p>
                    <div class="qty-controls">
                        <button class="qty-btn" onclick="upQty(${i},-1)"><i class="fas fa-minus"></i></button>
                        <span>${x.qty}</span>
                        <button class="qty-btn" onclick="upQty(${i},1)"><i class="fas fa-plus"></i></button>
                    </div>
                </div>
            </div>
            <div style="text-align:right;">
                <p style="font-weight:bold;color:#ff9f43;">৳${x.price*x.qty}</p>
                <button onclick="rmC(${i})" style="color:#e74c3c;background:none;border:none;cursor:pointer;">Remove</button>
            </div>
        </div>`).join('');
    if(t) t.innerText = cart.reduce((s,i)=>s+(i.price*i.qty),0);
}

window.upQty = async (i, v) => {
    let c = await getStorage(KEY_CART); const item = c[i];
    if (v > 0) {
        const products = await getStorage(KEY_PRODUCTS); const prod = products.find(p => p.id == item.id);
        const avail = parseInt(prod.stock[item.size.toLowerCase()] || 0);
        if (item.qty + 1 > avail) return alert(`Max stock reached.`);
    }
    item.qty += v; if(item.qty < 1) { if(confirm("Remove this item?")) c.splice(i,1); else item.qty=1; }
    await setStorage(KEY_CART, c); await loadCartDisplay(); await updateCartCount();
};
window.rmC = async(i)=>{ let c=await getStorage(KEY_CART); c.splice(i,1); await setStorage(KEY_CART,c); await loadCartDisplay(); await updateCartCount(); };

// --- 7. FEEDBACK ---
function handleContactForm(form) {
    form.onsubmit = async (e) => {
        e.preventDefault();
        const m = {
            id: Date.now(), date: new Date().toLocaleDateString(), name: form.name ? form.name.value : 'Guest', email: form.email ? form.email.value : 'No Email', subject: form.subject ? form.subject.value : 'No Subject', message: form.message ? form.message.value : '', isRead: false
        };
        const ms = await getStorage(KEY_MESSAGES); ms.unshift(m); await setStorage(KEY_MESSAGES, ms); form.reset(); showPopup('Message Sent', 'Thank you!', 'success');
    };
}

// --- 8. ADMIN FUNCTIONS (Fixed: Order Tab Highlight) ---
function initAdminProducts() {
    const f=document.getElementById('add-product-form'); const tb=document.querySelector('#product-table tbody'); const input=document.getElementById('imageInput');
    const render = async () => {
        const p = await getStorage(KEY_PRODUCTS); document.getElementById('current-product-count').innerText = p.length;
        if(p.length===0){ tb.innerHTML='<tr><td colspan="5" style="text-align:center;">Empty</td></tr>'; return; }
        tb.innerHTML = p.map((x,i)=> {
            const s = x.stock || {s:0, m:0, l:0, xl:0, xxl:0};
            return `<tr><td><img src="${x.images[0]}" style="width:40px;"></td><td>${x.name}</td><td>৳${x.price}</td><td><small>S:${s.s} M:${s.m} L:${s.l} XL:${s.xl} XXL:${s.xxl}</small><br><button onclick="openStockModal('${x.id}')" style="cursor:pointer;color:#ff9f43;background:none;border:none;">Edit Stock</button></td><td style="text-align:right;"><button onclick="delP(${i})" style="color:red;border:none;background:none;">Del</button></td></tr>`;
        }).join('');
    }; render();
    if(f) f.addEventListener('submit',async(e)=>{
        e.preventDefault(); const files=Array.from(input.files); 
        const readFiles=(fl)=>Promise.all(fl.map(f=>new Promise(r=>{const fr=new FileReader(); fr.onload=()=>r(fr.result); fr.readAsDataURL(f);}))); 
        let imgData=[]; if(files.length) imgData=await readFiles(files);
        const stock = { s: parseInt(f.stock_s.value)||0, m: parseInt(f.stock_m.value)||0, l: parseInt(f.stock_l.value)||0, xl: parseInt(f.stock_xl.value)||0, xxl: parseInt(f.stock_xxl.value)||0 };
        const p = await getStorage(KEY_PRODUCTS); p.push({ id: Date.now(), name: f.name.value, price: parseFloat(f.price.value), originalPrice: f.oldPrice.value?parseFloat(f.oldPrice.value):null, isNewArrival: f.isNew.checked, images: imgData, stock: stock });
        await setStorage(KEY_PRODUCTS, p); f.reset(); render(); showPopup('Success', 'Product Added!', 'success');
    });
    window.delP=async(i)=>{if(confirm('Delete?')){const p=await getStorage(KEY_PRODUCTS);p.splice(i,1);await setStorage(KEY_PRODUCTS,p);render();}};
    window.openStockModal = async (id) => { const p = await getStorage(KEY_PRODUCTS); const prod = p.find(x => x.id == id); if(!prod) return; const s = prod.stock || {s:0, m:0, l:0, xl:0, xxl:0}; document.getElementById('edit-prod-id').value = id; document.getElementById('edit-s').value = s.s; document.getElementById('edit-m').value = s.m; document.getElementById('edit-l').value = s.l; document.getElementById('edit-xl').value = s.xl; document.getElementById('edit-xxl').value = s.xxl; document.getElementById('editStockModal').classList.add('active'); };
    window.closeStockModal = () => document.getElementById('editStockModal').classList.remove('active');
    window.saveStockUpdate = async () => { const id = document.getElementById('edit-prod-id').value; const p = await getStorage(KEY_PRODUCTS); const prod = p.find(x => x.id == id); if(prod) { prod.stock = { s: parseInt(document.getElementById('edit-s').value)||0, m: parseInt(document.getElementById('edit-m').value)||0, l: parseInt(document.getElementById('edit-l').value)||0, xl: parseInt(document.getElementById('edit-xl').value)||0, xxl: parseInt(document.getElementById('edit-xxl').value)||0 }; await setStorage(KEY_PRODUCTS, p); closeStockModal(); render(); showPopup('Success', 'Stock Updated!', 'success'); } };
}

function initAdminOrders() { 
    const tb=document.querySelector('#orders-table tbody'); 
    let flt='All'; 
    const ren=async()=>{ 
        const all=await getStorage(KEY_ORDERS); const l=flt==='All'?all:all.filter(o=>o.status===flt); 
        
        // FIXED: Robust Filter Button Highlighting
        document.querySelectorAll('.filter-btn').forEach(b=>{
            const onClickAttr = b.getAttribute('onclick');
            // Check if the button's function call matches the current filter
            if(onClickAttr && onClickAttr.includes(`'${flt}'`)) {
                b.classList.add('active');
            } else if (flt === 'All' && b.innerText.includes('All')) {
                b.classList.add('active'); // Special case for All Orders
            } else {
                b.classList.remove('active');
            }
        });

        if(l.length===0){tb.innerHTML='<tr><td colspan="5">No Orders</td></tr>';return;} 
        tb.innerHTML=l.map(o=>`<tr><td>${o.id}</td><td>${o.customer.name}</td><td>৳${o.total}</td><td><select onchange="changeOrderStatus('${o.id}', this.value)" style="color:#ff9f43;background:#222;border:1px solid #555"><option ${o.status==='Pending'?'selected':''}>Pending</option><option ${o.status==='Shipped'?'selected':''}>Shipped</option><option ${o.status==='Delivered'?'selected':''}>Delivered</option><option ${o.status==='Cancelled'?'selected':''}>Cancelled</option></select></td><td><button onclick="vOrd('${o.id}')" class="btn-action btn-view"><i class="fas fa-eye"></i> View</button></td></tr>`).join(''); 
    }; ren(); 
    window.filterOrders=(s)=>{flt=s;ren();}; 
    window.changeOrderStatus = async (id, status) => { const all = await getStorage(KEY_ORDERS); const order = all.find(x => x.id === id); if(order) { order.status = status; await setStorage(KEY_ORDERS, all); showPopup('Updated', `Order ${id} marked as ${status}`, 'success'); ren(); } };
    window.vOrd=async(id)=>{
        const o=(await getStorage(KEY_ORDERS)).find(x=>x.id===id); if(!o)return;
        const itemRows = o.items.map(i => `<tr><td>${i.name} <span style="color:#ff9f43; font-size:0.8em;">(${i.size})</span></td><td style="text-align:center;">৳${i.price}</td><td style="text-align:center;">${i.qty}</td><td style="text-align:right;">৳${i.price*i.qty}</td></tr>`).join('');
        const content = `<div style="text-align:left;"><p style="margin-bottom:5px;"><strong>Customer:</strong> ${o.customer.name}</p><p style="margin-bottom:5px;"><strong>Phone:</strong> ${o.customer.phone}</p><p style="margin-bottom:15px; font-size:0.9em; color:#aaa;"><strong>Address:</strong> ${o.customer.address}</p><div style="overflow-x:auto;"><table class="popup-table" style="width:100%; border-collapse: collapse; font-size:0.9em;"><thead><tr style="border-bottom:1px solid #555;"><th style="text-align:left; padding:5px;">Product</th><th style="text-align:center; padding:5px;">Rate</th><th style="text-align:center; padding:5px;">Qty</th><th style="text-align:right; padding:5px;">Total</th></tr></thead><tbody>${itemRows}</tbody></table></div><div style="margin-top:15px; border-top:1px solid #444; padding-top:10px;"><div style="display:flex; justify-content:space-between; color:#ccc; margin-bottom:3px;"><span>Subtotal:</span><span>৳${o.subTotal}</span></div><div style="display:flex; justify-content:space-between; color:#ccc; margin-bottom:3px;"><span>Delivery Charge:</span><span>৳${o.deliveryCharge}</span></div><hr style="border:0; border-top:1px dashed #333; margin:5px 0;"><div style="display:flex; justify-content:space-between; color:#ff9f43; font-weight:bold; font-size:1.2em;"><span>Grand Total:</span><span>৳${o.total}</span></div></div></div>`;
        showPopup('Order Details', content, 'info');
    };
}

function initAdminMessages() { 
    const tb=document.querySelector('#messages-table tbody'); let vm='New'; 
    const ren=async()=>{ 
        const all=await getStorage(KEY_MESSAGES); const l=vm==='New'?all.filter(m=>!m.isRead):all.filter(m=>m.isRead); 
        document.querySelectorAll('.filter-btn').forEach(b=>{if(b.innerText.includes(vm))b.classList.add('active');else b.classList.remove('active');}); 
        if(l.length===0){tb.innerHTML='<tr><td colspan="5">No Messages</td></tr>';return;} 
        tb.innerHTML=l.map(m=>{
            const ix=all.findIndex(x=>x.id===m.id); 
            return `<tr><td>${m.date}</td><td>${m.name}<br><small>${m.email}</small></td><td>${m.subject}</td><td>${m.message}</td><td style="white-space:nowrap;">${!m.isRead ? `<button onclick="mkR(${ix})" class="btn-action btn-read"><i class="fas fa-check"></i> Read</button>` : ''}<button onclick="delMsg(${ix})" class="btn-action btn-delete"><i class="fas fa-trash"></i></button></td></tr>`;
        }).join(''); 
    }; ren(); 
    window.filterMsgs=(m)=>{vm=m;ren();}; 
    window.mkR=async(i)=>{const m=await getStorage(KEY_MESSAGES);m[i].isRead=true;await setStorage(KEY_MESSAGES,m);ren(); updateAdminSidebarBadges();}; 
    window.delMsg=async(i)=>{if(confirm('Delete?')){const m=await getStorage(KEY_MESSAGES);m.splice(i,1);await setStorage(KEY_MESSAGES,m);ren(); updateAdminSidebarBadges();}}; 
}
async function initAdminDashboard() { const o=await getStorage(KEY_ORDERS); const p=await getStorage(KEY_PRODUCTS); const rev=o.filter(x=>x.status==='Delivered').reduce((s,i)=>s+(parseFloat(i.subTotal)||0),0); document.getElementById('stat-revenue').innerText='৳ '+rev; document.getElementById('stat-pending').innerText=o.filter(x=>x.status==='Pending').length; document.getElementById('stat-shipped').innerText=o.filter(x=>x.status==='Shipped').length; document.getElementById('stat-delivered').innerText=o.filter(x=>x.status==='Delivered').length; document.getElementById('stat-cancelled').innerText=o.filter(x=>x.status==='Cancelled').length; document.getElementById('stat-products').innerText=p.length; }

// Utils
function createPopupHTML() { if(!document.querySelector('.custom-popup-overlay')) { const p=document.createElement('div'); p.className='custom-popup-overlay'; p.innerHTML=`<div class="custom-popup-box"><i class="fas fa-info-circle popup-icon"></i><h3 class="popup-title"></h3><div class="popup-msg"></div><button class="btn primary-btn popup-btn">OK</button></div>`; document.body.appendChild(p); p.querySelector('.popup-btn').addEventListener('click', () => { p.classList.remove('active'); if(window.popupRedirect) { window.location.href=window.popupRedirect; window.popupRedirect=null; } }); } }
function showPopup(title, msg, type='info', url=null) { const o=document.querySelector('.custom-popup-overlay'); if(!o) return alert(msg); const i=o.querySelector('.popup-icon'); o.querySelector('.popup-title').innerText=title; o.querySelector('.popup-msg').innerHTML=msg; if(type==='success') i.className='fas fa-check-circle popup-icon popup-success'; else if(type==='error') i.className='fas fa-times-circle popup-icon popup-error'; else i.className='fas fa-info-circle popup-icon popup-info'; if(url) window.popupRedirect=url; o.classList.add('active'); }
async function updateAdminSidebarBadges() { const o = await getStorage(KEY_ORDERS); const m = await getStorage(KEY_MESSAGES); if(o.some(x=>x.status==='Pending') && document.getElementById('nav-orders')) document.getElementById('nav-orders').innerHTML+=' <span class="nav-badge"></span>'; if(m.some(x=>!x.isRead) && document.getElementById('nav-messages')) document.getElementById('nav-messages').innerHTML+=' <span class="nav-badge"></span>'; }
async function updateCartCount() { const c = await getStorage(KEY_CART); const t = c.reduce((s, i) => s + (parseInt(i.qty)||0), 0); document.querySelectorAll('.cart-count').forEach(e => e.innerText = `(${t})`); }
