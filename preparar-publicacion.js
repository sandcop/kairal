/* ============================================================================
   Arma la carpeta "publicar/" con SOLO lo que va al sitio kairal.cl.
   Uso:  node preparar-publicacion.js      (Netlify lo ejecuta en cada publicación)

   Por qué existe: esta carpeta también guarda documentos internos (.md, .docx),
   el .env con claves, el código de las funciones y archivos de pruebas. Netlify
   publica todo lo que hay en la carpeta de publicación, así que se arma una
   aparte con una lista cerrada de archivos.

   Además arma el blog para Google: pide los artículos a Sanity y deja el
   listado (blog.html) y cada artículo (blog/<slug>.html) como páginas ya
   escritas, con el mismo HTML que arma blog.js en el navegador. También genera
   sitemap.xml con todos los artículos.

   Antes de terminar revisa que:
   - cada archivo que piden las páginas (src, href, url(...)) esté en publicar/;
   - no se haya colado nada privado;
   - no haya páginas o scripts nuevos fuera de la lista (para no olvidarlos).
   Si algo falla (también si Sanity no responde), se detiene y no queda nada a
   medias para subir: en Netlify, el sitio sigue como estaba.
   ========================================================================== */
const fs = require('fs');
const path = require('path');
const Blog = require('./blog.js');

const RAIZ = __dirname;
const DESTINO = path.join(RAIZ, 'publicar');
const SITIO = 'https://kairal.cl';

// Lo que se publica. Una carpeta (terminada en /) se copia completa.
const INCLUIR = [
  // Páginas
  'index.html', '404.html', 'autoevaluacion.html', 'blog.html', 'consulta-previa-ks24.html',
  'cookies.html', 'privacidad.html', 'reservar.html', 'terminos.html', 'primera-consulta.html',
  // (El panel de reservas NO se publica como archivo: viaja dentro de la función netlify/functions/equipo.js y solo se
  // entrega tras el código de acceso + el del autenticador. Ver PANEL_ARCHIVOS más abajo.)
  // Estilos
  'style.css', 'autoevaluacion.css', 'blog.css', 'consulta-previa.css', 'reservar.css',
  // Scripts
  'inicio-arriba.js', 'script.js', 'hero-historia.js', 'scroll-suave.js', 'interna.js', 'blog.js', 'cookies.js', 'recursos.js',
  'reservar.js', 'autoevaluacion.js', 'autoeval-contenido.js', 'consulta-previa.js',
  // Imágenes sueltas. Kairallogo-email.png lo usan los correos de Brevo y
  // kathy_slide.webp la vista previa al compartir el enlace: no borrarlos.
  'Kairallogo.svg', 'Kairallogo-email.png', 'kathy_slide.webp', 'sin_fondo.png',
  // Foto de la Dra. en la portada (completa para escritorio, recorte vertical para el celular)
  'dra-yusneily-sanchez.webp', 'dra-yusneily-sanchez-movil.webp',
  // Buscadores (sitemap.xml se genera más abajo, con los artículos del blog)
  'robots.txt', 'llms.txt', 'd0dcc57d47a7f173ef1568703af6e699.txt', 'd82b2bb2b43f48b9b9b4a9ceb508a43a.txt',   // llms.txt: resumen para asistentes de IA · la otra es la llave de IndexNow (Bing y otros)
  // Carpetas
  'assets/1.webp', 'assets/2.webp', 'assets/3.webp',
  'fonts/', 'vendor/', 'recursos/',
];

// Páginas que van al sitemap además de los artículos (las demás llevan noindex)
const PAGINAS_SITEMAP = ['', 'reservar.html', 'primera-consulta.html', 'autoevaluacion.html', 'blog.html', 'privacidad.html', 'terminos.html', 'cookies.html'];

