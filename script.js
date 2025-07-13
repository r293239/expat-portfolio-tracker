// ===== MARKETS.JS =====
// Global Markets Configuration
const MARKETS = {
    NYSE: {
        name: 'New York Stock Exchange',
        timezone: 'America/New_York',
        country: '🇺🇸',
        hours: [
            { start: '09:30', end: '16:00' }
        ],
        weekdays: [1, 2, 3, 4, 5] // Monday to Friday
    },
    NASDAQ: {
        name: 'NASDAQ',
        timezone: 'America/New_York',
        country: '🇺🇸',
        hours: [
            { start: '09:30', end: '16:00' }
        ],
        weekdays: [1, 2, 3, 4, 5]
    },
    LSE: {
        name: 'London Stock Exchange',
        timezone: 'Europe/London',
        country: '🇬🇧',
        hours: [
            { start: '08:00', end: '16:30' }
        ],
        weekdays: [1, 2, 3, 4, 5]
    },
    HKEX: {
        name: 'Hong Kong Exchange',
        timezone: 'Asia/Hong_Kong',
        country: '🇭🇰',
        hours: [
            { start: '09:30', end: '12:00' },
            { start: '13:00', end: '16:00' }
        ],
        weekdays: [1, 2, 3, 4, 5]
    },
    TSE: {
        name: 'Tokyo Stock Exchange',
        timezone: 'Asia/Tokyo',
        country: '🇯🇵',
        hours: [
            { start: '09:00', end: '11:30' },
            { start: '12:30', end: '15:25' }
        ],
        weekdays: [1, 2, 3, 4, 5]
    },
    SSE: {
        name: 'Shanghai Stock Exchange',
        timezone: 'Asia/Shanghai',
        country: '🇨🇳',
        hours: [
            { start: '09:30', end: '11:30' },
            { start: '13:00', end: '14:57' }
        ],
        weekdays: [1, 2, 3, 4, 5]
    },
    ASX: {
        name: 'Australian Securities Exchange',
        timezone: 'Australia/Sydney',
        country: '🇦🇺',
        hours: [
            { start: '10:00', end: '16:00' }
        ],
        weekdays: [1, 2, 3, 4, 5]
    },
    BSE: {
        name: 'Bombay Stock Exchange',
        timezone: 'Asia/Kolkata',
        country: '🇮🇳',
        hours: [
            { start: '09:15', end: '15:30' }
        ],
        weekdays: [1, 2, 3, 4, 5]
    }
};

class MarketStatus {
    constructor() {
        this.updateInterval = null;
        this.init();
    }

    init() {
        this.updateMarketStatus();
        this.updateInterval = setInterval(() => {
            this.updateMarketStatus();
        }, 30000); // Update every 30 seconds
    }

    isMarketOpen(marketKey) {
        const market = MARKETS[marketKey];
        if (!market) return false;

        try {
            const now = new Date();
            const marketTime = new Date(now.toLocaleString("en-US", {timeZone: market.timezone}));
            const dayOfWeek = marketTime.getDay();
            
            // Check if it's a weekday
            if (!market.weekdays.includes(dayOfWeek)) {
                return false;
            }

            const currentTime = marketTime.getHours() * 60 + marketTime.getMinutes();
            
            // Check if current time falls within any trading session
            for (const session of market.hours) {
                const [startHour, startMin] = session.start.split(':').map(Number);
                const [endHour, endMin] = session.end.split(':').map(Number);
                
                const startTime = startHour * 60 + startMin;
                const endTime = endHour * 60 + endMin;
                
                if (currentTime >= startTime && currentTime <= endTime) {
                    return true;
                }
            }
            
            return false;
        } catch (error) {
            console.error(`Error checking market status for ${marketKey}:`, error);
            return false;
        }
    }

    getMarketTime(marketKey) {
        const market = MARKETS[marketKey];
        if (!market) return 'N/A';

        try {
            const now = new Date();
            const marketTime = new Date(now.toLocaleString("en-US", {timeZone: market.timezone}));
            
            return marketTime.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
        } catch (error) {
            console.error(`Error getting market time for ${marketKey}:`, error);
            return 'N/A';
        }
    }

