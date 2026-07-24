const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const usersFile = path.join(__dirname, 'data', 'users.json');
fs.mkdirSync(path.dirname(usersFile), { recursive: true });

let users = [];
try {
    users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
} catch (error) {
    fs.writeFileSync(usersFile, '[]');
}

function saveUsers() {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

const SECRET_KEY = process.env.SECRET_KEY || 'dev-secret';
const reviews = [];

app.get("/test", (req, res) => {
    res.send("MY SERVER IS RUNNING");
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/authPage.html');
});

app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/authentication/login/login.html');
});

const nigerianRecipes = [
    {
        idMeal: 'ng-jollof-rice', strMeal: 'Nigerian Jollof Rice', strCategory: 'Rice', strArea: 'Nigerian',
        strMealThumb: '/public/jollofrice.jpeg',
        strInstructions: 'Cook blended tomatoes, peppers, onion, and spices into a rich stew. Add stock and parboiled rice, then cover and steam until tender.'
    },
    {
        idMeal: 'ng-egusi-soup', strMeal: 'Egusi Soup', strCategory: 'Soup', strArea: 'Nigerian',
        strMealThumb: '/public/egusi.jpeg',
        strInstructions: 'Toast ground egusi lightly, then simmer with palm oil, peppers, stock, leafy greens, and your choice of meat or fish.'
    },
    {
        idMeal: 'ng-suya', strMeal: 'Nigerian Suya', strCategory: 'Street Food', strArea: 'Nigerian',
        strMealThumb: '/public/suya.jpeg',
        strInstructions: 'Coat thin slices of beef or chicken with suya spice and oil. Grill until charred at the edges and serve with onions and tomatoes.'
    },
    {
        idMeal: 'ng-moi-moi', strMeal: 'Moi Moi', strCategory: 'Legume', strArea: 'Nigerian',
        strMealThumb: '/public/moimoi.jpeg',
        strInstructions: 'Blend soaked beans with peppers, onion, and seasoning. Pour into moulds and steam until firm and cooked through.'
    },
    {
        idMeal: 'ng-akara', strMeal: 'Akara', strCategory: 'Breakfast', strArea: 'Nigerian',
        strMealThumb: '/public/akara.jpeg',
        strInstructions: 'Blend peeled beans with onion and pepper into a thick batter. Season, scoop into hot oil, and fry until golden.'
    },
    {
        idMeal: 'ng-pepper-soup', strMeal: 'Nigerian Pepper Soup', strCategory: 'Soup', strArea: 'Nigerian',
        strMealThumb: '/public/peppersoup.jpeg',
        strInstructions: 'Simmer meat or fish with pepper soup spice, peppers, onion, herbs, and stock until deeply seasoned and tender.'
    }
];

app.get('/api/recipes', async (req, res) => {
    const query = String(req.query.s || '').trim();

    if (!query) {
        return res.status(400).json({ message: 'A recipe search term is required.' });
    }

    try {
        const response = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`);

        if (!response.ok) {
            return res.status(502).json({ message: 'Recipe service is unavailable.' });
        }

        const mealData = await response.json();
        const searchText = query.toLowerCase();
        const localMeals = nigerianRecipes.filter(meal =>
            `${meal.strMeal} ${meal.strCategory} ${meal.strArea}`.toLowerCase().includes(searchText)
        );
        const remoteMeals = mealData.meals || [];
        const existingNames = new Set(remoteMeals.map(meal => meal.strMeal.toLowerCase()));
        const meals = [...remoteMeals, ...localMeals.filter(meal => !existingNames.has(meal.strMeal.toLowerCase()))];

        res.json({ meals });
    } catch (error) {
        const searchText = query.toLowerCase();
        const localMeals = nigerianRecipes.filter(meal =>
            `${meal.strMeal} ${meal.strCategory} ${meal.strArea}`.toLowerCase().includes(searchText)
        );

        if (localMeals.length > 0) {
            return res.json({ meals: localMeals });
        }

        res.status(502).json({ message: 'Unable to reach the recipe service.' });
    }
});

app.post('/reviews', (req, res) => {
    const { mealId, text } = req.body;

    if (!mealId || !text) {
        return res.status(400).json({ message: 'Missing mealId or text.' });
    }

    const newReview = {
        mealId,
        text,
        date: new Date().toLocaleDateString()
    };

    reviews.push(newReview);
    res.status(200).json(newReview);
});

app.get('/reviews/:mealId', (req, res) => {
    const { mealId } = req.params;

    const mealReviews = reviews.filter(r => r.mealId === mealId);

    res.json(mealReviews);
});

app.post('/authentication/signup/signup', async (req, res) => {
    const { username, email, password } = req.body;

    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
        return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = { username, email, hashedPassword };
    users.push(newUser);
    saveUsers();

    console.log(users);

    res.status(201).json({ message: 'Signup Successful' })
})

app.post('/authentication/login/login', async (req, res) => {
    const { email, password } = req.body;

    const user = users.find(user => user.email === email);
    if (!user) {
        return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.hashedPassword);
    if (!isMatch) {
        return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
        { email: user.email, username: user.username },
        SECRET_KEY,
        { expiresIn: '1h' }
    )

    res.status(200).json({
        message: 'Login Successful',
        token,
        username: user.username
    });
})

function verifyToken(req, res, next) {

    const authHandler = req.headers.authorization;

    if (!authHandler) {
        return res.status(401).json({ message: 'No token provided' });
    }
    const token = authHandler.split(' ')[1];

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;

        next();
    } catch (err) {
        return res.status(403).json({ message: 'Invalid or expired token.' });
    }
}

app.get('/homePage/dashboard/dashboard', verifyToken, (req, res) => {
    res.json({ message: `Welcome ${req.user.username}!`, user: req.user });
})

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
