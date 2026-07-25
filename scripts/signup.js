const alertBox = document.getElementById('alert-box');
const apiBaseUrl = (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') && window.location.port === '5500'
    ? 'http://127.0.0.1:3000'
    : '';

document.getElementById("signup-form").addEventListener("submit", async function (e) {
    e.preventDefault();

    const username = document.getElementById("username").value;

    const email = document.getElementById("email").value;

    const password = document.getElementById("password").value;

    const response = await fetch(`${apiBaseUrl}/authentication/signup/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
    });
    console.log(response.status);

    const data = await response.json().catch(() => ({
        message: `Signup request failed (${response.status})`
    }));

    if (response.ok) {
        alertBox.textContent = data.message;
        alertBox.style.display = 'block';

        setTimeout(function () {

            alertBox.style.opacity = "0";

            setTimeout(function () {
                window.location.href = "/authentication/login/login.html";
            }, 300);
        }, 3000);
    } else {
        alertBox.textContent = data.message;
        alertBox.style.display = 'block';

        setTimeout(function () {

            alertBox.style.opacity = "0";

            setTimeout(function () {
                window.location.reload();
            }, 300);
        }, 3000);
    }

})