    getNextSession(marketKey) {
        const market = MARKETS[marketKey];
        if (!market) return null;

        try {
            const now = new Date();
            const marketTime = new Date(now.toLocaleString("en-US", {timeZone: market.timezone}));
            const currentTime = marketTime.getHours() * 60 + marketTime.getMinutes();
            
            // Find next trading session today
            for (const session of market.hours) {
                const [startHour, startMin] = session.start.split(':').map(Number);
                const startTime = startHour * 60 + startMin;
                
                if (currentTime < startTime) {
                    return `Opens at ${session.start}`;
                }
            }
            
            // If no session today, next session is tomorrow
            const firstSession = market.hours[0];
            return `Opens tomorrow at ${firstSession.start}`;
        } catch (error) {
            console.error(`Error getting next session for ${marketKey}:`, error);
            return null;
        }
    }

    updateMarketStatus() {
        const marketsGrid = document.getElementById('marketsGrid');
        if (!marketsGrid) return;

        marketsGrid.innerHTML = '';

        Object.entries(MARKETS).forEach(([key, market]) => {
            const isOpen = this.isMarketOpen(key);
            const marketTime = this.getMarketTime(key);
            const nextSession = this.getNextSession(key);

            const marketCard = document.createElement('div');
            marketCard.className = `market-card ${isOpen ? 'open' : 'closed'}`;
            
            marketCard.innerHTML = `
                <h3>${market.country} ${market.name}</h3>
                <div class="market-status">
                    <div class="status-indicator ${isOpen ? 'open' : 'closed'}"></div>
                    <span>${isOpen ? 'Open' : 'Closed'}</span>
                </div>
                <div class="market-time">
                    Local time: ${marketTime}
                </div>
                ${!isOpen && nextSession ? `<div class="market-time">${nextSession}</div>` : ''}
            `;
            
            marketsGrid.appendChild(marketCard);
        });
    }

    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }
}

// ===== PORTFOLIO.JS =====
// Portfolio Management Module
class PortfolioManager {
    constructor() {
        this.portfolio = [];
        this.baseCurrency = 'USD';
        this.exchangeRates = {
            USD: 1.0,
            EUR: 0.85,
            GBP: 0.73,
            JPY: 110.0,
            SGD: 1.35,
            HKD: 7.8
        };
        this.init();
    }

    init() {
        this.loadPortfolio();
        this.setupEventListeners();
        this.updatePortfolioDisplay();
    }

