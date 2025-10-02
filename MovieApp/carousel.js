// carousel.js
const carouselInner = document.querySelector(".carousel-inner");
const prevBtn = document.querySelector(".carousel-control.prev");
const nextBtn = document.querySelector(".carousel-control.next");
let currentIndex = 0;
let items = [];

const fetchCarouselItems = async (tab = "movie") => {
    try {
        const mediaType = tab === "movies" ? "movie" : tab;
        const url = `${BASE_API}/trending/${mediaType}/week?api_key=${TMDB_KEY}`;
        console.log(`Fetching carousel for: ${mediaType}, URL: ${url}`);
        const res = await fetch(url);
        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`HTTP error! Status: ${res.status}, Response: ${errorText}`);
        }
        const data = await res.json();
        console.log(`Carousel API Response for ${mediaType}:`, data);
        if (!data.results || !Array.isArray(data.results)) {
            throw new Error(`No results found in API response for ${mediaType}`);
        }
        items = data.results.slice(0, 5);
        displayCarousel();
    } catch (error) {
        console.error(`Error fetching carousel items for ${tab}:`, error);
        carouselInner.innerHTML = `<p>Error loading carousel for ${tab}.</p>`;
    }
};

const displayCarousel = () => {
    carouselInner.innerHTML = "";
    if (items.length === 0) {
        carouselInner.innerHTML = "<p>No items to display.</p>";
        return;
    }
    items.forEach((item) => {
        const div = document.createElement("div");
        div.classList.add("carousel-item");
        div.style.backgroundImage = `url(${IMG_PATH + item.backdrop_path})`;
        div.innerHTML = `
            <h2>${item.title || item.name}</h2>
            <button class="btn" onclick="openModal(${item.id}, '${item.media_type || (items[0].media_type === 'movie' ? 'movie' : 'tv')}')">More Info</button>
        `;
        carouselInner.appendChild(div);
    });
    updateCarousel();
};

const updateCarousel = () => {
    if (items.length > 0) {
        carouselInner.style.transform = `translateX(-${currentIndex * 100}%)`;
    }
};

prevBtn.addEventListener("click", () => {
    currentIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
    updateCarousel();
});

nextBtn.addEventListener("click", () => {
    currentIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
    updateCarousel();
});

setInterval(() => {
    if (items.length > 0) {
        currentIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        updateCarousel();
    }
}, 5000);

window.fetchCarouselItems = fetchCarouselItems;