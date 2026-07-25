const Validator = require('../utils/validator');
const Logger = require('../utils/logger');

class AnomaliaController {
  constructor(broadcastService) {
    this.broadcastService = broadcastService;
  }

  notificarRecalculoRuta(data) {
    const errores = [];

    if (!data.conductores_ids || !Array.isArray(data.conductores_ids) || data.conductores_ids.length === 0) {
      errores.push('conductores_ids es requerido y debe ser un arreglo');
    }

    if (!data.camiones_ids || !Array.isArray(data.camiones_ids) || data.camiones_ids.length === 0) {
      errores.push('camiones_ids es requerido y debe ser un arreglo');
    }

    if (!data.id_anomalia) {
      errores.push('id_anomalia es requerido');
    }

    if (errores.length > 0) {
      return {
        success: false,
        error: 'Datos inválidos',
        details: errores
      };
    }

    try {
      const mensaje = {
        type: 'recalculo_ruta',
        conductores_ids: data.conductores_ids,
        camiones_ids: data.camiones_ids,
        id_anomalia: data.id_anomalia,
        lat: data.lat,
        lng: data.lng,
        descripcion: data.descripcion,
        status: data.status,
        timestamp: Date.now()
      };

      const resultado = this.broadcastService.enviarATodos(mensaje);

      Logger.info(`Recálculo de ruta - conductores: [${data.conductores_ids}], camiones: [${data.camiones_ids}], anomalía: ${data.id_anomalia} - notificado a ${resultado.enviados} clientes`);

      return {
        success: true,
        data: {
          type: 'recalculo_ruta',
          message: 'Recálculo de ruta notificado correctamente',
          conductores_ids: data.conductores_ids,
          camiones_ids: data.camiones_ids,
          timestamp: Date.now()
        }
      };
    } catch (error) {
      Logger.error('Error notificando recálculo de ruta', error);
      return {
        success: false,
        error: 'Error en el servidor al notificar recálculo de ruta'
      };
    }
  }

  notificarRutaAnomalia(data) {
    const validacion = Validator.validarAnomalia(data);

    if (!validacion.valido) {
      return {
        success: false,
        error: 'Anomalía inválida',
        details: validacion.errores
      };
    }

    try {
      const mensaje = {
        type: 'ruta_anomalia',
        id_anomalia: data.id_anomalia,
        lat: data.lat,
        lng: data.lng,
        texto: data.texto,
        status: data.status,
        timestamp: Date.now()
      };

      const resultado = this.broadcastService.enviarATodos(mensaje);

      Logger.info(`Anomalía de ruta ${data.id_anomalia} notificada a ${resultado.enviados} clientes`);

      return {
        success: true,
        data: {
          message: 'Anomalía de ruta notificada correctamente',
          clientes_notificados: resultado.enviados,
          timestamp: Date.now()
        }
      };
    } catch (error) {
      Logger.error('Error notificando anomalía de ruta', error);
      return {
        success: false,
        error: 'Error en el servidor al notificar anomalía de ruta'
      };
    }
  }
}

module.exports = AnomaliaController;
