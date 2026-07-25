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
        error: 'Datos invalidos',
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

      const resultadoCiudadanos = this.broadcastService.enviarATodos(mensaje);

      const mensajeConductor = {
        type: 'recalcular_ruta_conductor',
        conductores_ids: data.conductores_ids,
        camiones_ids: data.camiones_ids,
        id_anomalia: data.id_anomalia,
        lat: data.lat,
        lng: data.lng,
        descripcion: data.descripcion,
        status: data.status,
        timestamp: Date.now()
      };

      const resultadoConductores = this.broadcastService.enviarAConductores(
        data.conductores_ids,
        mensajeConductor
      );

      Logger.info(`Recalculo de ruta - conductores: [${data.conductores_ids}], camiones: [${data.camiones_ids}], anomalia: ${data.id_anomalia} - notificado a ${resultadoCiudadanos.enviados} ciudadanos y ${resultadoConductores.enviados} conductores`);

      return {
        success: true,
        data: {
          type: 'recalculo_ruta',
          message: 'Recalculo de ruta notificado correctamente',
          conductores_ids: data.conductores_ids,
          camiones_ids: data.camiones_ids,
          ciudadanos_notificados: resultadoCiudadanos.enviados,
          conductores_notificados: resultadoConductores.enviados,
          timestamp: Date.now()
        }
      };
    } catch (error) {
      Logger.error('Error notificando recalculo de ruta', error);
      return {
        success: false,
        error: 'Error en el servidor al notificar recalculo de ruta'
      };
    }
  }

  notificarRutaAnomalia(data) {
    const validacion = Validator.validarAnomalia(data);

    if (!validacion.valido) {
      return {
        success: false,
        error: 'Anomalia invalida',
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

      Logger.info(`Anomalia de ruta ${data.id_anomalia} notificada a ${resultado.enviados} clientes`);

      return {
        success: true,
        data: {
          message: 'Anomalia de ruta notificada correctamente',
          clientes_notificados: resultado.enviados,
          timestamp: Date.now()
        }
      };
    } catch (error) {
      Logger.error('Error notificando anomalia de ruta', error);
      return {
        success: false,
        error: 'Error en el servidor al notificar anomalia de ruta'
      };
    }
  }
}

module.exports = AnomaliaController;
