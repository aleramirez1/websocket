const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'tu_secreto_jwt_super_secreto_cambialo_en_produccion';

const token = process.argv[2];

if (!token) {
  console.log('❌ Uso: node test-decode-jwt.js <tu_token_jwt>');
  console.log('\nEjemplo:');
  console.log('node test-decode-jwt.js eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
  process.exit(1);
}

try {
  const decoded = jwt.verify(token, SECRET);
  
  console.log('✅ Token JWT válido\n');
  console.log('📋 Contenido decodificado:');
  console.log(JSON.stringify(decoded, null, 2));
  console.log();
  
  if (decoded.user_id && decoded.role_id) {
    console.log('✅ user_id:', decoded.user_id);
    console.log('✅ role_id:', decoded.role_id);
    console.log();
    
    const role = decoded.role_id === 4 ? 'Conductor 🚛' : decoded.role_id === 3 ? 'Ciudadano 👤' : 'Desconocido';
    console.log('👤 Rol:', role);
    
    if (decoded.exp) {
      const expDate = new Date(decoded.exp * 1000);
      const now = new Date();
      const isExpired = expDate < now;
      
      console.log('⏰ Expira:', expDate.toLocaleString());
      console.log(isExpired ? '❌ Token EXPIRADO' : '✅ Token VÁLIDO');
    }
  } else {
    console.log('⚠️  Token no contiene user_id o role_id');
  }
  
} catch (error) {
  console.log('❌ Error verificando token:', error.message);
  
  if (error.name === 'TokenExpiredError') {
    console.log('\n💡 El token ha expirado. Genera uno nuevo desde tu backend.');
  } else if (error.name === 'JsonWebTokenError') {
    console.log('\n💡 Token inválido o JWT_SECRET incorrecto.');
    console.log('   Verifica que el JWT_SECRET del servidor coincida con el que genera los tokens.');
  }
}
