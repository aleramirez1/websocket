const Validator = require('../utils/validator');
const Logger = require('../utils/logger');

class ConductorController {
  constructor(clienteService, ubicacionService, broadcastService) {
    this.clienteService = clienteService;
    this.ubicacionService = ubicacionService;
    this.broadcastService = broadcastService;
  }

  conectar(ws, userId, datos) {
    try {
      this.clienteService.registrarConductor(
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
      
      const mensaje = {
        type: 'location_update',
        conductor_id: conductorId,
        ...ubicacionJSON
      };

      const resultado = this.broadcastService.enviarATodos(mensaje);

      Logger.conductor('Ubicación actualizada', conductorId, {
        lat: ubicacion.lat,
        lng: ubicacion.lng,
        enviados: resultado.enviados
      });

      return {
        success: true,
        data: {
          type: 'location_ack',
          message: 'Ubicación recibida y distribuida',
          clientes_notificados: resultado.enviados,
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

  desconectar(conductorId) {
    try {
      this.clienteService.eliminarConductor(conductorId);
      this.ubicacionService.eliminarUbicacion(conductorId);
      
      const mensaje = {
        type: 'conductor_disconnected',
        conductor_id: conductorId,
        timestamp: Date.now()
      };

      this.broadcastService.enviarATodos(mensaje);

      Logger.conductor('Desconectado', conductorId);
    } catch (error) {
      Logger.error('Error desconectando conductor', error);
    }
  }
}

module.exports = ConductorController;
