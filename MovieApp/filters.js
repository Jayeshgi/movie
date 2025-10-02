// filters.js
const genreFilter = document.getElementById("genre-filter");
const yearFilter = document.getElementById("year-filter");
const ratingFilter = document.getElementById("rating-filter");

if (genreFilter && yearFilter && ratingFilter) {
    const applyFilters = () => {
        const isKidsPage = window.location.pathname.includes("kids.html");
        const section = document.getElementById(isKidsPage ? "kids-section" : "trending-section");
        const contentType = isKidsPage ? "movie" : (window.currentTab || "movie"); // Default to movie if undefined
        let url = `${BASE_API}/discover/${contentType}?api_key=${TMDB_KEY}&sort_by=popularity.desc`;
        const filters = [];

        if (isKidsPage) {
            filters.push("with_genres=16,10751&certification_country=US&certification.lte=PG");
        } else if (genreFilter.value) {
            filters.push(`with_genres=${genreFilter.value}`);
        }

        if (yearFilter.value) {
            filters.push(contentType === "movie" ? `primary_release_year=${yearFilter.value}` : `first_air_date_year=${yearFilter.value}`);
        }

        if (ratingFilter.value) {
            filters.push(`vote_average.gte=${ratingFilter.value}`);
        }

        if (filters.length > 0) {
            url += `&${filters.join("&")}`;
        }

        console.log("Filter URL:", url); // Debug log
        getContent(url, section); // Assumes getContent is available from script.js or kids.js
    };

    genreFilter.addEventListener("change", applyFilters);
    yearFilter.addEventListener("change", applyFilters);
    ratingFilter.addEventListener("change", applyFilters);

    // Apply filters on page load if values are pre-selected
    applyFilters();
}