// Mock Data
const INITIAL_STOCKS = [
    { symbol: 'BNNR', name: 'BitNile Metaverse', price: 31.74, shares: 400 },
    { symbol: 'COIN', name: 'Coinbase Global', price: 264.97, shares: 200 },
    { symbol: 'ETH', name: 'Grayscale Ethereum', price: 29.55, shares: 400 },
    { symbol: 'MSFT', name: 'Microsoft Corp.', price: 485.50, shares: 20 },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 180.26, shares: 30 },
    { symbol: 'PFE', name: 'Pfizer Inc.', price: 25.71, shares: 600 },
    { symbol: 'PLTR', name: 'Palantir Tech', price: 165.77, shares: 100 },
    { symbol: 'PYPL', name: 'PayPal Holdings', price: 61.83, shares: 50 },
    { symbol: 'RKLB', name: 'Rocket Lab', price: 41.93, shares: 500 },
    { symbol: 'SOFI', name: 'SoFi Technologies', price: 28.45, shares: 200 },
    { symbol: 'SPY', name: 'SPDR S&P 500', price: 678.08, shares: 30 },
    { symbol: 'TSLA', name: 'Tesla, Inc.', price: 426.58, shares: 20 },
    { symbol: 'UNH', name: 'UnitedHealth', price: 328.71, shares: 100 }
];

class StockApp {
    constructor() {
        this.stocks = [];
        this.init();
    }

    init() {
        this.loadStocks();
        this.loadUsers();
        this.renderStocks();
        this.updateTotalValue();
        this.startLiveUpdates();
        this.renderNews();
        this.renderTrumpUpdates();
        this.setupAdminListeners();
        this.checkLoginState();
    }

    loadStocks() {
        const saved = localStorage.getItem('myStocks');
        if (saved) {
            this.stocks = JSON.parse(saved);
            // Ensure all loaded stocks have necessary properties for live updates
            this.stocks = this.stocks.map(stock => ({
                ...stock,
                // If loaded from localStorage, these might already exist, otherwise initialize
                cost: stock.cost || stock.price, // Cost basis
                price: stock.price, // Current price
                change: stock.change || 0,
                changePercent: stock.changePercent || 0,
                initialPrice: stock.initialPrice || stock.price // Price at market open for day change calculation
            }));
        } else {
            this.stocks = INITIAL_STOCKS.map(stock => ({
                ...stock,
                cost: stock.price, // Assuming initial price extracted is the cost basis
                price: stock.price, // Current price starts same as cost
                change: 0,
                changePercent: 0,
                initialPrice: stock.price // Price at market open for day change calculation
            }));
        }
    }

    loadUsers() {
        const saved = localStorage.getItem('myUsers');
        this.users = saved ? JSON.parse(saved) : [];
    }

    saveUsers() {
        localStorage.setItem('myUsers', JSON.stringify(this.users));
        this.renderUserList();
    }

    saveStocks() {
        localStorage.setItem('myStocks', JSON.stringify(this.stocks));
        this.renderStocks();
        this.updateTotalValue();
        this.renderAdminList();
    }

