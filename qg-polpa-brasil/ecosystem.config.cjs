const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '.env') })

module.exports = {
  apps: [{
    name: 'dashboard-polpa',
    script: path.join(__dirname, 'dist/server/src/index.js'),
    cwd: __dirname,
    env: {
      DB_SERVER:     process.env.DB_SERVER     || 'localhost',
      DB_DATABASE:   process.env.DB_DATABASE   || 'PolpaBrasil',
      DB_PORT:       process.env.DB_PORT        || '1433',
      DB_USER:       process.env.DB_USER        || 'qgpolpa',
      DB_PASSWORD:   process.env.DB_PASSWORD    || 'QGPolpa@2026!',
      DB_ENCRYPT:    process.env.DB_ENCRYPT     || 'false',
      PORT:          process.env.PORT           || '5000',
      COOKIE_SECRET: process.env.COOKIE_SECRET  || 'qgpolpabrasil_secret_2026',
      CORS_ORIGIN:          process.env.CORS_ORIGIN          || 'http://localhost:5000',
      PYTHON_API_URL:       process.env.PYTHON_API_URL       || 'http://localhost:8000',
      INTERNAL_CHAT_SECRET: process.env.INTERNAL_CHAT_SECRET || '',
    }
  }]
}
