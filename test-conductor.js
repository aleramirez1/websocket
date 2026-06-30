const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:8080');

ws.on('open', () => {
  console.log('✅ CONECTADO al servidor\n');
  
  console.log('📤 Registrando como conductor...');
  ws.send(JSON.stringify({
    type: 'register_conductor',
    conductor_id: 123,
    nombre: 'Juan Pérez',
    ruta_id: 1
  }));
  
  setTimeout(() => {
    console.log('\n📤 Enviando ubicación...');
    ws.send(JSON.stringify({
      type: 'location_update',
      lat: 16.6234,
      lng: -93.1023,
      velocidad: 25.5,
      rumbo: 180,
      en_servicio: true,
      ruta_id: 1
    }));
  }, 1000);
  
  setTimeout(() => {
    console.log('\n📤 Enviando segunda ubicación...');
    ws.send(JSON.stringify({
      type: 'location_update',
      lat: 16.6245,
      lng: -93.1034,
      velocidad: 30.2,
      rumbo: 185,
      en_servicio: true,
      ruta_id: 1
    }));
  }, 2000);
  
  setTimeout(() => {
    console.log('\n🔌 Cerrando conexión...');
    ws.close();
  }, 3000);
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
