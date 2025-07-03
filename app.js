// App State
let currentTripId = null;
let trips = JSON.parse(localStorage.getItem('trips')) || [];

// DOM Elements
let continueBtn, addTripBtn, tripsList, addFriendBtn, finishListBtn, backToTripsBtn;
let tripNameInput, friendsList, expensesContainer, addExpenseBtn;

// Helper function for navigation
function navigateTo(page) {
    // For local file system, we can't use pushState, so just change location
    window.location.href = page;
}

// Page Detection
function getCurrentPage() {
    const path = window.location.pathname.split('/').pop() || '';
    if (path.includes('trips.html')) return 'trips';
    if (path.includes('add-trip.html')) return 'add-trip';
    if (path.includes('calculate.html')) return 'calculate';
    return 'welcome';
}

// Initialize the appropriate page
function initPage() {
    const page = getCurrentPage();
    
    switch(page) {
        case 'welcome':
            initWelcomePage();
            break;
        case 'trips':
            initTripsPage();
            break;
        case 'add-trip':
            initAddTripPage();
            break;
        case 'calculate':
            initCalculatePage();
            break;
    }
}

// Welcome Page
function initWelcomePage() {
    continueBtn = document.getElementById('continueBtn');
    if (continueBtn) {
        continueBtn.addEventListener('click', () => {
            navigateTo('trips.html');
        });
    }
}

// Trips Page
function initTripsPage() {
    addTripBtn = document.getElementById('addTripBtn');
    tripsList = document.getElementById('tripsList');
    
    if (addTripBtn) {
        addTripBtn.addEventListener('click', () => {
            navigateTo('add-trip.html');
        });
    }
    
    renderTripsList();
}


function renderTripsList() {
    tripsList.innerHTML = '';
    
    if (trips.length === 0) {
        tripsList.innerHTML = '<p>No trips yet. Add your first trip!</p>';
        return;
    }
    
    trips.forEach((trip, index) => {
        const tripElement = document.createElement('div');
        tripElement.className = 'trip-item';
        
        tripElement.innerHTML = `
            <div>
                <h3>${trip.name}</h3>
                <p>${trip.friends.length} friends, ${trip.expenses.length} expenses</p>
            </div>
            <div>
                <button class="btn-small edit-trip" data-id="${index}">Edit</button>
                <button class="btn-small calculate-trip" data-id="${index}">Calculate</button>
            </div>
        `;
        
        tripsList.appendChild(tripElement);
    });
    
    // Add event listeners to the buttons
    document.querySelectorAll('.edit-trip').forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentTripId = e.target.getAttribute('data-id');
            window.location.href = `add-trip.html?edit=${currentTripId}`;
        });
    });
    
    document.querySelectorAll('.calculate-trip').forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentTripId = e.target.getAttribute('data-id');
            window.location.href = `calculate.html?trip=${currentTripId}`;
        });
    });
}

// Add/Edit Trip Page
// Add/Edit Trip Page
function initAddTripPage() {
    // Get trip ID if editing
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');
    
    tripNameInput = document.getElementById('tripName');
    friendsList = document.getElementById('friendsList');
    expensesContainer = document.getElementById('expensesContainer');
    addFriendBtn = document.getElementById('addFriendBtn');
    addExpenseBtn = document.getElementById('addExpenseBtn');
    finishListBtn = document.getElementById('finishListBtn');
    
    // Set up event listeners
    addFriendBtn.addEventListener('click', addFriendField);
    addExpenseBtn.addEventListener('click', addExpenseField);
    finishListBtn.addEventListener('click', finishTrip);
    
    // Add input event listener to friend name fields to update payer options
    friendsList.addEventListener('input', function(e) {
        if (e.target.classList.contains('friend-name')) {
            updatePayerOptions();
        }
    });
    
    // If editing, load the trip data
    if (editId !== null) {
        currentTripId = parseInt(editId);
        const trip = trips[currentTripId];
        document.getElementById('tripTitle').textContent = `Edit Trip: ${trip.name}`;
        tripNameInput.value = trip.name;
        
        // Load friends
        friendsList.innerHTML = '';
        trip.friends.forEach(friend => {
            addFriendField(friend);
        });
        
        // Load expenses
        expensesContainer.innerHTML = '';
        trip.expenses.forEach(expense => {
            addExpenseField(expense);
        });
    } else {
        // Start with one friend and one expense
        addFriendField();
        addExpenseField();
    }
}

