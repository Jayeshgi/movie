const supabase = window.supabase.createClient(
  "https://oejfjzprlrobomfozile.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lamZqenBybHJvYm9tZm96aWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMzMjc3NTcsImV4cCI6MjA1ODkwMzc1N30.VlQuU-opluYy2cTJXOIRNNnyyYOn62qzrzFsA0BYKvU"
);

const modal = document.getElementById("movie-modal");
const modalBody = document.getElementById("modal-body");
const closeModal = document.querySelector(".close-modal a");

const addToWatchlist = async (id, type, title) => {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData || !userData.user) {
    alert("Please log in to add to your watchlist.");
    window.location.href = "login.html";
    return;
  }
  const userId = userData.user.id;

  const { error } = await supabase
    .from("watchlist")
    .insert([{ user_id: userId, content_id: id, content_type: type, title }]);

  if (error) {
    console.error("Error adding to watchlist:", error);
    alert("Failed to add to watchlist.");
  } else {
    alert(`${title} added to watchlist!`);
  }
};

const openModal = async (id, type) => {
  try {
    const res = await fetch(`${BASE_API}/${type}/${id}?api_key=${KEY}&append_to_response=credits,videos,watch/providers`);
    if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
    const item = await res.json();
    const trailer = item.videos.results.find((video) => video.type === "Trailer" && video.site === "YouTube");
    const providers = item["watch/providers"].results.US || {};
    const flatrateProviders = providers.flatrate || [];
    modalBody.innerHTML = `
      <img src="${IMG_PATH + item.poster_path}" alt="${item.title || item.name}" />
      <h2>${item.title || item.name}</h2>
      <p><strong>Rating:</strong> ${item.vote_average}</p>
      <p><strong>Overview:</strong> ${item.overview}</p>
      <button class="btn liquid" id="add-watchlist-btn">Add to Watchlist</button>
      ${trailer ? `<div class="trailer">
             <iframe id="trailer-iframe" src="https://www.youtube.com/embed/${trailer.key}" frameborder="0" allowfullscreen></iframe>
           </div>` : "<p>No trailer available.</p>"}
      <div class="watch-providers">
        <h3>Watch Now</h3>
        ${flatrateProviders.length > 0 ? `<div class="provider-list">
                 ${flatrateProviders.map((provider) => `
                       <div class="provider">
                         <img src="${IMG_PATH + provider.logo_path}" alt="${provider.provider_name}" />
                         <a href="${providers.link || "#"}" target="_blank">${provider.provider_name}</a>
                       </div>
                     `).join("")}
               </div>` : "<p>Not available on streaming platforms.</p>"}
      </div>
      <h3>Cast</h3>
      <div class="cast-list">
        ${item.credits.cast.slice(0, 5).map((actor) => `
              <div class="cast-card" data-person-id="${actor.id}">
                <img src="${actor.profile_path ? IMG_PATH + actor.profile_path : "https://via.placeholder.com/100?text=No+Image"}" alt="${actor.name}" />
                <p>${actor.name}</p>
                <p><em>as ${actor.character}</em></p>
              </div>
            `).join("")}
      </div>
    `;
    modal.style.display = "block";

    document.getElementById("add-watchlist-btn").addEventListener("click", () => addToWatchlist(id, type, item.title || item.name));

    document.querySelectorAll(".cast-card").forEach((card) => {
      card.addEventListener("click", () => {
        const personId = card.dataset.personId;
        fetchContentByCast(personId);
        modal.style.display = "none";
      });
    });
  } catch (error) {
    console.error("Error fetching details:", error);
    modalBody.innerHTML = "<p>Error loading details.</p>";
    modal.style.display = "block";
  }
};

const fetchContentByCast = async (personId) => {
  try {
    const res = await fetch(`${BASE_API}/person/${personId}/${currentTab === "movies" ? "movie_credits" : "tv_credits"}?api_key=${KEY}`);
    if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
    const data = await res.json();
    const section = document.getElementById(window.location.pathname.includes("kids.html") ? "kids-section" : "trending-section");
    let url = `${BASE_API}/discover/${currentTab === "movies" ? "movie" : "tv"}?api_key=${KEY}&with_cast=${personId}&sort_by=popularity.desc`;
    if (window.location.pathname.includes("kids.html")) {
      url += `&with_genres=16,10751&certification_country=US&certification.lte=${currentTab === "movies" ? "PG" : "TV-Y7"}`;
    }
    getContent(url, section, currentTab === "movies" ? "movie" : "tv");
  } catch (error) {
    console.error("Error fetching content by cast:", error);
    const section = document.getElementById(window.location.pathname.includes("kids.html") ? "kids-section" : "trending-section");
    section.querySelector(".section-content").innerHTML = "<p>Error loading content for this cast member.</p>";
  }
};

closeModal.addEventListener("click", (e) => {
  e.preventDefault();
  const iframe = document.getElementById("trailer-iframe");
  if (iframe) {
    const src = iframe.src;
    iframe.src = "";
    iframe.src = src;
  }
  modal.style.display = "none";
});