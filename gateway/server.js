const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();
const PORT = process.env.PORT || 10000;

// Internal URLs (environment variable overrides for Render)
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:10001';
const TRANSACTION_SERVICE_URL = process.env.TRANSACTION_SERVICE_URL || 'http://localhost:10002';

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// ─── SWAGGER / OPENAPI CONFIG ───────────────────────────────────────────────
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '🏦 Quantum Bank API',
      version: '1.0.0',
      description: `
## Quantum Banking System — API Gateway

Documentation interactive de l'API complète du système bancaire quantique.

### Architecture
- **Gateway** (port 10000) — Routage & authentification centralisée
- **Auth Service** (port 10001) — Inscription, connexion, vérification JWT
- **Transaction Service** (port 10002) — Soldes, dépôts, retraits, virements

### Authentification
Toutes les routes protégées nécessitent un header \`Authorization: Bearer <token>\`.
Obtenez votre token via \`POST /api/auth/login\`.
      `,
      contact: {
        name: 'Quantum Bank Dev Team',
        url: 'https://github.com/elmaxproart/banque-quantique'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Serveur de développement local'
      },
      {
        url: 'https://banque-quantique-gateway.onrender.com',
        description: 'Serveur de production (Render)'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtenu après connexion via POST /api/auth/login'
        }
      },
      schemas: {
        // Auth schemas
        RegisterRequest: {
          type: 'object',
          required: ['username', 'password', 'email'],
          properties: {
            username: { type: 'string', example: 'NeoQuantum', minLength: 3 },
            password: { type: 'string', example: 'SecurePass123', minLength: 6 },
            email: { type: 'string', format: 'email', example: 'neo@qbank.net' }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: { type: 'string', example: 'NeoQuantum' },
            password: { type: 'string', example: 'SecurePass123' }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Login successful.' },
            token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'uuid-1234' },
                username: { type: 'string', example: 'NeoQuantum' },
                email: { type: 'string', example: 'neo@qbank.net' }
              }
            }
          }
        },
        // Transaction schemas
        BankBalance: {
          type: 'object',
          properties: {
            balances: {
              type: 'object',
              properties: {
                USD: { type: 'number', example: 50000.00 },
                EUR: { type: 'number', example: 12500.00 },
                QTC: { type: 'number', example: 500.00 },
                SOL: { type: 'number', example: 25.50 }
              }
            },
            accountNumber: { type: 'string', example: 'Q-CORE-12345678' }
          }
        },
        AccountResponse: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            username: { type: 'string' },
            banks: {
              type: 'object',
              additionalProperties: { $ref: '#/components/schemas/BankBalance' }
            }
          }
        },
        TransactionRecord: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            senderId: { type: 'string' },
            senderUsername: { type: 'string' },
            senderAccountNumber: { type: 'string' },
            recipientId: { type: 'string' },
            recipientUsername: { type: 'string' },
            recipientAccountNumber: { type: 'string' },
            amount: { type: 'number' },
            currency: { type: 'string', enum: ['USD', 'EUR', 'QTC', 'SOL'] },
            description: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' }
          }
        },
        DepositRequest: {
          type: 'object',
          required: ['bank', 'amount', 'currency'],
          properties: {
            bank: { type: 'string', example: 'Quantum Core', enum: ['Quantum Core', 'Aether Trust', 'Nova Reserve'] },
            amount: { type: 'number', example: 1000.00, minimum: 0.01 },
            currency: { type: 'string', example: 'USD', enum: ['USD', 'EUR', 'QTC', 'SOL'] }
          }
        },
        WithdrawRequest: {
          type: 'object',
          required: ['bank', 'amount', 'currency'],
          properties: {
            bank: { type: 'string', example: 'Quantum Core' },
            amount: { type: 'number', example: 500.00 },
            currency: { type: 'string', example: 'EUR' }
          }
        },
        TransferRequest: {
          type: 'object',
          required: ['sourceBank', 'recipientAccountNumber', 'amount', 'currency'],
          properties: {
            sourceBank: { type: 'string', example: 'Quantum Core' },
            recipientAccountNumber: { type: 'string', example: 'A-TRUST-87654321' },
            amount: { type: 'number', example: 2500.00 },
            currency: { type: 'string', example: 'USD' },
            description: { type: 'string', example: 'Paiement facture mensuelle' }
          }
        },
        InterbankTransferRequest: {
          type: 'object',
          required: ['sourceBank', 'destinationBank', 'amount', 'currency'],
          properties: {
            sourceBank: { type: 'string', example: 'Quantum Core' },
            destinationBank: { type: 'string', example: 'Aether Trust' },
            amount: { type: 'number', example: 5000.00 },
            currency: { type: 'string', example: 'USD' },
            description: { type: 'string', example: 'Rééquilibrage portefeuille' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Authorization token required.' }
          }
        },
        SuccessMessage: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    },
    tags: [
      { name: 'System', description: 'Endpoints de santé du système' },
      { name: 'Authentication', description: 'Inscription, connexion et vérification JWT' },
      { name: 'Transactions', description: 'Gestion des soldes, dépôts, retraits et virements' },
      { name: 'Diagnostics', description: 'Outils de diagnostic et tests CLI' }
    ]
  },
  apis: [] // We define routes inline below
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// ─── SWAGGER ROUTE DEFINITIONS (added manually since routes are inline) ─────
swaggerSpec.paths = {
  '/health': {
    get: {
      tags: ['System'],
      summary: 'Vérification de santé du Gateway',
      description: 'Retourne le statut opérationnel du gateway et les URLs des services internes.',
      operationId: 'getGatewayHealth',
      responses: {
        200: {
          description: 'Gateway opérationnel',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  gateway: { type: 'string', example: 'ONLINE' },
                  auth_service: { type: 'string', example: 'http://localhost:10001' },
                  transaction_service: { type: 'string', example: 'http://localhost:10002' },
                  timestamp: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        }
      }
    }
  },
  '/api/auth/register': {
    post: {
      tags: ['Authentication'],
      summary: 'Créer un nouveau compte',
      description: 'Inscrit un nouvel utilisateur et retourne un token JWT ainsi que les informations du compte créé.',
      operationId: 'registerUser',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/RegisterRequest' }
          }
        }
      },
      responses: {
        201: {
          description: 'Compte créé avec succès',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } }
        },
        400: {
          description: 'Données invalides ou utilisateur déjà existant',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        500: {
          description: 'Service d\'authentification indisponible',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        }
      }
    }
  },
  '/api/auth/login': {
    post: {
      tags: ['Authentication'],
      summary: 'Connexion utilisateur',
      description: 'Authentifie un utilisateur et retourne un token JWT valide 24h.',
      operationId: 'loginUser',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/LoginRequest' }
          }
        }
      },
      responses: {
        200: {
          description: 'Connexion réussie',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } }
        },
        401: {
          description: 'Identifiants incorrects',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        500: {
          description: 'Service d\'authentification indisponible',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        }
      }
    }
  },
  '/api/transactions/balance': {
    get: {
      tags: ['Transactions'],
      summary: 'Consulter les soldes multi-banques',
      description: 'Retourne les soldes de l\'utilisateur pour toutes ses banques (Quantum Core, Aether Trust, Nova Reserve) et toutes les devises (USD, EUR, QTC, SOL). Un compte est automatiquement créé si inexistant.',
      operationId: 'getBalance',
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: 'Données de compte complètes',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/AccountResponse' } } }
        },
        401: {
          description: 'Token manquant ou invalide',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        500: {
          description: 'Service de transactions indisponible',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        }
      }
    }
  },
  '/api/transactions/history': {
    get: {
      tags: ['Transactions'],
      summary: 'Historique des transactions',
      description: 'Retourne toutes les transactions (envoyées et reçues) de l\'utilisateur, triées par date décroissante.',
      operationId: 'getHistory',
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: 'Liste des transactions',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/TransactionRecord' }
              }
            }
          }
        },
        401: {
          description: 'Token manquant ou invalide',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        }
      }
    }
  },
  '/api/transactions/deposit': {
    post: {
      tags: ['Transactions'],
      summary: 'Effectuer un dépôt',
      description: 'Dépose des fonds dans la banque et la devise spécifiées. Le montant est ajouté au solde correspondant.',
      operationId: 'deposit',
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/DepositRequest' }
          }
        }
      },
      responses: {
        200: {
          description: 'Dépôt effectué avec succès',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string' },
                  account: { $ref: '#/components/schemas/AccountResponse' },
                  transaction: { $ref: '#/components/schemas/TransactionRecord' }
                }
              }
            }
          }
        },
        400: {
          description: 'Paramètres invalides',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        401: {
          description: 'Non autorisé',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        }
      }
    }
  },
  '/api/transactions/withdraw': {
    post: {
      tags: ['Transactions'],
      summary: 'Effectuer un retrait',
      description: 'Retire des fonds de la banque spécifiée. Vérifie que le solde est suffisant avant le retrait.',
      operationId: 'withdraw',
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/WithdrawRequest' }
          }
        }
      },
      responses: {
        200: {
          description: 'Retrait effectué avec succès',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string' },
                  account: { $ref: '#/components/schemas/AccountResponse' },
                  transaction: { $ref: '#/components/schemas/TransactionRecord' }
                }
              }
            }
          }
        },
        400: {
          description: 'Fonds insuffisants ou paramètres invalides',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        401: {
          description: 'Non autorisé',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        }
      }
    }
  },
  '/api/transactions/transfer': {
    post: {
      tags: ['Transactions'],
      summary: 'Virement vers un autre utilisateur',
      description: 'Transfère des fonds vers le compte d\'un autre utilisateur via son numéro de compte bancaire. Supporte les transferts vers des comptes externes (smart contracts).',
      operationId: 'transfer',
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/TransferRequest' }
          }
        }
      },
      responses: {
        200: {
          description: 'Virement effectué avec succès',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string' },
                  transaction: { $ref: '#/components/schemas/TransactionRecord' },
                  account: { $ref: '#/components/schemas/AccountResponse' }
                }
              }
            }
          }
        },
        400: {
          description: 'Paramètres invalides ou fonds insuffisants',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        401: {
          description: 'Non autorisé',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        }
      }
    }
  },
  '/api/transactions/transfer-interbank': {
    post: {
      tags: ['Transactions'],
      summary: 'Virement interbancaire (entre vos banques)',
      description: 'Transfère des fonds entre deux banques appartenant au même utilisateur (ex: de Quantum Core vers Aether Trust). Utile pour le rééquilibrage de portefeuille.',
      operationId: 'transferInterbank',
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/InterbankTransferRequest' }
          }
        }
      },
      responses: {
        200: {
          description: 'Transfert interbancaire effectué avec succès',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string' },
                  account: { $ref: '#/components/schemas/AccountResponse' },
                  transaction: { $ref: '#/components/schemas/TransactionRecord' }
                }
              }
            }
          }
        },
        400: {
          description: 'Banques identiques, fonds insuffisants ou paramètres invalides',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        401: {
          description: 'Non autorisé',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        }
      }
    }
  },
  '/api/diagnostics/run-command': {
    post: {
      tags: ['Diagnostics'],
      summary: 'Exécuter une commande de test CLI',
      description: 'Exécute des commandes de test autorisées (`npx vitest run` ou `node tests/manual/`) dans le répertoire frontend. Nécessite une authentification.',
      operationId: 'runDiagnosticCommand',
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['command'],
              properties: {
                command: {
                  type: 'string',
                  example: 'npx vitest run tests/unit/auth.test.js',
                  description: 'Commande autorisée: "npx vitest run ..." ou "node tests/manual/..."'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Résultat de l\'exécution',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  stdout: { type: 'string' },
                  stderr: { type: 'string' },
                  success: { type: 'boolean' }
                }
              }
            }
          }
        },
        400: {
          description: 'Commande non autorisée ou manquante',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        401: {
          description: 'Non autorisé',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        }
      }
    }
  }
};

