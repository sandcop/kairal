/* ============================================================
   MI SEGUIMIENTO · espacio privado del paciente
   Habla con el Apps Script de reservas (appscript-reservas/Seguimiento.gs).
   Todo lo que viene del servidor o de la persona se inserta como TEXTO (textContent): nunca como HTML.
   La sesión vive solo en esta pestaña del navegador (sessionStorage).
   ============================================================ */
(function(){
'use strict';

var API = 'https://script.google.com/macros/s/AKfycbznoR3keSxp58PBxbEKU61qyeH74B1SWiE0AvljFKnzwW3vRvSEbawevV91WTPPIwuO/exec';
// Para pruebas locales (nunca en producción)
if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)){
  var apiLocal = new URLSearchParams(location.search).get('api') || window.KAIRAL_RESERVAS_URL;
  if (apiLocal) API = apiLocal;
}
var raiz = document.getElementById('sg-app');
var CLAVE_SESION = 'kairal_seg_sesion';
var INTENSIDAD = ['0 · Sin síntomas', '1 · Leve', '2 · Moderado', '3 · Importante'];
var S = { sesion: '', nombre: '', datos: null, vista: 'diario', alimento: '' };

/* ─── Ayudas ─── */
function el(tag, cls, texto){
  var n = document.createElement(tag);
  if (cls) n.className = cls;
  if (texto != null) n.textContent = texto;
  return n;
}
function pon(nodo, hijos){ (hijos || []).forEach(function(h){ if (h) nodo.appendChild(typeof h === 'string' ? document.createTextNode(h) : h); }); return nodo; }
function limpiar(){ while (raiz.firstChild) raiz.removeChild(raiz.firstChild); }
function guardarSesion(v){ try { if (v) sessionStorage.setItem(CLAVE_SESION, v); else sessionStorage.removeItem(CLAVE_SESION); } catch(e){} }
function leerSesion(){ try { return sessionStorage.getItem(CLAVE_SESION) || ''; } catch(e){ return ''; } }
function sinConexion(){ return { ok: false, error: 'red', mensaje: 'No pudimos conectarnos. Revisa tu internet e inténtalo de nuevo.' }; }
function post(accion, cuerpo){
  var datos = {}; Object.keys(cuerpo || {}).forEach(function(k){ datos[k] = cuerpo[k]; }); datos.action = accion;
  return fetch(API, { method: 'POST', body: JSON.stringify(datos) }).then(function(r){ return r.json(); }).catch(sinConexion);
}
// Llamadas con sesión: si la sesión terminó, vuelve a la entrada y no sigue. Si la Dra. quitó el acceso (sin_acceso), muestra la
// pantalla donde solo se puede borrar la cuenta o salir.
function conSesion(accion, cuerpo){
  var c = {}; Object.keys(cuerpo || {}).forEach(function(k){ c[k] = cuerpo[k]; }); c.sesion = S.sesion;
  return post(accion, c).then(function(r){
    if (r && r.error === 'sesion'){ cerrarLocal('Tu sesión terminó. Vuelve a entrar.'); return null; }
    if (r && r.error === 'debe_cambiar'){ vistaCambiar(true); return null; }
    if (r && r.error === 'sin_acceso'){ vistaSinAcceso(); return null; }
    return r;
  });
}
function cerrarLocal(aviso){ S.sesion = ''; S.datos = null; S.vista = 'diario'; S.alimento = ''; guardarSesion(''); vistaEntrada(aviso); }
function campo(id, etiqueta, tipo, ayuda, opciones){
  var w = el('div', 'rv-campo');
  var l = el('label', null, etiqueta); l.htmlFor = id;
  var i = el(tipo === 'textarea' ? 'textarea' : 'input'); i.id = id;
  if (tipo !== 'textarea') i.type = tipo;
  if (opciones) Object.keys(opciones).forEach(function(k){ i.setAttribute(k, opciones[k]); });
  pon(w, [l, i]);
  if (ayuda) w.appendChild(el('span', 'ayuda', ayuda));
  return { nodo: w, input: i };
}
function boton(texto, clic, cls){
  var b = el('button', cls || 'btn btn-reserva', texto); b.type = 'button'; b.addEventListener('click', clic); return b;
}
// Solo los mensajes se anuncian a los lectores de pantalla: los errores como alerta y el resto con aria-live="polite"
function mensaje(clase, texto){
  var p = el('p', clase, texto);
  if (clase === 'sg-alerta' || clase === 'rv-error') p.setAttribute('role', 'alert');
  else { p.setAttribute('role', 'status'); p.setAttribute('aria-live', 'polite'); }
  return p;
}
// Nodo de estado para confirmaciones: se crea VACÍO al pintar y después se le pone el texto, para que los lectores de pantalla lo anuncien
function nodoEstado(){ var p = el('p'); p.setAttribute('role', 'status'); p.setAttribute('aria-live', 'polite'); return p; }
function decir(nodo, clase, texto){ nodo.className = texto ? clase : ''; nodo.textContent = texto || ''; }
function tarjeta(titulo, hijos){ var c = el('section', 'rv-card'); if (titulo) c.appendChild(el('h2', 'rv-titulo', titulo)); return pon(c, hijos); }
function fechaHora(ms){ return new Date(ms).toLocaleString('es-CL', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }); }

