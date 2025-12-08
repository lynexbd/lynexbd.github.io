// ======================================================
// LYNEX FIREBASE CONNECTED SCRIPT (ONLINE DATABASE)
// ======================================================

// 1. IMPORT FIREBASE (Module Version)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, get, push, update, remove, onValue, child } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 2. CONFIGURATION & KEYS
const firebaseConfig = {
  apiKey: "AIzaSyCK5u4XXbebIcYmGG4w1YpD1sWlV6g8y_4",
  authDomain: "lynexbd.firebaseapp.com",
  projectId: "lynexbd",
  storageBucket: "lynexbd.firebasestorage.app",
  messagingSenderId: "236062086986",
  appId: "1:236062086986:web:acd11182126b3ae0a393b3",
  measurementId: "G-WP34VD4DFG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Local Keys (Cart remains local per user)
const KEY_CART = 'lynex_cart_local';
const KEY_ADMIN_TOKEN = 'lynex_secure_token_v99';
const KEY_DIRECT_BUY = 'lynex_direct_buy';

// Admin Credentials
const ADMIN_USER = "SysMaster_99";
const ADMIN_PASS = "L7n@x#Super!2025";

// Geo Data for Address
const bdGeoData = {
    "Dhaka": {
        "Munshiganj": ["Munshiganj Sadar", "Sreenagar", "Sirajdikhan", "Louhajang", "Gajaria", "Tongibari"],
        "Dhaka": ["Savar", "Dhamrai", "Keraniganj", "Nawabganj", "Dohar", "Dhaka Sadar"],
        "Gazipur": ["Gazipur Sadar", "Kaliakair", "Kapasia", "Sreepur", "Kaliganj"],
        "Narayanganj": ["Narayanganj Sadar", "Bandar", "Araihazar", "Rupganj", "Sonargaon"],
        "Madaripur": ["Madaripur Sadar", "Shibchar", "Kalkini", "Rajoir"],
        "Shariatpur": ["Shariatpur Sadar", "Naria", "Zajira", "Gosairhat", "Bhedarganj", "Damudya"],
        "Gopalganj": ["Gopalganj Sadar", "Kashiani", "Tungipara", "Kotalipara", "Muksudpur"],
        "Kishoreganj": ["Kishoreganj Sadar", "Hossainpur", "Pakundia", "Katiadi", "Karimganj", "Tarail", "Bhairab"],
        "Tangail": ["Tangail Sadar", "Sakhipur", "Basail", "Madhupur", "Ghatail", "Kalihati", "Mirzapur"],
        "Narsingdi": ["Narsingdi Sadar", "Belabo", "Monohardi", "Palash", "Raipura", "Shibpur"],
        "Manikganj": ["Manikganj Sadar", "Singair", "Shibalaya", "Saturia", "Harirampur", "Ghior"],
        "Faridpur": ["Faridpur Sadar", "Boalmari", "Alfadanga", "Madhukhali", "Bhanga", "Nagarkanda"],
        "Rajbari": ["Rajbari Sadar", "Goalanda", "Pangsha", "Baliakandi", "Kalukhali"]
    },
    "Chattogram": {
        "Chattogram": ["Chattogram Sadar", "Sitakunda", "Mirsharai", "Patiya", "Raozan", "Hathazari", "Fatikchhari", "Anwara"],
        "Cox's Bazar": ["Cox's Bazar Sadar", "Ramu", "Teknaf", "Ukhia", "Chakaria", "Pekua", "Moheshkhali"],
        "Cumilla": ["Cumilla Sadar", "Barura", "Brahmanpara", "Burichang", "Chandina", "Chauddagram", "Daudkandi"],
        "Noakhali": ["Noakhali Sadar", "Begumganj", "Chatkhil", "Companyganj", "Hatiya", "Senbagh", "Sonaimuri"],
        "Feni": ["Feni Sadar", "Chhagalnaiya", "Daganbhuiyan", "Parshuram", "Fulgazi", "Sonagazi"],
        "Brahmanbaria": ["Brahmanbaria Sadar", "Ashuganj", "Nasirnagar", "Nabinagar", "Sarail", "Kasba", "Akhaura"],
        "Chandpur": ["Chandpur Sadar", "Faridganj", "Haimchar", "Haziganj", "Kachua", "Matlab Dakshin"],
        "Lakshmipur": ["Lakshmipur Sadar", "Raipur", "Ramganj", "Ramgati", "Kamalnagar"]
    },
    "Khulna": {
        "Khulna": ["Khulna Sadar", "Dumuria", "Phultala", "Dighalia", "Rupsha", "Terokhada", "Batiaghata"],
        "Jessore": ["Jessore Sadar", "Benapole", "Abhaynagar", "Bagherpara", "Chaugachha", "Jhikargachha"],
        "Satkhira": ["Satkhira Sadar", "Assasuni", "Debhata", "Kalaroa", "Kaliganj", "Shyamnagar"],
        "Bagerhat": ["Bagerhat Sadar", "Chitalmari", "Fakirhat", "Kachua", "Mollahat", "Mongla"],
        "Kushtia": ["Kushtia Sadar", "Kumarkhali", "Khoksa", "Mirpur", "Daulatpur", "Bheramara"]
    },
    "Rajshahi": {
        "Rajshahi": ["Rajshahi Sadar", "Godagari", "Tanore", "Bagha", "Charghat", "Durgapur"],
        "Bogra": ["Bogra Sadar", "Sherpur", "Shibganj", "Adamdighi", "Dhupchanchia", "Gabtali"],
        "Pabna": ["Pabna Sadar", "Atgharia", "Bera", "Bhangura", "Chatmohar", "Ishwardi"],
        "Sirajganj": ["Sirajganj Sadar", "Belkuchi", "Chauhali", "Kamarkhanda", "Kazipur", "Raiganj"]
    },
    "Sylhet": {
        "Sylhet": ["Sylhet Sadar", "Beanibazar", "Golapganj", "Companiganj", "Fenchuganj", "Balaganj", "Bishwanath"],
        "Sunamganj": ["Sunamganj Sadar", "Chhatak", "Jagannathpur", "Derai", "Dharamapasha", "Bishwamvarpur"],
        "Habiganj": ["Habiganj Sadar", "Ajmiriganj", "Bahubal", "Baniyachong", "Chunarughat", "Madhabpur"],
        "Moulvibazar": ["Moulvibazar Sadar", "Barlekha", "Juri", "Kamalganj", "Kulaura", "Sreemangal"]
    },
    "Barishal": {
        "Barishal": ["Barishal Sadar", "Bakerganj", "Babuganj", "Agailjhara", "Gaurnadi", "Mehendiganj"],
        "Bhola": ["Bhola Sadar", "Burhanuddin", "Char Fasson", "Daulatkhan", "Lalmohan", "Manpura"],
        "Patuakhali": ["Patuakhali Sadar", "Bauphal", "Dashmina", "Galachipa", "Kalapara"]
    },
    "Rangpur": {
        "Rangpur": ["Rangpur Sadar", "Pirgachha", "Kaunia", "Badarganj", "Gangachara", "Mithapukur"],
        "Dinajpur": ["Dinajpur Sadar", "Birampur", "Birganj", "Bochaganj", "Chirirbandar", "Fulbari"],
        "Gaibandha": ["Gaibandha Sadar", "Fulchhari", "Gobindaganj", "Palashbari", "Sadullapur"]
    },
    "Mymensingh": {
        "Mymensingh": ["Mymensingh Sadar", "Muktagachha", "Valuka", "Bhaluka", "Dhobaura", "Fulbaria"],
        "Jamalpur": ["Jamalpur Sadar", "Bakshiganj", "Dewanganj", "Islampur", "Madarganj", "Melandaha"],
        "Sherpur": ["Sherpur Sadar", "Jhenaigati", "Nakla", "Nalitabari", "Sreebardi"],
        "Netrokona": ["Netrokona Sadar", "Atpara", "Barhatta", "Durgapur", "Khaliajuri"]
    }
};

// ======================================================
// HELPER FUNCTIONS (FIREBASE & STORAGE)
// ======================================================

// Helper: Get Data from Firebase Once
async function getFirebaseData(path) {
    try {
        const snapshot = await get(child(ref(db), path));
        if (snapshot.exists()) {
            const data = snapshot.val();
            // Firebase returns objects, we convert to array for easier handling
            return Object.values(data).reverse(); // Reverse to show latest first
        } else {
            return [];
        }
    } catch (error) {
        console.error("Firebase Read Error:", error);
        return [];
    }
}

// Helper: Get Local Cart
function getLocalCart() {
    return JSON.parse(localStorage.getItem(KEY_CART) || '[]');
}

// Helper: Set Local Cart
function setLocalCart(cart) {
    localStorage.setItem(KEY_CART, JSON.stringify(cart));
}

// ======================================================
// INITIALIZATION
// ======================================================

document.addEventListener('DOMContentLoaded', async function() {
    createPopupHTML();
    createSizeModalHTML();

    // ক্লিনিং লজিক
    if (window.location.pathname.includes('cart.html')) {
        sessionStorage.removeItem(KEY_DIRECT_BUY);
    }

    // মোবাইল মেনু টগল
    const menuToggle = document.getElementById('menu-toggle');
    const navList = document.getElementById('nav-list');
    if (menuToggle) menuToggle.addEventListener('click', () => navList.classList.toggle('active'));
    
    // কার্ট কাউন্ট আপডেট (সব পেজের জন্য)
    updateCartCount();

    // ১. লগইন পেজ ডিটেকশন
    if (document.getElementById('secure-login-form')) handleLogin();

    // ২. এডমিন প্যানেল হাইলাইট এবং লজিক
    if (document.querySelector('.sidebar')) {
        if (!sessionStorage.getItem(KEY_ADMIN_TOKEN)) { 
            window.location.href = 'k7_entry_point.html'; 
            return; 
        }
        highlightAdminNav();
        if (document.getElementById('stat-revenue')) initAdminDashboard();
        if (document.getElementById('add-product-form')) initAdminProducts();
        if (document.getElementById('orders-table')) initAdminOrders();
        if (document.getElementById('messages-table')) initAdminMessages();
    }

    // ৩. পাবলিক ওয়েবসাইট ডিটেকশন (পণ্য প্রদর্শনের জন্য)
    if (document.querySelector('.product-grid')) {
        const isHome = document.querySelector('.hero-section') !== null;
        loadProductsDisplay(isHome);
    }
    
    // ৪. চেকআউট এবং অর্ডার লজিক
    if (document.getElementById('checkout-form')) {
        initAddressDropdowns();
        handleCheckoutForm();
        loadCartSummaryForCheckout();
    }
    
    // ৫. কার্ট পেজ লজিক
    if (document.querySelector('.cart-items') && !document.getElementById('checkout-form')) loadCartDisplay();
    
    // ৬. ফিডব্যাক পেজ লজিক
    const contactForm = document.getElementById('contact-form') || document.querySelector('form[action="feedback.html"]');
    if (contactForm) handleContactForm(contactForm);

    // --- ৭. নতুন পেজগুলোর জন্য ডিটেকশন (About, Delivery, Terms) ---
    // এই পেজগুলোতে আলাদা কোনো ফর্ম লজিক নেই, তাই শুধু কার্ট কাউন্ট আপডেটই যথেষ্ট।
    // updateCartCount() ইতিমধ্যে উপরে রান হচ্ছে যা এই ৩ পেজের কাউন্ট ঠিক রাখবে।
});


// ======================================================
// GLOBAL WINDOW FUNCTIONS (Required for HTML onclick)
// ======================================================
window.adminLogout = function() { 
    sessionStorage.removeItem(KEY_ADMIN_TOKEN); 
    window.location.href = 'k7_entry_point.html'; 
};

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

window.closeSizeModal = () => { document.getElementById('sizeModal').classList.remove('active'); };

window.adjustModalQty = (change) => {
    let newQty = currentModalQty + change;
    if (newQty < 1) newQty = 1;
    if (newQty > currentMaxStock) { newQty = currentMaxStock; alert(`Stock Limit: Only ${currentMaxStock} available.`); }
    currentModalQty = newQty;
    document.getElementById('modal-qty-val').innerText = currentModalQty;
};

// ======================================================
// 1. PRODUCT DISPLAY (PUBLIC)
// ======================================================
async function loadProductsDisplay(isHome) {
    let grid = document.querySelector('.product-grid'); if (!grid) return;
    grid.innerHTML = '<p style="color:#aaa;text-align:center;">Loading products...</p>';
    
    // Fetch from Firebase
    let p = await getFirebaseData('products');
    
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
    }).join('') : '<p style="text-align:center;width:100%;color:#777;padding:50px;">No products found.</p>';
}

