const alertBox = document.getElementById("alert-box")

async function loadDashboard() {
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = "/authentication/login/login.html";
        return;
    }

    const response = await fetch('/homePage/dashboard/dashboard', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {

        localStorage.removeItem('token');
        window.location.href = "/authentication/login/login.html";
        return;
    }

    const data = await response.json();

    const welcomeMessage = document.getElementById('welcome-message');

    const initials = getInitials(data.user.username);

    const bgColor = stringToColor(data.user.username);

    welcomeMessage.innerHTML = `<div class="nav-user">
    <div id="avatar" style="background-color:${bgColor};">
        ${initials}
    </div>

    <div class="user-info">
        <span class="welcome">Welcome,</span>
        <span class="username">${data.user.username}</span>
    </div>

   <button id="logout">Logout</button>
</div > `;

    document.getElementById('logout').addEventListener('click', function () {

        alertBox.textContent = "Logged Out Successfully";
        alertBox.style.display = 'block';

        setTimeout(function () {

            alertBox.style.opacity = "0";

            setTimeout(function () {
                localStorage.removeItem('loggedInUser');
                window.location.reload();
            }, 300);
        }, 3000);

    })

    renderUserReviews(data.user.username);

    const themeToggle = document.getElementById('dashboard-theme-toggle');
    const themeIcon = themeToggle.querySelector('i');
    themeIcon.className = document.body.classList.contains('dark-mode') ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    themeToggle.addEventListener('click', () => {
        const theme = toggleTheme();
        themeIcon.className = theme === 'dark-mode' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    });
}

function escapeReview(value = '') {
    return String(value).replace(/[&<>'"]/g, character => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[character]));
}

function renderUserReviews(username) {
    const container = document.getElementById('user-reviews');
    const storedReviews = JSON.parse(localStorage.getItem('recipeReviews') || '{}');
    const reviews = Object.entries(storedReviews).flatMap(([mealId, mealReviews]) =>
        mealReviews.map((review, index) => ({ ...review, mealId, index }))
    ).filter(review => review.username === username);

    if (!reviews.length) {
        container.innerHTML = '<div class="empty-reviews"><i class="fa-regular fa-comment-dots"></i><h3>No reviews yet</h3><p>Your recipe reviews will appear here.</p></div>';
        return;
    }

    container.innerHTML = reviews.map(review => `
        <article class="dashboard-review" data-meal-id="${escapeReview(review.mealId)}" data-review-index="${review.index}">
            <a class="review-main" href="/homePage/home/home.html?meal=${encodeURIComponent(review.mealName || '')}#meal-${encodeURIComponent(review.mealId)}">
                <span class="review-avatar" style="background-color:${escapeReview(review.color || '#1d8f48')}">${escapeReview(review.initials || '?')}</span>
                <div class="dashboard-review-content">
                    <h3>${escapeReview(review.mealName || 'Recipe')}</h3>
                    <div class="review-stars">${'★'.repeat(Number(review.rating) || 0)}${'☆'.repeat(5 - (Number(review.rating) || 0))}</div>
                    <p>${escapeReview(review.text)}</p>
                    <span>${escapeReview(review.date || '')}</span>
                </div>
            </a>
            <div class="review-actions"><button type="button" class="edit-review">Edit</button><button type="button" class="delete-review">Delete</button></div>
        </article>
    `).join('');

    container.querySelectorAll('.edit-review').forEach(button => button.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        editReview(button.closest('.dashboard-review'), username);
    }));
    container.querySelectorAll('.delete-review').forEach(button => button.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        deleteReview(button.closest('.dashboard-review'), username);
    }));
}

function editReview(card, username) {
    const reviews = JSON.parse(localStorage.getItem('recipeReviews') || '{}');
    const review = reviews[card.dataset.mealId][Number(card.dataset.reviewIndex)];
    const content = card.querySelector('.dashboard-review-content');
    const text = content.querySelector('p');
    const input = document.createElement('textarea');
    input.className = 'review-edit-input';
    input.value = review.text;
    input.maxLength = 240;
    text.replaceWith(input);

    const actions = card.querySelector('.review-actions');
    actions.innerHTML = '<button type="button" class="save-review">Save</button><button type="button" class="cancel-review">Cancel</button>';
    actions.querySelector('.save-review').addEventListener('click', () => {
        const updatedText = input.value.trim();
        if (!updatedText) return;
        review.text = updatedText;
        localStorage.setItem('recipeReviews', JSON.stringify(reviews));
        renderUserReviews(username);
    });
    actions.querySelector('.cancel-review').addEventListener('click', () => renderUserReviews(username));
    input.focus();
}

function deleteReview(card, username) {
    if (!window.confirm('Delete this review?')) return;
    const reviews = JSON.parse(localStorage.getItem('recipeReviews') || '{}');
    const mealReviews = reviews[card.dataset.mealId];
    mealReviews.splice(Number(card.dataset.reviewIndex), 1);
    if (!mealReviews.length) delete reviews[card.dataset.mealId];
    localStorage.setItem('recipeReviews', JSON.stringify(reviews));
    renderUserReviews(username);
}

loadDashboard();
