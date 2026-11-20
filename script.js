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
    bank: [], // loaded from business_settings after login (never stored in this file)
    scopes: {
        kitchen: [
        'Wrapping of cupboard door fronts', 'Wrapping over the edges of each door', 'Wrapping of all visible edging',
        'Cleaning and preparation of all surfaces before wrapping', 'Cleaning of handles',
        'Adjustment of damaged hinges where necessary', 'Adjustment of damaged drawer runners where necessary',
        'Silicone application to relevant areas', 'Sanding of the doors where necessary',
        'Reinstallation and adjustment of doors, drawers and hardware after wrapping',
        'Final cleaning and finishing to ensure a neat, professional result'],
        wardrobe: ['Wrapping of wardrobe door fronts', 'Wrapping over the edges of each door', 'Wrapping of all visible edging', 'Cleaning and preparation of all surfaces before wrapping', 'Cleaning of handles', 'Adjustment of damaged hinges where necessary', 'Sanding of the doors where necessary', 'Reinstallation and adjustment of doors and hardware after wrapping', 'Final cleaning and finishing to ensure a neat, professional result'],
        appliance: ['Cleaning and preparation of the appliance surfaces before wrapping', 'Wrapping of the visible exterior panels', 'Wrapping over the edges where necessary', 'Final cleaning and finishing to ensure a neat, professional result'],
        tinting: ['Cleaning and preparation of the glass before application', 'Application of window tint film', 'Trimming of the film to fit each pane', 'Final cleaning and finishing to ensure a neat, professional result'],
        frosting: ['Cleaning and preparation of the glass before application', 'Application of frosting film', 'Trimming of the film to fit each pane', 'Final cleaning and finishing to ensure a neat, professional result'],
        wallpaper: ['Cleaning and preparation of the wall surface', 'Hanging of wallpaper', 'Matching of patterns where applicable', 'Trimming and finishing at edges, corners and fittings', 'Removal of offcuts and final cleaning']
    },
    // "Please note" text is only printed for the services listed here
    notes: {
        kitchen: 'We wrap the front of the doors and over the edges only. The inside of the doors and internal cabinet sections are not included. We do not wrap countertops.',
        wardrobe: 'We wrap the front of the doors and over the edges only. The inside of the wardrobe is not included.'
    }
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

PRICING.depositPct = 50;
BUSINESS.validityDays = 30;
BUSINESS.followUpDays = 3;
PRICING.appliances = [
    { id: 'side_by_side', name: '2 door side by side fridge', price: 3800 },
    { id: 'top_bottom', name: 'Double door top/bottom fridge', price: 2800 },
    { id: 'chest', name: 'Chest freezer', price: 1800 },
    { id: 'bar', name: 'Bar fridge', price: 1300 },
    { id: 'washer', name: 'Washing machine', price: 1800 },
    { id: 'dishwasher', name: 'Dishwasher', price: 1800 },
    { id: 'dryer', name: 'Tumble dryer', price: 1800 }
];
const SERVICES = {
    kitchen: { name: 'Kitchen cabinet wrapping' }, wardrobe: { name: 'Wardrobe wrapping' }, appliance: { name: 'Appliance wrapping' },
    tinting: { name: 'Window tinting', rate: 750 }, frosting: { name: 'Window frosting', rate: 650 }, wallpaper: { name: 'Wallpaper', rate: 750 }, countertop: { name: 'Countertop wrapping' }
};

PRICING.countertopFinishes = [{ id: 'marble', name: 'Marble', price: 457.87 }, { id: 'plain', name: 'Plain colour', price: 150 }];
PRICING.countertopInstall = 350;
PRICING.finishes = { tinting: [], frosting: [], wallpaper: [] };
BUSINESS.scopes.countertop = ['Cleaning and preparation of the countertop surface before wrapping', 'Wrapping of the countertop surface and visible edges', 'Trimming around sinks, hobs and fittings where necessary', 'Final cleaning and finishing to ensure a neat, professional result'];
const slugId = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'item';

