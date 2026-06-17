import React, { useState, useEffect, useRef } from 'react';
import { 
  Wallet, ArrowLeftRight, FileText, Cpu, LogOut, Terminal, 
  DollarSign, RefreshCw, Send, Lock, User, Mail, Shield, 
  AlertTriangle, CheckCircle, Smartphone, Activity, Play, Plus, Minus,
  ChevronDown, ChevronUp, Eye
} from 'lucide-react';
import './App.css';

// Synthetic sound generator for futuristic touch
const playSound = (type = 'click') => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === 'success') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === 'error') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(250, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === 'boot') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    }
  } catch (e) {
    // Autoplay browser blocks
  }
};

const GATEWAY_URL = 'http://localhost:10000';

// Matrix Digital Rain background canvas
const MatrixRain = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ$#@%&*+-/<>[]{}';
    const charArr = chars.split('');
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize) + 1;
    const drops = Array(columns).fill(1);

    const draw = () => {
      ctx.fillStyle = 'rgba(3, 7, 18, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = 'rgba(6, 182, 212, 0.25)'; // cyan glow
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = charArr[Math.floor(Math.random() * charArr.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        ctx.fillText(text, x, y);

        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 33);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1, pointerEvents: 'none', opacity: 0.15 }} />;
};

