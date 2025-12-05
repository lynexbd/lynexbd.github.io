document.addEventListener('DOMContentLoaded', function() {
    
    // --- LOGIN LOGIC ---
    const loginForm = document.getElementById('admin-login-form');
    
    if (loginForm) {
        // যদি আগে থেকেই লগইন করা থাকে, তাহলে ড্যাশবোর্ডে পাঠাবে
        if (sessionStorage.getItem('lynex_admin_logged')) {
            window.location.href = 'admin_dashboard.html';
        }

        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const uInput = e.target.username.value.trim();
            const pInput = e.target.password.value.trim();
            
            // --- SECURITY CONFIG (SPLIT PARTS) ---
            const _u1 = "Sys";
            const _u2 = "Master";
            const _u3 = "_99";
            
            const _p1 = "L7n";
            const _p2 = "@x#";
            const _p3 = "Super!";
            const _p4 = "2025";

            // জোড়া লাগানো হচ্ছে
            const realUser = _u1 + _u2 + _u3; 
            const realPass = _p1 + _p2 + _p3 + _p4; 

            // চেক করা হচ্ছে
            if (uInput === realUser && pInput === realPass) {
                sessionStorage.setItem('lynex_admin_logged', 'true');
                alert('Access Granted');
                window.location.href = 'admin_dashboard.html'; // ড্যাশবোর্ড পেজের নাম
            } else {
                alert('Access Denied! Wrong ID or Key.');
                e.target.reset();
            }
        });
    }

    // --- LOGOUT LOGIC ---
    // যে লিংকে onclick="adminLogout()" দেওয়া আছে সেখানে কাজ করবে
    window.adminLogout = function() {
        sessionStorage.removeItem('lynex_admin_logged');
        window.location.href = 'admin_login.html'; // লগইন পেজের নাম
    };

    // --- ADMIN SECURITY CHECK (অন্য পেজের জন্য) ---
    // যদি ব্রাউজারের ইউআরএলে 'admin_' থাকে এবং 'login' না থাকে
    const path = window.location.pathname;
    if (path.includes('admin_') && !path.includes('login')) {
        if (!sessionStorage.getItem('lynex_admin_logged')) {
            window.location.href = 'admin_login.html';
        }
    }
});
