class Cliente {
  constructor(ws, tipo, id, nombre) {
    this.ws = ws;
    this.tipo = tipo;
    this.id = id;
    this.nombre = nombre;
    this.conectadoEn = Date.now();
  }

  enviar(data) {
    if (this.ws.readyState === 1) {
      this.ws.send(JSON.stringify(data));
    }
  }

  esConductor() {
    return this.tipo === 'conductor';
  }

  esCiudadano() {
    return this.tipo === 'ciudadano';
  }
}

class Conductor extends Cliente {
  constructor(ws, conductorId, nombre, rutaId) {
    super(ws, 'conductor', conductorId, nombre);
    this.rutaId = rutaId;
    this.ultimaUbicacion = null;
  }

  actualizarUbicacion(ubicacion) {
    this.ultimaUbicacion = {
      ...ubicacion,
      timestamp: Date.now()
    };
  }
}

class Ciudadano extends Cliente {
  constructor(ws, ciudadanoId, nombre) {
    super(ws, 'ciudadano', ciudadanoId, nombre);
  }
}

module.exports = { Cliente, Conductor, Ciudadano };
