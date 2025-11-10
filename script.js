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

// User authentication and quote calculator functionalityJus
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
        await this.loadSavedQuotes();
    }

    switchToDoorsMode() {
        this.calculatorMode = 'doors';
        document.getElementById('doors-mode-btn').classList.add('active');
        document.getElementById('sqm-mode-btn').classList.remove('active');
        document.getElementById('doors-input-step').classList.remove('hidden');
        document.getElementById('sqm-input-step').classList.add('hidden');
        this.resetQuote();
    }

    switchToSqmMode() {
        this.calculatorMode = 'sqm';
        document.getElementById('sqm-mode-btn').classList.add('active');
        document.getElementById('doors-mode-btn').classList.remove('active');
        document.getElementById('sqm-input-step').classList.remove('hidden');
        document.getElementById('doors-input-step').classList.add('hidden');
        this.resetQuote();
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

    handleSqmInput() {
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
                        <p><strong>${customer.name}</strong></p>
                        ${customer.phone ? `<p>📞 ${customer.phone}</p>` : ''}
                        ${customer.email ? `<p>📧 ${customer.email}</p>` : ''}
                        ${customer.address ? `<p>📍 ${customer.address}</p>` : ''}
                    </div>
                `;
                customerInfo.classList.remove('hidden');
            }
        } else {
            customerInfo.classList.add('hidden');
        }
    }

    addCustomLineItem() {
        const description = prompt('Enter item description:');
        if (!description || description.trim() === '') return;

        const amount = parseFloat(prompt('Enter amount (R):'));
        if (isNaN(amount) || amount <= 0) {
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
                <span class="item-description">${item.description}</span>
                <span class="item-amount">R${item.amount.toFixed(2)}</span>
                <button class="remove-item-btn" onclick="app.removeCustomLineItem(${index})">×</button>
            </div>
        `).join('');
    }

    removeCustomLineItem(index) {
        this.customLineItems.splice(index, 1);
        this.renderCustomLineItems();
        this.updateCustomItemsTotal();
    }

    updateCustomItemsTotal() {
        const total = this.customLineItems.reduce((sum, item) => sum + item.amount, 0);
        
        if (total > 0 && this.currentQuote) {
            this.currentQuote.customItemsTotal = total;
            this.currentQuote.totalCost = 
                this.currentQuote.materialCost + 
                this.currentQuote.installationFee + 
                this.currentQuote.foodCost + 
                this.currentQuote.transportCost + 
                total;
            
            document.getElementById('custom-items-result').style.display = 'block';
            document.getElementById('result-custom-items').textContent = total.toFixed(2);
            document.getElementById('result-total').textContent = this.currentQuote.totalCost.toFixed(2);
        }
    }

    hideCalculateButton() {
        document.getElementById('calculate-btn').style.display = 'none';
        document.getElementById('quote-result').style.display = 'none';
        document.getElementById('transport-step').style.display = 'none';
    }

    calculateQuote() {
        const selectedMaterial = document.querySelector('input[name="material"]:checked');
        const transportCost = parseFloat(document.getElementById('transport-input').value) || 0;

        if (!selectedMaterial) {
            alert('Please select a material type');
            return;
        }

        let doors, squareMetres;

        if (this.calculatorMode === 'doors') {
            doors = parseInt(document.getElementById('doors-input').value);
            if (!doors || doors <= 0) {
                alert('Please enter a valid number of doors');
                return;
            }
            // Calculate square metres (2 doors = 1 square metre)
            squareMetres = doors / 2;
        } else {
            // Square metres mode
            squareMetres = parseFloat(document.getElementById('sqm-input').value);
            if (!squareMetres || squareMetres <= 0) {
                alert('Please enter a valid square metres value');
                return;
            }
            // Calculate doors from square metres and round up
            doors = Math.ceil(squareMetres * 2);
        }

        // Calculate project duration (30 sides = 1 day)
        const projectDays = Math.ceil(doors / 30);

        // Get material rate
        const materialRate = parseInt(selectedMaterial.dataset.rate);
        const materialName = this.getMaterialName(selectedMaterial.value);

        // Calculate costs
        const materialCost = squareMetres * materialRate;
        const installationFee = doors * 95; // R95 per side
        const foodCost = projectDays * 300; // R300 per day for food
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
        
        if (quote.customItemsTotal > 0) {
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
            `Quote ${new Date().toLocaleDateString()}`;
        const customerId = document.getElementById('customer-select').value || null;
        const status = document.getElementById('quote-status-select').value;
        const scheduledDate = document.getElementById('scheduled-date-input').value || null;

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
                this.showError('Failed to save quote: ' + quoteError.message);
                return;
            }

            const quoteId = quoteData[0].id;

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
                    console.error('Failed to save custom line items:', itemsError);
                }
            }

            // Upload photos if any
            if (this.uploadedPhotos.length > 0) {
                const photoRecords = await this.uploadPhotosToStorage(quoteId);
                
                if (photoRecords.length > 0) {
                    const photosToInsert = photoRecords.map(photo => ({
                        quote_id: quoteId,
                        ...photo
                    }));

                    const { error: photosError } = await supabase
                        .from('quote_photos')
                        .insert(photosToInsert);

                    if (photosError) {
                        console.error('Failed to save photo records:', photosError);
                    }
                }
            }

            this.showSuccess('Quote saved successfully!');
            document.getElementById('quote-name-input').value = '';
            document.getElementById('quote-status-select').value = 'pending';
            document.getElementById('scheduled-date-input').value = '';
            
            // Clear photos
            this.uploadedPhotos.forEach(photo => URL.revokeObjectURL(photo.preview));
            this.uploadedPhotos = [];
            this.renderPhotoPreview();
        } catch (error) {
            this.showError('Failed to save quote. Please try again.');
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
        select.innerHTML = '<option value="">-- New Customer --</option>';
        
        this.customers.forEach(customer => {
            const option = document.createElement('option');
            option.value = customer.id;
            option.textContent = customer.name;
            select.appendChild(option);
        });
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
                    <div class="customer-name">${customer.name}</div>
                    <div class="customer-actions">
                        <button class="edit-customer-btn" onclick="app.editCustomer('${customer.id}')">Edit</button>
                        <button class="delete-customer-btn" onclick="app.deleteCustomer('${customer.id}')">Delete</button>
                    </div>
                </div>
                <div class="customer-details">
                    ${customer.phone ? `<p>📞 ${customer.phone}</p>` : ''}
                    ${customer.email ? `<p>📧 ${customer.email}</p>` : ''}
                    ${customer.address ? `<p>📍 ${customer.address}</p>` : ''}
                    ${customer.notes ? `<p>📝 ${customer.notes}</p>` : ''}
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
        if (!confirm('Are you sure you want to delete this customer? This will not delete their quotes.')) return;

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
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        for (const file of files) {
            if (file.size > 5 * 1024 * 1024) {
                this.showError(`${file.name} is too large. Max size is 5MB.`);
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
                <img src="${photo.preview}" alt="${photo.name}">
                <div class="photo-info">
                    <span class="photo-name">${photo.name}</span>
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
            const fileName = `${quoteId}/${Date.now()}_${photo.name}`;
            
            try {
                const { data, error } = await supabase.storage
                    .from('quote-photos')
                    .upload(fileName, photo.file);

                if (error) {
                    console.error('Photo upload error:', error);
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
                                        <span class="calendar-quote-name">${quote.quote_name}</span>
                                        <span class="status-badge status-${quote.status}">${this.getStatusLabel(quote.status)}</span>
                                    </div>
                                    <div class="calendar-quote-details">
                                        <span>${quote.doors} doors</span>
                                        <span>R${parseFloat(quote.total_cost).toFixed(2)}</span>
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

    viewQuoteFromCalendar(quoteId) {
        // Navigate to saved quotes and highlight the quote
        this.showSavedQuotes();
        setTimeout(() => {
            const quoteElement = document.querySelector(`[data-quote-id="${quoteId}"]`);
            if (quoteElement) {
                quoteElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                quoteElement.style.animation = 'highlight 2s';
            }
        }, 300);
    }

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
        document.getElementById('total-revenue').textContent = `R${totalRevenue.toFixed(2)}`;
        document.getElementById('avg-project-value').textContent = `R${avgProjectValue.toFixed(2)}`;
        
        if (this.filteredHistory.length === 0) {
            container.innerHTML = '';
            noHistoryMessage.classList.remove('hidden');
            return;
        }
        
        noHistoryMessage.classList.add('hidden');
        
        container.innerHTML = this.filteredHistory.map(quote => `
            <div class="history-item">
                <div class="history-header">
                    <div class="history-title">${quote.quote_name}</div>
                    <div class="history-date">Completed: ${new Date(quote.updated_at || quote.created_at).toLocaleDateString()}</div>
                </div>
                
                <div class="history-details">
                    <div class="history-detail">
                        <span>📅 Scheduled:</span>
                        <span>${quote.scheduled_date ? new Date(quote.scheduled_date).toLocaleDateString() : 'Not scheduled'}</span>
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
                        <span>${quote.material_name}</span>
                    </div>
                    <div class="history-detail">
                        <span>💰 Total:</span>
                        <span class="history-total">R${parseFloat(quote.total_cost).toFixed(2)}</span>
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

    viewHistoryDetails(quoteId) {
        // Navigate to saved quotes and highlight the quote
        this.showSavedQuotes();
        setTimeout(() => {
            const quoteElement = document.querySelector(`[data-quote-id="${quoteId}"]`);
            if (quoteElement) {
                quoteElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                quoteElement.style.animation = 'highlight 2s';
            }
        }, 300);
    }

    clearHistoryFilters() {
        document.getElementById('history-search').value = '';
        document.getElementById('history-date-filter').value = '';
        this.renderHistory();
    }

    async deleteCompletedProject(quoteId) {
        const quote = this.savedQuotes.find(q => q.id === quoteId);
        if (!quote) return;

        if (!confirm(`Are you sure you want to permanently delete "${quote.quote_name}"?\n\nThis will delete:\n- The quote\n- All photos\n- All custom line items\n- Invoice records\n\nThis action cannot be undone.`)) {
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
            if (!confirm('This quote is not accepted yet. Generate invoice anyway?')) {
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
        const remainingAmount = (quote.total_cost - (quote.deposit_paid || 0)).toFixed(2);

        const modalHTML = `
            <div class="modal-overlay" id="invoice-modal">
                <div class="modal-content invoice-modal-content">
                    <div class="modal-header">
                        <h2 class="modal-title">Invoice: ${invoiceNumber}</h2>
                        <button class="close-modal-btn" onclick="app.closeInvoiceModal()">&times;</button>
                    </div>
                    <div class="invoice-details">
                        <h3>${quote.quote_name}</h3>
                        <p><strong>Total Amount:</strong> R${parseFloat(quote.total_cost).toFixed(2)}</p>
                        <p><strong>50% Deposit:</strong> R${depositAmount}</p>
                        <p><strong>Deposit Paid:</strong> R${(quote.deposit_paid || 0).toFixed(2)}</p>
                        <p><strong>Final Payment Paid:</strong> R${(quote.final_payment_paid || 0).toFixed(2)}</p>
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
            updateData.deposit_paid = (quote.deposit_paid || 0) + amount;
        } else {
            updateData.final_payment_paid = (quote.final_payment_paid || 0) + amount;
        }

        // Update payment status
        const totalPaid = (quote.deposit_paid || 0) + (quote.final_payment_paid || 0) + amount;
        if (totalPaid >= quote.total_cost) {
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

    exportInvoicePDF(quoteId) {
        // This will use the existing PDF export but formatted as an invoice
        this.exportSingleQuote(quoteId, true); // Pass true for invoice mode
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
                        <div class="quote-title">${quote.quote_name}</div>
                        <span class="status-badge status-${quote.status || 'pending'}">${this.getStatusLabel(quote.status || 'pending')}</span>
                    </div>
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
                        <span>1 - ${quote.project_days} day(s)</span>
                    </div>
                    ${quote.scheduled_date ? `
                    <div class="quote-detail scheduled-date-detail">
                        <span>📅 Scheduled:</span>
                        <span>${new Date(quote.scheduled_date).toLocaleDateString()}</span>
                    </div>
                    ` : ''}
                </div>
                
                <div class="quote-total">
                    Total: R${parseFloat(quote.total_cost).toFixed(2)}
                    ${quote.payment_status && quote.payment_status !== 'unpaid' ? `
                        <span class="payment-badge payment-${quote.payment_status}">${quote.payment_status === 'paid' ? 'Paid' : 'Partial'}</span>
                    ` : ''}
                </div>
                
                <div class="quote-actions-saved">
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
            if (!confirm('Mark this project as completed? It will be moved to History.')) {
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

        // Clear scheduled date
        document.getElementById('scheduled-date-input').value = '';
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
                quote.material_name.toLowerCase().includes(searchTerm);

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
        const quotesToExport = type === 'all' ? this.savedQuotes : this.filteredQuotes;

        if (quotesToExport.length === 0) {
            this.showError('No quotes to export');
            return;
        }

        // Get customer information for bulk export
        const customerName = prompt('Enter customer name (for bulk export):');
        if (!customerName || customerName.trim() === '') {
            this.showError('Customer name is required for export');
            return;
        }

        const customerLocation = prompt('Enter customer location/address:');
        if (!customerLocation || customerLocation.trim() === '') {
            this.showError('Customer location is required for export');
            return;
        }

        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            // Add logo
            try {
                const logoImg = new Image();
                logoImg.onload = () => {
                    this.generateBulkQuotePDF(doc, quotesToExport, type, customerName.trim(), customerLocation.trim(), logoImg);
                };
                logoImg.onerror = () => {
                    this.generateBulkQuotePDF(doc, quotesToExport, type, customerName.trim(), customerLocation.trim(), null);
                };
                logoImg.src = 'logo.jpg';
            } catch (error) {
                this.generateBulkQuotePDF(doc, quotesToExport, type, customerName.trim(), customerLocation.trim(), null);
            }

        } catch (error) {
            console.error('PDF export error:', error);
            this.showError('Failed to export PDF. Please try again.');
        }
    }

    generateBulkQuotePDF(doc, quotesToExport, type, customerName, customerLocation, logoImg) {
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 20;
        const contentWidth = pageWidth - (margin * 2);
        let yPosition = margin;

        // Add logo if available
        if (logoImg) {
            try {
                doc.addImage(logoImg, 'JPEG', margin, yPosition, 35, 25);
                yPosition = Math.max(yPosition + 30, yPosition);
            } catch (error) {
                console.log('Could not add logo to PDF');
            }
        }

        // Company header
        doc.setFontSize(22);
        doc.setFont(undefined, 'bold');
        doc.text('KITCHEN WRAP MASTERS', logoImg ? 65 : margin, logoImg ? 35 : yPosition);
        yPosition += logoImg ? 12 : 20;

        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text('Professional Kitchen Vinyl Wrapping Services', logoImg ? 65 : margin, yPosition);
        yPosition += 25;

        // Header line
        doc.setLineWidth(0.5);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 15;

        // Document title and info in header box
        doc.setFillColor(245, 245, 245);
        doc.rect(margin, yPosition, contentWidth, 30, 'F');
        
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('QUOTATION SUMMARY', margin + 10, yPosition + 12);
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Customer: ${customerName}`, margin + 10, yPosition + 22);
        doc.text(`Location: ${customerLocation}`, margin + 10, yPosition + 28);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 80, yPosition + 22);
        doc.text(`Total Quotes: ${quotesToExport.length}`, pageWidth - 80, yPosition + 28);
        yPosition += 45;

        quotesToExport.forEach((quote, index) => {
            // Check if we need a new page (leave space for quote content)
            if (yPosition > pageHeight - 80) {
                doc.addPage();
                yPosition = margin + 20;
                
                // Add company header on new page
                doc.setFontSize(16);
                doc.setFont(undefined, 'bold');
                doc.text('KITCHEN WRAP MASTERS', margin, yPosition);
                doc.setFontSize(10);
                doc.setFont(undefined, 'normal');
                doc.text('Professional Kitchen Vinyl Wrapping Services', margin, yPosition + 8);
                yPosition += 25;
            }

            // Quote header with background
            doc.setFillColor(250, 250, 250);
            doc.rect(margin, yPosition, contentWidth, 15, 'F');
            
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text(`${index + 1}. ${quote.quote_name}`, margin + 5, yPosition + 10);

            doc.setFontSize(9);
            doc.setFont(undefined, 'normal');
            doc.text(`Date: ${new Date(quote.created_at).toLocaleDateString()}`, pageWidth - 60, yPosition + 10);

            yPosition += 20;

            // Quote details in organized table format
            const leftCol = margin + 5;
            const midCol = margin + 90;
            const rightCol = margin + 140;
            
            doc.setFontSize(9);
            doc.setFont(undefined, 'normal');

            // Project info
            doc.text(`Doors: ${quote.doors}`, leftCol, yPosition);
            doc.text(`Sqm: ${quote.square_metres}`, midCol, yPosition);
            doc.text(`Days: ${quote.project_days}`, rightCol, yPosition);
            yPosition += 6;

            // Material info
            doc.text(`Material: ${quote.material_name}`, leftCol, yPosition);
            yPosition += 6;

            // Cost breakdown in columns
            doc.text(`Material: R${parseFloat(quote.material_cost).toFixed(2)}`, leftCol, yPosition);
            doc.text(`Install: R${parseFloat(quote.installation_fee).toFixed(2)}`, midCol, yPosition);
            doc.text(`Food: R${parseFloat(quote.food_cost).toFixed(2)}`, rightCol, yPosition);
            yPosition += 6;

            doc.text(`Transport: R${parseFloat(quote.transport_cost).toFixed(2)}`, leftCol, yPosition);
            yPosition += 10;

            // Total with emphasis
            doc.setFillColor(240, 240, 240);
            doc.rect(margin, yPosition, contentWidth, 12, 'F');
            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.text(`TOTAL: R${parseFloat(quote.total_cost).toFixed(2)}`, leftCol, yPosition + 8);
            yPosition += 20;

            // Separator line
            doc.setLineWidth(0.3);
            doc.line(margin, yPosition, pageWidth - margin, yPosition);
            yPosition += 10;
        });

        // Add footer section
        if (yPosition > pageHeight - 60) {
            doc.addPage();
            yPosition = margin + 20;
        }

        yPosition += 10;
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text('TERMS & CONDITIONS', margin, yPosition);
        yPosition += 8;

        doc.setLineWidth(0.3);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 10;

        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        const terms = [
            '• All quotes valid for 30 days from date of issue',
            '• 50% deposit required to commence work',
            '• Final payment due upon completion',
            '• Materials include manufacturer warranty',
            '• Professional installation guaranteed'
        ];

        terms.forEach(term => {
            doc.text(term, margin + 5, yPosition);
            yPosition += 5;
        });

        // Footer with company branding
        yPosition += 10;
        doc.setFillColor(102, 126, 234);
        doc.rect(margin, yPosition, contentWidth, 20, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text('Thank you for choosing Kitchen Wrap Masters!', margin + 10, yPosition + 12);
        
        // Reset text color
        doc.setTextColor(0, 0, 0);

        // Save the PDF
        const filename = `${customerName.replace(/[^a-z0-9]/gi, '_')}_${type === 'all' ? 'all' : 'filtered'}_quotes.pdf`;
        doc.save(filename);

        this.showSuccess(`PDF exported successfully: ${filename}`);
    }

    async exportSingleQuote(quoteId) {
        const quote = this.savedQuotes.find(q => q.id === quoteId);
        if (!quote) {
            this.showError('Quote not found');
            return;
        }

        // Get customer information
        const customerName = prompt('Enter customer name:');
        if (!customerName || customerName.trim() === '') {
            this.showError('Customer name is required for export');
            return;
        }

        const customerLocation = prompt('Enter customer location/address:');
        if (!customerLocation || customerLocation.trim() === '') {
            this.showError('Customer location is required for export');
            return;
        }

        const colorChosen = prompt('Enter the color/finish chosen by customer:');
        if (!colorChosen || colorChosen.trim() === '') {
            this.showError('Color/finish is required for export');
            return;
        }

        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            // Add logo
            try {
                const logoImg = new Image();
                logoImg.onload = () => {
                    this.generateSingleQuotePDF(doc, quote, customerName.trim(), customerLocation.trim(), colorChosen.trim(), logoImg);
                };
                logoImg.onerror = () => {
                    this.generateSingleQuotePDF(doc, quote, customerName.trim(), customerLocation.trim(), colorChosen.trim(), null);
                };
                logoImg.src = 'logo.jpg';
            } catch (error) {
                this.generateSingleQuotePDF(doc, quote, customerName.trim(), customerLocation.trim(), colorChosen.trim(), null);
            }

        } catch (error) {
            console.error('PDF export error:', error);
            this.showError('Failed to export quote. Please try again.');
        }
    }

    generateSingleQuotePDF(doc, quote, customerName, customerLocation, colorChosen, logoImg) {
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 15;
        const contentWidth = pageWidth - (margin * 2);
        let yPosition = margin;

        // Add logo if available (smaller for compact layout)
        if (logoImg) {
            try {
                doc.addImage(logoImg, 'JPEG', margin, yPosition, 30, 20);
                yPosition = Math.max(yPosition + 25, yPosition);
            } catch (error) {
                console.log('Could not add logo to PDF');
            }
        }

        // Company header (more compact)
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text('KITCHEN WRAP MASTERS', logoImg ? 50 : margin, logoImg ? 25 : yPosition);
        yPosition += logoImg ? 8 : 15;

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text('Professional Kitchen Vinyl Wrapping Services', logoImg ? 50 : margin, yPosition);
        yPosition += 15;

        // Header line
        doc.setLineWidth(0.5);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 10;

        // Quote title and info in compact header
        doc.setFillColor(245, 245, 245);
        doc.rect(margin, yPosition, contentWidth, 20, 'F');
        
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('QUOTATION', margin + 8, yPosition + 8);
        
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.text(`Quote: ${quote.quote_name}`, margin + 8, yPosition + 16);
        doc.text(`Date: ${new Date(quote.created_at).toLocaleDateString()}`, pageWidth - 60, yPosition + 16);
        yPosition += 25;

        // Customer information (more compact)
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text('CUSTOMER DETAILS', margin, yPosition);
        yPosition += 6;

        doc.setLineWidth(0.3);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 8;

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Customer: ${customerName}`, margin + 3, yPosition);
        yPosition += 6;
        doc.text(`Location: ${customerLocation}`, margin + 3, yPosition);
        yPosition += 15;

        // Project details section (simplified)
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text('PROJECT DETAILS', margin, yPosition);
        yPosition += 6;

        doc.setLineWidth(0.3);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 8;

        // Create a compact table layout
        const leftCol = margin + 3;
        const rightCol = margin + 85;
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');

        // Only show essential project details
        const projectDetails = [
            ['Doors/Sides:', quote.doors],
            ['Square Metres:', quote.square_metres],
            ['Duration:', `${quote.project_days} day(s) max`],
            ['Material:', quote.material_name],
            ['Color/Finish:', colorChosen]
        ];

        projectDetails.forEach(([label, value]) => {
            doc.text(label, leftCol, yPosition);
            doc.setFont(undefined, 'bold');
            doc.text(String(value), rightCol, yPosition);
            doc.setFont(undefined, 'normal');
            yPosition += 6;
        });

        // Total cost section with emphasis
        yPosition += 15;
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, yPosition, contentWidth, 18, 'F');
        
        doc.setFontSize(13);
        doc.setFont(undefined, 'bold');
        doc.text('TOTAL COST FOR VINYL WRAPPING SERVICE:', leftCol, yPosition + 8);
        yPosition += 12;
        doc.setFontSize(16);
        doc.text(`R${parseFloat(quote.total_cost).toFixed(2)}`, leftCol, yPosition + 8);
        yPosition += 25;

        // Terms and conditions reference
        yPosition += 10;
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text('Terms & Conditions: ', margin, yPosition);
        
        // Website link in blue
        doc.setTextColor(0, 0, 255);
        doc.text('https://kitchenwrapmasters.co.za/termsandconditions', margin + 45, yPosition);
        
        // Deposit information in red
        yPosition += 8;
        doc.setTextColor(255, 0, 0);
        doc.setFontSize(8);
        doc.text('A 50% deposit may be required to cover material costs. If the deposit has not been paid', margin, yPosition);
        yPosition += 4;
        doc.text('in advance, full or partial payment must be made upon our arrival before work begins.', margin, yPosition);
        
        // Footer section
        yPosition += 15;
        doc.setFillColor(102, 126, 234);
        doc.rect(margin, yPosition, contentWidth, 20, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text('Thank you for choosing Kitchen Wrap Masters!', margin + 10, yPosition + 12);
        
        // Reset text color
        doc.setTextColor(0, 0, 0);

        // Save the PDF
        const filename = `${customerName.replace(/[^a-z0-9]/gi, '_')}_${quote.quote_name.replace(/[^a-z0-9]/gi, '_')}.pdf`;
        doc.save(filename);

        this.showSuccess(`Quote exported successfully: ${filename}`);
    }
}


// Initialize the app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new VinylQuoteApp();
});