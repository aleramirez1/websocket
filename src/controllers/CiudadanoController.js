const Logger = require('../utils/logger');

class CiudadanoController {
  constructor(clienteService, ubicacionService, suscripcionService) {
    this.clienteService = clienteService;
    this.ubicacionService = ubicacionService;
    this.suscripcionService = suscripcionService;
  }

  conectar(ws, userId, datos) {
    try {
      const ciudadano = this.clienteService.registrarCiudadano(
        ws,
        userId,
        datos.nombre || `Ciudadano ${userId}`
      );

      Logger.ciudadano('Conectado', userId);

      return {
        success: true,
        ciudadano: ciudadano,
        data: {
          type: 'connected',
          role: 'ciudadano',
          user_id: userId,
          message: 'Ciudadano conectado exitosamente',
          timestamp: Date.now()
        }
      };
    } catch (error) {
      Logger.error('Error conectando ciudadano', error);
      return {
        success: false,
        error: 'Error en el servidor al conectar ciudadano'
      };
    }
  }

  suscribir(ws, ciudadanoId, conductorId) {
    if (!conductorId) {
      return {
        success: false,
        error: 'conductor_id es requerido'
      };
    }

    try {
      this.suscripcionService.suscribir(ciudadanoId, conductorId, ws);

      const ubicacion = this.ubicacionService.obtenerUbicacion(conductorId);

      return {
        success: true,
        data: {
          type: 'subscribed',
          conductor_id: conductorId,
          message: 'Suscrito al conductor exitosamente',
          ubicacion_actual: ubicacion ? ubicacion.toJSON() : null,
          timestamp: Date.now()
        }
      };
    } catch (error) {
      Logger.error('Error suscribiendo a conductor', error);
      return {
        success: false,
        error: 'Error en el servidor al suscribir'
      };
    }
  }

  desuscribir(ciudadanoId, conductorId) {
    if (!conductorId) {
      return {
        success: false,
        error: 'conductor_id es requerido'
      };
    }

    try {
      this.suscripcionService.desuscribir(ciudadanoId, conductorId);

      return {
        success: true,
        data: {
          type: 'unsubscribed',
          conductor_id: conductorId,
          message: 'Desuscrito del conductor',
          timestamp: Date.now()
        }
      };
    } catch (error) {
      Logger.error('Error desuscribiendo de conductor', error);
      return {
        success: false,
        error: 'Error en el servidor al desuscribir'
      };
    }
  }

  obtenerSuscripciones(ciudadanoId) {
    const suscripciones = this.suscripcionService.obtenerSuscripcionesCiudadano(ciudadanoId);
    
    const conductores = suscripciones.map(conductorId => {
      const ubicacion = this.ubicacionService.obtenerUbicacion(conductorId);
      return {
        conductor_id: conductorId,
        ubicacion: ubicacion ? ubicacion.toJSON() : null
      };
    });

    return {
      success: true,
      data: {
        type: 'subscriptions',
        conductores: conductores,
        count: conductores.length,
        timestamp: Date.now()
      }
    };
  }

  desconectar(ciudadano) {
    try {
      this.suscripcionService.desuscribirTodos(ciudadano.id);
      this.clienteService.eliminarCiudadano(ciudadano);
    } catch (error) {
      Logger.error('Error desconectando ciudadano', error);
    }
  }
}

module.exports = CiudadanoController;
