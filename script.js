// ======================================================
// LYNEX FINAL SCRIPT (English UI - Bangla Note)
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
    "Dhaka": {
        "Munshiganj": ["Munshiganj Sadar", "Sreenagar", "Sirajdikhan", "Louhajang", "Gajaria", "Tongibari"],
        "Dhaka": ["Savar", "Dhamrai", "Keraniganj", "Nawabganj", "Dohar", "Dhaka Sadar"],
        "Gazipur": ["Gazipur Sadar", "Kaliakair", "Kapasia", "Sreepur", "Kaliganj"],
        "Narayanganj": ["Narayanganj Sadar", "Bandar", "Araihazar", "Rupganj", "Sonargaon"],
        "Tangail": ["Tangail Sadar", "Sakhipur", "Basail", "Madhupur", "Ghatail", "Kalihati", "Nagarpur", "Mirzapur", "Gopalpur", "Delduar", "Bhuapur", "Dhanbari"],
        "Narsingdi": ["Narsingdi Sadar", "Belabo", "Monohardi", "Palash", "Raipura", "Shibpur"],
        "Manikganj": ["Manikganj Sadar", "Singair", "Shibalaya", "Saturia", "Harirampur", "Ghior", "Daulatpur"],
        "Faridpur": ["Faridpur Sadar", "Boalmari", "Alfadanga", "Madhukhali", "Bhanga", "Nagarkanda", "Charbhadrasan", "Sadarpur", "Saltha"],
        "Madaripur": ["Madaripur Sadar", "Shibchar", "Kalkini", "Rajoir"],
        "Shariatpur": ["Shariatpur Sadar", "Naria", "Zajira", "Gosairhat", "Bhedarganj", "Damudya"],
        "Gopalganj": ["Gopalganj Sadar", "Kashiani", "Tungipara", "Kotalipara", "Muksudpur"],
        "Kishoreganj": ["Kishoreganj Sadar", "Hossainpur", "Pakundia", "Katiadi", "Karimganj", "Tarail", "Itna", "Mithamoin", "Austagram", "Nikli", "Bajitpur", "Kuliarchar", "Bhairab"],
        "Rajbari": ["Rajbari Sadar", "Goalanda", "Pangsha", "Baliakandi", "Kalukhali"]
    },
    "Chattogram": {
        "Chattogram": ["Chattogram Sadar", "Sitakunda", "Mirsharai", "Patiya", "Raozan", "Hathazari", "Fatikchhari", "Anwara", "Lohagara", "Satkania", "Boalkhali", "Chandanaish", "Banshkhali", "Rangunia", "Sandwip"],
        "Cox's Bazar": ["Cox's Bazar Sadar", "Ramu", "Teknaf", "Ukhia", "Chakaria", "Pekua", "Moheshkhali", "Kutubdia"],
        "Cumilla": ["Cumilla Sadar", "Barura", "Brahmanpara", "Burichang", "Chandina", "Chauddagram", "Daudkandi", "Debidwar", "Homna", "Laksam", "Muradnagar", "Nangalkot", "Meghna", "Titas", "Monohargonj", "Sadar Dakshin"],
        "Brahmanbaria": ["Brahmanbaria Sadar", "Ashuganj", "Nasirnagar", "Nabinagar", "Sarail", "Kasba", "Akhaura", "Bancharampur", "Bijoynagar"],
        "Chandpur": ["Chandpur Sadar", "Faridganj", "Haimchar", "Haziganj", "Kachua", "Matlab Dakshin", "Matlab Uttar", "Shahrasti"],
        "Noakhali": ["Noakhali Sadar", "Begumganj", "Chatkhil", "Companyganj", "Hatiya", "Senbagh", "Subarnachar", "Kabirhat", "Sonaimuri"],
        "Feni": ["Feni Sadar", "Chhagalnaiya", "Daganbhuiyan", "Parshuram", "Fulgazi", "Sonagazi"],
        "Lakshmipur": ["Lakshmipur Sadar", "Raipur", "Ramganj", "Ramgati", "Kamalnagar"]
    },
    "Khulna": {
        "Khulna": ["Khulna Sadar", "Dumuria", "Phultala", "Dighalia", "Rupsha", "Terokhada", "Batiaghata", "Dakop", "Paikgachha", "Koyra"],
        "Jessore": ["Jessore Sadar", "Benapole", "Abhaynagar", "Bagherpara", "Chaugachha", "Jhikargachha", "Keshabpur", "Manirampur", "Sharsha"],
        "Satkhira": ["Satkhira Sadar", "Assasuni", "Debhata", "Kalaroa", "Kaliganj", "Shyamnagar", "Tala"],
        "Bagerhat": ["Bagerhat Sadar", "Chitalmari", "Fakirhat", "Kachua", "Mollahat", "Mongla", "Morrelganj", "Rampal", "Sarankhola"],
        "Jhenaidah": ["Jhenaidah Sadar", "Harinakunda", "Kaliganj", "Kotchandpur", "Maheshpur", "Shailkupa"],
        "Kushtia": ["Kushtia Sadar", "Kumarkhali", "Khoksa", "Mirpur", "Daulatpur", "Bheramara"],
        "Magura": ["Magura Sadar", "Mohammadpur", "Shalikha", "Sreepur"],
        "Narail": ["Narail Sadar", "Kalia", "Lohagara"],
        "Chuadanga": ["Chuadanga Sadar", "Alamdanga", "Damurhuda", "Jibannagar"],
        "Meherpur": ["Meherpur Sadar", "Gangni", "Mujibnagar"]
    },
    "Rajshahi": {
        "Rajshahi": ["Rajshahi Sadar", "Godagari", "Tanore", "Bagha", "Charghat", "Durgapur", "Mohanpur", "Paba", "Puthia"],
        "Bogra": ["Bogra Sadar", "Sherpur", "Shibganj", "Adamdighi", "Dhupchanchia", "Gabtali", "Kahaloo", "Nandigram", "Sariakandi", "Shajahanpur", "Sonatala"],
        "Pabna": ["Pabna Sadar", "Atgharia", "Bera", "Bhangura", "Chatmohar", "Faridpur", "Ishwardi", "Santhia", "Sujanagar"],
        "Sirajganj": ["Sirajganj Sadar", "Belkuchi", "Chauhali", "Kamarkhanda", "Kazipur", "Raiganj", "Shahjadpur", "Tarash", "Ullahpara"],
        "Natore": ["Natore Sadar", "Bagatipara", "Baraigram", "Gurudaspur", "Lalpur", "Singra", "Naldanga"],
        "Naogaon": ["Naogaon Sadar", "Atrai", "Badalgachhi", "Dhamoirhat", "Manda", "Mohadevpur", "Niamatpur", "Patnitala", "Porsha", "Raninagar", "Sapahar"],
        "Chapainawabganj": ["Chapainawabganj Sadar", "Bholahat", "Gomastapur", "Nachole", "Shibganj"],
        "Joypurhat": ["Joypurhat Sadar", "Akkelpur", "Kalai", "Khetlal", "Panchbibi"]
    },
    "Sylhet": {
        "Sylhet": ["Sylhet Sadar", "Beanibazar", "Golapganj", "Companiganj", "Fenchuganj", "Balaganj", "Bishwanath", "Gowainghat", "Jaintiapur", "Kanaighat", "Zakiganj", "Dakshin Surma", "Osmani Nagar"],
        "Sunamganj": ["Sunamganj Sadar", "Chhatak", "Jagannathpur", "Derai", "Dharamapasha", "Bishwamvarpur", "Dowarabazar", "Jamalganj", "Sullah", "Tahirpur", "Dakshin Sunamganj"],
        "Habiganj": ["Habiganj Sadar", "Ajmiriganj", "Bahubal", "Baniyachong", "Chunarughat", "Lakhai", "Madhabpur", "Nabiganj", "Shaistaganj"],
        "Moulvibazar": ["Moulvibazar Sadar", "Barlekha", "Juri", "Kamalganj", "Kulaura", "Rajnagar", "Sreemangal"]
    },
    "Barishal": {
        "Barishal": ["Barishal Sadar", "Bakerganj", "Babuganj", "Agailjhara", "Gaurnadi", "Hizla", "Mehendiganj", "Muladi", "Wazirpur", "Banaripara"],
        "Bhola": ["Bhola Sadar", "Burhanuddin", "Char Fasson", "Daulatkhan", "Lalmohan", "Manpura", "Tazumuddin"],
        "Patuakhali": ["Patuakhali Sadar", "Bauphal", "Dashmina", "Galachipa", "Kalapara", "Mirzaganj", "Rangabali", "Dumki"],
        "Pirojpur": ["Pirojpur Sadar", "Bhandaria", "Kawkhali", "Mathbaria", "Nazirpur", "Nesarabad", "Indurkani"],
        "Barguna": ["Barguna Sadar", "Amtali", "Bamna", "Betagi", "Patharghata", "Taltali"],
        "Jhalokathi": ["Jhalokathi Sadar", "Kathalia", "Nalchity", "Rajapur"]
    },
    "Rangpur": {
        "Rangpur": ["Rangpur Sadar", "Pirgachha", "Kaunia", "Badarganj", "Gangachara", "Mithapukur", "Pirganj", "Taraganj"],
        "Dinajpur": ["Dinajpur Sadar", "Birampur", "Birganj", "Bochaganj", "Chirirbandar", "Fulbari", "Ghoraghat", "Hakimpur", "Kaharole", "Khansama", "Nawabganj", "Parbatipur"],
        "Gaibandha": ["Gaibandha Sadar", "Fulchhari", "Gobindaganj", "Palashbari", "Sadullapur", "Saghata", "Sundarganj"],
        "Kurigram": ["Kurigram Sadar", "Bhurungamari", "Char Rajibpur", "Chilmari", "Phulbari", "Nageshwari", "Rajarhat", "Raomari", "Ulipur"],
        "Lalmonirhat": ["Lalmonirhat Sadar", "Aditmari", "Hatibandha", "Kaliganj", "Patgram"],
        "Nilphamari": ["Nilphamari Sadar", "Dimla", "Domar", "Jaldhaka", "Kishoreganj", "Saidpur"],
        "Panchagarh": ["Panchagarh Sadar", "Atwari", "Boda", "Debiganj", "Tetulia"],
        "Thakurgaon": ["Thakurgaon Sadar", "Baliadangi", "Haripur", "Pirganj", "Ranishankail"]
    },
    "Mymensingh": {
        "Mymensingh": ["Mymensingh Sadar", "Muktagachha", "Valuka", "Bhaluka", "Dhobaura", "Fulbaria", "Gafargaon", "Gauripur", "Haluaghat", "Ishwarganj", "Nandail", "Phulpur", "Trishal", "Tara Khanda"],
        "Jamalpur": ["Jamalpur Sadar", "Bakshiganj", "Dewanganj", "Islampur", "Madarganj", "Melandaha", "Sarishabari"],
        "Sherpur": ["Sherpur Sadar", "Jhenaigati", "Nakla", "Nalitabari", "Sreebardi"],
        "Netrokona": ["Netrokona Sadar", "Atpara", "Barhatta", "Durgapur", "Khaliajuri", "Kalmakanda", "Kendua", "Madan", "Mohanganj", "Purbadhala"]
    }
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
    await initDB(); // Wait for DB
    createPopupHTML();

    const menuToggle = document.getElementById('menu-toggle');
    const navList = document.getElementById('nav-list');
    if (menuToggle) menuToggle.addEventListener('click', () => navList.classList.toggle('active'));
    
    await updateCartCount();

    // --- PAGE DETECTION & ROUTING ---
    
    // 1. LOGIN PAGE
    if (document.getElementById('secure-login-form')) {
        handleLogin();
    }

    // 2. ADMIN PAGES (Sidebar Check)
    if (document.querySelector('.sidebar')) {
        if (!sessionStorage.getItem(KEY_ADMIN_TOKEN)) {
            window.location.href = PAGE_LOGIN;
            return;
        }
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
    
    // 4. CHECKOUT PAGE (Dropdown Initialization)
    if (document.getElementById('checkout-form')) {
        initAddressDropdowns(); // Populate Divisions
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

// --- 3. LOGIN SYSTEM ---
function handleLogin() {
    if(sessionStorage.getItem(KEY_ADMIN_TOKEN)) {
        window.location.href = PAGE_DASHBOARD;
        return;
    }
    const form = document.getElementById('secure-login-form');
    form.onsubmit = (e) => {
        e.preventDefault();
        const u = form.username.value.trim();
        const p = form.password.value.trim();
        if (u === ADMIN_USER && p === ADMIN_PASS) {
            sessionStorage.setItem(KEY_ADMIN_TOKEN, "LOGGED_IN");
            window.location.href = PAGE_DASHBOARD;
        } else {
            showPopup('Error', 'Invalid Credentials!', 'error');
        }
    };
}
window.adminLogout = function() {
    sessionStorage.removeItem(KEY_ADMIN_TOKEN);
    window.location.href = PAGE_LOGIN;
};

// --- 4. WEBSITE FUNCTIONS ---
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

        let images = i.images && i.images.length ? i.images : [''];
        let slides = images.map((src) => `<img src="${src}" class="slider-image">`).join('');
        let dots = images.length > 1 ? `<div class="slider-dots" id="dots-${i.id}">${images.map((_, idx) => `<span class="dot ${idx===0?'active':''}" onclick="goToSlide(${idx}, '${i.id}')"></span>`).join('')}</div>` : '';

        return `
        <div class="product-card">
            ${badge}
            <div class="image-wrapper">
                <div class="slider-container" id="slider-${i.id}" onscroll="updateActiveDot(this, '${i.id}')">${slides}</div>
                ${dots}
            </div>
            <div class="product-info">
                <h3>${i.name}</h3>
                <div class="price-container">${priceHTML}</div>
                <div class="product-actions">
                    <button onclick="addToCart('${i.id}')" class="btn secondary-btn">Add to Cart</button>
                    <button onclick="buyNow('${i.id}')" class="btn primary-btn">Buy Now</button>
                </div>
            </div>
        </div>`;
    }).join('') : '<p style="text-align:center;width:100%;color:#777;padding:50px;">No products.</p>';
    
    // Init first slide active
    document.querySelectorAll('.slider-container').forEach(el => { if(el.firstElementChild) el.firstElementChild.classList.add('active'); });
}

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
    if(cart.length===0) { c.innerHTML='<p style="text-align:center;">Empty</p>'; if(t)t.innerText='0'; if(document.querySelector('.checkout-btn'))document.querySelector('.checkout-btn').style.display='none'; return; }
    c.innerHTML = cart.map((x,i)=> `<div class="cart-item"><div class="cart-item-info"><img src="${x.images[0]||''}" style="width:60px;height:60px;object-fit:cover;border-radius:4px;"><div><h4>${x.name}</h4><p>৳${x.price} x ${x.qty}</p><div class="qty-controls"><button class="qty-btn" onclick="upQty(${i},-1)">-</button><span>${x.qty}</span><button class="qty-btn" onclick="upQty(${i},1)">+</button></div></div></div><div style="text-align:right;"><p style="font-weight:bold;color:#ff9f43;">৳${x.price*x.qty}</p><button onclick="rmC(${i})" style="color:#e74c3c;background:none;border:none;cursor:pointer;">Remove</button></div></div>`).join('');
    if(t) t.innerText = cart.reduce((s,i)=>s+(i.price*i.qty),0);
}
window.upQty=async(i,v)=>{let c=await getStorage(KEY_CART);c[i].qty+=v;if(c[i].qty<1){if(confirm("Remove?"))c.splice(i,1);else c[i].qty=1;}await setStorage(KEY_CART,c);await loadCartDisplay();await updateCartCount();}; window.rmC=async(i)=>{let c=await getStorage(KEY_CART);c.splice(i,1);await setStorage(KEY_CART,c);await loadCartDisplay();await updateCartCount();};

