#!/usr/bin/env bash
# NotesPlus PM2 Manager
# Uso: ./manage.sh [comando] [opciones]
# Comandos: start|stop|restart|reload|logs|status|list|delete|monit|save|startup

set -euo pipefail

APP_NAME="notesplus"
SCRIPT="server.js"
# Debe coincidir con server.js
PORT_DEFAULT="3006"

# Detectar pm2 o usar npx pm2
_pm2() {
  if command -v pm2 >/dev/null 2>&1; then
    pm2 "$@"
  else
    npx pm2 "$@"
  fi
}

usage() {
  cat <<EOF
Gestor PM2 para ${APP_NAME}

Uso: $0 <comando> [opciones]

Comandos:
  start           Inicia la app (NODE_ENV=production, PORT configurable)
  stop            Detiene la app
  restart         Reinicia la app
  reload          Reload zero-downtime (si aplica)
  logs [--lines N]  Muestra logs en tiempo real
  status|list     Lista procesos PM2
  delete          Elimina el proceso de PM2
  monit           Abre el monitor interactivo de PM2
  save            Guarda la lista actual para reinicios automáticos
  startup         Configura arranque del sistema (necesita permisos)

Variables de entorno útiles:
  PORT            Puerto (por defecto ${PORT_DEFAULT})
  WATCH           Activar watch (true/false, por defecto false)

Ejemplos:
  PORT=4000 ./manage.sh start
  ./manage.sh logs --lines 200
EOF
}

cmd_start() {
  local port="${PORT:-$PORT_DEFAULT}"
  local watch_flag="${WATCH:-false}"

  echo "Iniciando ${APP_NAME} en puerto ${port} (watch=${watch_flag})..."
  PORT="${port}" NODE_ENV=production _pm2 start "${SCRIPT}" \
    --name "${APP_NAME}" \
    --time \
    $( [ "${watch_flag}" = "true" ] && echo --watch || true )

  _pm2 status "${APP_NAME}"
}

cmd_stop() {
  _pm2 stop "${APP_NAME}" || true
}

cmd_restart() {
  _pm2 restart "${APP_NAME}" || true
}

cmd_reload() {
  _pm2 reload "${APP_NAME}" || true
}

cmd_logs() {
  # --lines opcional
  _pm2 logs "${APP_NAME}" "$@"
}

cmd_status() {
  _pm2 status "${APP_NAME}" || true
}

cmd_list() {
  _pm2 list
}

cmd_delete() {
  _pm2 delete "${APP_NAME}" || true
}

cmd_monit() {
  _pm2 monit
}

cmd_save() {
  _pm2 save
}

cmd_startup() {
  # Genera script de arranque para el sistema actual
  _pm2 startup || true
  echo "Si ves un comando, ejecútalo para completar la configuración de arranque. Luego corre: pm2 save"
}

main() {
  local cmd=${1:-}
  shift || true

  case "${cmd}" in
    start)    cmd_start "$@" ;;
    stop)     cmd_stop "$@" ;;
    restart)  cmd_restart "$@" ;;
    reload)   cmd_reload "$@" ;;
    logs)     cmd_logs "$@" ;;
    status)   cmd_status "$@" ;;
    list)     cmd_list "$@" ;;
    delete)   cmd_delete "$@" ;;
    monit)    cmd_monit "$@" ;;
    save)     cmd_save "$@" ;;
    startup)  cmd_startup "$@" ;;
    -h|--help|help|"") usage ;;
    *) echo "Comando desconocido: ${cmd}"; echo; usage; exit 1 ;;
  esac
}

main "$@"
