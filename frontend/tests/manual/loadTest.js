import http from 'http';

const targetUrl = 'http://localhost:10000/health';
const totalRequests = 100;
const concurrency = 10;

console.log(`====================================================`);
console.log(`QUANTUM CORE BANKING SYSTEM - MANUAL LOAD TESTING`);
console.log(`Simulating "hey" benchmark utility`);
console.log(`Target: ${targetUrl}`);
console.log(`Total Requests: ${totalRequests} | Concurrency: ${concurrency}`);
console.log(`====================================================\n`);

let completed = 0;
let successCount = 0;
let failCount = 0;
const latencies = [];
const startTime = Date.now();

const sendRequest = () => {
  if (completed >= totalRequests) {
    if (latencies.length === totalRequests) {
      printSummary();
    }
    return;
  }

  const reqIndex = completed++;
  const reqStart = Date.now();

  http.get(targetUrl, (res) => {
    const latency = Date.now() - reqStart;
    latencies.push(latency);
    
    if (res.statusCode === 200) {
      successCount++;
    } else {
      failCount++;
    }

    res.resume(); // Consume response data to free memory
    sendNext();
  }).on('error', (err) => {
    const latency = Date.now() - reqStart;
    latencies.push(latency);
    failCount++;
    sendNext();
  });
};

const sendNext = () => {
  if (completed < totalRequests) {
    sendRequest();
  } else if (latencies.length === totalRequests) {
    printSummary();
  }
};

const printSummary = () => {
  const duration = (Date.now() - startTime) / 1000;
  const avgLatency = latencies.reduce((acc, val) => acc + val, 0) / latencies.length;
  const minLatency = Math.min(...latencies);
  const maxLatency = Math.max(...latencies);
  const rps = (successCount + failCount) / duration;

  console.log(`Rapport d'analyse de performance (Load Test) :`);
  console.log(`-----------------------------------------------`);
  console.log(`Durée totale de l'analyse : ${duration.toFixed(3)} secondes`);
  console.log(`Requêtes réussies         : ${successCount}`);
  console.log(`Requêtes échouées         : ${failCount}`);
  console.log(`Débit (Throughput)        : ${rps.toFixed(2)} req/sec`);
  console.log(`\nStatistiques de latence :`);
  console.log(`  Moyenne  : ${avgLatency.toFixed(1)} ms`);
  console.log(`  Min      : ${minLatency} ms`);
  console.log(`  Max      : ${maxLatency} ms`);
  console.log(`-----------------------------------------------`);
};

// Spawn initial concurrent batch
for (let i = 0; i < concurrency; i++) {
  sendRequest();
}