// Archivos de la raíz que a propósito NO se publican (para que el aviso de
// "archivo nuevo sin decidir" no salte con ellos).
const NO_PUBLICAR = new Set([
  'panel-reservas.html', 'panel-reservas.css', 'panel-reservas.js',   // van dentro de la función de la puerta, no al sitio público
  'servidor-local.js', 'preparar-publicacion.js', 'abrir-sitio.bat',
  'netlify.toml', 'package.json', 'package-lock.json', 'deno.lock',
]);

// Panel de reservas: se genera con appscript-reservas/pruebas/generar-panel-sitio.js (no editar a mano). En vez de
// publicarlo, se mete dentro de un módulo que usa la función de la puerta (equipo.js), que solo lo entrega a quien
// pasó el código de acceso y el del autenticador.
const PANEL_ARCHIVOS = ['panel-reservas.html', 'panel-reservas.css', 'panel-reservas.js'];
const PANEL_MODULO = path.join(RAIZ, 'netlify', 'functions', '_lib', 'panel-archivos.generated.js');
function armarPanelPrivado() {
  const contenido = {};
  for (const f of PANEL_ARCHIVOS) contenido[f] = fs.readFileSync(path.join(RAIZ, f), 'utf8');
  fs.writeFileSync(PANEL_MODULO, '// Generado por preparar-publicacion.js: no editar ni subir al repositorio.\nmodule.exports = ' + JSON.stringify(contenido) + ';\n');
}

// Nada de esto puede terminar en publicar/
const PROHIBIDO = /(^|\/)(\.env|\.git|\.netlify|node_modules|netlify\/|package(-lock)?\.json$|deno\.lock$|servidor-local\.js$)|\.(md|docx?|bat|zip|log)$/i;

function copiar(rel) {
  const origen = path.join(RAIZ, rel);
  if (!fs.existsSync(origen)) throw new Error('No existe: ' + rel);
  const destino = path.join(DESTINO, rel);
  if (fs.statSync(origen).isDirectory()) {
    fs.cpSync(origen, destino, { recursive: true });
  } else {
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    fs.copyFileSync(origen, destino);
  }
}

function listar(dir, rel = '') {
  let out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const r = rel ? rel + '/' + e.name : e.name;
    if (e.isDirectory()) out = out.concat(listar(path.join(dir, e.name), r));
    else out.push(r);
  }
  return out;
}

