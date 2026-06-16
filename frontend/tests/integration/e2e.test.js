import { describe, it, expect, beforeEach } from 'vitest';

const processDeposit = (banks, bank, amount, currency) => {
  const updated = JSON.parse(JSON.stringify(banks));
  updated[bank].balances[currency] = parseFloat((updated[bank].balances[currency] + amount).toFixed(4));
  return updated;
};

const processWithdraw = (banks, bank, amount, currency) => {
  const updated = JSON.parse(JSON.stringify(banks));
  if (updated[bank].balances[currency] < amount) throw new Error('Insufficient funds.');
  updated[bank].balances[currency] = parseFloat((updated[bank].balances[currency] - amount).toFixed(4));
  return updated;
};

const processInterbankTransfer = (banks, source, dest, amount, currency) => {
  const updated = JSON.parse(JSON.stringify(banks));
  if (updated[source].balances[currency] < amount) throw new Error('Insufficient funds.');
  updated[source].balances[currency] = parseFloat((updated[source].balances[currency] - amount).toFixed(4));
  updated[dest].balances[currency] = parseFloat((updated[dest].balances[currency] + amount).toFixed(4));
  return updated;
};

describe('Flux de registre de bout en bout - Tests d\'intégration', () => {
  let banks;

  beforeEach(() => {
    banks = {
      "Quantum Core": { balances: { USD: 50000.00, EUR: 12000.00 } },
      "Aether Trust": { balances: { USD: 30000.00, EUR: 8000.00 } },
      "Nova Reserve": { balances: { USD: 10000.00, EUR: 4000.00 } }
    };
  });

  it('doit exécuter avec succès un pipeline complet de dépôt, retrait et transfert interbancaire', () => {
    // 1. Dépôt de 5000 USD par l'utilisateur dans Quantum Core (50000 -> 55000)
    let state = processDeposit(banks, 'Quantum Core', 5000.00, 'USD');
    expect(state['Quantum Core'].balances.USD).toBe(55000.00);

    // 2. Retrait de 2000 EUR de Aether Trust (8000 -> 6000)
    state = processWithdraw(state, 'Aether Trust', 2000.00, 'EUR');
    expect(state['Aether Trust'].balances.EUR).toBe(6000.00);

    // 3. Transfert de 15000 USD de Quantum Core vers Nova Reserve (Quantum Core: 40000, Nova Reserve: 25000)
    state = processInterbankTransfer(state, 'Quantum Core', 'Nova Reserve', 15000.00, 'USD');
    
    expect(state['Quantum Core'].balances.USD).toBe(40000.00);
    expect(state['Nova Reserve'].balances.USD).toBe(25000.00);
  });
});
