/**
 * Calculator Engine
 * All income, budget, savings, FIRE, and health scoring calculations
 * Pure functions: input state, output state mutations + return values
 */

import { DEFAULT_STATE } from './state.js';

/**
 * Kenya tax and rate constants (2026)
 */
const KENYA_RATES = {
    paye_bands: [
        { min: 0, max: 24000, rate: 0.10 },
        { min: 24001, max: 32333, rate: 0.25 },
        { min: 32334, max: 500000, rate: 0.30 },
        { min: 500001, max: 800000, rate: 0.325 },
        { min: 800001, max: Infinity, rate: 0.35 }
    ],
    paye_relief: 2400,
    nssf_t1: 200,
    nssf_t2_rate: 0.06,
    nssf_t2_threshold: 6000,
    shif_rate: 0.0275,
    inflation: 0.065,
    swr: 0.04
};

/**
 * Calculate income deductions (PAYE, NSSF, SHIF)
 * Based on salary input and Kenya tax bands
 */
function calculateIncome(state) {
    const salary = state.income.salary;
    let paye = 0;

    for (let band of KENYA_RATES.paye_bands) {
        if (salary > band.min) {
            const taxable = Math.min(salary, band.max) - band.min;
            paye += taxable * band.rate;
        }
    }
    paye -= KENYA_RATES.paye_relief;
    paye = Math.max(paye, 0);

    const nssfT1 = KENYA_RATES.nssf_t1;
    const nssfT2 = Math.max(salary - KENYA_RATES.nssf_t2_threshold, 0) * KENYA_RATES.nssf_t2_rate;
    const shif = salary * KENYA_RATES.shif_rate;

    const totalDeductions = Math.round(paye + nssfT1 + nssfT2 + shif);
    const grossMonthly = salary + (state.income.consulting || 0) + (state.income.farm || 0) +
                        (state.income.rental || 0) + (state.income.remittance || 0) +
                        (state.income.business || 0) + (state.income.other || 0);
    const netMonthly = grossMonthly - totalDeductions;

    // Determine stability band based on income source diversification
    let stabilityBand = 'High variability';
    const incomeSources = [
        state.income.salary,
        state.income.consulting,
        state.income.farm,
        state.income.rental,
        state.income.remittance,
        state.income.business,
        state.income.other
    ].filter(v => v > 0).length;

    if (incomeSources >= 4) stabilityBand = 'Stable';
    else if (incomeSources >= 2) stabilityBand = 'Moderate';

    state.income._paye = Math.round(paye);
    state.income._nssfT1 = nssfT1;
    state.income._nssfT2 = Math.round(nssfT2);
    state.income._shif = Math.round(shif);
    state.income._totalDeductions = totalDeductions;
    state.income._grossMonthly = grossMonthly;
    state.income._netMonthly = Math.max(0, netMonthly);
    state.income._stabilityBand = stabilityBand;
}

/**
 * Calculate budget surplus and savings rate
 */
function calculateBudget(state) {
    const categories = ['schoolFees', 'rent', 'carLoan', 'insurance', 'otherFixed',
                       'tithe', 'upcountrySupport', 'harambee', 'chama', 'churchOther',
                       'food', 'utilities', 'transport', 'airtime', 'houseHelp',
                       'dining', 'personal', 'misc'];
    let total = 0;
    categories.forEach(cat => total += state.budget[cat] || 0);

    const netIncome = state.income._netMonthly || 0;
    const surplus = netIncome - total;
    const savingsRate = netIncome > 0 ? (surplus / netIncome) : 0;

    state.budget._totalExpenses = total;
    state.budget._surplus = surplus;
    state.budget._savingsRate = savingsRate;
}

/**
 * Calculate FIRE number (nominal and inflation-adjusted)
 */
