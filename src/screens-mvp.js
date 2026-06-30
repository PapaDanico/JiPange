/**
 * MVP Screens Wiring
 * Connects form inputs to state updates and calculations
 * Handles Profile, Income, Budget, Savings, Goals & FIRE, Dashboard
 */

import { recalculateAll } from './calculators.js';
import { debounce } from './utils.js';

/**
 * Setup Profile screen (screen-1)
 */
function setupProfileScreen(state, saveState) {
    const inputs = {
        name: document.getElementById('name'),
        age: document.getElementById('age'),
        retirementAge: document.getElementById('retirementAge'),
        county: document.getElementById('county'),
        dependants: document.getElementById('dependants'),
        upcountryDep: document.getElementById('upcountryDep'),
        schoolChildren: document.getElementById('schoolChildren'),
        isHouseholdPlanning: document.getElementById('isHouseholdPlanning'),
        partnerName: document.getElementById('partnerName'),
        partnerAge: document.getElementById('partnerAge')
    };

    // Debounced recalculation
    const handleChange = debounce(() => {
        recalculateAll(state);
        saveState(state);
        updateDashboard(state);
    }, 150);

    // Populate form from state
    const populateForm = () => {
        if (inputs.name) inputs.name.value = state.profile.name || '';
        if (inputs.age) inputs.age.value = state.profile.age || 35;
        if (inputs.retirementAge) inputs.retirementAge.value = state.profile.retirementAge || 60;
        if (inputs.county) inputs.county.value = state.profile.county || 'Nairobi';
        if (inputs.dependants) inputs.dependants.value = state.profile.dependants || 0;
        if (inputs.upcountryDep) inputs.upcountryDep.value = state.profile.upcountryDep || 0;
        if (inputs.schoolChildren) inputs.schoolChildren.value = state.profile.schoolChildren || 0;
        if (inputs.isHouseholdPlanning) {
            inputs.isHouseholdPlanning.checked = state.profile.isHouseholdPlanning || false;
        }
        if (inputs.partnerName) inputs.partnerName.value = state.profile.partnerName || '';
        if (inputs.partnerAge) inputs.partnerAge.value = state.profile.partnerAge || 35;
    };

    // Bind input changes
    Object.entries(inputs).forEach(([key, input]) => {
        if (!input) return;

        input.addEventListener('change', () => {
            const value = input.type === 'checkbox' ? input.checked :
                         input.type === 'number' ? parseInt(input.value) || 0 :
                         input.value;
            state.profile[key] = value;

            // Show/hide household partner fields
            if (key === 'isHouseholdPlanning') {
                const householdFields = document.getElementById('householdFields');
                if (householdFields) {
                    householdFields.style.display = value ? 'block' : 'none';
                }
            }

            handleChange();
        });
    });

    populateForm();
}

/**
 * Setup Income screen (screen-2)
 */
function setupIncomeScreen(state, saveState) {
    const inputs = {
        salary: document.getElementById('salary'),
        consulting: document.getElementById('consulting'),
        farm: document.getElementById('farm'),
        rental: document.getElementById('rental'),
        remittance: document.getElementById('remittance'),
        business: document.getElementById('business'),
        other: document.getElementById('other')
    };

    const handleChange = debounce(() => {
        recalculateAll(state);
        saveState(state);
        updateIncomeDisplay(state);
        updateDashboard(state);
    }, 150);

    const populateForm = () => {
        Object.entries(inputs).forEach(([key, input]) => {
            if (input) input.value = state.income[key] || 0;
        });
    };

    Object.entries(inputs).forEach(([key, input]) => {
        if (!input) return;
        input.addEventListener('change', () => {
            state.income[key] = parseInt(input.value) || 0;
            handleChange();
        });
    });

    populateForm();
}

/**
 * Setup Budget screen (screen-3)
 */
