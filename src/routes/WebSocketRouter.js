const Logger = require('../utils/logger');
const ErrorHandler = require('../middleware/ErrorHandler');

class WebSocketRouter {
  constructor(conductorController, ciudadanoController, authMiddleware) {
    this.conductorController = conductorController;
    this.ciudadanoController = ciudadanoController;
    this.authMiddleware = authMiddleware;
  }

  manejarMensaje(ws, message, clienteMeta) {
    let data;

    try {
      data = JSON.parse(message);
    } catch (error) {
      Logger.error('Error parseando JSON', error);
      ErrorHandler.manejarError(ws, new Error('JSON inválido'), 'Parseo');
      return;
    }

    if (!data.type) {
      ErrorHandler.manejarError(ws, new Error('Tipo de mensaje no especificado'), 'Validación');
      return;
    }

    try {
      switch (data.type) {
        case 'location_update':
          this.actualizarUbicacion(ws, data, clienteMeta);
          break;
        
        case 'subscribe':
          this.suscribir(ws, data, clienteMeta);
          break;
        
        case 'unsubscribe':
          this.desuscribir(ws, data, clienteMeta);
          break;
        
        case 'get_subscriptions':
          this.obtenerSuscripciones(ws, clienteMeta);
          break;
        
        case 'get_info':
          this.obtenerInfo(ws, clienteMeta);
          break;
        
        case 'ping':
          this.ping(ws);
          break;
        
        default:
          Logger.warning(`Tipo de mensaje desconocido: ${data.type}`);
          ws.send(JSON.stringify({
            type: 'error',
            message: `Tipo de mensaje desconocido: ${data.type}`,
            timestamp: Date.now()
          }));
      }
    } catch (error) {
      Logger.error('Error manejando mensaje', error);
      ErrorHandler.manejarError(ws, error, 'Procesamiento de mensaje');
    }
  }

  actualizarUbicacion(ws, data, clienteMeta) {
    if (clienteMeta.tipo !== 'conductor') {
      const errorResponse = ErrorHandler.crearRespuestaError(
        'Solo conductores pueden enviar ubicaciones',
        'UNAUTHORIZED'
      );
      ws.send(JSON.stringify(errorResponse));
      return;
    }

    const resultado = this.conductorController.actualizarUbicacion(
      clienteMeta.userId,
      data
    );
    
    if (resultado.success) {
      ws.send(JSON.stringify(resultado.data));
    } else {
      const errorResponse = ErrorHandler.crearRespuestaError(
        resultado.error,
        'UBICACION_UPDATE'
      );
      if (resultado.details) {
        errorResponse.details = resultado.details;
      }
      ws.send(JSON.stringify(errorResponse));
    }
  }

  suscribir(ws, data, clienteMeta) {
    if (clienteMeta.tipo !== 'ciudadano') {
      const errorResponse = ErrorHandler.crearRespuestaError(
        'Solo ciudadanos pueden suscribirse',
        'UNAUTHORIZED'
      );
      ws.send(JSON.stringify(errorResponse));
      return;
    }

    const resultado = this.ciudadanoController.suscribir(
      ws,
      clienteMeta.userId,
      data.conductor_id
    );
    
    if (resultado.success) {
      ws.send(JSON.stringify(resultado.data));
    } else {
      const errorResponse = ErrorHandler.crearRespuestaError(
        resultado.error,
        'SUSCRIPCION'
      );
      ws.send(JSON.stringify(errorResponse));
    }
  }

  desuscribir(ws, data, clienteMeta) {
    if (clienteMeta.tipo !== 'ciudadano') {
      const errorResponse = ErrorHandler.crearRespuestaError(
        'Solo ciudadanos pueden desuscribirse',
        'UNAUTHORIZED'
      );
      ws.send(JSON.stringify(errorResponse));
      return;
    }

    const resultado = this.ciudadanoController.desuscribir(
      clienteMeta.userId,
      data.conductor_id
    );
    
    if (resultado.success) {
      ws.send(JSON.stringify(resultado.data));
    } else {
      const errorResponse = ErrorHandler.crearRespuestaError(
        resultado.error,
        'DESUSCRIPCION'
      );
      ws.send(JSON.stringify(errorResponse));
    }
  }

  obtenerSuscripciones(ws, clienteMeta) {
    if (clienteMeta.tipo !== 'ciudadano') {
      const errorResponse = ErrorHandler.crearRespuestaError(
        'Solo ciudadanos pueden ver suscripciones',
        'UNAUTHORIZED'
      );
      ws.send(JSON.stringify(errorResponse));
      return;
    }

    const resultado = this.ciudadanoController.obtenerSuscripciones(clienteMeta.userId);
    ws.send(JSON.stringify(resultado.data));
  }

  obtenerInfo(ws, clienteMeta) {
    if (clienteMeta.tipo !== 'conductor') {
      const errorResponse = ErrorHandler.crearRespuestaError(
        'Solo conductores pueden solicitar su información',
        'UNAUTHORIZED'
      );
      ws.send(JSON.stringify(errorResponse));
      return;
    }

    const resultado = this.conductorController.obtenerInfo(clienteMeta.userId);
    
    if (resultado.success) {
      ws.send(JSON.stringify({
        type: 'info_response',
        data: resultado.data,
        timestamp: Date.now()
      }));
    } else {
      const errorResponse = ErrorHandler.crearRespuestaError(
        resultado.error,
        'INFO_REQUEST'
      );
      ws.send(JSON.stringify(errorResponse));
    }
  }

  ping(ws) {
    ws.send(JSON.stringify({
      type: 'pong',
      timestamp: Date.now()
    }));
  }

  manejarDesconexion(clienteMeta) {
    if (!clienteMeta.autenticado) return;

    if (clienteMeta.tipo === 'conductor' && clienteMeta.userId) {
      this.conductorController.desconectar(clienteMeta.userId);
    } else if (clienteMeta.tipo === 'ciudadano' && clienteMeta.ciudadano) {
      this.ciudadanoController.desconectar(clienteMeta.ciudadano);
    }
  }
}

module.exports = WebSocketRouter;
