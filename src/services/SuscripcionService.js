const Logger = require('../utils/logger');

class SuscripcionService {
  constructor() {
    this.suscripciones = new Map();
  }

  suscribir(ciudadanoId, conductorId, ws) {
    if (!this.suscripciones.has(conductorId)) {
      this.suscripciones.set(conductorId, new Map());
    }

    this.suscripciones.get(conductorId).set(ciudadanoId, ws);
    
    Logger.info(`Ciudadano ${ciudadanoId} suscrito a conductor ${conductorId}`);
  }

  desuscribir(ciudadanoId, conductorId) {
    if (this.suscripciones.has(conductorId)) {
      this.suscripciones.get(conductorId).delete(ciudadanoId);
      
      if (this.suscripciones.get(conductorId).size === 0) {
        this.suscripciones.delete(conductorId);
      }
      
      Logger.info(`Ciudadano ${ciudadanoId} desuscrito de conductor ${conductorId}`);
    }
  }

  desuscribirTodos(ciudadanoId) {
    let count = 0;
    
    for (const [conductorId, suscriptores] of this.suscripciones.entries()) {
      if (suscriptores.has(ciudadanoId)) {
        suscriptores.delete(ciudadanoId);
        count++;
        
        if (suscriptores.size === 0) {
          this.suscripciones.delete(conductorId);
        }
      }
    }
    
    if (count > 0) {
      Logger.info(`Ciudadano ${ciudadanoId} desuscrito de ${count} conductor(es)`);
    }
  }

  obtenerSuscriptores(conductorId) {
    return this.suscripciones.get(conductorId) || new Map();
  }

  estaSuscrito(ciudadanoId, conductorId) {
    return this.suscripciones.has(conductorId) && 
           this.suscripciones.get(conductorId).has(ciudadanoId);
  }

  obtenerSuscripcionesCiudadano(ciudadanoId) {
    const suscripciones = [];
    
    for (const [conductorId, suscriptores] of this.suscripciones.entries()) {
      if (suscriptores.has(ciudadanoId)) {
        suscripciones.push(conductorId);
      }
    }
    
    return suscripciones;
  }

  obtenerEstadisticas() {
    let totalSuscripciones = 0;
    
    for (const suscriptores of this.suscripciones.values()) {
      totalSuscripciones += suscriptores.size;
    }
    
    return {
      conductoresConSuscriptores: this.suscripciones.size,
      totalSuscripciones
    };
  }
}

module.exports = SuscripcionService;