// ─── SWAGGER UI ENDPOINT ────────────────────────────────────────────────────
const swaggerUiOptions = {
  customCss: `
    .swagger-ui .topbar { background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%); }
    .swagger-ui .topbar-wrapper img { content: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="%2300d4ff"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>'); height: 30px; }
    .swagger-ui .topbar-wrapper .link span { color: #00d4ff; font-weight: bold; font-size: 1.2rem; }
    .swagger-ui .info h2 { color: #00d4ff; }
    body { background: #0f172a; }
  `,
  customSiteTitle: 'Quantum Bank API Docs',
  swaggerOptions: {
    persistAuthorization: true,
    tryItOutEnabled: true,
    displayRequestDuration: true,
    filter: true
  }
};

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

// Expose raw OpenAPI JSON
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(swaggerSpec);
});

// ─── HEALTH ROUTE ────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    gateway: 'ONLINE',
    auth_service: AUTH_SERVICE_URL,
    transaction_service: TRANSACTION_SERVICE_URL,
    timestamp: new Date(),
    docs: `/api/docs`
  });
});

// ─── AUTH MIDDLEWARE ─────────────────────────────────────────────────────────
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization token required.' });
  }

  try {
    const verifyResponse = await fetch(`${AUTH_SERVICE_URL}/api/auth/verify`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader
      }
    });

    if (!verifyResponse.ok) {
      const errData = await verifyResponse.json();
      return res.status(verifyResponse.status).json(errData);
    }

    const { user } = await verifyResponse.json();
    req.user = user;
    next();
  } catch (err) {
    console.error('Auth verification error in gateway:', err.message);
    res.status(500).json({ error: 'Internal Auth Service communication failure.' });
  }
}

