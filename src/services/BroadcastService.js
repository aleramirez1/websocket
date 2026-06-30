const Logger = require('../utils/logger');

class BroadcastService {
  constructor(clienteService) {
    this.clienteService = clienteService;
  }

  enviarACiudadanos(data) {
    const ciudadanos = this.clienteService.obtenerTodosCiudadanos();
    let enviados = 0;
    let fallidos = 0;

    ciudadanos.forEach(ciudadano => {
      try {
        if (ciudadano.ws.readyState === 1) {
          ciudadano.enviar(data);
          enviados++;
        }
      } catch (error) {
        fallidos++;
        Logger.error(`Error enviando a ciudadano ${ciudadano.id}`, error);
      }
    });

    if (enviados > 0) {
      Logger.broadcast(data.type, enviados, 'ciudadano');
    }

    if (fallidos > 0) {
      Logger.warning(`${fallidos} envíos fallidos`);
    }

    return enviados;
  }

  notificarConductorConectado(conductor) {
    const mensaje = {
      type: 'conductor_connected',
      conductor_id: conductor.id,
      nombre: conductor.nombre,
      ruta_id: conductor.rutaId,
      timestamp: Date.now()
    };
    return this.enviarACiudadanos(mensaje);
  }

  notificarConductorDesconectado(conductorId) {
    const mensaje = {
      type: 'conductor_disconnected',
      conductor_id: conductorId,
      timestamp: Date.now()
    };
    return this.enviarACiudadanos(mensaje);
  }

  notificarUbicacionActualizada(conductorId, ubicacion) {
    const mensaje = {
      type: 'location_update',
      conductor_id: conductorId,
      ...ubicacion
    };
    return this.enviarACiudadanos(mensaje);
  }

  enviarMensajeGlobal(mensaje, tipo = 'notification') {
    const data = {
      type: tipo,
      message: mensaje,
      timestamp: Date.now()
    };
    return this.enviarACiudadanos(data);
  }
}

module.exports = BroadcastService;
