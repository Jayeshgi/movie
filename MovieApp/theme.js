// theme.js (Netflix doesn't typically have a theme switcher, but keeping it for flexibility)
const themeSwitcher = document.getElementById("theme-switcher");
const body = document.body;

if (themeSwitcher && body) {
    if (!localStorage.getItem("theme")) {
        body.classList.add("dark");
        themeSwitcher.checked = true;
    } else {
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme === "dark") {
            body.classList.add("dark");
            themeSwitcher.checked = true;
        } else {
            body.classList.remove("dark");
            themeSwitcher.checked = false;
        }
    }

    themeSwitcher.addEventListener("change", () => {
        if (themeSwitcher.checked) {
            body.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            body.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }
    });
}