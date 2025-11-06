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
        this.filteredQuotes = [];
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

        // Search and filtering
        document.getElementById('quote-search').addEventListener('input', () => this.filterQuotes());
        document.getElementById('material-filter').addEventListener('change', () => this.filterQuotes());
        document.getElementById('date-filter').addEventListener('change', () => this.filterQuotes());
        document.getElementById('clear-filters-btn').addEventListener('click', () => this.clearFilters());

        // Export functionality
        document.getElementById('export-all-btn').addEventListener('click', () => this.exportToPDF('all'));
        document.getElementById('export-filtered-btn').addEventListener('click', () => this.exportToPDF('filtered'));

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
            this.filteredQuotes = [...this.savedQuotes];
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
                    <button class="export-individual-btn" onclick="app.exportSingleQuote('${quote.id}')">Export PDF</button>
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

    // Search and Filter Methods
    filterQuotes() {
        const searchTerm = document.getElementById('quote-search').value.toLowerCase();
        const materialFilter = document.getElementById('material-filter').value;
        const dateFilter = document.getElementById('date-filter').value;

        this.filteredQuotes = this.savedQuotes.filter(quote => {
            // Search filter
            const matchesSearch = !searchTerm ||
                quote.quote_name.toLowerCase().includes(searchTerm) ||
                quote.material_name.toLowerCase().includes(searchTerm);

            // Material filter
            const matchesMaterial = !materialFilter || quote.material_name === materialFilter;

            // Date filter
            const matchesDate = this.matchesDateFilter(quote.created_at, dateFilter);

            return matchesSearch && matchesMaterial && matchesDate;
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
        document.getElementById('date-filter').value = '';
        this.filteredQuotes = [...this.savedQuotes];
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
            ['Duration:', `${quote.project_days} day(s)`],
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