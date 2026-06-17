/**
 * @module banking-logic
 * @description Logique métier pure du système bancaire Quantique.
 * Ces fonctions sont extraites des services pour permettre le test unitaire
 * avec couverture de code instrumentée.
 */

// ─── AUTHENTIFICATION ─────────────────────────────────────────────────────────

/**
 * Valide les données d'inscription d'un nouvel utilisateur.
 * @param {string} username - Nom d'utilisateur (min 3 chars)
 * @param {string} password - Mot de passe (min 6 chars)
 * @param {string} email - Adresse email valide
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateRegisterInput(username, password, email) {
  if (!username || username.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters.' };
  }
  if (!password || password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters.' };
  }
  if (!email || !email.includes('@')) {
    return { valid: false, error: 'Invalid email address.' };
  }
  return { valid: true };
}

/**
 * Valide les données de connexion.
 * @param {string} username
 * @param {string} password
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateLoginInput(username, password) {
  if (!username || !password) {
    return { valid: false, error: 'Username and password are required.' };
  }
  return { valid: true };
}

/**
 * Valide le format d'un header Authorization Bearer.
 * @param {string|null|undefined} authHeader
 * @returns {{ valid: boolean, token?: string, error?: string }}
 */
export function validateBearerToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Access token missing or malformed.' };
  }
  const token = authHeader.split(' ')[1];
  if (!token || token.length < 10) {
    return { valid: false, error: 'Token too short.' };
  }
  return { valid: true, token };
}

/**
 * Recherche un utilisateur par username (insensible à la casse).
 * @param {Array} users
 * @param {string} username
 * @returns {object|null}
 */
export function findUserByUsername(users, username) {
  return users.find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
}

/**
 * Recherche un utilisateur par email (insensible à la casse).
 * @param {Array} users
 * @param {string} email
 * @returns {object|null}
 */
export function findUserByEmail(users, email) {
  return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
}

// ─── TRANSACTIONS ─────────────────────────────────────────────────────────────

/**
 * Calcule le nouveau solde après un dépôt.
 * @param {number} balance - Solde actuel
 * @param {number} amount - Montant à déposer (doit être > 0)
 * @returns {number} Nouveau solde arrondi à 4 décimales
 * @throws {Error} Si le montant est nul ou négatif
 */
export function processDeposit(balance, amount) {
  if (amount <= 0) throw new Error('Invalid deposit amount.');
  return parseFloat((balance + amount).toFixed(4));
}

/**
 * Calcule le nouveau solde après un retrait.
 * @param {number} balance - Solde actuel
 * @param {number} amount - Montant à retirer (doit être > 0 et ≤ balance)
 * @returns {number} Nouveau solde arrondi à 4 décimales
 * @throws {Error} Si le montant est invalide ou les fonds sont insuffisants
 */
export function processWithdraw(balance, amount) {
  if (amount <= 0) throw new Error('Invalid withdrawal amount.');
  if (balance < amount) throw new Error('Insufficient funds.');
  return parseFloat((balance - amount).toFixed(4));
}

/**
 * Valide les paramètres d'une opération de transaction (dépôt/retrait).
 * @param {string} bank
 * @param {number|string} amount
 * @param {string} currency
 * @returns {{ valid: boolean, numAmount?: number, error?: string }}
 */
export function validateTransactionInput(bank, amount, currency) {
  if (!bank || !amount || !currency) {
    return { valid: false, error: 'Bank, amount, and currency are required.' };
  }
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return { valid: false, error: 'Invalid amount.' };
  }
  return { valid: true, numAmount };
}

/**
 * Valide les paramètres d'un virement interbancaire.
 * @param {string} sourceBank
 * @param {string} destinationBank
 * @param {number|string} amount
 * @param {string} currency
 * @returns {{ valid: boolean, numAmount?: number, error?: string }}
 */
export function validateInterbankTransfer(sourceBank, destinationBank, amount, currency) {
  if (!sourceBank || !destinationBank || !amount || !currency) {
    return { valid: false, error: 'Source bank, destination bank, amount, and currency are required.' };
  }
  if (sourceBank === destinationBank) {
    return { valid: false, error: 'Source and destination banks must be different.' };
  }
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return { valid: false, error: 'Invalid transfer amount.' };
  }
  return { valid: true, numAmount };
}

/**
 * Valide les paramètres d'un virement externe (wire transfer).
 * @param {string} sourceBank
 * @param {string} recipientAccountNumber
 * @param {number|string} amount
 * @param {string} currency
 * @returns {{ valid: boolean, numAmount?: number, error?: string }}
 */
export function validateWireTransfer(sourceBank, recipientAccountNumber, amount, currency) {
  if (!sourceBank || !recipientAccountNumber || !amount || !currency) {
    return { valid: false, error: 'Source bank, recipient account number, amount, and currency are required.' };
  }
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return { valid: false, error: 'Invalid transfer amount.' };
  }
  return { valid: true, numAmount };
}

