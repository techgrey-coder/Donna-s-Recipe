
let loggedInUser;
try {
    loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
} catch (error) {
    localStorage.removeItem('loggedInUser');
}
const alertBox = document.getElementById('alert-box');
const icon = document.querySelector('#toggle-mode i');
icon.className = document.body.classList.contains('dark-mode') ? 'fas fa-sun' : 'fas fa-moon';

const navArea = document.getElementById('navProfile');

if (loggedInUser) {

    const initials = getInitials(loggedInUser.username);

    const bgColor = stringToColor(loggedInUser.username);

    navArea.innerHTML = `
 <a href="/homePage/dashboard/dashboard.html" id="profile-link">
    <div id="avatar" style="background-color:${bgColor};">
        ${initials}
    </div>
</a>
`;

}

document.getElementById('toggle-mode').addEventListener('click', function () {
    const theme = toggleTheme();

    if (theme === 'dark-mode') {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
})

document.getElementById('search-button').addEventListener('click', searchMeals);
const searchBar = document.getElementById('search-bar');
const suggestionsBox = document.getElementById('search-suggestions');
let suggestionTimer;

searchBar.addEventListener('input', function () {
    clearTimeout(suggestionTimer);
    const query = this.value.trim();
    if (!query) {
        showRecentSearches();
        return;
    }
    suggestionTimer = setTimeout(() => loadSuggestions(query), 250);
});

searchBar.addEventListener('focus', function () {
    if (!this.value.trim()) showRecentSearches();
});

searchBar.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') searchMeals();
});

document.addEventListener('click', event => {
    if (!event.target.closest('#search-suggestions') && event.target !== searchBar) suggestionsBox.classList.remove('visible');
});

function showSuggestions(items, label = 'Suggestions') {
    if (!items.length) {
        suggestionsBox.classList.remove('visible');
        return;
    }
    suggestionsBox.innerHTML = `<span class="suggestions-label">${label}</span>${items.slice(0, 6).map(item => `<button type="button" class="suggestion-item" data-query="${escapeHtml(item)}"><i class="fa-solid fa-utensils"></i>${escapeHtml(item)}</button>`).join('')}`;
    suggestionsBox.classList.add('visible');
    suggestionsBox.querySelectorAll('.suggestion-item').forEach(item => item.addEventListener('click', () => {
        searchBar.value = item.dataset.query;
        suggestionsBox.classList.remove('visible');
        searchMeals();
    }));
}

function showRecentSearches() {
    const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    showSuggestions(recent, 'Recent searches');
}

async function loadSuggestions(query) {
    const localSuggestions = ['Nigerian Jollof Rice', 'Egusi Soup', 'Suya', 'Moi Moi', 'Akara', 'Pepper Soup'];
    const matches = localSuggestions.filter(item => item.toLowerCase().includes(query.toLowerCase()));
    try {
        const response = await fetch(`http://127.0.0.1:3000/api/recipes?s=${encodeURIComponent(query)}`);
        const data = await response.json();
        const remoteMatches = (data.meals || []).map(meal => meal.strMeal);
        showSuggestions([...new Set([...matches, ...remoteMatches])]);
    } catch (error) {
        showSuggestions(matches);
    }
}

