// Supabase configuration
const SUPABASE_URL = 'https://ambfzfwunqeumfbgaacp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtYmZ6Znd1bnFldW1mYmdhYWNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NTA0MjEsImV4cCI6MjA3ODAyNjQyMX0.6_1OCz9VhJxAEAvQFsg3JhQiMwBYA7XepCXHPXLHXTQ';

// Debug logging

// Initialize Supabase client safely
if (!window.supabaseClient) {
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
// Use var instead of const to avoid redeclaration errors
var supabase = window.supabaseClient;

// Test connection
supabase.auth.getSession().then(({ data, error }) => {
    if (error) {
        console.error('Supabase connection error:', error);
    } else {
    }
});

// Helpers: HTML-escape user text, format money as R6 000.00
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtR = n => 'R' + (Number(n) || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

// Business details and document wording (edit here)
const BUSINESS = {
    name: 'Kitchen Wrap Masters', area: 'Joburg South', phone: '071 958 5783', email: 'wiseman@kitchenwrapmasters.co.za',
    terms: 'https://kitchenwrapmasters.co.za/pages/termsandconditions.html',
    bank: [['Bank', 'Bidvest Bank Alliance'], ['Account holder', 'Kitchen Wrap Masters'], ['Account number', '78605188211'], ['Account type', 'Current'], ['Branch code', '683000']],
    scope: [
        'Wrapping of cupboard door fronts', 'Wrapping over the edges of each door', 'Wrapping of all visible edging',
        'Cleaning and preparation of all surfaces before wrapping', 'Cleaning of handles',
        'Adjustment of damaged hinges where necessary', 'Adjustment of damaged drawer runners where necessary',
        'Silicone application to relevant areas', 'Sanding of the doors where necessary',
        'Reinstallation and adjustment of doors, drawers and hardware after wrapping',
        'Final cleaning and finishing to ensure a neat, professional result'],
    exclusions: 'We wrap the front of the doors and over the edges only. The inside of the doors and internal cabinet sections are not included. We do not wrap countertops.'
};
const ORANGE = [255, 106, 0], DARK = [26, 31, 31], GREY = [105, 110, 110], SOFT = [246, 246, 244];

// Pricing config: edit rates here (single source of truth)
const PRICING = {
    doorsPerSqm: 2, sidesPerDay: 30, installPerSide: 95, foodPerDay: 300,
    materials: [
        { id: 'coverstyle', name: 'Coverstyle', rate: 500 },
        { id: 'policut', name: 'Policut 6000', rate: 120 },
        { id: 'hexis', name: 'Hexis', rate: 120 },
        { id: 'maizey', name: 'Maizey Plastics', rate: 120 },
        { id: 'stixo', name: 'Stixo (Gloss White/Light Grey)', rate: 80 }
    ]
};

// User authentication and quote calculator functionality
class VinylQuoteApp {
    constructor() {
        this.currentUser = null;
        this.currentQuote = null;
        this.savedQuotes = [];
        this.filteredQuotes = [];
        this.filteredHistory = [];
        this.customers = [];
        this.filteredCustomers = [];
        this.customLineItems = [];
        this.uploadedPhotos = [];
        this.calculatorMode = 'doors'; // 'doors' or 'sqm'
        this.editingCustomerId = null;
        this.currentMonth = new Date();
        this.init();
    }

    init() {
        this.renderMaterials();
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
        document.getElementById('logout-btn-customers').addEventListener('click', () => this.logout());
        document.getElementById('logout-btn-calendar').addEventListener('click', () => this.logout());
        document.getElementById('logout-btn-history').addEventListener('click', () => this.logout());

        // Navigation - Global nav buttons (accessible from all pages)
        // From Calculator
        document.getElementById('nav-customers-btn').addEventListener('click', () => this.showCustomersSection());
        document.getElementById('nav-quotes-btn').addEventListener('click', () => this.showSavedQuotes());
        document.getElementById('nav-calendar-btn').addEventListener('click', () => this.showCalendarSection());
        document.getElementById('nav-history-btn').addEventListener('click', () => this.showHistorySection());
        
        // From Customers
        document.getElementById('nav-calculator-btn-2').addEventListener('click', () => this.showQuoteSection());
        document.getElementById('nav-quotes-btn-2').addEventListener('click', () => this.showSavedQuotes());
        document.getElementById('nav-calendar-btn-2').addEventListener('click', () => this.showCalendarSection());
        document.getElementById('nav-history-btn-2').addEventListener('click', () => this.showHistorySection());
        
        // From Calendar
        document.getElementById('nav-calculator-btn-3').addEventListener('click', () => this.showQuoteSection());
        document.getElementById('nav-customers-btn-3').addEventListener('click', () => this.showCustomersSection());
        document.getElementById('nav-quotes-btn-3').addEventListener('click', () => this.showSavedQuotes());
        document.getElementById('nav-history-btn-3').addEventListener('click', () => this.showHistorySection());
        
        // From History
        document.getElementById('nav-calculator-btn-4').addEventListener('click', () => this.showQuoteSection());
        document.getElementById('nav-customers-btn-4').addEventListener('click', () => this.showCustomersSection());
        document.getElementById('nav-quotes-btn-4').addEventListener('click', () => this.showSavedQuotes());
        document.getElementById('nav-calendar-btn-4').addEventListener('click', () => this.showCalendarSection());
        
        // From Saved Quotes
        document.getElementById('nav-calculator-btn-5').addEventListener('click', () => this.showQuoteSection());
        document.getElementById('nav-customers-btn-5').addEventListener('click', () => this.showCustomersSection());
        document.getElementById('nav-calendar-btn-5').addEventListener('click', () => this.showCalendarSection());
        document.getElementById('nav-history-btn-5').addEventListener('click', () => this.showHistorySection());
        
        // Other navigation
        document.getElementById('view-calendar-btn').addEventListener('click', () => this.showCalendarSection());
        document.getElementById('create-first-quote-btn').addEventListener('click', () => this.showQuoteSection());

        // Search and filtering
        document.getElementById('quote-search').addEventListener('input', () => this.filterQuotes());
        document.getElementById('material-filter').addEventListener('change', () => this.filterQuotes());
        document.getElementById('status-filter').addEventListener('change', () => this.filterQuotes());
        document.getElementById('date-filter').addEventListener('change', () => this.filterQuotes());
        document.getElementById('clear-filters-btn').addEventListener('click', () => this.clearFilters());
        document.getElementById('customer-search').addEventListener('input', () => this.filterCustomers());

        // Export functionality
        document.getElementById('export-all-btn').addEventListener('click', () => this.exportToPDF('all'));
        document.getElementById('export-filtered-btn').addEventListener('click', () => this.exportToPDF('filtered'));
        document.getElementById('export-csv-btn').addEventListener('click', () => this.exportCSV());

        // Calculator mode toggle
        document.getElementById('doors-mode-btn').addEventListener('click', () => this.switchToDoorsMode());
        document.getElementById('sqm-mode-btn').addEventListener('click', () => this.switchToSqmMode());

        // Customer management
        document.getElementById('customer-select').addEventListener('change', () => this.handleCustomerSelection());
        document.getElementById('manage-customers-btn').addEventListener('click', () => this.showCustomersSection());
        document.getElementById('add-customer-btn').addEventListener('click', () => this.showCustomerModal());
        document.getElementById('customer-form').addEventListener('submit', (e) => this.saveCustomer(e));
        document.getElementById('close-customer-modal').addEventListener('click', () => this.hideCustomerModal());
        document.getElementById('cancel-customer-modal').addEventListener('click', () => this.hideCustomerModal());

        // Custom line items
        document.getElementById('add-custom-item-btn').addEventListener('click', () => this.addCustomLineItem());

        // Photo upload
        document.getElementById('upload-photo-btn').addEventListener('click', () => document.getElementById('photo-input').click());
        document.getElementById('photo-input').addEventListener('change', (e) => this.handlePhotoUpload(e));

        // Calendar
        document.getElementById('calendar-month-select').addEventListener('change', () => this.renderCalendar());
        document.getElementById('calendar-status-filter').addEventListener('change', () => this.renderCalendar());

        // History
        document.getElementById('history-search').addEventListener('input', () => this.filterHistory());
        document.getElementById('history-date-filter').addEventListener('change', () => this.filterHistory());
        document.getElementById('clear-history-filters-btn').addEventListener('click', () => this.clearHistoryFilters());

        // Quote calculator
        document.getElementById('doors-input').addEventListener('input', () => this.handleDoorsInput());
        document.getElementById('sqm-input').addEventListener('input', () => this.handleSqmInput());
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

            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        full_name: name
                    }
                }
            });
         

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
                const isNew = !this.currentUser || this.currentUser.id !== session.user.id;
                this.currentUser = session.user;
                if (isNew) this.showQuoteSection();
            } else if (event === 'SIGNED_OUT') {
                this.currentUser = null;
                this.showAuthSection();
            }
        });
    }

    showAuthSection() {
        document.getElementById('auth-section').classList.remove('hidden');
        document.getElementById('quote-section').classList.add('hidden');
        document.getElementById('customers-section').classList.add('hidden');
        document.getElementById('calendar-section').classList.add('hidden');
        document.getElementById('history-section').classList.add('hidden');
        document.getElementById('saved-quotes-section').classList.add('hidden');
    }

    async showQuoteSection() {
        document.getElementById('auth-section').classList.add('hidden');
        document.getElementById('quote-section').classList.remove('hidden');
        document.getElementById('customers-section').classList.add('hidden');
        document.getElementById('calendar-section').classList.add('hidden');
        document.getElementById('history-section').classList.add('hidden');
        document.getElementById('saved-quotes-section').classList.add('hidden');
        await this.loadCustomers();
        this.populateCustomerDropdown();
    }

    async showCustomersSection() {
        document.getElementById('auth-section').classList.add('hidden');
        document.getElementById('quote-section').classList.add('hidden');
        document.getElementById('customers-section').classList.remove('hidden');
        document.getElementById('calendar-section').classList.add('hidden');
        document.getElementById('history-section').classList.add('hidden');
        document.getElementById('saved-quotes-section').classList.add('hidden');
        await this.loadCustomers();
    }

    async showCalendarSection() {
        document.getElementById('auth-section').classList.add('hidden');
        document.getElementById('quote-section').classList.add('hidden');
        document.getElementById('customers-section').classList.add('hidden');
        document.getElementById('calendar-section').classList.remove('hidden');
        document.getElementById('history-section').classList.add('hidden');
        document.getElementById('saved-quotes-section').classList.add('hidden');
        await this.loadSavedQuotes();
        this.initializeCalendar();
        this.renderCalendar();
    }

    async showHistorySection() {
        document.getElementById('auth-section').classList.add('hidden');
        document.getElementById('quote-section').classList.add('hidden');
        document.getElementById('customers-section').classList.add('hidden');
        document.getElementById('calendar-section').classList.add('hidden');
        document.getElementById('history-section').classList.remove('hidden');
        document.getElementById('saved-quotes-section').classList.add('hidden');
        await this.loadSavedQuotes();
        this.renderHistory();
    }

    async showSavedQuotes() {
        document.getElementById('auth-section').classList.add('hidden');
        document.getElementById('quote-section').classList.add('hidden');
        document.getElementById('customers-section').classList.add('hidden');
        document.getElementById('calendar-section').classList.add('hidden');
        document.getElementById('history-section').classList.add('hidden');
        document.getElementById('saved-quotes-section').classList.remove('hidden');
        await this.loadCustomers();
        await this.loadSavedQuotes();
    }

    switchToDoorsMode() {
        this.calculatorMode = 'doors';
        document.getElementById('doors-mode-btn').classList.add('active');
        document.getElementById('sqm-mode-btn').classList.remove('active');
        document.getElementById('doors-input-step').classList.remove('hidden');
        document.getElementById('sqm-input-step').classList.add('hidden');
        const s = parseFloat(document.getElementById('sqm-input').value);
        if (s > 0 && !document.getElementById('doors-input').value) document.getElementById('doors-input').value = Math.ceil(s * PRICING.doorsPerSqm);
        this.handleDoorsInput();
    }

    switchToSqmMode() {
        this.calculatorMode = 'sqm';
        document.getElementById('sqm-mode-btn').classList.add('active');
        document.getElementById('doors-mode-btn').classList.remove('active');
        document.getElementById('sqm-input-step').classList.remove('hidden');
        document.getElementById('doors-input-step').classList.add('hidden');
        const d = parseInt(document.getElementById('doors-input').value);
        if (d > 0 && !document.getElementById('sqm-input').value) document.getElementById('sqm-input').value = d / PRICING.doorsPerSqm;
        this.handleSqmInput();
    }

    handleDoorsInput() {
        this.recalcIfShown();
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

    handleSqmInput() {
        this.recalcIfShown();
        const sqmInput = document.getElementById('sqm-input');
        const materialStep = document.getElementById('material-step');

        if (sqmInput.value && parseFloat(sqmInput.value) > 0) {
            materialStep.style.display = 'block';
        } else {
            materialStep.style.display = 'none';
            document.getElementById('transport-step').style.display = 'none';
            this.hideCalculateButton();
        }
    }

    handleMaterialSelection() {
        this.recalcIfShown();
        const selectedMaterial = document.querySelector('input[name="material"]:checked');
        const transportStep = document.getElementById('transport-step');
        const customItemsStep = document.getElementById('custom-items-step');
        const photoUploadStep = document.getElementById('photo-upload-step');
        const calculateBtn = document.getElementById('calculate-btn');

        if (selectedMaterial) {
            transportStep.style.display = 'block';
            customItemsStep.style.display = 'block';
            photoUploadStep.style.display = 'block';
            calculateBtn.style.display = 'block';
        } else {
            transportStep.style.display = 'none';
            customItemsStep.style.display = 'none';
            photoUploadStep.style.display = 'none';
            calculateBtn.style.display = 'none';
        }
    }

    handleTransportInput() {
        this.recalcIfShown();
        // Show custom items and photo upload steps when transport is visible
        const transportStep = document.getElementById('transport-step');
        const customItemsStep = document.getElementById('custom-items-step');
        const photoUploadStep = document.getElementById('photo-upload-step');
        if (transportStep.style.display !== 'none') {
            customItemsStep.style.display = 'block';
            photoUploadStep.style.display = 'block';
        }
    }

    handleCustomerSelection() {
        const customerId = document.getElementById('customer-select').value;
        const customerInfo = document.getElementById('customer-info');
        
        if (customerId) {
            const customer = this.customers.find(c => c.id === customerId);
            if (customer) {
                customerInfo.innerHTML = `
                    <div class="customer-details">
                        <p><strong>${esc(customer.name)}</strong></p>
                        ${customer.phone ? `<p>📞 ${esc(customer.phone)}</p>` : ''}
                        ${customer.email ? `<p>📧 ${esc(customer.email)}</p>` : ''}
                        ${customer.address ? `<p>📍 ${esc(customer.address)}</p>` : ''}
                    </div>
                `;
                customerInfo.classList.remove('hidden');
            }
        } else {
            customerInfo.classList.add('hidden');
        }
    }

    async addCustomLineItem() {
        const r = await this.ask({ title: 'Add additional charge', fields: [
            { name: 'description', label: 'Description', required: true },
            { name: 'amount', label: 'Amount (R) - use a minus for a discount', type: 'number', step: '0.01', required: true }], okText: 'Add' });
        if (!r) return;
        const description = r.description;
        const amount = parseFloat(r.amount);
        if (isNaN(amount) || amount === 0) {
            this.showError('Please enter a valid amount');
            return;
        }

        this.customLineItems.push({
            description: description.trim(),
            amount: amount
        });

        this.renderCustomLineItems();
        this.updateCustomItemsTotal();
    }

    renderCustomLineItems() {
        const container = document.getElementById('custom-items-list');
        
        if (this.customLineItems.length === 0) {
            container.innerHTML = '<p class="no-items-text">No additional charges added</p>';
            return;
        }

        container.innerHTML = this.customLineItems.map((item, index) => `
            <div class="custom-line-item">
                <span class="item-description">${esc(item.description)}</span>
                <span class="item-amount">${fmtR(item.amount)}</span>
                <button class="remove-item-btn" onclick="app.removeCustomLineItem(${index})">×</button>
            </div>
        `).join('');
    }

    removeCustomLineItem(index) {
        this.customLineItems.splice(index, 1);
        this.renderCustomLineItems();
        this.updateCustomItemsTotal();
    }

    updateCustomItemsTotal() { this.recalcIfShown(); }

    hideCalculateButton() {
        document.getElementById('calculate-btn').style.display = 'none';
        document.getElementById('quote-result').style.display = 'none';
        document.getElementById('transport-step').style.display = 'none';
    }

    calculateQuote(silent = false) {
        const bad = m => { if (silent) { this.currentQuote = null; document.getElementById('quote-result').style.display = 'none'; } else { this.showError(m); } };
        const selectedMaterial = document.querySelector('input[name="material"]:checked');
        const transportCost = Math.max(0, parseFloat(document.getElementById('transport-input').value) || 0);

        if (!selectedMaterial) {
            bad('Please select a material type');
            return;
        }

        let doors, squareMetres;

        if (this.calculatorMode === 'doors') {
            doors = parseInt(document.getElementById('doors-input').value);
            if (!doors || doors <= 0) {
                bad('Please enter a valid number of doors');
                return;
            }
            // Calculate square metres (2 doors = 1 square metre)
            squareMetres = doors / PRICING.doorsPerSqm;
        } else {
            // Square metres mode
            squareMetres = parseFloat(document.getElementById('sqm-input').value);
            if (!squareMetres || squareMetres <= 0) {
                bad('Please enter a valid square metres value');
                return;
            }
            // Calculate doors from square metres and round up
            doors = Math.ceil(squareMetres * PRICING.doorsPerSqm);
        }

        // Calculate project duration (30 sides = 1 day)
        const projectDays = Math.ceil(doors / PRICING.sidesPerDay);

        // Get material rate
        const materialRate = parseFloat(selectedMaterial.dataset.rate);
        const materialName = this.getMaterialName(selectedMaterial.value);

        // Calculate costs
        const materialCost = squareMetres * materialRate;
        const installationFee = doors * PRICING.installPerSide;
        const foodCost = projectDays * PRICING.foodPerDay;
        const customItemsTotal = this.customLineItems.reduce((sum, item) => sum + item.amount, 0);
        const totalCost = materialCost + installationFee + foodCost + transportCost + customItemsTotal;

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
            customItemsTotal,
            totalCost
        });
    }

    getMaterialName(value) {
        const m = PRICING.materials.find(x => x.id === value);
        return m ? m.name : value;
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
        
        if (quote.customItemsTotal !== 0) {
            document.getElementById('custom-items-result').style.display = 'block';
            document.getElementById('result-custom-items').textContent = quote.customItemsTotal.toFixed(2);
        } else {
            document.getElementById('custom-items-result').style.display = 'none';
        }
        
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
            `Quote ${new Date().toLocaleDateString('en-ZA')}`;
        const customerId = document.getElementById('customer-select').value || null;
        const status = document.getElementById('quote-status-select').value;
        const scheduledDate = document.getElementById('scheduled-date-input').value || null;

        // Show loading indicator
        this.showLoading('Saving quote...');

        // Disable save button to prevent double-clicks
        const saveBtn = document.getElementById('save-quote-btn');
        if (!saveBtn) {
            console.error('Save button not found!');
            return;
        }
        const originalText = saveBtn.textContent;
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';

        try {
            const { data: quoteData, error: quoteError } = await supabase
                .from('saved_quotes')
                .insert([{
                    user_id: this.currentUser.id,
                    customer_id: customerId,
                    doors: this.currentQuote.doors,
                    square_metres: this.currentQuote.squareMetres,
                    project_days: this.currentQuote.projectDays,
                    material_name: this.currentQuote.materialName,
                    material_rate: this.currentQuote.materialRate,
                    material_cost: this.currentQuote.materialCost,
                    installation_fee: this.currentQuote.installationFee,
                    food_cost: this.currentQuote.foodCost,
                    transport_cost: this.currentQuote.transportCost,
                    custom_items_total: this.currentQuote.customItemsTotal || 0,
                    total_cost: this.currentQuote.totalCost,
                    quote_name: quoteName,
                    status: status,
                    scheduled_date: scheduledDate
                }])
                .select();

            if (quoteError) {
                this.hideLoading();
                this.showError('Failed to save quote: ' + quoteError.message);
                saveBtn.disabled = false;
                saveBtn.textContent = originalText;
                return;
            }

            const quoteId = quoteData[0].id;
            const warnings = [];

            // Save custom line items if any
            if (this.customLineItems.length > 0) {
                const lineItemsToInsert = this.customLineItems.map(item => ({
                    quote_id: quoteId,
                    description: item.description,
                    amount: item.amount
                }));

                const { error: itemsError } = await supabase
                    .from('custom_line_items')
                    .insert(lineItemsToInsert);

                if (itemsError) {
                    warnings.push('additional charges');
                }
            }

            // Upload photos if any
            if (this.uploadedPhotos.length > 0) {
                const photoRecords = await this.uploadPhotosToStorage(quoteId);
                if (photoRecords.length < this.uploadedPhotos.length) warnings.push('some photos');
                
                if (photoRecords.length > 0) {
                    const photosToInsert = photoRecords.map(photo => ({
                        quote_id: quoteId,
                        ...photo
                    }));

                    const { error: photosError } = await supabase
                        .from('quote_photos')
                        .insert(photosToInsert);

                    if (photosError) {
                        warnings.push('photos');
                    }
                }
            }

            // Hide loading and show success
            this.hideLoading();
            if (warnings.length) this.showError(`Quote saved, but not saved: ${warnings.join(', ')}. Open the quote to check.`); else this.showSuccess('Quote saved successfully!');
            
            if (!warnings.length) this.resetQuote();
            
            // Re-enable save button
            saveBtn.disabled = false;
            saveBtn.textContent = originalText;
            
            // Redirect to saved quotes after a brief delay
            setTimeout(() => {
                this.showSavedQuotes();
            }, 1000);
        } catch (error) {
            // Hide loading and show error
            console.error('Save error caught:', error);
            this.hideLoading();
            this.showError('Failed to save quote. Please try again.');
            
            // Re-enable save button
            saveBtn.disabled = false;
            saveBtn.textContent = originalText;
        }
    }

    // Customer Management Methods
    async loadCustomers() {
        if (!this.currentUser) return;

        try {
            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .order('name', { ascending: true });

            if (error) {
                this.showError('Failed to load customers: ' + error.message);
                return;
            }

            this.customers = data || [];
            this.filteredCustomers = [...this.customers];
            this.renderCustomers();
        } catch (error) {
            this.showError('Failed to load customers. Please try again.');
        }
    }

    populateCustomerDropdown() {
        const select = document.getElementById('customer-select');
        const prev = select.value;
        select.innerHTML = '<option value="">-- New Customer --</option>';
        
        this.customers.forEach(customer => {
            const option = document.createElement('option');
            option.value = customer.id;
            option.textContent = customer.name;
            select.appendChild(option);
        });
        select.value = prev;
        this.handleCustomerSelection();
    }

    renderCustomers() {
        const container = document.getElementById('customers-list');
        const noCustomersMessage = document.getElementById('no-customers-message');

        if (this.customers.length === 0) {
            container.innerHTML = '';
            noCustomersMessage.classList.remove('hidden');
            return;
        }

        noCustomersMessage.classList.add('hidden');

        if (this.filteredCustomers.length === 0) {
            container.innerHTML = `
                <div class="no-results-message">
                    <p>No customers match your search.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.filteredCustomers.map(customer => `
            <div class="customer-item">
                <div class="customer-header">
                    <div class="customer-name">${esc(customer.name)}</div>
                    <div class="customer-actions">
                        <button class="edit-customer-btn" onclick="app.editCustomer('${customer.id}')">Edit</button>
                        <button class="delete-customer-btn" onclick="app.deleteCustomer('${customer.id}')">Delete</button>
                    </div>
                </div>
                <div class="customer-details">
                    ${customer.phone ? `<p>📞 ${esc(customer.phone)}</p>` : ''}
                    ${customer.email ? `<p>📧 ${esc(customer.email)}</p>` : ''}
                    ${customer.address ? `<p>📍 ${esc(customer.address)}</p>` : ''}
                    ${customer.notes ? `<p>📝 ${esc(customer.notes)}</p>` : ''}
                </div>
            </div>
        `).join('');
    }

    filterCustomers() {
        const searchTerm = document.getElementById('customer-search').value.toLowerCase();
        
        this.filteredCustomers = this.customers.filter(customer => {
            return customer.name.toLowerCase().includes(searchTerm) ||
                   (customer.phone && customer.phone.includes(searchTerm)) ||
                   (customer.email && customer.email.toLowerCase().includes(searchTerm));
        });
        
        this.renderCustomers();
    }

    showCustomerModal(customerId = null) {
        const modal = document.getElementById('customer-modal');
        const title = document.getElementById('customer-modal-title');
        
        if (customerId) {
            const customer = this.customers.find(c => c.id === customerId);
            if (customer) {
                title.textContent = 'Edit Customer';
                document.getElementById('customer-id').value = customer.id;
                document.getElementById('customer-name').value = customer.name;
                document.getElementById('customer-phone').value = customer.phone || '';
                document.getElementById('customer-email').value = customer.email || '';
                document.getElementById('customer-address').value = customer.address || '';
                document.getElementById('customer-notes').value = customer.notes || '';
            }
        } else {
            title.textContent = 'Add Customer';
            document.getElementById('customer-form').reset();
            document.getElementById('customer-id').value = '';
        }
        
        modal.classList.remove('hidden');
    }

    hideCustomerModal() {
        document.getElementById('customer-modal').classList.add('hidden');
        document.getElementById('customer-form').reset();
    }

    async saveCustomer(e) {
        e.preventDefault();
        
        const customerId = document.getElementById('customer-id').value;
        const customerData = {
            name: document.getElementById('customer-name').value.trim(),
            phone: document.getElementById('customer-phone').value.trim() || null,
            email: document.getElementById('customer-email').value.trim() || null,
            address: document.getElementById('customer-address').value.trim() || null,
            notes: document.getElementById('customer-notes').value.trim() || null
        };

        if (!customerData.name) {
            this.showError('Customer name is required');
            return;
        }

        try {
            if (customerId) {
                // Update existing customer
                const { error } = await supabase
                    .from('customers')
                    .update(customerData)
                    .eq('id', customerId);

                if (error) {
                    this.showError('Failed to update customer: ' + error.message);
                    return;
                }

                this.showSuccess('Customer updated successfully!');
            } else {
                // Create new customer
                const { error } = await supabase
                    .from('customers')
                    .insert([{
                        ...customerData,
                        user_id: this.currentUser.id
                    }]);

                if (error) {
                    this.showError('Failed to create customer: ' + error.message);
                    return;
                }

                this.showSuccess('Customer created successfully!');
            }

            this.hideCustomerModal();
            await this.loadCustomers();
            this.populateCustomerDropdown();
        } catch (error) {
            this.showError('Failed to save customer. Please try again.');
        }
    }

    editCustomer(customerId) {
        this.showCustomerModal(customerId);
    }

    async deleteCustomer(customerId) {
        if (!await this.confirmBox('Are you sure you want to delete this customer? This will not delete their quotes.')) return;

        try {
            const { error} = await supabase
                .from('customers')
                .delete()
                .eq('id', customerId);

            if (error) {
                this.showError('Failed to delete customer: ' + error.message);
                return;
            }

            this.showSuccess('Customer deleted successfully!');
            await this.loadCustomers();
            this.populateCustomerDropdown();
        } catch (error) {
            this.showError('Failed to delete customer. Please try again.');
        }
    }

    // Photo Upload Methods
    async handlePhotoUpload(event) {
        const files = await Promise.all(Array.from(event.target.files).map(f => this.compressImage(f)));
        if (files.length === 0) return;

        for (const file of files) {
            if (file.size > 10 * 1024 * 1024) {
                this.showError(`${file.name} is too large. Max size is 10MB.`);
                continue;
            }

            this.uploadedPhotos.push({
                file: file,
                preview: URL.createObjectURL(file),
                name: file.name,
                size: file.size
            });
        }

        this.renderPhotoPreview();
        event.target.value = ''; // Reset input
    }

    renderPhotoPreview() {
        const container = document.getElementById('photo-preview-list');
        
        if (this.uploadedPhotos.length === 0) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = this.uploadedPhotos.map((photo, index) => `
            <div class="photo-preview-item">
                <img src="${photo.preview}" alt="${esc(photo.name)}">
                <div class="photo-info">
                    <span class="photo-name">${esc(photo.name)}</span>
                    <span class="photo-size">${(photo.size / 1024).toFixed(1)} KB</span>
                </div>
                <button class="remove-photo-btn" onclick="app.removePhoto(${index})">×</button>
            </div>
        `).join('');
    }

    removePhoto(index) {
        URL.revokeObjectURL(this.uploadedPhotos[index].preview);
        this.uploadedPhotos.splice(index, 1);
        this.renderPhotoPreview();
    }

    async uploadPhotosToStorage(quoteId) {
        if (this.uploadedPhotos.length === 0) return [];

        const uploadedUrls = [];

        for (const photo of this.uploadedPhotos) {
            // Use user ID in path for RLS policies
            const fileName = `${this.currentUser.id}/${quoteId}/${Date.now()}_${photo.name}`;
            
            try {
                const { data, error } = await supabase.storage
                    .from('quote-photos')
                    .upload(fileName, photo.file, {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (error) {
                    console.error('Photo upload error:', error);
                    this.showError(`Failed to upload ${photo.name}: ${error.message}`);
                    continue;
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('quote-photos')
                    .getPublicUrl(fileName);

                uploadedUrls.push({
                    photo_url: publicUrl,
                    photo_name: photo.name,
                    file_size: photo.size
                });
            } catch (error) {
                console.error('Photo upload failed:', error);
                this.showError(`Failed to upload ${photo.name}`);
            }
        }

        return uploadedUrls;
    }

    // Calendar Methods
    initializeCalendar() {
        const monthSelect = document.getElementById('calendar-month-select');
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        monthSelect.value = `${year}-${month}`;
    }

    renderCalendar() {
        const monthSelect = document.getElementById('calendar-month-select');
        const statusFilter = document.getElementById('calendar-status-filter').value;
        const selectedMonth = new Date(monthSelect.value + '-01');
        
        const scheduledQuotes = this.savedQuotes.filter(quote => {
            if (!quote.scheduled_date) return false;
            
            // Exclude completed projects from calendar
            if (quote.status === 'completed') return false;
            
            const quoteDate = new Date(quote.scheduled_date);
            const sameMonth = quoteDate.getMonth() === selectedMonth.getMonth() &&
                            quoteDate.getFullYear() === selectedMonth.getFullYear();
            
            if (!sameMonth) return false;
            
            if (statusFilter === 'accepted') return quote.status === 'accepted';
            
            return true;
        });

        this.renderScheduledQuotesList(scheduledQuotes, selectedMonth);
    }

    renderScheduledQuotesList(quotes, month) {
        const container = document.getElementById('scheduled-quotes-list');
        
        if (quotes.length === 0) {
            container.innerHTML = `
                <div class="no-scheduled-quotes">
                    <p>No scheduled projects for ${month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                </div>
            `;
            return;
        }

        // Group by date
        const groupedByDate = {};
        quotes.forEach(quote => {
            const date = quote.scheduled_date;
            if (!groupedByDate[date]) {
                groupedByDate[date] = [];
            }
            groupedByDate[date].push(quote);
        });

        // Sort dates
        const sortedDates = Object.keys(groupedByDate).sort();

        container.innerHTML = `
            <h3>Scheduled Projects - ${month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
            ${sortedDates.map(date => {
                const dateObj = new Date(date + 'T00:00:00');
                const dayQuotes = groupedByDate[date];
                
                return `
                    <div class="calendar-day-group">
                        <div class="calendar-day-header">
                            <span class="calendar-date">${dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                            <span class="calendar-count">${dayQuotes.length} project${dayQuotes.length > 1 ? 's' : ''}</span>
                        </div>
                        <div class="calendar-day-quotes">
                            ${dayQuotes.map(quote => `
                                <div class="calendar-quote-item">
                                    <div class="calendar-quote-info">
                                        <span class="calendar-quote-name">${esc(quote.quote_name)}</span>
                                        <span class="status-badge status-${quote.status}">${this.getStatusLabel(quote.status)}</span>
                                    </div>
                                    <div class="calendar-quote-details">
                                        <span>${quote.doors} doors</span>
                                        <span>${fmtR(parseFloat(quote.total_cost))}</span>
                                    </div>
                                    <button class="view-quote-btn" onclick="app.viewQuoteFromCalendar('${quote.id}')">View Details</button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }).join('')}
        `;
    }

    viewQuoteFromCalendar(quoteId) { this.viewQuoteDetails(quoteId); }

    // History Methods
    renderHistory() {
        const completedQuotes = this.savedQuotes.filter(q => q.status === 'completed');
        this.filteredHistory = [...completedQuotes];
        this.displayHistory();
    }

    filterHistory() {
        const searchTerm = document.getElementById('history-search').value.toLowerCase();
        const dateFilter = document.getElementById('history-date-filter').value;
        
        const completedQuotes = this.savedQuotes.filter(q => q.status === 'completed');
        
        this.filteredHistory = completedQuotes.filter(quote => {
            // Search filter
            const matchesSearch = !searchTerm ||
                quote.quote_name.toLowerCase().includes(searchTerm) ||
                quote.material_name.toLowerCase().includes(searchTerm);
            
            // Date filter
            const matchesDate = this.matchesHistoryDateFilter(quote.updated_at || quote.created_at, dateFilter);
            
            return matchesSearch && matchesDate;
        });
        
        this.displayHistory();
    }

    matchesHistoryDateFilter(dateString, filter) {
        if (!filter) return true;
        
        const quoteDate = new Date(dateString);
        const now = new Date();
        
        switch (filter) {
            case 'week':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                return quoteDate >= weekAgo;
            case 'month':
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                return quoteDate >= monthAgo;
            case '3months':
                const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                return quoteDate >= threeMonthsAgo;
            case 'year':
                return quoteDate.getFullYear() === now.getFullYear();
            default:
                return true;
        }
    }

    displayHistory() {
        const container = document.getElementById('history-list');
        const noHistoryMessage = document.getElementById('no-history-message');
        
        // Calculate stats
        const totalCompleted = this.filteredHistory.length;
        const totalRevenue = this.filteredHistory.reduce((sum, q) => sum + parseFloat(q.total_cost), 0);
        const avgProjectValue = totalCompleted > 0 ? totalRevenue / totalCompleted : 0;
        
        document.getElementById('total-completed').textContent = totalCompleted;
        document.getElementById('total-revenue').textContent = `${fmtR(totalRevenue)}`;
        document.getElementById('avg-project-value').textContent = `${fmtR(avgProjectValue)}`;
        const all = this.savedQuotes, num = v => parseFloat(v) || 0;
        const decided = all.filter(q => ['accepted', 'completed', 'rejected'].includes(q.status));
        const won = decided.filter(q => q.status !== 'rejected').length;
        document.getElementById('win-rate').textContent = decided.length ? Math.round(won / decided.length * 100) + '%' : '-';
        document.getElementById('pipeline-value').textContent = fmtR(all.filter(q => q.status === 'pending' || q.status === 'accepted').reduce((s, q) => s + num(q.total_cost), 0));
        document.getElementById('stat-outstanding').textContent = fmtR(all.filter(q => q.status === 'accepted' || q.status === 'completed').reduce((s, q) => s + Math.max(0, num(q.total_cost) - num(q.deposit_paid) - num(q.final_payment_paid)), 0));
        
        if (this.filteredHistory.length === 0) {
            container.innerHTML = '';
            noHistoryMessage.classList.remove('hidden');
            return;
        }
        
        noHistoryMessage.classList.add('hidden');
        
        container.innerHTML = this.filteredHistory.map(quote => `
            <div class="history-item">
                <div class="history-header">
                    <div class="history-title">${esc(quote.quote_name)}</div>
                    <div class="history-date">Completed: ${new Date(quote.updated_at || quote.created_at).toLocaleDateString('en-ZA')}</div>
                </div>
                
                <div class="history-details">
                    <div class="history-detail">
                        <span>📅 Scheduled:</span>
                        <span>${quote.scheduled_date ? new Date(quote.scheduled_date).toLocaleDateString('en-ZA') : 'Not scheduled'}</span>
                    </div>
                    <div class="history-detail">
                        <span>🚪 Doors:</span>
                        <span>${quote.doors}</span>
                    </div>
                    <div class="history-detail">
                        <span>📐 Square Metres:</span>
                        <span>${quote.square_metres}</span>
                    </div>
                    <div class="history-detail">
                        <span>🎨 Material:</span>
                        <span>${esc(quote.material_name)}</span>
                    </div>
                    <div class="history-detail">
                        <span>💰 Total:</span>
                        <span class="history-total">${fmtR(parseFloat(quote.total_cost))}</span>
                    </div>
                    <div class="history-detail">
                        <span>💳 Payment:</span>
                        <span class="payment-badge payment-${quote.payment_status || 'unpaid'}">${this.getPaymentStatusLabel(quote.payment_status)}</span>
                    </div>
                </div>
                
                <div class="history-actions">
                    <button class="view-history-btn" onclick="app.viewHistoryDetails('${quote.id}')">View Full Details</button>
                    <button class="export-history-btn" onclick="app.exportSingleQuote('${quote.id}')">Export PDF</button>
                    ${quote.invoice_number ? `<button class="invoice-history-btn" onclick="app.generateInvoice('${quote.id}')">View Invoice</button>` : ''}
                    <button class="delete-history-btn" onclick="app.deleteCompletedProject('${quote.id}')">🗑️ Delete</button>
                </div>
            </div>
        `).join('');
    }

    getPaymentStatusLabel(status) {
        const labels = {
            'paid': 'Fully Paid',
            'partial': 'Partially Paid',
            'unpaid': 'Unpaid'
        };
        return labels[status] || 'Unpaid';
    }

    viewHistoryDetails(quoteId) { this.viewQuoteDetails(quoteId); }

    clearHistoryFilters() {
        document.getElementById('history-search').value = '';
        document.getElementById('history-date-filter').value = '';
        this.renderHistory();
    }

    async deleteCompletedProject(quoteId) {
        const quote = this.savedQuotes.find(q => q.id === quoteId);
        if (!quote) return;

        if (!await this.confirmBox(`Are you sure you want to permanently delete "${quote.quote_name}"?\n\nThis will delete:\n- The quote\n- All photos\n- All custom line items\n- Invoice records\n\nThis action cannot be undone.`)) {
            return;
        }

        try {
            // Delete the quote (cascade will handle photos and line items)
            const { error } = await supabase
                .from('saved_quotes')
                .delete()
                .eq('id', quoteId);

            if (error) {
                this.showError('Failed to delete project: ' + error.message);
                return;
            }

            this.showSuccess('Completed project deleted successfully!');
            await this.loadSavedQuotes();
            this.renderHistory();
        } catch (error) {
            this.showError('Failed to delete project. Please try again.');
        }
    }

    // Invoice Methods
    async generateInvoice(quoteId) {
        const quote = this.savedQuotes.find(q => q.id === quoteId);
        if (!quote) return;

        if (quote.status !== 'accepted' && quote.status !== 'completed') {
            if (!await this.confirmBox('This quote is not accepted yet. Generate invoice anyway?')) {
                return;
            }
        }

        // Generate invoice number if not exists
        let invoiceNumber = quote.invoice_number;
        if (!invoiceNumber) {
            invoiceNumber = `INV-${Date.now()}`;
            
            const { error } = await supabase
                .from('saved_quotes')
                .update({ invoice_number: invoiceNumber })
                .eq('id', quoteId);

            if (error) {
                this.showError('Failed to generate invoice number');
                return;
            }
        }

        // Show invoice modal or generate PDF
        this.showInvoiceModal(quote, invoiceNumber);
    }

    showInvoiceModal(quote, invoiceNumber) {
        const depositAmount = (quote.total_cost * 0.5).toFixed(2);
        const remainingAmount = (parseFloat(quote.total_cost) - (parseFloat(quote.deposit_paid) || 0) - (parseFloat(quote.final_payment_paid) || 0)).toFixed(2);

        const modalHTML = `
            <div class="modal-overlay" id="invoice-modal">
                <div class="modal-content invoice-modal-content">
                    <div class="modal-header">
                        <h2 class="modal-title">Invoice: ${esc(invoiceNumber)}</h2>
                        <button class="close-modal-btn" onclick="app.closeInvoiceModal()">&times;</button>
                    </div>
                    <div class="invoice-details">
                        <h3>${esc(quote.quote_name)}</h3>
                        <p><strong>Total Amount:</strong> ${fmtR(parseFloat(quote.total_cost))}</p>
                        <p><strong>50% Deposit:</strong> R${depositAmount}</p>
                        <p><strong>Deposit Paid:</strong> ${fmtR((quote.deposit_paid || 0))}</p>
                        <p><strong>Final Payment Paid:</strong> ${fmtR((quote.final_payment_paid || 0))}</p>
                        <p class="remaining-amount"><strong>Amount Due:</strong> R${remainingAmount}</p>
                        
                        <div class="payment-actions">
                            <h4>Record Payment:</h4>
                            <input type="number" id="payment-amount" placeholder="Amount" step="0.01" min="0">
                            <select id="payment-type">
                                <option value="deposit">Deposit Payment</option>
                                <option value="final">Final Payment</option>
                            </select>
                            <button onclick="app.recordPayment('${quote.id}')" class="modal-save-btn">Record Payment</button>
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button onclick="app.exportInvoicePDF('${quote.id}')" class="modal-save-btn">Export Invoice PDF</button>
                        <button onclick="app.closeInvoiceModal()" class="modal-cancel-btn">Close</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    closeInvoiceModal() {
        const modal = document.getElementById('invoice-modal');
        if (modal) modal.remove();
    }

    async recordPayment(quoteId) {
        const amount = parseFloat(document.getElementById('payment-amount').value);
        const paymentType = document.getElementById('payment-type').value;

        if (isNaN(amount) || amount <= 0) {
            this.showError('Please enter a valid payment amount');
            return;
        }

        const quote = this.savedQuotes.find(q => q.id === quoteId);
        if (!quote) return;

        const updateData = {};
        
        if (paymentType === 'deposit') {
            updateData.deposit_paid = (parseFloat(quote.deposit_paid) || 0) + amount;
        } else {
            updateData.final_payment_paid = (parseFloat(quote.final_payment_paid) || 0) + amount;
        }

        // Update payment status
        const totalPaid = (parseFloat(quote.deposit_paid) || 0) + (parseFloat(quote.final_payment_paid) || 0) + amount;
        if (totalPaid >= parseFloat(quote.total_cost)) {
            updateData.payment_status = 'paid';
        } else if (totalPaid > 0) {
            updateData.payment_status = 'partial';
        }

        try {
            const { error } = await supabase
                .from('saved_quotes')
                .update(updateData)
                .eq('id', quoteId);

            if (error) {
                this.showError('Failed to record payment: ' + error.message);
                return;
            }

            this.showSuccess('Payment recorded successfully!');
            this.closeInvoiceModal();
            await this.loadSavedQuotes();
        } catch (error) {
            this.showError('Failed to record payment. Please try again.');
        }
    }

    async exportInvoicePDF(quoteId) {
        const quote = this.savedQuotes.find(q => q.id === quoteId);
        if (!quote) { this.showError('Quote not found'); return; }
        let c = this.customers.find(x => x.id === quote.customer_id);
        if (!c && quote.customer_id) {
            const { data } = await supabase.from('customers').select('*').eq('id', quote.customer_id).single();
            c = data;
        }
        if (!c) {
            const r = await this.ask({ title: 'Customer details for invoice', fields: [
                { name: 'name', label: 'Customer name', required: true },
                { name: 'phone', label: 'Phone (optional)', type: 'tel' },
                { name: 'email', label: 'Email (optional)', type: 'email' },
                { name: 'address', label: 'Address (optional)', multiline: true }], okText: 'Create invoice PDF' });
            if (!r) return;
            c = r;
        }
        await this.buildPDF('invoice', quote, c);
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
            // Exclude completed quotes from saved quotes view
            this.filteredQuotes = this.savedQuotes.filter(q => q.status !== 'completed');
            this.renderSavedQuotes();
        } catch (error) {
            this.showError('Failed to load saved quotes. Please try again.');
        }
    }

    renderSavedQuotes() {
        const container = document.getElementById('saved-quotes-list');
        const noQuotesMessage = document.getElementById('no-quotes-message');

        // Show results count
        const resultsCount = document.querySelector('.results-count') || document.createElement('div');
        resultsCount.className = 'results-count';

        if (this.savedQuotes.length === 0) {
            container.innerHTML = '';
            noQuotesMessage.classList.remove('hidden');
            resultsCount.textContent = '';
            return;
        }

        noQuotesMessage.classList.add('hidden');

        // Update results count
        const totalQuotes = this.savedQuotes.length;
        const filteredCount = this.filteredQuotes.length;
        resultsCount.textContent = filteredCount === totalQuotes ?
            `Showing ${totalQuotes} quote${totalQuotes !== 1 ? 's' : ''}` :
            `Showing ${filteredCount} of ${totalQuotes} quote${totalQuotes !== 1 ? 's' : ''}`;

        if (!document.querySelector('.results-count')) {
            container.parentNode.insertBefore(resultsCount, container);
        }

        if (this.filteredQuotes.length === 0) {
            container.innerHTML = `
                <div class="no-results-message">
                    <p>No quotes match your current filters.</p>
                    <button onclick="app.clearFilters()" class="clear-filters-btn">Clear Filters</button>
                </div>
            `;
            return;
        }

        container.innerHTML = this.filteredQuotes.map(quote => `
            <div class="saved-quote-item" data-quote-id="${quote.id}">
                <div class="quote-header">
                    <div class="quote-title-row">
                        <div class="quote-title">${esc(quote.quote_name)}</div>
                        <span class="status-badge status-${quote.status || 'pending'}">${this.getStatusLabel(quote.status || 'pending')}</span>
                    </div>
                    <div class="quote-date">${this.customerLabel(quote)}${new Date(quote.created_at).toLocaleDateString('en-ZA')}</div>
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
                        <span>${esc(quote.material_name)}</span>
                    </div>
                    <div class="quote-detail">
                        <span>Duration:</span>
                        <span>1 - ${quote.project_days} day(s)</span>
                    </div>
                    ${quote.scheduled_date ? `
                    <div class="quote-detail scheduled-date-detail">
                        <span>📅 Scheduled:</span>
                        <span>${new Date(quote.scheduled_date).toLocaleDateString('en-ZA')}</span>
                    </div>
                    ` : ''}
                </div>
                
                <div class="quote-total">
                    Total: ${fmtR(parseFloat(quote.total_cost))}
                    ${quote.payment_status && quote.payment_status !== 'unpaid' ? `
                        <span class="payment-badge payment-${quote.payment_status}">${quote.payment_status === 'paid' ? 'Paid' : 'Partial'}</span>
                    ` : ''}
                </div>
                
                <div class="quote-actions-saved">
                    <button class="view-details-btn" onclick="app.viewQuoteDetails('${quote.id}')">👁️ View Details</button>
                    <select class="status-change-select" onchange="app.changeQuoteStatus('${quote.id}', this.value)">
                        <option value="">Change Status...</option>
                        <option value="pending" ${quote.status === 'pending' ? 'disabled' : ''}>Pending</option>
                        <option value="accepted" ${quote.status === 'accepted' ? 'disabled' : ''}>Accepted</option>
                        <option value="rejected" ${quote.status === 'rejected' ? 'disabled' : ''}>Rejected</option>
                        <option value="completed" ${quote.status === 'completed' ? 'disabled' : ''}>Completed</option>
                    </select>
                    <button class="invoice-btn" onclick="app.generateInvoice('${quote.id}')">💰 Invoice</button>
                    <button class="export-individual-btn" onclick="app.exportSingleQuote('${quote.id}')">Export PDF</button>
                    <button class="edit-quote-btn" onclick="app.editQuote('${quote.id}')">Edit Name</button>
                    <button class="delete-quote-btn" onclick="app.deleteQuote('${quote.id}')">Delete</button>
                </div>
            </div>
        `).join('');
    }

    getStatusLabel(status) {
        const labels = {
            'pending': 'Pending',
            'accepted': 'Accepted',
            'rejected': 'Rejected',
            'completed': 'Completed'
        };
        return labels[status] || 'Pending';
    }

    async viewQuoteDetails(quoteId) {
        const quote = this.savedQuotes.find(q => q.id === quoteId);
        if (!quote) return;

        // Load photos for this quote
        const { data: photos, error: photosError } = await supabase
            .from('quote_photos')
            .select('*')
            .eq('quote_id', quoteId)
            .order('uploaded_at', { ascending: true });

        // Load custom line items
        const { data: customItems, error: itemsError } = await supabase
            .from('custom_line_items')
            .select('*')
            .eq('quote_id', quoteId);

        // Load customer info if linked
        let customer = null;
        if (quote.customer_id) {
            const { data: customerData } = await supabase
                .from('customers')
                .select('*')
                .eq('id', quote.customer_id)
                .single();
            customer = customerData;
        }

        this.showQuoteDetailsModal(quote, photos || [], customItems || [], customer);
    }

    showQuoteDetailsModal(quote, photos, customItems, customer) {
        const photosHTML = photos.length > 0 ? `
            <div class="modal-section">
                <h3>📷 Photos (${photos.length})</h3>
                <div class="modal-photos-grid">
                    ${photos.map(photo => `
                        <div class="modal-photo-item">
                            <a href="${esc(photo.photo_url)}" target="_blank" rel="noopener"><img src="${esc(photo.photo_url)}" alt="${esc(photo.photo_name)}"></a>
                            <span class="modal-photo-name">${esc(photo.photo_name)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : '';

        const customItemsHTML = customItems.length > 0 ? `
            <div class="modal-section">
                <h3>➕ Additional Charges</h3>
                <div class="modal-custom-items">
                    ${customItems.map(item => `
                        <div class="modal-custom-item">
                            <span>${esc(item.description)}</span>
                            <span class="item-amount">${fmtR(parseFloat(item.amount))}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : '';

        const customerHTML = customer ? `
            <div class="modal-section">
                <h3>👤 Customer Information</h3>
                <div class="modal-customer-info">
                    <p><strong>Name:</strong> ${esc(customer.name)}</p>
                    ${customer.phone ? `<p><strong>Phone:</strong> ${esc(customer.phone)}</p>` : ''}
                    ${customer.email ? `<p><strong>Email:</strong> ${esc(customer.email)}</p>` : ''}
                    ${customer.address ? `<p><strong>Address:</strong> ${esc(customer.address)}</p>` : ''}
                    ${customer.notes ? `<p><strong>Notes:</strong> ${esc(customer.notes)}</p>` : ''}
                </div>
            </div>
        ` : '';

        const modalHTML = `
            <div class="modal-overlay" id="quote-details-modal">
                <div class="modal-content quote-details-modal-content">
                    <div class="modal-header">
                        <h2 class="modal-title">${esc(quote.quote_name)}</h2>
                        <button class="close-modal-btn" onclick="app.closeQuoteDetailsModal()">&times;</button>
                    </div>
                    
                    <div class="modal-body">
                        <div class="modal-section">
                            <div class="detail-status-row">
                                <span class="status-badge status-${quote.status || 'pending'}">${this.getStatusLabel(quote.status || 'pending')}</span>
                                ${quote.payment_status && quote.payment_status !== 'unpaid' ? `
                                    <span class="payment-badge payment-${quote.payment_status}">${this.getPaymentStatusLabel(quote.payment_status)}</span>
                                ` : ''}
                            </div>
                        </div>

                        ${customerHTML}

                        <div class="modal-section">
                            <h3>📋 Project Details</h3>
                            <div class="modal-details-grid">
                              
                                <div class="detail-item">
                                    <span class="detail-label">Material:</span>
                                    <span class="detail-value">${esc(quote.material_name)}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Material Rate:</span>
                                    <span class="detail-value">R${quote.material_rate}/m²</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Project Duration:</span>
                                    <span class="detail-value">${quote.project_days} day(s)</span>
                                </div>
                                ${quote.scheduled_date ? `
                                <div class="detail-item">
                                    <span class="detail-label">📅 Scheduled:</span>
                                    <span class="detail-value">${new Date(quote.scheduled_date).toLocaleDateString('en-ZA')}</span>
                                </div>
                                ` : ''}
                            </div>
                        </div>

                        <div class="modal-section">
                            <h3>💰 Cost Breakdown</h3>
                            <div class="modal-cost-breakdown">
                                <div class="cost-item">
                                    <span>Material Cost:</span>
                                    <span>${fmtR(parseFloat(quote.material_cost))}</span>
                                </div>
                                <div class="cost-item">
                                    <span>Installation Fee:</span>
                                    <span>${fmtR(parseFloat(quote.installation_fee))}</span>
                                </div>
                                <div class="cost-item">
                                    <span>Food Cost:</span>
                                    <span>${fmtR(parseFloat(quote.food_cost))}</span>
                                </div>
                                <div class="cost-item">
                                    <span>Transport Cost:</span>
                                    <span>${fmtR(parseFloat(quote.transport_cost))}</span>
                                </div>
                                ${parseFloat(quote.custom_items_total) !== 0 ? `
                                <div class="cost-item">
                                    <span>Additional Charges:</span>
                                    <span>${fmtR(parseFloat(quote.custom_items_total))}</span>
                                </div>
                                ` : ''}
                                <div class="cost-item cost-total">
                                    <span><strong>Total:</strong></span>
                                    <span><strong>${fmtR(parseFloat(quote.total_cost))}</strong></span>
                                </div>
                            </div>
                        </div>

                        ${customItemsHTML}
                        ${photosHTML}

                        <div class="modal-section">
                            <p class="detail-date"><strong>Created:</strong> ${new Date(quote.created_at).toLocaleString()}</p>
                            ${quote.updated_at ? `<p class="detail-date"><strong>Last Updated:</strong> ${new Date(quote.updated_at).toLocaleString()}</p>` : ''}
                        </div>
                    </div>

                    <div class="modal-actions">
                        <button onclick="app.exportSingleQuote('${quote.id}')" class="modal-save-btn">Export PDF</button>
                        ${quote.status !== 'completed' ? `<button onclick="app.generateInvoice('${quote.id}')" class="modal-save-btn">Generate Invoice</button>` : ''}
                        <button onclick="app.closeQuoteDetailsModal()" class="modal-cancel-btn">Close</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    closeQuoteDetailsModal() {
        const modal = document.getElementById('quote-details-modal');
        if (modal) modal.remove();
    }

    async editQuote(quoteId) {
        const quote = this.savedQuotes.find(q => q.id === quoteId);
        if (!quote) return;

        const r = await this.ask({ title: 'Rename quote', fields: [{ name: 'name', label: 'Quote name', value: quote.quote_name, required: true }], okText: 'Save' });
        if (!r) return;
        const newName = r.name;

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

    async changeQuoteStatus(quoteId, newStatus) {
        if (!newStatus) return;

        const quote = this.savedQuotes.find(q => q.id === quoteId);
        if (!quote) return;

        const statusLabels = {
            'pending': 'Pending',
            'accepted': 'Accepted',
            'rejected': 'Rejected',
            'completed': 'Completed'
        };

        // Special confirmation for marking as completed
        if (newStatus === 'completed') {
            if (!await this.confirmBox('Mark this project as completed? It will be moved to History.')) {
                return;
            }
        }

        try {
            const { error } = await supabase
                .from('saved_quotes')
                .update({ status: newStatus })
                .eq('id', quoteId);

            if (error) {
                this.showError('Failed to update status: ' + error.message);
                return;
            }

            if (newStatus === 'completed') {
                this.showSuccess('Project marked as completed and moved to History!');
            } else {
                this.showSuccess(`Quote status changed to ${statusLabels[newStatus]}!`);
            }
            
            await this.loadSavedQuotes();
        } catch (error) {
            this.showError('Failed to update status. Please try again.');
        }
    }

    async deleteQuote(quoteId) {
        if (!await this.confirmBox('Are you sure you want to delete this quote?')) return;

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

    recalcIfShown() { if (this.currentQuote) this.calculateQuote(true); }

    renderMaterials() {
        document.querySelector('.material-options').innerHTML = PRICING.materials.map(m =>
            `<label class="material-option"><input type="radio" name="material" value="${m.id}" data-rate="${m.rate}"><span>${esc(m.name)} - R${m.rate} per m²</span></label>`).join('');
        document.getElementById('material-filter').insertAdjacentHTML('beforeend', PRICING.materials.map(m => `<option value="${esc(m.name)}">${esc(m.name)}</option>`).join(''));
    }

    customerLabel(q, deco = true) {
        const c = this.customers.find(x => x.id === q.customer_id);
        if (!c) return '';
        return deco ? `👤 ${esc(c.name)} · ` : c.name;
    }

    exportCSV() {
        const q = this.savedQuotes;
        if (!q.length) { this.showError('No quotes to export'); return; }
        const cols = ['quote_name','status','created_at','scheduled_date','doors','square_metres','material_name','material_cost','installation_fee','food_cost','transport_cost','custom_items_total','total_cost','payment_status','deposit_paid','final_payment_paid','invoice_number'];
        const cell = v => { v = v == null ? '' : String(v); if (/^[=+@]|^-(?!\d)/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; };
        const rows = [['customer', ...cols].map(cell).join(',')].concat(q.map(r => [this.customerLabel(r, false), ...cols.map(c => r[c])].map(cell).join(',')));
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob(['\ufeff' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8' }));
        a.download = `quotes_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
    }

    async compressImage(file) {
        if (!file.type.startsWith('image/') || file.size < 300 * 1024) return file;
        try {
            const bmp = await createImageBitmap(file);
            const k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
            const c = document.createElement('canvas');
            c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
            c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
            const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.8));
            if (!blob || blob.size >= file.size) return file;
            return new File([blob], file.name.replace(/\.\w+$/, '').replace(/[^\w-]/g, '_') + '.jpg', { type: 'image/jpeg' });
        } catch (e) { return file; }
    }

    toast(message, type) {
        this.clearMessages();
        let root = document.getElementById('toast-root');
        if (!root) { root = document.createElement('div'); root.id = 'toast-root'; document.body.appendChild(root); }
        const d = document.createElement('div');
        d.className = type + '-message';
        d.setAttribute('role', type === 'error' ? 'alert' : 'status');
        d.textContent = message;
        root.appendChild(d);
        if (type !== 'loading') setTimeout(() => d.remove(), type === 'error' ? 5000 : 3000);
    }

    showError(message) { this.toast(message, 'error'); }
    showSuccess(message) { this.toast(message, 'success'); }
    showLoading(message = 'Saving...') { this.toast(message, 'loading'); }
    clearMessages() { document.querySelectorAll('#toast-root > div').forEach(n => n.remove()); }
    hideLoading() { document.querySelectorAll('#toast-root > .loading-message').forEach(n => n.remove()); }

    // Promise-based dialog. Resolves to {fieldName: value} on OK, or null on cancel/Esc.
    ask({ title, message = '', fields = [], okText = 'OK', cancelText = 'Cancel' }) {
        return new Promise(resolve => {
            const ov = document.createElement('div');
            ov.className = 'modal-overlay';
            ov.setAttribute('role', 'dialog');
            ov.setAttribute('aria-modal', 'true');
            const rows = fields.map((f, i) => {
                const v = esc(f.value ?? '');
                const input = f.multiline
                    ? `<textarea id="dlg-${i}" rows="3">${v}</textarea>`
                    : `<input id="dlg-${i}" type="${f.type || 'text'}" ${f.step ? `step="${f.step}"` : ''} ${f.min !== undefined ? `min="${f.min}"` : ''} value="${v}">`;
                return `<label class="dialog-label" for="dlg-${i}">${esc(f.label)}${f.required ? ' *' : ''}</label>${input}`;
            }).join('');
            ov.innerHTML = `<div class="modal-content"><div class="modal-header"><h2 class="modal-title">${esc(title)}</h2></div>`
                + (message ? `<p class="dialog-message">${esc(message)}</p>` : '')
                + `<form class="modal-form">${rows}<div class="modal-actions"><button type="submit" class="modal-save-btn">${esc(okText)}</button>`
                + `<button type="button" class="modal-cancel-btn">${esc(cancelText)}</button></div></form></div>`;
            document.body.appendChild(ov);
            const form = ov.querySelector('form');
            const onKey = e => { if (e.key === 'Escape') done(null); };
            const done = v => { document.removeEventListener('keydown', onKey); ov.remove(); resolve(v); };
            document.addEventListener('keydown', onKey);
            ov.querySelector('.modal-cancel-btn').onclick = () => done(null);
            form.onsubmit = e => {
                e.preventDefault();
                const out = {};
                for (const [i, f] of fields.entries()) {
                    const val = form.querySelector('#dlg-' + i).value.trim();
                    if (f.required && !val) { this.showError(`${f.label} is required`); return; }
                    out[f.name] = val;
                }
                done(out);
            };
            (form.querySelector('input,textarea') || form.querySelector('button')).focus();
        });
    }

    async confirmBox(message) {
        return !!(await this.ask({ title: 'Please confirm', message, okText: 'Yes', cancelText: 'No' }));
    }

    resetQuote() {
        document.getElementById('doors-input').value = '';
        document.getElementById('sqm-input').value = '';
        document.getElementById('transport-input').value = '';
        document.getElementById('material-step').style.display = 'none';
        document.getElementById('transport-step').style.display = 'none';
        document.getElementById('custom-items-step').style.display = 'none';
        document.getElementById('photo-upload-step').style.display = 'none';
        document.getElementById('calculate-btn').style.display = 'none';
        document.getElementById('quote-result').style.display = 'none';

        // Clear material selection
        document.querySelectorAll('input[name="material"]').forEach(radio => {
            radio.checked = false;
        });

        // Clear custom line items
        this.customLineItems = [];
        this.renderCustomLineItems();

        // Clear photos
        this.uploadedPhotos.forEach(photo => URL.revokeObjectURL(photo.preview));
        this.uploadedPhotos = [];
        this.renderPhotoPreview();

        // Clear scheduled date and the rest of the quote form
        document.getElementById('scheduled-date-input').value = '';
        document.getElementById('quote-name-input').value = '';
        document.getElementById('quote-status-select').value = 'pending';
        document.getElementById('customer-select').value = '';
        this.handleCustomerSelection();
        this.currentQuote = null;
    }

    // Search and Filter Methods
    filterQuotes() {
        const searchTerm = document.getElementById('quote-search').value.toLowerCase();
        const materialFilter = document.getElementById('material-filter').value;
        const statusFilter = document.getElementById('status-filter').value;
        const dateFilter = document.getElementById('date-filter').value;

        this.filteredQuotes = this.savedQuotes.filter(quote => {
            // Exclude completed quotes - they go to History
            if (quote.status === 'completed') return false;

            // Search filter
            const matchesSearch = !searchTerm ||
                quote.quote_name.toLowerCase().includes(searchTerm) ||
                quote.material_name.toLowerCase().includes(searchTerm) ||
                this.customerLabel(quote, false).toLowerCase().includes(searchTerm);

            // Material filter
            const matchesMaterial = !materialFilter || quote.material_name === materialFilter;

            // Status filter
            const matchesStatus = !statusFilter || quote.status === statusFilter;

            // Date filter
            const matchesDate = this.matchesDateFilter(quote.created_at, dateFilter);

            return matchesSearch && matchesMaterial && matchesStatus && matchesDate;
        });

        this.renderSavedQuotes();
    }

    matchesDateFilter(dateString, filter) {
        if (!filter) return true;

        const quoteDate = new Date(dateString);
        const now = new Date();

        switch (filter) {
            case 'today':
                return quoteDate.toDateString() === now.toDateString();
            case 'week':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                return quoteDate >= weekAgo;
            case 'month':
                return quoteDate.getMonth() === now.getMonth() &&
                    quoteDate.getFullYear() === now.getFullYear();
            case 'year':
                return quoteDate.getFullYear() === now.getFullYear();
            default:
                return true;
        }
    }

    clearFilters() {
        document.getElementById('quote-search').value = '';
        document.getElementById('material-filter').value = '';
        document.getElementById('status-filter').value = '';
        document.getElementById('date-filter').value = '';
        // Exclude completed quotes from saved quotes view
        this.filteredQuotes = this.savedQuotes.filter(q => q.status !== 'completed');
        this.renderSavedQuotes();
    }

    // PDF Export Methods
    async exportToPDF(type) {
        const list = type === 'all' ? this.savedQuotes : this.filteredQuotes;
        if (!list.length) { this.showError('No quotes to export'); return; }
        const r = await this.ask({ title: 'Bulk export', message: 'Which customer are these quotes for?', fields: [
            { name: 'name', label: 'Customer name', required: true },
            { name: 'address', label: 'Location / address', multiline: true }], okText: 'Export PDF' });
        if (!r) return;
        await this.buildSummaryPDF(list, r);
    }

    async exportSingleQuote(quoteId) {
        const quote = this.savedQuotes.find(q => q.id === quoteId);
        if (!quote) { this.showError('Quote not found'); return; }
        const l = this.customers.find(c => c.id === quote.customer_id) || {};
        const r = await this.ask({ title: 'Quote details', fields: [
            { name: 'name', label: 'Customer name', value: l.name || '', required: true },
            { name: 'address', label: 'Address (one line per row)', value: l.address || '', multiline: true },
            { name: 'phone', label: 'Phone (optional)', value: l.phone || '', type: 'tel' },
            { name: 'email', label: 'Email (optional)', value: l.email || '', type: 'email' },
            { name: 'colour', label: 'Colour / finish chosen', required: true }], okText: 'Export PDF' });
        if (!r) return;
        await this.buildPDF('quote', quote, r);
    }

    loadLogo() {
        if (this._logo !== undefined) return Promise.resolve(this._logo);
        return new Promise(res => { const i = new Image(); i.onload = () => res(this._logo = i); i.onerror = () => res(this._logo = null); i.src = 'logo.png'; });
    }

    pdfHead(doc, logo, title, meta) {
        if (typeof LOGO_DATA !== 'undefined') { try { doc.addImage(LOGO_DATA, 'PNG', 15, 10, 62, 62 * LOGO_RATIO); } catch (e) { console.error('Logo skipped', e); } }
        doc.setFont('helvetica', 'bold'); doc.setFontSize(24); doc.setTextColor(...DARK);
        doc.text(title, 195, 22, { align: 'right' });
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...GREY);
        meta.forEach((m, i) => doc.text(m, 195, 29 + i * 5, { align: 'right' }));
        doc.setFillColor(...DARK); doc.rect(15, 42, 120, 1.2, 'F');
        doc.setFillColor(...ORANGE); doc.rect(135, 42, 60, 1.2, 'F');
        return 52;
    }

    pdfParties(doc, y, label, c) {
        const col = (x, head, lines) => {
            doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...ORANGE); doc.text(head, x, y);
            let yy = y + 5.5;
            lines.forEach((l, i) => {
                doc.setFont('helvetica', i === 0 ? 'bold' : 'normal'); doc.setFontSize(i === 0 ? 11 : 9.5); doc.setTextColor(...(i === 0 ? DARK : GREY));
                doc.splitTextToSize(String(l), 80).forEach(s => { doc.text(s, x, yy); yy += 4.8; });
            });
            return yy;
        };
        const y1 = col(15, label, [c.name, ...(c.address ? c.address.split('\n') : []), c.phone, c.email].filter(Boolean));
        const y2 = col(115, 'FROM', [BUSINESS.name, BUSINESS.area, BUSINESS.phone, BUSINESS.email]);
        return Math.max(y1, y2) + 4;
    }

    pdfFoot(doc) {
        const n = doc.getNumberOfPages();
        for (let i = 1; i <= n; i++) {
            doc.setPage(i);
            doc.setFillColor(...ORANGE); doc.rect(15, 284, 180, 0.6, 'F');
            doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...DARK);
            doc.text('WRAP IT  •  PROTECT IT  •  LOVE IT', 105, 290, { align: 'center' });
            doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...GREY);
            doc.text(`${BUSINESS.name}  |  ${BUSINESS.phone}  |  ${BUSINESS.email}`, 15, 294);
            doc.text(`Page ${i} of ${n}`, 195, 294, { align: 'right' });
        }
    }

    async buildPDF(kind, quote, c) {
        try {
            const { jsPDF } = window.jspdf, doc = new jsPDF(), inv = kind === 'invoice', num = v => parseFloat(v) || 0;
            const total = num(quote.total_cost), extra = num(quote.custom_items_total), paid = num(quote.deposit_paid) + num(quote.final_payment_paid);
            const ref = `KWM-${String(quote.created_at).slice(0, 10).replace(/-/g, '')}-${String(quote.id).slice(-4).toUpperCase()}`;
            const docNo = inv ? (quote.invoice_number || ref.replace('KWM', 'INV')) : ref;
            let items = [];
            if (extra !== 0) {
                const { data } = await supabase.from('custom_line_items').select('description, amount').eq('quote_id', quote.id);
                items = data && data.length ? data : [{ description: 'Additional charges', amount: extra }];
            }
            const logo = await this.loadLogo(), today = new Date(), day = d => d.toLocaleDateString('en-ZA');
            const finish = c.colour || '';
            let y = this.pdfHead(doc, logo, inv ? 'INVOICE' : 'QUOTATION', [`${inv ? 'Invoice' : 'Quote'} no: ${docNo}`, `Date: ${day(today)}`, inv ? `Quote ref: ${ref}` : `Valid until: ${day(new Date(today.getTime() + 30 * 864e5))}`]);
            y = this.pdfParties(doc, y, inv ? 'BILL TO' : 'PREPARED FOR', c);
            const need = h => { if (y + h > 276) { doc.addPage(); y = 20; } };
            const head = t => { need(14); doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...ORANGE); doc.text(t, 15, y); doc.setDrawColor(...DARK); doc.setLineWidth(0.3); doc.line(15, y + 1.8, 195, y + 1.8); y += 8; };

            // project strip
            doc.setFillColor(...SOFT); doc.rect(15, y, 180, 14, 'F');
            [['PROJECT', quote.quote_name, 18, 50], ['FINISH', finish, 70, 62], ['DURATION', `${quote.project_days} day(s)`, 135, 28], ['INSTALL DATE', quote.scheduled_date ? day(new Date(quote.scheduled_date + 'T00:00:00')) : 'To be confirmed', 165, 30]].forEach(([l, v, x, w]) => {
                doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...GREY); doc.text(l, x, y + 5);
                doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...DARK); doc.text((doc.splitTextToSize(String(v || '-'), w)[0] || '-'), x, y + 10.5);
            });
            y += 21;

            // line items
            doc.setFillColor(...DARK); doc.rect(15, y, 180, 8, 'F');
            doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(255, 255, 255);
            doc.text('Qty', 19, y + 5.5); doc.text('Description', 35, y + 5.5); doc.text('Unit price', 158, y + 5.5, { align: 'right' }); doc.text('Total', 191, y + 5.5, { align: 'right' });
            doc.setFillColor(...ORANGE); doc.rect(15, y + 8, 180, 0.8, 'F'); y += 15;
            const rows = [{ t: 'Kitchen cabinet wrapping', d: finish, a: total - extra }, ...items.map(i => ({ t: i.description, a: num(i.amount) }))];
            rows.forEach(r => {
                const lines = doc.splitTextToSize(String(r.t), 105), h = lines.length * 4.6 + (r.d ? 5 : 0) + 4;
                need(h);
                doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...DARK);
                doc.text('1', 19, y); doc.text(lines, 35, y);
                if (r.d) { doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...GREY); doc.text(r.d, 35, y + lines.length * 4.6); }
                doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(...DARK);
                doc.text(fmtR(r.a), 158, y, { align: 'right' }); doc.text(fmtR(r.a), 191, y, { align: 'right' });
                y += h; doc.setDrawColor(225, 225, 222); doc.setLineWidth(0.2); doc.line(15, y - 2.5, 195, y - 2.5);
            });
            y += 4;

            // totals
            need(34);
            const line = (l, v, yy) => { doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(...DARK); doc.text(l, 125, yy); doc.text(v, 191, yy, { align: 'right' }); };
            line('Subtotal', fmtR(total), y);
            line(inv ? 'Amount paid' : 'Deposit required (50%)', fmtR(inv ? paid : total / 2), y + 6);
            y += 11;
            doc.setFillColor(...DARK); doc.rect(120, y, 75, 11, 'F'); doc.setFillColor(...ORANGE); doc.rect(120, y, 2.5, 11, 'F');
            doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(255, 255, 255); doc.text(inv ? 'BALANCE DUE' : 'TOTAL', 127, y + 7.2);
            doc.setFontSize(12); doc.text(fmtR(inv ? Math.max(0, total - paid) : total), 191, y + 7.4, { align: 'right' }); y += 20;

            if (inv) {
                const st = quote.payment_status === 'paid' ? ['PAID IN FULL', [40, 167, 69]] : quote.payment_status === 'partial' ? ['PARTIALLY PAID', [230, 150, 0]] : ['UNPAID', [200, 50, 60]];
                need(12); doc.setFillColor(...st[1]); doc.roundedRect(15, y - 3, 44, 8, 1.5, 1.5, 'F');
                doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(255, 255, 255); doc.text(st[0], 37, y + 2.3, { align: 'center' }); y += 12;
            } else {
                need(30); head('SCOPE OF WORK');
                BUSINESS.scope.forEach(s => {
                    need(6); doc.setDrawColor(...ORANGE); doc.setLineWidth(0.6); doc.line(16, y - 1, 17.2, y + 0.3); doc.line(17.2, y + 0.3, 19.6, y - 2.6);
                    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...DARK); doc.text(s, 23, y); y += 5.2;
                });
                y += 3;
                const ex = doc.splitTextToSize('Please note: ' + BUSINESS.exclusions, 168), bh = ex.length * 4.4 + 6;
                need(bh + 8); doc.setFillColor(255, 243, 232); doc.rect(15, y, 180, bh, 'F'); doc.setFillColor(...ORANGE); doc.rect(15, y, 1.4, bh, 'F');
                doc.setFont('helvetica', 'normal'); doc.setFontSize(8.8); doc.setTextColor(...DARK); doc.text(ex, 21, y + 5); y += bh + 8;
            }

            // payment details
            need(52); head('PAYMENT DETAILS');
            const top = y;
            BUSINESS.bank.concat([['Reference', docNo]]).forEach(([l, v], i) => {
                doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...GREY); doc.text(l, 15, y + i * 5.2);
                doc.setFont('helvetica', 'bold'); doc.setTextColor(...DARK); doc.text(v, 50, y + i * 5.2);
            });
            const terms = inv ? ['Balance is due on completion of the work.', 'Please use the invoice number as your payment reference.']
                : [`At least 50% (${fmtR(total / 2)}) is payable upfront for material procurement before work commences.`, 'Quote valid for 30 days from the date of issue.', 'Balance is due on completion of the work.'];
            let ty = top; doc.setFontSize(8.8);
            terms.forEach(t => {
                doc.setFont('helvetica', 'normal'); doc.setTextColor(...DARK); const ls = doc.splitTextToSize(t, 72);
                doc.setFillColor(...ORANGE); doc.circle(112, ty - 1, 0.7, 'F'); doc.text(ls, 116, ty); ty += ls.length * 4.4 + 1.6;
            });
            y = Math.max(top + 6 * 5.2, ty) + 3;
            const tl = 'Terms and conditions apply: ';
            doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...GREY); doc.text(tl, 15, y);
            doc.setTextColor(0, 90, 180); doc.textWithLink('kitchenwrapmasters.co.za/pages/termsandconditions.html', 15 + doc.getTextWidth(tl), y, { url: BUSINESS.terms }); y += 10;

            this.pdfFoot(doc);
            const fn = `${docNo}_${String(c.name).replace(/[^a-z0-9]/gi, '_')}.pdf`;
            doc.save(fn); this.showSuccess(`${inv ? 'Invoice' : 'Quote'} exported: ${fn}`);
        } catch (e) { console.error('PDF error', e); this.showError('Failed to create the PDF: ' + (e && e.message ? e.message : e)); }
    }

    async buildSummaryPDF(quotes, c) {
        try {
            const { jsPDF } = window.jspdf, doc = new jsPDF(), logo = await this.loadLogo();
            let y = this.pdfHead(doc, logo, 'QUOTE SUMMARY', [`Date: ${new Date().toLocaleDateString('en-ZA')}`, `Quotes: ${quotes.length}`]);
            y = this.pdfParties(doc, y, 'PREPARED FOR', c) + 4;
            doc.setFillColor(...DARK); doc.rect(15, y, 180, 8, 'F'); doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(255, 255, 255);
            doc.text('Quote', 19, y + 5.5); doc.text('Doors', 150, y + 5.5, { align: 'right' }); doc.text('Total', 191, y + 5.5, { align: 'right' });
            doc.setFillColor(...ORANGE); doc.rect(15, y + 8, 180, 0.8, 'F'); y += 15;
            let sum = 0;
            quotes.forEach(q => {
                if (y > 268) { doc.addPage(); y = 22; }
                const t = parseFloat(q.total_cost) || 0; sum += t;
                doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...DARK);
                doc.text((doc.splitTextToSize(String(q.quote_name || '-'), 110)[0] || '-'), 19, y); 
                doc.text(String(q.doors), 150, y, { align: 'right' }); doc.text(fmtR(t), 191, y, { align: 'right' });
                y += 3; doc.setDrawColor(225, 225, 222); doc.setLineWidth(0.2); doc.line(15, y, 195, y); y += 5;
            });
            if (y > 256) { doc.addPage(); y = 22; }
            y += 4; doc.setFillColor(...DARK); doc.rect(120, y, 75, 11, 'F'); doc.setFillColor(...ORANGE); doc.rect(120, y, 2.5, 11, 'F');
            doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255); doc.setFontSize(10); doc.text('TOTAL', 127, y + 7.2); doc.setFontSize(12); doc.text(fmtR(sum), 191, y + 7.4, { align: 'right' });
            this.pdfFoot(doc);
            const fn = `${String(c.name).replace(/[^a-z0-9]/gi, '_')}_quote_summary.pdf`;
            doc.save(fn); this.showSuccess(`PDF exported: ${fn}`);
        } catch (e) { console.error('PDF error', e); this.showError('Failed to create the PDF: ' + (e && e.message ? e.message : e)); }
    }
}


// Initialize the app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new VinylQuoteApp();
});