    setupEventListeners() {
        // Add stock button
        const addStockBtn = document.getElementById('addStockBtn');
        const addStockModal = document.getElementById('addStockModal');
        const closeModal = document.querySelector('.close');
        const addStockForm = document.getElementById('addStockForm');
        const baseCurrencySelect = document.getElementById('baseCurrency');

        if (addStockBtn) {
            addStockBtn.addEventListener('click', () => {
                addStockModal.style.display = 'block';
            });
        }

        if (closeModal) {
            closeModal.addEventListener('click', () => {
                addStockModal.style.display = 'none';
            });
        }

        if (addStockModal) {
            addStockModal.addEventListener('click', (e) => {
                if (e.target === addStockModal) {
                    addStockModal.style.display = 'none';
                }
            });
        }

        if (addStockForm) {
            addStockForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addStock();
            });
        }

        if (baseCurrencySelect) {
            baseCurrencySelect.addEventListener('change', (e) => {
                this.baseCurrency = e.target.value;
                this.updatePortfolioDisplay();
            });
        }
    }

    addStock() {
        const symbol = document.getElementById('stockSymbol').value.toUpperCase();
        const quantity = parseFloat(document.getElementById('stockQuantity').value);
        const price = parseFloat(document.getElementById('stockPrice').value);
        const currency = document.getElementById('stockCurrency').value;

        if (!symbol || !quantity || !price) {
            alert('Please fill in all fields');
            return;
        }

        const stock = {
            id: Date.now(),
            symbol,
            quantity,
            purchasePrice: price,
            currency,
            currentPrice: this.generateRandomPrice(price), // Simulate current price
            dateAdded: new Date().toISOString()
        };

        this.portfolio.push(stock);
        this.savePortfolio();
        this.updatePortfolioDisplay();
        
        // Close modal and reset form
        document.getElementById('addStockModal').style.display = 'none';
        document.getElementById('addStockForm').reset();
    }

    generateRandomPrice(basePrice) {
        // Simulate price movement within ±10% of purchase price
        const variation = (Math.random() - 0.5) * 0.2; // -10% to +10%
        return basePrice * (1 + variation);
    }

    convertCurrency(amount, fromCurrency, toCurrency) {
        if (fromCurrency === toCurrency) return amount;
        
        // Convert to USD first, then to target currency
        const usdAmount = amount / this.exchangeRates[fromCurrency];
        return usdAmount * this.exchangeRates[toCurrency];
    }

    calculateProfitLoss(stock) {
        const currentValue = stock.currentPrice * stock.quantity;
        const purchaseValue = stock.purchasePrice * stock.quantity;
        const profitLoss = currentValue - purchaseValue;
        const profitLossPercentage = (profitLoss / purchaseValue) * 100;
        
        return {
            absolute: profitLoss,
            percentage: profitLossPercentage,
            currentValue,
            purchaseValue
        };
    }

    removeStock(stockId) {
        this.portfolio = this.portfolio.filter(stock => stock.id !== stockId);
        this.savePortfolio();
        this.updatePortfolioDisplay();
    }

    updatePortfolioDisplay() {
        const portfolioGrid = document.getElementById('portfolioGrid');
        if (!portfolioGrid) return;

        // Update current prices (simulate market data)
        this.portfolio.forEach(stock => {
            stock.currentPrice = this.generateRandomPrice(stock.purchasePrice);
        });

        if (this.portfolio.length === 0) {
            portfolioGrid.innerHTML = `
                <div class="empty-state">
                    <h3>No stocks in portfolio</h3>
                    <p>Click "Add Stock" to get started tracking your investments</p>
                </div>
            `;
            return;
        }

        portfolioGrid.innerHTML = '';

        this.portfolio.forEach(stock => {
            const profitLoss = this.calculateProfitLoss(stock);
            
            // Convert values to base currency
            const currentValueInBase = this.convertCurrency(
                profitLoss.currentValue, 
                stock.currency, 
                this.baseCurrency
            );
            const purchaseValueInBase = this.convertCurrency(
                profitLoss.purchaseValue, 
                stock.currency, 
                this.baseCurrency
            );
            const profitLossInBase = currentValueInBase - purchaseValueInBase;
            
            const profitLossClass = profitLossInBase >= 0 ? 'profit-positive' : 'profit-negative';
            const profitLossSign = profitLossInBase >= 0 ? '+' : '';

            const stockCard = document.createElement('div');
            stockCard.className = 'portfolio-item';
            
            stockCard.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h3>${stock.symbol}</h3>
                    <button onclick="portfolioManager.removeStock(${stock.id})" 
                            style="background: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">
                        Remove
                    </button>
                </div>
                <div class="portfolio-details">
                    <span>Quantity:</span>
                    <strong>${stock.quantity}</strong>
                    
                    <span>Purchase Price:</span>
                    <strong>${stock.purchasePrice.toFixed(2)} ${stock.currency}</strong>
                    
                    <span>Current Price:</span>
                    <strong>${stock.currentPrice.toFixed(2)} ${stock.currency}</strong>
                    
                    <span>Current Value:</span>
                    <strong>${currentValueInBase.toFixed(2)} ${this.baseCurrency}</strong>
                    
                    <span>Purchase Value:</span>
                    <strong>${purchaseValueInBase.toFixed(2)} ${this.baseCurrency}</strong>
                    
                    <span>Profit/Loss:</span>
                    <strong class="${profitLossClass}">
                        ${profitLossSign}${profitLossInBase.toFixed(2)} ${this.baseCurrency} 
                        (${profitLossSign}${profitLoss.percentage.toFixed(2)}%)
                    </strong>
                </div>
            `;
            
            portfolioGrid.appendChild(stockCard);
        });
    }

    savePortfolio() {
        // In a real application, this would save to a database
        // For now, we'll use memory storage only
        console.log('Portfolio saved:', this.portfolio);
    }

    loadPortfolio() {
        // In a real application, this would load from a database
        // For now, we'll start with an empty portfolio
        this.portfolio = [];
        console.log('Portfolio loaded:', this.portfolio);
    }

    // Method to add sample data for testing
    addSampleData() {
        const sampleStocks = [
            {
                id: 1,
                symbol: 'AAPL',
                quantity: 10,
                purchasePrice: 150.00,
                currency: 'USD',
                currentPrice: 155.25,
                dateAdded: new Date().toISOString()
            },
            {
                id: 2,
                symbol: 'GOOGL',
                quantity: 5,
                purchasePrice: 2800.00,
                currency: 'USD',
                currentPrice: 2750.50,
                dateAdded: new Date().toISOString()
            },
            {
                id: 3,
                symbol: 'TSLA',
                quantity: 15,
                purchasePrice: 800.00,
                currency: 'USD',
                currentPrice: 850.75,
                dateAdded: new Date().toISOString()
            }
        ];
        
        this.portfolio = sampleStocks;
        this.updatePortfolioDisplay();
    }

    // Method to update exchange rates (in a real app, this would fetch from an API)
    updateExchangeRates() {
        // Simulate rate fluctuations
        const baseRates = {
            USD: 1.0,
            EUR: 0.85,
            GBP: 0.73,
            JPY: 110.0,
            SGD: 1.35,
            HKD: 7.8
        };
        
        Object.keys(baseRates).forEach(currency => {
            if (currency !== 'USD') {
                const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
                this.exchangeRates[currency] = baseRates[currency] * (1 + variation);
            }
        });
        
        this.updatePortfolioDisplay();
    }

    // Method to get portfolio summary
    getPortfolioSummary() {
        let totalValue = 0;
        let totalCost = 0;
        
        this.portfolio.forEach(stock => {
            const profitLoss = this.calculateProfitLoss(stock);
            const currentValueInBase = this.convertCurrency(
                profitLoss.currentValue, 
                stock.currency, 
                this.baseCurrency
            );
            const purchaseValueInBase = this.convertCurrency(
                profitLoss.purchaseValue, 
                stock.currency, 
                this.baseCurrency
            );
            
            totalValue += currentValueInBase;
            totalCost += purchaseValueInBase;
        });
        
        const totalProfitLoss = totalValue - totalCost;
        const totalProfitLossPercentage = totalCost > 0 ? (totalProfitLoss / totalCost) * 100 : 0;
        
        return {
            totalValue,
            totalCost,
            totalProfitLoss,
            totalProfitLossPercentage,
            stockCount: this.portfolio.length
        };
    }
}

// ===== MAIN.JS =====
// Main Application Controller
class ExpatPortfolioTracker {
    constructor() {
        this.marketStatus = null;
        this.portfolioManager = null;
        this.init();
    }

    init() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initializeApp();
            });
        } else {
            this.initializeApp();
        }
    }

    initializeApp() {
        console.log('🌍 Initializing Expat Portfolio Tracker...');
        
        // Initialize market status tracker
        this.marketStatus = new MarketStatus();
        
        // Initialize portfolio manager
        this.portfolioManager = new PortfolioManager();
        
        // Set up global update intervals
        this.setupUpdateIntervals();
        
        // Add keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        // Add sample data button (for testing)
        this.addSampleDataButton();
        
        console.log('✅ Application initialized successfully!');
    }

    setupUpdateIntervals() {
        // Update exchange rates every 5 minutes
        setInterval(() => {
            this.portfolioManager.updateExchangeRates();
        }, 5 * 60 * 1000);
        
        // Update portfolio display every minute
        setInterval(() => {
            this.portfolioManager.updatePortfolioDisplay();
        }, 60 * 1000);
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Alt + A to add stock
            if (e.altKey && e.key === 'a') {
                e.preventDefault();
                const addStockModal = document.getElementById('addStockModal');
                if (addStockModal) {
                    addStockModal.style.display = 'block';
                    document.getElementById('stockSymbol').focus();
                }
            }
            
            // Escape to close modal
            if (e.key === 'Escape') {
                const addStockModal = document.getElementById('addStockModal');
                if (addStockModal && addStockModal.style.display === 'block') {
                    addStockModal.style.display = 'none';
                }
            }
        });
    }

    addSampleDataButton() {
        const portfolioControls = document.querySelector('.portfolio-controls');
        if (portfolioControls) {
            const sampleDataBtn = document.createElement('button');
            sampleDataBtn.className = 'btn';
            sampleDataBtn.textContent = 'Add Sample Data';
            sampleDataBtn.style.background = '#95a5a6';
            sampleDataBtn.style.color = 'white';
            sampleDataBtn.onclick = () => {
                this.portfolioManager.addSampleData();
            };
            portfolioControls.appendChild(sampleDataBtn);
        }
    }

    // Method to display portfolio summary
    showPortfolioSummary() {
        const summary = this.portfolioManager.getPortfolioSummary();
        const summaryDiv = document.createElement('div');
        summaryDiv.className = 'portfolio-summary';
        summaryDiv.style.cssText = `
            background: white;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            border-left: 4px solid #f39c12;
        `;
        
        const profitLossClass = summary.totalProfitLoss >= 0 ? 'profit-positive' : 'profit-negative';
        const profitLossSign = summary.totalProfitLoss >= 0 ? '+' : '';
        
        summaryDiv.innerHTML = `
            <h3>Portfolio Summary</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 15px;">
                <div>
                    <span style="color: #7f8c8d;">Total Stocks:</span>
                    <strong>${summary.stockCount}</strong>
                </div>
                <div>
                    <span style="color: #7f8c8d;">Total Value:</span>
                    <strong>${summary.totalValue.toFixed(2)} ${this.portfolioManager.baseCurrency}</strong>
                </div>
                <div>
                    <span style="color: #7f8c8d;">Total Cost:</span>
                    <strong>${summary.totalCost.toFixed(2)} ${this.portfolioManager.baseCurrency}</strong>
                </div>
                <div>
                    <span style="color: #7f8c8d;">Total P&L:</span>
                    <strong class="${profitLossClass}">
                        ${profitLossSign}${summary.totalProfitLoss.toFixed(2)} ${this.portfolioManager.baseCurrency}
                        (${profitLossSign}${summary.totalProfitLossPercentage.toFixed(2)}%)
                    </strong>
                </div>
            </div>
        `;
        
        // Insert summary after portfolio controls
        const portfolioSection = document.querySelector('.portfolio-section');
        const portfolioControls = document.querySelector('.portfolio-controls');
        if (portfolioSection && portfolioControls) {
            const existingSummary = portfolioSection.querySelector('.portfolio-summary');
            if (existingSummary) {
                existingSummary.remove();
            }
            portfolioControls.insertAdjacentElement('afterend', summaryDiv);
        }
    }

    // Method to export portfolio data
    exportPortfolio() {
        const data = {
            portfolio: this.portfolioManager.portfolio,
            baseCurrency: this.portfolioManager.baseCurrency,
            exportDate: new Date().toISOString(),
            summary: this.portfolioManager.getPortfolioSummary()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `portfolio_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Method to add export functionality
    addExportButton() {
        const portfolioControls = document.querySelector('.portfolio-controls');
        if (portfolioControls) {
            const exportBtn = document.createElement('button');
            exportBtn.className = 'btn';
            exportBtn.textContent = 'Export Portfolio';
            exportBtn.style.background = '#27ae60';
            exportBtn.style.color = 'white';
            exportBtn.onclick = () => {
                this.exportPortfolio();
            };
            portfolioControls.appendChild(exportBtn);
        }
    }

    // Method to handle app cleanup
    destroy() {
        if (this.marketStatus) {
            this.marketStatus.destroy();
        }
        console.log('🔄 Application cleaned up');
    }
}

// Global app instance
let app;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    app = new ExpatPortfolioTracker();
    
    // Make portfolio manager globally accessible for button clicks
    window.portfolioManager = app.portfolioManager;
    
    // Add portfolio summary update
    setInterval(() => {
        if (app.portfolioManager && app.portfolioManager.portfolio.length > 0) {
            app.showPortfolioSummary();
        }
    }, 2000);
    
    // Add export button
    setTimeout(() => {
        app.addExportButton();
    }, 1000);
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (app) {
        app.destroy();
    }
});

// Handle visibility change (pause/resume updates when tab is not active)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('🔄 App paused (tab not active)');
    } else {
        console.log('🔄 App resumed (tab active)');
        // Refresh data when tab becomes active
        if (app && app.portfolioManager) {
            app.portfolioManager.updatePortfolioDisplay();
        }
    }
});

// Global error handler
window.addEventListener('error', (e) => {
    console.error('🚨 Application error:', e.error);
    // In a real app, you might want to send this to an error tracking service
});

// Service Worker registration (for future PWA features)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Service worker would be registered here for offline functionality
        console.log('📱 Service Worker support detected');
    });
}

console.log('🚀 Expat Portfolio Tracker loaded successfully!');