// --- CHECKOUT LOGIC WITH ADDRESS & DELIVERY CHARGE ---

function initAddressDropdowns() {
    const divisionSelect = document.getElementById("division");
    if (!divisionSelect) return;
    
    // Load Divisions
    for (let div in bdGeoData) {
        let option = document.createElement("option");
        option.value = div;
        option.text = div;
        divisionSelect.appendChild(option);
    }
}

// Global functions for HTML onchange events
window.loadDistricts = function() {
    const division = document.getElementById("division").value;
    const districtSelect = document.getElementById("district");
    const upazilaSelect = document.getElementById("upazila");

    districtSelect.innerHTML = '<option value="">Select District</option>';
    upazilaSelect.innerHTML = '<option value="">Select Upazila</option>';
    districtSelect.disabled = true;
    upazilaSelect.disabled = true;

    if (division && bdGeoData[division]) {
        districtSelect.disabled = false;
        for (let dist in bdGeoData[division]) {
            let option = document.createElement("option");
            option.value = dist;
            option.text = dist;
            districtSelect.appendChild(option);
        }
    }
    calculateTotal(); // Update charge when district changes
}

window.loadUpazilas = function() {
    const division = document.getElementById("division").value;
    const district = document.getElementById("district").value;
    const upazilaSelect = document.getElementById("upazila");

    upazilaSelect.innerHTML = '<option value="">Select Upazila</option>';
    upazilaSelect.disabled = true;

    if (district && bdGeoData[division][district]) {
        upazilaSelect.disabled = false;
        bdGeoData[division][district].forEach(function(upazila) {
            let option = document.createElement("option");
            option.value = upazila;
            option.text = upazila;
            upazilaSelect.appendChild(option);
        });
    }
    calculateTotal(); // Update charge when district selected (defaults 120 unless Munshiganj Sadar)
}

