const { Conductor, Ciudadano } = require('../models/Cliente');
const Logger = require('../utils/logger');

class ClienteService {
  constructor() {
    this.conductores = new Map();
    this.ciudadanos = new Set();
    this.connectionIds = new Map();
  }

  registrarConductor(ws, conductorId, nombre, rutaId) {
    if (this.conductores.has(conductorId)) {
      Logger.warning(`Conductor ${conductorId} ya existe, reemplazando conexión`);
      const antiguo = this.conductores.get(conductorId);
      this.cerrarConexion(antiguo.ws);
    }

    const conductor = new Conductor(ws, conductorId, nombre, rutaId);
    this.conductores.set(conductorId, conductor);
    this.connectionIds.set(ws, { tipo: 'conductor', id: conductorId });
    
    Logger.conductor('Registrado exitosamente', conductorId, { nombre, rutaId });
    
    return conductor;
  }

  registrarCiudadano(ws, ciudadanoId, nombre) {
    const ciudadano = new Ciudadano(ws, ciudadanoId, nombre);
    this.ciudadanos.add(ciudadano);
    this.connectionIds.set(ws, { tipo: 'ciudadano', referencia: ciudadano });
    
    Logger.ciudadano('Registrado exitosamente', ciudadanoId, { nombre });
    
    return ciudadano;
  }

  obtenerConductor(conductorId) {
    return this.conductores.get(conductorId);
  }

  obtenerInfoConexion(ws) {
    return this.connectionIds.get(ws);
  }

  eliminarConductor(conductorId) {
    const conductor = this.conductores.get(conductorId);
    if (conductor) {
      this.connectionIds.delete(conductor.ws);
      this.conductores.delete(conductorId);
      Logger.conductor('Desconectado', conductorId);
      return true;
    }
    return false;
  }

  eliminarCiudadano(ciudadano) {
    if (this.ciudadanos.has(ciudadano)) {
      this.connectionIds.delete(ciudadano.ws);
      this.ciudadanos.delete(ciudadano);
      Logger.ciudadano('Desconectado', ciudadano.id);
      return true;
    }
    return false;
  }

  obtenerTodosConductores() {
    return Array.from(this.conductores.values());
  }

  obtenerTodosCiudadanos() {
    return Array.from(this.ciudadanos);
  }

  obtenerEstadisticas() {
    return {
      conductores: this.conductores.size,
      ciudadanos: this.ciudadanos.size,
      total: this.conductores.size + this.ciudadanos.size
    };
  }

  cerrarConexion(ws) {
    try {
      if (ws.readyState === 1) {
        ws.close();
      }
    } catch (error) {
      Logger.error('Error cerrando conexión', error);
    }
  }

  limpiarConexionesInactivas() {
    let limpiadas = 0;

    this.conductores.forEach((conductor, id) => {
      if (conductor.ws.readyState !== 1) {
        this.eliminarConductor(id);
        limpiadas++;
      }
    });

    this.ciudadanos.forEach(ciudadano => {
      if (ciudadano.ws.readyState !== 1) {
        this.eliminarCiudadano(ciudadano);
        limpiadas++;
      }
    });

    if (limpiadas > 0) {
      Logger.info(`Limpiadas ${limpiadas} conexiones inactivas`);
    }

    return limpiadas;
  }
}

module.exports = ClienteService;