function escapeHtml(value = '') {
    return String(value).replace(/[&<>'"]/g, character => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[character]));
}

function displayResults(meals) {
    const resultsDiv = document.getElementById('results-grid');
    const resultsCount = document.getElementById('results-count');
    resultsDiv.innerHTML = '';

    if (!meals || meals.length === 0) {
        resultsCount.textContent = '';
        resultsDiv.innerHTML = `<div class="results-message"><i class="fa-solid fa-utensils"></i><h3>No recipes found</h3><p>Try a different ingredient or cuisine.</p></div>`;
        return;
    }

    resultsCount.textContent = `${meals.length} ${meals.length === 1 ? 'recipe' : 'recipes'}`;

    meals.forEach(meal => {
        const card = document.createElement('div');
        card.className = 'meal-card';
        card.id = `meal-${meal.idMeal}`;

        card.innerHTML = `
            <div class="meal-image-wrap">
                <img src="${escapeHtml(meal.strMealThumb)}" alt="${escapeHtml(meal.strMeal)}" loading="lazy" onerror="this.src='/public/image.jpg'">
                <span class="meal-badge">${escapeHtml(meal.strCategory || 'Recipe')}</span>
            </div>
            <div class="meal-content">
                <div class="meal-meta"><span><i class="fa-solid fa-location-dot"></i> ${escapeHtml(meal.strArea || 'International')}</span></div>
                <h3>${escapeHtml(meal.strMeal)}</h3>
                <p class="prep">${escapeHtml((meal.strInstructions || 'A delicious recipe to try at home.').substring(0, 150))}...</p>
                <a class="view-recipe" href="${escapeHtml(meal.strSource || meal.strYoutube || '#')}" target="_blank" rel="noopener noreferrer">View full recipe <i class="fa-solid fa-arrow-up-right-from-square"></i></a>
            </div>
            <div class="reviews" id="reviews-${meal.idMeal}">
        <!-- existing reviews will show up here -->
      </div>

      <form class="review-form" data-meal-id="${meal.idMeal}" data-meal-name="${escapeHtml(meal.strMeal)}">
        <div class="review-controls">
            <select class="rating-input" aria-label="Recipe rating" required>
                <option value="">Rate</option>
                <option value="5">★★★★★</option>
                <option value="4">★★★★☆</option>
                <option value="3">★★★☆☆</option>
                <option value="2">★★☆☆☆</option>
                <option value="1">★☆☆☆☆</option>
            </select>
            <input type="text" placeholder="Share your thoughts..." class="review-input" maxlength="240" required>
            <button type="submit">Post</button>
        </div>
      </form>
            `;

        resultsDiv.appendChild(card)
        renderReviews(meal.idMeal)
    });

    document.querySelectorAll('.review-form').forEach(form => {
        form.addEventListener('submit', handleReviewSubmit);
    });

    if (window.location.hash) {
        document.querySelector(window.location.hash)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}


async function searchMeals() {

    const query = document.getElementById('search-bar').value.trim();
    if (!query) return;

    const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    localStorage.setItem('recentSearches', JSON.stringify([query, ...recent.filter(item => item.toLowerCase() !== query.toLowerCase())].slice(0, 6)));
    suggestionsBox.classList.remove('visible');

    const resultsDiv = document.getElementById('results-grid');
    const resultsCount = document.getElementById('results-count');
    resultsCount.textContent = '';
    resultsDiv.innerHTML = '<div class="results-message loading"><i class="fa-solid fa-circle-notch"></i><h3>Finding something delicious</h3><p>Searching our recipe collection...</p></div>';

    try {
        const response = await fetch(`http://127.0.0.1:3000/api/recipes?s=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('Recipe search failed');
        const data = await response.json();
        displayResults(data.meals);
    } catch (error) {
        resultsCount.textContent = '';
        resultsDiv.innerHTML = '<div class="results-message"><i class="fa-solid fa-wifi"></i><h3>We could not load recipes</h3><p>Check your connection and try again.</p></div>';
    }
}

const initialMeal = new URLSearchParams(window.location.search).get('meal');
if (initialMeal) {
    document.getElementById('search-bar').value = initialMeal;
    searchMeals();
}

function saveReview(mealId, comment, rating, mealName) {
  const reviews = JSON.parse(localStorage.getItem('recipeReviews') || '{}');
  reviews[mealId] = reviews[mealId] || [];
  const username = loggedInUser?.username?.trim() || 'Guest';
  reviews[mealId].unshift({
    text: comment,
    rating,
    mealName,
    username,
    initials: getInitials(username),
    color: stringToColor(username),
    date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  });
  localStorage.setItem('recipeReviews', JSON.stringify(reviews));
}

function handleReviewSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const mealId = form.dataset.mealId;
    const input = form.querySelector('.review-input');
    const rating = form.querySelector('.rating-input').value;
    const commentText = input.value.trim();

    if (!commentText || !rating) return;

    saveReview(mealId, commentText, rating, form.dataset.mealName);
    renderReviews(mealId);
    input.value = '';
}

function renderReviews(mealId) {
  const reviews = JSON.parse(localStorage.getItem('recipeReviews') || '{}');
  const mealReviews = reviews[mealId] || [];

  const reviewsDiv = document.getElementById(`reviews-${mealId}`);

  if (mealReviews.length === 0) {
    reviewsDiv.innerHTML = '<p class="no-reviews">No comments yet. Be the first!</p>';
    return;
  }

  reviewsDiv.innerHTML = mealReviews
    .map(r => `<div class="review">
        <div class="review-author">
            <span class="review-avatar" style="background-color:${escapeHtml(r.color || '#1d8f48')}" aria-hidden="true">${escapeHtml(r.initials || '?')}</span>
            <span class="review-name">${escapeHtml(r.username || 'Guest')}</span>
            <span class="review-date">${escapeHtml(r.date || '')}</span>
        </div>
        <div class="review-stars" aria-label="${escapeHtml(r.rating || 0)} out of 5 stars">${'★'.repeat(Number(r.rating) || 0)}${'☆'.repeat(5 - (Number(r.rating) || 0))}</div>
        <p>${escapeHtml(r.text)}</p>
    </div>`)
    .join('');
}