/* ─── Entrada ─── */
function vistaEntrada(aviso){
  limpiar();
  if (aviso) raiz.appendChild(mensaje('rv-aviso', aviso));
  var err = mensaje('rv-error', ''); err.hidden = true;
  var correo = campo('sg-correo', 'Tu correo', 'email', 'El mismo con el que reservaste tu consulta.', { autocomplete: 'email', inputmode: 'email' });
  var clave = campo('sg-clave', 'Tu clave', 'password', null, { autocomplete: 'current-password' });
  var entrar = boton('Entrar', function(){
    err.hidden = true; entrar.disabled = true;
    post('seg_entrar', { correo: correo.input.value, clave: clave.input.value }).then(function(r){
      entrar.disabled = false;
      if (!r.ok){ err.textContent = r.mensaje || 'No pudimos entrar.'; err.hidden = false; return; }
      S.sesion = r.sesion; S.nombre = r.nombre; guardarSesion(r.sesion);
      if (r.sinAcceso) vistaSinAcceso();
      else if (r.temporal) vistaCambiar(true); else cargar();
    });
  });
  raiz.appendChild(tarjeta('Entra a tu seguimiento', [err, correo.nodo, clave.nodo, entrar]));

  var pedido = mensaje('sg-ok', ''); pedido.hidden = true;
  var err2 = mensaje('rv-error', ''); err2.hidden = true;
  var correo2 = campo('sg-correo-pedir', 'Tu correo', 'email', 'Te enviamos una clave temporal si tienes una consulta confirmada con la Dra.', { autocomplete: 'email', inputmode: 'email' });
  var trampa = el('div', 'rv-trampa'); trampa.setAttribute('aria-hidden', 'true');
  var ti = el('input'); ti.type = 'text'; ti.tabIndex = -1; ti.autocomplete = 'off'; ti.name = 'web'; trampa.appendChild(ti);
  var pedir = boton('Enviarme una clave', function(){
    pedido.hidden = true; err2.hidden = true; pedir.disabled = true;
    post('seg_pedir', { correo: correo2.input.value, web: ti.value }).then(function(r){
      pedir.disabled = false;
      if (!r.ok){ err2.textContent = r.mensaje || 'No pudimos enviar la clave.'; err2.hidden = false; return; }
      pedido.textContent = r.mensaje; pedido.hidden = false;
    });
  }, 'btn btn-ghost');
  raiz.appendChild(tarjeta('¿Primera vez o olvidaste tu clave?', [err2, correo2.nodo, trampa, pedir, pedido]));
}