// NEW: Calculate Total with Delivery Charge
window.calculateTotal = function() {
    const dist = document.getElementById('district').value;
    const upz = document.getElementById('upazila').value;
    const subTotalElem = document.getElementById('checkout-subtotal');
    const chargeElem = document.getElementById('delivery-charge');
    const grandElem = document.getElementById('checkout-grand-total');

    if(!subTotalElem) return;

    let charge = 0;
    
    // Logic: 
    // 1. If District is Munshiganj AND Upazila is Munshiganj Sadar -> 60
    // 2. If District is Munshiganj AND Upazila is NOT Sadar (but selected) -> 120
    // 3. If District is NOT Munshiganj (and selected) -> 120
    // 4. Default -> 0
    
    if (dist === "Munshiganj") {
        if (upz === "Munshiganj Sadar") {
            charge = 60;
        } else if (upz) {
            charge = 120; // Munshiganj other upazilas
        } else {
            charge = 0; // Wait for upazila
        }
    } else if (dist) {
        charge = 120; // Outside Munshiganj
    } else {
        charge = 0;
    }

    const subTotal = parseInt(subTotalElem.innerText) || 0;
    chargeElem.innerText = charge;
    grandElem.innerText = subTotal + charge;
}

function handleCheckoutForm() {
    const f = document.getElementById('checkout-form');
    if(f) {
        f.onsubmit = async (e) => {
            e.preventDefault();
            
            // 1. Phone Validation
            const phoneInput = document.getElementById('phone');
            const phoneVal = phoneInput.value.trim();
            const errorMsg = document.getElementById('phone-error');
            const validPrefixes = ['017', '019', '018', '014', '015', '013', '016'];
            const prefix = phoneVal.substring(0, 3);

            if (phoneVal.length !== 11 || !validPrefixes.includes(prefix)) {
                phoneInput.style.borderColor = "#e74c3c";
                errorMsg.style.display = "block";
                phoneInput.scrollIntoView({behavior: "smooth", block: "center"});
                return;
            } else {
                phoneInput.style.borderColor = "#444";
                errorMsg.style.display = "none";
            }

            // 2. Address & Charge
            const div = document.getElementById('division').value;
            const dist = document.getElementById('district').value;
            const upz = document.getElementById('upazila').value;
            const vill = document.getElementById('village').value;
            const land = document.getElementById('landmark').value;
            const deliveryCharge = parseInt(document.getElementById('delivery-charge').innerText) || 0;

            if(!div || !dist || !upz || !vill) {
                showPopup('Missing Info', 'Please select Division, District, Upazila and enter Village.', 'error');
                return;
            }

            const fullAddress = `Vill: ${vill}, ${land ? 'Landmark: '+land+', ' : ''}Upz: ${upz}, Dist: ${dist}, Div: ${div}`;

            // 3. Cart Validation
            const c = await getStorage(KEY_CART);
            if(c.length===0) return showPopup('Error', 'Cart Empty', 'error');
            
            // 4. Save Order
            let cnt = parseInt(await getStorage(KEY_ORDER_COUNT))||0; cnt++; await setStorage(KEY_ORDER_COUNT, cnt);
            const id = 'ORD-'+String(cnt).padStart(3,'0');
            const subTot = c.reduce((s,i)=>s+(i.price*i.qty),0);
            const grandTot = subTot + deliveryCharge;
            
            const ord = { 
                id: id, 
                date: new Date().toLocaleDateString(), 
                customer: { 
                    name: f.name.value, 
                    phone: phoneVal, 
                    address: fullAddress 
                }, 
                items: c, 
                subTotal: subTot,
                deliveryCharge: deliveryCharge,
                total: grandTot, 
                status: 'Pending' 
            };
            
            const o = await getStorage(KEY_ORDERS); o.unshift(ord); 
            await setStorage(KEY_ORDERS, o); await setStorage(KEY_CART, []); await updateCartCount();
            
            const l = c.map(i => `- ${i.name} (x${i.qty})`).join('\n');
            showPopup('Order Confirmed!', `ID: ${id}\n\n${l}\n\nSubtotal: ৳${subTot}\nDelivery: ৳${deliveryCharge}\nTotal: ৳${grandTot}`, 'success', 'index.html');
        };
    }
}