const STAGE_LABELS = { accepted: 'Accepted', deposit_requested: 'Deposit requested', deposit_received: 'Deposit received', scheduled: 'Scheduled', in_progress: 'In progress', snagging: 'Snagging', awaiting_payment: 'Awaiting payment', complete: 'Complete' };
const SERVICE_SHORT = { kitchen: 'Kitchen', wardrobe: 'Wardrobe', appliance: 'Appliance', tinting: 'Tinting', frosting: 'Frosting', wallpaper: 'Wallpaper', countertop: 'Countertop' };

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
        this.serviceLines = [];
        this.depositTouched = false;
        this.renderMaterials();
        this.bindServiceEvents();
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
        if (!this.settingsLoaded) { this.settingsLoaded = true; this.loadBusinessSettings(); }
        if (!this.draftAsked) { this.draftAsked = true; this.restoreDraft(); }
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

        if (selectedMaterial || this.serviceLines.length) {
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

    updateCustomItemsTotal() { this.recalcIfShown(); this.saveDraft(); }

    hideCalculateButton() {
        if (this.serviceLines.length) { this.recalcIfShown(); return; }
        document.getElementById('calculate-btn').style.display = 'none';
        document.getElementById('quote-result').style.display = 'none';
        document.getElementById('transport-step').style.display = 'none';
    }

    calculateQuote(silent = false) {
        const bad = m => { if (silent) { this.currentQuote = null; document.getElementById('quote-result').style.display = 'none'; } else { this.showError(m); } };
        const sel = document.querySelector('input[name="material"]:checked'), lines = this.serviceLines;
        let doors = 0, squareMetres = 0;
        if (this.calculatorMode === 'doors') {
            doors = parseInt(document.getElementById('doors-input').value) || 0;
            squareMetres = doors / PRICING.doorsPerSqm;
        } else {
            squareMetres = parseFloat(document.getElementById('sqm-input').value) || 0;
            doors = Math.ceil(squareMetres * PRICING.doorsPerSqm);
        }
        const hasCab = doors > 0;
        if (!hasCab && !lines.length) { bad(this.calculatorMode === 'doors' ? 'Please enter a valid number of doors' : 'Please enter a valid square metres value'); return; }
        if (hasCab && !sel) { bad('Please select a material type'); return; }
        if (hasCab && sel.value === '__custom' && !this.customMaterial) { bad('Enter the custom finish details'); return; }
        const ward = lines.filter(l => l.service_type === 'wardrobe'), wardSides = ward.reduce((s, l) => s + l.qty, 0), wardSqm = ward.reduce((s, l) => s + l.details.sqm, 0);
        const cabDays = Math.ceil((doors + wardSides) / PRICING.sidesPerDay);
        const autoDays = Math.max(1, cabDays + (lines.some(l => l.service_type !== 'wardrobe') ? 1 : 0)), daysRaw = parseInt(document.getElementById('days-input').value), projectDays = daysRaw > 0 ? daysRaw : autoDays;
        const materialRate = hasCab ? parseFloat(sel.dataset.rate) : 0;
        const materialName = hasCab ? this.getMaterialName(sel.value) : 'Other services';
        const materialCost = squareMetres * materialRate, installationFee = doors * PRICING.installPerSide;
        const foodRaw = document.getElementById('food-input').value;
        const foodCost = foodRaw !== '' ? Math.max(0, parseFloat(foodRaw) || 0) : cabDays * PRICING.foodPerDay;
        const transportCost = Math.max(0, parseFloat(document.getElementById('transport-input').value) || 0);
        const customItemsTotal = this.customLineItems.reduce((s, x) => s + x.amount, 0);
        const linesTotal = lines.reduce((s, l) => s + l.line_total, 0);
        const totalCost = materialCost + installationFee + foodCost + transportCost + customItemsTotal + linesTotal;
        this.displayQuoteResult({ doors, squareMetres, projectDays, materialName, materialRate, materialCost, installationFee, foodCost, transportCost, customItemsTotal, linesTotal, hasCab, custom: hasCab && sel.value === '__custom', totalCost, totalSides: doors + wardSides, totalSqm: squareMetres + wardSqm });
    }

    bindServiceEvents() {
        document.querySelectorAll('[data-svc]').forEach(b => { b.onclick = () => this.addServiceLine(b.dataset.svc); });
        document.getElementById('food-input').addEventListener('input', () => this.recalcIfShown());
        document.getElementById('deposit-required').addEventListener('change', () => { this.depositTouched = true; });
        document.getElementById('days-input').addEventListener('input', () => this.recalcIfShown());
        document.getElementById('view-list-btn').onclick = () => this.setView('list');
        document.getElementById('view-board-btn').onclick = () => this.setView('board');
        const qs = document.getElementById('quote-section');
        let timer;
        ['input', 'change'].forEach(ev => qs.addEventListener(ev, () => { clearTimeout(timer); timer = setTimeout(() => this.saveDraft(), 400); }));
    }

    async addServiceLine(type) {
        const S = SERVICES[type], round2 = x => Math.round(x * 100) / 100;
        const saveField = { name: 'save', type: 'checks', label: '', options: ['Save to my list for next time'] };
        let line, saveList = null;
        const pick = (r, list, key) => r.pick === '__custom' ? { custom: true, name: (r.cname || '').trim(), val: parseFloat(r.cprice) } : (() => { const f = list.find(x => x.id === r.pick); return { custom: false, name: f.name, val: f[key] }; })();
        if (type === 'wardrobe') {
            const r = await this.ask({ title: 'Add wardrobe wrapping', fields: [
                { name: 'doors', label: 'Number of doors / sides', type: 'number', step: '1', min: 0 },
                { name: 'sqm', label: 'Or square metres (only if you are not counting doors)', type: 'number', step: '0.01', min: 0 },
                { name: 'pick', type: 'select', label: 'Material', options: PRICING.materials.map(m => [m.id, `${m.name} - R${m.rate}/m²`]).concat([['__custom', 'Custom finish...']]) },
                { name: 'cname', label: 'Custom finish name (if Custom)' }, { name: 'cprice', label: 'Custom price per m² (if Custom)', type: 'number', step: '0.01', min: 0 },
                { name: 'colour', label: 'Colour / finish', required: true }, saveField], okText: 'Add' });
            if (!r) return;
            const mat = pick(r, PRICING.materials, 'rate'), d0 = parseInt(r.doors) || 0, sq0 = parseFloat(r.sqm) || 0;
            if (mat.custom && (!mat.name || !(mat.val >= 0))) { this.showError('Enter the custom finish name and price'); return; }
            const doors = d0 || Math.ceil(sq0 * PRICING.doorsPerSqm);
            if (!(doors > 0)) { this.showError('Enter the number of doors / sides'); return; }
            const sqm = d0 ? d0 / PRICING.doorsPerSqm : sq0;
            line = { service_type: type, description: S.name, colour: r.colour, qty: doors, unit: 'sides', unit_price: null, line_total: sqm * mat.val + doors * PRICING.installPerSide, details: { sqm, material: mat.name, rate: mat.val, custom: mat.custom, finish_name: mat.custom ? mat.name : undefined } };
            if (mat.custom && r.save.length) { this.addToList(PRICING.materials, mat.name, 'rate', mat.val); saveList = true; }
        } else if (type === 'appliance') {
            const r = await this.ask({ title: 'Add appliance', fields: [
                { name: 'pick', type: 'select', label: 'Appliance', options: PRICING.appliances.map(a => [a.id, `${a.name} - R${a.price}`]).concat([['__custom', 'Custom item...']]) },
                { name: 'cname', label: 'Custom item name (if Custom)' }, { name: 'cprice', label: 'Custom price per item (if Custom)', type: 'number', step: '0.01', min: 0 },
                { name: 'qty', label: 'Quantity', type: 'number', value: '1', min: 1, step: '1', required: true },
                { name: 'colour', label: 'Colour / finish', required: true }, saveField], okText: 'Add' });
            if (!r) return;
            const a = pick(r, PRICING.appliances, 'price'), qty = Math.max(1, parseInt(r.qty) || 1);
            if (a.custom && (!a.name || !(a.val >= 0))) { this.showError('Enter the custom item name and price'); return; }
            line = { service_type: type, description: a.name, colour: r.colour, qty, unit: 'each', unit_price: a.val, line_total: a.val * qty, details: { custom: a.custom } };
            if (a.custom && r.save.length) { this.addToList(PRICING.appliances, a.name, 'price', a.val); saveList = true; }
        } else if (type === 'countertop') {
            const r = await this.ask({ title: 'Add countertop wrapping', message: `Installation is R${PRICING.countertopInstall} per m² on the same total. Enter the final total m².`, fields: [
                { name: 'pick', type: 'select', label: 'Finish', options: PRICING.countertopFinishes.map(f => [f.id, `${f.name} - R${f.price}/m²`]).concat([['__custom', 'Custom finish...']]) },
                { name: 'cname', label: 'Custom finish name (if Custom)' }, { name: 'cprice', label: 'Custom material price per m² (if Custom)', type: 'number', step: '0.01', min: 0 },
                { name: 'area', label: 'Total m² (final, including excess)', type: 'number', step: '0.01', min: 0, required: true },
                { name: 'detail', label: 'Colour / pattern name (optional)' }, saveField], okText: 'Add' });
            if (!r) return;
            const f = pick(r, PRICING.countertopFinishes, 'price'), area = parseFloat(r.area);
            if (f.custom && (!f.name || !(f.val >= 0))) { this.showError('Enter the custom finish name and price'); return; }
            if (!(area > 0)) { this.showError('Enter the total m²'); return; }
            line = { service_type: type, description: S.name, colour: [f.name, (r.detail || '').trim()].filter(Boolean).join(' - '), qty: area, unit: 'm²', unit_price: f.val + PRICING.countertopInstall, line_total: round2(area * (f.val + PRICING.countertopInstall)), details: { rate: f.val, install: PRICING.countertopInstall, finish: f.name, custom: f.custom } };
            if (f.custom && r.save.length) { this.addToList(PRICING.countertopFinishes, f.name, 'price', f.val); saveList = true; }
        } else {
            const list = [{ id: 'standard', name: 'Standard', price: S.rate }, ...PRICING.finishes[type]];
            const r = await this.ask({ title: 'Add ' + S.name.toLowerCase(), message: 'Enter the total area, or list each window/wall as width x height in metres, one per line (for example 1.2 x 1.5). Sizes override the total area.', fields: [
                { name: 'pick', type: 'select', label: 'Finish', options: list.map(f => [f.id, `${f.name} - R${f.price}/m²`]).concat([['__custom', 'Custom finish...']]) },
                { name: 'cname', label: 'Custom finish name (if Custom)' }, { name: 'cprice', label: 'Custom price per m² (if Custom)', type: 'number', step: '0.01', min: 0 },
                { name: 'area', label: 'Total area (m²)', type: 'number', step: '0.01', min: 0 },
                { name: 'sizes', label: 'Or sizes (one per line)', multiline: true },
                { name: 'detail', label: 'Colour / film / pattern (optional)' }, saveField], okText: 'Add' });
            if (!r) return;
            const f = pick(r, list, 'price');
            if (f.custom && (!f.name || !(f.val >= 0))) { this.showError('Enter the custom finish name and price'); return; }
            let area = parseFloat(r.area) || 0;
            const sizes = [];
            for (const row of r.sizes.split('\n').map(s => s.trim()).filter(Boolean)) {
                const m = row.replace(/,/g, '.').match(/^(\d+(?:\.\d+)?)\s*[x×*]\s*(\d+(?:\.\d+)?)$/i);
                if (!m) { this.showError(`Could not read "${row}". Use width x height, for example 1.2 x 1.5`); return; }
                sizes.push([+m[1], +m[2]]);
            }
            if (sizes.length) area = sizes.reduce((s, [w, hh]) => s + w * hh, 0);
            if (!(area > 0)) { this.showError('Enter an area or at least one size'); return; }
            area = round2(area);
            const shown = (!f.custom && list.find(x => x.id === r.pick).id === 'standard') ? (r.detail || '').trim() : [f.name, (r.detail || '').trim()].filter(Boolean).join(' - ');
            line = { service_type: type, description: S.name, colour: shown || null, qty: area, unit: 'm²', unit_price: f.val, line_total: round2(area * f.val), details: { sizes, rate: f.val, custom: f.custom } };
            if (f.custom && r.save.length) { this.addToList(PRICING.finishes[type], f.name, 'price', f.val); saveList = true; }
        }
        this.serviceLines.push(line);
        this.renderServiceLines();
        this.onLinesChanged();
        if (saveList) await this.persistConfig();
    }

    removeServiceLine(i) { this.serviceLines.splice(i, 1); this.renderServiceLines(); this.onLinesChanged(); }

    onLinesChanged() {
        this.handleMaterialSelection();
        this.saveDraft();
        if (!this.serviceLines.length && !document.querySelector('input[name="material"]:checked')) { this.currentQuote = null; this.hideCalculateButton(); }
    }

    renderServiceLines() {
        document.getElementById('service-lines').innerHTML = this.serviceLines.map((l, i) => `<div class="custom-line-item"><span class="item-description">${esc(l.description)} - ${l.unit === 'each' ? 'x ' + l.qty : l.qty + ' ' + l.unit}${l.colour ? ' (' + esc(l.colour) + ')' : ''}</span><span class="item-amount">${fmtR(l.line_total)}</span><button type="button" class="remove-item-btn" aria-label="Remove" onclick="app.removeServiceLine(${i})">×</button></div>`).join('');
    }

    getMaterialName(value) {
        const m = PRICING.materials.find(x => x.id === value);
        if (value === '__custom') return this.customMaterial ? this.customMaterial.name : 'Custom finish';
        return m ? m.name : value;
    }

    displayQuoteResult(quote) {
        document.getElementById('result-doors').textContent = quote.totalSides;
        document.getElementById('result-sqm').textContent = quote.totalSqm.toFixed(1);
        document.getElementById('result-days').textContent = quote.projectDays;
        document.getElementById('result-material').textContent = quote.hasCab ? `${quote.materialName} (R${quote.materialRate}/m²)` : '-';
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
        
        document.getElementById('lines-result').style.display = quote.linesTotal ? 'block' : 'none';
        document.getElementById('result-lines').textContent = (quote.linesTotal || 0).toFixed(2);
        if (!this.depositTouched) document.getElementById('deposit-required').checked = quote.hasCab || this.serviceLines.some(l => l.service_type !== 'appliance');
        document.getElementById('result-total').textContent = quote.totalCost.toFixed(2);

        document.getElementById('quote-result').style.display = 'block';

        // Store current quote for saving
        this.currentQuote = quote;
    }

    async saveQuote() {
        if (this.editingId) { return this.updateQuote(); }
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
                    doors: this.currentQuote.totalSides,
                    square_metres: this.currentQuote.totalSqm,
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
                    scheduled_date: scheduledDate,
                    deposit_required: document.getElementById('deposit-required').checked
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
            const failQuote = async what => { await supabase.from('saved_quotes').delete().eq('id', quoteId); throw new Error('Could not save ' + what + ', so the quote was not saved. Please try again.'); };

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
                    await failQuote('the additional charges');
                }
            }

            // Save service lines (cabinet part + other services)
            const q = this.currentQuote, kind = 'kitchen', rows = [];
            if (q.hasCab) rows.push({ service_type: kind, description: SERVICES[kind].name, colour: document.getElementById('cabinet-colour').value.trim() || null, qty: q.doors, unit: 'sides', unit_price: null, line_total: q.materialCost + q.installationFee, details: { sqm: q.squareMetres, material: q.materialName, rate: q.materialRate, custom: !!q.custom, finish_name: q.custom ? q.materialName : undefined } });
            this.serviceLines.forEach(l => rows.push(l));
            if (rows.length) {
                const { error: lerr } = await supabase.from('quote_lines').insert(rows.map((r, i) => ({ ...r, quote_id: quoteId, position: i })));
                if (lerr) await failQuote('the service lines');
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
        const [cy, cm] = monthSelect.value.split('-').map(Number);
        this.renderCalendarGrid(cy, cm, statusFilter);
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
            const matchesDate = this.matchesHistoryDateFilter(quote.completed_at || quote.updated_at || quote.created_at, dateFilter);
            
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
                    <div class="history-title">${esc(quote.quote_name)}${this.jobBadges(quote)}${this.profitLine(quote)}</div>
                    <div class="history-date">Completed: ${new Date(quote.completed_at || quote.updated_at || quote.created_at).toLocaleDateString('en-ZA')}</div>
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
                    <button class="view-history-btn" onclick="app.editCosts('${quote.id}')">💰 Costs</button>
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
            const { data: invNo, error: noErr } = await supabase.rpc('next_doc_no', { p_kind: 'invoice' });
            invoiceNumber = (noErr || !invNo) ? `INV-${Date.now()}` : invNo;
            
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
                        <div id="payment-ledger"></div>
                        
                        <div class="payment-actions">
                            <h4>Record Payment:</h4>
                            <input type="number" id="payment-amount" placeholder="Amount" step="0.01" min="0">
                            <select id="payment-type">
                                <option value="deposit">Deposit Payment</option>
                                <option value="final">Final Payment</option>
                            </select>
                            <select id="payment-method"><option value="eft">EFT</option><option value="cash">Cash</option><option value="card">Card</option><option value="other">Other</option></select>
                            <input type="date" id="payment-date" value="${new Date().toLocaleDateString('en-CA')}">
                            <input type="text" id="payment-ref" placeholder="Reference (optional)">
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
        this.loadLedger(quote.id);
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
                .from('payments')
                .insert({ quote_id: quoteId, kind: paymentType === 'deposit' ? 'deposit' : 'final', amount, method: document.getElementById('payment-method').value, paid_on: document.getElementById('payment-date').value || new Date().toLocaleDateString('en-CA'), reference: document.getElementById('payment-ref').value.trim() || null });

            if (error) {
                this.showError('Failed to record payment: ' + error.message);
                return;
            }

            this.showSuccess('Payment recorded successfully!');
            if (paymentType === 'deposit' && quote.status === 'accepted' && ['quote', 'accepted', 'deposit_requested', null, undefined].includes(quote.job_stage)) {
                await supabase.from('saved_quotes').update({ job_stage: 'deposit_received' }).eq('id', quoteId);
            } else if (totalPaid >= parseFloat(quote.total_cost) - 0.005 && quote.job_stage === 'awaiting_payment') {
                await supabase.from('saved_quotes').update({ status: 'completed', job_stage: 'complete', completed_at: new Date().toISOString() }).eq('id', quoteId);
                this.showSuccess('Paid in full: job moved to Complete');
            }
            this.closeInvoiceModal();
            await this.loadSavedQuotes();
        } catch (error) {
            this.showError('Failed to record payment. Please try again.');
        }
    }

    async exportInvoicePDF(quoteId) {
        const quote = this.savedQuotes.find(q => q.id === quoteId);
        if (!quote) { this.showError('Quote not found'); return; }
        const b = quote.bill_to || {};
        let cu = this.customers.find(x => x.id === quote.customer_id);
        if (!cu && quote.customer_id) {
            const { data } = await supabase.from('customers').select('*').eq('id', quote.customer_id).single();
            cu = data;
        }
        let c;
        if (cu) c = { name: cu.name, phone: cu.phone || b.phone, email: cu.email || b.email, address: cu.address || b.address, colour: b.colour };
        else if (b.name) c = { ...b };
        else {
            const r = await this.ask({ title: 'Customer details for invoice', fields: [
                { name: 'name', label: 'Customer name', required: true },
                { name: 'phone', label: 'Phone (optional)', type: 'tel' },
                { name: 'email', label: 'Email (optional)', type: 'email' },
                { name: 'address', label: 'Address (optional)', multiline: true }], okText: 'Create invoice PDF' });
            if (!r) return;
            c = r;
            quote.bill_to = { name: r.name, address: r.address, phone: r.phone, email: r.email };
            supabase.from('saved_quotes').update({ bill_to: quote.bill_to }).eq('id', quote.id).then(() => {}, () => {});
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
            await this.loadJobMeta();
            this.updateFollowUpCount();
            // Exclude completed quotes from saved quotes view
            this.filteredQuotes = this.savedQuotes.filter(q => q.status !== 'completed');
            this.renderSavedQuotes();
        } catch (error) {
            this.showError('Failed to load saved quotes. Please try again.');
        }
    }

    renderSavedQuotes() {
        if (this.savedView === 'board') this.renderBoard();
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
                    <div class="quote-date">${quote.quote_no ? esc(quote.quote_no) + ' · ' : ''}${this.customerLabel(quote)}${new Date(quote.created_at).toLocaleDateString('en-ZA')}</div>
                    ${this.jobBadges(quote)}
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
                    <button class="view-details-btn" onclick="app.editFullQuote('${quote.id}')">✏️ Edit</button><button class="view-details-btn" onclick="app.duplicateQuote('${quote.id}')">📋 Duplicate</button>
                    ${quote.status === 'accepted' ? `<button class="view-details-btn" onclick="app.openPlanJob('${quote.id}')">📅 ${quote.scheduled_date ? 'Plan Job' : 'Schedule Job'}</button>` : ''}
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

        const sp = photos || [];
        if (sp.length) {
            const paths = sp.map(p => decodeURIComponent((String(p.photo_url).split('/quote-photos/')[1] || '').split('?')[0]));
            const { data: signed } = await supabase.storage.from('quote-photos').createSignedUrls(paths, 3600);
            sp.forEach((p, i) => { if (signed && signed[i] && signed[i].signedUrl) p.photo_url = signed[i].signedUrl; });
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
                        ${quote.status === 'accepted' ? `<button onclick="app.openPlanJob('${quote.id}')" class="modal-save-btn">Plan Job</button>` : ''}
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
        if (newStatus === 'completed') {
            const cq = this.savedQuotes.find(x => x.id === quoteId);
            if (cq && this.balanceOf(cq) > 0.005) {
                this.showError(`Complete means finished and paid. ${fmtR(this.balanceOf(cq))} is still outstanding. Record the final payment on the invoice first.`);
                await this.loadSavedQuotes();
                return;
            }
        }
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
            if (newStatus === 'accepted') {
                // Accepted: move the job into the pipeline and prompt to schedule it
                if (!quote.job_stage || quote.job_stage === 'quote') {
                    await supabase.from('saved_quotes').update({ job_stage: 'accepted' }).eq('id', quoteId);
                    await this.loadSavedQuotes();
                }
                this.openPlanJob(quoteId);
            } else if (newStatus === 'completed') {
                await supabase.from('saved_quotes').update({ job_stage: 'complete', completed_at: new Date().toISOString() }).eq('id', quoteId);
            }
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
        const box = document.querySelector('.material-options'), cur = (document.querySelector('input[name="material"]:checked') || {}).value;
        box.innerHTML = PRICING.materials.map(m => `<label class="material-option"><input type="radio" name="material" value="${esc(m.id)}" data-rate="${m.rate}"><span>${esc(m.name)} - R${m.rate} per m²</span></label>`).join('') + '<label class="material-option"><input type="radio" name="material" value="__custom" data-rate="0"><span id="custom-material-label">Custom finish...</span></label>';
        box.onchange = () => this.handleMaterialSelection();
        box.onclick = e => { if (e.target.value === '__custom') this.askCustomMaterial(); };
        const r = cur && [...box.querySelectorAll('input')].find(x => x.value === cur);
        if (r) r.checked = true;
        if (this.customMaterial) this.setCustomMaterial(this.customMaterial);
        const f = document.getElementById('material-filter');
        while (f.options.length > 1) f.remove(1);
        f.insertAdjacentHTML('beforeend', PRICING.materials.map(m => `<option value="${esc(m.name)}">${esc(m.name)}</option>`).join(''));
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
        const mt = this.jobMeta || { lines: {}, team: {}, assign: {} };
        const extra = r => [[...(mt.lines[r.id] || [])].join('/'), r.job_stage || '', (mt.assign[r.id] || []).map(a => (mt.team[a.member_id] || {}).name).filter(Boolean).join('/')];
        const rows = [['customer', 'services', 'stage', 'installers', ...cols].map(cell).join(',')].concat(q.map(r => [this.customerLabel(r, false), ...extra(r), ...cols.map(c => r[c])].map(cell).join(',')));
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

    // ---- Running jobs: plan a job (stage, date, deposit gate, installers) and manage the team ----
    async openPlanJob(quoteId) {
        const quote = this.savedQuotes.find(q => q.id === quoteId);
        if (!quote) return;
        const [t, a, o, b] = await Promise.all([
            supabase.from('team_members').select('*').eq('active', true).order('name'),
            supabase.from('job_assignments').select('member_id, is_lead').eq('quote_id', quoteId),
            supabase.from('team_unavailability').select('member_id, day'),
            supabase.from('job_assignments').select('member_id, quote_id')
        ]);
        if (t.error || a.error) { this.showError('Team tables not found. Run the database script first.'); return; }
        const team = t.data || [], off = o.data || [], busy = b.data || [];
        const sel = new Set((a.data || []).map(x => x.member_id));
        let lead = ((a.data || []).find(x => x.is_lead) || {}).member_id || null;
        const rangeDays = (s, n) => Array.from({ length: Math.max(1, n || 1) }, (_, i) => new Date(Date.parse(s + 'T00:00:00Z') + i * 864e5).toISOString().slice(0, 10));
        const others = this.savedQuotes.filter(q => q.id !== quote.id && q.scheduled_date && !['rejected', 'completed'].includes(q.status));
        const clash = (m, days) => {
            if (off.some(x => x.member_id === m.id && days.includes(x.day))) return 'off';
            return busy.some(x => x.member_id === m.id && others.some(q => q.id === x.quote_id && rangeDays(q.scheduled_date, q.project_days).some(d => days.includes(d)))) ? 'booked' : '';
        };
        const stages = [['accepted', 'Accepted'], ['deposit_requested', 'Deposit requested'], ['deposit_received', 'Deposit received'], ['scheduled', 'Scheduled'], ['in_progress', 'In progress'], ['snagging', 'Snagging'], ['awaiting_payment', 'Awaiting payment']];
        const cur = quote.job_stage === 'quote' || !quote.job_stage ? 'accepted' : quote.job_stage;
        const dep = parseFloat(quote.deposit_paid) > 0;
        const ov = document.createElement('div');
        ov.className = 'modal-overlay';
        ov.innerHTML = `<div class="modal-content"><div class="modal-header"><h2 class="modal-title">Plan job: ${esc(quote.quote_name)}</h2></div>
            <p class="dialog-message">Deposit: ${dep ? 'received (' + fmtR(quote.deposit_paid) + ')' : 'not received yet'}</p>
            <form class="modal-form">
            <label class="dialog-label" for="pj-stage">Stage</label>
            <select id="pj-stage">${stages.map(([v, l]) => `<option value="${v}" ${v === cur ? 'selected' : ''}>${l}</option>`).join('')}</select>
            <label class="dialog-label" for="pj-date">Install date (${quote.project_days || 1} day(s))</label>
            <input type="date" id="pj-date" value="${esc(quote.scheduled_date || '')}">
            <label class="dialog-label"><input type="checkbox" id="pj-ovr" ${quote.deposit_override ? 'checked' : ''}> Override: allow scheduling without a deposit</label>
            <div class="dialog-label">Installers - <a href="#" id="pj-team">Manage team</a></div>
            <div id="pj-chips"></div>
            <label class="dialog-label" for="pj-lead">Lead installer</label><select id="pj-lead"></select>
            <div class="modal-actions"><button type="submit" class="modal-save-btn">Save</button><button type="button" class="modal-cancel-btn">Cancel</button></div></form></div>`;
        document.body.appendChild(ov);
        const $ = s => ov.querySelector(s);
        const draw = () => {
            const d = $('#pj-date').value, days = d ? rangeDays(d, quote.project_days) : [];
            $('#pj-chips').innerHTML = team.length ? team.map(m => {
                const on = sel.has(m.id), c = d ? clash(m, days) : '', col = /^#[0-9a-f]{6}$/i.test(m.colour) ? m.colour : '#ff6a00';
                return `<span><button type="button" class="pj-chip" data-id="${m.id}" style="border-color:${col};${on ? `background:${col};color:#fff` : ''}">${esc(m.name)}</button><small class="pj-tag">${c}</small></span>`;
            }).join('') : '<p class="dialog-message">No team members yet. Tap Manage team to add them.</p>';
            $('#pj-lead').innerHTML = '<option value="">No lead</option>' + team.filter(m => sel.has(m.id)).map(m => `<option value="${m.id}" ${lead === m.id ? 'selected' : ''}>${esc(m.name)}</option>`).join('');
        };
        draw();
        $('#pj-date').onchange = draw;
        $('#pj-lead').onchange = e => { lead = e.target.value || null; };
        $('#pj-chips').onclick = e => {
            const id = e.target.dataset && e.target.dataset.id;
            if (!id) return;
            if (sel.has(id)) { sel.delete(id); if (lead === id) lead = null; } else sel.add(id);
            draw();
        };
        $('#pj-team').onclick = e => { e.preventDefault(); this.openTeam(); };
        $('.modal-cancel-btn').onclick = () => ov.remove();
        $('form').onsubmit = async e => {
            e.preventDefault();
            const date = $('#pj-date').value || null, ovr = $('#pj-ovr').checked;
            let stage = $('#pj-stage').value;
            if (date && ['accepted', 'deposit_requested', 'deposit_received'].includes(stage)) stage = 'scheduled';
            const gated = date || ['scheduled', 'in_progress', 'snagging', 'awaiting_payment'].includes(stage);
            if (gated && quote.deposit_required !== false && !dep && !ovr) { this.showError('Deposit not received yet. Record it on the invoice, or tick the override.'); return; }
            const days = date ? rangeDays(date, quote.project_days) : [];
            const bad = team.filter(m => sel.has(m.id) && date && clash(m, days)).map(m => m.name);
            if (bad.length && !await this.confirmBox(`${bad.join(', ')} already booked or off on these days. Assign anyway?`)) return;
            let { error } = await supabase.from('saved_quotes').update({ job_stage: stage, scheduled_date: date, deposit_override: ovr }).eq('id', quote.id);
            if (!error) ({ error } = await supabase.from('job_assignments').delete().eq('quote_id', quote.id));
            if (!error && sel.size) ({ error } = await supabase.from('job_assignments').insert([...sel].map(id => ({ quote_id: quote.id, member_id: id, is_lead: id === lead }))));
            if (error) { this.showError('Could not save: ' + error.message); return; }
            ov.remove(); this.closeQuoteDetailsModal();
            this.showSuccess('Job updated');
            await this.loadSavedQuotes();
        };
    }

    async openTeam() {
        const { data, error } = await supabase.from('team_members').select('*').order('name');
        if (error) { this.showError('Team tables not found. Run the database script first.'); return; }
        const old = document.getElementById('team-modal'); if (old) old.remove();
        const ov = document.createElement('div');
        ov.className = 'modal-overlay'; ov.id = 'team-modal';
        ov.innerHTML = `<div class="modal-content"><div class="modal-header"><h2 class="modal-title">Team (${data.length})</h2></div>`
            + data.map(m => `<div class="cost-item" style="border-left:6px solid ${/^#[0-9a-f]{6}$/i.test(m.colour) ? m.colour : '#ff6a00'};padding-left:8px"><span>${esc(m.name)}${m.phone ? ' - ' + esc(m.phone) : ''}${m.active ? '' : ' (inactive)'}</span>
                <span><button class="modal-save-btn" data-act="edit" data-id="${m.id}">Edit</button> <button class="modal-save-btn" data-act="day" data-id="${m.id}">Day off</button> <button class="modal-cancel-btn" data-act="off" data-id="${m.id}">${m.active ? 'Deactivate' : 'Activate'}</button></span></div>`).join('')
            + `<div class="modal-actions"><button class="modal-save-btn" data-act="add">Add person</button><button class="modal-save-btn" data-act="bank">Bank details</button><button class="modal-cancel-btn" data-act="close">Close</button></div></div>`;
        document.body.appendChild(ov);
        ov.onclick = async e => {
            const btn = e.target.closest('button'); if (!btn) return;
            const act = btn.dataset.act, m = data.find(x => x.id === btn.dataset.id);
            if (act === 'close') { ov.remove(); return; }
            if (act === 'bank') { this.editBankDetails(); return; }
            let err = null;
            if (act === 'off') ({ error: err } = await supabase.from('team_members').update({ active: !m.active }).eq('id', m.id));
            else if (act === 'day') {
                const r = await this.ask({ title: 'Day off: ' + m.name, fields: [{ name: 'day', label: 'Date', type: 'date', required: true }, { name: 'note', label: 'Note (optional)' }], okText: 'Save' });
                if (!r) return;
                ({ error: err } = await supabase.from('team_unavailability').upsert({ member_id: m.id, day: r.day, note: r.note || null }, { onConflict: 'member_id,day' }));
            } else {
                const r = await this.ask({ title: m ? 'Edit team member' : 'Add team member', fields: [{ name: 'name', label: 'Name', value: m ? m.name : '', required: true }, { name: 'phone', label: 'Phone', type: 'tel', value: m ? (m.phone || '') : '' }, { name: 'colour', label: 'Calendar colour', type: 'color', value: m ? m.colour : '#ff6a00' }], okText: 'Save' });
                if (!r) return;
                const row = { name: r.name, phone: r.phone || null, colour: /^#[0-9a-f]{6}$/i.test(r.colour) ? r.colour : '#ff6a00' };
                ({ error: err } = await (m ? supabase.from('team_members').update(row).eq('id', m.id) : supabase.from('team_members').insert(row)));
            }
            if (err) { this.showError(err.message); return; }
            ov.remove(); this.openTeam();
        };
    }

    async loadBusinessSettings() {
        let { data, error } = await supabase.from('business_settings').select('bank, config').limit(1);
        if (error) ({ data, error } = await supabase.from('business_settings').select('bank').limit(1));
        if (error) { console.error('Business settings not available:', error.message); return; }
        const row = data && data[0];
        if (row && row.config) this.applyConfig(row.config);
        if (row && Array.isArray(row.bank) && row.bank.length) { BUSINESS.bank = row.bank; return; }
        BUSINESS.bank = [];
        this.editBankDetails(true);
    }

    applyConfig(c) {
        const set = (o, k, min) => { if (typeof c[k] === 'number' && c[k] >= min) o[k] = c[k]; };
        set(PRICING, 'doorsPerSqm', 0.1); set(PRICING, 'sidesPerDay', 1); set(PRICING, 'installPerSide', 0); set(PRICING, 'foodPerDay', 0); set(PRICING, 'depositPct', 0); set(BUSINESS, 'validityDays', 1); set(BUSINESS, 'followUpDays', 1);
        ['tinting', 'frosting', 'wallpaper'].forEach(k => { if (c.rates && typeof c.rates[k] === 'number' && c.rates[k] >= 0) SERVICES[k].rate = c.rates[k]; });
        if (Array.isArray(c.materials) && c.materials.length) PRICING.materials = c.materials.filter(m => m && m.id && m.name && typeof m.rate === 'number');
        if (Array.isArray(c.appliances) && c.appliances.length) PRICING.appliances = c.appliances.filter(a => a && a.id && a.name && typeof a.price === 'number');
        Object.entries(c.scopes || {}).forEach(([k, v]) => { if (BUSINESS.scopes[k] && Array.isArray(v)) BUSINESS.scopes[k] = v.filter(s => typeof s === 'string' && s.trim()); });
        Object.entries(c.notes || {}).forEach(([k, v]) => { if (typeof v === 'string') BUSINESS.notes[k] = v; });
        const okList = (a, k) => Array.isArray(a) ? a.filter(x => x && x.id && x.name && typeof x[k] === 'number') : null;
        if (okList(c.countertopFinishes, 'price')) PRICING.countertopFinishes = okList(c.countertopFinishes, 'price');
        set(PRICING, 'countertopInstall', 0);
        ['tinting', 'frosting', 'wallpaper'].forEach(k => { if (c.finishes && okList(c.finishes[k], 'price')) PRICING.finishes[k] = okList(c.finishes[k], 'price'); });
        this.renderMaterials();
    }

    async editBankDetails(first = false) {
        const cur = Object.fromEntries(BUSINESS.bank);
        const r = await this.ask({ title: 'Bank details for quotes and invoices', message: first ? 'Enter these once. They are stored privately and only loaded after you log in.' : '', fields: [
            { name: 'bank', label: 'Bank name', value: cur['Bank'] || '', required: true },
            { name: 'holder', label: 'Account holder', value: cur['Account holder'] || '', required: true },
            { name: 'number', label: 'Account number', value: cur['Account number'] || '', required: true },
            { name: 'type', label: 'Account type', value: cur['Account type'] || 'Current', required: true },
            { name: 'branch', label: 'Branch code (optional)', value: cur['Branch code'] || '' }], okText: 'Save' });
        if (!r) return;
        const bank = [['Bank', r.bank], ['Account holder', r.holder], ['Account number', r.number], ['Account type', r.type]];
        if (r.branch) bank.push(['Branch code', r.branch]);
        const { error } = await supabase.from('business_settings').upsert({ owner_id: this.currentUser.id, bank, updated_at: new Date().toISOString() });
        if (error) { this.showError('Could not save: ' + error.message); return; }
        BUSINESS.bank = bank;
        this.showSuccess('Bank details saved');
    }

    async loadJobMeta() {
        this.jobMeta = { lines: {}, team: {}, assign: {}, costs: {} };
        const [l, a, t, c] = await Promise.all([
            supabase.from('quote_lines').select('quote_id, service_type'),
            supabase.from('job_assignments').select('quote_id, member_id, is_lead'),
            supabase.from('team_members').select('id, name, colour'),
            supabase.from('job_costs').select('*')
        ]);
        (l.data || []).forEach(x => { (this.jobMeta.lines[x.quote_id] = this.jobMeta.lines[x.quote_id] || new Set()).add(x.service_type); });
        (a.data || []).forEach(x => { (this.jobMeta.assign[x.quote_id] = this.jobMeta.assign[x.quote_id] || []).push(x); });
        (t.data || []).forEach(x => { this.jobMeta.team[x.id] = x; });
        (c.data || []).forEach(x => { this.jobMeta.costs[x.quote_id] = x; });
    }

    jobBadges(q) {
        const m = this.jobMeta || { lines: {}, team: {}, assign: {} };
        const svc = [...(m.lines[q.id] || [])].map(s => `<span class="svc-chip">${SERVICE_SHORT[s] || esc(s)}</span>`).join('');
        const stage = STAGE_LABELS[q.job_stage] ? `<span class="stage-chip">${STAGE_LABELS[q.job_stage]}</span>` : '';
        const who = (m.assign[q.id] || []).map(a => m.team[a.member_id]).filter(Boolean).map(p => `<span class="inst-chip"><i style="background:${/^#[0-9a-f]{6}$/i.test(p.colour) ? p.colour : '#adb5bd'}"></i>${esc(p.name)}</span>`).join('');
        const fu = this.followUpState(q);
        const fb = fu.expired ? '<span class="stage-chip" style="background:#f8d7da;color:#842029">Expired</span>' : (fu.due ? '<span class="stage-chip">Follow up due</span>' : '');
        return (svc || stage || who || fb) ? `<div class="job-badges">${svc}${stage}${fb}${who}</div>` : '';
    }

    renderCalendarGrid(Y, M, statusFilter) {
        const mt = this.jobMeta || { lines: {}, team: {}, assign: {} }, inst = this.calInstaller || '', pad = n => String(n).padStart(2, '0');
        const byDay = {};
        this.savedQuotes.forEach(q => {
            if (!q.scheduled_date || ['completed', 'rejected'].includes(q.status) || (statusFilter === 'accepted' && q.status !== 'accepted')) return;
            if (inst && !(mt.assign[q.id] || []).some(a => a.member_id === inst)) return;
            for (let i = 0; i < Math.max(1, q.project_days || 1); i++) {
                const d = new Date(Date.parse(q.scheduled_date + 'T00:00:00Z') + i * 864e5).toISOString().slice(0, 10);
                (byDay[d] = byDay[d] || []).push({ q, i });
            }
        });
        const lead = Math.round((new Date(Y, M - 1, 1).getDay() + 6) % 7);
        let cells = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(x => `<div class="cal-dow">${x}</div>`).join('') + '<div class="cal-cell cal-empty"></div>'.repeat(lead);
        for (let d = 1; d <= new Date(Y, M, 0).getDate(); d++) {
            const es = byDay[`${Y}-${pad(M)}-${pad(d)}`] || [], seen = {};
            es.forEach(({ q }) => (mt.assign[q.id] || []).forEach(a => { seen[a.member_id] = (seen[a.member_id] || 0) + 1; }));
            const clash = Object.values(seen).some(n => n > 1);
            cells += `<div class="cal-cell${clash ? ' cal-clash' : ''}"${clash ? ' title="An installer is booked on two jobs this day"' : ''}><div class="cal-num">${d}${clash ? ' ⚠' : ''}</div>${es.map(({ q, i }) => {
                const as = mt.assign[q.id] || [], l1 = as.find(a => a.is_lead) || as[0], p = l1 && mt.team[l1.member_id];
                const col = p && /^#[0-9a-f]{6}$/i.test(p.colour) ? p.colour : '#adb5bd';
                const who = as.map(a => mt.team[a.member_id]).filter(Boolean).map(x => esc(x.name.split(' ')[0])).join(', ');
                return `<button class="cal-chip" style="border-left-color:${col}" onclick="app.viewQuoteFromCalendar('${q.id}')">${esc(q.quote_name)}${i ? ' (day ' + (i + 1) + ')' : ''}${who ? `<small>${who}</small>` : ''}</button>`;
            }).join('')}</div>`;
        }
        document.getElementById('calendar-view').innerHTML = `<div class="cal-toolbar"><select onchange="app.calInstaller = this.value; app.renderCalendar()"><option value="">All installers</option>${Object.values(mt.team).map(t => `<option value="${t.id}" ${inst === t.id ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}</select></div><div class="cal-scroll"><div class="cal-grid">${cells}</div></div>`;
    }

    draftKey() { return 'wrapmaster_draft_' + (this.currentUser ? this.currentUser.id : ''); }

    saveDraft() {
        if (!this.currentUser || this.editingId) return;
        const $ = id => document.getElementById(id), m = document.querySelector('input[name="material"]:checked');
        const d = { mode: this.calculatorMode, doors: $('doors-input').value, sqm: $('sqm-input').value, material: m ? m.value : '', colour: $('cabinet-colour').value, transport: $('transport-input').value, food: $('food-input').value, days: $('days-input').value, lines: this.serviceLines, items: this.customLineItems, name: $('quote-name-input').value, status: $('quote-status-select').value, date: $('scheduled-date-input').value, customer: $('customer-select').value, deposit: $('deposit-required').checked, touched: this.depositTouched, custom: this.customMaterial || null };
        try {
            if (!d.doors && !d.sqm && !d.lines.length && !d.items.length && !d.name) localStorage.removeItem(this.draftKey());
            else localStorage.setItem(this.draftKey(), JSON.stringify(d));
        } catch (e) { /* storage unavailable */ }
    }

    applyDraft(d) {
        const $ = id => document.getElementById(id);
        if (d.mode === 'sqm') this.switchToSqmMode(); else this.switchToDoorsMode();
        $('doors-input').value = d.doors; $('sqm-input').value = d.sqm;
        if (d.custom) this.setCustomMaterial(d.custom);
        const r = document.querySelector(`input[name="material"][value="${d.material}"]`); if (r) r.checked = true;
        $('cabinet-colour').value = d.colour; $('transport-input').value = d.transport; $('food-input').value = d.food; $('days-input').value = d.days;
        $('quote-name-input').value = d.name; $('quote-status-select').value = d.status; $('scheduled-date-input').value = d.date;
        this.serviceLines = d.lines || []; this.customLineItems = d.items || [];
        this.renderServiceLines(); this.renderCustomLineItems();
        $('customer-select').value = d.customer; this.handleCustomerSelection();
        this.depositTouched = !!d.touched; $('deposit-required').checked = d.deposit;
        if (d.mode === 'sqm') this.handleSqmInput(); else this.handleDoorsInput();
        this.handleMaterialSelection();
        this.calculateQuote(true);
    }

    async restoreDraft() {
        let d = null;
        try { d = JSON.parse(localStorage.getItem(this.draftKey()) || 'null'); } catch (e) { return; }
        if (!d) return;
        if (!(await this.confirmBox('You have an unsaved quote draft. Restore it? (Photos are not kept in drafts.)'))) { try { localStorage.removeItem(this.draftKey()); } catch (e) { /* ignore */ } return; }
        this.applyDraft(d);
        this.showSuccess('Draft restored');
    }

    balanceOf(q) { return (parseFloat(q.total_cost) || 0) - (parseFloat(q.deposit_paid) || 0) - (parseFloat(q.final_payment_paid) || 0); }

    stageOf(q) {
        if (q.status === 'pending') return 'quote';
        if (q.status === 'completed') return 'complete';
        return STAGE_LABELS[q.job_stage] && q.job_stage !== 'complete' ? q.job_stage : 'accepted';
    }

    setView(v) {
        this.savedView = v;
        document.getElementById('view-list-btn').classList.toggle('active', v === 'list');
        document.getElementById('view-board-btn').classList.toggle('active', v === 'board');
        document.getElementById('saved-quotes-list').classList.toggle('hidden', v === 'board');
        document.getElementById('board-view').classList.toggle('hidden', v !== 'board');
        if (v === 'board') this.renderBoard();
    }

    renderBoard() {
        const cols = [['quote', 'Quotes'], ['accepted', 'Accepted'], ['deposit_requested', 'Deposit requested'], ['deposit_received', 'Deposit received'], ['scheduled', 'Scheduled'], ['in_progress', 'In progress'], ['snagging', 'Snagging'], ['awaiting_payment', 'Awaiting payment'], ['complete', 'Complete']];
        const num = v => parseFloat(v) || 0, mt = this.jobMeta || { lines: {}, team: {}, assign: {} };
        const live = this.savedQuotes.filter(q => q.status !== 'rejected');
        const done = live.filter(q => q.status === 'completed').sort((a, b) => String(b.completed_at || b.updated_at).localeCompare(String(a.completed_at || a.updated_at))).slice(0, 10);
        const opts = cols.map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
        const card = q => {
            const bal = this.balanceOf(q), dep = num(q.deposit_paid) > 0;
            const who = (mt.assign[q.id] || []).map(a => mt.team[a.member_id]).filter(Boolean).map(p => `<span class="inst-chip"><i style="background:${/^#[0-9a-f]{6}$/i.test(p.colour) ? p.colour : '#adb5bd'}"></i>${esc(p.name)}</span>`).join('');
            const info = [q.scheduled_date ? '📅 ' + new Date(q.scheduled_date + 'T00:00:00').toLocaleDateString('en-ZA') : 'No date', q.deposit_required === false ? '' : (dep ? '💰 deposit in' : 'no deposit yet'), bal <= 0.005 && num(q.total_cost) > 0 ? 'paid' : '', this.followUpState(q).text].filter(Boolean).join(' · ');
            return `<div class="board-card"><div class="board-title" onclick="app.viewQuoteDetails('${q.id}')">${esc(q.quote_name)}</div><div class="board-meta">${this.customerLabel(q)}${fmtR(q.total_cost)}</div><div class="board-meta">${info}</div>${who ? `<div class="job-badges">${who}</div>` : ''}${q.status === 'completed' ? `<div class="board-meta">${(this.costsOf(q) ? 'Profit ' + fmtR(this.costsOf(q).profit) : 'Costs not entered')}</div><button type="button" class="view-history-btn" onclick="app.editCosts('${q.id}')">💰 Costs</button>` : ''}<select onchange="app.moveJob('${q.id}', this.value)"><option value="">Move to...</option>${opts}</select></div>`;
        };
        document.getElementById('board-view').innerHTML = `<div class="board">${cols.map(([key, label]) => {
            const items = key === 'complete' ? done : live.filter(q => q.status !== 'completed' && this.stageOf(q) === key);
            return `<div class="board-col"><div class="board-col-head">${label}<span>${items.length}</span></div>${items.map(card).join('') || '<div class="board-empty">-</div>'}</div>`;
        }).join('')}</div>`;
    }

    async moveJob(id, target) {
        try { await this.moveJobInner(id, target); } finally { if (this.savedView === 'board') this.renderBoard(); }
    }

    async moveJobInner(id, target) {
        const q = this.savedQuotes.find(x => x.id === id);
        if (!q || !target || target === this.stageOf(q)) return;
        const num = v => parseFloat(v) || 0, bal = this.balanceOf(q);
        if (target === 'awaiting_payment' && bal <= 0.005 && num(q.total_cost) > 0) target = 'complete';
        let upd;
        if (target === 'quote') upd = { status: 'pending', job_stage: 'quote' };
        else {
            if (['scheduled', 'in_progress', 'snagging', 'awaiting_payment', 'complete'].includes(target) && q.deposit_required !== false && !(num(q.deposit_paid) > 0) && !q.deposit_override) {
                this.showError('Deposit not received yet. Record it on the invoice, or open Plan Job and tick the override.'); return;
            }
            if (target === 'scheduled' && !q.scheduled_date) { this.openPlanJob(id); return; }
            if (target === 'complete') {
                if (bal > 0.005) { this.showError(`Complete means finished and paid. ${fmtR(bal)} is still outstanding. Record the final payment on the invoice first.`); return; }
                if (!(await this.confirmBox('Mark this job as complete? It will move to History.'))) return;
                upd = { status: 'completed', job_stage: 'complete', completed_at: new Date().toISOString() };
            } else upd = { status: 'accepted', job_stage: target };
        }
        const { error } = await supabase.from('saved_quotes').update(upd).eq('id', id);
        if (error) { this.showError('Could not move job: ' + error.message); return; }
        await this.loadSavedQuotes();
    }

    async loadLedger(quoteId) {
        const box = document.getElementById('payment-ledger');
        if (!box) return;
        const { data, error } = await supabase.from('payments').select('*').eq('quote_id', quoteId).order('paid_on').order('created_at');
        if (error || !(data || []).length) { box.innerHTML = ''; return; }
        box.innerHTML = '<h4>Payments:</h4>' + data.map(p => `<div class="custom-line-item"><span class="item-description">${new Date(p.paid_on + 'T00:00:00').toLocaleDateString('en-ZA')} - ${p.kind === 'deposit' ? 'Deposit' : 'Final'} - ${esc(String(p.method).toUpperCase())}${p.reference ? ' - ' + esc(p.reference) : ''}</span><span class="item-amount">${fmtR(p.amount)}</span><button type="button" class="remove-item-btn" aria-label="Delete payment" onclick="app.deletePayment('${p.id}', '${quoteId}')">×</button></div>`).join('');
    }

    async deletePayment(id, quoteId) {
        if (!(await this.confirmBox('Delete this payment? The totals will be recalculated.'))) return;
        const { error } = await supabase.from('payments').delete().eq('id', id);
        if (error) { this.showError('Could not delete payment: ' + error.message); return; }
        await this.loadSavedQuotes();
        this.closeInvoiceModal();
        const q = this.savedQuotes.find(x => x.id === quoteId);
        if (q) this.showInvoiceModal(q, q.invoice_number);
    }

    syncEditUI(quote) {
        const on = !!quote;
        document.getElementById('save-quote-btn').textContent = on ? 'Update Quote' : 'Save Quote';
        ['quote-status-select', 'scheduled-date-input'].forEach(id => { document.getElementById(id).disabled = on; });
        let b = document.getElementById('edit-banner');
        if (!on) { if (b) b.remove(); return; }
        if (!b) { b = document.createElement('div'); b.id = 'edit-banner'; b.className = 'edit-banner'; document.getElementById('quote-section').prepend(b); }
        b.innerHTML = `Editing ${esc(quote.quote_no || quote.quote_name)}. Status, date, installers and payments are kept. <button type="button" onclick="app.cancelEdit()">Cancel</button>`;
    }

    cancelEdit() { this.resetQuote(); this.showSavedQuotes(); }

    async editFullQuote(id) {
        const quote = this.savedQuotes.find(x => x.id === id);
        if (!quote) return;
        if (quote.status === 'completed') { this.showError('Completed jobs cannot be edited. Use Duplicate to make a new quote.'); return; }
        if ((this.currentQuote || this.serviceLines.length || document.getElementById('doors-input').value) && !this.editingId && !(await this.confirmBox('Discard the quote you are building and edit this one instead?'))) return;
        const [l, i] = await Promise.all([
            supabase.from('quote_lines').select('*').eq('quote_id', id).order('position'),
            supabase.from('custom_line_items').select('description, amount').eq('quote_id', id)
        ]);
        if (l.error || i.error) { this.showError('Could not load the quote to edit'); return; }
        this.closeQuoteDetailsModal();
        this.resetQuote();
        await this.showQuoteSection();
        const num = v => parseFloat(v) || 0, lines = l.data || [], kit = lines.find(x => x.service_type === 'kitchen');
        const rest = lines.filter(x => x !== kit).map(r => ({ service_type: r.service_type, description: r.description, colour: r.colour, qty: num(r.qty), unit: r.unit, unit_price: r.unit_price == null ? null : num(r.unit_price), line_total: num(r.line_total), details: r.details || {} }));
        const kSides = kit ? num(kit.qty) : (lines.length ? 0 : num(quote.doors)), wSides = rest.filter(x => x.service_type === 'wardrobe').reduce((s, x) => s + x.qty, 0);
        const autoFood = Math.ceil((kSides + wSides) / PRICING.sidesPerDay) * PRICING.foodPerDay;
        const autoDays = Math.max(1, Math.ceil((kSides + wSides) / PRICING.sidesPerDay) + (rest.some(x => x.service_type !== 'wardrobe') ? 1 : 0));
        const matName = (kit && kit.details && kit.details.material) || quote.material_name;
        this.applyDraft({
            mode: 'doors', doors: kSides ? String(kSides) : '', sqm: '', material: (PRICING.materials.find(m => m.name === matName) || {}).id || (kit && kit.details && kit.details.custom ? '__custom' : ''), custom: kit && kit.details && kit.details.custom ? { name: matName, rate: num(kit.details.rate) } : null,
            colour: (kit && kit.colour) || '', transport: num(quote.transport_cost) ? String(num(quote.transport_cost)) : '',
            food: Math.abs(num(quote.food_cost) - autoFood) < 0.005 ? '' : String(num(quote.food_cost)),
            days: num(quote.project_days) === autoDays ? '' : String(num(quote.project_days)),
            lines: rest, items: (i.data || []).map(x => ({ description: x.description, amount: num(x.amount) })),
            name: quote.quote_name, status: quote.status, date: quote.scheduled_date || '', customer: quote.customer_id || '', deposit: quote.deposit_required !== false, touched: true
        });
        this.editingId = id;
        this.syncEditUI(quote);
    }

    async updateQuote() {
        const id = this.editingId, old = this.savedQuotes.find(x => x.id === id), q = this.currentQuote;
        if (!old || !q) { this.showError('Calculate the quote first'); return; }
        if (((parseFloat(old.deposit_paid) || 0) + (parseFloat(old.final_payment_paid) || 0) > 0 || old.invoice_number) && !(await this.confirmBox('This quote has an invoice or payments. Changing the total changes what is still owed. Update it anyway?'))) return;
        const btn = document.getElementById('save-quote-btn');
        btn.disabled = true;
        this.showLoading('Updating quote...');
        const keys = ['customer_id', 'doors', 'square_metres', 'project_days', 'material_name', 'material_rate', 'material_cost', 'installation_fee', 'food_cost', 'transport_cost', 'custom_items_total', 'total_cost', 'quote_name', 'deposit_required'];
        const oldCols = Object.fromEntries(keys.map(k => [k, old[k]]));
        const [ol, oi] = await Promise.all([supabase.from('quote_lines').select('*').eq('quote_id', id), supabase.from('custom_line_items').select('*').eq('quote_id', id)]);
        const rows = [];
        if (q.hasCab) rows.push({ service_type: 'kitchen', description: SERVICES.kitchen.name, colour: document.getElementById('cabinet-colour').value.trim() || null, qty: q.doors, unit: 'sides', unit_price: null, line_total: q.materialCost + q.installationFee, details: { sqm: q.squareMetres, material: q.materialName, rate: q.materialRate, custom: !!q.custom, finish_name: q.custom ? q.materialName : undefined } });
        this.serviceLines.forEach(x => rows.push(x));
        const newCols = { customer_id: document.getElementById('customer-select').value || null, doors: q.totalSides, square_metres: q.totalSqm, project_days: q.projectDays, material_name: q.materialName, material_rate: q.materialRate, material_cost: q.materialCost, installation_fee: q.installationFee, food_cost: q.foodCost, transport_cost: q.transportCost, custom_items_total: q.customItemsTotal || 0, total_cost: q.totalCost, quote_name: document.getElementById('quote-name-input').value.trim() || old.quote_name, deposit_required: document.getElementById('deposit-required').checked };
        const chk = r => { if (r.error) throw r.error; };
        try {
            chk(await supabase.from('saved_quotes').update(newCols).eq('id', id));
            chk(await supabase.from('quote_lines').delete().eq('quote_id', id));
            chk(await supabase.from('custom_line_items').delete().eq('quote_id', id));
            if (rows.length) chk(await supabase.from('quote_lines').insert(rows.map((r, i) => ({ ...r, quote_id: id, position: i }))));
            if (this.customLineItems.length) chk(await supabase.from('custom_line_items').insert(this.customLineItems.map(x => ({ quote_id: id, description: x.description, amount: x.amount }))));
        } catch (e) {
            await supabase.from('saved_quotes').update(oldCols).eq('id', id);
            await supabase.from('quote_lines').delete().eq('quote_id', id);
            await supabase.from('custom_line_items').delete().eq('quote_id', id);
            if ((ol.data || []).length) await supabase.from('quote_lines').insert(ol.data);
            if ((oi.data || []).length) await supabase.from('custom_line_items').insert(oi.data);
            this.hideLoading(); btn.disabled = false;
            this.showError('Update failed, the quote was put back as it was: ' + e.message);
            return;
        }
        let photoWarn = false;
        if (this.uploadedPhotos.length) {
            const recs = await this.uploadPhotosToStorage(id);
            if (recs.length < this.uploadedPhotos.length) photoWarn = true;
            if (recs.length) { const { error } = await supabase.from('quote_photos').insert(recs.map(p => ({ quote_id: id, ...p }))); if (error) photoWarn = true; }
        }
        this.hideLoading(); btn.disabled = false;
        if (photoWarn) this.showError('Quote updated, but some photos were not saved.'); else this.showSuccess('Quote updated');
        this.resetQuote();
        setTimeout(() => this.showSavedQuotes(), 800);
    }

    async duplicateQuote(id) {
        const quote = this.savedQuotes.find(x => x.id === id);
        if (!quote) return;
        if (!(await this.confirmBox(`Duplicate "${quote.quote_name}"? The copy starts as a new pending quote with no date, installers or payments.`))) return;
        const row = { ...quote };
        ['id', 'created_at', 'updated_at', 'quote_no', 'invoice_number', 'completed_at', 'scheduled_date', 'deposit_paid', 'final_payment_paid', 'payment_status', 'job_stage', 'deposit_override', 'is_public', 'last_followed_up_at', 'follow_up_note'].forEach(k => { delete row[k]; });
        Object.assign(row, { user_id: this.currentUser.id, status: 'pending', quote_name: quote.quote_name + ' (copy)' });
        const [l, i] = await Promise.all([supabase.from('quote_lines').select('*').eq('quote_id', id), supabase.from('custom_line_items').select('*').eq('quote_id', id)]);
        const { data, error } = await supabase.from('saved_quotes').insert([row]).select();
        if (error) { this.showError('Could not duplicate: ' + error.message); return; }
        const nid = data[0].id, strip = r => { const { id: _a, quote_id: _q, owner_id: _o, created_at: _c, ...rest } = r; return { ...rest, quote_id: nid }; };
        for (const [res, table] of [[l, 'quote_lines'], [i, 'custom_line_items']]) {
            if ((res.data || []).length) {
                const { error: e } = await supabase.from(table).insert(res.data.map(strip));
                if (e) { await supabase.from('saved_quotes').delete().eq('id', nid); this.showError('Could not copy the quote contents, so no copy was made: ' + e.message); return; }
            }
        }
        await this.loadSavedQuotes();
        this.showSuccess('Quote duplicated');
    }

    costsOf(q) {
        const c = (this.jobMeta && this.jobMeta.costs || {})[q.id];
        if (!c) return null;
        const cost = ['materials', 'labour', 'fuel', 'other'].reduce((s, k) => s + (parseFloat(c[k]) || 0), 0), rev = parseFloat(q.total_cost) || 0;
        return { cost, profit: rev - cost, margin: rev > 0 ? (rev - cost) / rev * 100 : 0 };
    }

    profitLine(q) {
        if (q.status !== 'completed') return '';
        const k = this.costsOf(q);
        return k ? `<div class="board-meta">Costs ${fmtR(k.cost)} · Profit ${fmtR(k.profit)} (${k.margin.toFixed(0)}%)</div>` : '<div class="board-meta">Costs not entered</div>';
    }

    async editCosts(id) {
        const q = this.savedQuotes.find(x => x.id === id);
        if (!q) return;
        const c = (this.jobMeta.costs || {})[id] || {};
        const f = (name, label) => ({ name, label, type: 'number', step: '0.01', min: 0, value: c[name] != null ? String(c[name]) : '' });
        const r = await this.ask({ title: 'Job costs: ' + q.quote_name, message: `Charged: ${fmtR(q.total_cost)}. Enter what the job cost you. Blank counts as 0.`, fields: [
            f('materials', 'Materials (R)'), f('labour', 'Labour (R)'), f('fuel', 'Fuel / transport (R)'), f('other', 'Other (R)'),
            { name: 'note', label: 'Note (optional)', multiline: true, value: c.note || '' }], okText: 'Save' });
        if (!r) return;
        const n = v => Math.max(0, parseFloat(v) || 0);
        const { error } = await supabase.from('job_costs').upsert({ quote_id: id, materials: n(r.materials), labour: n(r.labour), fuel: n(r.fuel), other: n(r.other), note: r.note || null, updated_at: new Date().toISOString() }, { onConflict: 'quote_id' });
        if (error) { this.showError('Could not save costs: ' + error.message); return; }
        await this.loadSavedQuotes();
        if (this.filteredHistory) this.displayHistory();
        this.showSuccess('Costs saved');
    }

    openDashboard() {
        const old = document.getElementById('dash-modal'); if (old) old.remove();
        const num = v => parseFloat(v) || 0, qs = this.savedQuotes || [], mt = this.jobMeta || { lines: {}, costs: {} };
        const done = qs.filter(q => q.status === 'completed');
        const decided = qs.filter(q => ['accepted', 'completed', 'rejected'].includes(q.status));
        const won = decided.filter(q => q.status !== 'rejected').length;
        const pipeline = qs.filter(q => q.status === 'pending').reduce((s, q) => s + num(q.total_cost), 0);
        const owed = qs.filter(q => ['accepted', 'completed'].includes(q.status)).reduce((s, q) => s + Math.max(0, this.balanceOf(q)), 0);
        const now = new Date(), months = [];
        for (let i = 0; i < 6; i++) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`); }
        const monthOf = q => String(q.completed_at || q.updated_at || q.created_at).slice(0, 7);
        const mrow = m => {
            const js = done.filter(q => monthOf(q) === m), withC = js.filter(q => this.costsOf(q));
            const rev = js.reduce((s, q) => s + num(q.total_cost), 0), cost = withC.reduce((s, q) => s + this.costsOf(q).cost, 0), prof = withC.reduce((s, q) => s + this.costsOf(q).profit, 0);
            return `<tr><td>${m}</td><td>${js.length}</td><td>${fmtR(rev)}</td><td>${fmtR(cost)}</td><td>${fmtR(prof)}</td><td>${js.length - withC.length}</td></tr>`;
        };
        const svc = {};
        done.filter(q => this.costsOf(q)).forEach(q => {
            const t = [...(mt.lines[q.id] || [])], key = t.length === 1 ? (SERVICE_SHORT[t[0]] || t[0]) : 'Mixed jobs', k = this.costsOf(q);
            const s = svc[key] = svc[key] || { n: 0, rev: 0, prof: 0 };
            s.n += 1; s.rev += num(q.total_cost); s.prof += k.profit;
        });
        const srows = Object.entries(svc).map(([k, s]) => `<tr><td>${k}</td><td>${s.n}</td><td>${fmtR(s.rev)}</td><td>${fmtR(s.prof)}</td><td>${s.rev > 0 ? Math.round(s.prof / s.rev * 100) : 0}%</td></tr>`).join('') || '<tr><td colspan="5">No jobs with costs yet</td></tr>';
        const ov = document.createElement('div');
        ov.className = 'modal-overlay'; ov.id = 'dash-modal';
        ov.innerHTML = `<div class="modal-content dash-wide"><div class="modal-header"><h2 class="modal-title">Dashboard</h2></div>
            <div class="history-stats">
                <div class="stat-card"><div class="stat-value">${decided.length ? Math.round(won / decided.length * 100) + '%' : '-'}</div><div class="stat-label">Quote win rate</div></div>
                <div class="stat-card"><div class="stat-value">${fmtR(pipeline)}</div><div class="stat-label">Pending quotes</div></div>
                <div class="stat-card"><div class="stat-value">${fmtR(owed)}</div><div class="stat-label">Outstanding payments</div></div>
            </div>
            <h4>Completed jobs by month</h4>
            <div class="dash-scroll"><table class="dash-table"><tr><th>Month</th><th>Jobs</th><th>Revenue</th><th>Costs</th><th>Profit</th><th>Costs missing</th></tr>${months.map(mrow).join('')}</table></div>
            <p class="dash-note">Costs and profit only include jobs where you have entered costs.</p>
            <h4>Profit by service (jobs with costs)</h4>
            <div class="dash-scroll"><table class="dash-table"><tr><th>Service</th><th>Jobs</th><th>Revenue</th><th>Profit</th><th>Margin</th></tr>${srows}</table></div>
            <p class="dash-note">Jobs with more than one service are grouped as Mixed jobs.</p>
            <div class="modal-actions"><button class="modal-cancel-btn">Close</button></div></div>`;
        document.body.appendChild(ov);
        ov.querySelector('.modal-cancel-btn').onclick = () => ov.remove();
    }

    openSettings() {
        const old = document.getElementById('settings-modal'); if (old) old.remove();
        const P = PRICING, S = SERVICES, B = BUSINESS, kinds = Object.keys(B.scopes);
        const num = (id, label, val, step = '0.01') => `<label class="dialog-label" for="st-${id}">${label}</label><input type="number" id="st-${id}" min="0" step="${step}" value="${esc(String(val))}">`;
        const area = (id, label, val, rows = 4) => `<label class="dialog-label" for="st-${id}">${label}</label><textarea id="st-${id}" rows="${rows}">${esc(val)}</textarea>`;
        const ov = document.createElement('div');
        ov.className = 'modal-overlay'; ov.id = 'settings-modal';
        ov.innerHTML = `<div class="modal-content dash-wide"><div class="modal-header"><h2 class="modal-title">Settings</h2></div><form class="modal-form">
            <h4>Rates and rules</h4>
            ${num('installPerSide', 'Installation per side (R)', P.installPerSide)}${num('foodPerDay', 'Food per day (R)', P.foodPerDay)}${num('sidesPerDay', 'Sides per day (team capacity)', P.sidesPerDay, '1')}${num('doorsPerSqm', 'Doors per m²', P.doorsPerSqm)}
            ${num('depositPct', 'Deposit (%)', P.depositPct, '1')}${num('validityDays', 'Quote valid for (days)', B.validityDays, '1')}${num('followUpDays', 'Follow up pending quotes after (days)', B.followUpDays, '1')}
            ${num('tinting', 'Window tinting (R per m²)', S.tinting.rate)}${num('frosting', 'Window frosting (R per m²)', S.frosting.rate)}${num('wallpaper', 'Wallpaper (R per m²)', S.wallpaper.rate)}${num('countertopInstall', 'Countertop installation (R per m²)', P.countertopInstall)}
            <h4>Materials (internal; one per line as Name | price per m²)</h4>${area('materials', '', P.materials.map(m => `${m.name} | ${m.rate}`).join('\n'), 6)}
            <h4>Appliances (one per line as Name | price)</h4>${area('appliances', '', P.appliances.map(a => `${a.name} | ${a.price}`).join('\n'), 7)}
            <h4>Countertop finishes (Name | price per m²)</h4>${area('ctfinishes', '', P.countertopFinishes.map(f => `${f.name} | ${f.price}`).join('\n'), 4)}
            <h4>Extra finishes for tinting, frosting and wallpaper (Name | price per m²)</h4>${['tinting', 'frosting', 'wallpaper'].map(k => area('fin-' + k, SERVICES[k].name, P.finishes[k].map(f => `${f.name} | ${f.price}`).join('\n'), 3)).join('')}
            <h4>Scope of work (one item per line)</h4>${kinds.map(k => area('scope-' + k, SERVICES[k].name, B.scopes[k].join('\n'))).join('')}
            <h4>"Please note" text (empty means none)</h4>${kinds.map(k => area('note-' + k, SERVICES[k].name, B.notes[k] || '', 3)).join('')}
            <div class="modal-actions"><button type="submit" class="modal-save-btn">Save settings</button><button type="button" class="modal-cancel-btn" data-act="bank">Bank details</button><button type="button" class="modal-cancel-btn" data-act="close">Close</button></div></form></div>`;
        document.body.appendChild(ov);
        const form = ov.querySelector('form'), $ = id => form.querySelector('#st-' + id);
        ov.querySelector('[data-act="close"]').onclick = () => ov.remove();
        ov.querySelector('[data-act="bank"]').onclick = () => this.editBankDetails();
        const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'item';
        const parse = (id, label) => $(id).value.split('\n').map(s => s.trim()).filter(Boolean).map(line => {
            const m = line.match(/^(.+?)\s*\|\s*(\d+(?:[.,]\d+)?)$/);
            if (!m) throw new Error(`Could not read "${line}" in ${label}. Use: Name | price`);
            return [m[1].trim(), parseFloat(m[2].replace(',', '.'))];
        });
        form.onsubmit = async e => {
            e.preventDefault();
            try {
                const n = id => { const x = parseFloat($(id).value); if (!(x >= 0)) throw new Error('Please check the numbers under Rates and rules'); return x; };
                const used = new Set();
                const withIds = (rows, old, key) => rows.map(([name, val]) => {
                    let id = (old.find(o => o.name === name) || {}).id || slug(name);
                    while (used.has(id)) id += '_';
                    used.add(id);
                    return { id, name, [key]: val };
                });
                const materials = withIds(parse('materials', 'Materials'), P.materials, 'rate');
                if (!materials.length) throw new Error('Add at least one material');
                used.clear();
                const cfg = {
                    installPerSide: n('installPerSide'), foodPerDay: n('foodPerDay'), sidesPerDay: Math.max(1, n('sidesPerDay')), doorsPerSqm: Math.max(0.1, n('doorsPerSqm')),
                    depositPct: Math.min(100, n('depositPct')), validityDays: Math.max(1, Math.round(n('validityDays'))), followUpDays: Math.max(1, Math.round(n('followUpDays'))),
                    rates: { tinting: n('tinting'), frosting: n('frosting'), wallpaper: n('wallpaper') },
                    materials, appliances: withIds(parse('appliances', 'Appliances'), P.appliances, 'price'),
                    countertopFinishes: (used.clear(), withIds(parse('ctfinishes', 'Countertop finishes'), P.countertopFinishes, 'price')), countertopInstall: n('countertopInstall'),
                    finishes: Object.fromEntries(['tinting', 'frosting', 'wallpaper'].map(k => (used.clear(), [k, withIds(parse('fin-' + k, 'Extra finishes'), P.finishes[k], 'price')]))), scopes: {}, notes: {}
                };
                kinds.forEach(k => { cfg.scopes[k] = $('scope-' + k).value.split('\n').map(s => s.trim()).filter(Boolean); cfg.notes[k] = $('note-' + k).value.trim(); });
                const { error } = await supabase.from('business_settings').upsert({ owner_id: this.currentUser.id, config: cfg, updated_at: new Date().toISOString() });
                if (error) throw error;
                this.applyConfig(cfg);
                ov.remove();
                this.showSuccess('Settings saved');
            } catch (err) { this.showError(err.message); }
        };
    }

    followUpState(q) {
        if (q.status !== 'pending') return { due: false, expired: false, age: 0, text: '' };
        const day = 864e5, now = Date.now(), made = new Date(q.created_at).getTime(), last = q.last_followed_up_at ? new Date(q.last_followed_up_at).getTime() : made;
        const expired = now - made >= BUSINESS.validityDays * day, due = now - last >= BUSINESS.followUpDays * day;
        return { due, expired, age: Math.floor((now - made) / day), text: expired ? 'Expired' : (due ? 'Follow up due' : '') };
    }

    updateFollowUpCount() {
        const n = (this.savedQuotes || []).filter(q => { const s = this.followUpState(q); return s.due || s.expired; }).length;
        document.querySelectorAll('.fu-btn').forEach(b => { b.textContent = '📞 Follow-ups' + (n ? ` (${n})` : ''); });
    }

    waNumber(p) {
        const d = String(p || '').replace(/\D/g, '');
        if (!d) return '';
        return d.startsWith('0') ? '27' + d.slice(1) : d;
    }

    openFollowUps() {
        const old = document.getElementById('fu-modal'); if (old) old.remove();
        const qs = (this.savedQuotes || []).filter(q => { const s = this.followUpState(q); return s.due || s.expired; })
            .sort((a, b) => new Date(a.last_followed_up_at || a.created_at) - new Date(b.last_followed_up_at || b.created_at));
        const rows = qs.map(q => {
            const c = this.customers.find(x => x.id === q.customer_id) || {}, s = this.followUpState(q), ph = String(c.phone || '').trim(), wa = this.waNumber(ph);
            const contact = ph ? `<a class="svc-chip" href="tel:${esc(ph.replace(/[^\d+]/g, ''))}">📞 Call</a>` + (wa ? `<a class="svc-chip" target="_blank" rel="noopener" href="https://wa.me/${wa}">💬 WhatsApp</a>` : '') : '<span class="inst-chip">No phone saved</span>';
            return `<div class="board-card"><div class="board-title" data-act="open" data-id="${q.id}">${esc(q.quote_name)}${s.expired ? ' <span class="stage-chip" style="background:#f8d7da;color:#842029">Expired</span>' : ''}</div>
                <div class="board-meta">${c.name ? esc(c.name) + ' · ' : ''}${fmtR(q.total_cost)} · quoted ${s.age} day(s) ago</div>
                <div class="board-meta">${q.last_followed_up_at ? 'Last followed up ' + new Date(q.last_followed_up_at).toLocaleDateString('en-ZA') + (q.follow_up_note ? ': ' + esc(q.follow_up_note) : '') : 'Not followed up yet'}</div>
                <div class="job-badges">${contact}</div>
                <div class="modal-actions"><button class="modal-save-btn" data-act="done" data-id="${q.id}">Followed up</button><button class="modal-save-btn" data-act="accept" data-id="${q.id}">Accepted</button><button class="modal-cancel-btn" data-act="reject" data-id="${q.id}">Rejected</button></div></div>`;
        }).join('') || '<p class="dialog-message">Nothing to follow up right now.</p>';
        const ov = document.createElement('div');
        ov.className = 'modal-overlay'; ov.id = 'fu-modal';
        ov.innerHTML = `<div class="modal-content dash-wide"><div class="modal-header"><h2 class="modal-title">Follow-ups (${qs.length})</h2></div><p class="dialog-message">Pending quotes older than ${BUSINESS.followUpDays} day(s) since they were made or last chased. Quotes older than ${BUSINESS.validityDays} days are marked Expired.</p>${rows}<div class="modal-actions"><button class="modal-cancel-btn" data-act="close">Close</button></div></div>`;
        document.body.appendChild(ov);
        ov.onclick = async e => {
            const b = e.target.closest('[data-act]'); if (!b) return;
            const act = b.dataset.act, id = b.dataset.id;
            if (act === 'close') { ov.remove(); return; }
            if (act === 'open') { ov.remove(); this.viewQuoteDetails(id); return; }
            if (act === 'done') {
                const r = await this.ask({ title: 'Followed up', fields: [{ name: 'note', label: 'Note (optional)', multiline: true }], okText: 'Save' });
                if (!r) return;
                const { error } = await supabase.from('saved_quotes').update({ last_followed_up_at: new Date().toISOString(), follow_up_note: r.note || null }).eq('id', id);
                if (error) { this.showError('Could not save: ' + error.message); return; }
                await this.loadSavedQuotes();
                this.openFollowUps();
                return;
            }
            ov.remove();
            await this.changeQuoteStatus(id, act === 'accept' ? 'accepted' : 'rejected');
        };
    }

    addToList(list, name, key, val) {
        let id = slugId(name);
        while (list.some(x => x.id === id)) id += '_';
        list.push({ id, name, [key]: val });
    }

    currentConfig() {
        return { installPerSide: PRICING.installPerSide, foodPerDay: PRICING.foodPerDay, sidesPerDay: PRICING.sidesPerDay, doorsPerSqm: PRICING.doorsPerSqm, depositPct: PRICING.depositPct,
            validityDays: BUSINESS.validityDays, followUpDays: BUSINESS.followUpDays, rates: { tinting: SERVICES.tinting.rate, frosting: SERVICES.frosting.rate, wallpaper: SERVICES.wallpaper.rate },
            materials: PRICING.materials, appliances: PRICING.appliances, countertopFinishes: PRICING.countertopFinishes, countertopInstall: PRICING.countertopInstall, finishes: PRICING.finishes,
            scopes: BUSINESS.scopes, notes: BUSINESS.notes };
    }

    async persistConfig() {
        const { error } = await supabase.from('business_settings').upsert({ owner_id: this.currentUser.id, config: this.currentConfig(), updated_at: new Date().toISOString() });
        if (error) this.showError('Could not save to your list: ' + error.message); else this.showSuccess('Saved to your list');
    }

    setCustomMaterial(c) {
        this.customMaterial = c;
        const r = document.querySelector('input[name="material"][value="__custom"]'), l = document.getElementById('custom-material-label');
        if (r) r.dataset.rate = c.rate;
        if (l) l.textContent = `Custom: ${c.name} - R${c.rate} per m²`;
    }

    async askCustomMaterial() {
        const cur = this.customMaterial || {};
        const r = await this.ask({ title: 'Custom finish', message: 'The finish name is shown to the customer on the quote.', fields: [
            { name: 'name', label: 'Finish name', value: cur.name || '', required: true },
            { name: 'rate', label: 'Material price per m² (R)', type: 'number', step: '0.01', min: 0, value: cur.rate != null ? String(cur.rate) : '', required: true },
            { name: 'save', type: 'checks', label: '', options: ['Save to my list for next time'] }], okText: 'Use this finish' });
        if (!r) { if (!this.customMaterial) { const x = document.querySelector('input[name="material"]:checked'); if (x && x.value === '__custom') { x.checked = false; this.handleMaterialSelection(); } } return; }
        const c = { name: r.name, rate: parseFloat(r.rate) || 0 };
        this.setCustomMaterial(c);
        if (r.save.length) { this.addToList(PRICING.materials, c.name, 'rate', c.rate); this.renderMaterials(); this.setCustomMaterial(c); await this.persistConfig(); }
        this.handleMaterialSelection();
        this.recalcIfShown();
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
                if (f.type === 'checks') return `<div class="dialog-label">${esc(f.label)} ${f.options.length > 1 ? `<a href="#" data-all="${i}">Select all</a><a href="#" data-none="${i}">Select none</a>` : ''}</div><div class="dlg-checks" id="dlg-${i}">${f.options.map((o, k) => `<label class="dlg-check"><input type="checkbox" value="${k}"${(f.checked || []).includes(o) ? ' checked' : ''}> ${esc(o)}</label>`).join('')}</div>`;
                const input = f.type === 'select' ? `<select id="dlg-${i}">${f.options.map(o => `<option value="${esc(o[0])}">${esc(o[1])}</option>`).join('')}</select>` : f.multiline
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
            ov.querySelectorAll('[data-all],[data-none]').forEach(a => a.onclick = e => {
                e.preventDefault();
                const all = a.dataset.all !== undefined, i = all ? a.dataset.all : a.dataset.none;
                form.querySelectorAll('#dlg-' + i + ' input').forEach(c => { c.checked = all; });
            });
            form.onsubmit = e => {
                e.preventDefault();
                const out = {};
                for (const [i, f] of fields.entries()) {
                    if (f.type === 'checks') { out[f.name] = [...form.querySelectorAll('#dlg-' + i + ' input:checked')].map(c => f.options[c.value]); continue; }
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
        this.serviceLines = [];
        this.renderServiceLines();
        this.depositTouched = false;
        document.getElementById('deposit-required').checked = true;
        document.getElementById('food-input').value = '';
        document.getElementById('days-input').value = '';
        document.getElementById('cabinet-colour').value = '';
        this.editingId = null;
        this.syncEditUI(null);
        try { localStorage.removeItem(this.draftKey()); } catch (e) { /* ignore */ }
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
        const { data: sl } = await supabase.from('quote_lines').select('service_type, colour').eq('quote_id', quote.id);
        const kinds = [...new Set((sl || []).map(x => x.service_type))];
        const opts = [...new Set((kinds.length ? kinds : ['kitchen']).flatMap(t => BUSINESS.scopes[t] || []))];
        const r = await this.ask({ title: 'Quote details', fields: [
            { name: 'name', label: 'Customer name', value: l.name || (quote.bill_to || {}).name || '', required: true },
            { name: 'address', label: 'Address (one line per row)', value: l.address || (quote.bill_to || {}).address || '', multiline: true },
            { name: 'phone', label: 'Phone (optional)', value: l.phone || (quote.bill_to || {}).phone || '', type: 'tel' },
            { name: 'email', label: 'Email (optional)', value: l.email || (quote.bill_to || {}).email || '', type: 'email' },
            { name: 'colour', label: 'Colour / finish chosen', value: (quote.bill_to || {}).colour || (sl || []).map(x => x.colour).find(Boolean) || '', required: true },
            { name: 'scope', type: 'checks', label: 'Scope of work (tick what is included)', options: opts, checked: (quote.scope_selected || {}).items || [] },
            { name: 'extra', label: 'Extra scope (one item per line)', multiline: true, value: (quote.scope_selected || {}).extra || '' }], okText: 'Export PDF' });
        if (!r) return;
        quote.scope_selected = { items: r.scope, extra: r.extra };
        supabase.from('saved_quotes').update({ scope_selected: quote.scope_selected }).eq('id', quote.id).then(() => {}, () => {});
        quote.bill_to = { name: r.name, address: r.address, phone: r.phone, email: r.email, colour: r.colour };
        supabase.from('saved_quotes').update({ bill_to: quote.bill_to }).eq('id', quote.id).then(() => {}, () => {});
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
            const docNo = inv ? (quote.invoice_number || ref.replace('KWM', 'INV')) : (quote.quote_no || ref);
            let items = [];
            if (extra !== 0) {
                const { data } = await supabase.from('custom_line_items').select('description, amount').eq('quote_id', quote.id);
                items = data && data.length ? data : [{ description: 'Additional charges', amount: extra }];
            }
            const logo = await this.loadLogo(), today = new Date(), day = d => d.toLocaleDateString('en-ZA');
            const finish = c.colour || '';
            const scope = [...(c.scope || []), ...String(c.extra || '').split('\n').map(s => s.trim()).filter(Boolean)];
            let y = this.pdfHead(doc, logo, inv ? 'INVOICE' : 'QUOTATION', [`${inv ? 'Invoice' : 'Quote'} no: ${docNo}`, `Date: ${day(today)}`, inv ? `Quote ref: ${quote.quote_no || ref}` : `Valid until: ${day(new Date(today.getTime() + BUSINESS.validityDays * 864e5))}`]);
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
            doc.text('Qty', 19, y + 5.5); doc.text('Description', 40, y + 5.5); doc.text('Unit price', 158, y + 5.5, { align: 'right' }); doc.text('Total', 191, y + 5.5, { align: 'right' });
            doc.setFillColor(...ORANGE); doc.rect(15, y + 8, 180, 0.8, 'F'); y += 15;
            const { data: qd } = await supabase.from('quote_lines').select('*').eq('quote_id', quote.id).order('position');
            const qLines = qd || [], rest = total - extra - qLines.reduce((s, l) => s + num(l.line_total), 0);
            const types = qLines.length ? [...new Set(qLines.map(l => l.service_type))] : ['kitchen'];
            const perUnit = l => l.service_type === 'appliance';
            let rows = qLines.length ? qLines.map(l => ({ t: l.description, d: [(l.details && l.details.custom && ['kitchen', 'wardrobe'].includes(l.service_type)) ? l.details.finish_name : '', l.colour || c.colour || ''].filter(Boolean).join(' - '), q: perUnit(l) ? String(num(l.qty)) : '1', n: perUnit(l) ? (num(l.qty) || 1) : 1, a: num(l.line_total) })) : [{ t: 'Kitchen cabinet wrapping', d: finish, q: '1', n: 1, a: total - extra }];
            if (qLines.length && rest > 0.005) {
                // transport / call-out is never shown: it is loaded into the line prices
                const k = qLines.findIndex(l => ['kitchen', 'wardrobe'].includes(l.service_type));
                if (k >= 0) rows[k].a += rest;
                else { const base = rows.reduce((s, r) => s + r.a, 0) || 1; let left = rest; rows.forEach((r, i) => { const add = i === rows.length - 1 ? left : Math.round(rest * r.a / base * 100) / 100; r.a += add; left -= add; }); }
            }
            rows = rows.concat(items.map(i => ({ t: i.description, q: '1', n: 1, a: num(i.amount) })));
            rows.forEach((r, idx) => {
                const lines = doc.splitTextToSize(String(r.t), 92), rh = (lines.length + (r.d ? 1 : 0)) * 5 + 5;
                need(rh + 2);
                if (idx % 2 === 0) { doc.setFillColor(...SOFT); doc.rect(15, y - 5, 180, rh, 'F'); }
                doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...DARK);
                doc.text(r.q, 19, y); doc.text(lines, 40, y);
                if (r.d) { doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...GREY); doc.text(r.d, 40, y + lines.length * 5); }
                doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(...DARK);
                doc.text(fmtR(r.a / r.n), 158, y, { align: 'right' }); doc.text(fmtR(r.a), 191, y, { align: 'right' });
                y += rh + 2;
            });
            y += 4;

            // totals
            need(42);
            const line = (l, v, yy) => { doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(...DARK); doc.text(l, 125, yy); doc.text(v, 191, yy, { align: 'right' }); };
            const depOn = quote.deposit_required !== false, depAmt = total * PRICING.depositPct / 100, depOutstanding = inv && depOn && paid < depAmt - 0.005;
            line('Subtotal', fmtR(total), y);
            let ly = y + 6;
            if (depOn) { line(`Deposit required (${PRICING.depositPct}%)`, fmtR(depAmt), ly); ly += 6; }
            if (inv) { line('Amount paid', fmtR(paid), ly); ly += 6; }
            y = ly - 1;
            doc.setFillColor(...DARK); doc.rect(120, y, 75, 11, 'F'); doc.setFillColor(...ORANGE); doc.rect(120, y, 2.5, 11, 'F');
            doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(255, 255, 255); doc.text(inv ? 'BALANCE DUE' : 'TOTAL', 127, y + 7.2);
            doc.setFontSize(12); doc.text(fmtR(inv ? Math.max(0, total - paid) : total), 191, y + 7.4, { align: 'right' });
            if (depOutstanding) {
                doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...ORANGE);
                doc.text('Deposit due now', 125, y + 17); doc.text(fmtR(depAmt - paid), 191, y + 17, { align: 'right' });
                y += 8;
            }
            y += 20;

            if (inv) {
                const st = quote.payment_status === 'paid' ? ['PAID IN FULL', [40, 167, 69]] : quote.payment_status === 'partial' ? ['PARTIALLY PAID', [230, 150, 0]] : ['UNPAID', [200, 50, 60]];
                need(12); doc.setFillColor(...st[1]); doc.roundedRect(15, y - 3, 44, 8, 1.5, 1.5, 'F');
                doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(255, 255, 255); doc.text(st[0], 37, y + 2.3, { align: 'center' }); y += 12;
            } else {
                if (scope.length) { need(30); head('SCOPE OF WORK'); }
                scope.forEach(s => {
                    need(6); doc.setDrawColor(...ORANGE); doc.setLineWidth(0.6); doc.line(16, y - 1, 17.2, y + 0.3); doc.line(17.2, y + 0.3, 19.6, y - 2.6);
                    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...DARK); const ls = doc.splitTextToSize(s, 168); doc.text(ls, 23, y); y += 5.2 * ls.length;
                });
                y += 3;
                const sents = [...new Set(types.flatMap(t => (BUSINESS.notes[t] || '').match(/[^.]+\./g) || []).map(s => s.trim()))];
                const ex = sents.length ? doc.splitTextToSize('Please note: ' + sents.join(' '), 168) : [], bh = ex.length * 4.4 + 6;
                if (ex.length) { need(bh + 8); doc.setFillColor(255, 243, 232); doc.rect(15, y, 180, bh, 'F'); doc.setFillColor(...ORANGE); doc.rect(15, y, 1.4, bh, 'F');
                doc.setFont('helvetica', 'normal'); doc.setFontSize(8.8); doc.setTextColor(...DARK); doc.text(ex, 21, y + 5); y += bh + 8; }
            }

            // payment details
            need(52); head('PAYMENT DETAILS');
            const top = y;
            BUSINESS.bank.concat([['Reference', docNo]]).forEach(([l, v], i) => {
                doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...GREY); doc.text(l, 15, y + i * 5.2);
                doc.setFont('helvetica', 'bold'); doc.setTextColor(...DARK); doc.text(v, 50, y + i * 5.2);
            });
            const terms = inv ? (depOutstanding
                ? [`A deposit of ${PRICING.depositPct}% (${fmtR(depAmt - paid)}) is payable upfront for material procurement before work commences.`, 'The balance is due on completion of the work.', 'Please use the invoice number as your payment reference.']
                : (depOn ? ['Balance is due on completion of the work.', 'Please use the invoice number as your payment reference.'] : ['Payment is due on completion of the work.', 'Please use the invoice number as your payment reference.']))
                : quote.deposit_required === false ? ['Payment is due on completion of the work.', `Quote valid for ${BUSINESS.validityDays} days from the date of issue.`] : [`At least ${PRICING.depositPct}% (${fmtR(total * PRICING.depositPct / 100)}) is payable upfront for material procurement before work commences.`, `Quote valid for ${BUSINESS.validityDays} days from the date of issue.`, 'Balance is due on completion of the work.'];
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