function setupBudgetScreen(state, saveState) {
    const categories = ['schoolFees', 'rent', 'carLoan', 'insurance', 'otherFixed',
                       'tithe', 'upcountrySupport', 'harambee', 'chama', 'churchOther',
                       'food', 'utilities', 'transport', 'airtime', 'houseHelp',
                       'dining', 'personal', 'misc'];

    const inputs = {};
    categories.forEach(cat => {
        inputs[cat] = document.getElementById(cat);
    });

    const handleChange = debounce(() => {
        recalculateAll(state);
        saveState(state);
        updateBudgetDisplay(state);
        updateDashboard(state);
    }, 150);

    const populateForm = () => {
        categories.forEach(cat => {
            const input = inputs[cat];
            if (input) input.value = state.budget[cat] || 0;
        });
    };

    categories.forEach(cat => {
        const input = inputs[cat];
        if (!input) return;
        input.addEventListener('change', () => {
            state.budget[cat] = parseInt(input.value) || 0;
            handleChange();
        });
    });

    populateForm();
}

/**
 * Setup Savings screen (screen-5, merged with M-Pesa)
 */
function setupSavingsScreen(state, saveState) {
    const inputs = {
        _mPesaLock: document.getElementById('mPesaLock'),
        _mmf: document.getElementById('mmf'),
        _fixed: document.getElementById('fixedDeposit'),
        _other: document.getElementById('otherSavings')
    };

    const handleChange = debounce(() => {
        recalculateAll(state);
        saveState(state);
        updateSavingsDisplay(state);
        updateDashboard(state);
    }, 150);

    const populateForm = () => {
        Object.entries(inputs).forEach(([key, input]) => {
            if (input) input.value = state.savedBalances[key] || 0;
        });
    };

    Object.entries(inputs).forEach(([key, input]) => {
        if (!input) return;
        input.addEventListener('change', () => {
            state.savedBalances[key] = parseInt(input.value) || 0;
            handleChange();
        });
    });

    populateForm();
}

/**
 * Setup Goals & FIRE screen (screen-6)
 */
function setupGoalsScreen(state, saveState) {
    const inputs = {
        targetAge: document.getElementById('fireTargetAge'),
        monthlySpend: document.getElementById('fireMonthlySpend'),
        swr: document.getElementById('fireSWR'),
        inflation: document.getElementById('fireInflation'),
        growthRate: document.getElementById('fireGrowthRate')
    };

    const handleChange = debounce(() => {
        recalculateAll(state);
        saveState(state);
        updateFireDisplay(state);
        updateDashboard(state);
    }, 150);

    const populateForm = () => {
        Object.entries(inputs).forEach(([key, input]) => {
            if (input) input.value = state.fire[key] || (key === 'swr' ? 4 : 0);
        });
    };

    Object.entries(inputs).forEach(([key, input]) => {
        if (!input) return;
        input.addEventListener('change', () => {
            state.fire[key] = parseFloat(input.value) || 0;
            handleChange();
        });
    });

    populateForm();
}

/**
 * Update Income screen displays
 */
function updateIncomeDisplay(state) {
    const displays = {
        'grossMonthly': state.income._grossMonthly,
        'netMonthly': state.income._netMonthly,
        'payeDisplay': state.income._paye,
        'nssfT1Display': state.income._nssfT1,
        'nssfT2Display': state.income._nssfT2,
        'shifDisplay': state.income._shif,
        'totalDeductionsDisplay': state.income._totalDeductions
    };

    Object.entries(displays).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = `KES ${value.toLocaleString('en-KE')}`;
    });
}

/**
 * Update Budget screen displays
 */
