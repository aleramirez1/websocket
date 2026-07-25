const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:8080');

ws.on('open', () => {
  console.log('CONECTADO al servidor\n');
  
  console.log('Registrando como ciudadano...');
  ws.send(JSON.stringify({
    type: 'register_ciudadano',
    ciudadano_id: 456,
    nombre: 'Maria Lopez'
  }));
  
  setTimeout(() => {
    console.log('\nSolicitando ubicaciones...');
    ws.send(JSON.stringify({
      type: 'request_locations'
    }));
  }, 1000);
  
  setTimeout(() => {
    console.log('\nCerrando conexion...');
    ws.close();
  }, 5000);
});

ws.on('message', (data) => {
  const msg = JSON.parse(data);
  console.log('RECIBIDO:', JSON.stringify(msg, null, 2));
});

ws.on('error', (error) => {
  console.error('ERROR:', error.message);
});

ws.on('close', () => {
  console.log('\nDESCONECTADO del servidor');
  process.exit(0);
});
