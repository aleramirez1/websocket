const Logger = require('../utils/logger');

class ErrorHandler {
  static manejarError(ws, error, contexto = 'Operación') {
    Logger.error(`${contexto} falló`, error);

    const respuesta = {
      type: 'error',
      message: error.message || 'Error desconocido',
      timestamp: Date.now()
    };

    try {
      if (ws.readyState === 1) {
        ws.send(JSON.stringify(respuesta));
      }
    } catch (sendError) {
      Logger.error('Error enviando mensaje de error', sendError);
    }
  }

  static manejarValidacion(ws, errores) {
    const respuesta = {
      type: 'validation_error',
      errors: errores,
      timestamp: Date.now()
    };

    try {
      if (ws.readyState === 1) {
        ws.send(JSON.stringify(respuesta));
      }
    } catch (error) {
      Logger.error('Error enviando errores de validación', error);
    }
  }

  static crearRespuestaError(mensaje, codigo = 'ERROR') {
    return {
      type: 'error',
      code: codigo,
      message: mensaje,
      timestamp: Date.now()
    };
  }
}

module.exports = ErrorHandler;
