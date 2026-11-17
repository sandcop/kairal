// Crea las claves de la puerta del panel de reservas y las deja en una carpeta TUYA (no en el repositorio):
//   node netlify/herramientas/panel-credenciales.mjs <carpeta-de-salida>
// Escribe dos archivos:
//   netlify.env      → se importa en Netlify (Site configuration → Environment variables → Add a variable → Import from a .env file)
//   guardar-esto.txt → dirección del panel, código de acceso, códigos de respaldo y la clave para el autenticador.
// Nada de esto se imprime en pantalla. Después de importar y guardar, borra netlify.env.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const A = require('../functions/_lib/panel-acceso.js');

const salida = process.argv[2];
if (!salida) { console.error('Falta la carpeta de salida.'); process.exit(1); }
fs.mkdirSync(salida, { recursive: true });

const al = (n, alfabeto) => Array.from(crypto.randomBytes(n), (b) => alfabeto[b % alfabeto.length]).join('');
const MINUS = 'abcdefghjkmnpqrstuvwxyz23456789';
const LEGIBLE = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';       // sin 0/O/1/I/l

const ruta = al(20, MINUS);
const clave = [al(4, LEGIBLE), al(4, LEGIBLE), al(4, LEGIBLE), al(4, LEGIBLE)].join('-');
const secretoTotp = A.bytesABase32(crypto.randomBytes(20));
const secretoCookie = crypto.randomBytes(32).toString('hex');
const respaldo = Array.from({ length: 8 }, () => al(4, LEGIBLE) + '-' + al(4, LEGIBLE));
const huellas = respaldo.map(A.huellaRespaldo);
const otpauth = `otpauth://totp/Kairal%20panel?secret=${secretoTotp}&issuer=Kairal&algorithm=SHA1&digits=6&period=30`;

fs.writeFileSync(path.join(salida, 'netlify.env'),
  `PANEL_RUTA=${ruta}\nPANEL_CLAVE=${clave}\nPANEL_TOTP_SECRET=${secretoTotp}\nPANEL_COOKIE_SECRET=${secretoCookie}\nPANEL_RESPALDO=${huellas.join(',')}\n`);

fs.writeFileSync(path.join(salida, 'guardar-esto.txt'),
`PANEL DE RESERVAS · KAIRAL  (guarda este archivo en un gestor de contraseñas y bórralo de aquí)

Dirección:          https://kairal.cl/privado/${ruta}/
Código de acceso:   ${clave}

Autenticador:       escanea qr-autenticador.png con Google Authenticator / Microsoft Authenticator / Authy.
                    Si no puedes escanear, elige "ingresar clave de configuración" y escribe:  ${secretoTotp}
                    (nombre: Kairal panel · basado en tiempo)

Códigos de respaldo (cada uno sirve UNA vez, si pierdes el teléfono; se escriben en el campo del autenticador):
${respaldo.map((c, i) => `  ${i + 1}. ${c}`).join('\n')}

Cerrar sesión:      https://kairal.cl/privado/${ruta}/salir
La sesión dura 8 horas. Tras 5 intentos fallidos desde una misma conexión, se bloquea 15 minutos.

Si pierdes el teléfono Y los códigos de respaldo: vuelve a ejecutar la herramienta, cambia las 5 variables en Netlify.
URI del autenticador (para generar el QR): ${otpauth}
`);
fs.writeFileSync(path.join(salida, 'otpauth.txt'), otpauth);
console.log('Listo: se crearon netlify.env, guardar-esto.txt y otpauth.txt en', salida);