    setupAdminListeners() {
        const modal = document.getElementById('admin-modal');
        const loginModal = document.getElementById('login-modal');
        const btn = document.getElementById('nav-login-btn'); // Updated ID
        const span = document.getElementsByClassName('close-modal')[0]; // Admin modal close
        const closeLogin = document.getElementById('close-login');
        const addBtn = document.getElementById('add-stock-submit');
        const resetBtn = document.getElementById('reset-default-btn');

        // Navigation Logic
        const navLinks = document.querySelectorAll('.nav-links a');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                this.switchSection(targetId);
            });
        });

        // Tabs
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
            });
        });

        // User Management
        const addUserBtn = document.getElementById('add-user-submit');
        if (addUserBtn) {
            addUserBtn.onclick = () => this.handleAddUser();
        }

        // Login elements
        const loginBtn = document.getElementById('login-btn');
        const usernameInput = document.getElementById('login-username');
        const passwordInput = document.getElementById('login-password');
        const loginError = document.getElementById('login-error');
        const vipLoginTrigger = document.getElementById('vip-login-trigger');

        // Open Login Modal from Admin Button
        btn.onclick = () => {
            const role = sessionStorage.getItem('userRole');
            if (role === 'admin') {
                modal.style.display = 'block';
                this.renderAdminList();
                this.renderUserList();
            } else {
                loginModal.style.display = 'block';
                usernameInput.value = '';
                passwordInput.value = '';
                loginError.style.display = 'none';
            }
        }

        // Open Login Modal from VIP Trigger
        if (vipLoginTrigger) {
            vipLoginTrigger.onclick = () => {
                loginModal.style.display = 'block';
                usernameInput.value = '';
                passwordInput.value = '';
                loginError.style.display = 'none';
            }
        }

        // Login Logic
        loginBtn.onclick = () => {
            const username = usernameInput.value.trim();
            const password = passwordInput.value.trim();

            if (username === 'admin' && password === 'admin123') {
                sessionStorage.setItem('isLoggedIn', 'true');
                sessionStorage.setItem('userRole', 'admin');
                sessionStorage.setItem('username', 'Administrator');
                this.handleLoginSuccess(loginModal, modal);
            } else {
                // Check against member list
                const user = this.users.find(u => u.username === username && u.password === password);
                if (user) {
                    sessionStorage.setItem('isLoggedIn', 'true');
                    sessionStorage.setItem('userRole', 'member');
                    sessionStorage.setItem('username', user.username);
                    this.handleLoginSuccess(loginModal, null);
                } else {
                    loginError.style.display = 'block';
                }
            }
        }

        // Close Login Modal
        closeLogin.onclick = () => {
            loginModal.style.display = 'none';
        }

        span.onclick = () => {
            modal.style.display = 'none';
        }

        window.onclick = (event) => {
            if (event.target == modal) {
                modal.style.display = 'none';
            }
            if (event.target == loginModal) {
                loginModal.style.display = 'none';
            }
        }

        addBtn.onclick = () => this.handleAddStock();

        resetBtn.onclick = () => {
            if (confirm('Are you sure you want to reset to the default portfolio? This will clear your changes.')) {
                this.stocks = INITIAL_STOCKS.map(stock => ({
                    ...stock,
                    cost: stock.price,
                    price: stock.price,
                    change: 0,
                    changePercent: 0,
                    initialPrice: stock.price
                }));
                this.saveStocks();
            }
        }
    }

    handleLoginSuccess(loginModal, adminModal) {
        loginModal.style.display = 'none';
        this.checkLoginState();
        if (adminModal) {
            adminModal.style.display = 'block';
            this.renderAdminList();
            this.renderUserList();
        } else {
            alert(`Welcome back, ${sessionStorage.getItem('username')}!`);
        }
    }

    checkLoginState() {
        const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
        const role = sessionStorage.getItem('userRole');

        // VIP Content Logic
        const vipSection = document.getElementById('vip-section');
        const vipContent = document.querySelector('.vip-content');
        const vipUnlocked = document.querySelector('.vip-content-unlocked');

        if (vipSection) {
            vipSection.style.display = 'block'; // Always show section container
            if (isLoggedIn) {
                vipContent.style.display = 'none';
                vipUnlocked.style.display = 'block';
            } else {
                vipContent.style.display = 'block';
                vipUnlocked.style.display = 'none';
            }
        }

        // Admin Button Logic
        const adminBtn = document.getElementById('nav-login-btn'); // Updated ID
        if (role === 'member') {
            adminBtn.style.display = 'none';
        } else {
            adminBtn.style.display = 'block';
            adminBtn.textContent = isLoggedIn && role === 'admin' ? 'Admin Panel' : 'Manage Stocks';
        }
    }

    handleAddUser() {
        const usernameInput = document.getElementById('new-username');
        const passwordInput = document.getElementById('new-password');

        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        if (!username || !password) {
            alert('Please enter both username and password.');
            return;
        }

        if (this.users.some(u => u.username === username)) {
            alert('Username already exists.');
            return;
        }

        this.users.push({ username, password });
        this.saveUsers();

        usernameInput.value = '';
        passwordInput.value = '';
        alert(`User ${username} created successfully.`);
    }

    renderUserList() {
        const list = document.getElementById('admin-user-list');
        if (!list) return;

        list.innerHTML = this.users.map(user => `
            <li class="admin-stock-item">
                <div class="admin-stock-info">
                    <span class="admin-stock-symbol">${user.username}</span>
                    <span class="admin-stock-details">Member</span>
                </div>
                <button class="btn-remove" onclick="app.removeUser('${user.username}')">Remove</button>
            </li>
        `).join('');
    }

    removeUser(username) {
        if (confirm(`Remove user ${username}?`)) {
            this.users = this.users.filter(u => u.username !== username);
            this.saveUsers();
        }
    }

    renderAdminList() {
        const list = document.getElementById('admin-stock-list');
        list.innerHTML = this.stocks.map(stock => `
            <li class="admin-stock-item">
                <div class="admin-stock-info">
                    <span class="admin-stock-symbol">${stock.symbol}</span>
                    <span class="admin-stock-details">${stock.shares} shares @ $${this.formatCurrency(stock.cost)}</span>
                </div>
                <button class="btn-remove" onclick="app.removeStock('${stock.symbol}')">Remove</button>
            </li>
        `).join('');
    }

    switchSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.view-section').forEach(el => {
            el.style.display = 'none';
            el.classList.remove('active');
        });

        // Show target section
        const target = document.getElementById(sectionId);
        if (target) {
            target.style.display = 'block';
            setTimeout(() => target.classList.add('active'), 10);
        }

        // Update Nav State
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${sectionId}`) {
                link.classList.add('active');
            }
        });
    }
    handleAddStock() {
        const symbolInput = document.getElementById('new-symbol');
        const sharesInput = document.getElementById('new-shares');
        const costInput = document.getElementById('new-cost');

        const symbol = symbolInput.value.toUpperCase().trim();
        const shares = parseFloat(sharesInput.value);
        const cost = parseFloat(costInput.value);

        if (!symbol || isNaN(shares) || isNaN(cost) || shares <= 0 || cost <= 0) {
            alert('Please fill in all fields correctly with positive numbers.');
            return;
        }

        if (this.stocks.some(s => s.symbol === symbol)) {
            alert('Stock already exists in your portfolio!');
            return;
        }

        // Mock initial price as cost for simplicity, or fetch real price if we had an API
        const newStock = {
            symbol,
            name: symbol, // In a real app, we'd fetch the name
            price: cost, // Current price starts at cost
            change: 0,
            changePercent: 0,
            shares,
            cost,
            initialPrice: cost // Price at market open for day change calculation
        };

        this.stocks.push(newStock);
        this.saveStocks();

        // Clear inputs
        symbolInput.value = '';
        sharesInput.value = '';
        costInput.value = '';
    }

    removeStock(symbol) {
        if (confirm(`Remove ${symbol} from portfolio?`)) {
            this.stocks = this.stocks.filter(s => s.symbol !== symbol);
            this.saveStocks();
        }
    }

    renderTrumpUpdates() {
        const container = document.getElementById('trump-feed');
        const updates = [
            {
                type: 'speech',
                text: '在经济俱乐部发表关于税收政策的演讲',
                time: '2小时前',
                tag: '经济政策',
                analysis: '提议降低企业税率，旨在刺激本土制造业投资。',
                cryptoImpact: { sentiment: 'positive', text: '利好 (资金流动性增加)' },
                stockImpact: { sentiment: 'positive', text: '利好 (制造业/工业)' }
            },
            {
                type: 'social',
                text: '“股市创下历史新高！美国再次伟大！”',
                time: '4小时前',
                tag: 'Truth Social',
                analysis: '强调市场表现作为执政成绩，暗示将继续维持宽松政策。',
                cryptoImpact: { sentiment: 'neutral', text: '中性' },
                stockImpact: { sentiment: 'positive', text: '利好 (市场信心增强)' }
            },
            {
                type: 'press',
                text: '宣布新的能源独立计划，旨在降低油价',
                time: '昨天',
                tag: '能源',
                analysis: '大力支持传统能源开采，可能降低通胀预期。',
                cryptoImpact: { sentiment: 'positive', text: '利好 (挖矿成本降低)' },
                stockImpact: { sentiment: 'mixed', text: '分化 (利好能源/利空新能源)' }
            }
        ];

        container.innerHTML = updates.map(item => `
            <div class="trump-item">
                <div class="trump-icon">🇺🇸</div>
                <div class="trump-content">
                    <div class="trump-text">${item.text}</div>
                    <div class="trump-meta">
                        <span class="trump-tag">${item.tag}</span>
                        <span class="trump-time">${item.time}</span>
                    </div>
                    <div class="trump-analysis">
                        <div class="analysis-text">💡 分析: ${item.analysis}</div>
                        <div class="market-impacts">
                            <div class="impact-badge ${item.cryptoImpact.sentiment}">
                                ₿ 加密: ${item.cryptoImpact.text}
                            </div>
                            <div class="impact-badge ${item.stockImpact.sentiment}">
                                📈 股市: ${item.stockImpact.text}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderNews() {
        const newsContainer = document.getElementById('news-feed');
        const now = new Date();

        // Convert to ET
        const etNow = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
        const isAfter830 = etNow.getHours() > 8 || (etNow.getHours() === 8 && etNow.getMinutes() >= 30);

        // If before 8:30 AM ET, show "Yesterday's" news or a "Waiting for market open" state
        // For this demo, we'll just show "Latest Updates" but flag them as "Pre-market" if early.

        const newsItems = this.generateNewsItems(isAfter830);

        newsContainer.innerHTML = newsItems.map(item => `
            <div class="news-item">
                <div class="news-meta">
                    <span class="news-tag">${item.symbol}</span>
                    <span>${item.time}</span>
                </div>
                <div class="news-title">${item.title}</div>
                <div class="news-summary">${item.summary}</div>
            </div>
        `).join('');
    }

    generateNewsItems(isAfter830) {
        // Mock news generator based on portfolio stocks
        const templates = [
            { title: "发布强劲的第四季度财报", summary: "受云业务增长推动，营收超出预期 15%。" },
            { title: "宣布建立新的战略合作伙伴关系", summary: "此次合作旨在加速人工智能的开发与整合。" },
            { title: "分析师上调评级至“买入”", summary: "随着产品路线图的积极进展，目标价上调至新高。" },
            { title: "发布下一代产品系列", summary: "备受期待的新品发布预计将夺取巨大的市场份额。" },
            { title: "CEO 就未来前景发表评论", summary: "管理层强调致力于提高运营效率和持续增长。" }
        ];

        // Pick 5 random stocks from portfolio to have news
        const shuffledStocks = [...this.stocks].sort(() => 0.5 - Math.random()).slice(0, 5);

        return shuffledStocks.map(stock => {
            const template = templates[Math.floor(Math.random() * templates.length)];
            return {
                symbol: stock.symbol,
                time: isAfter830 ? "今天 8:30 AM" : "昨天",
                title: `${stock.name} ${template.title}`,
                summary: template.summary
            };
        });
    }

    formatCurrency(value) {
        return new Intl.NumberFormat('en-US', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    }

    updateTotalValue() {
        const totalValue = this.stocks.reduce((acc, stock) => acc + (stock.price * stock.shares), 0);
        const totalCost = this.stocks.reduce((acc, stock) => acc + (stock.cost * stock.shares), 0);
        const totalChange = totalValue - totalCost;
        const totalChangePercent = totalCost > 0 ? (totalChange / totalCost) * 100 : 0;

        const totalValueEl = document.getElementById('total-value');
        const totalChangeEl = document.getElementById('total-change');

        totalValueEl.textContent = this.formatCurrency(totalValue);

        // Update change indicator
        totalChangeEl.className = 'change-indicator ' + (totalChange >= 0 ? 'positive' : 'negative');
        totalChangeEl.innerHTML = `
            <span class="icon">${totalChange >= 0 ? '▲' : '▼'}</span>
            <span class="percentage">${Math.abs(totalChangePercent).toFixed(2)}%</span>
            <span class="period">Total Return</span>
        `;
    }

    renderStocks() {
        const tbody = document.getElementById('stocks-body');
        tbody.innerHTML = '';

        this.stocks.forEach(stock => {
            const tr = document.createElement('tr');
            tr.id = `stock-${stock.symbol}`;

            const marketValue = stock.price * stock.shares;
            const totalCost = stock.cost * stock.shares; // Total cost for all shares of this stock
            const returnValue = marketValue - totalCost;
            const returnPercent = totalCost > 0 ? (returnValue / totalCost) * 100 : 0;
            const isPositive = returnValue >= 0;

            tr.innerHTML = `
                <td data-label="Symbol">
                    <div class="symbol-cell">${stock.symbol}</div>
                    <span class="name-sub">${stock.name}</span>
                </td>
                <td class="text-right price-cell" id="price-${stock.symbol}" data-label="Price">$${this.formatCurrency(stock.price)}</td>
                <td class="text-right" id="change-${stock.symbol}" data-label="Change" style="color: var(--${stock.change >= 0 ? 'success' : 'danger'}-color)">
                    ${stock.change >= 0 ? '+' : ''}${this.formatCurrency(stock.change)} (${stock.changePercent.toFixed(2)}%)
                </td>
                <td class="text-right" data-label="Shares">${stock.shares}</td>
                <td class="text-right" data-label="Avg Cost">$${this.formatCurrency(stock.cost)}</td>
                <td class="text-right" id="value-${stock.symbol}" data-label="Market Value">$${this.formatCurrency(marketValue)}</td>
                <td class="text-right" id="return-${stock.symbol}" data-label="Return" style="color: var(--${isPositive ? 'success' : 'danger'}-color)">
                    ${isPositive ? '+' : ''}${this.formatCurrency(returnValue)} (${returnPercent.toFixed(2)}%)
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    updateStockUI(stock) {
        const tr = document.getElementById(`stock-${stock.symbol}`);
        if (!tr) return;

        const priceEl = document.getElementById(`price-${stock.symbol}`);
        const changeEl = document.getElementById(`change-${stock.symbol}`);
        const valueEl = document.getElementById(`value-${stock.symbol}`);
        const returnEl = document.getElementById(`return-${stock.symbol}`);

        const oldPrice = parseFloat(priceEl.textContent.replace('$', '').replace(',', ''));
        const newPrice = stock.price;

        // Flash animation on the row cell
        if (newPrice > oldPrice) {
            priceEl.classList.remove('flash-down');
            priceEl.classList.add('flash-up');
        } else if (newPrice < oldPrice) {
            priceEl.classList.remove('flash-up');
            priceEl.classList.add('flash-down');
        }

        setTimeout(() => {
            priceEl.classList.remove('flash-up', 'flash-down');
        }, 1000);

        // Update values
        priceEl.textContent = '$' + this.formatCurrency(stock.price);

        // Day Change (simulated as change from open/cost for now, but logic in startLiveUpdates uses initialPrice)
        // Note: In startLiveUpdates, we update stock.change and stock.changePercent.
        // Let's make sure that logic is consistent.
        changeEl.style.color = `var(--${stock.change >= 0 ? 'success' : 'danger'}-color)`;
        changeEl.textContent = `${stock.change >= 0 ? '+' : ''}${this.formatCurrency(stock.change)} (${stock.changePercent.toFixed(2)}%)`;

        // Market Value
        const marketValue = stock.price * stock.shares;
        valueEl.textContent = '$' + this.formatCurrency(marketValue);

        // Total Return (Price vs Cost)
        const returnValue = (stock.price - stock.cost) * stock.shares;
        const returnPercent = stock.cost > 0 ? ((stock.price - stock.cost) / stock.cost) * 100 : 0;
        const isPositive = returnValue >= 0;

        returnEl.style.color = `var(--${isPositive ? 'success' : 'danger'}-color)`;
        returnEl.textContent = `${isPositive ? '+' : ''}${this.formatCurrency(returnValue)} (${returnPercent.toFixed(2)}%)`;
    }

    startLiveUpdates() {
        setInterval(() => {
            // Pick a random stock to update
            const randomIndex = Math.floor(Math.random() * this.stocks.length);
            const stock = this.stocks[randomIndex];

            // Simulate price movement (-0.5% to +0.5%)
            const movement = (Math.random() - 0.5) * 0.01;
            const newPrice = stock.price * (1 + movement);

            // Update data
            stock.price = newPrice;
            stock.change = stock.price - stock.initialPrice;
            stock.changePercent = (stock.change / stock.initialPrice) * 100;

            // Update UI
            this.updateStockUI(stock);
            this.updateTotalValue();

        }, 1500); // Update every 1.5 seconds
    }
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    new StockApp();
});
