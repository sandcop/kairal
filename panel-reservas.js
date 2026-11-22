/* Generado por appscript-reservas/pruebas/generar-panel-sitio.js desde PanelPagina.html: no editar a mano. */
window.KAIRAL_API = "https://script.google.com/macros/s/AKfycbznoR3keSxp58PBxbEKU61qyeH74B1SWiE0AvljFKnzwW3vRvSEbawevV91WTPPIwuO/exec";
(function () {
  'use strict';
  var S = { sesion: null, items: [], hoy: '', desfase: 0, pestana: 'confirmar', tarjeta: false, seguimiento: false, q: '', estado: '', cargando: false, abiertas: {} };
  var $ = function (id) { return document.getElementById(id); };

  // ── DOM seguro: todo lo que viene de pacientes se inserta como TEXTO, nunca como HTML ──
  function el(tag, attrs, hijos) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'clase') e.className = attrs[k];
      else if (k === 'texto') e.textContent = attrs[k];
      else if (k === 'click') e.addEventListener('click', attrs[k]);
      else if (attrs[k] !== false && attrs[k] != null) e.setAttribute(k, attrs[k]);
    });
    (hijos || []).forEach(function (h) { if (h) e.appendChild(typeof h === 'string' ? document.createTextNode(h) : h); });
    return e;
  }
  function vaciar(n) { while (n.firstChild) n.removeChild(n.firstChild); }
  function normal(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function slug(s) { return normal(s).replace(/[^a-z]+/g, '-'); }

  // Íconos de línea (texto fijo del propio panel, nunca datos de pacientes)
  var ICONOS = {
    confirmar: '<path d="M20 12V8H6a2 2 0 0 1 0-4h12v4"/><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>',
    proximas: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4"/>',
    retenidas: '<path d="M6 2h12M6 22h12M7 2c0 5 5 6 5 10s-5 5-5 10M17 2c0 5-5 6-5 10s5 5 5 10"/>',
    historial: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>',
    calendario: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18M8 2v4M16 2v4M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>',
    hoy: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    buscar: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    wsp: '<path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.4A8.4 8.4 0 1 1 21 11.5z"/>',
    correo: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    meet: '<rect x="2" y="6" width="14" height="12" rx="2"/><path d="M16 10l6-3v10l-6-3"/>',
    nota: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    reloj: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    vacio: '<circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/>',
    pacientes: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2.5"/><path d="M5.5 17c.8-2 2-3 3.5-3s2.7 1 3.5 3M15 10h3M15 13h3"/>',
    avisos: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10.3 20a2 2 0 0 0 3.4 0"/>',
    seguimientos: '<path d="M9 4h6a2 2 0 0 1 2 2v14H7V6a2 2 0 0 1 2-2z"/><path d="M10 9h4M10 13h4M10 17h2"/>',
    control: '<path d="M12 21a9 9 0 1 1 9-9"/><path d="M12 7v5l3 2M17 17l2 2 3-3"/>'
  };
  function icono(n) {
    var s = document.createElement('span'); s.className = 'ico'; s.setAttribute('aria-hidden', 'true');
    s.innerHTML = '<svg viewBox="0 0 24 24">' + (ICONOS[n] || '') + '</svg>';
    return s;
  }
  var DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  function fechaDe(ymd) { var p = String(ymd || '').split('-'); return p.length === 3 ? new Date(+p[0], +p[1] - 1, +p[2]) : null; }
  function fechaLarga(ymd) { var d = fechaDe(ymd); if (!d) return ''; var x = DIAS[d.getDay()] + ' ' + d.getDate() + ' de ' + MESES[d.getMonth()]; return x.charAt(0).toUpperCase() + x.slice(1); }
  function fechaCorta(ymd) { var d = fechaDe(ymd); return d ? DIAS[d.getDay()].slice(0, 3) + ' ' + d.getDate() + ' ' + MESES[d.getMonth()].slice(0, 3) : ''; }
  function relativo(ms) {
    var m = Math.round(Math.abs(ms) / 60000); if (m < 1) return 'menos de 1 min'; if (m < 60) return m + ' min';
    var h = Math.round(m / 60); if (h < 24) return h + ' h'; var d = Math.round(h / 24); return d + (d === 1 ? ' día' : ' días');
  }
  function iniciales(n) { return String(n || '').trim().split(/\s+/).slice(0, 2).map(function (x) { return x.charAt(0).toUpperCase(); }).join(''); }
  function esqueletos(cont, n) { for (var i = 0; i < n; i++) cont.appendChild(el('div', { clase: 'esqueleto', 'aria-hidden': 'true' })); }

  // ── Llamadas al servidor ──
  // Dentro de Apps Script se usa google.script.run. Como página del sitio (panel-reservas.html) se define
  // window.KAIRAL_API y se llama por POST al mismo Apps Script: así no depende de cuál cuenta de Google tenga
  // abierta el navegador (el marco de Apps Script falla cuando hay varias).
  function llamar(fn, args, ok, mal) {
    function falla(e) { if (mal) mal(e); else mostrar('No pude comunicarme con el servidor. Revisa tu conexión e inténtalo de nuevo.', true); }
    if (window.KAIRAL_API) {
      fetch(window.KAIRAL_API, { method: 'POST', body: JSON.stringify({ action: 'panel', fn: fn, args: args }) })
        .then(function (r) { return r.json(); }).then(ok).catch(falla);
      return;
    }
    var run = google.script.run.withSuccessHandler(ok).withFailureHandler(falla);
    run[fn].apply(run, args);
  }

  // ── Entrada ──
  function guardarSesion(s) { try { if (s) sessionStorage.setItem('kp', s); else sessionStorage.removeItem('kp'); } catch (e) {} }
  function leerSesion() { try { return sessionStorage.getItem('kp'); } catch (e) { return null; } }

  // Entrar con clave (modo de transición)
  $('formEntrada').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var b = $('btnEntrar'); b.disabled = true; $('msgEntrada').textContent = 'Revisando…';
    llamar('panelEntrar', [$('clave').value], function (r) {
      b.disabled = false;
      if (!r.ok) { $('msgEntrada').textContent = r.mensaje; if (r.error === 'usa_google') iniciarEntrada(); else $('clave').select(); return; }
      $('clave').value = ''; $('msgEntrada').textContent = '';
      S.sesion = r.sesion; guardarSesion(r.sesion);
      abrirPanel();
    }, function () { b.disabled = false; $('msgEntrada').textContent = 'No pude comunicarme con el servidor. Inténtalo de nuevo.'; });
  });

  // Entrar con Google. El servidor comprueba el inicio de sesión con Google; aquí solo se pasa el "credential".
  function entroGoogle(resp) {
    $('msgEntrada').textContent = 'Comprobando tu cuenta…';
    llamar('panelEntrarGoogle', [resp && resp.credential], function (r) {
      if (!r.ok) { $('msgEntrada').textContent = r.mensaje; return; }
      $('msgEntrada').textContent = '';
      S.sesion = r.sesion; guardarSesion(r.sesion);
      abrirPanel();
    }, function () { $('msgEntrada').textContent = 'No pude comunicarme con el servidor. Inténtalo de nuevo.'; });
  }
  function cargarGoogle(ok, mal) {
    if (window.google && google.accounts && google.accounts.id) return ok();
    var s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client'; s.async = true; s.defer = true;
    s.onload = ok; s.onerror = mal;
    document.head.appendChild(s);
  }
  function prepararGoogle(clientId) {
    $('bloqueGoogle').classList.remove('oculto'); $('formEntrada').classList.add('oculto'); $('cargandoEntrada').classList.add('oculto');
    // Dentro del marco de Apps Script el inicio con Google no funciona: se manda a la página del sitio
    if (!window.KAIRAL_API) {
      $('botonGoogle').textContent = '';
      $('msgEntrada').textContent = 'Este panel ahora se abre desde kairal.cl/panel-reservas.html.';
      return;
    }
    cargarGoogle(function () {
      google.accounts.id.initialize({ client_id: clientId, callback: entroGoogle, auto_select: false, ux_mode: 'popup' });
      vaciar($('botonGoogle'));
      google.accounts.id.renderButton($('botonGoogle'), { theme: 'outline', size: 'large', text: 'signin_with', shape: 'pill', locale: 'es', width: 280 });
    }, function () {
      $('msgEntrada').textContent = 'No pude cargar el inicio de sesión de Google. Revisa tu conexión (o si algún bloqueador de anuncios lo está impidiendo) e inténtalo de nuevo.';
    });
  }
  // Pregunta al servidor cómo se entra (Google o clave) y muestra lo que corresponda
  function iniciarEntrada() {
    $('cargandoEntrada').classList.remove('oculto'); $('bloqueGoogle').classList.add('oculto'); $('formEntrada').classList.add('oculto');
    llamar('panelConfig', [], function (c) {
      if (c && c.modo === 'google') { prepararGoogle(c.clientId); return; }
      $('cargandoEntrada').classList.add('oculto'); $('formEntrada').classList.remove('oculto'); $('clave').focus();
    }, function () { $('cargandoEntrada').textContent = 'No pude comunicarme con el servidor. Recarga la página.'; });
  }

  function abrirPanel() {
    $('entrada').classList.add('oculto'); $('panel').classList.remove('oculto');
    if (!S.items.length) { vaciar($('lista')); esqueletos($('lista'), 3); }
    cargar();
  }
  function irAEntrada(mensaje) {
    S.sesion = null; guardarSesion(null); S.items = []; $('usuario').textContent = ''; $('avatarUsuario').textContent = ''; S.vista = '';
    $('panel').classList.add('oculto'); $('entrada').classList.remove('oculto');
    iniciarEntrada();
    $('msgEntrada').textContent = mensaje || '';
  }
  $('btnSalir').addEventListener('click', function () {
    var s = S.sesion; if (s) llamar('panelSalir', [s], function () {}, function () {});
    try { if (window.google && google.accounts && google.accounts.id) google.accounts.id.disableAutoSelect(); } catch (e) {}
    irAEntrada('');
  });
  $('btnActualizar').addEventListener('click', function () {
    // «Actualizar» explícito repinta Pacientes y Avisos (este último solo si no hay un aviso a medio escribir)
    if (S.pestana === 'pacientes' || S.pestana === 'seguimientos') S.vista = '';
    else if (S.pestana === 'avisos' && !(($('avTitulo') || {}).value) && !(($('avTexto') || {}).value)) S.vista = '';
    cargar(true);
  });

  // ── Datos ──
  function cargar(manual) {
    if (!S.sesion || S.cargando) return;
    S.cargando = true;
    llamar('panelDatos', [S.sesion], function (r) {
      S.cargando = false;
      if (!r.ok) {
        if (r.error === 'sesion') { irAEntrada(r.mensaje); return; }
        // Otro error del servidor: se avisa y la sesión sigue (antes sacaba del panel sin explicar nada)
        falloCarga('No pude cargar las reservas: ' + (r.mensaje || 'el servidor respondió con un error') + ' Prueba con "Actualizar".');
        return;
      }
      S.items = r.items; S.tarjeta = r.tarjeta === true; S.seguimiento = r.seguimiento === true; S.hoy = r.hoy; S.desfase = r.ahora - Date.now();
      $('usuario').textContent = r.usuario || '';
      $('avatarUsuario').textContent = String(r.usuario || '').charAt(0).toUpperCase();
      var h = new Date(r.ahora);
      $('actualizado').textContent = 'Actualizado ' + ('0' + h.getHours()).slice(-2) + ':' + ('0' + h.getMinutes()).slice(-2);
      pintar();
      if (S.pestana === 'calendario') { S.agenda = null; S.agendaError = ''; pintar(); }
      if (manual) mostrar('Lista actualizada.');
    }, function () {
      S.cargando = false;
      if (manual || !S.items.length) falloCarga('No pude comunicarme con el servidor. Revisa tu conexión y prueba con "Actualizar".');
    });
  }
  function falloCarga(texto) {
    if (!S.items.length) { var l = $('lista'); vaciar(l); l.appendChild(el('p', { clase: 'vacio' }, [el('span', { texto: texto })])); }
    mostrar(texto, true);
  }
  setInterval(function () { if (S.sesion && !document.hidden && !$('modal').firstChild) cargar(); }, 60000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) cargar(); });

  // ── Clasificación ──
  var FINALES = { 'Realizada': 1, 'Ausente': 1, 'Dra. ausente': 1, 'Expirada': 1, 'Rechazada': 1, 'Cancelada': 1, 'Reembolsada': 1 };
  function ahora() { return Date.now() + S.desfase; }
  function esVencida(r) { return r.estado === 'Retenida' && r.retencionHasta && r.retencionHasta <= ahora(); }
  function pestanaDe(r) {
    if (r.estado === 'Pago informado') return 'confirmar';
    if (r.estado === 'Confirmada' && r.dia >= S.hoy) return 'proximas';
    if (r.estado === 'Retenida' && !esVencida(r)) return 'retenidas';
    return 'historial';
  }
  var PESTANAS = [['confirmar', 'Por confirmar', 'Confirmar'], ['proximas', 'Próximas', 'Próximas'], ['retenidas', 'Retenidas', 'Retenidas'], ['historial', 'Historial', 'Historial'], ['calendario', 'Calendario', 'Agenda'], ['pacientes', 'Pacientes', 'Pacientes'], ['avisos', 'Avisos', 'Avisos'], ['seguimientos', 'Seguimientos', 'Seguim.']];
  var TITULOS = { confirmar: 'Por confirmar', proximas: 'Próximas consultas', retenidas: 'Horas retenidas', historial: 'Historial', calendario: 'Calendario', pacientes: 'Pacientes con tarjeta', avisos: 'Avisos a pacientes', seguimientos: 'Seguimientos enviados por pacientes' };

  function pintar() {
    var conteo = { confirmar: 0, proximas: 0, retenidas: 0, historial: 0, calendario: '', pacientes: '', avisos: '', seguimientos: '' }, hoyN = 0;
    S.items.forEach(function (r) { conteo[pestanaDe(r)]++; if (r.estado === 'Confirmada' && r.dia === S.hoy) hoyN++; });

    var res = $('resumen'); vaciar(res);
    [['Por confirmar', conteo.confirmar, 'confirmar', conteo.confirmar > 0, 'confirmar'], ['Consultas hoy', hoyN, 'proximas', false, 'hoy'],
     ['Próximas', conteo.proximas, 'proximas', false, 'proximas'], ['Horas retenidas', conteo.retenidas, 'retenidas', false, 'retenidas']].forEach(function (d) {
      res.appendChild(el('button', { type: 'button', clase: 'dato' + (d[3] ? ' alerta' : ''), click: function () { S.pestana = d[2]; S.q = ''; $('buscar').value = ''; pintar(); } },
        [icono(d[4]), el('b', { texto: String(d[1]) }), el('span', { clase: 'dato-txt', texto: d[0] })]));
    });

    // Pacientes y Avisos solo existen si la tarjeta está activa (panelDatos trae tarjeta: true)
    if (!S.tarjeta && (S.pestana === 'pacientes' || S.pestana === 'avisos')) S.pestana = 'confirmar';
    if (!S.seguimiento && S.pestana === 'seguimientos') S.pestana = 'confirmar';
    var pe = $('pestanas'); vaciar(pe);
    PESTANAS.forEach(function (p) {
      if (!S.tarjeta && (p[0] === 'pacientes' || p[0] === 'avisos')) return;
      if (!S.seguimiento && p[0] === 'seguimientos') return;
      var activa = S.pestana === p[0] && !S.q;
      pe.appendChild(el('button', { type: 'button', role: 'tab', 'aria-selected': String(activa), clase: 'pestana' + (activa ? ' activa' : '') + (p[0] === 'confirmar' && conteo.confirmar ? ' urgente' : ''),
        click: function () { S.pestana = p[0]; S.q = ''; $('buscar').value = ''; pintar(); window.scrollTo(0, 0); } },
        [icono(p[0]), el('span', { clase: 'pestana-txt', texto: p[1] }), el('span', { clase: 'pestana-corto', texto: p[2] }), conteo[p[0]] === '' ? '' : el('span', { clase: 'n' + (conteo[p[0]] ? '' : ' cero'), texto: String(conteo[p[0]]) })]));
    });
    $('tituloVista').textContent = S.q ? 'Búsqueda' : TITULOS[S.pestana];
    $('fechaHoy').textContent = fechaLarga(S.hoy) + (hoyN ? ' · ' + hoyN + (hoyN === 1 ? ' consulta hoy' : ' consultas hoy') : '');

    // filtro de estado solo en el historial
    var fe = $('filtroEstado');
    var mostrarFiltro = S.pestana === 'historial' && !S.q;
    fe.classList.toggle('oculto', !mostrarFiltro);
    if (mostrarFiltro && !fe.options.length) {
      [['', 'Todos los estados'], ['Realizada', 'Realizadas'], ['Ausente', 'Ausentes'], ['Dra. ausente', 'Dra. ausente'], ['Reembolsada', 'Reembolsadas'], ['Expirada', 'Expiradas'], ['Rechazada', 'Rechazadas'], ['Cancelada', 'Canceladas']]
        .forEach(function (o) { fe.appendChild(el('option', { value: o[0], texto: o[1] })); });
    }

    var enExtra = (S.pestana === 'pacientes' || S.pestana === 'avisos' || S.pestana === 'seguimientos') && !S.q;
    $('extra').classList.toggle('oculto', !enExtra);
    if (enExtra) {
      ['lista', 'calendario', 'resumen', 'filtros'].forEach(function (id) { $(id).classList.add('oculto'); });
      fe.classList.add('oculto');
      // Solo al entrar a la pestaña: la recarga automática de cada minuto no debe borrar un aviso a medio escribir
      if (S.vista !== S.pestana) { S.vista = S.pestana; if (S.pestana === 'pacientes') pintarPacientes(); else if (S.pestana === 'seguimientos') pintarSeguimientos(); else pintarAvisos(); }
      return;
    }
    var enCal = S.pestana === 'calendario' && !S.q;
    $('lista').classList.toggle('oculto', enCal); $('calendario').classList.toggle('oculto', !enCal); $('resumen').classList.toggle('oculto', enCal); $('filtros').classList.toggle('oculto', enCal);
    if (enCal) { fe.classList.add('oculto'); pintarCalendario(); return; }
    var lista = $('lista'); vaciar(lista);
    var q = normal(S.q).trim();
    lista.classList.toggle('animar', S.vista !== S.pestana + '|' + q); S.vista = S.pestana + '|' + q;
    var vistas;
    if (q) {
      vistas = S.items.filter(function (r) { return normal([r.nombre, r.rut, r.correo, r.codigo, r.telefono].join(' ')).indexOf(q) >= 0; })
        .sort(function (a, b) { return b.inicio - a.inicio; });
    } else {
      vistas = S.items.filter(function (r) { return pestanaDe(r) === S.pestana && (S.pestana !== 'historial' || !S.estado || r.estado === S.estado); });
      if (S.pestana === 'historial') vistas.sort(function (a, b) { return b.inicio - a.inicio; });
      else if (S.pestana === 'confirmar') vistas.sort(function (a, b) { return a.pagoInformado - b.pagoInformado; });
    }
    if (!vistas.length) {
      lista.appendChild(el('p', { clase: 'vacio' }, [icono(q ? 'buscar' : 'vacio'), el('span', { texto: q ? 'No encontré reservas con "' + S.q + '".' : ({ confirmar: 'No hay transferencias por confirmar. Todo al día.', proximas: 'No hay consultas próximas confirmadas.', retenidas: 'No hay horas retenidas ahora.', historial: 'Todavía no hay historial.' })[S.pestana] })]));
      return;
    }
    if (q) lista.appendChild(el('h2', { clase: 'dia', texto: vistas.length + (vistas.length === 1 ? ' resultado' : ' resultados') }));
    var diaActual = null;
    vistas.forEach(function (r) {
      if (!q && S.pestana === 'proximas' && r.dia !== diaActual) {
        diaActual = r.dia;
        var nDia = vistas.filter(function (x) { return x.dia === r.dia; }).length;
        lista.appendChild(el('h2', { clase: 'dia' + (r.dia === S.hoy ? ' hoy' : '') }, [(r.dia === S.hoy ? 'Hoy · ' : '') + (fechaLarga(r.dia) || r.diaTxt),
          el('span', { clase: 'cuenta-dia', texto: nDia + (nDia === 1 ? ' consulta' : ' consultas') })]));
      }
      lista.appendChild(tarjeta(r));
    });
  }

  // ── Tarjeta de una reserva ──
  function cuentaAtras(r) {
    var ms = r.retencionHasta - ahora(); if (ms <= 0) return 'La retención venció';
    var m = Math.ceil(ms / 60000); return 'Se libera en ' + m + ' min si no transfiere';
  }
  function tarjeta(r) {
    var urgente = r.estado === 'Pago informado';
    var t = ahora();
    // Columna de la hora (con "en 40 min" cuando la consulta es pronto)
    var rel = '';
    if (r.estado === 'Confirmada' && r.inicio > t && r.inicio - t < 86400000) rel = 'en ' + relativo(r.inicio - t);
    else if (r.estado === 'Confirmada' && r.inicio <= t && t - r.inicio < 3600000) rel = 'en curso';
    var hora = el('div', { clase: 'r-hora' }, [el('b', { texto: r.hora || '—' }), el('small', { texto: fechaCorta(r.dia) || r.diaTxt }), rel ? el('span', { clase: 'rel', texto: rel }) : '']);

    var estados = [el('span', { clase: 'estado e-' + slug(r.estado), texto: esVencida(r) ? 'Retención vencida' : r.estado })];
    if (r.reembolsoPendiente) estados.push(el('span', { clase: 'pendiente', texto: 'Reembolso pendiente' }));
    var hijos = [el('div', { clase: 'fila1' }, [
      el('div', { clase: 'r-quien' }, [el('span', { clase: 'r-ini', 'aria-hidden': 'true', texto: iniciales(r.nombre) }),
        el('div', { clase: 'r-id' }, [el('p', { clase: 'nombre', texto: r.nombre }),
          el('p', { clase: 'meta', texto: 'RUT ' + r.rut + ' · Código ' + r.codigo + (r.reagendas ? ' · reagendó ' + r.reagendas + (r.reagendas === 1 ? ' vez' : ' veces') : '') })])]),
      el('div', { clase: 'r-estados' }, estados)])];

    var aviso = '';
    if (r.estado === 'Pago informado') aviso = 'Avisó que transfirió' + (r.pagoInformado ? ' hace ' + relativo(t - r.pagoInformado) : '');
    else if (r.estado === 'Retenida') aviso = cuentaAtras(r);
    if (aviso) hijos.push(el('p', { clase: 'r-aviso' + (r.estado === 'Retenida' && !esVencida(r) ? ' tranquilo' : '') }, [icono('reloj'), aviso]));

    var c = [];
    if (r.telefono) c.push(el('a', { href: r.wsp, target: '_blank', rel: 'noopener noreferrer', clase: 'chip wsp' }, [icono('wsp'), el('span', { texto: 'WhatsApp +' + r.telefono })]));
    if (r.correo) c.push(el('a', { href: 'mailto:' + r.correo, clase: 'chip' }, [icono('correo'), el('span', { texto: r.correo })]));
    if (r.meet && r.estado === 'Confirmada') c.push(el('a', { href: r.meet, target: '_blank', rel: 'noopener noreferrer', clase: 'chip meet' }, [icono('meet'), el('span', { texto: 'Abrir Meet' })]));
    if (r.control) c.push(el('span', { clase: 'chip' }, [icono('control'), el('span', { texto: r.control === 'sin' ? 'Sin control programado' : 'Control: ' + fechaCorta(r.control) })]));
    if (c.length) hijos.push(el('div', { clase: 'contacto' }, c));

    var acc = [];
    if (r.acciones.indexOf('confirmar') >= 0) acc.push(el('button', { type: 'button', clase: 'btn btn-ok', texto: 'Confirmar pago', click: function () {
      pedir('Confirmar el pago de ' + r.nombre, 'Se crea la cita con su enlace de Meet y se le envía el correo de confirmación. Hazlo solo si ya viste la transferencia en tu banco.', 'Sí, confirmar', 'ok', function () { hacer(r, 'confirmar'); }); } }));
    if (r.acciones.indexOf('rechazar') >= 0) acc.push(el('button', { type: 'button', clase: 'btn btn-peligro', texto: 'No encuentro el pago', click: function () {
      pedir('¿No encuentras el pago?', 'Se le avisa a ' + r.nombre + ' por correo y la hora queda libre para otra persona.', 'Sí, avisar y liberar', 'peligro', function () { hacer(r, 'rechazar'); }); } }));
    if (r.acciones.indexOf('ausente') >= 0) acc.push(el('button', { type: 'button', clase: 'btn btn-sec', texto: 'No asistió', click: function () {
      pedir('¿' + r.nombre + ' no asistió?', 'Se le envía un correo explicando que puede reagendar una vez sin pagar, dentro de 5 días.', 'Sí, no asistió', 'peligro', function () { hacer(r, 'ausente'); }); } }));
    if (r.acciones.indexOf('dra_ausente') >= 0) acc.push(el('button', { type: 'button', clase: 'btn btn-sec', texto: 'La Dra. no pudo atender', click: function () {
      pedir('¿La Dra. no pudo atender?', 'Se le avisa a ' + r.nombre + ' y puede elegir reagendar sin costo o pedir el reembolso.', 'Sí, avisar', 'peligro', function () { hacer(r, 'dra_ausente'); }); } }));
    if (r.acciones.indexOf('reactivar') >= 0) {
      var txtReac = r.estado === 'Rechazada' ? 'Sí encontré el pago' : (r.estado === 'Retenida' && !esVencida(r) ? 'Ya vi su pago' : 'Pagó fuera de plazo');
      acc.push(el('button', { type: 'button', clase: 'btn btn-ok', texto: txtReac, click: function () { pedirReactivar(r); } }));
    }
    if (r.acciones.indexOf('cancelar') >= 0) acc.push(el('button', { type: 'button', clase: 'btn btn-sec', texto: 'Cancelar reserva', click: function () { pedirCancelar(r); } }));
    if (r.acciones.indexOf('reembolsada') >= 0) acc.push(el('button', { type: 'button', clase: 'btn btn-ok', texto: 'Marcar reembolsada', click: function () {
      pedir('¿Ya devolviste el dinero?', 'Se le envía a ' + r.nombre + ' un correo avisando que el reembolso fue realizado. El dinero lo devuelves tú desde tu banco: aquí solo se registra y se avisa.', 'Sí, ya lo devolví y avisar', 'ok', function () { hacer(r, 'reembolsada'); }); } }));
    if (S.tarjeta && r.puedeControl) acc.push(el('button', { type: 'button', clase: 'btn btn-sec', texto: r.control ? 'Cambiar próximo control' : 'Próximo control', click: function () { pedirControl(r); } }));
    if (acc.length) hijos.push(el('div', { clase: 'acciones' }, acc));

    if (r.notas) hijos.push(el('div', { clase: 'notatxt', texto: r.notas }));
    var ta = el('textarea', { maxlength: '400', 'aria-label': 'Nota', placeholder: 'Ej.: pidió cambiar de hora, pagó con otra cuenta…' });
    ta.value = r.notas;
    var det = el('details', { clase: 'nota' }, [el('summary', {}, [icono('nota'), r.notas ? 'Editar nota' : 'Agregar nota']), ta,
      el('button', { type: 'button', clase: 'btn btn-sec', texto: 'Guardar nota', click: function () {
        llamar('panelAccion', [S.sesion, r.codigo, 'nota', ta.value], function (res) { if (sesionCaida(res)) return; mostrar(res.mensaje, !res.ok); if (res.ok) { S.abiertas[r.codigo] = false; cargar(); } });
      } })]);
    if (S.abiertas[r.codigo]) det.open = true;
    det.addEventListener('toggle', function () { S.abiertas[r.codigo] = det.open; });
    hijos.push(det);
    return el('article', { clase: 'reserva r-' + slug(r.estado) + (urgente ? ' urgente' : '') }, [hora, el('div', { clase: 'r-cuerpo' }, hijos)]);
  }

  function sesionCaida(res) { if (res && res.error === 'sesion') { irAEntrada(res.mensaje); return true; } return false; }
  function hacer(r, accion, texto) {
    llamar('panelAccion', [S.sesion, r.codigo, accion, texto || ''], function (res) {
      if (sesionCaida(res)) return;
      mostrar(res.mensaje, !res.ok, res.wsp ? { texto: 'Avisar por WhatsApp', href: res.wsp } : null);
      cargar();
    });
  }

  // Cancelar una reserva confirmada: se elige si hay reembolso
  function pedirCancelar(r) {
    var m = $('modal'); vaciar(m);
    function cerrar() { m.classList.add('oculto'); vaciar(m); }
    var si = el('button', { type: 'button', clase: 'btn btn-ok', texto: 'Cancelar y reembolsar', click: function () { cerrar(); hacer(r, 'cancelar', 'reembolso'); } });
    m.appendChild(el('div', { clase: 'cuadro' }, [el('h3', { texto: 'Cancelar la reserva de ' + r.nombre }),
      el('p', { texto: 'La hora queda libre, se borra de tu calendario y se le avisa por correo. Elige si le devuelves el pago: si es así, la reserva quedará con "Reembolso pendiente" hasta que hagas la transferencia y la marques como reembolsada.' }),
      el('div', { clase: 'fila col' }, [si,
        el('button', { type: 'button', clase: 'btn btn-peligro', texto: 'Cancelar sin reembolso', click: function () { cerrar(); hacer(r, 'cancelar', 'sin'); } }),
        el('button', { type: 'button', clase: 'btn btn-sec', texto: 'Volver', click: cerrar })])]));
    m.classList.remove('oculto'); si.focus();
  }

  // Próximo control: el aviso «te toca tu control» sale ese día (si no tiene otra hora y aceptó avisos)
  function pedirControl(r) {
    var m = $('modal'); vaciar(m);
    function cerrar() { m.classList.add('oculto'); vaciar(m); }
    var botones = [['4', '4 semanas'], ['6', '6 semanas'], ['8', '8 semanas'], ['12', '12 semanas'], ['sin', 'Sin control']].map(function (o) {
      return el('button', { type: 'button', clase: 'btn ' + (o[0] === 'sin' ? 'btn-sec' : 'btn-ok'), texto: o[1], click: function () { cerrar(); hacer(r, 'control', o[0]); } });
    });
    m.appendChild(el('div', { clase: 'cuadro' }, [el('h3', { texto: 'Próximo control de ' + r.nombre }),
      el('p', { texto: 'Se cuenta desde el día de su consulta. Ese día le llega el aviso «te toca tu control», solo si no tiene otra hora reservada y aceptó avisos en su tarjeta.' }),
      el('div', { clase: 'ctrl-opc' }, botones),
      el('div', { clase: 'fila col' }, [el('button', { type: 'button', clase: 'btn btn-sec', texto: 'Volver', click: cerrar })])]));
    m.classList.remove('oculto'); botones[0].focus();
  }


  // Pagó fuera de plazo (o se encontró el pago después de rechazarlo): confirmar en su hora o en otra
  function pedirReactivar(r) {
    var m = $('modal'); vaciar(m);
    function cerrar() { m.classList.add('oculto'); vaciar(m); }
    var aviso = el('p', { clase: 'aviso-modal oculto', role: 'alert' });
    var zonaHoras = el('div', { clase: 'elegir oculto' });
    var original = r.inicio && r.inicio > ahora();
    function enviar(slot) {
      aviso.classList.add('oculto');
      m.querySelectorAll('button').forEach(function (b) { b.disabled = true; });
      llamar('panelAccion', [S.sesion, r.codigo, 'reactivar', slot], function (res) {
        if (sesionCaida(res)) { cerrar(); return; }
        m.querySelectorAll('button').forEach(function (b) { b.disabled = false; });
        if (!res.ok) {
          aviso.textContent = res.mensaje; aviso.classList.remove('oculto');
          if (res.error === 'ocupada' && zonaHoras.classList.contains('oculto')) mostrarHoras();
          return;
        }
        cerrar();
        S.agenda = null;
        mostrar(res.mensaje, false, res.wsp ? { texto: 'Avisar por WhatsApp', href: res.wsp } : null);
        cargar();
      }, function () {
        m.querySelectorAll('button').forEach(function (b) { b.disabled = false; });
        aviso.textContent = 'No pude comunicarme con el servidor. Inténtalo de nuevo.'; aviso.classList.remove('oculto');
      });
    }
    function mostrarHoras() {
      zonaHoras.classList.remove('oculto'); vaciar(zonaHoras);
      zonaHoras.appendChild(el('p', { clase: 'dia-elegir', texto: 'Buscando horas libres…' }));
      llamar('panelAgenda', [S.sesion], function (ag) {
        if (sesionCaida(ag)) { cerrar(); return; }
        vaciar(zonaHoras);
        if (!ag.ok) { zonaHoras.appendChild(el('p', { clase: 'dia-elegir', texto: ag.error === 'accion' ? 'Para elegir otra hora hace falta publicar la versión nueva del Apps Script.' : (ag.mensaje || 'No pude cargar las horas.') })); return; }
        var hay = false;
        ag.dias.forEach(function (d) {
          var horas = d.horas.filter(function (h) { return h.estado === 'libre' || h.estado === 'pronto'; });
          if (!horas.length) return;
          hay = true;
          zonaHoras.appendChild(el('p', { clase: 'dia-elegir', texto: d.fecha === ag.hoy ? 'Hoy' : fechaLarga(d.fecha) }));
          var fila = el('div');
          horas.forEach(function (h) {
            fila.appendChild(el('button', { type: 'button', clase: 'hora ' + h.estado, texto: h.hora,
              title: h.estado === 'pronto' ? 'El público ya no puede reservarla (menos de 12 h), pero tú sí puedes darla' : 'Confirmar a esta hora',
              click: function () { enviar(d.fecha + 'T' + h.hora); } }));
          });
          zonaHoras.appendChild(fila);
        });
        if (!hay) zonaHoras.appendChild(el('p', { clase: 'dia-elegir', texto: 'No hay horas libres en las próximas semanas.' }));
      }, function () { vaciar(zonaHoras); zonaHoras.appendChild(el('p', { clase: 'dia-elegir', texto: 'No pude cargar las horas. Revisa tu conexión.' })); });
    }
    var botones = [];
    if (original) botones.push(el('button', { type: 'button', clase: 'btn btn-ok', texto: 'Confirmar el ' + r.diaTxt + ', ' + r.hora + ' h', click: function () { enviar(''); } }));
    botones.push(el('button', { type: 'button', clase: 'btn ' + (original ? 'btn-sec' : 'btn-ok'), texto: original ? 'Elegir otra hora' : 'Elegir la hora', click: mostrarHoras }));
    botones.push(el('button', { type: 'button', clase: 'btn btn-sec', texto: 'Volver', click: cerrar }));
    m.appendChild(el('div', { clase: 'cuadro' }, [
      el('h3', { texto: 'Confirmar la reserva de ' + r.nombre }),
      el('p', { texto: 'Hazlo solo si ya viste la transferencia en tu banco. Se crea la cita con su enlace de Meet y se le envía el correo de confirmación.'
        + (original ? '' : ' Su hora original ya pasó: elige una nueva.') }),
      aviso, zonaHoras, el('div', { clase: 'fila col' }, botones)]));
    m.classList.remove('oculto'); botones[0].focus();
    if (!original) mostrarHoras();
  }

  // ── Calendario de días y horas libres ──
  function cargarAgenda(manual) {
    if (!S.sesion || S.cargandoAgenda) return;
    S.cargandoAgenda = true;
    llamar('panelAgenda', [S.sesion], function (r) {
      S.cargandoAgenda = false;
      if (!r.ok) {
        if (r.error === 'sesion') { irAEntrada(r.mensaje); return; }
        S.agendaError = r.error === 'accion'
          ? 'El calendario necesita la versión nueva del Apps Script de reservas (Panel.gs). Cuando se publique, aparecerá aquí.'
          : 'No pude cargar el calendario: ' + (r.mensaje || 'el servidor respondió con un error') + ' Prueba con "Actualizar".';
        pintar(); return;
      }
      S.agendaError = ''; S.agenda = r; pintar();
    }, function () { S.cargandoAgenda = false; mostrar('No pude cargar el calendario. Revisa tu conexión.', true); });
  }
  // ── Tarjeta de paciente: pacientes ──
  function avisoExtra(x, r, textoApagada) {
    vaciar(x);
    if (!r.ok) { x.appendChild(el('p', { clase: 'vacio' }, [el('span', { texto: r.mensaje || 'No pude cargar esta sección.' })])); return true; }
    if (!r.activa) { x.appendChild(el('p', { clase: 'extra-aviso', texto: textoApagada })); return true; }
    return false;
  }
  var APAGADA = 'La tarjeta de paciente todavía no está activa: falta la propiedad TARJETA_SECRETO en Apps Script.';
  function pintarPacientes() {
    var x = $('extra'); vaciar(x); esqueletos(x, 2);
    llamar('panelPacientes', [S.sesion], function (r) {
      if (S.pestana !== 'pacientes') return;   // cambió de pestaña mientras cargaba
      if (sesionCaida(r) || avisoExtra(x, r, APAGADA)) return;
      if (!r.pacientes.length) { x.appendChild(el('p', { clase: 'vacio' }, [icono('vacio'), el('span', { texto: 'Aún no hay pacientes con tarjeta. Se crea sola al confirmar su primera reserva.' })])); return; }
      x.appendChild(el('h2', { clase: 'dia', texto: r.pacientes.length + (r.pacientes.length === 1 ? ' paciente con tarjeta' : ' pacientes con tarjeta') }));
      r.pacientes.forEach(function (p) {
        var chips = [
          el('span', { clase: 'chip', texto: p.controles + (p.controles === 1 ? ' control' : ' controles') }),
          el('span', { clase: 'chip', texto: p.control === 'sin' ? 'Sin control' : (p.control ? 'Control: ' + fechaCorta(p.control) + (p.controlAvisado ? ' (avisado)' : '') : 'Control sin definir') }),
          el('span', { clase: 'chip', texto: p.avisos ? 'Acepta avisos' : 'Sin avisos' })
        ];
        if (p.wallet === 'habilitada') chips.push(el('span', { clase: 'chip', texto: 'Wallet habilitada' }));
        x.appendChild(el('article', { clase: 'pac' }, [
          el('p', { clase: 'pac-nombre', texto: p.nombre }),
          el('div', { clase: 'pac-acc' }, [
            el('button', { type: 'button', clase: 'btn btn-sec', texto: 'Enviar enlace', click: function () {
              pedir('Enviar un enlace nuevo a ' + p.nombre, 'Le llega por correo un enlace nuevo a su tarjeta. Los que ya tenga siguen funcionando.', 'Sí, enviar', 'ok', function () { accionPaciente(p, 'enviar_enlace'); }); } }),
            el('button', { type: 'button', clase: 'btn btn-peligro', texto: 'Cambiar enlace', click: function () {
              pedir('Cambiar el enlace de ' + p.nombre, 'Úsalo si perdió su teléfono: todos sus enlaces anteriores dejan de funcionar y le llega uno nuevo por correo.', 'Sí, cambiar', 'peligro', function () { accionPaciente(p, 'cambiar_enlace'); }); } })
          ]),
          el('p', { clase: 'pac-meta', texto: p.correo }),
          el('div', { clase: 'contacto' }, chips)
        ]));
      });
    });
  }
  function accionPaciente(p, accion) {
    llamar('panelPacienteAccion', [S.sesion, p.id, accion], function (res) { if (sesionCaida(res)) return; mostrar(res.mensaje, !res.ok); if (res.ok) pintarPacientes(); });
  }

  // ── Seguimientos que envían los pacientes (solo lectura) ──
  var INTENSIDAD = ['Sin síntomas', 'Leve', 'Moderado', 'Importante'];
  function pintarSeguimientos() {
    var x = $('extra'); vaciar(x); esqueletos(x, 2);
    llamar('panelSeguimientos', [S.sesion], function (r) {
      if (S.pestana !== 'seguimientos') return;
      if (sesionCaida(r) || avisoExtra(x, r, 'El seguimiento todavía no está activo: ejecuta seguimientoPreparar() en Apps Script.')) return;
      x.appendChild(el('p', { clase: 'extra-aviso', texto: 'Aquí solo aparece lo que cada paciente decidió enviarte. Lo que anota sin enviar no lo ves.' }));
      if (!r.envios.length) { x.appendChild(el('p', { clase: 'vacio seg-vacio' }, [icono('vacio'), el('span', { texto: 'Aún no hay envíos.' })])); return; }
      // r.dias: cuántos días tiene cada alimento (el último es el de descanso)
      r.envios.forEach(function (e) { x.appendChild(articuloSeguimiento(e, r.dias || 4)); });
    });
  }
  function articuloSeguimiento(e, dias) {
    var porAlimento = {}, orden = [];
    e.diario.forEach(function (d) { if (!porAlimento[d.alimento]) { porAlimento[d.alimento] = []; orden.push(d.alimento); } porAlimento[d.alimento].push(d); });
    var cuerpo = [];
    // Una copia dañada o incompleta se avisa, en vez de mostrarse vacía
    if (e.ilegible) cuerpo.push(el('p', { clase: 'seg-nota', texto: 'No se pudo leer este envío. Pídele al paciente que lo envíe de nuevo.' }));
    orden.forEach(function (alimento) {
      cuerpo.push(el('h3', { clase: 'seg-alimento', texto: alimento }));
      porAlimento[alimento].sort(function (a, b) { return a.dia - b.dia; }).forEach(function (d) {
        var sint = Object.keys(d.sintomas || {}).filter(function (k) { return d.sintomas[k] > 0; })
          .map(function (k) { return k + ': ' + INTENSIDAD[d.sintomas[k]]; }).join(' · ');
        var linea = (d.dia === dias ? 'Día de descanso' : 'Día ' + d.dia) + (d.cantidad ? ' · ' + d.cantidad : '') + ' · ' + (sint || 'sin síntomas');
        cuerpo.push(el('p', { clase: 'seg-dia', texto: linea }));
        if (d.nota) cuerpo.push(el('p', { clase: 'seg-nota', texto: 'Nota: ' + d.nota }));
      });
    });
    var art = el('article', { clase: 'pac seg-envio' }, [
      el('p', { clase: 'pac-nombre', texto: e.nombre }),
      el('button', { type: 'button', clase: 'btn btn-sec', texto: 'Descargar PDF', click: function () {
        var cadena = [], n = art.parentNode;
        while (n && n !== document.body) { cadena.push(n); n.classList.add('cadena-imp'); n = n.parentNode; }
        art.classList.add('imprimir'); document.body.classList.add('imprimiendo-seg');
        var limpiar = function () {
          art.classList.remove('imprimir'); document.body.classList.remove('imprimiendo-seg');
          cadena.forEach(function (x) { x.classList.remove('cadena-imp'); });
          ['afterprint', 'focus', 'pointerdown'].forEach(function (ev) { window.removeEventListener(ev, limpiar); });
        };
        window.addEventListener('afterprint', limpiar);
        // respaldo: si afterprint no llega, se limpia al volver el foco o al tocar la página
        setTimeout(function () { window.addEventListener('focus', limpiar); window.addEventListener('pointerdown', limpiar); }, 1500);
        window.print();
      } }),
      el('p', { clase: 'pac-meta', texto: e.correo + ' · Enviado el ' + fechaHora(e.fecha) }),
      el('p', { clase: 'pac-meta', texto: 'Autorizó el envío: «' + e.consentimiento + '»' }),
      el('div', { clase: 'seg-detalle' }, cuerpo)
    ]);
    return art;
  }

  // ── Tarjeta de paciente: avisos ──
  function fechaHora(ms) { var d = new Date(ms); return d.getDate() + ' ' + MESES[d.getMonth()].slice(0, 3) + ' ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
  function pintarAvisos() {
    var x = $('extra'); vaciar(x); esqueletos(x, 2);
    llamar('panelAvisos', [S.sesion], function (r) {
      if (S.pestana !== 'avisos') return;   // cambió de pestaña mientras cargaba
      if (sesionCaida(r) || avisoExtra(x, r, APAGADA)) return;
      var titulo = el('input', { id: 'avTitulo', maxlength: '40', placeholder: 'Ej.: Nueva guía de desayunos' });
      var texto = el('textarea', { id: 'avTexto', maxlength: '120', rows: '3', placeholder: 'Ej.: Ya está en tu tarjeta: ideas de desayunos antiinflamatorios.' });
      var enlace = el('input', { id: 'avEnlace', maxlength: '300', placeholder: 'https://kairal.cl/tarjeta.html (opcional)' });
      var pt = el('b', { texto: 'Título del aviso' }), px = el('span', { texto: 'Texto del aviso' });
      function previa() { pt.textContent = titulo.value || 'Título del aviso'; px.textContent = texto.value || 'Texto del aviso'; }
      titulo.addEventListener('input', previa); texto.addEventListener('input', previa);
      var n = r.destinatarias;
      var enviar = el('button', { type: 'button', id: 'avEnviar', clase: 'btn btn-ok', texto: 'Enviar a ' + n + (n === 1 ? ' paciente' : ' pacientes'), click: function () {
        pedir('¿Enviar este aviso?', 'Les llega a las ' + n + ' pacientes que aceptaron avisos, por Google Wallet y por aviso web. Solo puedes enviar uno cada 24 horas.', 'Sí, enviar', 'ok', function () {
          llamar('panelAvisoEnviar', [S.sesion, titulo.value, texto.value, enlace.value], function (res) { if (sesionCaida(res)) return; mostrar(res.mensaje, !res.ok); if (res.ok) pintarAvisos(); });
        });
      } });
      enviar.disabled = !r.puedeEnviar || !n;
      var nota = !n ? 'Todavía ninguna paciente aceptó recibir avisos.'
        : (!r.puedeEnviar ? 'Podrás enviar el siguiente aviso el ' + fechaHora(r.proximoEnvio) + ' (Google limita las notificaciones).' : 'Solo pacientes que aceptaron avisos. Un aviso cada 24 horas.');
      x.appendChild(el('div', { clase: 'av-form' }, [
        el('label', { 'for': 'avTitulo', texto: 'Título (máx. 40)' }), titulo,
        el('label', { 'for': 'avTexto', texto: 'Texto (máx. 120)' }), texto,
        el('label', { 'for': 'avEnlace', texto: 'Enlace (opcional, de kairal.cl)' }), enlace,
        el('p', { clase: 'meta', texto: 'Así se verá en el teléfono:' }), el('div', { clase: 'av-prev' }, [pt, px]),
        el('p', { clase: 'meta', texto: nota }), enviar]));
      x.appendChild(el('h2', { clase: 'dia', texto: 'Enviados' }));
      if (!r.historial.length) x.appendChild(el('p', { clase: 'vacio' }, [el('span', { texto: 'Todavía no has enviado avisos.' })]));
      r.historial.forEach(function (a) {
        x.appendChild(el('div', { clase: 'av-hist' }, [el('b', { texto: a.titulo }), el('p', { clase: 'meta', texto: a.texto }),
          el('p', { clase: 'meta', texto: fechaHora(a.fecha) + ' · ' + a.destinatarias + ' pacientes · ' + a.push + ' web · ' + a.wallet + ' Wallet' + (a.usuario ? ' · ' + a.usuario : '') })]));
      });
    });
  }


  function pintarCalendario() {
    var cont = $('calendario'); vaciar(cont);
    if (!S.agenda && S.agendaError) { cont.appendChild(el('p', { clase: 'vacio' }, [el('span', { texto: S.agendaError })])); return; }
    if (!S.agenda) { esqueletos(cont, 3); cargarAgenda(); return; }
    var dias = S.agenda.dias, libres = 0, diasLibres = 0, reservadas = 0, proxima = null;
    dias.forEach(function (d) {
      var lib = d.horas.filter(function (h) { return h.estado === 'libre'; });
      libres += lib.length; if (lib.length) { diasLibres++; if (!proxima) proxima = { fecha: d.fecha, hora: lib[0].hora }; }
      reservadas += d.horas.filter(function (h) { return h.estado === 'reservada'; }).length;
    });
    function dato(n, txt) { return el('div', { clase: 'cal-stat' }, [el('b', { texto: String(n) }), el('span', { texto: txt })]); }
    cont.appendChild(el('div', { clase: 'cal-res' }, [
      dato(libres, libres === 1 ? 'hora libre' : 'horas libres'), dato(diasLibres, diasLibres === 1 ? 'día con horas' : 'días con horas'),
      dato(reservadas, reservadas === 1 ? 'hora reservada' : 'horas reservadas'),
      el('div', { clase: 'cal-stat cal-prox' }, [el('span', { texto: 'Próxima hora libre' }), el('b', { texto: proxima ? fechaCorta(proxima.fecha) + ' · ' + proxima.hora : 'Sin horas libres' })])]));
    cont.appendChild(el('p', { clase: 'cal-nota', texto: 'Es lo mismo que ve el público al reservar: horarios, bloqueos, feriados, reservas y tu agenda de Google.' }));

    var chk = el('input', { type: 'checkbox', id: 'verSin' }); chk.checked = !!S.verSinAtencion;
    chk.addEventListener('change', function () { S.verSinAtencion = chk.checked; pintarCalendario(); });
    cont.appendChild(el('div', { clase: 'cal-barra' }, [
      el('div', { clase: 'cal-leyenda' }, [el('span', {}, [el('i', { clase: 'lg-libre' }), 'Libre']), el('span', {}, [el('i', { clase: 'lg-reservada' }), 'Reservada (toca para verla)']),
        el('span', {}, [el('i', { clase: 'lg-pronto' }), 'Libre solo para ti (menos de 12 h)']),
        el('span', {}, [el('i', { clase: 'lg-ocupada' }), 'Ocupada en tu agenda o ya pasó'])]),
      el('label', { clase: 'cal-opc', for: 'verSin' }, [chk, 'Mostrar días sin atención'])]));

    var grid = el('div', { clase: 'cal-grid' + (S.vista !== 'cal' ? ' animar' : '') }); S.vista = 'cal';
    dias.forEach(function (d) {
      if (d.estado === 'sin_horario' && !S.verSinAtencion) return;
      var f = fechaDe(d.fecha), n = d.horas.filter(function (h) { return h.estado === 'libre'; }).length;
      var resumen = d.estado === 'bloqueado' ? 'Bloqueado' : d.estado === 'sin_horario' ? 'Sin atención' : (n ? n + ' de ' + d.horas.length + ' libres' : 'Completo');
      var info = [el('div', { clase: 'cal-cab' }, [el('b', { texto: d.fecha === S.agenda.hoy ? 'Hoy' : fechaLarga(d.fecha) }),
        el('small', { clase: d.estado === 'completo' ? 'lleno' : (n ? 'libres' : ''), texto: resumen })])];
      if (d.estado === 'bloqueado' && d.motivo) info.push(el('p', { clase: 'cal-motivo', texto: d.motivo }));
      if (d.horas.length) {
        var medidor = el('div', { clase: 'cal-medidor', 'aria-hidden': 'true' }, [el('i', { style: 'width:' + Math.round(n / d.horas.length * 100) + '%' })]);
        info.push(medidor, el('div', { clase: 'cal-horas' }, d.horas.map(function (h) {
          var txt = h.hora + (h.estado === 'reservada' ? ' · ' + h.nombre.split(' ')[0] : '');
          var o = { type: 'button', clase: 'hora ' + h.estado, texto: txt, title: ({ libre: 'Libre', reservada: 'Ver la reserva', agenda: 'Ocupada en tu agenda', pasada: 'Ya pasó', pronto: 'Libre, pero el público ya no puede reservarla (menos de 12 h)' })[h.estado] };
          if (h.estado === 'reservada') o.click = function () { S.q = h.codigo; $('buscar').value = h.codigo; pintar(); window.scrollTo(0, 0); };
          else o.disabled = true;
          return el('button', o);
        })));
      }
      grid.appendChild(el('div', { clase: 'cal-dia' + (d.fecha === S.agenda.hoy ? ' hoy' : '') + (d.estado === 'bloqueado' || d.estado === 'sin_horario' ? ' apagado' : '') }, [
        el('div', { clase: 'cal-fecha' }, [el('small', { texto: f ? DIAS[f.getDay()].slice(0, 3) : '' }), el('b', { texto: f ? String(f.getDate()) : '' }), el('small', { texto: f ? MESES[f.getMonth()].slice(0, 3) : '' })]),
        el('div', { clase: 'cal-info' }, info)]));
    });
    cont.appendChild(grid);
  }

  // ── Mensajes y confirmaciones ──
  var tAviso = 0;
  function mostrar(texto, malo, boton) {
    var a = $('aviso'); vaciar(a); clearTimeout(tAviso);
    var caja = el('div', { clase: 'caja' + (malo ? ' mal' : ''), role: 'status' }, [el('span', { texto: texto })]);
    if (boton) caja.appendChild(el('a', { href: boton.href, target: '_blank', rel: 'noopener noreferrer', clase: 'btn btn-wsp', texto: boton.texto }));
    caja.appendChild(el('button', { type: 'button', clase: 'x', 'aria-label': 'Cerrar', texto: '×', click: function () { a.classList.add('oculto'); } }));
    a.appendChild(caja); a.classList.remove('oculto');
    tAviso = setTimeout(function () { a.classList.add('oculto'); }, boton ? 20000 : 6000);
  }
  function pedir(titulo, texto, textoOk, tipo, siOk) {
    var m = $('modal'); vaciar(m);
    function cerrar() { m.classList.add('oculto'); vaciar(m); }
    var ok = el('button', { type: 'button', clase: 'btn ' + (tipo === 'peligro' ? 'btn-peligro' : 'btn-ok'), texto: textoOk, click: function () { cerrar(); siOk(); } });
    m.appendChild(el('div', { clase: 'cuadro' }, [el('h3', { texto: titulo }), el('p', { texto: texto }),
      el('div', { clase: 'fila' }, [el('button', { type: 'button', clase: 'btn btn-sec', texto: 'Cancelar', click: cerrar }), ok])]));
    m.classList.remove('oculto'); ok.focus();
  }
  $('modal').addEventListener('click', function (e) { if (e.target === this) { this.classList.add('oculto'); vaciar(this); } });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('modal').classList.contains('oculto')) { $('modal').classList.add('oculto'); vaciar($('modal')); } });

  $('buscar').addEventListener('input', function () { S.q = this.value; pintar(); });
  $('filtroEstado').addEventListener('change', function () { S.estado = this.value; pintar(); });

  // ── Arranque: si hay una sesión viva en esta pestaña, se retoma ──
  var previa = leerSesion();
  if (previa) { S.sesion = previa; abrirPanel(); } else { iniciarEntrada(); }
})();