async function loadCartSummaryForCheckout() { 
    const el = document.getElementById('checkout-subtotal'); 
    if(el) { 
        const c = await getStorage(KEY_CART); 
        const sub = c.reduce((s,i)=>s+(i.price*i.qty),0);
        el.innerText = sub;
        calculateTotal(); // Update grand total with default 0 charge
    }
}

// Feedback
function handleContactForm() {
    const f=document.getElementById('contact-form');
    if(f) {
        f.onsubmit = async (e) => {
            e.preventDefault();
            const m = {
                id: Date.now(), date: new Date().toLocaleDateString(), 
                name: f.name.value, email: f.email.value, subject: f.subject.value, message: f.message.value, isRead: false
            };
            const ms = await getStorage(KEY_MESSAGES); ms.unshift(m); 
            await setStorage(KEY_MESSAGES, ms); 
            f.reset(); showPopup('Success', 'Feedback Sent!', 'success');
        };
    }
}

// --- 5. ADMIN FUNCTIONS ---
function initAdminProducts() {
    const f=document.getElementById('add-product-form'); const tb=document.querySelector('#product-table tbody'); const input=document.getElementById('imageInput');
    const render=async()=>{const p=await getStorage(KEY_PRODUCTS); if(p.length===0){tb.innerHTML='<tr><td colspan="4" style="text-align:center;">Empty</td></tr>';document.getElementById('current-product-count').innerText=0;return;} tb.innerHTML=p.map((x,i)=>`<tr><td><img src="${x.images[0]}" style="width:40px;"></td><td>${x.name}</td><td>৳${x.price}</td><td><button onclick="delP(${i})" style="color:red;border:none;background:none;">Del</button></td></tr>`).join(''); document.getElementById('current-product-count').innerText=p.length;};
    render();
    if(f) f.addEventListener('submit',async(e)=>{e.preventDefault(); const files=Array.from(input.files); const readFiles=(fl)=>Promise.all(fl.map(f=>new Promise(r=>{const fr=new FileReader(); fr.onload=()=>r(fr.result); fr.readAsDataURL(f);}))); let imgData=[]; if(files.length) imgData=await readFiles(files); const p=await getStorage(KEY_PRODUCTS); p.push({id:Date.now(), name:f.name.value, price:parseFloat(f.price.value), originalPrice:f.oldPrice.value?parseFloat(f.oldPrice.value):null, isNewArrival:f.isNew.checked, images:imgData}); await setStorage(KEY_PRODUCTS, p); f.reset(); render(); showPopup('Success', 'Added!', 'success'); });
    window.delP=async(i)=>{if(confirm('Delete?')){const p=await getStorage(KEY_PRODUCTS);p.splice(i,1);await setStorage(KEY_PRODUCTS,p);render();}};
}

