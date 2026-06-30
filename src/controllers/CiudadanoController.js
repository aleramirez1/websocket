const Logger = require('../utils/logger');

class CiudadanoController {
  constructor(clienteService) {
    this.clienteService = clienteService;
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
          message: 'Ciudadano conectado. Recibirás actualizaciones de todos los conductores',
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

  desconectar(ciudadano) {
    try {
      this.clienteService.eliminarCiudadano(ciudadano);
    } catch (error) {
      Logger.error('Error desconectando ciudadano', error);
    }
  }
}

module.exports = CiudadanoController;
