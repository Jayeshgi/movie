// auth.js
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.getElementById("auth-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const authMessage = document.getElementById("auth-message");
const loginBtn = document.getElementById("login-btn");
const signupBtn = document.getElementById("signup-btn");
const authTitle = document.getElementById("auth-title");
const backToLoginLink = document.getElementById("back-to-login");

let isSignupMode = false;

const toggleAuthMode = (mode) => {
    isSignupMode = mode === "signup";
    if (isSignupMode) {
        authTitle.textContent = "Sign Up";
        loginBtn.style.display = "none";
        signupBtn.style.display = "block";
        signupBtn.textContent = "Create Account";
        backToLoginLink.style.display = "block";
    } else {
        authTitle.textContent = "Login or Sign Up";
        loginBtn.style.display = "block";
        signupBtn.style.display = "block";
        signupBtn.textContent = "Sign Up";
        backToLoginLink.style.display = "none";
    }
    authMessage.textContent = "";
};

signupBtn.addEventListener("click", (e) => {
    e.preventDefault();
    if (!isSignupMode) {
        toggleAuthMode("signup");
    } else {
        signup();
    }
});

backToLoginLink.addEventListener("click", (e) => {
    e.preventDefault();
    toggleAuthMode("login");
});

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (isSignupMode) {
        signup();
    } else {
        login();
    }
});

const login = async () => {
    const email = emailInput.value;
    const password = passwordInput.value;

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        authMessage.textContent = "Login failed: " + error.message;
    } else {
        authMessage.textContent = "Login successful!";
        localStorage.setItem("user", email);
        setTimeout(() => window.location.href = "index.html", 1000);
    }
};

const signup = async () => {
    const email = emailInput.value;
    const password = passwordInput.value;

    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
        authMessage.textContent = "Signup failed: " + error.message;
    } else {
        authMessage.textContent = "Signup successful! Please check your email to confirm.";
        toggleAuthMode("login");
    }
};

(async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user) {
        window.location.href = "index.html";
    }
})();