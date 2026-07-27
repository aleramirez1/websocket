const fs = require('fs');
const WebSocket = require('ws');
const http = require('http');
const https = require('https');
const url = require('url');
const config = require('./config/config');
const Logger = require('./utils/logger');
const ClienteService = require('./services/ClienteService');
const UbicacionService = require('./services/UbicacionService');
const BroadcastService = require('./services/BroadcastService');
const ConductorController = require('./controllers/ConductorController');
const CiudadanoController = require('./controllers/CiudadanoController');
const AnomaliaController = require('./controllers/AnomaliaController');
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
    this.broadcastService = new BroadcastService(this.clienteService);
    
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
      this.broadcastService
    );
    
    this.ciudadanoController = new CiudadanoController(
      this.clienteService,
      this.ubicacionService
    );

    this.anomaliaController = new AnomaliaController(
      this.broadcastService
    );
    
    Logger.success('Controladores inicializados');
  }

  inicializarRouter() {
    this.router = new WebSocketRouter(
      this.conductorController,
      this.ciudadanoController,
      this.anomaliaController
    );
    
    Logger.success('Router inicializado');
  }

  iniciar() {
    try {
      const sslCert = process.env.SSL_CERT;
      const sslKey = process.env.SSL_KEY;

      if (sslCert && sslKey) {
        const options = {
          cert: fs.readFileSync(sslCert),
          key: fs.readFileSync(sslKey),
        };
        this.httpServer = https.createServer(options, (req, res) => this.manejarHttp(req, res));
        Logger.info('Servidor configurado con HTTPS (SSL)');
      } else {
        this.httpServer = http.createServer((req, res) => this.manejarHttp(req, res));
        Logger.info('Servidor configurado con HTTP (sin SSL)');
      }

      this.wss = new WebSocket.Server({ 
        server: this.httpServer,
        clientTracking: true,
        perMessageDeflate: false,
        verifyClient: (info, callback) => {
          this.verificarCliente(info, callback);
        }
      });

      this.httpServer.listen(this.config.port);

      Logger.success(`Servidor WebSocket iniciado en puerto ${this.config.port}`);
      Logger.info(`Entorno: ${this.config.env}`);
      Logger.info('Esperando conexiones...\n');

      this.wss.on('connection', (ws, req) => this.manejarConexion(ws, req));
      this.wss.on('error', (error) => Logger.error('Error en servidor WebSocket', error));
      
      this.iniciarEstadisticas();
      this.iniciarLimpieza();
      this.manejarCierre();
      
      Logger.success('Sistema listo\n');
    } catch (error) {
      Logger.error('Error fatal al iniciar servidor', error);
      process.exit(1);
    }
  }

  manejarHttp(req, res) {
    const parsedUrl = url.parse(req.url, true);

    if (req.method === 'POST' && parsedUrl.pathname === '/notificar_recalculo_ruta') {
      let body = '';

      req.on('data', (chunk) => {
        body += chunk;
      });

      req.on('end', () => {
        let data;

        try {
          data = JSON.parse(body);
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'JSON invalido' }));
          return;
        }

        const resultado = this.anomaliaController.notificarRecalculoRuta(data);

        if (!resultado.success) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(resultado));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(resultado.data));
      });

      return;
    }

    if (req.method === 'POST' && parsedUrl.pathname === '/notificar_ruta_anomalia') {
      let body = '';

      req.on('data', (chunk) => {
        body += chunk;
      });

      req.on('end', () => {
        let data;

        try {
          data = JSON.parse(body);
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'JSON invalido' }));
          return;
        }

        const resultado = this.anomaliaController.notificarRutaAnomalia(data);

        if (!resultado.success) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(resultado));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(resultado.data));
      });

      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'No encontrado' }));
  }

  verificarCliente(info, callback) {
    const params = url.parse(info.req.url, true).query;
    const token = params.token || info.req.headers['sec-websocket-protocol'];
    const role = params.role;

    Logger.info(`Verificando cliente - URL: ${info.req.url}`);
    Logger.info(`Token encontrado: ${token ? 'Si (' + token.substring(0, 20) + '...)' : 'No'}`);
    Logger.info(`Role recibido: ${role || 'no especificado'}`);

    if (!token) {
      Logger.warning('Conexion rechazada: sin token JWT');
      callback(false, 401, 'Token JWT requerido');
      return;
    }

    if (!role || !['conductor', 'ciudadano'].includes(role)) {
      Logger.warning(`Conexion rechazada: role invalido o ausente (${role})`);
      callback(false, 400, 'Query param "role" requerido: conductor o ciudadano');
      return;
    }

    const auth = this.authMiddleware.verificarToken(token);
    
    if (!auth.valido) {
      Logger.warning(`Conexion rechazada: ${auth.error}`);
      callback(false, 401, auth.error);
      return;
    }

    info.req.user = {
      userId: auth.datos.user_id,
      role: role,
      datos: auth.datos
    };

    Logger.success(`Token valido para user_id: ${auth.datos.user_id}, role: ${role}`);
    callback(true);
  }

  manejarConexion(ws, req) {
    const user = req.user;
    const ip = req.socket.remoteAddress;

    const clienteMeta = {
      autenticado: true,
      tipo: null,
      userId: user.userId,
      role: user.role,
      datos: user.datos,
      ciudadano: null
    };

    Logger.conexion(`Nueva conexion autenticada desde ${ip} (user_id: ${user.userId}, role: ${user.role})`);

    if (user.role === 'conductor') {
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
    } else if (user.role === 'ciudadano') {
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
      Logger.conexion('Conexion cerrada');
    });

    ws.on('error', (error) => {
      Logger.error('Error en conexion WebSocket', error);
    });
  }

  iniciarEstadisticas() {
    setInterval(() => {
      const stats = this.clienteService.obtenerEstadisticas();
      const ubicaciones = this.ubicacionService.obtenerCantidad();
      
      Logger.estadisticas({
        ...stats,
        ubicaciones
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
        Logger.warning('Terminando conexion inactiva');
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
        this.httpServer.close(() => {
          Logger.success('Servidor cerrado correctamente');
          process.exit(0);
        });
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
