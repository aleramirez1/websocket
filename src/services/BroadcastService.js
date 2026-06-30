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
}

module.exports = BroadcastService;