// ======================================================
// 2. SIZE MODAL & CART LOGIC
// ======================================================
let currentModalProductId = null, currentModalAction = null, currentSelectedSize = null, currentModalQty = 1, currentMaxStock = 0;

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

window.openSizeSelector = async (id, action) => {
    // Fetch product info from Firebase directly or passed data
    // For simplicity, we fetch full list and find. 
    const products = await getFirebaseData('products');
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
            // Use closure for onclick
            btn.addEventListener('click', () => {
                currentSelectedSize = sizeKey.toUpperCase(); 
                currentMaxStock = stockCount; 
                currentModalQty = 1; 
                document.getElementById('modal-qty-val').innerText = '1';
                document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                document.getElementById('modal-qty-area').style.display = 'block';
            });
            sizeContainer.appendChild(btn);
        }
    });

    if (!hasStock) return showPopup('Stock Out', 'Sorry, this product is out of stock.', 'error');
    document.getElementById('sizeModal').classList.add('active');
    
    // Assign confirm function
    document.getElementById('modal-confirm-btn').onclick = async () => {
        if (!currentSelectedSize || !currentModalProductId) return;
        
        // Prepare item object
        const item = { ...p, size: currentSelectedSize, qty: currentModalQty };
        
        if (currentModalAction === 'buy') {
            sessionStorage.setItem(KEY_DIRECT_BUY, JSON.stringify([item]));
            closeSizeModal();
            window.location.href = 'checkout.html';
            return;
        }

        // Add to Local Cart
        sessionStorage.removeItem(KEY_DIRECT_BUY); 
        let c = getLocalCart();
        let ex = c.find(x => x.id == currentModalProductId && x.size == currentSelectedSize);
        
        if (ex) {
            if (ex.qty + currentModalQty > currentMaxStock) return alert(`Cart limit reached.`);
            ex.qty += currentModalQty;
        } else {
            c.push(item);
        }

        setLocalCart(c);
        updateCartCount();
        closeSizeModal();
        showPopup('Success', `Added to Cart!<br>${p.name}<br>Size: ${currentSelectedSize}, Qty: ${currentModalQty}`, 'success');
    };
};

