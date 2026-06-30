require('dotenv').config();

module.exports = {
  port: process.env.PORT || 8080,
  env: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'tu_secreto_jwt_super_secreto_cambialo_en_produccion',
  
  estadisticas: {
    intervalo: parseInt(process.env.STATS_INTERVAL) || 30000
  },
  
  limpieza: {
    intervalo: parseInt(process.env.CLEANUP_INTERVAL) || 60000
  },
  
  validacion: {
    maxNombreLength: 100,
    maxVelocidad: 200,
    minVelocidad: 0
  }
};