/**
 * Applique un dépôt sur le registre comptable (immutable).
 * @param {object} banks - Objet banques (inchangé)
 * @param {string} bank - Nom de la banque
 * @param {number} amount - Montant à déposer
 * @param {string} currency - Devise
 * @returns {object} Nouveau registre banques (copie profonde)
 * @throws {Error} Si la banque ou la devise n'existe pas
 */
export function ledgerDeposit(banks, bank, amount, currency) {
  if (!banks[bank]) throw new Error('Selected bank not active in matrix.');
  if (!(currency in banks[bank].balances)) throw new Error(`Currency ${currency} not supported at ${bank}.`);
  const updated = JSON.parse(JSON.stringify(banks));
  updated[bank].balances[currency] = parseFloat((updated[bank].balances[currency] + amount).toFixed(4));
  return updated;
}

/**
 * Applique un retrait sur le registre comptable (immutable).
 * @param {object} banks
 * @param {string} bank
 * @param {number} amount
 * @param {string} currency
 * @returns {object} Nouveau registre banques
 * @throws {Error} Si banque/devise inexistante ou fonds insuffisants
 */
export function ledgerWithdraw(banks, bank, amount, currency) {
  if (!banks[bank]) throw new Error('Selected bank not active in matrix.');
  if (!(currency in banks[bank].balances)) throw new Error(`Currency ${currency} not supported at ${bank}.`);
  if (banks[bank].balances[currency] < amount) throw new Error('Insufficient funds for withdrawal.');
  const updated = JSON.parse(JSON.stringify(banks));
  updated[bank].balances[currency] = parseFloat((updated[bank].balances[currency] - amount).toFixed(4));
  return updated;
}

/**
 * Applique un virement interbancaire sur le registre (immutable).
 * @param {object} banks
 * @param {string} source - Banque source
 * @param {string} dest - Banque destination
 * @param {number} amount
 * @param {string} currency
 * @returns {object} Nouveau registre banques
 * @throws {Error} Si banques invalides ou fonds insuffisants
 */
export function ledgerInterbankTransfer(banks, source, dest, amount, currency) {
  if (!banks[source] || !banks[dest]) throw new Error('Selected bank portfolios are invalid.');
  if (!(currency in banks[source].balances)) throw new Error(`Currency ${currency} not found in source bank.`);
  if (banks[source].balances[currency] < amount) throw new Error('Insufficient funds in source bank.');
  const updated = JSON.parse(JSON.stringify(banks));
  updated[source].balances[currency] = parseFloat((updated[source].balances[currency] - amount).toFixed(4));
  updated[dest].balances[currency] = parseFloat((updated[dest].balances[currency] + amount).toFixed(4));
  return updated;
}

/**
 * Filtre les transactions d'un utilisateur et les trie par date décroissante.
 * @param {Array} transactions - Tableau de toutes les transactions
 * @param {string} userId - ID de l'utilisateur
 * @returns {Array} Transactions de l'utilisateur (plus récentes en premier)
 */
export function filterUserTransactions(transactions, userId) {
  return transactions
    .filter(t => t.senderId === userId || t.recipientId === userId)
    .reverse();
}

/**
 * Crée un compte multi-banques par défaut pour un nouvel utilisateur.
 * @param {string} userId
 * @param {string} username
 * @returns {object} Objet compte avec 3 banques et 4 devises chacune
 */
export function createDefaultAccount(userId, username) {
  return {
    userId,
    username,
    banks: {
      "Quantum Core": {
        balances: { USD: 50000.00, EUR: 12500.00, QTC: 500.00, SOL: 25.50 },
        accountNumber: `Q-CORE-${Math.floor(10000000 + Math.random() * 90000000)}`
      },
      "Aether Trust": {
        balances: { USD: 30000.00, EUR: 8500.00, QTC: 200.00, SOL: 10.00 },
        accountNumber: `A-TRUST-${Math.floor(10000000 + Math.random() * 90000000)}`
      },
      "Nova Reserve": {
        balances: { USD: 15000.00, EUR: 4000.00, QTC: 50.00, SOL: 5.00 },
        accountNumber: `N-RESERVE-${Math.floor(10000000 + Math.random() * 90000000)}`
      }
    }
  };
}

/**
 * Valide l'autorisation d'une commande CLI de diagnostic.
 * @param {string|null} command
 * @returns {{ authorized: boolean, error?: string }}
 */
export function validateDiagnosticCommand(command) {
  if (!command) return { authorized: false, error: 'Command is required.' };
  if (!command.startsWith('npx vitest run') && !command.startsWith('node tests/manual/')) {
    return { authorized: false, error: 'Command not authorized.' };
  }
  return { authorized: true };
}
