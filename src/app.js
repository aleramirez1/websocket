const WebSocket = require('ws');
const url = require('url');
const config = require('./config/config');
const Logger = require('./utils/logger');
const ClienteService = require('./services/ClienteService');
const UbicacionService = require('./services/UbicacionService');
const SuscripcionService = require('./services/SuscripcionService');
const ConductorController = require('./controllers/ConductorController');
const CiudadanoController = require('./controllers/CiudadanoController');
const WebSocketRouter = require('./routes/WebSocketRouter');
const AuthMiddleware = require('./middleware/AuthMiddleware');

class App {
  constructor() {
    this.config = config;
    this.inicializarServicios();
    this.inicializarMiddleware();
    this.inicializarControladores();
    this.inicializarRouter();
  }

  inicializarServicios() {
    this.clienteService = new ClienteService();
    this.ubicacionService = new UbicacionService();
    this.suscripcionService = new SuscripcionService();
    
    Logger.success('Servicios inicializados');
  }

  inicializarMiddleware() {
    this.authMiddleware = new AuthMiddleware(this.config.jwtSecret);
    Logger.success('Middleware inicializado');
  }

  inicializarControladores() {
    this.conductorController = new ConductorController(
      this.clienteService,
      this.ubicacionService,
      this.suscripcionService
    );
    
    this.ciudadanoController = new CiudadanoController(
      this.clienteService,
      this.ubicacionService,
      this.suscripcionService
    );
    
    Logger.success('Controladores inicializados');
  }

  inicializarRouter() {
    this.router = new WebSocketRouter(
      this.conductorController,
      this.ciudadanoController,
      this.authMiddleware
    );
    
    Logger.success('Router inicializado');
  }

  iniciar() {
    try {
      this.wss = new WebSocket.Server({ 
        port: this.config.port,
        clientTracking: true,
        perMessageDeflate: false,
        verifyClient: (info, callback) => {
          this.verificarCliente(info, callback);
        }
      });

      Logger.success(`Servidor WebSocket iniciado en puerto ${this.config.port}`);
      Logger.info(`Entorno: ${this.config.env}`);
      Logger.info('Esperando conexiones...\n');

      this.wss.on('connection', (ws, req) => this.manejarConexion(ws, req));
      this.wss.on('error', (error) => Logger.error('Error en servidor WebSocket', error));
      
      this.iniciarEstadisticas();
      this.iniciarLimpieza();
      this.manejarCierre();
      
      Logger.success('Sistema listo ✨\n');
    } catch (error) {
      Logger.error('Error fatal al iniciar servidor', error);
      process.exit(1);
    }
  }

  verificarCliente(info, callback) {
    const params = url.parse(info.req.url, true).query;
    const token = params.token || info.req.headers['sec-websocket-protocol'];

    Logger.info(`🔍 Verificando cliente - URL: ${info.req.url}`);
    Logger.info(`🔍 Token encontrado: ${token ? 'Sí (' + token.substring(0, 20) + '...)' : 'No'}`);

    if (!token) {
      Logger.warning('Conexión rechazada: sin token JWT');
      callback(false, 401, 'Token JWT requerido');
      return;
    }

    const auth = this.authMiddleware.verificarToken(token);
    
    if (!auth.valido) {
      Logger.warning(`Conexión rechazada: ${auth.error}`);
      Logger.warning(`Token recibido: ${token.substring(0, 50)}...`);
      Logger.warning(`Secret usado: ${this.config.jwtSecret.substring(0, 10)}...`);
      callback(false, 401, auth.error);
      return;
    }

    info.req.user = {
      userId: auth.datos.user_id,
      roleId: auth.datos.role_id,
      datos: auth.datos
    };

    Logger.success(`✅ Token válido para user_id: ${auth.datos.user_id}, role_id: ${auth.datos.role_id}`);
    callback(true);
  }

  manejarConexion(ws, req) {
    const user = req.user;
    const ip = req.socket.remoteAddress;

    const clienteMeta = {
      autenticado: true,
      tipo: null,
      userId: user.userId,
      roleId: user.roleId,
      datos: user.datos,
      ciudadano: null
    };

    Logger.conexion(`Nueva conexión autenticada desde ${ip} (user_id: ${user.userId}, role_id: ${user.roleId})`);

    if (this.authMiddleware.esConductor(user.roleId)) {
      const resultado = this.conductorController.conectar(ws, user.userId, user.datos);
      
      if (resultado.success) {
        clienteMeta.tipo = 'conductor';
        ws.send(JSON.stringify(resultado.data));
      } else {
        ws.send(JSON.stringify({
          type: 'error',
          code: 'CONEXION',
          message: resultado.error
        }));
        ws.close();
        return;
      }
    } else if (this.authMiddleware.esCiudadano(user.roleId)) {
      const resultado = this.ciudadanoController.conectar(ws, user.userId, user.datos);
      
      if (resultado.success) {
        clienteMeta.tipo = 'ciudadano';
        clienteMeta.ciudadano = resultado.ciudadano;
        ws.send(JSON.stringify(resultado.data));
      } else {
        ws.send(JSON.stringify({
          type: 'error',
          code: 'CONEXION',
          message: resultado.error
        }));
        ws.close();
        return;
      }
    } else {
      ws.send(JSON.stringify({
        type: 'error',
        code: 'INVALID_ROLE',
        message: `Rol inválido: ${user.roleId}. Debe ser 3 o 5 (ciudadano) o 4 (conductor)`
      }));
      ws.close();
      return;
    }

    ws.isAlive = true;

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (message) => {
      try {
        this.router.manejarMensaje(ws, message, clienteMeta);
      } catch (error) {
        Logger.error('Error no capturado en mensaje', error);
      }
    });

    ws.on('close', () => {
      this.router.manejarDesconexion(clienteMeta);
      Logger.conexion('Conexión cerrada');
    });

    ws.on('error', (error) => {
      Logger.error('Error en conexión WebSocket', error);
    });
  }

  iniciarEstadisticas() {
    setInterval(() => {
      const stats = this.clienteService.obtenerEstadisticas();
      const ubicaciones = this.ubicacionService.obtenerCantidad();
      const suscripciones = this.suscripcionService.obtenerEstadisticas();
      
      Logger.estadisticas({
        ...stats,
        ubicaciones,
        ...suscripciones
      });
    }, this.config.estadisticas.intervalo);
  }

  iniciarLimpieza() {
    setInterval(() => {
      this.limpiarConexionesInactivas();
    }, this.config.limpieza.intervalo);
  }

  limpiarConexionesInactivas() {
    this.wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        Logger.warning('Terminando conexión inactiva');
        return ws.terminate();
      }
      
      ws.isAlive = false;
      ws.ping();
    });

    this.clienteService.limpiarConexionesInactivas();
  }

  manejarCierre() {
    const cerrar = () => {
      Logger.warning('Cerrando servidor...');
      
      this.wss.clients.forEach((client) => {
        try {
          client.close(1000, 'Servidor cerrando');
        } catch (error) {
          Logger.error('Error cerrando cliente', error);
        }
      });
      
      this.wss.close(() => {
        Logger.success('Servidor cerrado correctamente');
        process.exit(0);
      });

      setTimeout(() => {
        Logger.error('Forzando cierre...');
        process.exit(1);
      }, 5000);
    };

    process.on('SIGINT', cerrar);
    process.on('SIGTERM', cerrar);
  }
}

module.exports = App;
