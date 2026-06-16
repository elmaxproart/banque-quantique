import http from 'http';

const services = [
  { name: 'Gateway Node (Public)', url: 'http://localhost:10000/health' },
  { name: 'Authentication API', url: 'http://localhost:10001/health' },
  { name: 'Transactions API', url: 'http://localhost:10002/health' }
];

console.log(`====================================================`);
console.log(`QUANTUM CORE BANKING SYSTEM - INTEGRITY AUDIT`);
console.log(`Checking microservice lanes and status...`);
console.log(`====================================================\n`);

let checked = 0;

const checkService = (service) => {
  const start = Date.now();
  
  const req = http.get(service.url, (res) => {
    const latency = Date.now() - start;
    let body = '';
    
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
      console.log(`[+] ${service.name} -> ONLINE`);
      console.log(`    Statut  : ${res.statusCode} OK`);
      console.log(`    Latence : ${latency} ms`);
      console.log(`    Réponse : ${body.substring(0, 100)}`);
      console.log(`-----------------------------------------------`);
      next();
    });
  });

  req.on('error', (err) => {
    console.log(`[X] ${service.name} -> OFFLINE`);
    console.log(`    Erreur  : ${err.message}`);
    console.log(`-----------------------------------------------`);
    next();
  });

  req.setTimeout(2000, () => {
    req.destroy();
  });
};

const next = () => {
  checked++;
  if (checked < services.length) {
    checkService(services[checked]);
  } else {
    console.log(`\nAudit d'intégrité système complété.`);
  }
};

checkService(services[0]);
