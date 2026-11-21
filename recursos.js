/* Guías descargables: para bajar el PDF hay que dejar el correo.
   Al enviar, el contacto se guarda en la misma lista de Brevo que usa el resto del sitio
   (función /.netlify/functions/subscribe, con el nombre de la guía en RECURSO_DESCARGADO)
   y recién entonces parte la descarga. Quien ya dejó su correo en este navegador descarga
   directo. */
(function(){
'use strict';

var botones = document.querySelectorAll('[data-recurso]');
var modal = document.getElementById('rec-modal');
if (!botones.length || !modal) return;

var form = document.getElementById('rec-form');
var titulo = document.getElementById('rec-modal-titulo');
var inputEmail = document.getElementById('rec-email');
var inputNombre = document.getElementById('rec-nombre');
var consent = document.getElementById('rec-consent');
var errorEl = document.getElementById('rec-error');
var enviar = document.getElementById('rec-enviar');
var aviso = document.getElementById('rec-aviso');
var STORE = 'kairal_recursos_correo';

var actual = null;       // el botón de la guía elegida
var ultimoFoco = null;
var avisoT = 0;

function yaDejoCorreo(){ try { return localStorage.getItem(STORE) === '1'; } catch(e) { return false; } }
function recordar(){ try { localStorage.setItem(STORE, '1'); } catch(e) {} }

function descargar(archivo){
  var a = document.createElement('a');
  a.href = archivo;
  a.download = archivo.split('/').pop();
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function mostrarAviso(texto){
  aviso.textContent = texto;
  aviso.hidden = false;
  clearTimeout(avisoT);
  avisoT = setTimeout(function(){ aviso.hidden = true; }, 5000);
}

function abrir(btn){
  actual = btn;
  ultimoFoco = btn;
  titulo.textContent = btn.getAttribute('data-titulo');
  errorEl.hidden = true;
  inputEmail.classList.remove('err');
  enviar.disabled = false;
  enviar.textContent = 'Descargar mi guía';
  modal.classList.add('abierto');
  modal.setAttribute('aria-hidden', 'false');
  document.documentElement.classList.add('modal-abierto');
  setTimeout(function(){ inputEmail.focus(); }, 80);
}

function cerrar(){
  modal.classList.remove('abierto');
  modal.setAttribute('aria-hidden', 'true');
  document.documentElement.classList.remove('modal-abierto');
  if (ultimoFoco) ultimoFoco.focus({ preventScroll: true });
}

botones.forEach(function(btn){
  btn.addEventListener('click', function(){
    if (yaDejoCorreo()){
      descargar(btn.getAttribute('data-archivo'));
      mostrarAviso('Tu descarga comenzó. ¡Gracias por estar aquí!');
    } else {
      abrir(btn);
    }
  });
});

document.getElementById('rec-modal-cerrar').addEventListener('click', cerrar);
modal.addEventListener('click', function(e){ if (e.target === modal) cerrar(); });
document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && modal.classList.contains('abierto')) cerrar(); });

// el foco se queda dentro de la ventana mientras está abierta
modal.addEventListener('keydown', function(e){
  if (e.key !== 'Tab') return;
  var f = modal.querySelectorAll('button, input, a[href]');
  var primero = f[0], ultimo = f[f.length - 1];
  if (e.shiftKey && document.activeElement === primero){ e.preventDefault(); ultimo.focus(); }
  else if (!e.shiftKey && document.activeElement === ultimo){ e.preventDefault(); primero.focus(); }
});

function error(msg, campo){
  errorEl.textContent = msg;
  errorEl.hidden = false;
  if (campo){ campo.classList.add('err'); campo.focus(); }
}

form.addEventListener('submit', function(e){
  e.preventDefault();
  errorEl.hidden = true;
  inputEmail.classList.remove('err');
  var correo = inputEmail.value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo)) return error('Revisa tu correo: parece incompleto.', inputEmail);
  if (!consent.checked) return error('Marca la casilla para poder enviarte la guía.', null);

  var nombre = inputNombre.value.trim().replace(/\s+/g, ' ');
  var partes = nombre.split(' ');
  var btn = actual;
  enviar.disabled = true;
  enviar.textContent = 'Preparando tu descarga…';

  function listo(){
    recordar();
    descargar(btn.getAttribute('data-archivo'));
    form.reset();
    cerrar();
    mostrarAviso('Tu descarga comenzó. Te sumamos a la lista de Kairal: puedes darte de baja desde cualquier correo.');
  }

  // Si el servicio de correo no responde la persona igual recibe su guía; el envío
  // nunca debe dejarla sin descarga.
  fetch('/.netlify/functions/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: correo,
      firstName: (partes[0] || '').slice(0, 100),
      lastName: partes.slice(1).join(' ').slice(0, 100),
      recurso: btn.getAttribute('data-titulo')
    })
  }).then(listo, listo);
});
})();

/* Tarjetas apiladas (celular): mientras la siguiente guía sube y se posa sobre la anterior, la anterior
   se encoge un poco (solo transform). El apilado en sí lo hace el CSS con position:sticky. */
(function(){
'use strict';
var tarjetas = Array.prototype.slice.call(document.querySelectorAll('.recursos-grid .recurso'));
if (tarjetas.length < 2 || !window.matchMedia) return;
var movil = window.matchMedia('(max-width:920px)');
var quieto = window.matchMedia('(prefers-reduced-motion:reduce)');
var visible = false, pendiente = false;

function reiniciar(){ tarjetas.forEach(function(t){ t.style.transform = ''; }); }

function pintar(){
  pendiente = false;
  if (!movil.matches || quieto.matches){ reiniciar(); return; }
  for (var i = 0; i < tarjetas.length - 1; i++){
    var sig = tarjetas[i + 1];
    var top = parseFloat(getComputedStyle(sig).top) || 0;       // dónde se posa la siguiente
    var alto = tarjetas[i].offsetHeight || 1;
    var avance = 1 - Math.min(1, Math.max(0, (sig.getBoundingClientRect().top - top) / alto));
    tarjetas[i].style.transform = avance > 0 ? 'scale(' + (1 - 0.06 * avance).toFixed(4) + ')' : '';
  }
}
function pedir(){ if (!pendiente && visible){ pendiente = true; requestAnimationFrame(pintar); } }

var grid = tarjetas[0].parentNode;
if ('IntersectionObserver' in window){
  new IntersectionObserver(function(es){ visible = es[0].isIntersecting; if (visible) pedir(); }, { rootMargin: '50% 0px 50% 0px' }).observe(grid);
} else { visible = true; }
window.addEventListener('scroll', pedir, { passive: true });
window.addEventListener('resize', function(){ pedir(); }, { passive: true });
if (movil.addEventListener) movil.addEventListener('change', function(){ pedir(); });
})();
