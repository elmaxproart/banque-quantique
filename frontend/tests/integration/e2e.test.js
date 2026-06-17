import { describe, it, expect, beforeEach } from 'vitest';

// ── Fonctions de logique partagée (miroir gateway + services) ────────────────

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

const processWireTransfer = (accounts, senderId, senderBank, recipientAccNum, amount, currency) => {
  const updated = JSON.parse(JSON.stringify(accounts));
  const sender = updated[senderId];

  if (!sender || !sender.banks[senderBank]) throw new Error('Source bank not active.');
  if (sender.banks[senderBank].balances[currency] < amount) throw new Error('Insufficient funds in the selected bank asset portfolio.');

  sender.banks[senderBank].balances[currency] = parseFloat(
    (sender.banks[senderBank].balances[currency] - amount).toFixed(4)
  );

  // Find recipient
  let recipientId = null;
  let recipientBank = null;
  for (const uid in updated) {
    for (const bName in updated[uid].banks) {
      if (updated[uid].banks[bName].accountNumber === recipientAccNum) {
        recipientId = uid;
        recipientBank = bName;
      }
    }
  }

  if (recipientId === senderId) throw new Error('Cannot transfer to your own account via external wire.');

  if (recipientId) {
    updated[recipientId].banks[recipientBank].balances[currency] = parseFloat(
      (updated[recipientId].banks[recipientBank].balances[currency] + amount).toFixed(4)
    );
  }

  return { accounts: updated, recipientFound: !!recipientId };
};

// Filtre d'historique
const filterUserTransactions = (transactions, userId) => {
  return transactions.filter(t => t.senderId === userId || t.recipientId === userId).reverse();
};

// ─────────────────────────────────────────────────────────────────────────────