// ─── AUTH ROUTES ──────────────────────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  try {
    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Auth Service unavailable.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Auth Service unavailable.' });
  }
});

// ─── TRANSACTION ROUTES ───────────────────────────────────────────────────────
app.get('/api/transactions/balance', authenticateToken, async (req, res) => {
  try {
    const response = await fetch(`${TRANSACTION_SERVICE_URL}/api/transactions/balance`, {
      method: 'GET',
      headers: {
        'x-user-id': req.user.id,
        'x-user-username': req.user.username
      }
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Transaction Service unavailable.' });
  }
});

app.get('/api/transactions/history', authenticateToken, async (req, res) => {
  try {
    const response = await fetch(`${TRANSACTION_SERVICE_URL}/api/transactions/history`, {
      method: 'GET',
      headers: {
        'x-user-id': req.user.id
      }
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Transaction Service unavailable.' });
  }
});

app.post('/api/transactions/transfer', authenticateToken, async (req, res) => {
  try {
    const response = await fetch(`${TRANSACTION_SERVICE_URL}/api/transactions/transfer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': req.user.id,
        'x-user-username': req.user.username
      },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Transaction Service unavailable.' });
  }
});

app.post('/api/transactions/deposit', authenticateToken, async (req, res) => {
  try {
    const response = await fetch(`${TRANSACTION_SERVICE_URL}/api/transactions/deposit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': req.user.id,
        'x-user-username': req.user.username
      },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Transaction Service unavailable.' });
  }
});

app.post('/api/transactions/withdraw', authenticateToken, async (req, res) => {
  try {
    const response = await fetch(`${TRANSACTION_SERVICE_URL}/api/transactions/withdraw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': req.user.id,
        'x-user-username': req.user.username
      },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Transaction Service unavailable.' });
  }
});

app.post('/api/transactions/transfer-interbank', authenticateToken, async (req, res) => {
  try {
    const response = await fetch(`${TRANSACTION_SERVICE_URL}/api/transactions/transfer-interbank`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': req.user.id,
        'x-user-username': req.user.username
      },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Transaction Service unavailable.' });
  }
});

// ─── DIAGNOSTICS ROUTE ────────────────────────────────────────────────────────
const { exec } = require('child_process');
const path = require('path');

app.post('/api/diagnostics/run-command', authenticateToken, (req, res) => {
  const { command } = req.body;

  if (!command) {
    return res.status(400).json({ error: 'Command is required.' });
  }

  if (!command.startsWith('npx vitest run') && !command.startsWith('node tests/manual/')) {
    return res.status(400).json({ error: 'Command not authorized. Only "npx vitest run" or "node tests/manual/" commands are supported.' });
  }

  const frontendPath = path.resolve(__dirname, '../frontend');

  exec(command, { cwd: frontendPath }, (error, stdout, stderr) => {
    res.json({
      stdout: stdout || '',
      stderr: stderr || '',
      success: !error
    });
  });
});

// ─── START SERVER ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 API Gateway listening on port ${PORT}`);
  console.log(`📚 Swagger Docs: http://localhost:${PORT}/api/docs`);
  console.log(`🔗 OpenAPI JSON: http://localhost:${PORT}/api/docs.json\n`);
});

module.exports = app;
