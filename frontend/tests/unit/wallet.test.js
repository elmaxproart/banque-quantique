import { describe, it, expect, beforeEach } from 'vitest';
import {
  processDeposit,
  processWithdraw,
  validateTransactionInput,
  validateInterbankTransfer,
  validateWireTransfer,
  ledgerDeposit,
  ledgerWithdraw,
  ledgerInterbankTransfer,
  createDefaultAccount
} from '../../src/lib/banking-logic.js';

// ─────────────────────────────────────────────────────────────────────────────

describe('💰 Service de transactions — Suite de tests complète', () => {

  // ── DÉPÔTS ──────────────────────────────────────────────────────────────────
  describe('Opérations de dépôt', () => {
    it('✅ augmente le solde après un dépôt valide', () => {
      expect(processDeposit(1000.00, 250.50)).toBe(1250.50);
    });

    it('✅ gère les montants avec précision décimale (4 décimales)', () => {
      expect(processDeposit(100.1234, 0.0001)).toBe(100.1235);
    });

    it('✅ accepte un dépôt minimum de 0.0001', () => {
      expect(processDeposit(0, 0.0001)).toBe(0.0001);
    });

    it('❌ rejette un dépôt de montant zéro', () => {
      expect(() => processDeposit(100, 0)).toThrow('Invalid deposit amount.');
    });

    it('❌ rejette un dépôt de montant négatif', () => {
      expect(() => processDeposit(100, -50)).toThrow('Invalid deposit amount.');
    });

    it('✅ dépôt depuis un solde zéro', () => {
      expect(processDeposit(0, 5000)).toBe(5000);
    });
  });

  // ── RETRAITS ────────────────────────────────────────────────────────────────
  describe('Opérations de retrait', () => {
    it('✅ diminue le solde après un retrait valide', () => {
      expect(processWithdraw(1000, 300)).toBe(700);
    });

    it('✅ accepte un retrait égal au solde total (vidage complet)', () => {
      expect(processWithdraw(500, 500)).toBe(0);
    });

    it('✅ gère la précision à 4 décimales', () => {
      expect(processWithdraw(100.5000, 0.0001)).toBe(100.4999);
    });

    it('❌ rejette un retrait supérieur au solde', () => {
      expect(() => processWithdraw(100, 150)).toThrow('Insufficient funds.');
    });

    it('❌ rejette un retrait de montant zéro', () => {
      expect(() => processWithdraw(100, 0)).toThrow('Invalid withdrawal amount.');
    });

    it('❌ rejette un retrait négatif', () => {
      expect(() => processWithdraw(100, -10)).toThrow('Invalid withdrawal amount.');
    });
  });

  // ── VALIDATION DES ENTRÉES ───────────────────────────────────────────────────
  describe('Validation des paramètres de transaction', () => {
    it('✅ valide des paramètres complets et corrects', () => {
      const r = validateTransactionInput('Quantum Core', 1000, 'USD');
      expect(r.valid).toBe(true);
      expect(r.numAmount).toBe(1000);
    });

    it('❌ rejette si bank est manquante', () => {
      expect(validateTransactionInput('', 1000, 'USD').valid).toBe(false);
    });

    it('❌ rejette si amount est manquant', () => {
      expect(validateTransactionInput('Quantum Core', 0, 'USD').valid).toBe(false);
    });

    it('❌ rejette si currency est manquante', () => {
      expect(validateTransactionInput('Quantum Core', 1000, '').valid).toBe(false);
    });

    it('❌ rejette un montant NaN (texte non numérique)', () => {
      expect(validateTransactionInput('Quantum Core', 'abc', 'USD').valid).toBe(false);
    });

    it('❌ rejette un montant négatif', () => {
      expect(validateTransactionInput('Quantum Core', -100, 'USD').valid).toBe(false);
    });
  });

  // ── VALIDATION VIREMENT INTERBANCAIRE ────────────────────────────────────────
  describe('Validation du virement interbancaire', () => {
    it('✅ valide un virement interbancaire correct', () => {
      const r = validateInterbankTransfer('Quantum Core', 'Aether Trust', 5000, 'USD');
      expect(r.valid).toBe(true);
    });

    it('❌ rejette si source = destination', () => {
      const r = validateInterbankTransfer('Quantum Core', 'Quantum Core', 1000, 'USD');
      expect(r.valid).toBe(false);
      expect(r.error).toContain('different');
    });

    it('❌ rejette si source bank est manquante', () => {
      expect(validateInterbankTransfer('', 'Aether Trust', 1000, 'USD').valid).toBe(false);
    });

    it('❌ rejette si destination bank est manquante', () => {
      expect(validateInterbankTransfer('Quantum Core', '', 1000, 'USD').valid).toBe(false);
    });

    it('❌ rejette si amount est nul', () => {
      expect(validateInterbankTransfer('Quantum Core', 'Aether Trust', 0, 'USD').valid).toBe(false);
    });

    it('❌ rejette si currency est manquante', () => {
      expect(validateInterbankTransfer('Quantum Core', 'Aether Trust', 1000, '').valid).toBe(false);
    });

    it('❌ rejette un montant invalide', () => {
      expect(validateInterbankTransfer('Quantum Core', 'Aether Trust', -1, 'USD').valid).toBe(false);
    });
  });

  // ── VALIDATION VIREMENT EXTERNE ──────────────────────────────────────────────
  describe('Validation du virement externe (wire)', () => {
    it('✅ valide un virement externe correct', () => {
      const r = validateWireTransfer('Quantum Core', 'A-TRUST-12345678', 2500, 'EUR');
      expect(r.valid).toBe(true);
    });

    it('❌ rejette si le numéro de compte destinataire est absent', () => {
      expect(validateWireTransfer('Quantum Core', '', 1000, 'USD').valid).toBe(false);
    });

    it('❌ rejette si la banque source est absente', () => {
      expect(validateWireTransfer('', 'A-TRUST-123', 1000, 'USD').valid).toBe(false);
    });

    it('❌ rejette un montant nul', () => {
      expect(validateWireTransfer('Quantum Core', 'A-TRUST-123', 0, 'USD').valid).toBe(false);
    });

    it('❌ rejette un montant négatif', () => {
      expect(validateWireTransfer('Quantum Core', 'A-TRUST-123', -500, 'USD').valid).toBe(false);
    });

    it('❌ rejette si currency est absente', () => {
      expect(validateWireTransfer('Quantum Core', 'A-TRUST-123', 1000, '').valid).toBe(false);
    });
  });

  // ── CRÉATION DE COMPTE ───────────────────────────────────────────────────────
  describe('Création automatique de compte multi-banques', () => {
    let account;

    beforeEach(() => {
      account = createDefaultAccount('user-uuid-001', 'QuantumTrader');
    });

    it('✅ crée un compte avec les 3 banques par défaut', () => {
      expect(account.banks).toHaveProperty('Quantum Core');
      expect(account.banks).toHaveProperty('Aether Trust');
      expect(account.banks).toHaveProperty('Nova Reserve');
    });

    it('✅ chaque banque possède les 4 devises (USD, EUR, QTC, SOL)', () => {
      ['Quantum Core', 'Aether Trust', 'Nova Reserve'].forEach(bank => {
        expect(account.banks[bank].balances).toHaveProperty('USD');
        expect(account.banks[bank].balances).toHaveProperty('EUR');
        expect(account.banks[bank].balances).toHaveProperty('QTC');
        expect(account.banks[bank].balances).toHaveProperty('SOL');
      });
    });

    it('✅ les numéros de compte respectent le format attendu', () => {
      expect(account.banks['Quantum Core'].accountNumber).toMatch(/^Q-CORE-\d{8}$/);
      expect(account.banks['Aether Trust'].accountNumber).toMatch(/^A-TRUST-\d{8}$/);
      expect(account.banks['Nova Reserve'].accountNumber).toMatch(/^N-RESERVE-\d{8}$/);
    });

    it('✅ les soldes initiaux de Quantum Core sont corrects', () => {
      expect(account.banks['Quantum Core'].balances.USD).toBe(50000.00);
      expect(account.banks['Quantum Core'].balances.EUR).toBe(12500.00);
      expect(account.banks['Quantum Core'].balances.QTC).toBe(500.00);
      expect(account.banks['Quantum Core'].balances.SOL).toBe(25.50);
    });

    it('✅ préserve le userId et username', () => {
      expect(account.userId).toBe('user-uuid-001');
      expect(account.username).toBe('QuantumTrader');
    });
  });

  // ── OPÉRATIONS SUR REGISTRE ──────────────────────────────────────────────────
  describe('Opérations de registre (ledger)', () => {
    let banks;

    beforeEach(() => {
      banks = {
        "Quantum Core": { balances: { USD: 50000.00, EUR: 12500.00, QTC: 500.00, SOL: 25.50 } },
        "Aether Trust": { balances: { USD: 30000.00, EUR: 8500.00, QTC: 200.00, SOL: 10.00 } },
        "Nova Reserve": { balances: { USD: 15000.00, EUR: 4000.00, QTC: 50.00, SOL: 5.00 } }
      };
    });

    it('✅ dépôt registre — augmente le bon solde sans affecter les autres', () => {
      const updated = ledgerDeposit(banks, 'Quantum Core', 10000, 'USD');
      expect(updated['Quantum Core'].balances.USD).toBe(60000.00);
      expect(updated['Aether Trust'].balances.USD).toBe(30000.00);
    });

    it('✅ dépôt registre — immuabilité (ne modifie pas l\'original)', () => {
      ledgerDeposit(banks, 'Quantum Core', 10000, 'USD');
      expect(banks['Quantum Core'].balances.USD).toBe(50000.00);
    });

    it('❌ dépôt registre — banque inexistante', () => {
      expect(() => ledgerDeposit(banks, 'Fake Bank', 1000, 'USD')).toThrow('Selected bank not active in matrix.');
    });

    it('❌ dépôt registre — devise non supportée', () => {
      expect(() => ledgerDeposit(banks, 'Quantum Core', 1000, 'BTC')).toThrow('not supported');
    });

    it('✅ retrait registre — diminue le solde correctement', () => {
      const updated = ledgerWithdraw(banks, 'Aether Trust', 5000, 'USD');
      expect(updated['Aether Trust'].balances.USD).toBe(25000.00);
    });

    it('❌ retrait registre — fonds insuffisants', () => {
      expect(() => ledgerWithdraw(banks, 'Nova Reserve', 20000, 'USD')).toThrow('Insufficient funds for withdrawal.');
    });

    it('❌ retrait registre — banque inexistante', () => {
      expect(() => ledgerWithdraw(banks, 'Ghost Bank', 1000, 'USD')).toThrow('Selected bank not active in matrix.');
    });

    it('❌ retrait registre — devise non supportée', () => {
      expect(() => ledgerWithdraw(banks, 'Quantum Core', 100, 'XRP')).toThrow('not supported');
    });

    it('✅ transfert interbancaire — soldes mis à jour correctement', () => {
      const updated = ledgerInterbankTransfer(banks, 'Quantum Core', 'Aether Trust', 10000, 'USD');
      expect(updated['Quantum Core'].balances.USD).toBe(40000.00);
      expect(updated['Aether Trust'].balances.USD).toBe(40000.00);
    });

    it('✅ transfert interbancaire — somme totale préservée', () => {
      const updated = ledgerInterbankTransfer(banks, 'Quantum Core', 'Nova Reserve', 5000, 'EUR');
      const total = updated['Quantum Core'].balances.EUR + updated['Nova Reserve'].balances.EUR;
      const originalTotal = banks['Quantum Core'].balances.EUR + banks['Nova Reserve'].balances.EUR;
      expect(total).toBeCloseTo(originalTotal, 4);
    });

    it('❌ transfert interbancaire — fonds insuffisants en source', () => {
      expect(() => ledgerInterbankTransfer(banks, 'Nova Reserve', 'Quantum Core', 100000, 'USD')).toThrow('Insufficient funds in source bank.');
    });

    it('❌ transfert interbancaire — banque inexistante', () => {
      expect(() => ledgerInterbankTransfer(banks, 'Ghost Bank', 'Quantum Core', 1000, 'USD')).toThrow('Selected bank portfolios are invalid.');
    });

    it('❌ transfert interbancaire — devise inexistante en source', () => {
      expect(() => ledgerInterbankTransfer(banks, 'Quantum Core', 'Aether Trust', 100, 'XRP')).toThrow('not found in source bank.');
    });
  });

  // ── SCÉNARIOS MULTI-OPÉRATIONS ────────────────────────────────────────────────
  describe('Scénarios de flux complets (pipeline multi-opérations)', () => {
    it('✅ pipeline: dépôt → retrait → dépôt → retrait total → zéro', () => {
      let balance = 10000;
      balance = processDeposit(balance, 5000);
      expect(balance).toBe(15000);
      balance = processWithdraw(balance, 3000);
      expect(balance).toBe(12000);
      balance = processDeposit(balance, 1000.5);
      expect(balance).toBe(13000.5);
      balance = processWithdraw(balance, 13000.5);
      expect(balance).toBe(0);
    });

    it('✅ précision monétaire — pas de dérive sur 10 dépôts de 1.1', () => {
      let balance = 0;
      for (let i = 0; i < 10; i++) {
        balance = processDeposit(balance, 1.1);
      }
      expect(balance).toBeCloseTo(11, 1);
    });
  });
});