/* ─── Cambiar la clave (obligatorio la primera vez) ─── */
function vistaCambiar(obligatorio){
  if (obligatorio) limpiar();   // en «Mi cuenta» (no obligatorio) devuelve la tarjeta sin tocar la pantalla
  var err = mensaje('rv-error', ''); err.hidden = true;
  var ok = mensaje('sg-ok', ''); ok.hidden = true;
  var actual = campo('sg-actual', obligatorio ? 'Tu clave temporal' : 'Tu clave actual', 'password', null, { autocomplete: 'current-password' });
  var nueva = campo('sg-nueva', 'Tu clave nueva', 'password', 'Mínimo 10 caracteres.', { autocomplete: 'new-password' });
  var guardar = boton('Guardar mi clave', function(){
    err.hidden = true; ok.hidden = true; guardar.disabled = true;
    conSesion('seg_cambiar', { actual: actual.input.value, nueva: nueva.input.value }).then(function(r){
      guardar.disabled = false;
      if (!r) return;
      if (!r.ok){ err.textContent = r.mensaje || 'No pudimos cambiar tu clave.'; err.hidden = false; return; }
      if (obligatorio) cargar();
      else { ok.textContent = 'Listo, tu clave quedó cambiada.'; ok.hidden = false; actual.input.value = ''; nueva.input.value = ''; }
    });
  });
  var tarj = tarjeta(obligatorio ? 'Elige tu clave personal' : 'Cambiar mi clave', [
    obligatorio ? el('p', 'rv-sub', 'La que te enviamos por correo era temporal. Elige una que solo tú conozcas.') : null,
    err, actual.nodo, nueva.nodo, guardar, ok]);
  if (obligatorio) raiz.appendChild(tarj); else return tarj;
}

/* ─── Carga y estructura ─── */
function cargar(){
  limpiar(); raiz.appendChild(el('p', 'rv-cargando', 'Cargando tu seguimiento…'));
  conSesion('seg_datos', {}).then(function(r){
    if (!r) return;
    if (!r.ok){
      vistaEntrada(r.mensaje);
      raiz.insertBefore(boton('Reintentar', cargar, 'btn btn-reserva'), raiz.firstChild.nextSibling);
      return;
    }
    S.datos = r; S.nombre = r.nombre;
    pintar();
  });
}
function barraArriba(){
  var barra = el('div', 'sg-barra');
  barra.appendChild(el('p', 'sg-hola', S.nombre ? 'Hola, ' + S.nombre.split(/\s+/)[0] : ''));
  barra.appendChild(boton('Salir', function(){ post('seg_salir', { sesion: S.sesion }); cerrarLocal('Cerraste tu sesión.'); }, 'sg-salir'));
  return barra;
}
function pintar(){
  limpiar();
  raiz.appendChild(barraArriba());
  raiz.appendChild(el('p', 'sg-aviso-seguridad', 'Este espacio es un apoyo entre consultas: no reemplaza las indicaciones de la Dra. ni la atención médica. Si tienes una urgencia, busca atención de inmediato.'));
  var menu = el('nav', 'sg-menu'); menu.setAttribute('aria-label', 'Secciones');
  [['diario', 'Mi diario'], ['guias', 'Guías'], ['enviar', 'Enviar a la Dra.'], ['cuenta', 'Mi cuenta']].forEach(function(v){
    var b = boton(v[1], function(){ S.vista = v[0]; pintar(); window.scrollTo(0, 0); }, null);
    b.className = ''; if (S.vista === v[0]) b.setAttribute('aria-current', 'page');
    menu.appendChild(b);
  });
  raiz.appendChild(menu);
  if (S.vista === 'guias') pintarGuias();
  else if (S.vista === 'enviar') pintarEnviar();
  else if (S.vista === 'cuenta') pintarCuenta();
  else pintarDiario();
}

