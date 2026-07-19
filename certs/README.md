# Certificados HTTPS

## Para desarrollo local (lo que ya tienes)

```bash
sh certs/generate-self-signed.sh
docker compose up -d --build frontend
```

Abre **https://localhost:8443**. El navegador va a mostrar una advertencia
("La conexión no es privada" / "Not secure") — es normal, porque este
certificado no está firmado por nadie más que tú mismo. Dale clic en
**Avanzado → Continuar de todas formas**. El candado funciona (el tráfico
sí va cifrado), solo que el navegador no "reconoce" quién lo firmó.

Este certificado **no sirve para producción** ni para que otras personas
entren sin advertencia — es únicamente para que tú pruebes que la
configuración de HTTPS en nginx funciona.

## Para producción (cuando tengas un dominio real)

Un certificado "de verdad" (sin advertencias) requiere que:
1. Tengas un **dominio** (ej. `annie.tunegocio.com`) apuntando a tu servidor.
2. Uses una autoridad certificadora reconocida — la más común y **gratuita**
   es [Let's Encrypt](https://letsencrypt.org).

La forma más simple de hacerlo con Docker es agregar un contenedor de
**Certbot** (o usar un proxy como [Caddy](https://caddyserver.com) o
[Traefik](https://traefik.io), que renuevan el certificado automáticamente
cada ~90 días sin que tengas que hacer nada).

Si en cambio despliegas en **Render** (como ya tienes configurado en
`render.yaml`), no necesitas hacer nada de esto: Render entrega HTTPS
automático y gratuito para cualquier dominio que conectes.