function initAdminOrders() {
    const tb=document.querySelector('#orders-table tbody'); let flt='All';
    const ren=async()=>{ const all=await getStorage(KEY_ORDERS); const l=flt==='All'?all:all.filter(o=>o.status===flt); document.querySelectorAll('.filter-btn').forEach(b=>{if(b.innerText.includes(flt))b.classList.add('active');else b.classList.remove('active');}); if(l.length===0){tb.innerHTML='<tr><td colspan="5" style="text-align:center;">No Orders</td></tr>';return;} tb.innerHTML=l.map(o=>{const ix=all.findIndex(x=>x.id===o.id); return `<tr><td>${o.id}</td><td>${o.customer.name}</td><td>৳${o.total}</td><td><select onchange="upS(${ix},this.value)" style="color:#ff9f43;background:#222;border:1px solid #555"><option ${o.status==='Pending'?'selected':''}>Pending</option><option ${o.status==='Shipped'?'selected':''}>Shipped</option><option ${o.status==='Delivered'?'selected':''}>Delivered</option><option ${o.status==='Cancelled'?'selected':''}>Cancelled</option></select></td><td><button onclick="vOrd('${o.id}')" style="color:#fff;background:none;border:none;">View</button></td></tr>`;}).join(''); }; ren();
    window.filterOrders=(s)=>{flt=s;ren();}; window.upS=async(i,v)=>{const o=await getStorage(KEY_ORDERS);o[i].status=v;await setStorage(KEY_ORDERS,o);ren();}; window.vOrd=async(id)=>{const o=(await getStorage(KEY_ORDERS)).find(x=>x.id===id);if(!o)return;const items=o.items.map(i=>`- ${i.name} x${i.qty}`).join('\n');showPopup('Details',`ID: ${o.id}\nName: ${o.customer.name}\nPhone: ${o.customer.phone}\nAddr: ${o.customer.address}\n\n${items}\n\nSub: ৳${o.subTotal||0}, Del: ৳${o.deliveryCharge||0}\nTotal: ৳${o.total}`,'info');};
}