describe('🔗 Flux de registre bout-en-bout — Tests d\'intégration complets', () => {
  let banks;
  let accounts;

  beforeEach(() => {
    banks = {
      "Quantum Core": { balances: { USD: 50000.00, EUR: 12000.00, QTC: 500.00, SOL: 25.00 } },
      "Aether Trust": { balances: { USD: 30000.00, EUR: 8000.00, QTC: 200.00, SOL: 10.00 } },
      "Nova Reserve": { balances: { USD: 10000.00, EUR: 4000.00, QTC: 50.00, SOL: 5.00 } }
    };

    accounts = {
      'user-001': {
        username: 'Alice',
        banks: {
          "Quantum Core": {
            balances: { USD: 50000.00, EUR: 12000.00, QTC: 500.00, SOL: 25.00 },
            accountNumber: 'Q-CORE-11111111'
          },
          "Aether Trust": {
            balances: { USD: 30000.00, EUR: 8000.00, QTC: 200.00, SOL: 10.00 },
            accountNumber: 'A-TRUST-22222222'
          }
        }
      },
      'user-002': {
        username: 'Bob',
        banks: {
          "Nova Reserve": {
            balances: { USD: 10000.00, EUR: 4000.00, QTC: 50.00, SOL: 5.00 },
            accountNumber: 'N-RESERVE-33333333'
          }
        }
      }
    };
  });

  // ── PIPELINE COMPLET ─────────────────────────────────────────────────────────
  describe('Pipeline dépôt → retrait → transfert interbancaire', () => {
    it('✅ exécute un pipeline financier complet avec soldes corrects', () => {
      let state = processDeposit(banks, 'Quantum Core', 5000.00, 'USD');
      expect(state['Quantum Core'].balances.USD).toBe(55000.00);

      state = processWithdraw(state, 'Aether Trust', 2000.00, 'EUR');
      expect(state['Aether Trust'].balances.EUR).toBe(6000.00);

      state = processInterbankTransfer(state, 'Quantum Core', 'Nova Reserve', 15000.00, 'USD');
      expect(state['Quantum Core'].balances.USD).toBe(40000.00);
      expect(state['Nova Reserve'].balances.USD).toBe(25000.00);
    });

    it('✅ les 3 banques restent indépendantes pendant les opérations', () => {
      let state = processDeposit(banks, 'Quantum Core', 10000, 'USD');
      expect(state['Aether Trust'].balances.USD).toBe(30000.00);
      expect(state['Nova Reserve'].balances.USD).toBe(10000.00);
    });

    it('✅ pipeline QTC: dépôt + transfert interbancaire QTC', () => {
      let state = processDeposit(banks, 'Quantum Core', 100, 'QTC');
      expect(state['Quantum Core'].balances.QTC).toBe(600.00);
      state = processInterbankTransfer(state, 'Quantum Core', 'Aether Trust', 300, 'QTC');
      expect(state['Quantum Core'].balances.QTC).toBe(300.00);
      expect(state['Aether Trust'].balances.QTC).toBe(500.00);
    });

    it('✅ conservation de la masse monétaire globale (USD)', () => {
      const totalBefore = Object.values(banks).reduce((sum, b) => sum + b.balances.USD, 0);
      let state = processInterbankTransfer(banks, 'Quantum Core', 'Aether Trust', 5000, 'USD');
      state = processInterbankTransfer(state, 'Aether Trust', 'Nova Reserve', 3000, 'USD');
      const totalAfter = Object.values(state).reduce((sum, b) => sum + b.balances.USD, 0);
      expect(totalAfter).toBeCloseTo(totalBefore, 4);
    });
  });

  // ── VIREMENTS EXTERNES (WIRE) ─────────────────────────────────────────────────
  describe('Virements externes (wire transfer) entre utilisateurs', () => {
    it('✅ transfère des fonds d\'Alice vers Bob correctement', () => {
      const result = processWireTransfer(accounts, 'user-001', 'Quantum Core', 'N-RESERVE-33333333', 5000, 'USD');
      expect(result.accounts['user-001'].banks['Quantum Core'].balances.USD).toBe(45000.00);
      expect(result.accounts['user-002'].banks['Nova Reserve'].balances.USD).toBe(15000.00);
      expect(result.recipientFound).toBe(true);
    });

    it('✅ virement vers compte externe inconnu (smart contract) — débite seulement', () => {
      const result = processWireTransfer(accounts, 'user-001', 'Quantum Core', 'EXTERNAL-VAULT-99999', 2000, 'USD');
      expect(result.accounts['user-001'].banks['Quantum Core'].balances.USD).toBe(48000.00);
      expect(result.recipientFound).toBe(false);
    });

    it('❌ rejette si fonds insuffisants pour le virement', () => {
      expect(() =>
        processWireTransfer(accounts, 'user-001', 'Quantum Core', 'N-RESERVE-33333333', 200000, 'USD')
      ).toThrow('Insufficient funds in the selected bank asset portfolio.');
    });

    it('❌ rejette si la banque source n\'existe pas', () => {
      expect(() =>
        processWireTransfer(accounts, 'user-001', 'Ghost Bank', 'N-RESERVE-33333333', 1000, 'USD')
      ).toThrow('Source bank not active.');
    });

    it('❌ rejette un auto-virement (même utilisateur)', () => {
      // Ajouter un compte Alice dans Nova Reserve pour tester l'auto-virement
      accounts['user-001'].banks['Nova Reserve'] = {
        balances: { USD: 5000, EUR: 1000, QTC: 10, SOL: 2 },
        accountNumber: 'N-RESERVE-ALICE001'
      };
      expect(() =>
        processWireTransfer(accounts, 'user-001', 'Quantum Core', 'N-RESERVE-ALICE001', 1000, 'USD')
      ).toThrow('Cannot transfer to your own account via external wire.');
    });
  });

  // ── HISTORIQUE DES TRANSACTIONS ──────────────────────────────────────────────
  describe('Filtrage et tri de l\'historique des transactions', () => {
    const transactions = [
      { id: 't1', senderId: 'user-001', recipientId: 'user-002', amount: 100, currency: 'USD', timestamp: '2026-01-01T10:00:00Z' },
      { id: 't2', senderId: 'user-002', recipientId: 'user-003', amount: 200, currency: 'EUR', timestamp: '2026-01-02T10:00:00Z' },
      { id: 't3', senderId: 'SYSTEM', recipientId: 'user-001', amount: 50000, currency: 'USD', timestamp: '2026-01-03T10:00:00Z' },
      { id: 't4', senderId: 'user-003', recipientId: 'user-001', amount: 300, currency: 'QTC', timestamp: '2026-01-04T10:00:00Z' },
    ];

    it('✅ retourne uniquement les transactions de l\'utilisateur', () => {
      const userTx = filterUserTransactions(transactions, 'user-001');
      expect(userTx).toHaveLength(3);
      userTx.forEach(t => {
        expect(t.senderId === 'user-001' || t.recipientId === 'user-001').toBe(true);
      });
    });

    it('✅ retourne les transactions en ordre inversé (plus récente en premier)', () => {
      const userTx = filterUserTransactions(transactions, 'user-001');
      expect(userTx[0].id).toBe('t4'); // la plus récente en premier
      expect(userTx[userTx.length - 1].id).toBe('t1'); // la plus ancienne en dernier
    });

    it('✅ retourne un tableau vide pour un utilisateur sans historique', () => {
      const userTx = filterUserTransactions(transactions, 'user-999');
      expect(userTx).toHaveLength(0);
    });

    it('✅ inclut les transactions reçues du système (dépôts externes)', () => {
      const userTx = filterUserTransactions(transactions, 'user-001');
      const systemTx = userTx.find(t => t.senderId === 'SYSTEM');
      expect(systemTx).toBeDefined();
    });
  });

  // ── SCÉNARIOS MULTI-DEVISES ──────────────────────────────────────────────────
  describe('Opérations multi-devises', () => {
    it('✅ les opérations USD n\'affectent pas EUR', () => {
      const state = processDeposit(banks, 'Quantum Core', 10000, 'USD');
      expect(state['Quantum Core'].balances.EUR).toBe(12000.00);
    });

    it('✅ les opérations SOL n\'affectent pas QTC', () => {
      const state = processWithdraw(banks, 'Aether Trust', 5, 'SOL');
      expect(state['Aether Trust'].balances.QTC).toBe(200.00);
    });

    it('✅ transfert interbancaire SOL', () => {
      const state = processInterbankTransfer(banks, 'Quantum Core', 'Nova Reserve', 10, 'SOL');
      expect(state['Quantum Core'].balances.SOL).toBe(15.00);
      expect(state['Nova Reserve'].balances.SOL).toBe(15.00);
    });

    it('✅ gère les montants fractionnaires de SOL (précision crypto)', () => {
      const state = processDeposit(banks, 'Nova Reserve', 0.0001, 'SOL');
      expect(state['Nova Reserve'].balances.SOL).toBe(5.0001);
    });

    it('✅ gère les grands montants USD sans dérive', () => {
      const state = processDeposit(banks, 'Quantum Core', 999999.9999, 'USD');
      expect(state['Quantum Core'].balances.USD).toBeCloseTo(1049999.9999, 4);
    });
  });

  // ── ROBUSTESSE ───────────────────────────────────────────────────────────────
  describe('Robustesse et immutabilité', () => {
    it('✅ les opérations ne modifient jamais l\'état original', () => {
      const originalUSD = banks['Quantum Core'].balances.USD;
      processDeposit(banks, 'Quantum Core', 99999, 'USD');
      expect(banks['Quantum Core'].balances.USD).toBe(originalUSD);
    });

    it('✅ chaînage de 10 virements interbancaires sans erreur', () => {
      let state = JSON.parse(JSON.stringify(banks));
      for (let i = 0; i < 10; i++) {
        state = processInterbankTransfer(state, 'Quantum Core', 'Aether Trust', 100, 'USD');
        state = processInterbankTransfer(state, 'Aether Trust', 'Quantum Core', 100, 'USD');
      }
      expect(state['Quantum Core'].balances.USD).toBe(50000.00);
    });

    it('❌ lève une erreur si solde épuisé après plusieurs retraits', () => {
      let state = processWithdraw(banks, 'Nova Reserve', 5000, 'USD');
      state = processWithdraw(state, 'Nova Reserve', 4999.9999, 'USD');
      // Il reste 0.0001 USD — tenter de retirer 1 doit échouer
      expect(() => processWithdraw(state, 'Nova Reserve', 1, 'USD')).toThrow('Insufficient funds.');
    });
  });
});
