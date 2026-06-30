class Validator {
  static validarRegistroConductor(data) {
    const errores = [];

    if (!data.conductor_id) {
      errores.push('conductor_id es requerido');
    }

    if (typeof data.conductor_id !== 'number') {
      errores.push('conductor_id debe ser un número');
    }

    if (!data.nombre || typeof data.nombre !== 'string') {
      errores.push('nombre es requerido y debe ser texto');
    }

    if (data.nombre && data.nombre.trim().length === 0) {
      errores.push('nombre no puede estar vacío');
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
      errores.push('lat debe ser un número válido');
    }

    if (typeof data.lng !== 'number' || isNaN(data.lng)) {
      errores.push('lng debe ser un número válido');
    }

    if (data.lat < -90 || data.lat > 90) {
      errores.push('lat debe estar entre -90 y 90');
    }

    if (data.lng < -180 || data.lng > 180) {
      errores.push('lng debe estar entre -180 y 180');
    }

    if (data.velocidad !== undefined && (typeof data.velocidad !== 'number' || data.velocidad < 0)) {
      errores.push('velocidad debe ser un número positivo');
    }

    if (data.rumbo !== undefined && (typeof data.rumbo !== 'number' || data.rumbo < 0 || data.rumbo > 360)) {
      errores.push('rumbo debe estar entre 0 y 360');
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
        errores: ['JSON inválido: ' + error.message]
      };
    }
  }
}

module.exports = Validator;
