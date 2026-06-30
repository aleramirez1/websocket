const Validator = require('../utils/validator');
const Logger = require('../utils/logger');

class ConductorController {
  constructor(clienteService, ubicacionService, suscripcionService) {
    this.clienteService = clienteService;
    this.ubicacionService = ubicacionService;
    this.suscripcionService = suscripcionService;
  }

  conectar(ws, userId, datos) {
    try {
      const conductor = this.clienteService.registrarConductor(
        ws,
        userId,
        datos.nombre || `Conductor ${userId}`,
        null
      );

      Logger.conductor('Conectado', userId);

      return {
        success: true,
        data: {
          type: 'connected',
          role: 'conductor',
          user_id: userId,
          message: 'Conductor conectado exitosamente',
          timestamp: Date.now()
        }
      };
    } catch (error) {
      Logger.error('Error conectando conductor', error);
      return {
        success: false,
        error: 'Error en el servidor al conectar conductor'
      };
    }
  }

  actualizarUbicacion(conductorId, data) {
    const validacion = Validator.validarUbicacion(data);
    
    if (!validacion.valido) {
      return {
        success: false,
        error: 'Ubicación inválida',
        details: validacion.errores
      };
    }

    try {
      const conductor = this.clienteService.obtenerConductor(conductorId);
      
      if (!conductor) {
        return {
          success: false,
          error: 'Conductor no encontrado'
        };
      }

      const ubicacion = this.ubicacionService.guardarUbicacion(conductorId, data);
      const ubicacionJSON = ubicacion.toJSON();
      
      const suscriptores = this.suscripcionService.obtenerSuscriptores(conductorId);
      let enviados = 0;

      suscriptores.forEach((ws, ciudadanoId) => {
        try {
          if (ws.readyState === 1) {
            ws.send(JSON.stringify({
              type: 'location_update',
              conductor_id: conductorId,
              ...ubicacionJSON
            }));
            enviados++;
          }
        } catch (error) {
          Logger.error(`Error enviando a ciudadano ${ciudadanoId}`, error);
        }
      });

      Logger.conductor('Ubicación actualizada', conductorId, {
        lat: ubicacion.lat,
        lng: ubicacion.lng,
        suscriptores: enviados
      });

      return {
        success: true,
        data: {
          type: 'location_ack',
          message: 'Ubicación recibida y distribuida',
          suscriptores: enviados,
          timestamp: Date.now()
        }
      };
    } catch (error) {
      Logger.error('Error actualizando ubicación', error);
      return {
        success: false,
        error: 'Error en el servidor al actualizar ubicación'
      };
    }
  }

  obtenerInfo(conductorId) {
    const conductor = this.clienteService.obtenerConductor(conductorId);
    
    if (!conductor) {
      return {
        success: false,
        error: 'Conductor no encontrado'
      };
    }

    const ubicacion = this.ubicacionService.obtenerUbicacion(conductorId);
    const suscriptores = this.suscripcionService.obtenerSuscriptores(conductorId);

    return {
      success: true,
      data: {
        conductor_id: conductor.id,
        nombre: conductor.nombre,
        conectado_desde: conductor.conectadoEn,
        ubicacion: ubicacion ? ubicacion.toJSON() : null,
        suscriptores: suscriptores.size
      }
    };
  }

  desconectar(conductorId) {
    try {
      this.clienteService.eliminarConductor(conductorId);
      this.ubicacionService.eliminarUbicacion(conductorId);
      
      const suscriptores = this.suscripcionService.obtenerSuscriptores(conductorId);
      
      suscriptores.forEach((ws, ciudadanoId) => {
        try {
          if (ws.readyState === 1) {
            ws.send(JSON.stringify({
              type: 'conductor_disconnected',
              conductor_id: conductorId,
              timestamp: Date.now()
            }));
          }
        } catch (error) {
          Logger.error(`Error notificando a ciudadano ${ciudadanoId}`, error);
        }
      });

      Logger.conductor('Desconectado', conductorId);
    } catch (error) {
      Logger.error('Error desconectando conductor', error);
    }
  }
}

module.exports = ConductorController;
