const Ubicacion = require('../models/Ubicacion');

class UbicacionService {
  constructor() {
    this.ubicaciones = new Map();
  }

  guardarUbicacion(conductorId, ubicacionData) {
    const ubicacion = Ubicacion.fromRequest(ubicacionData);
    this.ubicaciones.set(conductorId, ubicacion);
    return ubicacion;
  }

  obtenerUbicacion(conductorId) {
    return this.ubicaciones.get(conductorId);
  }

  obtenerTodasUbicaciones() {
    const ubicaciones = [];
    for (const [conductorId, ubicacion] of this.ubicaciones.entries()) {
      ubicaciones.push({
        conductor_id: conductorId,
        ...ubicacion.toJSON()
      });
    }
    return ubicaciones;
  }

  eliminarUbicacion(conductorId) {
    this.ubicaciones.delete(conductorId);
  }

  obtenerCantidad() {
    return this.ubicaciones.size;
  }
}

module.exports = UbicacionService;