function calculateFireNumber(state) {
    const currentAge = state.profile.age || 35;
    const targetAge = state.fire.targetAge || 60;
    const monthlySpend = state.fire.monthlySpend || (state.budget._totalExpenses || 0);
    const swr = ((state.fire.swr || 4) / 100);
    const inflation = ((state.fire.inflation || 6.5) / 100);
    const growthRate = ((state.fire.growthRate || 12) / 100);

    const yearsToFire = Math.max(targetAge - currentAge, 1);
    const months = yearsToFire * 12;
    const r = growthRate / 12;

    // Calculate retirement spend adjusted for inflation
    const spendAtFire = monthlySpend * Math.pow(1 + inflation, yearsToFire);
    const fireNominal = (monthlySpend * 12) / swr;
    const fireReal = (spendAtFire * 12) / swr;

    // Investment projection (67% of surplus to FIRE, as per handover)
    const monthlyInvest = Math.max(0, Math.round(state.budget._surplus * 0.67));
    const currentPortfolio = state.investments?._totalPortfolio || 0;
    const fvPortfolio = currentPortfolio * Math.pow(1 + r, months);
    const fvContribs = monthlyInvest > 0 ? monthlyInvest * ((Math.pow(1 + r, months) - 1) / r) : 0;
    const projected = Math.round(fvPortfolio + fvContribs);
    const delta = projected - fireReal;
    const onTrack = delta >= 0;

    state.fire._fireNumber = Math.round(fireNominal);
    state.fire._fireReal = Math.round(fireReal);
    state.fire._onTrack = onTrack;

    return { fireNominal: Math.round(fireNominal), fireReal: Math.round(fireReal), projected, onTrack, delta, yearsToFire };
}

/**
 * Calculate savings metrics (emergency fund coverage)
 */
function calculateSavings(state) {
    const totalBalance = (state.savedBalances._mPesaLock || 0) +
                        (state.savedBalances._mmf || 0) +
                        (state.savedBalances._fixed || 0) +
                        (state.savedBalances._other || 0);

    const emergencyTarget = (state.budget._totalExpenses || 0) * 6;
    const emergencyCoverage = emergencyTarget > 0 ? totalBalance / emergencyTarget : 0;

    state.savedBalances._totalBalance = totalBalance;
    state.savedBalances._emergencyTarget = emergencyTarget;
    state.savedBalances._emergencyCoverage = emergencyCoverage;
}

/**
 * Health score computation (6-dimension MVP version per handover)
 * Returns score object with breakdown
 */