function addFriendField(name = '') {
    const friendInput = document.createElement('input');
    friendInput.type = 'text';
    friendInput.className = 'friend-name';
    friendInput.placeholder = 'Friend name';
    friendInput.value = name;
    friendsList.appendChild(friendInput);
    
    // Update payer options whenever a new friend is added
    updatePayerOptions();
}

function addExpenseField(expense = null) {
    const expenseItem = document.createElement('div');
    expenseItem.className = 'expense-item';
    
    const payerSelect = document.createElement('select');
    payerSelect.className = 'expense-payer';
    payerSelect.innerHTML = '<option value="">Who paid?</option>';
    
    const amountInput = document.createElement('input');
    amountInput.type = 'number';
    amountInput.className = 'expense-amount';
    amountInput.placeholder = 'Amount';
    amountInput.min = '0';
    amountInput.step = '0.01';
    
    const descInput = document.createElement('input');
    descInput.type = 'text';
    descInput.className = 'expense-desc';
    descInput.placeholder = 'What for?';
    
    const settledCheck = document.createElement('label');
    settledCheck.className = 'settled-check';
    settledCheck.innerHTML = `
        <input type="checkbox" class="expense-settled"> Settled?
    `;
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn-small remove-expense';
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => {
        expensesContainer.removeChild(expenseItem);
    });
    
    expenseItem.appendChild(payerSelect);
    expenseItem.appendChild(amountInput);
    expenseItem.appendChild(descInput);
    expenseItem.appendChild(settledCheck);
    expenseItem.appendChild(removeBtn);
    
    expensesContainer.appendChild(expenseItem);
    
    // Update payer options with current friends
    updatePayerOptions();
    
    // If editing an expense, populate the fields
    if (expense) {
        payerSelect.value = expense.payer;
        amountInput.value = expense.amount;
        descInput.value = expense.description;
        settledCheck.querySelector('.expense-settled').checked = expense.settled;
    }
}

function updatePayerOptions() {
    const friendNames = Array.from(document.querySelectorAll('.friend-name'))
        .map(input => input.value.trim())
        .filter(name => name !== '');
    
    document.querySelectorAll('.expense-payer').forEach(select => {
        const currentValue = select.value;
        select.innerHTML = '<option value="">Who paid?</option>';
        
        friendNames.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            select.appendChild(option);
        });
        
        // Restore the selected value if it still exists
        if (friendNames.includes(currentValue)) {
            select.value = currentValue;
        }
    });
}
function finishTrip() {
    const tripName = tripNameInput.value.trim();
    if (!tripName) {
        alert('Please enter a trip name');
        return;
    }
    
    const friendNames = Array.from(document.querySelectorAll('.friend-name'))
        .map(input => input.value.trim())
        .filter(name => name !== '');
    
    if (friendNames.length === 0) {
        alert('Please add at least one friend');
        return;
    }
    
    const expenses = Array.from(document.querySelectorAll('.expense-item')).map(item => {
        const payer = item.querySelector('.expense-payer').value;
        const amount = parseFloat(item.querySelector('.expense-amount').value) || 0;
        const description = item.querySelector('.expense-desc').value.trim();
        const settled = item.querySelector('.expense-settled').checked;
        
        if (!payer || isNaN(amount)) {
            return null;
        }
        
        return {
            payer,
            amount,
            description,
            settled
        };
    }).filter(expense => expense !== null);
    
    if (expenses.length === 0) {
        alert('Please add at least one valid expense');
        return;
    }
    
    const trip = {
        name: tripName,
        friends: friendNames,
        expenses: expenses
    };
    
    // Save or update the trip
    if (currentTripId !== null) {
        trips[currentTripId] = trip;
    } else {
        trips.push(trip);
        currentTripId = trips.length - 1;
    }
    
    localStorage.setItem('trips', JSON.stringify(trips));
    window.location.href = `calculate.html?trip=${currentTripId}`;
}

