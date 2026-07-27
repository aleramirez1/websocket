class Validator {
  static validarRegistroConductor(data) {
    const errores = [];

    if (!data.conductor_id) {
      errores.push('conductor_id es requerido');
    }

    if (typeof data.conductor_id !== 'number') {
      errores.push('conductor_id debe ser un numero');
    }

    if (!data.nombre || typeof data.nombre !== 'string') {
      errores.push('nombre es requerido y debe ser texto');
    }

    if (data.nombre && data.nombre.trim().length === 0) {
      errores.push('nombre no puede estar vacio');
    }

    return {
      valido: errores.length === 0,
      errores
    };
  }

  static validarUbicacion(data) {
    const errores = [];

    if (data.lat === undefined || data.lat === null) {
      errores.push('lat es requerido');
    }

    if (data.lng === undefined || data.lng === null) {
      errores.push('lng es requerido');
    }

    if (typeof data.lat !== 'number' || isNaN(data.lat)) {
      errores.push('lat debe ser un numero valido');
    }

    if (typeof data.lng !== 'number' || isNaN(data.lng)) {
      errores.push('lng debe ser un numero valido');
    }

    if (data.lat < -90 || data.lat > 90) {
      errores.push('lat debe estar entre -90 y 90');
    }

    if (data.lng < -180 || data.lng > 180) {
      errores.push('lng debe estar entre -180 y 180');
    }

    // velocidad y rumbo son datos "suaves": si vienen invalidos no deben tirar
    // toda la actualizacion de posicion (lat/lng ya se validaron arriba). Se
    // descartan solo esos campos puntuales en sanitizarUbicacion().

    return {
      valido: errores.length === 0,
      errores
    };
  }

  /**
   * Limpia campos opcionales de una ubicacion ya validada por validarUbicacion().
   * Si `velocidad` o `rumbo` vienen fuera de rango o con tipo invalido, se
   * devuelven como `null` en vez de invalidar todo el mensaje: el conductor
   * puede no tener un rumbo confiable (detenido, GPS con mala señal) y aun asi
   * su posicion (lat/lng) debe seguir llegando a los ciudadanos.
   */
  static sanitizarUbicacion(data) {
    const velocidadValida =
      typeof data.velocidad === 'number' &&
      !isNaN(data.velocidad) &&
      data.velocidad >= 0;

    const rumboValido =
      typeof data.rumbo === 'number' &&
      !isNaN(data.rumbo) &&
      data.rumbo >= 0 &&
      data.rumbo <= 360;

    return {
      ...data,
      velocidad: velocidadValida ? data.velocidad : null,
      rumbo: rumboValido ? data.rumbo : null
    };
  }

  static validarAnomalia(data) {
    const errores = [];

    if (data.id_anomalia === undefined || data.id_anomalia === null) {
      errores.push('id_anomalia es requerido');
    }

    if (data.lat === undefined || data.lat === null) {
      errores.push('lat es requerido');
    }

    if (data.lng === undefined || data.lng === null) {
      errores.push('lng es requerido');
    }

    if (typeof data.lat !== 'number' || isNaN(data.lat)) {
      errores.push('lat debe ser un numero valido');
    }

    if (typeof data.lng !== 'number' || isNaN(data.lng)) {
      errores.push('lng debe ser un numero valido');
    }

    if (data.lat < -90 || data.lat > 90) {
      errores.push('lat debe estar entre -90 y 90');
    }

    if (data.lng < -180 || data.lng > 180) {
      errores.push('lng debe estar entre -180 y 180');
    }

    if (!data.texto || typeof data.texto !== 'string') {
      errores.push('texto es requerido y debe ser texto');
    }

    if (!data.status || typeof data.status !== 'string') {
      errores.push('status es requerido y debe ser texto');
    }

    return {
      valido: errores.length === 0,
      errores
    };
  }

  static validarJSON(data) {
    try {
      JSON.parse(data);
      return { valido: true };
    } catch (error) {
      return {
        valido: false,
        errores: ['JSON invalido: ' + error.message]
      };
    }
  }
}

module.exports = Validator;