function initAdminMessages() {
    const tb=document.querySelector('#messages-table tbody'); let vm='New';
    const ren=async()=>{ const all=await getStorage(KEY_MESSAGES); const l=vm==='New'?all.filter(m=>!m.isRead):all.filter(m=>m.isRead); document.querySelectorAll('.filter-btn').forEach(b=>{if(b.innerText.includes(vm))b.classList.add('active');else b.classList.remove('active');}); if(l.length===0){tb.innerHTML='<tr><td colspan="5" style="text-align:center;">No Messages</td></tr>';return;} tb.innerHTML=l.map(m=>{const ix=all.findIndex(x=>x.id===m.id); return `<tr><td>${m.date}</td><td>${m.name}<br><small>${m.email}</small></td><td>${m.subject}</td><td>${m.message}</td><td>${!m.isRead?`<button onclick="mkR(${ix})" style="color:green;background:none;border:none;">Read</button>`:''}<button onclick="delMsg(${ix})" style="color:red;background:none;border:none;">Del</button></td></tr>`;}).join(''); }; ren();
    window.filterMsgs=(m)=>{vm=m;ren();}; window.mkR=async(i)=>{const m=await getStorage(KEY_MESSAGES);m[i].isRead=true;await setStorage(KEY_MESSAGES,m);ren(); updateAdminSidebarBadges();}; window.delMsg=async(i)=>{if(confirm('Delete?')){const m=await getStorage(KEY_MESSAGES);m.splice(i,1);await setStorage(KEY_MESSAGES,m);ren(); updateAdminSidebarBadges();}};
}

