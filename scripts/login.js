const alertBox = document.getElementById('alert-box');

document.getElementById("login-form").addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value;

    const password = document.getElementById("password").value;

    const response = await fetch('http://127.0.0.1:3000/authentication/login/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
    const data = await response.json().catch(() => ({
        message: `Login request failed (${response.status})`
    }));

    if (response.ok) {
        alertBox.textContent = data.message;
        alertBox.style.display = 'block';

        setTimeout(function () {

            alertBox.style.opacity = "0";

            setTimeout(function () {
                localStorage.setItem('token', data.token);
                localStorage.setItem('loggedInUser', JSON.stringify({
                    username: data.username,
                    email
                }));
                window.location.href = "/homePage/home/home.html";
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

document.getElementById('togglePassword').addEventListener('click', function () {
    const passwordInput = document.getElementById('password');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        this.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        this.classList.replace('fa-eye-slash', 'fa-eye');
    }
});
