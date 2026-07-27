const Logger = require('../utils/logger');

class CiudadanoController {
  constructor(clienteService, ubicacionService) {
    this.clienteService = clienteService;
    this.ubicacionService = ubicacionService;
  }

  conectar(ws, userId, datos) {
    try {
      const ciudadano = this.clienteService.registrarCiudadano(
        ws,
        userId,
        datos.nombre || `Ciudadano ${userId}`
      );

      Logger.ciudadano('Conectado', userId);

      // El ciudadano puede conectarse despues de que el conductor ya empezo
      // a transmitir (o reconectar tras un corte). Sin esto no veia el
      // camion hasta el siguiente location_update del conductor.
      this._enviarUltimasUbicaciones(ws, userId);

      return {
        success: true,
        ciudadano: ciudadano,
        data: {
          type: 'connected',
          role: 'ciudadano',
          user_id: userId,
          message: 'Ciudadano conectado. Recibiras actualizaciones de todos los conductores',
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

  _enviarUltimasUbicaciones(ws, userId) {
    if (!this.ubicacionService) return;

    try {
      const ubicaciones = this.ubicacionService.obtenerTodasUbicaciones();

      ubicaciones.forEach((ubicacion) => {
        if (ws.readyState !== 1) return;
        ws.send(JSON.stringify({
          type: 'location_update',
          ...ubicacion
        }));
      });

      if (ubicaciones.length > 0) {
        Logger.ciudadano(
          `Enviadas ${ubicaciones.length} ultima(s) ubicacion(es) conocida(s)`,
          userId
        );
      }
    } catch (error) {
      Logger.error('Error enviando ultimas ubicaciones al ciudadano', error);
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
