// kids.js
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.getElementById("form");
const search = document.getElementById("search");
const kidsSection = document.getElementById("kids-section");
const watchlistBtn = document.getElementById("watchlist-btn");
const modal = document.getElementById("movie-modal");
const modalBody = document.getElementById("modal-body");
const closeModal = document.querySelector(".close-modal a");
window.currentTab = "movie"; // Global, fixed to "movie" for kids

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

const getClassByRate = (vote) => {
    if (vote >= 7.5) return "green";
    else if (vote >= 7) return "orange";
    else return "red";
};

const showContent = (items, sectionElement) => {
    const sectionContent = sectionElement.querySelector(".section-content");
    sectionContent.innerHTML = "";
    if (!items || items.length === 0) {
        sectionContent.innerHTML = "<p>No content found.</p>";
        return;
    }
    items.forEach((item) => {
        const { id, title, name, poster_path, vote_average } = item;
        const itemElement = document.createElement("div");
        itemElement.classList.add("movie");
        itemElement.innerHTML = `
            <img src="${poster_path ? IMG_PATH + poster_path : 'https://via.placeholder.com/320x450?text=No+Image'}" alt="${title || name}" />
            <div class="movie-info">
                <h3>${title || name}</h3>
                <span class="${getClassByRate(vote_average)}">${vote_average || 'N/A'}</span>
            </div>
        `;
        itemElement.addEventListener("click", () => openModal(id, currentTab));
        sectionContent.appendChild(itemElement);
    });
};

const getContent = async (url, sectionElement) => {
    try {
        console.log("Fetching URL:", url);
        const res = await fetch(url);
        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`HTTP error! Status: ${res.status}, Response: ${errorText}`);
        }
        const data = await res.json();
        console.log("API Response:", data);
        showContent(data.results, sectionElement);
    } catch (error) {
        console.error("Error fetching content:", error);
        sectionElement.querySelector(".section-content").innerHTML = `<p>Error loading content: ${error.message}</p>`;
    }
};

const loadKidsContent = async () => {
    const url = `${BASE_API}/discover/${currentTab}?api_key=${TMDB_KEY}&sort_by=popularity.desc&with_genres=16,10751`;
    await getContent(url, kidsSection);
};

const openModal = async (id, type) => {
    try {
        const res = await fetch(`${BASE_API}/${type}/${id}?api_key=${TMDB_KEY}&append_to_response=videos,watch/providers,credits`);
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        const item = await res.json();
        const trailer = item.videos.results.find(video => video.type === "Trailer" && video.site === "YouTube");
        const providers = item["watch/providers"]?.results.US?.flatrate || [];
        const cast = item.credits.cast.slice(0, 5);

        modalBody.innerHTML = `
            <div class="modal-banner" style="background-image: url(${IMG_PATH + item.backdrop_path})">
                <h2>${item.title || item.name}</h2>
            </div>
            <div class="modal-content-wrapper">
                <img src="${IMG_PATH + item.poster_path}" alt="${item.title || item.name}" class="modal-poster" />
                <div class="modal-details">
                    <p><strong>Rating:</strong> ${item.vote_average}</p>
                    <p><strong>Overview:</strong> ${item.overview}</p>
                    <button class="btn" id="add-watchlist-btn">Add to Watchlist</button>
                </div>
                <div class="watch-providers">
                    <h3>Watch Now</h3>
                    ${providers.length > 0 ? providers.map(provider => `
                        <div class="provider">
                            <img src="${IMG_PATH + provider.logo_path}" alt="${provider.provider_name}" />
                            <a href="${item["watch/providers"].results.US.link || '#'}">${provider.provider_name}</a>
                        </div>
                    `).join('') : "<p>Not available on streaming platforms.</p>"}
                </div>
            </div>
            <div class="trailer">
                ${trailer ? `<iframe src="https://www.youtube.com/embed/${trailer.key}" frameborder="0" allowfullscreen></iframe>` : "<p>No trailer available.</p>"}
            </div>
            <div class="cast-list">
                <h3>Top Cast</h3>
                <div class="cast-scroll">
                    ${cast.map(actor => `
                        <div class="cast-card" data-person-id="${actor.id}">
                            <img src="${actor.profile_path ? IMG_PATH + actor.profile_path : 'https://via.placeholder.com/100x100?text=No+Image'}" alt="${actor.name}" />
                            <p>${actor.name}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        modal.style.display = "block";

        document.getElementById("add-watchlist-btn").addEventListener("click", async () => {
            const { data: userData } = await supabase.auth.getUser();
            if (!userData?.user) {
                alert("Please log in to add to your watchlist.");
                window.location.href = "login.html";
                return;
            }
            const { error } = await supabase
                .from("watchlist")
                .insert([{ user_id: userData.user.id, content_id: id, content_type: type, title: item.title || item.name }]);
            alert(error ? "Failed to add to watchlist." : `${item.title || item.name} added to watchlist!`);
        });

        document.querySelectorAll(".cast-card").forEach(card => {
            card.addEventListener("click", () => showCastMovies(card.dataset.personId));
        });
    } catch (error) {
        console.error("Error loading modal:", error);
        modalBody.innerHTML = "<p>Error loading details.</p>";
        modal.style.display = "block";
    }
};

const showCastMovies = async (personId) => {
    try {
        const res = await fetch(`${BASE_API}/person/${personId}/movie_credits?api_key=${TMDB_KEY}`);
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        const data = await res.json();
        const movies = data.cast.filter(movie => movie.poster_path);
        modalBody.innerHTML = `
            <h2>Movies Featuring This Cast Member</h2>
            <div class="cast-movies">
                ${movies.map(movie => `
                    <div class="movie">
                        <img src="${IMG_PATH + movie.poster_path}" alt="${movie.title}" />
                        <div class="movie-info">
                            <h3>${movie.title}</h3>
                            <span class="${getClassByRate(movie.vote_average)}">${movie.vote_average || 'N/A'}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        modal.style.display = "block";
    } catch (error) {
        console.error("Error fetching cast movies:", error);
        modalBody.innerHTML = "<p>Error loading cast movies.</p>";
    }
};

closeModal.addEventListener("click", (e) => {
    e.preventDefault();
    const iframe = modalBody.querySelector("iframe");
    if (iframe) iframe.src = "";
    modal.style.display = "none";
});

watchlistBtn.addEventListener("click", async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
        alert("Please log in to view your watchlist.");
        window.location.href = "login.html";
        return;
    }

    const { data, error } = await supabase
        .from("watchlist")
        .select("*")
        .eq("user_id", userData.user.id);

    if (error) {
        kidsSection.querySelector(".section-content").innerHTML = "<p>Error loading watchlist.</p>";
        return;
    }

    kidsSection.querySelector("h2").textContent = "My Watchlist";
    const watchlistItems = await Promise.all(data.map(async (item) => {
        const res = await fetch(`${BASE_API}/${item.content_type}/${item.content_id}?api_key=${TMDB_KEY}`);
        return await res.json();
    }));
    showContent(watchlistItems, kidsSection);
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const searchTerm = search.value.trim();
  if (searchTerm) {
      const url = `${BASE_API}/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(searchTerm)}&with_genres=16,10751`;
      console.log("Search URL:", url);
      await getContent(url, kidsSection);
      search.value = "";
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  await updateAuthButton();
  await loadKidsContent();

  const navToggle = document.querySelector(".nav-toggle");
  const navMenu = document.querySelector(".nav-menu");

  navToggle.addEventListener("click", () => {
      navMenu.classList.toggle("active");
  });
});