function updateCartCount() {
    const c = getLocalCart();
    const t = c.reduce((s, i) => s + (parseInt(i.qty)||0), 0);
    document.querySelectorAll('.cart-count').forEach(e => e.innerText = `(${t})`);
}

// --- Cart Page Display ---
function loadCartDisplay() {
    const c = document.querySelector('.cart-items'); 
    const t = document.getElementById('cart-total'); 
    const summarySection = document.querySelector('.cart-summary');
    if(!c) return;

    const cart = getLocalCart();
    
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

// Global scope for Cart actions
window.upQty = (i, v) => {
    let c = getLocalCart(); 
    const item = c[i];
    item.qty += v; 
    if(item.qty < 1) { 
        if(confirm("Remove this item?")) c.splice(i,1); else item.qty=1; 
    }
    setLocalCart(c); 
    loadCartDisplay(); 
    updateCartCount();
};

window.rmC = (i) => { 
    let c = getLocalCart(); 
    c.splice(i,1); 
    setLocalCart(c); 
    loadCartDisplay(); 
    updateCartCount(); 
};

// ======================================================
// 3. CHECKOUT & ORDER PLACEMENT
// ======================================================
async function getCheckoutItems() {
    const directBuyData = sessionStorage.getItem(KEY_DIRECT_BUY);
    if (directBuyData) return JSON.parse(directBuyData);
    return getLocalCart();
}

function initAddressDropdowns() {
    const divisionSelect = document.getElementById("division"); if (!divisionSelect) return;
    for (let div in bdGeoData) { let option = document.createElement("option"); option.value = div; option.text = div; divisionSelect.appendChild(option); }
}

// Window functions for Checkout Dropdowns
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

// সংশোধিত handleCheckoutForm ফাংশন
function handleCheckoutForm() {
    const f = document.getElementById('checkout-form');
    if(f) {
        f.onsubmit = async (e) => {
            e.preventDefault();
            
            // ১. বেসিক ভ্যালিডেশন
            if (f.name.value.trim() === "") return showPopup('Error', 'Name Required', 'error');
            if (f.phone.value.length !== 11) return showPopup('Error', 'Valid Phone Required', 'error');

            const c = await getCheckoutItems(); 
            if(c.length === 0) return showPopup('Error', 'No items to checkout!', 'error');

            // ২. ডেটা প্রিপারেশন
            const deliveryCharge = parseInt(document.getElementById('delivery-charge').innerText) || 0; 
            const subTot = c.reduce((s,i) => s + (i.price * i.qty), 0); 
            const grandTot = subTot + deliveryCharge;
            const fullAddress = `Vill: ${f.village.value}, ${f.landmark.value}, Upz: ${f.upazila.value}, Dist: ${f.district.value}, Div: ${f.division.value}`;
            
            const orderId = 'ORD-' + Date.now().toString().slice(-6);

            const ord = { 
                id: orderId, 
                date: new Date().toLocaleDateString(), 
                timestamp: Date.now(),
                customer: { name: f.name.value, phone: f.phone.value, address: fullAddress }, 
                items: c, 
                subTotal: subTot, 
                deliveryCharge: deliveryCharge, 
                total: grandTot, 
                status: 'Pending' 
            };

            // ৩. Firebase-এ পুশ এবং স্টক আপডেট
            try {
                // ক. অর্ডার সেভ করা
                await set(ref(db, 'orders/' + orderId), ord);
                
                // খ. প্রতিটি পণ্যের সাইজ অনুযায়ী স্টক কমানো
                for(let item of c) {
                    const sizePath = item.size.toLowerCase();
                    const stockRef = ref(db, `products/${item.id}/stock/${sizePath}`);
                    
                    // বর্তমান স্টক রিড করা
                    const snapshot = await get(stockRef);
                    if(snapshot.exists()) {
                        const currentStock = parseInt(snapshot.val());
                        // নতুন স্টক হিসাব করে আপডেট করা (০ এর নিচে যাবে না)
                        const newStock = Math.max(0, currentStock - item.qty);
                        await set(stockRef, newStock);
                    }
                }
                
                // ৪. কার্ট ক্লিয়ার করা
                if(sessionStorage.getItem(KEY_DIRECT_BUY)) {
                    sessionStorage.removeItem(KEY_DIRECT_BUY);
                } else {
                    setLocalCart([]); 
                    updateCartCount(); 
                }

                showPopup('Order Placed!', `Your Order ID: ${orderId}<br>We will contact you soon.`, 'success', 'index.html');
            } catch (err) {
                console.error("Firebase Update Error:", err);
                showPopup('Error', 'Failed to place order. Check internet.', 'error');
            }
        };
    }
}


// ======================================================
// 4. ADMIN FUNCTIONS (Real-time Firebase)
// ======================================================

function highlightAdminNav() {
    const path = window.location.pathname;
    const page = path.split("/").pop();
    document.querySelectorAll('.sidebar ul li a').forEach(a => {
        a.classList.remove('admin-active');
        if(a.getAttribute('href') === page) a.classList.add('admin-active');
    });
}

function handleLogin() {
    if(sessionStorage.getItem(KEY_ADMIN_TOKEN)) { window.location.href = 'x_master_v9.html'; return; }
    const form = document.getElementById('secure-login-form');
    form.onsubmit = (e) => {
        e.preventDefault();
        if (document.getElementById('username').value.trim() === ADMIN_USER && document.getElementById('password').value.trim() === ADMIN_PASS) {
            sessionStorage.setItem(KEY_ADMIN_TOKEN, "LOGGED_IN");
            window.location.href = 'x_master_v9.html';
        } else showPopup('Error', 'Invalid Credentials!', 'error');
    };
}

// ADMIN: PRODUCTS
function initAdminProducts() {
    const f=document.getElementById('add-product-form'); const tb=document.querySelector('#product-table tbody'); const input=document.getElementById('imageInput');
    
    // Real-time listener
    onValue(ref(db, 'products'), (snapshot) => {
        tb.innerHTML = '';
        const data = snapshot.val();
        if (!data) { tb.innerHTML='<tr><td colspan="5" style="text-align:center;">Empty</td></tr>'; return; }
        
        // Convert object to array
        const products = Object.values(data).reverse();
        document.getElementById('current-product-count').innerText = products.length;

        tb.innerHTML = products.map((x) => {
            const s = x.stock || {s:0, m:0, l:0, xl:0, xxl:0};
            return `<tr><td><img src="${x.images[0]}" style="width:40px;"></td><td>${x.name}</td><td>৳${x.price}</td><td><small>S:${s.s} M:${s.m} L:${s.l} XL:${s.xl} XXL:${s.xxl}</small><br><button onclick="openStockModal('${x.id}')" style="cursor:pointer;color:#ff9f43;background:none;border:none;">Edit Stock</button></td><td style="text-align:right;"><button onclick="delP('${x.id}')" style="color:red;border:none;background:none;">Del</button></td></tr>`;
        }).join('');
    });

    // ADD PRODUCT
    if(f) f.addEventListener('submit', async(e)=>{
        e.preventDefault(); 
        const files=Array.from(input.files); 
        const readFiles=(fl)=>Promise.all(fl.map(f=>new Promise(r=>{const fr=new FileReader(); fr.onload=()=>r(fr.result); fr.readAsDataURL(f);}))); 
        let imgData=[]; if(files.length) imgData=await readFiles(files);
        
        const stock = { s: parseInt(f.stock_s.value)||0, m: parseInt(f.stock_m.value)||0, l: parseInt(f.stock_l.value)||0, xl: parseInt(f.stock_xl.value)||0, xxl: parseInt(f.stock_xxl.value)||0 };
        
        const newId = Date.now().toString();
        const newProd = { 
            id: newId, 
            name: f.name.value, 
            price: parseFloat(f.price.value), 
            originalPrice: f.oldPrice.value?parseFloat(f.oldPrice.value):null, 
            isNewArrival: f.isNew.checked, 
            images: imgData, 
            stock: stock 
        };

        try {
            await set(ref(db, 'products/' + newId), newProd);
            f.reset(); showPopup('Success', 'Product Added to Database!', 'success');
        } catch(err) { console.error(err); showPopup('Error', 'Failed to add', 'error'); }
    });

    // Delete Product
    window.delP = async(id) => {
        if(confirm('Delete this product?')) {
            await remove(ref(db, 'products/' + id));
        }
    };

    // Stock Modal Logic
    window.openStockModal = async (id) => { 
        const snapshot = await get(child(ref(db), 'products/' + id));
        if(!snapshot.exists()) return;
        const prod = snapshot.val();
        const s = prod.stock || {s:0, m:0, l:0, xl:0, xxl:0}; 
        document.getElementById('edit-prod-id').value = id; 
        document.getElementById('edit-s').value = s.s; 
        document.getElementById('edit-m').value = s.m; 
        document.getElementById('edit-l').value = s.l; 
        document.getElementById('edit-xl').value = s.xl; 
        document.getElementById('edit-xxl').value = s.xxl; 
        document.getElementById('editStockModal').classList.add('active'); 
    };
    
    window.saveStockUpdate = async () => { 
        const id = document.getElementById('edit-prod-id').value; 
        const stock = { 
            s: parseInt(document.getElementById('edit-s').value)||0, 
            m: parseInt(document.getElementById('edit-m').value)||0, 
            l: parseInt(document.getElementById('edit-l').value)||0, 
            xl: parseInt(document.getElementById('edit-xl').value)||0, 
            xxl: parseInt(document.getElementById('edit-xxl').value)||0 
        }; 
        await update(ref(db, 'products/' + id), { stock: stock });
        closeStockModal(); showPopup('Success', 'Stock Updated!', 'success'); 
    };
}

// ADMIN: ORDERS
function initAdminOrders() { 
    const tb=document.querySelector('#orders-table tbody'); 
    let flt='All'; 

    onValue(ref(db, 'orders'), (snapshot) => {
        const data = snapshot.val();
        if(!data) { tb.innerHTML='<tr><td colspan="5">No Orders</td></tr>'; return; }

        const all = Object.values(data).sort((a,b) => b.timestamp - a.timestamp); // Sort by new
        const l = flt==='All' ? all : all.filter(o => o.status === flt);

        tb.innerHTML = l.map(o => `
            <tr>
                <td>${o.id}</td>
                <td>${o.customer.name}<br><small>${o.customer.phone}</small></td>
                <td>৳${o.total}</td>
                <td>
                    <select onchange="changeOrderStatus('${o.id}', this.value)" style="color:#ff9f43;background:#222;border:1px solid #555">
                        <option ${o.status==='Pending'?'selected':''}>Pending</option>
                        <option ${o.status==='Shipped'?'selected':''}>Shipped</option>
                        <option ${o.status==='Delivered'?'selected':''}>Delivered</option>
                        <option ${o.status==='Cancelled'?'selected':''}>Cancelled</option>
                    </select>
                </td>
                <td><button onclick="vOrd('${o.id}')" class="btn-action btn-view"><i class="fas fa-eye"></i> View</button></td>
            </tr>`).join('');
    });

    window.filterOrders = (s) => { 
        flt=s; 
        // Trigger re-render by reading once or just wait for next update
        // Simple hack: toggle filter buttons
        document.querySelectorAll('.filter-btn').forEach(b=>{
            if(b.innerText.includes(s) || (s==='All' && b.innerText==='All Orders')) b.classList.add('active');
            else b.classList.remove('active');
        });
        // Reload data to apply filter
        get(ref(db, 'orders')).then(() => { /* triggers onValue */ }); 
    };

    window.changeOrderStatus = async (id, status) => { 
        await update(ref(db, 'orders/' + id), { status: status });
        showPopup('Updated', `Order marked as ${status}`, 'success');
    };

    window.vOrd = async(id) => {
        const s = await get(child(ref(db), 'orders/' + id));
        if(!s.exists()) return;
        const o = s.val();
        const itemRows = o.items.map(i => `<tr><td>${i.name} <span style="color:#ff9f43; font-size:0.8em;">(${i.size})</span></td><td style="text-align:center;">৳${i.price}</td><td style="text-align:center;">${i.qty}</td><td style="text-align:right;">৳${i.price*i.qty}</td></tr>`).join('');
        const content = `<div style="text-align:left;"><p style="margin-bottom:5px;"><strong>Customer:</strong> ${o.customer.name}</p><p style="margin-bottom:5px;"><strong>Phone:</strong> ${o.customer.phone}</p><p style="margin-bottom:15px; font-size:0.9em; color:#aaa;"><strong>Address:</strong> ${o.customer.address}</p><div style="overflow-x:auto;"><table class="popup-table" style="width:100%; border-collapse: collapse; font-size:0.9em;"><thead><tr style="border-bottom:1px solid #555;"><th style="text-align:left; padding:5px;">Product</th><th style="text-align:center; padding:5px;">Rate</th><th style="text-align:center; padding:5px;">Qty</th><th style="text-align:right; padding:5px;">Total</th></tr></thead><tbody>${itemRows}</tbody></table></div><div style="margin-top:15px; border-top:1px solid #444; padding-top:10px;"><div style="display:flex; justify-content:space-between; color:#ccc; margin-bottom:3px;"><span>Subtotal:</span><span>৳${o.subTotal}</span></div><div style="display:flex; justify-content:space-between; color:#ccc; margin-bottom:3px;"><span>Delivery Charge:</span><span>৳${o.deliveryCharge}</span></div><hr style="border:0; border-top:1px dashed #333; margin:5px 0;"><div style="display:flex; justify-content:space-between; color:#ff9f43; font-weight:bold; font-size:1.2em;"><span>Grand Total:</span><span>৳${o.total}</span></div></div></div>`;
        showPopup('Order Details', content, 'info');
    };
}

// ADMIN: MESSAGES (FEEDBACK)
function handleContactForm(form) {
    form.onsubmit = async (e) => {
        e.preventDefault();
        const msgId = Date.now().toString();
        const m = {
            id: msgId, date: new Date().toLocaleDateString(), 
            name: form.name ? form.name.value : 'Guest', 
            email: form.email ? form.email.value : 'No Email', 
            subject: form.subject ? form.subject.value : 'No Subject', 
            message: form.message ? form.message.value : '', 
            isRead: false
        };
        await set(ref(db, 'messages/' + msgId), m);
        form.reset(); showPopup('Message Sent', 'Thank you!', 'success');
    };
}

function initAdminMessages() { 
    const tb = document.querySelector('#messages-table tbody'); 
    let filterStatus = 'New'; // ডিফল্টভাবে নতুন মেসেজ দেখাবে

    // Firebase রিয়েল-টাইম লিসেনার
    onValue(ref(db, 'messages'), (snapshot) => {
        const data = snapshot.val();
        renderMessages(data);
    });

    // মেসেজ রেন্ডার করার মূল লজিক
    function renderMessages(data) {
        if (!data) { 
            tb.innerHTML = '<tr><td colspan="5" style="text-align:center;">No Messages Found</td></tr>'; 
            return; 
        }

        const allMsgs = Object.values(data).reverse();
        // ফিল্টার লজিক: New হলে isRead: false, Read হলে isRead: true
        const filtered = filterStatus === 'New' 
            ? allMsgs.filter(m => m.isRead === false) 
            : allMsgs.filter(m => m.isRead === true);

        // ট্যাব হাইলাইট ঠিক করা
        document.querySelectorAll('.filter-btn').forEach(btn => {
            if(btn.innerText.includes(filterStatus)) btn.classList.add('active');
            else btn.classList.remove('active');
        });

        if (filtered.length === 0) {
            tb.innerHTML = `<tr><td colspan="5" style="text-align:center;">No ${filterStatus} Messages</td></tr>`;
            return;
        }

        tb.innerHTML = filtered.map(m => `
            <tr>
                <td>${m.date}</td>
                <td>${m.name}<br><small>${m.email}</small></td>
                <td>${m.subject}</td>
                <td>${m.message}</td>
                <td style="white-space:nowrap;">
                    ${m.isRead === false ? `<button onclick="markAsRead('${m.id}')" class="btn-action btn-read"><i class="fas fa-check"></i> Read</button>` : ''}
                    <button onclick="delMsg('${m.id}')" class="btn-action btn-delete"><i class="fas fa-trash"></i></button>
                </td>
            </tr>`).join('');
    }

    // গ্লোবাল ফাংশন: ফিল্টার চেঞ্জ করার জন্য
    window.filterMsgs = (status) => {
        filterStatus = status;
        // পুনরায় ডেটা রিড করে রেন্ডার করা
        get(ref(db, 'messages')).then((snap) => renderMessages(snap.val()));
    };

    // গ্লোবাল ফাংশন: মেসেজ পড়া হয়েছে হিসেবে চিহ্নিত করা
    window.markAsRead = async (id) => {
        try {
            await update(ref(db, 'messages/' + id), { isRead: true });
            showPopup('Success', 'Message marked as read!', 'success');
        } catch(e) { 
            console.error("Update Error:", e); 
        }
    };

    // গ্লোবাল ফাংশন: মেসেজ ডিলিট করা
    window.delMsg = async (id) => { 
        if (confirm('Permanently delete this message?')) {
            await remove(ref(db, 'messages/' + id));
        }
    };
}


async function initAdminDashboard() { 
    onValue(ref(db), (snap) => {
        const data = snap.val() || {};
        const orders = data.orders ? Object.values(data.orders) : [];
        const products = data.products ? Object.values(data.products) : [];
        
        const rev = orders.filter(x=>x.status==='Delivered').reduce((s,i)=>s+(parseFloat(i.subTotal)||0),0); 
        document.getElementById('stat-revenue').innerText='৳ '+rev; 
        document.getElementById('stat-pending').innerText=orders.filter(x=>x.status==='Pending').length; 
        document.getElementById('stat-shipped').innerText=orders.filter(x=>x.status==='Shipped').length; 
        document.getElementById('stat-delivered').innerText=orders.filter(x=>x.status==='Delivered').length; 
        document.getElementById('stat-cancelled').innerText=orders.filter(x=>x.status==='Cancelled').length; 
        document.getElementById('stat-products').innerText=products.length;
    });
}

// Utils
function createPopupHTML() { if(!document.querySelector('.custom-popup-overlay')) { const p=document.createElement('div'); p.className='custom-popup-overlay'; p.innerHTML=`<div class="custom-popup-box"><i class="fas fa-info-circle popup-icon"></i><h3 class="popup-title"></h3><div class="popup-msg"></div><button class="btn primary-btn popup-btn">OK</button></div>`; document.body.appendChild(p); p.querySelector('.popup-btn').addEventListener('click', () => { p.classList.remove('active'); if(window.popupRedirect) { window.location.href=window.popupRedirect; window.popupRedirect=null; } }); } }
function showPopup(title, msg, type='info', url=null) { const o=document.querySelector('.custom-popup-overlay'); if(!o) return alert(msg); const i=o.querySelector('.popup-icon'); o.querySelector('.popup-title').innerText=title; o.querySelector('.popup-msg').innerHTML=msg; if(type==='success') i.className='fas fa-check-circle popup-icon popup-success'; else if(type==='error') i.className='fas fa-times-circle popup-icon popup-error'; else i.className='fas fa-info-circle popup-icon popup-info'; if(url) window.popupRedirect=url; o.classList.add('active'); }
