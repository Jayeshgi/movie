// login.js
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const updateAuthButton = async () => {
    const authItem = document.querySelector(".nav-menu li:last-child");
    if (!authItem) return;

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
        authItem.innerHTML = `<button class="btn" id="login-btn"><span>Login</span></button>`;
        document.getElementById("login-btn").addEventListener("click", () => {
            window.location.href = "login.html";
        });
    } else {
        authItem.innerHTML = `<button class="btn" id="logout-btn"><span>Logout</span></button>`;
        document.getElementById("logout-btn").addEventListener("click", async () => {
            await supabase.auth.signOut();
            localStorage.removeItem("user");
            window.location.href = "login.html";
        });
    }
};

document.addEventListener("DOMContentLoaded", () => {
    const navToggle = document.querySelector(".nav-toggle");
    const navMenu = document.querySelector(".nav-menu");
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const tabButtons = document.querySelectorAll(".tab-btn");
    const tabIndicator = document.querySelector(".tab-indicator");
    const togglePwButtons = document.querySelectorAll(".toggle-pw");
    const passwordInput = document.getElementById("register-password");
    const strengthFill = document.querySelector(".strength-fill");
    const strengthText = document.querySelector(".strength-text");

    // Navbar toggle
    navToggle.addEventListener("click", () => {
        navMenu.classList.toggle("active");
    });

    // Update auth button
    updateAuthButton();

    // Tab switching
    tabButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            tabButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            document.querySelectorAll(".auth-form").forEach(form => form.classList.remove("active"));
            document.getElementById(`${btn.dataset.tab}Form`).classList.add("active");

            const index = btn.dataset.tab === "login" ? 0 : 1;
            tabIndicator.style.left = `${index * 50}%`;
        });
    });

    // Password visibility toggle
    togglePwButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const input = btn.previousElementSibling;
            const icon = btn.querySelector("i");
            if (input.type === "password") {
                input.type = "text";
                icon.classList.replace("fa-eye", "fa-eye-slash");
            } else {
                input.type = "password";
                icon.classList.replace("fa-eye-slash", "fa-eye");
            }
        });
    });

    // Password strength indicator
    passwordInput.addEventListener("input", () => {
        const value = passwordInput.value;
        let strength = 0;
        if (value.length > 0) strength += 20;
        if (value.length >= 8) strength += 20;
        if (/[A-Z]/.test(value)) strength += 20;
        if (/[0-9]/.test(value)) strength += 20;
        if (/[^A-Za-z0-9]/.test(value)) strength += 20;

        strengthFill.style.width = `${strength}%`;
        if (strength <= 40) {
            strengthFill.style.background = "#e50914";
            strengthText.textContent = "Weak";
        } else if (strength <= 80) {
            strengthFill.style.background = "#ff9800";
            strengthText.textContent = "Medium";
        } else {
            strengthFill.style.background = "#46d369";
            strengthText.textContent = "Strong";
        }
    });

    // Login form submission
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("login-email").value;
        const password = document.getElementById("login-password").value;

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            alert("Login failed: " + error.message);
        } else {
            alert("Login successful! Redirecting...");
            setTimeout(() => {
                window.location.href = "index.html";
            }, 1000);
        }
    });

    // Register form submission
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = document.getElementById("register-username").value;
        const email = document.getElementById("register-email").value;
        const password = document.getElementById("register-password").value;
        const confirmPassword = document.getElementById("register-confirm-password").value;

        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { username }
            }
        });

        if (error) {
            alert("Registration failed: " + error.message);
        } else {
            alert("Registration successful! Please check your email to verify your account.");
            // Optionally log in immediately after signup
            await supabase.auth.signInWithPassword({ email, password });
            setTimeout(() => {
                window.location.href = "index.html";
            }, 1000);
        }
    });
});