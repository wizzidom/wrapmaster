// Supabase configuration
const SUPABASE_URL = 'https://ambfzfwunqeumfbgaacp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtYmZ6Znd1bnFldW1mYmdhYWNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NTA0MjEsImV4cCI6MjA3ODAyNjQyMX0.6_1OCz9VhJxAEAvQFsg3JhQiMwBYA7XepCXHPXLHXTQ';

// Debug logging
console.log('Supabase URL:', SUPABASE_URL);
console.log('Supabase Key:', SUPABASE_ANON_KEY.substring(0, 20) + '...');

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test connection
supabase.auth.getSession().then(({ data, error }) => {
    if (error) {
        console.error('Supabase connection error:', error);
    } else {
        console.log('Supabase connected successfully');
    }
});

// User authentication and quote calculator functionality
class VinylQuoteApp {
    constructor() {
        this.currentUser = null;
        this.currentQuote = null;
        this.savedQuotes = [];
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

        // Logout buttons
        document.getElementById('logout-btn').addEventListener('click', () => this.logout());
        document.getElementById('logout-btn-saved').addEventListener('click', () => this.logout());

        // Navigation
        document.getElementById('saved-quotes-btn').addEventListener('click', () => this.showSavedQuotes());
        document.getElementById('back-to-calculator-btn').addEventListener('click', () => this.showQuoteSection());
        document.getElementById('create-first-quote-btn').addEventListener('click', () => this.showQuoteSection());

        // Quote calculator
        document.getElementById('doors-input').addEventListener('input', () => this.handleDoorsInput());
        document.querySelectorAll('input[name="material"]').forEach(radio => {
            radio.addEventListener('change', () => this.handleMaterialSelection());
        });
        document.getElementById('transport-input').addEventListener('input', () => this.handleTransportInput());
        document.getElementById('calculate-btn').addEventListener('click', () => this.calculateQuote());
        document.getElementById('new-quote-btn').addEventListener('click', () => this.resetQuote());
        document.getElementById('save-quote-btn').addEventListener('click', () => this.saveQuote());
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

    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        if (!email || !password) {
            this.showError('Please fill in all fields');
            return;
        }

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) {
                this.showError(error.message);
                return;
            }

