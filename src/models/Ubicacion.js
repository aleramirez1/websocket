class Ubicacion {
  constructor(lat, lng, velocidad = 0, rumbo = 0, enServicio = true, rutaId = null) {
    this.lat = lat;
    this.lng = lng;
    this.velocidad = velocidad;
    this.rumbo = rumbo;
    this.enServicio = enServicio;
    this.rutaId = rutaId;
    this.timestamp = Date.now();
  }

  toJSON() {
    return {
      lat: this.lat,
      lng: this.lng,
      velocidad: this.velocidad,
      rumbo: this.rumbo,
      en_servicio: this.enServicio,
      ruta_id: this.rutaId,
      timestamp: this.timestamp
    };
  }

  static fromRequest(data) {
    return new Ubicacion(
      data.lat,
      data.lng,
      data.velocidad,
      data.rumbo,
      data.en_servicio,
      data.ruta_id
    );
  }
}

module.exports = Ubicacion;