async function initAdminDashboard() { const o=await getStorage(KEY_ORDERS); const p=await getStorage(KEY_PRODUCTS); const rev=o.filter(x=>x.status==='Delivered').reduce((s,i)=>s+parseFloat(i.total),0); document.getElementById('stat-revenue').innerText='৳ '+rev; document.getElementById('stat-pending').innerText=o.filter(x=>x.status==='Pending').length; document.getElementById('stat-shipped').innerText=o.filter(x=>x.status==='Shipped').length; document.getElementById('stat-delivered').innerText=o.filter(x=>x.status==='Delivered').length; document.getElementById('stat-cancelled').innerText=o.filter(x=>x.status==='Cancelled').length; document.getElementById('stat-products').innerText=p.length; }

// Utils
function createPopupHTML() { if(!document.querySelector('.custom-popup-overlay')) { const p=document.createElement('div'); p.className='custom-popup-overlay'; p.innerHTML=`<div class="custom-popup-box"><i class="fas fa-info-circle popup-icon"></i><h3 class="popup-title"></h3><p class="popup-msg"></p><button class="btn primary-btn popup-btn">OK</button></div>`; document.body.appendChild(p); p.querySelector('.popup-btn').addEventListener('click', () => { p.classList.remove('active'); if(window.popupRedirect) { window.location.href=window.popupRedirect; window.popupRedirect=null; } }); } }
function showPopup(title, msg, type='info', url=null) { const o=document.querySelector('.custom-popup-overlay'); const i=o.querySelector('.popup-icon'); o.querySelector('.popup-title').innerText=title; o.querySelector('.popup-msg').innerHTML=msg.replace(/\n/g, '<br>'); if(type==='success') i.className='fas fa-check-circle popup-icon popup-success'; else if(type==='error') i.className='fas fa-times-circle popup-icon popup-error'; else i.className='fas fa-info-circle popup-icon popup-info'; if(url) window.popupRedirect=url; o.classList.add('active'); }
async function updateAdminSidebarBadges() { const o = await getStorage(KEY_ORDERS); const m = await getStorage(KEY_MESSAGES); if(o.some(x=>x.status==='Pending') && document.getElementById('nav-orders')) document.getElementById('nav-orders').innerHTML+=' <span class="nav-badge"></span>'; if(m.some(x=>!x.isRead) && document.getElementById('nav-messages')) document.getElementById('nav-messages').innerHTML+=' <span class="nav-badge"></span>'; }
async function updateCartCount() { const c = await getStorage(KEY_CART); const t = c.reduce((s, i) => s + (parseInt(i.qty)||0), 0); document.querySelectorAll('.cart-count').forEach(e => e.innerText = `(${t})`); }