function computeHealthScore(state) {
    const s = state;
    const weights = {
        income: 0.15,
        budget: 0.20,
        savings: 0.20,
        investments: 0.20,
        contracts: 0.10,
        goals: 0.15
    };

    // DIMENSION 1: Income (0-100 points)
    let scoreIncome = 0;
    if (s.income.salary > 0 || s.income.business > 0) {
        scoreIncome += 20; // Base for having income
        if (s.income.salary > 0) scoreIncome += 10;
        if (s.income.business > 0) scoreIncome += 10;
        if (s.income.consulting > 0) scoreIncome += 10;

        const totalIncome = s.income._grossMonthly || 1;
        const salaryRatio = s.income.salary / totalIncome;
        if (salaryRatio >= 0.6) scoreIncome += 20; // Stability bonus

        if (s.income.rental > 0 || s.income.remittance > 0) {
            scoreIncome += 15; // Passive/external income bonus
        }
    }
    scoreIncome = Math.min(scoreIncome, 100);

    // DIMENSION 2: Budget (0-100 points)
    let scoreBudget = 0;
    if (s.budget._surplus <= 0) {
        scoreBudget = 5; // Hard floor
    } else {
        const savingsRate = s.budget._savingsRate || 0;
        if (savingsRate >= 0.40) scoreBudget += 35;
        else if (savingsRate >= 0.20) scoreBudget += 25;
        else if (savingsRate >= 0.10) scoreBudget += 10;

        if (s.profile.schoolChildren > 0 && s.budget.schoolFees > 0) {
            scoreBudget += 10; // Education provision
        }

        scoreBudget += 20; // Base for having structure
    }
    scoreBudget = Math.min(scoreBudget, 100);

    // DIMENSION 3: Savings (0-100 points)
    let scoreSavings = 0;
    const emergencyCoverage = s.budget._totalExpenses > 0 ?
        (s.savedBalances._mPesaLock + s.savedBalances._mmf) / (s.budget._totalExpenses * 6) : 0;

    if (emergencyCoverage >= 1.0) scoreSavings += 40;
    else if (emergencyCoverage >= 0.5) scoreSavings += 25;
    else if (emergencyCoverage >= 0.25) scoreSavings += 12;

    const savingInstruments = [s.savedBalances._mPesaLock, s.savedBalances._mmf, s.savedBalances._fixed, s.savedBalances._other]
        .filter(v => v > 0).length;
    scoreSavings += savingInstruments * 8;

    if ((s.savedBalances._mPesaLock + s.savedBalances._mmf) > 0) scoreSavings += 10;

    const monthlyContribution = s.budget._surplus || 0;
    const monthlyExpenses = s.budget._totalExpenses || 1;
    if (monthlyContribution >= monthlyExpenses * 0.2) scoreSavings += 18;

    scoreSavings = Math.min(scoreSavings, 100);

    // DIMENSION 4: Investments (0-100 points)
    let scoreInvestments = 0;
    const hasBonds = (s.investments.bondLadder && s.investments.bondLadder.length >= 3);
    const hasSomeBonds = (s.investments.bondLadder && s.investments.bondLadder.length >= 1);

    if (hasBonds) scoreInvestments += 25;
    else if (hasSomeBonds) scoreInvestments += 15;

    const totalPortfolio = (s.investments._totalPortfolio || 0);
    const annualIncome = (s.income._grossMonthly * 12) || 1;
    const portfolioRatio = totalPortfolio / annualIncome;
    if (portfolioRatio >= 3) scoreInvestments += 25;
    else if (portfolioRatio >= 1.5) scoreInvestments += 18;
    else if (portfolioRatio >= 0.5) scoreInvestments += 10;

    scoreInvestments = Math.min(scoreInvestments, 100);

    // DIMENSION 5: Contracts (Insurance, NSSF, SHIF)
    let scoreContracts = 0;
    if (s.insurance.lifeCurrent > 0) scoreContracts += 25;
    if (s.insurance.healthCurrent > 0) scoreContracts += 20;
    if (s.income._nssfT2 > 0 || s.income._nssfT1 > 0) scoreContracts += 20;
    if (s.income._shif > 0) scoreContracts += 15;
    scoreContracts = Math.min(scoreContracts, 100);

    // DIMENSION 6: Goals (FIRE planning)
    let scoreGoals = 0;
    const fireCalc = s.fire;
    if (fireCalc._fireReal > 0) {
        scoreGoals += 15; // FIRE defined
        if (fireCalc._onTrack) {
            scoreGoals += 45; // On track bonus
        } else {
            scoreGoals += 20; // Planning credit
        }
    }
    scoreGoals = Math.min(scoreGoals, 100);

    // Composite score (weighted average)
    const allScores = [scoreIncome, scoreBudget, scoreSavings, scoreInvestments, scoreContracts, scoreGoals];
    const validScores = allScores.filter(v => v !== null);
    let composite = 0;

    if (validScores.length > 0) {
        composite = Math.round(
            (scoreIncome * weights.income) +
            (scoreBudget * weights.budget) +
            (scoreSavings * weights.savings) +
            (scoreInvestments * weights.investments) +
            (scoreContracts * weights.contracts) +
            (scoreGoals * weights.goals)
        );
    }

    // Determine color band
    let scoreBand = '#64748B'; // Neutral gray
    if (composite >= 85) scoreBand = '#FFC200'; // Gold
    else if (composite >= 70) scoreBand = '#1B3A6B'; // Navy
    else if (composite >= 55) scoreBand = '#276128'; // Green
    else if (composite >= 35) scoreBand = '#B87C00'; // Amber
    else if (composite > 0) scoreBand = '#A32D2D'; // Red

    // Update state dashboard
    s.dashboard = s.dashboard || {};
    s.dashboard.healthScore = composite;
    s.dashboard.scoreBand = scoreBand;
    s.dashboard.scoreDimensions = {
        income: scoreIncome,
        budget: scoreBudget,
        savings: scoreSavings,
        investments: scoreInvestments,
        contracts: scoreContracts,
        goals: scoreGoals
    };

    return {
        composite,
        band: scoreBand,
        dimensions: s.dashboard.scoreDimensions,
        alerts: []
    };
}

/**
 * Master recalculation orchestrator
 * Runs all calculators in dependency order
 * Safe to call on every input change (with debounce)
 */
function recalculateAll(state) {
    // Calculation order: dependency-driven
    calculateIncome(state);
    calculateBudget(state);
    calculateSavings(state);
    calculateFireNumber(state);
    computeHealthScore(state);

    // Return updated state so callers can use it
    return state;
}

export {
    KENYA_RATES,
    calculateIncome,
    calculateBudget,
    calculateSavings,
    calculateFireNumber,
    computeHealthScore,
    recalculateAll
};