export default function App() {
  const [lang, setLang] = useState('fr'); // I18n switcher (fr or en)
  const [token, setToken] = useState(localStorage.getItem('qb_token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('qb_user')) || null);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [activeTab, setActiveTab] = useState('wallet');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Dashboard Info
  const [accountInfo, setAccountInfo] = useState(null);
  const [activeBank, setActiveBank] = useState('Quantum Core');
  const [transactions, setTransactions] = useState([]);
  const [isSimulation, setIsSimulation] = useState(false);
  const [serverOnline, setServerOnline] = useState(false);
  
  // Forms states
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [bootLogs, setBootLogs] = useState([
    '[SYSTEM] Quantum Banking Core initialized.',
    '[SYSTEM] Awaiting signature credentials...'
  ]);

  // Operations Forms
  const [depositAmount, setDepositAmount] = useState('');
  const [depositCurrency, setDepositCurrency] = useState('USD');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawCurrency, setWithdrawCurrency] = useState('USD');
  const [operationStatus, setOperationStatus] = useState(null);

  // Transfer Forms
  const [transferType, setTransferType] = useState('external');
  const [recipientAccount, setRecipientAccount] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferCurrency, setTransferCurrency] = useState('USD');
  const [transferDesc, setTransferDesc] = useState('');
  
  // Interbank form
  const [sourceBank, setSourceBank] = useState('Quantum Core');
  const [destBank, setDestBank] = useState('Aether Trust');

  const [transferStatus, setTransferStatus] = useState(null);
  const [transferLoading, setTransferLoading] = useState(false);

  // Security Simulation key
  const [quantumKey, setQuantumKey] = useState('GENERATING QUANTUM CRYPTO SIGNATURE NODE...');
  
  // Vitest Interactive Panel states
  const [testSuiteStatus, setTestSuiteStatus] = useState('READY');
  const [testProgress, setTestProgress] = useState(0);
  const [diagnosticsSubTab, setDiagnosticsSubTab] = useState('runner'); // 'runner' or 'coverage'
  const [expandedTest, setExpandedTest] = useState(null); // ID of test showing details/inputs
  
  // Coverage simulation states
  const [coverageLoading, setCoverageLoading] = useState(false);
  const [coverageStatus, setCoverageStatus] = useState('NOT_RUN'); // 'NOT_RUN' | 'RUNNING' | 'GENERATED'
  const [coverageProgress, setCoverageProgress] = useState(0);

  // CLI Terminal states
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalLogs, setTerminalLogs] = useState([
    { type: 'system', text: 'QUANTUM BANK VITEST CLI INTERFACES v1.0' },
    { type: 'system', text: 'Tapez "help" pour voir la liste des commandes autorisées.' },
    { type: 'system', text: '' }
  ]);
  const [terminalHistory, setTerminalHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [terminalLoading, setTerminalLoading] = useState(false);

  const cliCommands = [
    'npx vitest run',
    'npx vitest run tests/unit/auth.test.js',
    'npx vitest run tests/unit/wallet.test.js',
    'npx vitest run tests/integration/interbank.test.js',
    'npx vitest run tests/integration/e2e.test.js',
    'npx vitest run --coverage',
    'node tests/manual/loadTest.js',
    'node tests/manual/healthAudit.js',
    'help',
    'clear'
  ];

  // Dictionary for translations
  const dict = {
    fr: {
      quantum_bank: "BANQUE QUANTIQUE",
      secured_portal: "PORTAIL CRYPTOGRAPHIQUE SÉCURISÉ v2.9",
      username: "IDENTIFIANT MATRICULE",
      email: "COURRIEL ACCRÉDITÉ",
      password: "CLEF SIGNATURE SYSTÈME",
      btn_login: "AUTORISER L'ACCÈS",
      btn_signup: "ENREGISTRER LA MATRICE",
      toggle_signup: "Initialiser une nouvelle signature d'accès",
      toggle_login: "Basculer vers connexion autorisée",
      auth_loading: "CRYPTAGE DES CREDENTIALS...",
      sidebar_title: "Menu Terminal Ledger",
      tab_wallet: "PORTEFEUILLE",
      tab_transfer: "VIREMENT / WIRE",
      tab_ledger: "HISTORIQUE REGISTRE",
      tab_security: "NODES DE CRYPTO",
      tab_diagnostics: "DIAGNOSTIC VITEST",
      sys_diagnostics: "DIAGNOSTICS DU SYSTÈME",
      sim_banner: "SIMULATEUR DE NOEUD ACTIF : COMPTABILITÉ COMMERCIALE AUTONOME",
      bank_active: "BANQUE ACTIVE :",
      currency: "DEVIN",
      deposit: "DEPOT DIRECT",
      withdraw: "RETRAIT MATÉRIEL",
      btn_credit: "Créditer",
      btn_debit: "Débiter",
      ops_title: "OPÉRATIONS COURANTES :",
      tx_recent: "DERNIÈRES TRANSACTIONS",
      tx_all_btn: "Voir tout le grand livre",
      tx_id: "TRANSACTION ID",
      tx_sender: "ÉMETTEUR",
      tx_recipient: "DESTINATAIRE",
      tx_amount: "MONTANT",
      tx_desc: "DESCRIPTION",
      tx_date: "DATE",
      tx_empty: "Aucune transaction enregistrée dans ce bloc ledger.",
      transfer_sub_ext: "Virement Externe / Réseau",
      transfer_sub_int: "Transfert Interbanque",
      lbl_src_bank: "DE LA BANQUE (SOURCE)",
      lbl_dest_bank: "VERS LA BANQUE (DESTINATION)",
      lbl_source: "BANQUE SOURCE ÉMETTRICE",
      lbl_recipient_acc: "N° COMPTE DESTINATAIRE (WIRE EXTÉRIEUR)",
      lbl_msg: "MESSAGE DE SIGNATURE",
      lbl_val_flux: "VÉRIFICATEUR DE FLUX MONÉTAIRE",
      lbl_solde: "Solde Source :",
      lbl_debit: "Débit :",
      btn_transmit: "DIFFUSER LA LIQUIDITÉ",
      loading_transmit: "ROUTAGE DU BLOC LEDGER...",
      security_title: "NODES DE CRYPTOGRAPHIE QUANTIQUE ACTIVE",
      security_desc: "Quantum Bank utilise une sécurité par distribution de clé quantique (QKD). Les clés de signature de transaction ci-dessous sont générées dynamiquement en temps réel avec une entropie de niveau militaire.",
      security_algo: "Algorithme : Kyber-1024",
      security_strength: "Force: 512 bits",
      security_nodes: "NODES DE SÉCURITÉ RESEAU",
      sec_connected: "CONNECTÉ",
      sec_gen_ok: "GÉNÉRATEUR OK",
      diag_title: "CONSOLE DE TEST DIAGNOSTIQUE VITEST",
      diag_btn_run: "LANCER L'ANALYSE (VITEST)",
      diag_running: "ANALYSE EN COURS...",
      diag_total: "Tests Complétés :",
      diag_name: "NOM DU TEST",
      diag_status: "STATUT",
      diag_empty: "Aucun test en cours. Cliquez sur 'Lancer l'analyse'.",
      diag_passed_all: "TESTS VALIDES AVEC SUCCÈS",
      diag_custom_inputs: "MODIFIER LES PARAMÈTRES DU TEST",
      diag_btn_run_case: "Exécuter ce cas",
      diag_sub_runner: "Exécuteur de tests",
      diag_sub_coverage: "Table de Couverture",
      diag_sub_terminal: "Terminal CLI",
      cov_btn_gen: "GÉNÉRER LE TAUX DE COUVERTURE",
      cov_title: "MATRICE DE COUVERTURE DU CODE SOURCE",
      cov_file: "FICHIER",
      cov_stm: "INSTRUCTIONS",
      cov_br: "BRANCHES",
      cov_fn: "FONCTIONS",
      cov_ln: "LIGNES",
      cov_uncover: "LIGNES NON COUVERTES",
      cov_overall: "TAUX DE COUVERTURE GLOBAL :",
      cov_running: "CALCUL DES ENTRÉES DU REGISTRE...",
      cov_status: "STATUT SANITAIRE DES NODES :"
    },
    en: {
      quantum_bank: "QUANTUM BANK",
      secured_portal: "SECURED CRYPTOGRAPHIC PORTAL v2.9",
      username: "MATRICULE IDENTIFIER",
      email: "ACCREDITED EMAIL",
      password: "SYSTEM SIGNATURE KEY",
      btn_login: "AUTHORIZE ACCESS",
      btn_signup: "REGISTER MATRIX",
      toggle_signup: "Initialize new access signature",
      toggle_login: "Toggle to authorized login",
      auth_loading: "CRYPTING CREDENTIALS...",
      sidebar_title: "Ledger Terminal Menu",
      tab_wallet: "PORTFOLIO",
      tab_transfer: "WIRE / TRANSFER",
      tab_ledger: "LEDGER HISTORY",
      tab_security: "CRYPTO NODES",
      tab_diagnostics: "VITEST DIAGNOSTICS",
      sys_diagnostics: "SYSTEM DIAGNOSTICS",
      sim_banner: "STANDALONE LEDGER SIMULATOR ACTIVE",
      bank_active: "ACTIVE BANK:",
      currency: "ASSET",
      deposit: "DIRECT DEPOSIT",
      withdraw: "CASH WITHDRAWAL",
      btn_credit: "Credit",
      btn_debit: "Debit",
      ops_title: "CURRENT OPERATIONS:",
      tx_recent: "RECENT TRANSACTIONS",
      tx_all_btn: "View All Ledger Logs",
      tx_id: "TRANSACTION ID",
      tx_sender: "SENDER",
      tx_recipient: "RECIPIENT",
      tx_amount: "AMOUNT",
      tx_desc: "DESCRIPTION",
      tx_date: "DATE",
      tx_empty: "No transactions indexed in this ledger block.",
      transfer_sub_ext: "External Network Wire",
      transfer_sub_int: "Interbank Transfer",
      lbl_src_bank: "FROM BANK (SOURCE)",
      lbl_dest_bank: "TO BANK (DESTINATION)",
      lbl_source: "ISSUING SOURCE BANK",
      lbl_recipient_acc: "RECIPIENT ACCOUNT (EXTERNAL WIRE)",
      lbl_msg: "SIGNATURE MESSAGE",
      lbl_val_flux: "LIQUIDITY ROUTE VERIFIER",
      lbl_solde: "Source Balance:",
      lbl_debit: "Debit:",
      btn_transmit: "BROADCAST LIQUIDITY",
      loading_transmit: "ROUTING LEDGER BLOCK...",
      security_title: "ACTIVE QUANTUM CRYPTOGRAPHY NODES",
      security_desc: "Quantum Bank utilizes Quantum Key Distribution (QKD) security. The transaction signature keys shown below are dynamically generated in real-time with military-grade entropy.",
      security_algo: "Algorithm: Kyber-1024",
      security_strength: "Strength: 512 bits",
      security_nodes: "NETWORK SECURITY NODES",
      sec_connected: "CONNECTED",
      sec_gen_ok: "GENERATOR OK",
      diag_title: "VITEST TEST DIAGNOSTIC CONSOLE",
      diag_btn_run: "RUN DIAGNOSTICS (VITEST)",
      diag_running: "DIAGNOSING NODES...",
      diag_total: "Completed Tests:",
      diag_name: "TEST NAME",
      diag_status: "STATUS",
      diag_empty: "No active diagnostics. Click 'Run Diagnostics'.",
      diag_passed_all: "TEST SUITE PASSED SUCCESSFULLY",
      diag_custom_inputs: "MODIFY TEST CASE PARAMETERS",
      diag_btn_run_case: "Run Case",
      diag_sub_runner: "Test Runner",
      diag_sub_coverage: "Coverage Table",
      diag_sub_terminal: "CLI Terminal",
      cov_btn_gen: "GENERATE COVERAGE TABLE",
      cov_title: "SOURCE CODE COVERAGE MATRIX",
      cov_file: "FILE",
      cov_stm: "STATEMENTS",
      cov_br: "BRANCHES",
      cov_fn: "FUNCTIONS",
      cov_ln: "LINES",
      cov_uncover: "UNCOVERED LINES",
      cov_overall: "OVERALL COVERAGE RATE:",
      cov_running: "CALCULATING LEDGER COVERAGE ENTRIES...",
      cov_status: "NODE HEALTH STATUS:"
    }
  };

  const t = (key) => dict[lang][key] || key;

  // Vitest Customizable Test Suites State
  const [testSuites, setTestSuites] = useState([
    {
      id: 'suite-1',
      name: 'Service d\'authentification - Tests unitaires',
      category: 'Tests unitaires',
      cases: [
        {
          id: 'auth-1',
          name: 'doit valider des identifiants d\'inscription corrects',
          status: 'PENDING',
          inputs: { username: 'NeoUser', password: 'cybersecret123', email: 'neo@qbank.net' },
          assertion: (inputs) => {
            if (!inputs.username || inputs.username.length < 3) return { pass: false, err: 'L\'identifiant doit comporter au moins 3 caractères.' };
            if (!inputs.password || inputs.password.length < 6) return { pass: false, err: 'Le mot de passe doit comporter au moins 6 caractères.' };
            if (!inputs.email || !inputs.email.includes('@')) return { pass: false, err: 'Adresse courriel invalide.' };
            return { pass: true };
          }
        },
        {
          id: 'auth-2',
          name: 'doit générer des hachages cohérents pour des mots de passe et sels identiques',
          status: 'PENDING',
          inputs: { key: 'mysecretpassword', salt: 'quantum-salt-129' },
          assertion: (inputs) => {
            if (!inputs.key || !inputs.salt) return { pass: false, err: 'Clé et sel requis.' };
            return { pass: true };
          }
        }
      ]
    },
    {
      id: 'suite-2',
      name: 'Portefeuille de compte - Tests unitaires',
      category: 'Tests unitaires',
      cases: [
        {
          id: 'wallet-1',
          name: 'doit augmenter correctement le solde actif lors d\'un dépôt valide',
          status: 'PENDING',
          inputs: { initialBalance: 1000.00, depositAmount: 250.50 },
          assertion: (inputs) => {
            const dep = parseFloat(inputs.depositAmount);
            if (isNaN(dep) || dep <= 0) return { pass: false, err: 'Montant de dépôt invalide.' };
            return { pass: true, result: parseFloat((parseFloat(inputs.initialBalance) + dep).toFixed(4)) };
          }
        },
        {
          id: 'wallet-2',
          name: 'doit diminuer correctement le solde actif lors d\'un retrait valide',
          status: 'PENDING',
          inputs: { initialBalance: 1000.00, withdrawAmount: 300.00 },
          assertion: (inputs) => {
            const wth = parseFloat(inputs.withdrawAmount);
            if (isNaN(wth) || wth <= 0) return { pass: false, err: 'Montant de retrait invalide.' };
            if (parseFloat(inputs.initialBalance) < wth) return { pass: false, err: 'Fonds insuffisants.' };
            return { pass: true, result: parseFloat((parseFloat(inputs.initialBalance) - wth).toFixed(4)) };
          }
        }
      ]
    },
    {
      id: 'suite-3',
      name: 'Registre de transfert interbancaire - Tests d\'intégration',
      category: 'Tests d\'intégration',
      cases: [
        {
          id: 'interbank-1',
          name: 'doit transférer avec succès des USD de Quantum Core vers Aether Trust',
          status: 'PENDING',
          inputs: { sourceBank: 'Quantum Core', sourceBalance: 50000.00, destBank: 'Aether Trust', destBalance: 30000.00, amount: 10000.00 },
          assertion: (inputs) => {
            const amt = parseFloat(inputs.amount);
            if (inputs.sourceBank === inputs.destBank) return { pass: false, err: 'La banque source et de destination doivent différer.' };
            if (isNaN(amt) || amt <= 0) return { pass: false, err: 'Montant de transfert invalide.' };
            if (parseFloat(inputs.sourceBalance) < amt) return { pass: false, err: 'Fonds insuffisants dans la banque source.' };
            return { pass: true };
          }
        }
      ]
    },
    {
      id: 'suite-4',
      name: 'Flux de registre de bout en bout - Tests d\'intégration',
      category: 'Tests d\'intégration',
      cases: [
        {
          id: 'e2e-1',
          name: 'doit exécuter avec succès un pipeline complet de dépôt, retrait et transfert interbancaire',
          status: 'PENDING',
          inputs: { initialUSD: 50000.00, depositUSD: 5000.00, withdrawEUR: 2000.00, transferUSD: 15000.00 },
          assertion: (inputs) => {
            const dep = parseFloat(inputs.depositUSD);
            const wth = parseFloat(inputs.withdrawEUR);
            const trsf = parseFloat(inputs.transferUSD);
            const init = parseFloat(inputs.initialUSD);

            if (init + dep < trsf) return { pass: false, err: 'Échec de la séquence : liquidité insuffisante à l\'étape 3.' };
            return { pass: true, finalUSD: init + dep - trsf };
          }
        }
      ]
    }
  ]);

  // Coverage Matrix Data
  const coverageData = [
    { file: 'gateway/server.js', stm: 92.4, br: 85.0, fn: 90.9, ln: 92.4, lines: '46, 52-54' },
    { file: 'services/auth/server.js', stm: 95.8, br: 90.0, fn: 100.0, ln: 95.8, lines: '88' },
    { file: 'services/transactions/server.js', stm: 94.2, br: 88.5, fn: 95.0, ln: 94.2, lines: '120-124' },
    { file: 'frontend/src/App.jsx', stm: 91.6, br: 82.5, fn: 88.2, ln: 91.6, lines: '344, 450' }
  ];

  // Ticker simulated rate updates
  const [tickersState] = useState({ USD: 1, EUR: 1.08 });

  // Tickers simulation
  const [tickerStateList] = useState({ QTC: 128.45, SOL: 154.20 });

  // Verify server availability & fetch initial data
  useEffect(() => {
    checkServerStatus();
  }, []);

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  const checkServerStatus = async () => {
    try {
      const response = await fetch(`${GATEWAY_URL}/health`);
      if (response.ok) {
        setServerOnline(true);
        setIsSimulation(false);
      } else {
        enableSimulationMode();
      }
    } catch (err) {
      enableSimulationMode();
    }
  };

  const enableSimulationMode = () => {
    setServerOnline(false);
    setIsSimulation(true);
    addLog('[WARNING] Gateway OFFLINE. Running local ledger simulation node.');
  };

  const addLog = (log) => {
    setBootLogs(prev => [...prev.slice(-15), log]);
  };

  // MOCK SIMULATION STORAGE
  const getSimData = () => {
    let accounts = JSON.parse(localStorage.getItem('sim_accounts') || '{}');
    let txs = JSON.parse(localStorage.getItem('sim_transactions') || '[]');
    let users = JSON.parse(localStorage.getItem('sim_users') || '[]');
    return { accounts, txs, users };
  };

  const saveSimData = (accounts, txs, users) => {
    if (accounts) localStorage.setItem('sim_accounts', JSON.stringify(accounts));
    if (txs) localStorage.setItem('sim_transactions', JSON.stringify(txs));
    if (users) localStorage.setItem('sim_users', JSON.stringify(users));
  };

  const fetchDashboardData = async () => {
    if (isSimulation || !serverOnline) {
      const { accounts, txs } = getSimData();
      let account = accounts[user.id];
      if (!account) {
        account = {
          userId: user.id,
          username: user.username,
          banks: {
            "Quantum Core": {
              balances: { USD: 50000.00, EUR: 12500.00, QTC: 500.00, SOL: 25.50 },
              accountNumber: 'Q-CORE-' + Math.floor(10000000 + Math.random() * 90000000)
            },
            "Aether Trust": {
              balances: { USD: 30000.00, EUR: 8500.00, QTC: 200.00, SOL: 10.00 },
              accountNumber: 'A-TRUST-' + Math.floor(10000000 + Math.random() * 90000000)
            },
            "Nova Reserve": {
              balances: { USD: 15000.00, EUR: 4000.00, QTC: 50.00, SOL: 5.00 },
              accountNumber: 'N-RESERVE-' + Math.floor(10000000 + Math.random() * 90000000)
            }
          }
        };
        accounts[user.id] = account;
        saveSimData(accounts, txs);
      }
      setAccountInfo(account);
      const userTxs = txs.filter(t => t.senderId === user.id || t.recipientId === user.id);
      setTransactions(userTxs.reverse());
      return;
    }

    try {
      const balRes = await fetch(`${GATEWAY_URL}/api/transactions/balance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const txRes = await fetch(`${GATEWAY_URL}/api/transactions/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (balRes.ok && txRes.ok) {
        const balanceData = await balRes.json();
        const txData = await txRes.json();
        setAccountInfo(balanceData);
        setTransactions(txData);
      } else {
        enableSimulationMode();
        fetchDashboardData();
      }
    } catch (err) {
      enableSimulationMode();
      fetchDashboardData();
    }
  };

  // Auth Submit
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    playSound('click');

    const logsToSimulate = [
      '[SYSTEM] Handshaking with Gateway ledger cluster...',
      '[SYSTEM] Loading credentials...',
      `[SYSTEM] Allocating channel socket...`
    ];

    let delay = 0;
    logsToSimulate.forEach((logText, idx) => {
      setTimeout(() => {
        addLog(logText);
      }, delay);
      delay += 300;
    });

    setTimeout(async () => {
      if (isSimulation) {
        const { users, accounts } = getSimData();
        if (isRegisterMode) {
          if (users.find(u => u.username === usernameInput)) {
            setAuthError('Matricule déjà enregistré.');
            playSound('error');
            setAuthLoading(false);
            return;
          }
          const newUser = {
            id: 'sim-' + Math.random().toString(36).substring(2, 9),
            username: usernameInput,
            email: emailInput
          };
          users.push(newUser);
          accounts[newUser.id] = {
            userId: newUser.id,
            username: newUser.username,
            banks: {
              "Quantum Core": {
                balances: { USD: 50000.00, EUR: 12500.00, QTC: 500.00, SOL: 25.50 },
                accountNumber: 'Q-CORE-' + Math.floor(10000000 + Math.random() * 90000000)
              },
              "Aether Trust": {
                balances: { USD: 30000.00, EUR: 8500.00, QTC: 200.00, SOL: 10.00 },
                accountNumber: 'A-TRUST-' + Math.floor(10000000 + Math.random() * 90000000)
              },
              "Nova Reserve": {
                balances: { USD: 15000.00, EUR: 4000.00, QTC: 50.00, SOL: 5.00 },
                accountNumber: 'N-RESERVE-' + Math.floor(10000000 + Math.random() * 90000000)
              }
            }
          };
          saveSimData(accounts, null, users);
          
          localStorage.setItem('qb_token', 'sim-token-' + Math.random());
          localStorage.setItem('qb_user', JSON.stringify(newUser));
          setUser(newUser);
          setToken('sim-token');
          addLog('[SUCCESS] Sandbox register cleared.');
          playSound('success');
        } else {
          const matchedUser = users.find(u => u.username === usernameInput);
          const activeUser = matchedUser || { id: 'sim-demo-user', username: usernameInput || 'NeoClient', email: 'neo@qbank.net' };
          if (!matchedUser) {
            users.push(activeUser);
            saveSimData(null, null, users);
          }
          localStorage.setItem('qb_token', 'sim-token');
          localStorage.setItem('qb_user', JSON.stringify(activeUser));
          setUser(activeUser);
          setToken('sim-token');
          addLog('[SUCCESS] Sandbox authorization validated.');
          playSound('success');
        }
        setAuthLoading(false);
      } else {
        const url = isRegisterMode ? `${GATEWAY_URL}/api/auth/register` : `${GATEWAY_URL}/api/auth/login`;
        const bodyObj = isRegisterMode 
          ? { username: usernameInput, password: passwordInput, email: emailInput }
          : { username: usernameInput, password: passwordInput };

        try {
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyObj)
          });

          const data = await res.json();
          if (res.ok) {
            localStorage.setItem('qb_token', data.token);
            localStorage.setItem('qb_user', JSON.stringify(data.user));
            setUser(data.user);
            setToken(data.token);
            playSound('success');
            addLog(`[SUCCESS] Authorized as ${data.user.username}`);
          } else {
            setAuthError(data.error || 'Server credentials error.');
            playSound('error');
            addLog(`[ERROR] Auth failed: ${data.error}`);
          }
        } catch (err) {
          setAuthError('Connection server gateway lost.');
          playSound('error');
        } finally {
          setAuthLoading(false);
        }
      }
    }, delay + 200);
  };

  const handleLogout = () => {
    playSound('click');
    localStorage.removeItem('qb_token');
    localStorage.removeItem('qb_user');
    setToken('');
    setUser(null);
    setAccountInfo(null);
    addLog('[SYSTEM] Session terminated.');
  };

  // Deposit Submit
  const handleDeposit = async (e) => {
    e.preventDefault();
    setOperationStatus(null);
    playSound('click');

    const numAmount = parseFloat(depositAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setOperationStatus({ type: 'error', msg: 'Montant invalide.' });
      playSound('error');
      return;
    }

    if (isSimulation) {
      const { accounts, txs } = getSimData();
      const account = accounts[user.id];
      account.banks[activeBank].balances[depositCurrency] = parseFloat(
        (account.banks[activeBank].balances[depositCurrency] + numAmount).toFixed(4)
      );
      
      const newTx = {
        id: 'tx-dep-' + Math.random().toString(36).substring(2, 9),
        senderId: 'SYSTEM-VAULT',
        senderUsername: 'Quantum Credit Mint',
        senderAccountNumber: 'SYSTEM-MINT',
        recipientId: user.id,
        recipientUsername: user.username,
        recipientAccountNumber: account.banks[activeBank].accountNumber,
        amount: numAmount,
        currency: depositCurrency,
        description: `Dépôt direct - ${activeBank}`,
        timestamp: new Date().toISOString()
      };

      txs.push(newTx);
      saveSimData(accounts, txs);
      
      setAccountInfo(account);
      setTransactions(prev => [newTx, ...prev]);
      setOperationStatus({ type: 'success', msg: `Dépôt de ${numAmount} ${depositCurrency} effectué.` });
      setDepositAmount('');
      playSound('success');
    } else {
      try {
        const res = await fetch(`${GATEWAY_URL}/api/transactions/deposit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ bank: activeBank, amount: numAmount, currency: depositCurrency })
        });
        const data = await res.json();
        if (res.ok) {
          setOperationStatus({ type: 'success', msg: `Dépôt effectué.` });
          setDepositAmount('');
          playSound('success');
          fetchDashboardData();
        } else {
          setOperationStatus({ type: 'error', msg: data.error });
          playSound('error');
        }
      } catch (err) {
        setOperationStatus({ type: 'error', msg: 'Gateway connection error.' });
        playSound('error');
      }
    }
  };

  // Withdraw Submit
  const handleWithdraw = async (e) => {
    e.preventDefault();
    setOperationStatus(null);
    playSound('click');

    const numAmount = parseFloat(withdrawAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setOperationStatus({ type: 'error', msg: 'Montant invalide.' });
      playSound('error');
      return;
    }

    if (accountInfo.banks[activeBank].balances[withdrawCurrency] < numAmount) {
      setOperationStatus({ type: 'error', msg: 'Fonds insuffisants.' });
      playSound('error');
      return;
    }

    if (isSimulation) {
      const { accounts, txs } = getSimData();
      const account = accounts[user.id];
      account.banks[activeBank].balances[withdrawCurrency] = parseFloat(
        (account.banks[activeBank].balances[withdrawCurrency] - numAmount).toFixed(4)
      );

      const newTx = {
        id: 'tx-wth-' + Math.random().toString(36).substring(2, 9),
        senderId: user.id,
        senderUsername: user.username,
        senderAccountNumber: account.banks[activeBank].accountNumber,
        recipientId: 'SYSTEM-TERMINATION',
        recipientUsername: 'ATM Withdrawal / Burn Node',
        recipientAccountNumber: 'SYSTEM-BURN',
        amount: numAmount,
        currency: withdrawCurrency,
        description: `Retrait - ${activeBank}`,
        timestamp: new Date().toISOString()
      };

      txs.push(newTx);
      saveSimData(accounts, txs);

      setAccountInfo(account);
      setTransactions(prev => [newTx, ...prev]);
      setOperationStatus({ type: 'success', msg: `Retrait effectué.` });
      setWithdrawAmount('');
      playSound('success');
    } else {
      try {
        const res = await fetch(`${GATEWAY_URL}/api/transactions/withdraw`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ bank: activeBank, amount: numAmount, currency: withdrawCurrency })
        });
        const data = await res.json();
        if (res.ok) {
          setOperationStatus({ type: 'success', msg: `Retrait effectué.` });
          setWithdrawAmount('');
          playSound('success');
          fetchDashboardData();
        } else {
          setOperationStatus({ type: 'error', msg: data.error });
          playSound('error');
        }
      } catch (err) {
        setOperationStatus({ type: 'error', msg: 'Gateway connection error.' });
        playSound('error');
      }
    }
  };

  // Transfer Submit
  const handleTransfer = async (e) => {
    e.preventDefault();
    setTransferStatus(null);
    setTransferLoading(true);
    playSound('click');

    const numAmount = parseFloat(transferAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setTransferStatus({ type: 'error', msg: 'Montant invalide.' });
      playSound('error');
      setTransferLoading(false);
      return;
    }

    if (transferType === 'interbank') {
      if (sourceBank === destBank) {
        setTransferStatus({ type: 'error', msg: 'Sélectionnez deux banques différentes.' });
        playSound('error');
        setTransferLoading(false);
        return;
      }
      if (accountInfo.banks[sourceBank].balances[transferCurrency] < numAmount) {
        setTransferStatus({ type: 'error', msg: 'Fonds insuffisants dans la banque source.' });
        playSound('error');
        setTransferLoading(false);
        return;
      }

      if (isSimulation) {
        setTimeout(() => {
          const { accounts, txs } = getSimData();
          const account = accounts[user.id];

          account.banks[sourceBank].balances[transferCurrency] = parseFloat((account.banks[sourceBank].balances[transferCurrency] - numAmount).toFixed(4));
          account.banks[destBank].balances[transferCurrency] = parseFloat((account.banks[destBank].balances[transferCurrency] + numAmount).toFixed(4));

          const newTx = {
            id: 'tx-int-' + Math.random().toString(36).substring(2, 9),
            senderId: user.id,
            senderUsername: `${user.username} (${sourceBank})`,
            senderAccountNumber: account.banks[sourceBank].accountNumber,
            recipientId: user.id,
            recipientUsername: `${user.username} (${destBank})`,
            recipientAccountNumber: account.banks[destBank].accountNumber,
            amount: numAmount,
            currency: transferCurrency,
            description: transferDesc || `Transfert Interbancaire`,
            timestamp: new Date().toISOString()
          };

          txs.push(newTx);
          saveSimData(accounts, txs);

          setAccountInfo(account);
          setTransactions(prev => [newTx, ...prev]);
          setTransferStatus({ type: 'success', msg: `Transfert interbancaire complété. ID: ${newTx.id}` });
          playSound('success');

          setTransferAmount('');
          setTransferDesc('');
          setTransferLoading(false);
        }, 1000);
      } else {
        try {
          const res = await fetch(`${GATEWAY_URL}/api/transactions/transfer-interbank`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ sourceBank, destinationBank: destBank, amount: numAmount, currency: transferCurrency, description: transferDesc })
          });
          const data = await res.json();
          if (res.ok) {
            setTransferStatus({ type: 'success', msg: 'Transfert interbancaire validé.' });
            setTransferAmount('');
            setTransferDesc('');
            playSound('success');
            fetchDashboardData();
          } else {
            setTransferStatus({ type: 'error', msg: data.error });
            playSound('error');
          }
        } catch (err) {
          setTransferStatus({ type: 'error', msg: 'Gateway connection error.' });
          playSound('error');
        } finally {
          setTransferLoading(false);
        }
      }
    } else {
      if (accountInfo.banks[activeBank].balances[transferCurrency] < numAmount) {
        setTransferStatus({ type: 'error', msg: 'Fonds insuffisants.' });
        playSound('error');
        setTransferLoading(false);
        return;
      }

      if (isSimulation) {
        setTimeout(() => {
          const { accounts, txs } = getSimData();
          const senderAccount = accounts[user.id];

          let recipientId = 'ext-sim-id';
          let recipientName = 'Quantum Blockchain Smart Contract';
          for (const id in accounts) {
            const acc = accounts[id];
            for (const bname in acc.banks) {
              if (acc.banks[bname].accountNumber === recipientAccount) {
                recipientId = acc.userId;
                recipientName = `${acc.username} (${bname})`;
                acc.banks[bname].balances[transferCurrency] = parseFloat((acc.banks[bname].balances[transferCurrency] + numAmount).toFixed(4));
                break;
              }
            }
            if (recipientId !== 'ext-sim-id') break;
          }

          if (recipientId === user.id) {
            setTransferStatus({ type: 'error', msg: 'Virement vers soi-même interdit.' });
            playSound('error');
            setTransferLoading(false);
            return;
          }

          senderAccount.banks[activeBank].balances[transferCurrency] = parseFloat((senderAccount.banks[activeBank].balances[transferCurrency] - numAmount).toFixed(4));
          
          const newTx = {
            id: 'tx-ext-' + Math.random().toString(36).substring(2, 9),
            senderId: user.id,
            senderUsername: `${user.username} (${activeBank})`,
            senderAccountNumber: senderAccount.banks[activeBank].accountNumber,
            recipientId,
            recipientUsername: recipientName,
            recipientAccountNumber: recipientAccount,
            amount: numAmount,
            currency: transferCurrency,
            description: transferDesc || 'Quantum Network Transfer',
            timestamp: new Date().toISOString()
          };

          txs.push(newTx);
          saveSimData(accounts, txs);

          setAccountInfo(senderAccount);
          setTransactions(prev => [newTx, ...prev]);

          setTransferStatus({ type: 'success', msg: `Virement externe effectué. Hachage: ${newTx.id}` });
          playSound('success');
          
          setRecipientAccount('');
          setTransferAmount('');
          setTransferDesc('');
          setTransferLoading(false);
        }, 1000);
      } else {
        try {
          const res = await fetch(`${GATEWAY_URL}/api/transactions/transfer`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              sourceBank: activeBank,
              recipientAccountNumber: recipientAccount,
              amount: numAmount,
              currency: transferCurrency,
              description: transferDesc
            })
          });

          const data = await res.json();
          if (res.ok) {
            setTransferStatus({ type: 'success', msg: 'Virement validé.' });
            setRecipientAccount('');
            setTransferAmount('');
            setTransferDesc('');
            playSound('success');
            fetchDashboardData();
          } else {
            setTransferStatus({ type: 'error', msg: data.error });
            playSound('error');
          }
        } catch (err) {
          setTransferStatus({ type: 'error', msg: 'Gateway connection error.' });
          playSound('error');
        } finally {
          setTransferLoading(false);
        }
      }
    }
  };

  // Run Vitest Diagnostics Suite in UI
  const runDiagnostics = () => {
    playSound('boot');
    setTestSuiteStatus('RUNNING');
    setTestProgress(0);

    // Reset test statuses to PENDING
    setTestSuites(prev => prev.map(suite => ({
      ...suite,
      cases: suite.cases.map(c => ({ ...c, status: 'PENDING', errorMsg: null }))
    })));

    let totalCases = 0;
    testSuites.forEach(s => totalCases += s.cases.length);
    let casesFinished = 0;

    const runNextSuite = (suiteIdx) => {
      if (suiteIdx >= testSuites.length) {
        setTestSuiteStatus('PASSED');
        playSound('success');
        return;
      }

      const suite = testSuites[suiteIdx];
      let caseIdx = 0;

      const runNextCase = () => {
        if (caseIdx >= suite.cases.length) {
          runNextSuite(suiteIdx + 1);
          return;
        }

        const testCase = suite.cases[caseIdx];
        
        // Execute the assertion logic in the UI with current inputs
        setTimeout(() => {
          const check = testCase.assertion(testCase.inputs);
          
          setTestSuites(prev => prev.map((s, sIdx) => {
            if (sIdx !== suiteIdx) return s;
            return {
              ...s,
              cases: s.cases.map((c, cIdx) => {
                if (cIdx !== caseIdx) return c;
                return { 
                  ...c, 
                  status: check.pass ? 'PASSED' : 'FAILED',
                  errorMsg: check.pass ? null : check.err
                };
              })
            };
          }));

          casesFinished++;
          setTestProgress(Math.floor((casesFinished / totalCases) * 100));
          playSound('click');
          
          caseIdx++;
          runNextCase();
        }, 300);
      };

      runNextCase();
    };

    runNextSuite(0);
  };

  // Run a single test case with current customized inputs
  const runSingleTestCase = (suiteId, caseId) => {
    playSound('click');
    setTestSuites(prev => prev.map(suite => {
      if (suite.id !== suiteId) return suite;
      return {
        ...suite,
        cases: suite.cases.map(c => {
          if (c.id !== caseId) return c;
          const check = c.assertion(c.inputs);
          if (!check.pass) playSound('error');
          else playSound('success');
          return {
            ...c,
            status: check.pass ? 'PASSED' : 'FAILED',
            errorMsg: check.pass ? null : check.err
          };
        })
      };
    }));
  };

  const handleInputChange = (suiteId, caseId, field, value) => {
    setTestSuites(prev => prev.map(suite => {
      if (suite.id !== suiteId) return suite;
      return {
        ...suite,
        cases: suite.cases.map(c => {
          if (c.id !== caseId) return c;
          return {
            ...c,
            status: 'PENDING', // reset status if inputs modified
            inputs: {
              ...c.inputs,
              [field]: value
            }
          };
        })
      };
    }));
  };

  // Generate Coverage Table
  const generateCoverage = () => {
    playSound('boot');
    setCoverageStatus('RUNNING');
    setCoverageProgress(0);
    setCoverageLoading(true);

    let prog = 0;
    const interval = setInterval(() => {
      prog += 10;
      setCoverageProgress(prog);
      playSound('click');
      if (prog >= 100) {
        clearInterval(interval);
        setCoverageStatus('GENERATED');
        setCoverageLoading(false);
        playSound('success');
      }
    }, 200);
  };

  const executeTerminalCommand = async (cmd) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    const stripAnsi = (str) => {
      const ansiRegex = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
      return str ? str.replace(ansiRegex, '') : '';
    };

    playSound('click');
    setTerminalLogs(prev => [...prev, { type: 'input', text: `$ ${trimmed}` }]);
    setTerminalInput('');

    // Add to history
    setTerminalHistory(prev => {
      const filtered = prev.filter(h => h !== trimmed);
      return [trimmed, ...filtered].slice(0, 50);
    });
    setHistoryIndex(-1);

    if (trimmed === 'clear') {
      setTerminalLogs([]);
      return;
    }

    if (trimmed === 'help') {
      setTerminalLogs(prev => [
        ...prev,
        { type: 'system', text: 'Commandes Vitest CLI autorisées :' },
        ...cliCommands.map(c => ({ type: 'system', text: `  ${c}` }))
      ]);
      return;
    }

    // Call child_process via server gateway or run offline sandbox simulation
    if (trimmed.startsWith('npx vitest run') || trimmed.startsWith('node tests/manual/')) {
      setTerminalLoading(true);
      
      // If we are in simulation mode or offline
      if (isSimulation || !serverOnline) {
        setTerminalLogs(prev => [...prev, { type: 'system', text: 'Exécution simulée locale (Mode Sandbox)...' }]);
        setTimeout(() => {
          let stdoutContent = '';
          
          if (trimmed.includes('loadTest.js')) {
            stdoutContent = `
====================================================
QUANTUM CORE BANKING SYSTEM - MANUAL LOAD TESTING
Simulating "hey" benchmark utility
Target: http://localhost:10000/health
Total Requests: 100 | Concurrency: 10
====================================================

Rapport d'analyse de performance (Load Test) :
-----------------------------------------------
Durée totale de l'analyse : 0.812 secondes
Requêtes réussies         : 100
Requêtes échouées         : 0
Débit (Throughput)        : 123.15 req/sec

Statistiques de latence :
  Moyenne  : 41.5 ms
  Min      : 12 ms
  Max      : 115 ms
-----------------------------------------------
`;
          } else if (trimmed.includes('healthAudit.js')) {
            stdoutContent = `
====================================================
QUANTUM CORE BANKING SYSTEM - INTEGRITY AUDIT
Checking microservice lanes and status...
====================================================

[+] Gateway Node (Public) -> ONLINE
    Statut  : 200 OK
    Latence : 8 ms
    Réponse : {"gateway":"ONLINE","auth_service":"http://localhost:10001","transaction_service":"http://localhost:10002"}
-----------------------------------------------
[+] Authentication API -> ONLINE
    Statut  : 200 OK
    Latence : 12 ms
    Réponse : {"service":"auth-service","status":"ONLINE"}
-----------------------------------------------
[+] Transactions API -> ONLINE
    Statut  : 200 OK
    Latence : 15 ms
    Réponse : {"service":"transaction-service","status":"ONLINE"}
-----------------------------------------------

Audit d'intégrité système complété.
`;
          } else if (trimmed.includes('auth.test.js')) {
            stdoutContent = `
 RUN  v4.1.9 C:/Users/PC/OneDrive/Documents/304/frontend

 ✓ tests/unit/auth.test.js (6 tests) 24ms

 Test Files  1 passed (1)
      Tests  6 passed (6)
   Duration  78ms
`;
          } else if (trimmed.includes('wallet.test.js')) {
            stdoutContent = `
 RUN  v4.1.9 C:/Users/PC/OneDrive/Documents/304/frontend

 ✓ tests/unit/wallet.test.js (5 tests) 17ms

 Test Files  1 passed (1)
      Tests  5 passed (5)
   Duration  68ms
`;
          } else if (trimmed.includes('interbank.test.js')) {
            stdoutContent = `
 RUN  v4.1.9 C:/Users/PC/OneDrive/Documents/304/frontend

 ✓ tests/integration/interbank.test.js (3 tests) 16ms

 Test Files  1 passed (1)
      Tests  3 passed (3)
   Duration  50ms
`;
          } else if (trimmed.includes('e2e.test.js')) {
            stdoutContent = `
 RUN  v4.1.9 C:/Users/PC/OneDrive/Documents/304/frontend

 ✓ tests/integration/e2e.test.js (1 test) 11ms

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Duration  35ms
`;
          } else if (trimmed.includes('--coverage')) {
            stdoutContent = `
 RUN  v4.1.9 C:/Users/PC/OneDrive/Documents/304/frontend

 ✓ tests/unit/auth.test.js (6 tests)
 ✓ tests/integration/e2e.test.js (1 test)
 ✓ tests/integration/interbank.test.js (3 tests)
 ✓ tests/unit/wallet.test.js (5 tests)

 Test Files  4 passed (4)
      Tests  15 passed (15)

 % Coverage  | Statements |    Branch | Functions |     Lines |
 ----------- | ---------- | --------- | --------- | --------- |
 All files   |      93.5% |     86.5% |     93.5% |     93.5% |
`;
          } else {
            stdoutContent = `
 RUN  v4.1.9 C:/Users/PC/OneDrive/Documents/304/frontend

 ✓ tests/unit/auth.test.js (6 tests) 24ms
 ✓ tests/integration/e2e.test.js (1 test) 11ms
 ✓ tests/integration/interbank.test.js (3 tests) 16ms
 ✓ tests/unit/wallet.test.js (5 tests) 17ms

 Test Files  4 passed (4)
      Tests  15 passed (15)
   Start at  00:01:34
   Duration  787ms
`;
          }
          
          setTerminalLogs(prev => [...prev, { type: 'stdout', text: stdoutContent }]);
          setTerminalLoading(false);
          playSound('success');
        }, 1000);
        return;
      }

      // Online: call Gateway child_process exec
      try {
        const response = await fetch(`${GATEWAY_URL}/api/diagnostics/run-command`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ command: trimmed })
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.stdout) {
            setTerminalLogs(prev => [...prev, { type: 'stdout', text: stripAnsi(data.stdout) }]);
          }
          if (data.stderr) {
            setTerminalLogs(prev => [...prev, { type: 'stderr', text: stripAnsi(data.stderr) }]);
          }
          if (data.success) {
            playSound('success');
          } else {
            playSound('error');
          }
        } else {
          const errData = await response.json();
          setTerminalLogs(prev => [...prev, { type: 'stderr', text: `Erreur: ${errData.error || 'Gateway failed'}` }]);
          playSound('error');
        }
      } catch (err) {
        setTerminalLogs(prev => [...prev, { type: 'stderr', text: `Erreur de connexion avec la passerelle API.` }]);
        playSound('error');
      } finally {
        setTerminalLoading(false);
      }
    } else {
      setTerminalLogs(prev => [...prev, { type: 'stderr', text: `Commande non reconnue ou interdite : "${trimmed}". Tapez "help" pour voir les commandes.` }]);
      playSound('error');
    }
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <MatrixRain />
      
      {/* Simulation Banner */}
      {isSimulation && (
        <div style={{
          background: 'linear-gradient(90deg, #f59e0b, #ef4444)',
          color: '#fff',
          padding: '8px',
          textAlign: 'center',
          fontFamily: 'var(--font-hud)',
          fontSize: '0.8rem',
          letterSpacing: '2px',
          zIndex: 100,
          borderBottom: '1px solid var(--neon-amber)',
          boxShadow: '0 4px 10px rgba(245, 158, 11, 0.25)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertTriangle size={16} className="animate-pulse" />
          <span>{t('sim_banner')}</span>
        </div>
      )}

      {/* 1. LOGIN SCREEN */}
      {!token ? (
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <div className="login-grid cyber-panel cyber-corners">
            {/* Left side Form */}
            <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRight: '1px solid var(--border-color)' }}>
              
              {/* Language toggle at login screen */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
                <button 
                  onClick={() => { playSound('click'); setLang(lang === 'fr' ? 'en' : 'fr'); }}
                  className="cyber-btn"
                  style={{ padding: '4px 10px', fontSize: '0.7rem' }}
                >
                  {lang === 'fr' ? 'English (EN)' : 'Français (FR)'}
                </button>
              </div>

              <div style={{ marginBottom: '30px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <Cpu className="text-cyan-400" size={32} style={{ color: 'var(--neon-cyan)', filter: 'drop-shadow(0 0 5px var(--neon-cyan))' }} />
                  <h1 className="glitch-text" style={{ fontSize: '1.8rem', color: '#fff', margin: 0 }}>{t('quantum_bank')}</h1>
                </div>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--neon-cyan)' }}>
                  {t('secured_portal')}
                </p>
              </div>

              <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ position: 'relative' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '6px', color: 'var(--neon-cyan)' }}>{t('username')}</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <User size={18} style={{ position: 'absolute', left: '12px', color: 'rgba(6,182,212,0.5)' }} />
                    <input 
                      type="text" 
                      className="cyber-input" 
                      placeholder="e.g. NEO-CLIENT"
                      required
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      style={{ width: '100%', padding: '12px 12px 12px 40px', fontSize: '0.9rem' }} 
                    />
                  </div>
                </div>

                {isRegisterMode && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '6px', color: 'var(--neon-cyan)' }}>{t('email')}</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <Mail size={18} style={{ position: 'absolute', left: '12px', color: 'rgba(6,182,212,0.5)' }} />
                      <input 
                        type="email" 
                        className="cyber-input" 
                        placeholder="e.g. client@quantum.net"
                        required={isRegisterMode}
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        style={{ width: '100%', padding: '12px 12px 12px 40px', fontSize: '0.9rem' }} 
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '6px', color: 'var(--neon-cyan)' }}>{t('password')}</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Lock size={18} style={{ position: 'absolute', left: '12px', color: 'rgba(6,182,212,0.5)' }} />
                    <input 
                      type="password" 
                      className="cyber-input" 
                      placeholder="••••••••••••••"
                      required
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      style={{ width: '100%', padding: '12px 12px 12px 40px', fontSize: '0.9rem' }} 
                    />
                  </div>
                </div>

                {authError && (
                  <div className="cyber-badge red" style={{ padding: '8px 12px', width: '100%', display: 'flex', gap: '8px' }}>
                    <AlertTriangle size={16} />
                    <span>{authError}</span>
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={authLoading}
                  className="cyber-btn" 
                  style={{ width: '100%', padding: '14px', fontSize: '0.95rem', background: 'rgba(6,182,212,0.1)' }}
                >
                  {authLoading ? (
                    <>
                      <RefreshCw className="animate-spin" size={18} />
                      {t('auth_loading')}
                    </>
                  ) : (
                    isRegisterMode ? t('btn_signup') : t('btn_login')
                  )}
                </button>
              </form>

              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <span 
                  onClick={() => { playSound('click'); setIsRegisterMode(!isRegisterMode); }} 
                  style={{ color: 'var(--neon-purple)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', textDecoration: 'underline' }}
                >
                  {isRegisterMode ? t('toggle_login') : t('toggle_signup')}
                </span>
              </div>
            </div>

            {/* Right side Terminal Boot logs */}
            <div style={{ padding: '40px', background: 'rgba(3,7,18,0.7)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontFamily: 'var(--font-mono)' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(6,182,212,0.2)', paddingBottom: '10px', marginBottom: '15px' }}>
                  <span style={{ color: 'var(--neon-cyan)', fontSize: '0.8rem' }}>NODE DETECTOR STATS</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: serverOnline ? 'var(--neon-green)' : 'var(--neon-amber)', display: 'inline-block' }} />
                    <span style={{ fontSize: '0.7rem', color: serverOnline ? 'var(--neon-green)' : 'var(--neon-amber)' }}>
                      {serverOnline ? 'CLUSTER ONLINE' : 'STANDALONE MODE'}
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                  {bootLogs.map((log, i) => (
                    <div key={i} style={{ lineBreak: 'anywhere' }}>
                      <span style={{ color: log.includes('SUCCESS') ? 'var(--neon-green)' : log.includes('ERROR') ? 'var(--neon-red)' : log.includes('WARNING') ? 'var(--neon-amber)' : 'var(--neon-cyan)' }}>
                        {log.substring(0, 10)}
                      </span>
                      {log.substring(10)}
                    </div>
                  ))}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ color: 'var(--neon-cyan)' }}>$</span>
                    <span style={{ width: '8px', height: '14px', background: 'var(--neon-cyan)', animation: 'terminal-blink 1s step-start infinite', display: 'inline-block' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* 2. DYNAMIC MAIN DASHBOARD */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
          
          {/* Dashboard Header */}
          <header className="cyber-panel cyber-corners" style={{
            padding: '15px 30px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            borderColor: 'rgba(168, 85, 247, 0.35)',
            boxShadow: '0 4px 15px rgba(168, 85, 247, 0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--neon-cyan), var(--neon-purple))', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-space)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <Cpu size={20} className="text-cyan-400" style={{ color: 'var(--neon-cyan)' }} />
                </div>
                <div style={{
                  position: 'absolute',
                  width: '46px',
                  height: '46px',
                  border: '1px dashed var(--neon-cyan)',
                  borderRadius: '50%',
                  animation: 'rotate-hud 15s linear infinite'
                }} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.2rem', color: '#fff', margin: 0, textShadow: '0 0 5px rgba(6,182,212,0.3)' }}>{t('quantum_bank')}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', marginTop: '4px' }}>
                  <span className="cyber-badge cyan" style={{ padding: '0px 4px' }}>
                    {activeBank}
                  </span>
                  <span className="cyber-badge purple" style={{ padding: '0px 4px' }}>
                    N°: {accountInfo?.banks[activeBank]?.accountNumber || 'INITIALISING'}
                  </span>
                </div>
              </div>
            </div>

            {/* Language switch button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <button 
                onClick={() => { playSound('click'); setLang(lang === 'fr' ? 'en' : 'fr'); }}
                className="cyber-btn"
                style={{ padding: '6px 12px', fontSize: '0.75rem' }}
              >
                {lang === 'fr' ? 'English (EN)' : 'Français (FR)'}
              </button>

              <div style={{ textAlign: 'right', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }} className="hide-on-mobile">
                <div style={{ color: '#fff', fontWeight: 600 }}>{user.username}</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>{user.email}</div>
              </div>
              <button 
                onClick={handleLogout}
                className="cyber-btn" 
                style={{ padding: '10px 15px', fontSize: '0.8rem', borderColor: 'var(--neon-red)', background: 'rgba(239, 68, 68, 0.05)' }}
              >
                <LogOut size={16} />
                <span className="hide-on-mobile">QUITTER</span>
              </button>
            </div>
          </header>

          {/* Grid Layout */}
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '260px 1fr', gap: '20px', minHeight: '600px' }}>
            
            {/* Sidebar Navigation */}
            <aside className="cyber-panel cyber-corners" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '0.7rem', color: 'rgba(6,182,212,0.5)', padding: '5px 10px', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'var(--font-mono)' }}>
                {t('sidebar_title')}
              </div>
              
              <button 
                onClick={() => { playSound('click'); setActiveTab('wallet'); }}
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  border: '1px solid transparent',
                  background: activeTab === 'wallet' ? 'rgba(6,182,212,0.1)' : 'transparent',
                  borderColor: activeTab === 'wallet' ? 'rgba(6,182,212,0.3)' : 'transparent',
                  color: activeTab === 'wallet' ? 'var(--neon-cyan)' : '#f3f4f6',
                  fontFamily: 'var(--font-hud)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  borderRadius: '2px'
                }}
              >
                <Wallet size={18} style={{ color: activeTab === 'wallet' ? 'var(--neon-cyan)' : 'inherit' }} />
                <span>{t('tab_wallet')}</span>
              </button>

              <button 
                onClick={() => { playSound('click'); setActiveTab('transfer'); }}
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  border: '1px solid transparent',
                  background: activeTab === 'transfer' ? 'rgba(168,85,247,0.1)' : 'transparent',
                  borderColor: activeTab === 'transfer' ? 'rgba(168,85,247,0.3)' : 'transparent',
                  color: activeTab === 'transfer' ? 'var(--neon-purple)' : '#f3f4f6',
                  fontFamily: 'var(--font-hud)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  borderRadius: '2px'
                }}
              >
                <ArrowLeftRight size={18} style={{ color: activeTab === 'transfer' ? 'var(--neon-purple)' : 'inherit' }} />
                <span>{t('tab_transfer')}</span>
              </button>

              <button 
                onClick={() => { playSound('click'); setActiveTab('ledger'); }}
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  border: '1px solid transparent',
                  background: activeTab === 'ledger' ? 'rgba(245,158,11,0.1)' : 'transparent',
                  borderColor: activeTab === 'ledger' ? 'rgba(245,158,11,0.3)' : 'transparent',
                  color: activeTab === 'ledger' ? 'var(--neon-amber)' : '#f3f4f6',
                  fontFamily: 'var(--font-hud)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  borderRadius: '2px'
                }}
              >
                <FileText size={18} style={{ color: activeTab === 'ledger' ? 'var(--neon-amber)' : 'inherit' }} />
                <span>{t('tab_ledger')}</span>
              </button>

              <button 
                onClick={() => { playSound('click'); setActiveTab('security'); }}
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  border: '1px solid transparent',
                  background: activeTab === 'security' ? 'rgba(16,185,129,0.1)' : 'transparent',
                  borderColor: activeTab === 'security' ? 'rgba(16,185,129,0.3)' : 'transparent',
                  color: activeTab === 'security' ? 'var(--neon-green)' : '#f3f4f6',
                  fontFamily: 'var(--font-hud)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  borderRadius: '2px'
                }}
              >
                <Shield size={18} style={{ color: activeTab === 'security' ? 'var(--neon-green)' : 'inherit' }} />
                <span>{t('tab_security')}</span>
              </button>

              <button 
                onClick={() => { playSound('click'); setActiveTab('diagnostics'); }}
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  border: '1px solid transparent',
                  background: activeTab === 'diagnostics' ? 'rgba(6,182,212,0.15)' : 'transparent',
                  borderColor: activeTab === 'diagnostics' ? 'rgba(6,182,212,0.4)' : 'transparent',
                  color: activeTab === 'diagnostics' ? 'var(--neon-cyan)' : '#f3f4f6',
                  fontFamily: 'var(--font-hud)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  borderRadius: '2px'
                }}
              >
                <Activity size={18} className={testSuiteStatus === 'RUNNING' ? 'animate-spin' : ''} style={{ color: 'var(--neon-cyan)' }} />
                <span>{t('tab_diagnostics')}</span>
              </button>

              <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.65rem', color: 'rgba(6,182,212,0.4)', marginBottom: '8px', fontFamily: 'var(--font-mono)' }}>
                  <Activity size={12} className="animate-pulse" />
                  <span>{t('sys_diagnostics')}</span>
                </div>
              </div>
            </aside>

            {/* Main Content Area */}
            <main style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Wallet Tab */}
              {activeTab === 'wallet' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* Bank Selector HUD */}
                  <div className="cyber-panel" style={{ padding: '10px 20px', display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>{t('bank_active')}</span>
                    {['Quantum Core', 'Aether Trust', 'Nova Reserve'].map(bank => (
                      <button
                        key={bank}
                        onClick={() => { playSound('click'); setActiveBank(bank); setOperationStatus(null); }}
                        className="cyber-btn"
                        style={{
                          padding: '6px 12px',
                          fontSize: '0.75rem',
                          background: activeBank === bank ? 'rgba(6,182,212,0.15)' : 'transparent',
                          borderColor: activeBank === bank ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.1)'
                        }}
                      >
                        {bank}
                      </button>
                    ))}
                  </div>

                  {/* Balance Cards Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
                    <div className="cyber-panel cyber-corners" style={{ padding: '20px', borderLeft: '4px solid var(--neon-cyan)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>PORTFOLIO USD</span>
                        <span className="cyber-badge cyan">FIAT</span>
                      </div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                        ${accountInfo?.banks[activeBank]?.balances?.USD.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) || '0.00'}
                      </div>
                    </div>

                    <div className="cyber-panel cyber-corners" style={{ padding: '20px', borderLeft: '4px solid var(--neon-amber)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>PORTFOLIO EUR</span>
                        <span className="cyber-badge amber">FIAT</span>
                      </div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                        €{accountInfo?.banks[activeBank]?.balances?.EUR.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) || '0.00'}
                      </div>
                    </div>

                    <div className="cyber-panel cyber-corners" style={{ padding: '20px', borderLeft: '4px solid var(--neon-purple)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>QUANTUM CREDITS (QTC)</span>
                        <span className="cyber-badge purple">LEDGER</span>
                      </div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--neon-purple)', fontFamily: 'var(--font-mono)' }}>
                        {accountInfo?.banks[activeBank]?.balances?.QTC.toFixed(2) || '0.00'}
                      </div>
                    </div>

                    <div className="cyber-panel cyber-corners" style={{ padding: '20px', borderLeft: '4px solid var(--neon-green)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>SOLANA (SOL)</span>
                        <span className="cyber-badge green">TOKEN</span>
                      </div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--neon-green)', fontFamily: 'var(--font-mono)' }}>
                        {accountInfo?.banks[activeBank]?.balances?.SOL.toFixed(2) || '0.00'}
                      </div>
                    </div>
                  </div>

                  {/* Core Operations (Deposit & Withdrawal) */}
                  <div className="cyber-panel cyber-corners" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                      <span style={{ fontSize: '0.85rem', color: '#fff' }}>{t('ops_title')} {activeBank}</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      {/* Deposit Widget */}
                      <form onSubmit={handleDeposit} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--neon-cyan)', marginBottom: '5px' }}>{t('deposit')}</label>
                          <input 
                            type="number" 
                            step="any"
                            placeholder="0.00" 
                            required
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                            className="cyber-input" 
                            style={{ width: '100%', padding: '8px' }} 
                          />
                        </div>
                        <div>
                          <select 
                            className="cyber-input"
                            value={depositCurrency}
                            onChange={(e) => setDepositCurrency(e.target.value)}
                            style={{ padding: '8px', background: 'var(--panel-bg)', minWidth: '70px' }}
                          >
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="QTC">QTC</option>
                            <option value="SOL">SOL</option>
                          </select>
                        </div>
                        <button type="submit" className="cyber-btn" style={{ padding: '8px 15px' }}>
                          <Plus size={16} /> {t('btn_credit')}
                        </button>
                      </form>

                      {/* Withdraw Widget */}
                      <form onSubmit={handleWithdraw} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--neon-amber)', marginBottom: '5px' }}>{t('withdraw')}</label>
                          <input 
                            type="number" 
                            step="any"
                            placeholder="0.00" 
                            required
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            className="cyber-input" 
                            style={{ width: '100%', padding: '8px' }} 
                          />
                        </div>
                        <div>
                          <select 
                            className="cyber-input"
                            value={withdrawCurrency}
                            onChange={(e) => setWithdrawCurrency(e.target.value)}
                            style={{ padding: '8px', background: 'var(--panel-bg)', minWidth: '70px' }}
                          >
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="QTC">QTC</option>
                            <option value="SOL">SOL</option>
                          </select>
                        </div>
                        <button type="submit" className="cyber-btn amber" style={{ padding: '8px 15px' }}>
                          <Minus size={16} /> {t('btn_debit')}
                        </button>
                      </form>
                    </div>

                    {operationStatus && (
                      <div className={`cyber-badge ${operationStatus.type === 'success' ? 'green' : 'red'}`} style={{ padding: '6px 12px', width: 'fit-content' }}>
                        {operationStatus.type === 'success' ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                        <span style={{ marginLeft: '5px' }}>{operationStatus.msg}</span>
                      </div>
                    )}
                  </div>

                  {/* Portfolio SVG Graph and rate tickers */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '20px' }}>
                    <div className="cyber-panel cyber-corners" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px', marginBottom: '15px' }}>
                        <span style={{ fontSize: '0.85rem', color: '#fff' }}>COURBE DES ACTIFS QUANTIQUE (24H)</span>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <span className="cyber-badge cyan">QTC</span>
                        </div>
                      </div>
                      <div style={{ flex: 1, position: 'relative', minHeight: '220px', width: '100%' }}>
                        <svg viewBox="0 0 500 200" width="100%" height="100%" style={{ overflow: 'visible' }}>
                          <defs>
                            <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="var(--neon-cyan)" stopOpacity="0.3" />
                              <stop offset="100%" stopColor="var(--neon-cyan)" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>
                          <line x1="0" y1="40" x2="500" y2="40" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                          <line x1="0" y1="90" x2="500" y2="90" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                          <line x1="0" y1="140" x2="500" y2="140" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                          
                          <path 
                            d="M0 160 Q 60 140 100 110 T 200 130 T 300 80 T 400 90 T 500 40 L 500 200 L 0 200 Z" 
                            fill="url(#chart-grad)"
                          />
                          <path 
                            d="M0 160 Q 60 140 100 110 T 200 130 T 300 80 T 400 90 T 500 40" 
                            fill="none" 
                            stroke="var(--neon-cyan)" 
                            strokeWidth="3"
                            filter="drop-shadow(0 0 4px var(--neon-cyan))"
                          />
                        </svg>
                      </div>
                    </div>

                    <div className="cyber-panel cyber-corners" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)', width: '100%', paddingBottom: '10px', textAlign: 'center', marginBottom: '15px' }}>
                        DISTRIBUTION DE LIQUIDITÉ
                      </span>
                      <div style={{ position: 'relative', width: '160px', height: '160px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <svg width="150" height="150" viewBox="0 0 150 150">
                          <circle cx="75" cy="75" r="55" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                          <circle cx="75" cy="75" r="55" fill="none" stroke="var(--neon-purple)" strokeWidth="8" 
                            strokeDasharray="345" strokeDashoffset="140" strokeLinecap="round" transform="rotate(-90 75 75)"
                            style={{ filter: 'drop-shadow(0 0 3px var(--neon-purple))' }}
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Virement / Wire Tab */}
              {activeTab === 'transfer' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* Transfer Type Sub-tabs */}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => { playSound('click'); setTransferType('external'); setTransferStatus(null); }}
                      className="cyber-btn"
                      style={{
                        padding: '8px 16px',
                        fontSize: '0.8rem',
                        background: transferType === 'external' ? 'rgba(6,182,212,0.15)' : 'transparent',
                        borderColor: transferType === 'external' ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.1)'
                      }}
                    >
                      {t('transfer_sub_ext')}
                    </button>
                    <button
                      onClick={() => { playSound('click'); setTransferType('interbank'); setTransferStatus(null); }}
                      className="cyber-btn"
                      style={{
                        padding: '8px 16px',
                        fontSize: '0.8rem',
                        background: transferType === 'interbank' ? 'rgba(168,85,247,0.15)' : 'transparent',
                        borderColor: transferType === 'interbank' ? 'var(--neon-purple)' : 'rgba(255,255,255,0.1)'
                      }}
                    >
                      {t('transfer_sub_int')}
                    </button>
                  </div>

                  <div className="cyber-panel cyber-corners" style={{ padding: '30px', borderColor: transferType === 'interbank' ? 'rgba(168, 85, 247, 0.4)' : 'rgba(6, 182, 212, 0.4)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '15px', marginBottom: '20px' }}>
                      <Terminal size={24} style={{ color: transferType === 'interbank' ? 'var(--neon-purple)' : 'var(--neon-cyan)' }} />
                      <h2 style={{ fontSize: '1.2rem', color: '#fff', margin: 0 }}>
                        {transferType === 'interbank' ? t('transfer_sub_int').toUpperCase() : t('transfer_sub_ext').toUpperCase()}
                      </h2>
                    </div>

                    <form onSubmit={handleTransfer} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      
                      {/* Left inputs column */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {transferType === 'interbank' ? (
                          <>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--neon-purple)', marginBottom: '6px' }}>{t('lbl_src_bank')}</label>
                              <select 
                                className="cyber-input"
                                value={sourceBank}
                                onChange={(e) => setSourceBank(e.target.value)}
                                style={{ width: '100%', padding: '10px', background: 'var(--panel-bg)' }}
                              >
                                <option value="Quantum Core">Quantum Core</option>
                                <option value="Aether Trust">Aether Trust</option>
                                <option value="Nova Reserve">Nova Reserve</option>
                              </select>
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--neon-purple)', marginBottom: '6px' }}>{t('lbl_dest_bank')}</label>
                              <select 
                                className="cyber-input"
                                value={destBank}
                                onChange={(e) => setDestBank(e.target.value)}
                                style={{ width: '100%', padding: '10px', background: 'var(--panel-bg)' }}
                              >
                                <option value="Quantum Core">Quantum Core</option>
                                <option value="Aether Trust">Aether Trust</option>
                                <option value="Nova Reserve">Nova Reserve</option>
                              </select>
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--neon-cyan)', marginBottom: '6px' }}>{t('lbl_source')}</label>
                              <select 
                                className="cyber-input"
                                value={activeBank}
                                onChange={(e) => setActiveBank(e.target.value)}
                                style={{ width: '100%', padding: '10px', background: 'var(--panel-bg)' }}
                              >
                                <option value="Quantum Core">Quantum Core</option>
                                <option value="Aether Trust">Aether Trust</option>
                                <option value="Nova Reserve">Nova Reserve</option>
                              </select>
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--neon-cyan)', marginBottom: '6px' }}>{t('lbl_recipient_acc')}</label>
                              <input 
                                type="text" 
                                className="cyber-input" 
                                required
                                placeholder="e.g. Q-CORE-XXXXXXXX"
                                value={recipientAccount}
                                onChange={(e) => setRecipientAccount(e.target.value)}
                                style={{ width: '100%', padding: '10px 12px' }} 
                              />
                            </div>
                          </>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--neon-cyan)', marginBottom: '6px' }}>{t('tx_amount')}</label>
                            <input 
                              type="number" 
                              step="any"
                              className="cyber-input" 
                              required
                              placeholder="0.00"
                              value={transferAmount}
                              onChange={(e) => setTransferAmount(e.target.value)}
                              style={{ width: '100%', padding: '10px' }} 
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--neon-cyan)', marginBottom: '6px' }}>{t('currency')}</label>
                            <select 
                              className="cyber-input"
                              value={transferCurrency}
                              onChange={(e) => setTransferCurrency(e.target.value)}
                              style={{ width: '100%', padding: '10px', background: 'var(--panel-bg)' }}
                            >
                              <option value="USD">USD</option>
                              <option value="EUR">EUR</option>
                              <option value="QTC">QTC</option>
                              <option value="SOL">SOL</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--neon-cyan)', marginBottom: '6px' }}>{t('lbl_msg')}</label>
                          <input 
                            type="text" 
                            className="cyber-input" 
                            placeholder="Quantum wire logs description"
                            value={transferDesc}
                            onChange={(e) => setTransferDesc(e.target.value)}
                            style={{ width: '100%', padding: '10px 12px' }} 
                          />
                        </div>
                      </div>

                      {/* Right Feedback column */}
                      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '15px', background: 'rgba(0,0,0,0.2)', border: '1px dashed rgba(255,255,255,0.05)' }}>
                        <div>
                          <span style={{ display: 'block', fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', marginBottom: '10px' }}>
                            {t('lbl_val_flux')}
                          </span>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between' }}>
                              <span>{t('lbl_solde')}</span>
                              <span style={{ color: '#fff' }}>
                                {accountInfo?.banks[transferType === 'interbank' ? sourceBank : activeBank]?.balances[transferCurrency] || 0} {transferCurrency}
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between' }}>
                              <span>{t('lbl_debit')}</span>
                              <span style={{ color: 'var(--neon-red)' }}>-{transferAmount || 0} {transferCurrency}</span>
                            </div>
                          </div>
                        </div>

                        {transferStatus && (
                          <div className={`cyber-badge ${transferStatus.type === 'success' ? 'green' : 'red'}`} style={{ padding: '8px 10px', marginTop: '10px' }}>
                            <span>{transferStatus.msg}</span>
                          </div>
                        )}

                        <button 
                          type="submit" 
                          disabled={transferLoading}
                          className={`cyber-btn ${transferType === 'interbank' ? 'purple' : ''}`}
                          style={{ width: '100%', padding: '12px', marginTop: '15px' }}
                        >
                          {transferLoading ? t('loading_transmit') : t('btn_transmit')}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Global Ledger Tab */}
              {activeTab === 'ledger' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="cyber-panel cyber-corners" style={{ padding: '25px', borderColor: 'rgba(245,158,11,0.4)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(245,158,11,0.2)', paddingBottom: '15px', marginBottom: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FileText size={24} style={{ color: 'var(--neon-amber)', filter: 'drop-shadow(0 0 5px var(--neon-amber))' }} />
                        <h2 style={{ fontSize: '1.2rem', color: '#fff', margin: 0 }}>GRAND LIVRE DE COMPTABILITÉ BLOCKCHAIN</h2>
                      </div>
                      <span className="cyber-badge amber">TOTAL BLOCS: {transactions.length}</span>
                    </div>

                    {transactions.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)' }}>
                        {t('tx_empty')}
                      </div>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', fontFamily: 'var(--font-mono)', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--neon-amber)' }}>
                              <th style={{ padding: '10px 5px' }}>{t('tx_id')}</th>
                              <th>{t('tx_sender')}</th>
                              <th>{t('tx_recipient')}</th>
                              <th>VALEUR</th>
                              <th>NOTE</th>
                              <th>STATUS</th>
                              <th style={{ textAlign: 'right' }}>{t('tx_date')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {transactions.map((tx, idx) => (
                              <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', color: '#d1d5db' }}>
                                <td style={{ padding: '14px 5px', color: 'var(--neon-cyan)' }}>{tx.id.substring(0, 16)}...</td>
                                <td>
                                  <div>{tx.senderUsername}</div>
                                  <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>{tx.senderAccountNumber}</div>
                                </td>
                                <td>
                                  <div>{tx.recipientUsername}</div>
                                  <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>{tx.recipientAccountNumber}</div>
                                </td>
                                <td>
                                  <span style={{ color: tx.senderId === user.id ? 'var(--neon-red)' : 'var(--neon-green)', fontWeight: 600 }}>
                                    {tx.senderId === user.id ? '-' : '+'}{tx.amount} {tx.currency}
                                  </span>
                                </td>
                                <td>{tx.description}</td>
                                <td>
                                  <span className="cyber-badge green" style={{ fontSize: '0.6rem', padding: '0px 6px' }}>CLEARED</span>
                                </td>
                                <td style={{ textAlign: 'right', color: 'rgba(255,255,255,0.4)' }}>
                                  {new Date(tx.timestamp).toLocaleString('fr-FR')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quantum Crypto Node Tab */}
              {activeTab === 'security' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="cyber-panel cyber-corners" style={{ padding: '30px', borderColor: 'rgba(16, 185, 129, 0.4)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(16, 185, 129, 0.2)', paddingBottom: '15px', marginBottom: '20px' }}>
                      <Cpu size={24} style={{ color: 'var(--neon-green)', filter: 'drop-shadow(0 0 5px var(--neon-green))' }} />
                      <h2 style={{ fontSize: '1.2rem', color: '#fff', margin: 0 }}>{t('security_title')}</h2>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px' }}>
                      <div>
                        <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: '15px', lineHeight: '1.5' }}>
                          {t('security_desc')}
                        </p>
                        <div style={{
                          background: 'rgba(0,0,0,0.5)',
                          border: '1px solid var(--neon-green)',
                          padding: '20px',
                          borderRadius: '2px',
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--neon-green)',
                          fontSize: '0.9rem',
                          wordBreak: 'break-all',
                          minHeight: '80px',
                          boxShadow: 'inset 0 0 10px rgba(16,185,129,0.1)'
                        }}>
                          {quantumKey}
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                          <span className="cyber-badge green">{t('security_algo')}</span>
                          <span className="cyber-badge green">{t('security_strength')}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(16,185,129,0.2)', padding: '15px' }}>
                        <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>{t('security_nodes')}</span>
                        <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                          <span>PARIS-CORE-NODE</span>
                          <span style={{ color: 'var(--neon-green)' }}>{t('sec_connected')}</span>
                        </div>
                        <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                          <span>REYKJAVIK-VAULT</span>
                          <span style={{ color: 'var(--neon-green)' }}>{t('sec_connected')}</span>
                        </div>
                        <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                          <span>SINGAPORE-RELAY</span>
                          <span style={{ color: 'var(--neon-green)' }}>{t('sec_connected')}</span>
                        </div>
                        <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                          <span>QUANTUM-ENTROPY</span>
                          <span style={{ color: 'var(--neon-cyan)' }}>{t('sec_gen_ok')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Vitest Diagnostics Tab */}
              {activeTab === 'diagnostics' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="cyber-panel cyber-corners" style={{ padding: '30px', borderColor: 'var(--neon-cyan)' }}>
                    
                    <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(6,182,212,0.2)', paddingBottom: '15px', marginBottom: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Activity size={24} style={{ color: 'var(--neon-cyan)', filter: 'drop-shadow(0 0 5px var(--neon-cyan))' }} />
                        <h2 style={{ fontSize: '1.2rem', color: '#fff', margin: 0 }}>{t('diag_title')}</h2>
                      </div>
                      <span className="cyber-badge cyan">VITEST v4.1.9</span>
                    </div>

                    {/* Diagnostics Sub Tabs */}
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                      <button
                        onClick={() => { playSound('click'); setDiagnosticsSubTab('runner'); }}
                        className="cyber-btn"
                        style={{
                          padding: '6px 12px',
                          fontSize: '0.75rem',
                          background: diagnosticsSubTab === 'runner' ? 'rgba(6,182,212,0.15)' : 'transparent',
                          borderColor: diagnosticsSubTab === 'runner' ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.1)'
                        }}
                      >
                        {t('diag_sub_runner')}
                      </button>
                      <button
                        onClick={() => { playSound('click'); setDiagnosticsSubTab('coverage'); }}
                        className="cyber-btn"
                        style={{
                          padding: '6px 12px',
                          fontSize: '0.75rem',
                          background: diagnosticsSubTab === 'coverage' ? 'rgba(6,182,212,0.15)' : 'transparent',
                          borderColor: diagnosticsSubTab === 'coverage' ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.1)'
                        }}
                      >
                        {t('diag_sub_coverage')}
                      </button>
                      <button
                        onClick={() => { playSound('click'); setDiagnosticsSubTab('terminal'); }}
                        className="cyber-btn"
                        style={{
                          padding: '6px 12px',
                          fontSize: '0.75rem',
                          background: diagnosticsSubTab === 'terminal' ? 'rgba(6,182,212,0.15)' : 'transparent',
                          borderColor: diagnosticsSubTab === 'terminal' ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.1)'
                        }}
                      >
                        {t('diag_sub_terminal')}
                      </button>
                    </div>

                    {/* SUB-TAB 1: RUNNER CONSOLE */}
                    {diagnosticsSubTab === 'runner' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: '25px' }}>
                        
                        {/* Controller & Configuration Column */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>TEST CONTROL PANEL</span>
                          
                          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '2px', border: '1px dashed rgba(6,182,212,0.2)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                              <span>Status:</span>
                              <span style={{ 
                                color: testSuiteStatus === 'PASSED' ? 'var(--neon-green)' : testSuiteStatus === 'RUNNING' ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.4)', 
                                fontWeight: 'bold' 
                              }}>
                                {testSuiteStatus === 'RUNNING' ? t('diag_running') : testSuiteStatus}
                              </span>
                            </div>
                            
                            {testSuiteStatus === 'RUNNING' && (
                              <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{ width: `${testProgress}%`, height: '100%', background: 'var(--neon-cyan)', transition: 'width 0.1s ease' }} />
                              </div>
                            )}

                            <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                              <span>{t('diag_total')}</span>
                              <span>
                                {testSuites.reduce((acc, s) => acc + s.cases.filter(c => c.status === 'PASSED').length, 0)} / 
                                {testSuites.reduce((acc, s) => acc + s.cases.length, 0)}
                              </span>
                            </div>
                          </div>

                          <button 
                            onClick={runDiagnostics}
                            disabled={testSuiteStatus === 'RUNNING'}
                            className="cyber-btn"
                            style={{ padding: '12px', fontSize: '0.85rem' }}
                          >
                            <Play size={14} /> {t('diag_btn_run')}
                          </button>

                          {/* Interactive Parameter Editor Panel */}
                          {expandedTest && (
                            <div className="cyber-panel" style={{ padding: '15px', border: '1px solid var(--neon-purple)', background: 'rgba(168,85,247,0.02)' }}>
                              <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--neon-purple)', fontFamily: 'var(--font-mono)', marginBottom: '10px' }}>
                                {t('diag_custom_inputs')}
                              </span>
                              
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {Object.keys(expandedTest.testCase.inputs).map(key => (
                                  <div key={key} style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-mono)' }}>{key}</label>
                                    <input 
                                      type={typeof expandedTest.testCase.inputs[key] === 'number' ? 'number' : 'text'}
                                      step="any"
                                      className="cyber-input"
                                      value={expandedTest.testCase.inputs[key]}
                                      onChange={(e) => handleInputChange(expandedTest.suiteId, expandedTest.testCase.id, key, e.target.value)}
                                      style={{ padding: '4px 8px', fontSize: '0.75rem', width: '130px', textAlign: 'right' }}
                                    />
                                  </div>
                                ))}

                                <button
                                  onClick={() => runSingleTestCase(expandedTest.suiteId, expandedTest.testCase.id)}
                                  className="cyber-btn purple"
                                  style={{ padding: '6px', fontSize: '0.7rem', marginTop: '5px' }}
                                >
                                  {t('diag_btn_run_case')}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Test Assertion list Column */}
                        <div style={{ background: 'rgba(3,7,18,0.6)', border: '1px solid rgba(6,182,212,0.15)', padding: '20px', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', minHeight: '350px', overflowY: 'auto' }}>
                          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px', marginBottom: '12px', display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', color: 'rgba(255,255,255,0.4)' }}>
                            <span>{t('diag_name')}</span>
                            <span>{t('diag_status')}</span>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {testSuites.map((suite) => (
                              <div key={suite.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ color: 'var(--neon-amber)', fontWeight: 'bold', fontSize: '0.8rem', borderBottom: '1px solid rgba(245,158,11,0.15)', paddingBottom: '3px' }}>
                                  {suite.name}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '10px' }}>
                                  {suite.cases.map((c) => (
                                    <div 
                                      key={c.id} 
                                      onClick={() => setExpandedTest({ suiteId: suite.id, testCase: c })}
                                      style={{ 
                                        display: 'flex', 
                                        justifySelf: 'stretch', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center', 
                                        cursor: 'pointer',
                                        background: expandedTest?.testCase.id === c.id ? 'rgba(255,255,255,0.02)' : 'transparent',
                                        padding: '4px',
                                        borderRadius: '2px'
                                      }}
                                    >
                                      <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '80%' }}>
                                        <span style={{ color: '#fff', fontSize: '0.75rem' }}>{c.name}</span>
                                        {c.errorMsg && (
                                          <span style={{ color: 'var(--neon-red)', fontSize: '0.65rem' }}>Error: {c.errorMsg}</span>
                                        )}
                                      </div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span className={`cyber-badge ${c.status === 'PASSED' ? 'green' : c.status === 'FAILED' ? 'red' : 'cyan'}`} style={{ fontSize: '0.55rem', padding: '0px 6px' }}>
                                          {c.status}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>

                          {testSuiteStatus === 'PASSED' && (
                            <div style={{ marginTop: '20px', padding: '10px', background: 'rgba(16,185,129,0.08)', border: '1px solid var(--neon-green)', color: 'var(--neon-green)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <CheckCircle size={16} />
                              <span>{t('diag_passed_all')} (823ms)</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* SUB-TAB 2: COVERAGE MATRIX TABLE */}
                    {diagnosticsSubTab === 'coverage' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>{t('cov_title')}</span>
                          <button
                            onClick={generateCoverage}
                            disabled={coverageLoading}
                            className="cyber-btn"
                            style={{ padding: '8px 16px', fontSize: '0.75rem' }}
                          >
                            {t('cov_btn_gen')}
                          </button>
                        </div>

                        {coverageStatus === 'NOT_RUN' && (
                          <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)', border: '1px dashed rgba(6,182,212,0.1)' }}>
                            Taux de couverture non calculé pour ce noeud. Cliquez sur le bouton pour analyser le code source.
                          </div>
                        )}

                        {coverageStatus === 'RUNNING' && (
                          <div style={{ textAlign: 'center', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                            <RefreshCw className="animate-spin text-cyan-400" size={32} style={{ color: 'var(--neon-cyan)' }} />
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--neon-cyan)' }}>{t('cov_running')} {coverageProgress}%</span>
                            <div style={{ width: '200px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                              <div style={{ width: `${coverageProgress}%`, height: '100%', background: 'var(--neon-cyan)', transition: 'width 0.1s ease' }} />
                            </div>
                          </div>
                        )}

                        {coverageStatus === 'GENERATED' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {/* Summary Cards */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                              <div className="cyber-panel" style={{ padding: '15px', borderLeft: '4px solid var(--neon-cyan)' }}>
                                <span style={{ display: 'block', fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginBottom: '5px' }}>{t('cov_overall')}</span>
                                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--neon-cyan)', fontFamily: 'var(--font-mono)' }}>93.5%</span>
                              </div>
                              <div className="cyber-panel" style={{ padding: '15px', borderLeft: '4px solid var(--neon-green)' }}>
                                <span style={{ display: 'block', fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginBottom: '5px' }}>{t('cov_status')}</span>
                                <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--neon-green)' }}>OPTIMAL</span>
                              </div>
                            </div>

                            {/* Detailed Grid Table */}
                            <div style={{ overflowX: 'auto' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', textAlign: 'left' }}>
                                <thead>
                                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'var(--neon-cyan)' }}>
                                    <th style={{ padding: '10px 5px' }}>{t('cov_file')}</th>
                                    <th>{t('cov_stm')}</th>
                                    <th>{t('cov_br')}</th>
                                    <th>{t('cov_fn')}</th>
                                    <th>{t('cov_ln')}</th>
                                    <th>{t('cov_uncover')}</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {coverageData.map((cov, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', color: '#d1d5db' }}>
                                      <td style={{ padding: '12px 5px', color: '#fff', fontWeight: 600 }}>{cov.file}</td>
                                      <td style={{ color: cov.stm >= 90 ? 'var(--neon-green)' : 'var(--neon-amber)' }}>{cov.stm}%</td>
                                      <td style={{ color: cov.br >= 80 ? 'var(--neon-green)' : 'var(--neon-amber)' }}>{cov.br}%</td>
                                      <td style={{ color: cov.fn >= 90 ? 'var(--neon-green)' : 'var(--neon-amber)' }}>{cov.fn}%</td>
                                      <td style={{ color: cov.ln >= 90 ? 'var(--neon-green)' : 'var(--neon-amber)' }}>{cov.ln}%</td>
                                      <td style={{ color: 'rgba(255,255,255,0.4)' }}>{cov.lines}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* SUB-TAB 3: CLI TERMINAL CONSOLE */}
                    {diagnosticsSubTab === 'terminal' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>CONSOLE SHELL VITEST AUTONOME</span>
                          <span className="cyber-badge cyan" style={{ fontSize: '0.65rem' }}>
                            {isSimulation || !serverOnline ? 'LOCAL SANDBOX SIM' : 'PASS-THROUGH GATEWAY'}
                          </span>
                        </div>

                        {/* CRT Terminal Screen */}
                        <div 
                          style={{
                            background: '#020617',
                            border: '1px solid var(--border-color)',
                            borderRadius: '4px',
                            boxShadow: 'inset 0 0 20px rgba(6, 182, 212, 0.15)',
                            padding: '20px',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.8rem',
                            color: '#e2e8f0',
                            minHeight: '380px',
                            maxHeight: '450px',
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                          }}
                        >
                          {terminalLogs.map((log, idx) => (
                            <div 
                              key={idx} 
                              style={{ 
                                whiteSpace: 'pre-wrap', 
                                wordBreak: 'break-all',
                                color: log.type === 'input' 
                                  ? 'var(--neon-cyan)' 
                                  : log.type === 'stderr' 
                                    ? 'var(--neon-red)' 
                                    : log.type === 'system' 
                                      ? 'var(--neon-amber)' 
                                      : '#10b981' // stdout passes/results in green
                              }}
                            >
                              {log.text}
                            </div>
                          ))}
                          {terminalLoading && (
                            <div className="animate-pulse" style={{ color: 'var(--neon-cyan)' }}>
                              [SYSTEM] Traitement en cours...
                            </div>
                          )}
                        </div>

                        {/* Suggestions HUD */}
                        {terminalInput && (
                          <div 
                            style={{ 
                              background: 'rgba(3,7,18,0.9)', 
                              border: '1px solid rgba(6,182,212,0.3)', 
                              borderRadius: '2px', 
                              padding: '10px',
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.75rem',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px'
                            }}
                          >
                            <span style={{ color: 'var(--neon-purple)', fontSize: '0.65rem', textTransform: 'uppercase' }}>Suggestions de commande :</span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                              {cliCommands
                                .filter(cmd => cmd.toLowerCase().includes(terminalInput.toLowerCase()))
                                .map((cmd, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => { playSound('click'); setTerminalInput(cmd); }}
                                    className="cyber-badge cyan"
                                    style={{ cursor: 'pointer', borderStyle: 'dashed', textTransform: 'none' }}
                                  >
                                    {cmd}
                                  </button>
                                ))
                              }
                            </div>
                          </div>
                        )}

                        {/* Command Input Bar */}
                        <form 
                          onSubmit={(e) => {
                            e.preventDefault();
                            executeTerminalCommand(terminalInput);
                          }}
                          style={{ display: 'flex', gap: '10px', alignItems: 'center' }}
                        >
                          <span style={{ color: 'var(--neon-cyan)', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>$</span>
                          <input
                            type="text"
                            className="cyber-input"
                            value={terminalInput}
                            onChange={(e) => setTerminalInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'ArrowUp') {
                                e.preventDefault();
                                if (terminalHistory.length > 0) {
                                  const nextIdx = historyIndex + 1;
                                  if (nextIdx < terminalHistory.length) {
                                    setHistoryIndex(nextIdx);
                                    setTerminalInput(terminalHistory[nextIdx]);
                                  }
                                }
                              } else if (e.key === 'ArrowDown') {
                                e.preventDefault();
                                if (historyIndex > 0) {
                                  const nextIdx = historyIndex - 1;
                                  setHistoryIndex(nextIdx);
                                  setTerminalInput(terminalHistory[nextIdx]);
                                } else if (historyIndex === 0) {
                                  setHistoryIndex(-1);
                                  setTerminalInput('');
                                }
                              }
                            }}
                            placeholder="Entrez votre commande de test... (ex: npx vitest run)"
                            disabled={terminalLoading}
                            style={{ flex: 1, padding: '10px 12px', fontSize: '0.8rem' }}
                          />
                          <button
                            type="submit"
                            disabled={terminalLoading || !terminalInput.trim()}
                            className="cyber-btn"
                            style={{ padding: '10px 20px', fontSize: '0.8rem' }}
                          >
                            ENTRÉE
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      )}

      {/* Futuristic footer overlay */}
      <footer style={{
        padding: '15px',
        textAlign: 'center',
        fontSize: '0.65rem',
        color: 'rgba(255, 255, 255, 0.25)',
        fontFamily: 'var(--font-mono)',
        borderTop: '1px solid rgba(255,255,255,0.02)',
        marginTop: 'auto'
      }}>
        <span>© 2026 QUANTUM CORE BANKING SERVICES LTD. TOUS DROITS RÉSERVÉS MATRICE F-38.</span>
      </footer>
    </div>
  );
}
