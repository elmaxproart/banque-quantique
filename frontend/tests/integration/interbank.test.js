import { describe, it, expect, beforeEach } from 'vitest';

const processInterbankTransfer = (banks, source, dest, amount, currency) => {
  if (!banks[source] || !banks[dest]) throw new Error('Invalid bank portfolios.');
  if (source === dest) throw new Error('Source and destination must differ.');
  if (amount <= 0) throw new Error('Invalid transfer amount.');
  if (banks[source].balances[currency] < amount) throw new Error('Insufficient funds in source bank.');

  const updatedBanks = JSON.parse(JSON.stringify(banks));
  updatedBanks[source].balances[currency] = parseFloat(
    (updatedBanks[source].balances[currency] - amount).toFixed(4)
  );
  updatedBanks[dest].balances[currency] = parseFloat(
    (updatedBanks[dest].balances[currency] + amount).toFixed(4)
  );
  return updatedBanks;
};

describe('Registre de transfert interbancaire - Tests d\'intégration', () => {
  let banks;

  beforeEach(() => {
    banks = {
      "Quantum Core": { balances: { USD: 50000.00 } },
      "Aether Trust": { balances: { USD: 30000.00 } }
    };
  });

  it('doit transférer avec succès des USD de Quantum Core vers Aether Trust', () => {
    const updated = processInterbankTransfer(banks, 'Quantum Core', 'Aether Trust', 10000.00, 'USD');
    expect(updated['Quantum Core'].balances.USD).toBe(40000.00);
    expect(updated['Aether Trust'].balances.USD).toBe(40000.00);
  });

  it('doit lever une erreur si la banque source et de destination sont identiques', () => {
    expect(() => {
      processInterbankTransfer(banks, 'Quantum Core', 'Quantum Core', 5000.00, 'USD');
    }).toThrow('Source and destination must differ.');
  });

  it('doit lever une erreur si le solde de la banque source est insuffisant', () => {
    expect(() => {
      processInterbankTransfer(banks, 'Aether Trust', 'Quantum Core', 35000.00, 'USD');
    }).toThrow('Insufficient funds in source bank.');
  });
});
