const WebSocket = require('ws');

const token = process.argv[2];

if (!token) {
  console.log('❌ Uso: node test-ws-connection.js <tu_token_jwt>');
  console.log('\nEjemplo:');
  console.log('node test-ws-connection.js eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
  process.exit(1);
}

const url = `ws://localhost:8080?token=${encodeURIComponent(token)}`;

console.log('🔌 Conectando a:', url.substring(0, 50) + '...');
console.log('🔑 Token:', token.substring(0, 30) + '...\n');

const ws = new WebSocket(url);

ws.on('open', () => {
  console.log('✅ CONEXIÓN EXITOSA\n');
});

ws.on('message', (data) => {
  console.log('📥 Mensaje recibido:');
  try {
    const parsed = JSON.parse(data);
    console.log(JSON.stringify(parsed, null, 2));
  } catch {
    console.log(data.toString());
  }
});

ws.on('error', (error) => {
  console.log('❌ ERROR:', error.message);
});

ws.on('close', (code, reason) => {
  console.log(`\n🔌 Conexión cerrada - Código: ${code}, Razón: ${reason || 'Sin razón'}`);
  process.exit(code === 1000 ? 0 : 1);
});

setTimeout(() => {
  if (ws.readyState !== WebSocket.OPEN) {
    console.log('\n⏰ Timeout - el servidor no respondió');
    ws.close();
  }
}, 5000);
