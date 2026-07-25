class BroadcastService {
  constructor(clienteService) {
    this.clienteService = clienteService;
  }

  enviarATodos(mensaje) {
    const ciudadanos = this.clienteService.obtenerTodosCiudadanos();
    let enviados = 0;
    let fallidos = 0;

    ciudadanos.forEach(ciudadano => {
      try {
        if (ciudadano.ws.readyState === 1) {
          ciudadano.ws.send(JSON.stringify(mensaje));
          enviados++;
        }
      } catch (error) {
        fallidos++;
      }
    });

    return { enviados, fallidos };
  }

  enviarAConductores(conductoresIds, mensaje) {
    let enviados = 0;
    let fallidos = 0;

    for (const id of conductoresIds) {
      const conductor = this.clienteService.obtenerConductor(id);
      if (!conductor) continue;
      try {
        if (conductor.ws.readyState === 1) {
          conductor.ws.send(JSON.stringify(mensaje));
          enviados++;
        }
      } catch (error) {
        fallidos++;
      }
    }

    return { enviados, fallidos };
  }
}

module.exports = BroadcastService;