function updateBudgetDisplay(state) {
    const els = {
        'totalExpenses': state.budget._totalExpenses,
        'surplus': state.budget._surplus,
        'savingsRate': (state.budget._savingsRate * 100).toFixed(1) + '%'
    };

    Object.entries(els).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) {
            if (typeof value === 'string') {
                el.textContent = value;
            } else {
                el.textContent = `KES ${value.toLocaleString('en-KE')}`;
            }
        }
    });

    // Update savings rate color coding
    const rate = state.budget._savingsRate;
    const rateEl = document.getElementById('savingsRateCard');
    if (rateEl) {
        rateEl.classList.remove('danger', 'warning');
        if (rate < 0.10) rateEl.classList.add('danger');
        else if (rate < 0.20) rateEl.classList.add('warning');
    }
}

/**
 * Update Savings screen displays
 */
function updateSavingsDisplay(state) {
    const total = (state.savedBalances._mPesaLock || 0) +
                 (state.savedBalances._mmf || 0) +
                 (state.savedBalances._fixed || 0) +
                 (state.savedBalances._other || 0);

    const target = (state.budget._totalExpenses || 0) * 6;
    const coverage = target > 0 ? total / target : 0;

    const totalEl = document.getElementById('totalBalance');
    if (totalEl) totalEl.textContent = `KES ${total.toLocaleString('en-KE')}`;

    const coverageEl = document.getElementById('emergencyCoverage');
    if (coverageEl) coverageEl.textContent = `${(coverage * 100).toFixed(1)}%`;
}

/**
 * Update FIRE screen displays
 */
function updateFireDisplay(state) {
    const fire = state.fire;
    const els = {
        'fireNumberNominal': fire._fireNumber,
        'fireNumberReal': fire._fireReal,
        'fireOnTrack': fire._onTrack ? '✅ On Track' : '⚠️ Behind'
    };

    Object.entries(els).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) {
            if (typeof value === 'boolean' || typeof value === 'string') {
                el.textContent = value;
            } else {
                el.textContent = `KES ${value.toLocaleString('en-KE')}`;
            }
        }
    });
}

/**
 * Update Dashboard with aggregated data
 */
function updateDashboard(state) {
    // Income summary
    const incomeEl = document.getElementById('dashboardIncome');
    if (incomeEl) incomeEl.textContent = `KES ${state.income._grossMonthly.toLocaleString('en-KE')}`;

    // Expenses summary
    const expensesEl = document.getElementById('dashboardExpenses');
    if (expensesEl) expensesEl.textContent = `KES ${state.budget._totalExpenses.toLocaleString('en-KE')}`;

    // Surplus summary
    const surplusEl = document.getElementById('dashboardSurplus');
    if (surplusEl) surplusEl.textContent = `KES ${state.budget._surplus.toLocaleString('en-KE')}`;

    // Savings rate
    const rateEl = document.getElementById('dashboardSavingsRate');
    if (rateEl) rateEl.textContent = `${(state.budget._savingsRate * 100).toFixed(1)}%`;

    // Health score
    const scoreEl = document.getElementById('healthScore');
    if (scoreEl) {
        const score = state.dashboard?.healthScore || 0;
        scoreEl.textContent = score > 0 ? score : '—';
    }

    // FIRE progress
    const fireEl = document.getElementById('dashboardFireStatus');
    if (fireEl) {
        fireEl.textContent = state.fire._onTrack ? '✅ On Track' : '⚠️ Behind Target';
    }
}

/**
 * Initialize all MVP screen event listeners
 */
export function initMVPScreens(state, saveState) {
    // Setup screen bindings
    setupProfileScreen(state, saveState);
    setupIncomeScreen(state, saveState);
    setupBudgetScreen(state, saveState);
    setupSavingsScreen(state, saveState);
    setupGoalsScreen(state, saveState);

    // Initial dashboard update
    updateDashboard(state);
}

export {
    setupProfileScreen,
    setupIncomeScreen,
    setupBudgetScreen,
    setupSavingsScreen,
    setupGoalsScreen,
    updateIncomeDisplay,
    updateBudgetDisplay,
    updateSavingsDisplay,
    updateFireDisplay,
    updateDashboard
};
