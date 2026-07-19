#!/bin/sh
# Genera un certificado autofirmado para desarrollo local (HTTPS en localhost).
#
# IMPORTANTE: esto es SOLO para pruebas locales. El navegador va a mostrar una
# advertencia de "sitio no seguro" porque el certificado no está firmado por
# una autoridad reconocida (no es un certificado "real"). Es normal y
# esperado — dale clic en "Avanzado" -> "Continuar de todas formas".
#
# Cuando publiques Annie en un dominio real (ej. annie.tudominio.com), usa
# Let's Encrypt/Certbot en su lugar (ver DOCKER.md) para tener un candado
# real sin advertencias.
#
# Uso:  sh certs/generate-self-signed.sh

cd "$(dirname "$0")"

# En Git Bash / MSYS (Windows) hay que desactivar la conversión automática de
# rutas, si no "/C=MX/..." se interpreta como una ruta de archivo.
export MSYS_NO_PATHCONV=1
export MSYS2_ARG_CONV_EXCL="*"

openssl req -x509 -nodes -days 365 \
  -newkey rsa:2048 \
  -keyout localhost.key \
  -out localhost.crt \
  -subj "/C=MX/ST=Local/L=Local/O=Annie Dev/CN=localhost"

echo ""
echo "Certificado generado: certs/localhost.crt y certs/localhost.key"
echo "Ahora corre: docker compose up -d --build frontend"
