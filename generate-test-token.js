const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'tu_secreto_jwt_super_secreto_cambialo_en_produccion';

console.log('🔐 Generador de Token JWT de Prueba');
console.log('⚠️  Este script es solo para pruebas. En producción, genera tokens desde tu backend.\n');

const tokenConductor = jwt.sign({
  user_id: 314,
  role_id: 4,
  nombre: 'Juan Pérez (Prueba)',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
}, SECRET);

const tokenCiudadano = jwt.sign({
  user_id: 456,
  role_id: 3,
  nombre: 'María López (Prueba)',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
}, SECRET);

console.log('👤 CONDUCTOR (user_id: 314, role_id: 4)');
console.log('ws://localhost:8080?token=' + tokenConductor);
console.log();

console.log('👤 CIUDADANO (user_id: 456, role_id: 3)');
console.log('ws://localhost:8080?token=' + tokenCiudadano);
console.log();

console.log('📝 Copia estas URLs completas en Postman');
console.log('⏰ Los tokens expiran en 24 horas');
