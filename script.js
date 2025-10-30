// User authentication and quote calculator functionality
class VinylQuoteApp {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAuthStatus();
    }

    bindEvents() {
        // Auth tab switching
        document.getElementById('login-tab').addEventListener('click', () => this.showLoginForm());
        document.getElementById('signup-tab').addEventListener('click', () => this.showSignupForm());

        // Form submissions
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('signupForm').addEventListener('submit', (e) => this.handleSignup(e));

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => this.logout());

        // Quote calculator
        document.getElementById('doors-input').addEventListener('input', () => this.handleDoorsInput());
        document.querySelectorAll('input[name="material"]').forEach(radio => {
            radio.addEventListener('change', () => this.handleMaterialSelection());
        });
        document.getElementById('transport-input').addEventListener('input', () => this.handleTransportInput());
        document.getElementById('calculate-btn').addEventListener('click', () => this.calculateQuote());
        document.getElementById('new-quote-btn').addEventListener('click', () => this.resetQuote());
    }

    showLoginForm() {
        document.getElementById('login-tab').classList.add('active');
        document.getElementById('signup-tab').classList.remove('active');
        document.getElementById('login-form').classList.remove('hidden');
        document.getElementById('signup-form').classList.add('hidden');
    }

    showSignupForm() {
        document.getElementById('signup-tab').classList.add('active');
        document.getElementById('login-tab').classList.remove('active');
        document.getElementById('signup-form').classList.remove('hidden');
        document.getElementById('login-form').classList.add('hidden');
    }

    handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        // Simple validation
        if (!email || !password) {
            alert('Please fill in all fields');
            return;
        }

        // Check if user exists in localStorage
        const users = JSON.parse(localStorage.getItem('vinylQuoteUsers') || '[]');
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            this.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            this.showQuoteSection();
        } else {
            alert('Invalid email or password');
        }
    }

    handleSignup(e) {
        e.preventDefault();
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;

        // Simple validation
        if (!name || !email || !password) {
            alert('Please fill in all fields');
            return;
        }

        if (password.length < 6) {
            alert('Password must be at least 6 characters long');
            return;
        }

        // Check if user already exists
        const users = JSON.parse(localStorage.getItem('vinylQuoteUsers') || '[]');
        if (users.find(u => u.email === email)) {
            alert('User with this email already exists');
            return;
        }

        // Create new user
        const newUser = { name, email, password, id: Date.now() };
        users.push(newUser);
        localStorage.setItem('vinylQuoteUsers', JSON.stringify(users));

        this.currentUser = newUser;
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        this.showQuoteSection();
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.showAuthSection();
        this.resetQuote();
    }

    checkAuthStatus() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.showQuoteSection();
        } else {
            this.showAuthSection();
        }
    }

    showAuthSection() {
        document.getElementById('auth-section').classList.remove('hidden');
        document.getElementById('quote-section').classList.add('hidden');
    }

    showQuoteSection() {
        document.getElementById('auth-section').classList.add('hidden');
        document.getElementById('quote-section').classList.remove('hidden');
    }

    handleDoorsInput() {
        const doorsInput = document.getElementById('doors-input');
        const materialStep = document.getElementById('material-step');

        if (doorsInput.value && parseInt(doorsInput.value) > 0) {
            materialStep.style.display = 'block';
        } else {
            materialStep.style.display = 'none';
            document.getElementById('transport-step').style.display = 'none';
            this.hideCalculateButton();
        }
    }

    handleMaterialSelection() {
        const selectedMaterial = document.querySelector('input[name="material"]:checked');
        const transportStep = document.getElementById('transport-step');
        const calculateBtn = document.getElementById('calculate-btn');

        if (selectedMaterial) {
            transportStep.style.display = 'block';
            calculateBtn.style.display = 'block';
        } else {
            transportStep.style.display = 'none';
            calculateBtn.style.display = 'none';
        }
    }

    handleTransportInput() {
        // This method can be used for future validation if needed
        // For now, it's just a placeholder to handle transport input changes
    }

    hideCalculateButton() {
        document.getElementById('calculate-btn').style.display = 'none';
        document.getElementById('quote-result').style.display = 'none';
        document.getElementById('transport-step').style.display = 'none';
    }

    calculateQuote() {
        const doors = parseInt(document.getElementById('doors-input').value);
        const selectedMaterial = document.querySelector('input[name="material"]:checked');
        const transportCost = parseFloat(document.getElementById('transport-input').value) || 0;

        if (!doors || !selectedMaterial) {
            alert('Please fill in all required fields');
            return;
        }

        // Calculate square metres (2 doors = 1 square metre)
        const squareMetres = doors / 2;

        // Calculate project duration (30 sides = 1 day)
        const projectDays = Math.ceil(doors / 30);

        // Get material rate
        const materialRate = parseInt(selectedMaterial.dataset.rate);
        const materialName = this.getMaterialName(selectedMaterial.value);

        // Calculate costs
        const materialCost = squareMetres * materialRate;
        const installationFee = doors * 95; // R95 per side
        const foodCost = projectDays * 300; // R300 per day for food
        const totalCost = materialCost + installationFee + foodCost + transportCost;

        // Display results
        this.displayQuoteResult({
            doors,
            squareMetres,
            projectDays,
            materialName,
            materialRate,
            materialCost,
            installationFee,
            foodCost,
            transportCost,
            totalCost
        });
    }

    getMaterialName(value) {
        const materials = {
            'coverstyle': 'Coverstyle',
            'policut': 'Policut 6000',
            'hexis': 'Hexis',
            'maizey': 'Maizey Plastics',
            'stixo': 'Stixo (Gloss White/Light Grey)'
        };
        return materials[value] || value;
    }

    displayQuoteResult(quote) {
        document.getElementById('result-doors').textContent = quote.doors;
        document.getElementById('result-sqm').textContent = quote.squareMetres.toFixed(1);
        document.getElementById('result-days').textContent = quote.projectDays;
        document.getElementById('result-material').textContent = `${quote.materialName} (R${quote.materialRate}/m²)`;
        document.getElementById('result-material-cost').textContent = quote.materialCost.toFixed(2);
        document.getElementById('result-installation').textContent = quote.installationFee.toFixed(2);
        document.getElementById('result-food-cost').textContent = quote.foodCost.toFixed(2);
        document.getElementById('result-transport-cost').textContent = quote.transportCost.toFixed(2);
        document.getElementById('result-total').textContent = quote.totalCost.toFixed(2);

        document.getElementById('quote-result').style.display = 'block';

        // Save quote to user's history (optional feature)
        this.saveQuoteToHistory(quote);
    }

    saveQuoteToHistory(quote) {
        if (!this.currentUser) return;

        const quoteHistory = JSON.parse(localStorage.getItem(`quotes_${this.currentUser.id}`) || '[]');
        quote.timestamp = new Date().toISOString();
        quoteHistory.push(quote);

        // Keep only last 10 quotes
        if (quoteHistory.length > 10) {
            quoteHistory.shift();
        }

        localStorage.setItem(`quotes_${this.currentUser.id}`, JSON.stringify(quoteHistory));
    }

    resetQuote() {
        document.getElementById('doors-input').value = '';
        document.getElementById('transport-input').value = '';
        document.getElementById('material-step').style.display = 'none';
        document.getElementById('transport-step').style.display = 'none';
        document.getElementById('calculate-btn').style.display = 'none';
        document.getElementById('quote-result').style.display = 'none';

        // Clear material selection
        document.querySelectorAll('input[name="material"]').forEach(radio => {
            radio.checked = false;
        });
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new VinylQuoteApp();
});