const jwt = require('jsonwebtoken');
const Logger = require('../utils/logger');

class AuthMiddleware {
  constructor(secret) {
    this.secret = secret;
  }

  verificarToken(token) {
    try {
      const decoded = jwt.verify(token, this.secret);
      return {
        valido: true,
        datos: decoded
      };
    } catch (error) {
      Logger.error('Error verificando token JWT', error);
      return {
        valido: false,
        error: error.message
      };
    }
  }

  autenticar(message) {
    if (!message.token) {
      return {
        valido: false,
        error: 'Token JWT es requerido'
      };
    }

    const resultado = this.verificarToken(message.token);
    
    if (!resultado.valido) {
      return {
        valido: false,
        error: 'Token JWT inválido o expirado'
      };
    }

    const { user_id, role_id } = resultado.datos;

    if (!user_id || !role_id) {
      return {
        valido: false,
        error: 'Token JWT no contiene user_id o role_id'
      };
    }

    return {
      valido: true,
      userId: user_id,
      roleId: role_id,
      datos: resultado.datos
    };
  }

  esConductor(roleId) {
    return roleId === 4;
  }

  esCiudadano(roleId) {
    return roleId === 3 || roleId === 5;
  }
}

module.exports = AuthMiddleware;