            this.currentUser = data.user;
            this.showQuoteSection();
            this.showSuccess('Login successful!');
        } catch (error) {
            this.showError('Login failed. Please try again.');
        }
    }

    async handleSignup(e) {
        e.preventDefault();
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;

        if (!name || !email || !password) {
            this.showError('Please fill in all fields');
            return;
        }

        if (password.length < 6) {
            this.showError('Password must be at least 6 characters long');
            return;
        }

        try {
            console.log('Attempting signup with:', { email, name });

            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        full_name: name
                    }
                }
            });

            console.log('Signup response:', { data, error });

            if (error) {
                console.error('Supabase signup error:', error);
                this.showError(error.message);
                return;
            }

            this.currentUser = data.user;
            this.showQuoteSection();
            this.showSuccess('Account created successfully!');
        } catch (error) {
            console.error('Signup catch error:', error);
            this.showError('Signup failed: ' + error.message);
        }
    }

    async logout() {
        try {
            await supabase.auth.signOut();
            this.currentUser = null;
            this.showAuthSection();
            this.resetQuote();
        } catch (error) {
            this.showError('Logout failed. Please try again.');
        }
    }

    async checkAuthStatus() {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                this.currentUser = user;
                this.showQuoteSection();
            } else {
                this.showAuthSection();
            }
        } catch (error) {
            this.showAuthSection();
        }

        // Listen for auth changes
        supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN') {
                this.currentUser = session.user;
                this.showQuoteSection();
            } else if (event === 'SIGNED_OUT') {
                this.currentUser = null;
                this.showAuthSection();
            }
        });
    }

    showAuthSection() {
        document.getElementById('auth-section').classList.remove('hidden');
        document.getElementById('quote-section').classList.add('hidden');
        document.getElementById('saved-quotes-section').classList.add('hidden');
    }

    showQuoteSection() {
        document.getElementById('auth-section').classList.add('hidden');
        document.getElementById('quote-section').classList.remove('hidden');
        document.getElementById('saved-quotes-section').classList.add('hidden');
    }

    async showSavedQuotes() {
        document.getElementById('auth-section').classList.add('hidden');
        document.getElementById('quote-section').classList.add('hidden');
        document.getElementById('saved-quotes-section').classList.remove('hidden');
        await this.loadSavedQuotes();
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

        // Store current quote for saving
        this.currentQuote = quote;
    }

    async saveQuote() {
        if (!this.currentUser || !this.currentQuote) {
            this.showError('No quote to save');
            return;
        }

        const quoteName = document.getElementById('quote-name-input').value.trim() ||
            `Quote ${new Date().toLocaleDateString()}`;

        try {
            const { data, error } = await supabase
                .from('saved_quotes')
                .insert([{
                    user_id: this.currentUser.id,
                    doors: this.currentQuote.doors,
                    square_metres: this.currentQuote.squareMetres,
                    project_days: this.currentQuote.projectDays,
                    material_name: this.currentQuote.materialName,
                    material_rate: this.currentQuote.materialRate,
                    material_cost: this.currentQuote.materialCost,
                    installation_fee: this.currentQuote.installationFee,
                    food_cost: this.currentQuote.foodCost,
                    transport_cost: this.currentQuote.transportCost,
                    total_cost: this.currentQuote.totalCost,
                    quote_name: quoteName
                }]);

            if (error) {
                this.showError('Failed to save quote: ' + error.message);
                return;
            }

            this.showSuccess('Quote saved successfully!');
            document.getElementById('quote-name-input').value = '';
        } catch (error) {
            this.showError('Failed to save quote. Please try again.');
        }
    }

    async loadSavedQuotes() {
        if (!this.currentUser) return;

        try {
            const { data, error } = await supabase
                .from('saved_quotes')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .order('created_at', { ascending: false });

            if (error) {
                this.showError('Failed to load saved quotes: ' + error.message);
                return;
            }

            this.savedQuotes = data || [];
            this.renderSavedQuotes();
        } catch (error) {
            this.showError('Failed to load saved quotes. Please try again.');
        }
    }

    renderSavedQuotes() {
        const container = document.getElementById('saved-quotes-list');
        const noQuotesMessage = document.getElementById('no-quotes-message');

        if (this.savedQuotes.length === 0) {
            container.innerHTML = '';
            noQuotesMessage.classList.remove('hidden');
            return;
        }

        noQuotesMessage.classList.add('hidden');

        container.innerHTML = this.savedQuotes.map(quote => `
            <div class="saved-quote-item" data-quote-id="${quote.id}">
                <div class="quote-header">
                    <div class="quote-title">${quote.quote_name}</div>
                    <div class="quote-date">${new Date(quote.created_at).toLocaleDateString()}</div>
                </div>
                
                <div class="quote-summary">
                    <div class="quote-detail">
                        <span>Doors/Sides:</span>
                        <span>${quote.doors}</span>
                    </div>
                    <div class="quote-detail">
                        <span>Square Metres:</span>
                        <span>${quote.square_metres}</span>
                    </div>
                    <div class="quote-detail">
                        <span>Material:</span>
                        <span>${quote.material_name}</span>
                    </div>
                    <div class="quote-detail">
                        <span>Duration:</span>
                        <span>${quote.project_days} day(s)</span>
                    </div>
                </div>
                
                <div class="quote-total">
                    Total: R${parseFloat(quote.total_cost).toFixed(2)}
                </div>
                
                <div class="quote-actions-saved">
                    <button class="edit-quote-btn" onclick="app.editQuote('${quote.id}')">Edit Name</button>
                    <button class="delete-quote-btn" onclick="app.deleteQuote('${quote.id}')">Delete</button>
                </div>
            </div>
        `).join('');
    }

    async editQuote(quoteId) {
        const quote = this.savedQuotes.find(q => q.id === quoteId);
        if (!quote) return;

        const newName = prompt('Enter new quote name:', quote.quote_name);
        if (!newName || newName.trim() === '') return;

        try {
            const { error } = await supabase
                .from('saved_quotes')
                .update({ quote_name: newName.trim() })
                .eq('id', quoteId);

            if (error) {
                this.showError('Failed to update quote: ' + error.message);
                return;
            }

            this.showSuccess('Quote updated successfully!');
            await this.loadSavedQuotes();
        } catch (error) {
            this.showError('Failed to update quote. Please try again.');
        }
    }

    async deleteQuote(quoteId) {
        if (!confirm('Are you sure you want to delete this quote?')) return;

        try {
            const { error } = await supabase
                .from('saved_quotes')
                .delete()
                .eq('id', quoteId);

            if (error) {
                this.showError('Failed to delete quote: ' + error.message);
                return;
            }

            this.showSuccess('Quote deleted successfully!');
            await this.loadSavedQuotes();
        } catch (error) {
            this.showError('Failed to delete quote. Please try again.');
        }
    }

    showError(message) {
        // Remove existing messages
        this.clearMessages();

        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;

        // Add to current visible section
        const activeSection = document.querySelector('.quote-container:not(.hidden), .auth-container:not(.hidden), .saved-quotes-container:not(.hidden)');
        if (activeSection) {
            activeSection.insertBefore(errorDiv, activeSection.firstChild);
        }

        setTimeout(() => errorDiv.remove(), 5000);
    }

    showSuccess(message) {
        // Remove existing messages
        this.clearMessages();

        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;

        // Add to current visible section
        const activeSection = document.querySelector('.quote-container:not(.hidden), .auth-container:not(.hidden), .saved-quotes-container:not(.hidden)');
        if (activeSection) {
            activeSection.insertBefore(successDiv, activeSection.firstChild);
        }

        setTimeout(() => successDiv.remove(), 3000);
    }

    clearMessages() {
        document.querySelectorAll('.error-message, .success-message').forEach(msg => msg.remove());
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
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new VinylQuoteApp();
});