/* ─── Diario ─── */
// Dos textos son el mismo alimento si coinciden sin mayúsculas, sin tildes y con los espacios juntos (igual que en el servidor)
function claveAlimento(a){
  return String(a || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
}
function textoAlimento(a){ return String(a || '').replace(/\s+/g, ' ').trim(); }
function entradaDe(alimento, dia){
  var k = claveAlimento(alimento), r = null;
  if (!k) return null;
  S.datos.diario.forEach(function(d){ if (claveAlimento(d.alimento) === k && d.dia === dia) r = d; });
  return r;
}
// Alimentos distintos del diario, con el texto como se escribió la última vez
function alimentosAnotados(){
  var porClave = {}, orden = [];
  S.datos.diario.slice().sort(function(x, y){ return (x.actualizado || 0) - (y.actualizado || 0); }).forEach(function(d){
    var k = claveAlimento(d.alimento);
    if (!k) return;
    if (!porClave[k]) orden.push(k);
    porClave[k] = textoAlimento(d.alimento);
  });
  return orden.map(function(k){ return porClave[k]; });
}
function tituloDia(dia, alimento){
  var a = textoAlimento(alimento);
  if (dia === S.datos.dias) return 'Día de descanso' + (a ? ' de ' + a : '');
  return 'Día ' + dia + ' de prueba' + (a ? ' de ' + a : '');
}
function pintarDiario(){
  var d = S.datos, tarjetas = [], cargada = claveAlimento(S.alimento);
  var campoAl = campo('sg-alimento', 'Alimento que estás probando', 'text', 'Escribe el alimento, por ejemplo: palta.', { maxlength: '80', autocomplete: 'off' });
  var entrada = campoAl.input; entrada.value = S.alimento;
  var chips = el('div', 'sg-yaanotados');
  var diasCont = el('div');
  function pintarChips(){
    while (chips.firstChild) chips.removeChild(chips.firstChild);
    var lista = alimentosAnotados();
    chips.hidden = !lista.length;
    if (!lista.length) return;
    chips.appendChild(el('p', 'rv-sub', 'Alimentos que ya anotaste'));
    var fila = el('div', 'sg-chips');
    lista.forEach(function(a){
      fila.appendChild(boton(a, function(){ entrada.value = a; S.alimento = a; ponerTitulos(); rellenar(); }, 'sg-chip'));
    });
    chips.appendChild(fila);
  }
  function ponerTitulos(){ tarjetas.forEach(function(t, i){ t.titulo.textContent = tituloDia(i + 1, S.alimento); }); }
  // Rellena los campos de cada día con lo anotado para ese alimento, sin volver a crear las tarjetas (así un clic en «Guardar» no se pierde).
  // Si todavía no había alimento escrito y no hay nada anotado, se deja lo que la persona ya hubiera escrito.
  function rellenar(){
    var k = claveAlimento(S.alimento);
    if (k === cargada) return;
    var habia = cargada; cargada = k;
    tarjetas.forEach(function(t, i){
      var e = entradaDe(S.alimento, i + 1);
      if (!e && !habia) return;
      t.poner(e || { cantidad: '', sintomas: {}, nota: '' });
    });
  }
  entrada.addEventListener('input', function(){ S.alimento = entrada.value; ponerTitulos(); });
  entrada.addEventListener('change', function(){ S.alimento = entrada.value; ponerTitulos(); rellenar(); });
  function alGuardar(){ pintarChips(); cargada = claveAlimento(S.alimento); }
  for (var dia = 1; dia <= d.dias; dia++){ var t = tarjetaDia(dia, alGuardar); tarjetas.push(t); diasCont.appendChild(t.nodo); }
  ponerTitulos();
  pintarChips();
  raiz.appendChild(tarjeta('Mi diario', [el('p', 'rv-sub', 'Prueba un alimento por vez: 3 días de prueba y 1 de descanso. Anota cada día cómo te sientes.'), campoAl.nodo, chips]));
  raiz.appendChild(diasCont);
  rellenar();
}
function tarjetaDia(dia, alGuardar){
  var d = S.datos, previo = entradaDe(S.alimento, dia) || { cantidad: '', sintomas: {}, nota: '' };
  var descanso = dia === d.dias;
  var cant = descanso ? null : campo('sg-cant-' + dia, 'Cantidad que comiste', 'text', 'Por ejemplo: media palta, 40 g.', { maxlength: '60' });
  var grid = el('div', 'sg-sintomas'), selects = {};
  d.sintomas.forEach(function(nombre, i){
    var c = campo('sg-s-' + dia + '-' + i, nombre, 'text'); var s = el('select'); s.id = c.input.id;
    c.nodo.replaceChild(s, c.input);
    INTENSIDAD.forEach(function(t, n){ var o = el('option', null, t); o.value = String(n); s.appendChild(o); });
    selects[nombre] = s; grid.appendChild(c.nodo);
  });
  var nota = campo('sg-nota-' + dia, 'Notas (qué sentiste al comerlo)', 'textarea', null, { maxlength: '300' });
  var res = el('div'), msgs = el('div'), estado = nodoEstado(), guardar; pon(res, [msgs, estado]);
  function aviso(){
    var grave = Object.keys(selects).some(function(k){ return selects[k].value === '3'; });
    while (msgs.firstChild) msgs.removeChild(msgs.firstChild);
    if (grave) msgs.appendChild(mensaje('sg-alerta', 'Con síntomas importantes: suspende este alimento, espera a que tu cuerpo se recupere y anótalo. Si te sientes muy mal, busca atención médica.'));
  }
  function poner(e){
    if (cant) cant.input.value = e.cantidad || '';
    Object.keys(selects).forEach(function(k){ selects[k].value = String((e.sintomas || {})[k] || 0); });
    nota.input.value = e.nota || '';
    aviso(); decir(estado, '', '');
  }
  Object.keys(selects).forEach(function(k){ selects[k].addEventListener('change', aviso); });
  poner(previo);
  guardar = boton('Guardar este día', function(){
    if (!textoAlimento(S.alimento)){
      aviso(); decir(estado, '', ''); msgs.appendChild(mensaje('rv-error', 'Escribe primero el alimento que estás probando.')); return;
    }
    guardar.disabled = true;
    var sint = {}; Object.keys(selects).forEach(function(k){ sint[k] = Number(selects[k].value); });
    conSesion('seg_guardar', { alimento: textoAlimento(S.alimento), dia: dia, cantidad: cant ? cant.input.value : '', sintomas: sint, nota: nota.input.value }).then(function(r){
      guardar.disabled = false;
      if (!r) return;
      if (!r.ok){ aviso(); decir(estado, '', ''); msgs.appendChild(mensaje('rv-error', r.mensaje || 'No pudimos guardar.')); return; }
      var k = claveAlimento(r.entrada.alimento);
      var otros = S.datos.diario.filter(function(x){ return !(claveAlimento(x.alimento) === k && x.dia === r.entrada.dia); });
      otros.push(r.entrada); S.datos.diario = otros;
      aviso(); decir(estado, 'sg-ok', 'Guardado.');
      if (alGuardar) alGuardar();
    });
  });
  var titulo = el('h3', null, tituloDia(dia, ''));
  var tarj = tarjeta(null, [titulo, cant ? cant.nodo : null, grid, nota.nodo, guardar, res]);
  tarj.className = 'rv-card sg-dia';
  return { nodo: tarj, titulo: titulo, poner: poner };
}

/* ─── Guías ─── */
function pintarGuias(){
  var guias = window.SEGUIMIENTO_GUIAS || [];
  var cont = el('div');
  guias.forEach(function(g){
    var det = el('details', 'sg-guia'); det.appendChild(el('summary', null, g.titulo));
    var cuerpo = el('div', 'sg-guia-cuerpo');
    g.bloques.forEach(function(b){
      if (b.tipo === 'lista'){ var ul = el('ul'); b.items.forEach(function(t){ ul.appendChild(el('li', null, t)); }); cuerpo.appendChild(ul); }
      else cuerpo.appendChild(el('p', b.tipo === 'aviso' ? 'sg-guia-aviso' : null, b.texto));
    });
    det.appendChild(cuerpo); cont.appendChild(det);
  });
  raiz.appendChild(tarjeta('Guías', [cont]));
}

/* ─── Enviar a la Dra. ─── */
function pintarEnviar(){
  var d = S.datos;
  var porAlimento = {}, orden = [];
  d.diario.forEach(function(x){ var k = claveAlimento(x.alimento); if (!porAlimento[k]){ porAlimento[k] = 0; orden.push(k); } porAlimento[k]++; });
  var textos = {}; alimentosAnotados().forEach(function(t){ textos[claveAlimento(t)] = t; });
  var resumen = el('ul', 'sg-resumen');
  orden.forEach(function(k){ resumen.appendChild(el('li', null, (textos[k] || k) + ' · ' + porAlimento[k] + (porAlimento[k] === 1 ? ' día anotado' : ' días anotados'))); });
  var res = el('div'), msgsE = el('div'), estadoE = nodoEstado(); pon(res, [msgsE, estadoE]);
  var hijos = [];
  var anteriores = el('div');
  function pintarAnteriores(){
    while (anteriores.firstChild) anteriores.removeChild(anteriores.firstChild);
    if (!d.envios.length) return;
    var ul = el('ul', 'sg-lista-envios'); d.envios.forEach(function(e){ ul.appendChild(el('li', null, 'Enviado el ' + fechaHora(e.fecha))); });
    anteriores.appendChild(el('p', 'rv-sub', 'Envíos anteriores:')); anteriores.appendChild(ul);
  }
  if (!orden.length){
    hijos.push(el('p', 'rv-vacio', 'Todavía no tienes nada anotado. Cuando lo tengas, desde aquí puedes enviárselo a la Dra.'));
  } else {
    var cb = el('input'); cb.type = 'checkbox'; cb.id = 'sg-acepto';
    var lab = el('label', null, d.consentimiento); lab.htmlFor = 'sg-acepto';
    var consent = el('div', 'sg-consent'); pon(consent, [cb, lab]);
    var enviar = boton('Enviar a la Dra.', function(){
      enviar.disabled = true;
      conSesion('seg_enviar', { acepta: true }).then(function(r){
        if (!r) return;
        while (msgsE.firstChild) msgsE.removeChild(msgsE.firstChild);
        if (!r.ok){ enviar.disabled = !cb.checked; decir(estadoE, '', ''); msgsE.appendChild(mensaje('rv-error', r.mensaje || 'No pudimos enviarlo.')); return; }
        decir(estadoE, 'sg-ok', r.mensaje);
        S.datos.envios.unshift({ id: r.id, fecha: Date.now() }); cb.checked = false; enviar.disabled = true; pintarAnteriores();
      });
    }, 'btn btn-reserva sg-boton');
    enviar.disabled = true;
    cb.addEventListener('change', function(){ enviar.disabled = !cb.checked; });
    hijos.push(el('p', 'rv-sub', 'Al enviar, la Dra. verá todo lo que anotaste: alimentos, cantidades, síntomas y notas. Lo que anotas no lo ve la Dra. hasta que tú decides enviárselo.'), resumen, consent, enviar, res);
  }
  hijos.push(anteriores);
  pintarAnteriores();
  raiz.appendChild(tarjeta('Enviar a la Dra.', hijos));
}

/* ─── Mi cuenta ─── */
function pintarCuenta(){
  raiz.appendChild(vistaCambiar(false));
  raiz.appendChild(tarjetaBorrar());
}
// Borrar la cuenta y el diario (con la clave). También está en la pantalla de quien ya no tiene acceso.
function tarjetaBorrar(){
  var err = mensaje('rv-error', ''); err.hidden = true;
  var clave = campo('sg-borrar-clave', 'Tu clave', 'password', null, { autocomplete: 'current-password' });
  var borrar = boton('Borrar mi cuenta y mi diario', function(){
    if (!window.confirm('Vamos a borrar tu cuenta y tu diario. Lo que ya enviaste a la Dra. queda con ella. ¿Seguro?')) return;
    err.hidden = true;
    conSesion('seg_borrar', { clave: clave.input.value }).then(function(r){
      if (!r) return;
      if (!r.ok){ err.textContent = r.mensaje || 'No pudimos borrar tu cuenta.'; err.hidden = false; return; }
      S.sesion = ''; S.datos = null; S.vista = 'diario'; S.alimento = ''; guardarSesion(''); vistaEntrada(r.mensaje);
    });
  }, 'btn btn-ghost');
  var tarj = tarjeta('Borrar mi cuenta', [el('p', 'rv-sub', 'Se borran tu cuenta y tu diario. Los envíos que ya hiciste a la Dra. no se borran.'), err, clave.nodo, borrar]);
  tarj.classList.add('sg-peligro');
  return tarj;
}

/* ─── Sin acceso (la Dra. lo quitó): solo borrar la cuenta y el diario, o salir ─── */
function vistaSinAcceso(){
  S.datos = null; S.vista = 'diario'; S.alimento = '';
  limpiar();
  raiz.appendChild(barraArriba());
  var aviso = tarjeta('La Dra. quitó tu acceso a Mi seguimiento', [
    el('p', 'rv-sub', 'Ya no puedes anotar ni enviar tu seguimiento. Lo que ya le enviaste a la Dra. queda con ella.'),
    el('p', 'rv-sub', 'Tu cuenta y tu diario siguen guardados. Si quieres, puedes borrarlos aquí con tu clave. Si crees que es un error, escríbele a la Dra.')
  ]);
  aviso.classList.add('sg-sin-acceso');
  raiz.appendChild(aviso);
  raiz.appendChild(tarjetaBorrar());
}

/* ─── Arranque ─── */
S.sesion = leerSesion();
if (S.sesion) cargar(); else vistaEntrada();
})();
