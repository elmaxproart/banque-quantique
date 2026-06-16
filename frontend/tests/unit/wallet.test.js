import { describe, it, expect } from 'vitest';

const processDeposit = (balance, amount) => {
  if (amount <= 0) throw new Error('Invalid deposit amount.');
  return parseFloat((balance + amount).toFixed(4));
};

const processWithdraw = (balance, amount) => {
  if (amount <= 0) throw new Error('Invalid withdrawal amount.');
  if (balance < amount) throw new Error('Insufficient funds.');
  return parseFloat((balance - amount).toFixed(4));
};

describe('Portefeuille de compte - Tests unitaires', () => {
  describe('Opérations de dépôt', () => {
    it('doit augmenter correctement le solde actif lors d\'un dépôt valide', () => {
      const balance = 1000.00;
      const res = processDeposit(balance, 250.50);
      expect(res).toBe(1250.50);
    });

    it('doit lever une erreur pour un dépôt négatif ou nul', () => {
      expect(() => processDeposit(100.00, -10.00)).toThrow('Invalid deposit amount.');
      expect(() => processDeposit(100.00, 0)).toThrow('Invalid deposit amount.');
    });
  });

  describe('Opérations de retrait', () => {
    it('doit diminuer correctement le solde actif lors d\'un retrait valide', () => {
      const balance = 1000.00;
      const res = processWithdraw(balance, 300.00);
      expect(res).toBe(700.00);
    });

    it('doit lever une erreur si les fonds sont insuffisants', () => {
      expect(() => processWithdraw(100.00, 150.00)).toThrow('Insufficient funds.');
    });

    it('doit lever une erreur pour un retrait négatif', () => {
      expect(() => processWithdraw(100.00, -50.00)).toThrow('Invalid withdrawal amount.');
    });
  });
});
