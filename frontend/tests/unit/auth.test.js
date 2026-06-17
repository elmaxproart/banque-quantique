import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import {
  validateRegisterInput,
  validateLoginInput,
  validateBearerToken,
  findUserByUsername,
  findUserByEmail,
  filterUserTransactions,
  createDefaultAccount,
  validateDiagnosticCommand
} from '../../src/lib/banking-logic.js';

// Logique crypto locale (pbkdf2 — identique à auth/server.js)
const hashPassword = (password, salt) => {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
};

const isUsernameTaken = (users, username) => !!findUserByUsername(users, username);
const isEmailTaken = (users, email) => !!findUserByEmail(users, email);

// ─────────────────────────────────────────────────────────────────────────────

describe('🔐 Service d\'authentification — Suite de tests complète', () => {

  // ── VALIDATION INSCRIPTION ──────────────────────────────────────────────────
  describe('Validation des données d\'inscription', () => {
    it('✅ accepte des identifiants valides', () => {
      expect(validateRegisterInput('NeoUser', 'cybersecret123', 'neo@qbank.net').valid).toBe(true);
    });

    it('❌ rejette un username vide', () => {
      const r = validateRegisterInput('', 'password123', 'a@b.com');
      expect(r.valid).toBe(false);
      expect(r.error).toContain('Username');
    });

    it('❌ rejette un username null', () => {
      const r = validateRegisterInput(null, 'password123', 'a@b.com');
      expect(r.valid).toBe(false);
    });

    it('❌ rejette un username trop court (< 3 chars)', () => {
      const r = validateRegisterInput('Ne', 'cybersecret123', 'neo@qbank.net');
      expect(r.valid).toBe(false);
      expect(r.error).toContain('Username');
    });

    it('✅ accepte un username exactement 3 chars', () => {
      expect(validateRegisterInput('Neo', 'password123', 'a@b.com').valid).toBe(true);
    });

    it('❌ rejette un mot de passe vide', () => {
      const r = validateRegisterInput('NeoUser', '', 'a@b.com');
      expect(r.valid).toBe(false);
      expect(r.error).toContain('Password');
    });

    it('❌ rejette un mot de passe null', () => {
      const r = validateRegisterInput('NeoUser', null, 'a@b.com');
      expect(r.valid).toBe(false);
    });

    it('❌ rejette un mot de passe trop court (< 6 chars)', () => {
      const r = validateRegisterInput('NeoUser', '123', 'neo@qbank.net');
      expect(r.valid).toBe(false);
      expect(r.error).toContain('Password');
    });

    it('✅ accepte un mot de passe exactement 6 chars', () => {
      expect(validateRegisterInput('NeoUser', '123456', 'a@b.com').valid).toBe(true);
    });

    it('❌ rejette un email sans @', () => {
      const r = validateRegisterInput('NeoUser', 'cybersecret123', 'neoqbank.net');
      expect(r.valid).toBe(false);
      expect(r.error).toContain('email');
    });

    it('❌ rejette un email vide', () => {
      const r = validateRegisterInput('NeoUser', 'password123', '');
      expect(r.valid).toBe(false);
    });

    it('❌ rejette un email null', () => {
      const r = validateRegisterInput('NeoUser', 'password123', null);
      expect(r.valid).toBe(false);
    });
  });

  // ── VALIDATION CONNEXION ────────────────────────────────────────────────────
  describe('Validation des données de connexion', () => {
    it('✅ accepte des identifiants de connexion valides', () => {
      expect(validateLoginInput('NeoUser', 'password123').valid).toBe(true);
    });

    it('❌ rejette un username manquant', () => {
      expect(validateLoginInput('', 'password').valid).toBe(false);
    });

    it('❌ rejette un mot de passe manquant', () => {
      expect(validateLoginInput('user', '').valid).toBe(false);
    });

    it('❌ rejette les deux champs null', () => {
      expect(validateLoginInput(null, null).valid).toBe(false);
    });
  });

  // ── CRYPTOGRAPHIE ───────────────────────────────────────────────────────────
  describe('Cryptographie PBKDF2 — Hachage de mots de passe', () => {
    it('✅ génère des hachages cohérents (même password + sel = même hash)', () => {
      const salt = 'quantum-salt-129';
      expect(hashPassword('mysecretpassword', salt)).toBe(hashPassword('mysecretpassword', salt));
    });

    it('✅ génère des hachages distincts pour des sels différents', () => {
      expect(hashPassword('password', 'salt-A')).not.toBe(hashPassword('password', 'salt-B'));
    });

    it('✅ génère des hachages distincts pour des mots de passe différents', () => {
      const salt = 'shared-salt';
      expect(hashPassword('password1', salt)).not.toBe(hashPassword('password2', salt));
    });

    it('✅ produit un hash hexadécimal de longueur 128 (64 bytes)', () => {
      const hash = hashPassword('test', 'salt');
      expect(hash).toHaveLength(128);
      expect(hash).toMatch(/^[a-f0-9]+$/);
    });

    it('✅ vérifie l\'authentification par comparaison de hash', () => {
      const salt = crypto.randomBytes(16).toString('hex');
      const storedHash = hashPassword('MonMotDePasse!', salt);
      const loginHash = hashPassword('MonMotDePasse!', salt);
      expect(loginHash).toBe(storedHash);
    });

    it('❌ détecte un mot de passe incorrect', () => {
      const salt = crypto.randomBytes(16).toString('hex');
      const storedHash = hashPassword('MonMotDePasse!', salt);
      const wrongHash = hashPassword('MauvaisMotDePasse', salt);
      expect(wrongHash).not.toBe(storedHash);
    });
  });

  // ── VÉRIFICATION TOKEN ──────────────────────────────────────────────────────
  describe('Validation du header Authorization Bearer', () => {
    it('✅ accepte un header Bearer valide', () => {
      const r = validateBearerToken('Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.sig');
      expect(r.valid).toBe(true);
    });

    it('❌ rejette un header absent (null)', () => {
      expect(validateBearerToken(null).valid).toBe(false);
    });

    it('❌ rejette un header absent (undefined)', () => {
      expect(validateBearerToken(undefined).valid).toBe(false);
    });

    it('❌ rejette un header sans préfixe Bearer', () => {
      expect(validateBearerToken('Token eyJhbGc...').valid).toBe(false);
    });

    it('❌ rejette un header Basic (mauvais schéma)', () => {
      expect(validateBearerToken('Basic dXNlcjpwYXNz').valid).toBe(false);
    });

    it('❌ rejette un token trop court après Bearer', () => {
      expect(validateBearerToken('Bearer short').valid).toBe(false);
    });
  });

  // ── GESTION DES UTILISATEURS ────────────────────────────────────────────────
  describe('Gestion en mémoire des utilisateurs', () => {
    const users = [
      { id: 'u1', username: 'Alice', email: 'alice@qbank.net', salt: 'salt1', password: 'hash1' },
      { id: 'u2', username: 'Bob', email: 'bob@qbank.net', salt: 'salt2', password: 'hash2' }
    ];

    it('✅ trouve un utilisateur par username (insensible à la casse)', () => {
      expect(findUserByUsername(users, 'alice')).not.toBeNull();
      expect(findUserByUsername(users, 'ALICE')).not.toBeNull();
      expect(findUserByUsername(users, 'Alice')).not.toBeNull();
    });

    it('❌ retourne null pour un username inexistant', () => {
      expect(findUserByUsername(users, 'Charlie')).toBeNull();
    });

    it('✅ trouve un utilisateur par email (insensible à la casse)', () => {
      expect(findUserByEmail(users, 'BOB@QBANK.NET')).not.toBeNull();
    });

    it('❌ retourne null pour un email inexistant', () => {
      expect(findUserByEmail(users, 'ghost@qbank.net')).toBeNull();
    });

    it('✅ détecte un username déjà pris', () => {
      expect(isUsernameTaken(users, 'Alice')).toBe(true);
    });

    it('✅ confirme qu\'un username est libre', () => {
      expect(isUsernameTaken(users, 'NewUser')).toBe(false);
    });

    it('✅ détecte un email déjà enregistré', () => {
      expect(isEmailTaken(users, 'bob@qbank.net')).toBe(true);
    });

    it('✅ confirme qu\'un email est disponible', () => {
      expect(isEmailTaken(users, 'new@qbank.net')).toBe(false);
    });
  });

  // ── GESTION DES TRANSACTIONS ET DIAGNOSTICS ────────────────────────────
  describe('Filtre des transactions et diagnostics', () => {
    it('✅ filtre les transactions d\'un utilisateur', () => {
      const txs = [
        { senderId: 'u1', recipientId: 'u2', amount: 100 },
        { senderId: 'u3', recipientId: 'u4', amount: 200 },
        { senderId: 'u2', recipientId: 'u3', amount: 300 }
      ];
      const res = filterUserTransactions(txs, 'u2');
      expect(res).toHaveLength(2);
      expect(res[0].amount).toBe(300); // reverse order
      expect(res[1].amount).toBe(100);
    });

    it('✅ valide les commandes de diagnostic autorisées', () => {
      expect(validateDiagnosticCommand('npx vitest run tests/unit/auth.test.js').authorized).toBe(true);
      expect(validateDiagnosticCommand('node tests/manual/loadTest.js').authorized).toBe(true);
      expect(validateDiagnosticCommand('').authorized).toBe(false);
      expect(validateDiagnosticCommand(null).authorized).toBe(false);
      expect(validateDiagnosticCommand('rm -rf /').authorized).toBe(false);
    });
  });

  // ── GESTION DES COMPTES PAR DÉFAUT ───────────────────────────────────────
  describe('Création de compte par défaut', () => {
    it('✅ crée un compte multi-banques par défaut valide', () => {
      const account = createDefaultAccount('u123', 'NeoUser');
      expect(account.userId).toBe('u123');
      expect(account.username).toBe('NeoUser');
      expect(account.banks).toHaveProperty('Quantum Core');
      expect(account.banks).toHaveProperty('Aether Trust');
      expect(account.banks).toHaveProperty('Nova Reserve');
      expect(account.banks['Quantum Core'].balances.USD).toBe(50000.00);
    });
  });

  // ── GENERATION UUID ──────────────────────────────────────────────────────────
  describe('Génération d\'identifiants uniques', () => {
    it('✅ génère des UUIDs uniques pour chaque utilisateur', () => {
      const ids = Array.from({ length: 5 }, () => crypto.randomUUID());
      const unique = new Set(ids);
      expect(unique.size).toBe(5);
    });

    it('✅ les UUIDs respectent le format v4 (RFC 4122)', () => {
      const uuid = crypto.randomUUID();
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('✅ génère des sels aléatoires uniques', () => {
      const s1 = crypto.randomBytes(16).toString('hex');
      const s2 = crypto.randomBytes(16).toString('hex');
      expect(s1).not.toBe(s2);
    });

    it('✅ les sels sont des chaînes hexadécimales de 32 chars', () => {
      const salt = crypto.randomBytes(16).toString('hex');
      expect(salt).toHaveLength(32);
      expect(salt).toMatch(/^[a-f0-9]+$/);
    });
  });
});