// Rutas locales que pide un HTML/CSS/JS publicado
function referencias(archivo, texto) {
  const re = /(?:src|href|content|poster|data-src)\s*=\s*["']([^"'#?]+)|url\(\s*["']?([^"')#?]+)|["'`]((?:\.\/)?(?:assets|recursos|fonts|vendor)\/[^"'`?#)\s]+)/g;
  // Con <base href="/"> las rutas relativas parten de la raíz del sitio
  const conBase = /<base\s+href=["']\/["']/i.test(texto);
  const out = [];
  let m;
  while ((m = re.exec(texto))) {
    let ref = (m[1] || m[2] || m[3] || '').trim();
    if (ref.startsWith('https://kairal.cl/')) ref = ref.slice('https://kairal.cl/'.length);
    if (!ref || /^(https?:|mailto:|tel:|data:|javascript:|blob:|\/\/)/.test(ref) || ref.includes('${')) continue;
    if (!/\.[a-z0-9]{2,5}$/i.test(ref)) continue;
    const base = conBase || path.posix.dirname(archivo) === '.' ? '' : path.posix.dirname(archivo);
    out.push(decodeURIComponent(ref.startsWith('/') ? ref.slice(1) : path.posix.join(base, ref.replace(/^\.\//, ''))));
  }
  return out;
}

/* ─── Blog armado para Google ─────────────────────────────────────────── */
async function sanity(query) {
  const url = 'https://zu3r11hb.api.sanity.io/v2021-10-21/data/query/production?query=' + encodeURIComponent(query);
  const r = await fetch(url);
  if (!r.ok) throw new Error('Sanity respondió ' + r.status);
  return (await r.json()).result;
}

// Reemplaza un fragmento que debe aparecer exactamente una vez en la plantilla
function cambiar(html, antes, despues, que) {
  const n = typeof antes === 'string' ? html.split(antes).length - 1 : (html.match(new RegExp(antes.source, 'g')) || []).length;
  if (n !== 1) throw new Error(`plantilla del blog: "${que}" aparece ${n} veces`);
  return html.replace(antes, () => despues);
}
const CONTENEDOR = /<div id="blog-contenido" aria-live="polite">[\s\S]*?<\/div>\s*<\/main>/;
function contenido(html, attrs, interior) {
  return cambiar(html, CONTENEDOR, `<div id="blog-contenido" aria-live="polite"${attrs}>${interior}</div>\n</main>`, 'contenedor del blog');
}
// Las páginas dentro de /blog/ resuelven sus rutas desde la raíz del sitio
function conBaseRaiz(html) {
  return cambiar(html, '<meta charset="UTF-8">', '<meta charset="UTF-8">\n<base href="/">', 'charset');
}

async function armarBlog() {
  const posts = await sanity(`*[_type == "post" && defined(slug.current)] | order(publishedAt desc){ ${Blog.CAMPOS}, body }`);
  if (!Array.isArray(posts)) throw new Error('Sanity no devolvió una lista de artículos');
  const plantilla = fs.readFileSync(path.join(DESTINO, 'blog.html'), 'utf8');
  const esc = Blog.esc;

  // Listado
  fs.writeFileSync(path.join(DESTINO, 'blog.html'),
    contenido(plantilla, ` data-prerender="listado" data-version="${esc(Blog.firmaListado(posts))}"`, Blog.htmlListado(posts)));

  // Respaldo para artículos publicados en Sanity después de esta publicación:
  // netlify.toml manda /blog/* aquí y blog.js arma el artículo en el navegador.
  fs.writeFileSync(path.join(DESTINO, 'blog-articulo.html'),
    cambiar(conBaseRaiz(plantilla), /<link rel="canonical"[^>]*>/, '<meta name="robots" content="noindex, follow">\n<link rel="canonical" href="https://kairal.cl/blog.html" id="canonical">', 'canonical'));

  // Un archivo por artículo
  const armados = [];
  fs.mkdirSync(path.join(DESTINO, 'blog'), { recursive: true });
  for (const p of posts) {
    const slug = Blog.slugDe(p);
    if (!/^[a-z0-9][a-z0-9-]*$/i.test(slug)) {   // nombre de archivo seguro; si no, lo arma el navegador
      console.warn(`  Aviso: el artículo "${p.title}" tiene un slug raro ("${slug}"); queda solo con armado en el navegador.`);
      continue;
    }
    const d = Blog.datosArticulo(p);
    const otros = posts.filter(o => Blog.slugDe(o) !== slug).slice(0, 3);
    let h = conBaseRaiz(plantilla);
    h = cambiar(h, /<title>[^<]*<\/title>/, `<title>${esc(d.tituloPagina)}</title>`, 'title');
    h = cambiar(h, /<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(d.desc)}">`, 'description');
    h = cambiar(h, /<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${esc(d.url)}" id="canonical">\n<meta property="og:url" content="${esc(d.url)}">`, 'canonical');
    h = cambiar(h, /<meta property="og:type" content="[^"]*" id="og-type">/, '<meta property="og:type" content="article" id="og-type">', 'og:type');
    h = cambiar(h, /<meta property="og:title" content="[^"]*" id="og-title">/, `<meta property="og:title" content="${esc(d.titulo)}" id="og-title">`, 'og:title');
    h = cambiar(h, /<meta property="og:description" content="[^"]*" id="og-desc">/, `<meta property="og:description" content="${esc(d.desc)}" id="og-desc">`, 'og:description');
    if (d.portada) h = cambiar(h, /<meta property="og:image" content="[^"]*" id="og-img">/, `<meta property="og:image" content="${esc(d.portada)}" id="og-img">`, 'og:image');
    h = cambiar(h, '</head>', `<script type="application/ld+json" id="ld-articulo">${JSON.stringify(d.ld).replace(/</g, '\\u003c')}</script>\n</head>`, '</head>');
    h = cambiar(h, 'href="#blog-contenido"', `href="blog/${slug}#blog-contenido"`, 'enlace "Ir al contenido"');
    h = contenido(h, ` data-prerender="articulo" data-version="${esc(p._updatedAt || '')}"`, Blog.htmlArticulo(p, otros));
    fs.writeFileSync(path.join(DESTINO, 'blog', slug + '.html'), h);
    armados.push(p);
  }

  // sitemap.xml: páginas indexables + cada artículo con su fecha de edición
  const urls = PAGINAS_SITEMAP.map(p => `  <url><loc>${SITIO}/${p}</loc></url>`)
    .concat(armados.map(p => `  <url><loc>${esc(Blog.urlArticulo(Blog.slugDe(p)))}</loc>` +
      (p._updatedAt ? `<lastmod>${p._updatedAt.slice(0, 10)}</lastmod>` : '') + '</url>'));
  fs.writeFileSync(path.join(DESTINO, 'sitemap.xml'),
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls.join('\n') + '\n</urlset>\n');

  return { total: posts.length, armados: armados.length };
}

/* ─── Armado y revisión ───────────────────────────────────────────────── */
(async () => {
  const errores = [];

  // 1. Carpeta limpia
  fs.rmSync(DESTINO, { recursive: true, force: true });
  fs.mkdirSync(DESTINO);
  INCLUIR.forEach(rel => { try { copiar(rel); } catch (e) { errores.push(e.message); } });
  try { armarPanelPrivado(); } catch (e) { errores.push('panel privado: ' + e.message); }

  // 2. Blog armado
  let blog = null;
  if (!errores.length) {
    try { blog = await armarBlog(); }
    catch (e) { errores.push('Blog: ' + e.message); }
  }

  const publicados = listar(DESTINO);
  const enPublicar = new Set(publicados);

  // 3. Nada privado
  publicados.filter(f => PROHIBIDO.test(f)).forEach(f => errores.push('Archivo privado en publicar/: ' + f));

  // 4. Todo lo que piden las páginas existe
  for (const f of publicados.filter(f => /\.(html|css|js)$/.test(f))) {
    const texto = fs.readFileSync(path.join(DESTINO, f), 'utf8');
    for (const ref of referencias(f, texto)) {
      if (ref === 'tu-foto.jpg') continue;   // ejemplo dentro de un comentario de index.html
      if (!enPublicar.has(ref)) errores.push(`${f} pide "${ref}", que no está en publicar/`);
    }
  }

  // El panel no puede quedar a la vista en el sitio público
  for (const f of PANEL_ARCHIVOS) if (enPublicar.has(f)) errores.push(`${f} quedó en publicar/: el panel solo puede ir dentro de la función de la puerta`);

  // 5. Páginas, estilos o scripts nuevos que nadie decidió si se publican
  const decididos = new Set(INCLUIR.filter(x => !x.endsWith('/')));
  fs.readdirSync(RAIZ)
    .filter(f => /\.(html|css|js|svg|png|webp|jpe?g|txt|xml|ico)$/i.test(f))
    .filter(f => !decididos.has(f) && !NO_PUBLICAR.has(f))
    .forEach(f => errores.push(`"${f}" no está en la lista INCLUIR ni en NO_PUBLICAR de preparar-publicacion.js: decide si va al sitio`));

  if (errores.length) {
    fs.rmSync(DESTINO, { recursive: true, force: true });
    console.error('\nNO se armó publicar/:\n  - ' + errores.join('\n  - ') + '\n');
    process.exit(1);
  }

  const bytes = publicados.reduce((s, f) => s + fs.statSync(path.join(DESTINO, f)).size, 0);
  console.log(`publicar/ lista: ${publicados.length} archivos, ${(bytes / 1048576).toFixed(1)} MB. ` +
    `Blog: ${blog.armados} de ${blog.total} artículos armados como página propia.`);
})();
