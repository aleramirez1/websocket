const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:8080');

ws.on('open', () => {
  console.log('✅ CONECTADO al servidor\n');
  
  console.log('📤 Registrando como ciudadano...');
  ws.send(JSON.stringify({
    type: 'register_ciudadano',
    ciudadano_id: 456,
    nombre: 'María López'
  }));
  
  setTimeout(() => {
    console.log('\n📤 Solicitando ubicaciones...');
    ws.send(JSON.stringify({
      type: 'request_locations'
    }));
  }, 1000);
  
  setTimeout(() => {
    console.log('\n🔌 Cerrando conexión...');
    ws.close();
  }, 5000);
});

ws.on('message', (data) => {
  const msg = JSON.parse(data);
  console.log('📩 RECIBIDO:', JSON.stringify(msg, null, 2));
});

ws.on('error', (error) => {
  console.error('❌ ERROR:', error.message);
});

ws.on('close', () => {
  console.log('\n🔌 DESCONECTADO del servidor');
  process.exit(0);
});
