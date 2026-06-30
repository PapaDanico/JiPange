/**
 * State Management Module
 * Handles application state shape, initialization, and persistence
 */

/**
 * Default application state
 * All screens and calculators read from and update this shape
 */
const DEFAULT_STATE = {
    _meta: {
        version: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedSteps: []
    },
    profile: {
        name: '', age: 35, retirementAge: 60, county: 'Nairobi',
        dependants: 0, upcountryDep: 0, schoolChildren: 0,
        isHouseholdPlanning: false, partnerName: '', partnerAge: 35
    },
    income: {
        salary: 0, consulting: 0, farm: 0, rental: 0, remittance: 0, business: 0, other: 0,
        _paye: 0, _nssfT1: 0, _nssfT2: 0, _shif: 0, _totalDeductions: 0,
        _grossMonthly: 0, _netMonthly: 0, _stabilityBand: 'unknown'
    },
    budget: {
        schoolFees: 0, rent: 0, carLoan: 0, insurance: 0, otherFixed: 0,
        tithe: 0, upcountrySupport: 0, harambee: 0, chama: 0, churchOther: 0,
        food: 0, utilities: 0, transport: 0, airtime: 0, houseHelp: 0,
        dining: 0, personal: 0, misc: 0,
        _totalExpenses: 0, _surplus: 0, _savingsRate: 0
    },
    scenarios: {
        conservative: { savingsRate: 15, investmentReturn: 8, spendingCut: 0 },
        balanced: { savingsRate: 25, investmentReturn: 10, spendingCut: 0 },
        ambitious: { savingsRate: 35, investmentReturn: 12, spendingCut: 10 }
    },
    goals: [],
    fire: {
        targetAge: 60, monthlySpend: 300000, swr: 4, inflation: 6.5, growthRate: 12,
        _fireNumber: 0, _fireReal: 0, _onTrack: false
    },
    mpesa: {
        monthlyTarget: 10000, currentSaved: 0
    },
    savedBalances: {
        _mPesaLock: 0,
        _mmf: 0,
        _fixed: 0,
        _other: 0
    },
    investments: {
        list: [],
        bondLadder: [],
        totalBondLadder: 0,
        _totalPortfolio: 0
    },
    debts: [],
    business: {
        monthlyRevenue: 0, monthlyExpenses: 0, taxRate: 30,
        _grossProfit: 0, _taxLiability: 0, _netIncome: 0
    },
    assets: [],
    tax: {
        grossIncome: 0, totalDeductions: 0,
        _taxWithout: 0, _taxWith: 0, _taxSavings: 0
    },
    education: {
        children: [],
        _totalNeeded: 0, _totalProjected: 0, _totalShortfall: 0
    },
    retirement: {
        currentAge: 45, targetAge: 60, lifeExpectancy: 85, inflationRate: 6.5,
        currentSavings: 2000000, monthlyContribution: 50000,
        preRetirementReturn: 10, postRetirementReturn: 6,
        nssfAnnual: 120000, pensionAnnual: 0, rentalIncome: 0, businessIncome: 0, otherIncome: 0,
        annualSpending: 3000000, healthcareAnnual: 400000, withdrawalRate: 4,
        _nestEggAtRetirement: 0, _safeWithdrawal: 0, _totalRetirementIncome: 0, _monthlyIncome: 0,
        _yearsInRetirement: 0, _isSustainable: false
    },
    businessScenario: {
        currentRevenue: 1000000, currentCogs: 60, currentNetMargin: 30, projectionYears: 5,
        conservativeGrowth: 6, conservativeExpense: 99,
        balancedGrowth: 12, balancedExpense: 96,
        aggressiveGrowth: 25, aggressiveExpense: 91,
        _scenarios: {}, _selectedScenario: 'balanced'
    },
    insurance: {
        annualIncome: 1200000, monthlyExpenses: 100000, totalAssets: 2000000,
        lifeCurrent: 0, lifePremium: 12000,
        healthCurrent: 0, shifContribution: 2500,
        homeCurrent: 0, carPremium: 5000,
        disabilityCurrent: 0, disabilityPremium: 6000,
        _lifeGap: 0, _healthGap: 0, _propertyGap: 0, _disabilityGap: 0,
        _totalPremium: 0, _totalCoverage: 0, _premiumPercent: 0
    },
    chama: {
        groupSize: 15, monthlyContribution: 20000, monthsActive: 12, returnRate: 8,
        saccoRate: 7, stockRate: 12, realEstateRate: 15, businessRate: 20,
        _monthlyPool: 0, _accumulated: 0, _returns: 0, _totalWealth: 0,
        _saccoTotal: 0, _stockTotal: 0, _realEstateTotal: 0, _businessTotal: 0
    },
    chamas: []
};

/**
 * Save state to browser localStorage
 * Updates the timestamp and persists entire state object
 */
function saveState(state) {
    state._meta.updatedAt = new Date().toISOString();
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem('jipange_v1', JSON.stringify(state));
    }
}

/**
 * Load state from localStorage with deep merge against defaults
 * Ensures new state fields in DEFAULT_STATE are available even if localStorage is stale
 */
function loadState() {
    let saved = {};
    if (typeof localStorage !== 'undefined') {
        const savedStr = localStorage.getItem('jipange_v1');
        saved = savedStr ? JSON.parse(savedStr) : {};
    }

    const merged = JSON.parse(JSON.stringify(DEFAULT_STATE));

    // Deep merge saved state with defaults
    const mergeObjects = (target, source) => {
        for (let key in source) {
            if (source.hasOwnProperty(key)) {
                if (typeof source[key] === 'object' && !Array.isArray(source[key]) && source[key] !== null) {
                    if (typeof target[key] !== 'object') target[key] = {};
                    mergeObjects(target[key], source[key]);
                } else {
                    target[key] = source[key];
                }
            }
        }
        return target;
    };

    return mergeObjects(merged, saved);
}

/**
 * Get current state value (for read-only access pattern)
 */
function getState() {
    if (typeof window !== 'undefined' && window.state) {
        return window.state;
    }
    return loadState();
}

/**
 * Update nested state property and trigger save
 */
function setState(updates) {
    if (typeof window !== 'undefined' && window.state) {
        Object.assign(window.state, updates);
        saveState(window.state);
    }
}

export { DEFAULT_STATE, loadState, saveState, getState, setState };