// Calculate Page
function initCalculatePage() {
    const urlParams = new URLSearchParams(window.location.search);
    const tripId = urlParams.get('trip');
    
    backToTripsBtn = document.getElementById('backToTripsBtn');
    backToTripsBtn.addEventListener('click', () => {
        window.location.href = 'trips.html';
    });
    
    if (tripId === null) {
        document.getElementById('balancesSummary').innerHTML = '<p>No trip selected</p>';
        return;
    }
    
    const trip = trips[parseInt(tripId)];
    if (!trip) {
        document.getElementById('balancesSummary').innerHTML = '<p>Trip not found</p>';
        return;
    }
    
    document.getElementById('tripNameDisplay').textContent = trip.name;
    
    // Calculate balances
    const balances = calculateBalances(trip);
    renderBalances(balances);
    renderSettlementSteps(balances);
}

function calculateBalances(trip) {
    const balances = {};
    const friends = trip.friends;
    
    // Initialize balances
    friends.forEach(friend => {
        balances[friend] = 0;
    });
    
    // Calculate total paid by each friend
    trip.expenses.forEach(expense => {
        if (!expense.settled) {
            balances[expense.payer] += expense.amount;
        }
    });
    
    // Calculate total spent and average
    const totalSpent = Object.values(balances).reduce((sum, amount) => sum + amount, 0);
    const average = totalSpent / friends.length;
    
    // Adjust balances to show who owes what
    Object.keys(balances).forEach(friend => {
        balances[friend] -= average;
    });
    
    return balances;
}

function renderBalances(balances) {
    const balancesContainer = document.getElementById('balancesSummary');
    balancesContainer.innerHTML = '<h2>Balances:</h2>';
    
    Object.entries(balances).forEach(([friend, balance]) => {
        const balanceElement = document.createElement('div');
        balanceElement.className = 'balance-item';
        
        if (balance > 0) {
            balanceElement.classList.add('positive');
            balanceElement.textContent = `${friend} gets back $${balance.toFixed(2)}`;
        } else if (balance < 0) {
            balanceElement.classList.add('negative');
            balanceElement.textContent = `${friend} owes $${Math.abs(balance).toFixed(2)}`;
        } else {
            balanceElement.classList.add('neutral');
            balanceElement.textContent = `${friend} is settled up`;
        }
        
        balancesContainer.appendChild(balanceElement);
    });
}

function renderSettlementSteps(balances) {
    const stepsContainer = document.getElementById('settlementSteps');
    stepsContainer.innerHTML = '';
    
    // Convert balances to array and sort by amount
    const balancesArray = Object.entries(balances).map(([name, amount]) => ({ name, amount }));
    balancesArray.sort((a, b) => b.amount - a.amount);
    
    const debtors = balancesArray.filter(person => person.amount < 0);
    const creditors = balancesArray.filter(person => person.amount > 0);
    
    let steps = [];
    let i = 0, j = 0;
    
    while (i < debtors.length && j < creditors.length) {
        const debtor = debtors[i];
        const creditor = creditors[j];
        
        const amount = Math.min(-debtor.amount, creditor.amount);
        
        if (amount > 0.01) { // Ignore very small amounts
            steps.push(`${debtor.name} should pay ${creditor.name} $${amount.toFixed(2)}`);
            
            debtor.amount += amount;
            creditor.amount -= amount;
            
            if (Math.abs(debtor.amount) < 0.01) i++;
            if (creditor.amount < 0.01) j++;
        } else {
            break;
        }
    }
    
    if (steps.length === 0) {
        steps.push('Everyone is already settled up!');
    }
    
    steps.forEach(step => {
        const stepElement = document.createElement('div');
        stepElement.className = 'settlement-step';
        stepElement.textContent = step;
        stepsContainer.appendChild(stepElement);
    });
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', initPage);