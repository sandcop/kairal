// ── CONFIG ──────────────────────────────────────────────
// REEMPLAZA con la URL de tu Apps Script desplegado
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwSw7Kyakm0BpKsz81xQBMgXYkcT7z-YzTravdBh2dxFi4kpxdDTmWHY55MhjKJpoXn/exec';

// ── ARCHIVOS ─────────────────────────────────────────────
const fileStore = { lab: [], img: [], otros: [] };

function fileSelected(input, listId) {
  const key = listId.replace('list-','');
  Array.from(input.files).forEach(f => addFile(f, key, listId));
  input.value = '';
}
function dropFiles(e, zoneId, listId) {
  e.preventDefault();
  dragLeave(zoneId);
  const key = listId.replace('list-','');
  Array.from(e.dataTransfer.files).forEach(f => addFile(f, key, listId));
}
function addFile(f, key, listId) {
  if (f.size > 10 * 1024 * 1024) { toast('"' + f.name + '" supera los 10 MB', 'err'); return; }
  const allowed = ['application/pdf','image/jpeg','image/png','image/jpg'];
  if (!allowed.includes(f.type)) { toast('Formato no permitido: ' + f.name + ' (solo PDF, JPG o PNG)', 'err'); return; }
  fileStore[key].push(f);
  renderFileList(key, listId);
}
function removeFile(key, idx, listId) {
  fileStore[key].splice(idx, 1);
  renderFileList(key, listId);
}
function renderFileList(key, listId) {
  const list = document.getElementById(listId);
  list.innerHTML = fileStore[key].map((f, i) =>
    `<div class="file-item">
      <span class="file-ico">${f.type === 'application/pdf' ? 'PDF' : 'IMG'}</span>
      <span class="fname">${escHtml(f.name)}</span>
      <span class="fsize">${(f.size/1024/1024).toFixed(1)} MB</span>
      <button type="button" class="frem" aria-label="Quitar archivo" data-on-click="removeFile('${key}',${i},'${listId}')">×</button>
    </div>`
  ).join('');
}
function dragOver(e, id) { e.preventDefault(); document.getElementById(id).classList.add('dragover'); }
function dragLeave(id) { document.getElementById(id).classList.remove('dragover'); }

async function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result.split(',')[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

// ── RADIO / CHECKBOX ─────────────────────────────────────
function radioSel(input) {
  const name = input.name;
  document.querySelectorAll(`input[name="${name}"]`).forEach(i => {
    i.closest('.radio-item')?.classList.remove('selected');
  });
  input.closest('.radio-item')?.classList.add('selected');
}
function checkSel(input) {
  input.closest('.check-item, .sys-item')?.classList.toggle('selected', input.checked);
}

// ── RANGE ────────────────────────────────────────────────
function updateRange(input, valId) {
  document.getElementById(valId).textContent = input.value + ' / 10';
}

// ── UTILIDADES ───────────────────────────────────────────
function escHtml(str) {
  return String(str == null ? '' : str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function irArriba() {
  const ref = document.getElementById('cp-inicio');
  const y = ref ? ref.getBoundingClientRect().top + window.scrollY - 96 : 0;
  window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
}

// ── NAVIGATION ───────────────────────────────────────────
let currentSection = 0;
const TOTAL = 7;

function goTo(n) {
  if (n < 0 || n >= TOTAL) return;
  if (n > currentSection && !validateSection(currentSection)) return;

  document.getElementById('sec-' + currentSection).classList.remove('active');
  currentSection = n;
  document.getElementById('sec-' + n).classList.add('active');
  updateProgress();
  if (n === 6) buildSummary();
  irArriba();
}

function updateProgress() {
  const steps = document.querySelectorAll('.p-step');
  steps.forEach((s, i) => {
    s.classList.remove('active','done');
    if (i === currentSection) s.classList.add('active');
    else if (i < currentSection) s.classList.add('done');
  });
  const fill = document.getElementById('cp-linea-fill');
  if (fill) fill.style.width = Math.round(((currentSection + 1) / TOTAL) * 100) + '%';
  const act = steps[currentSection];
  if (act && act.scrollIntoView) act.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
}

function validateSection(n) {
  const required = {
    0: [['nombre','Nombre completo'],['rut','RUT'],['edad','Edad'],['email','Correo electrónico'],['telefono','Teléfono'],['saludActual','Descripción de salud actual']],
    4: [['objetivos','Objetivos de consulta']]
  };
  if (!required[n]) return true;
  for (const [id, label] of required[n]) {
    const el = document.getElementById(id);
    if (el && !el.value.trim()) {
      toast('El campo "' + label + '" es obligatorio', 'err');
      el.focus();
      return false;
    }
  }
  if (n === 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(getVal('email'))) {
    toast('Revisa tu correo: parece incompleto', 'err');
    document.getElementById('email').focus();
    return false;
  }
  return true;
}

// ── RESUMEN ───────────────────────────────────────────────
function getVal(id) { const el = document.getElementById(id); return el ? el.value.trim() : ''; }
function getRadio(name) {
  const el = document.querySelector(`input[name="${name}"]:checked`);
  return el ? el.value : '';
}
function getChecked(containerSel) {
  return Array.from(document.querySelectorAll(containerSel + ' input:checked')).map(i => i.value).join(', ') || '—';
}

function buildSummary() {
  const totalFiles = fileStore.lab.length + fileStore.img.length + fileStore.otros.length;
  const sintomas = [
    ...Array.from(document.querySelectorAll('#sg-digest input:checked')),
    ...Array.from(document.querySelectorAll('#sg-nervioso input:checked')),
    ...Array.from(document.querySelectorAll('#sg-hormonal input:checked')),
    ...Array.from(document.querySelectorAll('#sg-inmuno input:checked')),
    ...Array.from(document.querySelectorAll('#sg-musculo input:checked'))
  ].map(i => i.value).join(', ') || '—';

    function escHtmlVal(str) {
      return String(str == null ? '' : str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

  const blocks = [
    {
      title: 'Datos personales',
      items: [
        ['Nombre', getVal('nombre')], ['RUT', getVal('rut')],
        ['Edad', getVal('edad')], ['Correo', getVal('email')],
        ['Teléfono', getVal('telefono')], ['Ciudad', getVal('ciudad')],
        ['Sexo', getRadio('sexo')], ['Estado civil', getVal('estadoCivil')],
      ]
    },
    {
      title: 'Antecedentes',
      items: [
        ['Diagnósticos', getVal('diagnosticos') || '—'],
        ['Medicamentos', getVal('medicamentos') || '—'],
        ['Suplementos', getVal('suplementos') || '—'],
        ['Cirugías', getVal('cirugias') || '—'],
        ['Antec. familiares', getVal('antFamiliares') || '—'],
      ]
    },
    {
      title: 'Hábitos',
      items: [
        ['Patrón alimentario', getRadio('patron') || '—'],
        ['Ultraprocesados', getRadio('ultraprocesados') || '—'],
        ['Comidas/día', getVal('comidas') || '—'],
        ['Agua/día', getVal('agua') || '—'],
        ['Horas de sueño', getVal('hSueno') || '—'],
        ['Descansado/a', getRadio('descansado') || '—'],
        ['Nivel de estrés', document.getElementById('estres').value + '/10'],
        ['Actividad física', getVal('actFisica') || '—'],
      ]
    },
    {
      title: 'Síntomas',
      items: [['Síntomas marcados', sintomas]]
    },
    {
      title: 'Objetivos',
      items: [
        ['Objetivos', getVal('objetivos')],
        ['Dispuesto/a a cambios', getRadio('cambios') || '—'],
      ]
    },
    {
      title: 'Archivos',
      items: [
        ['Laboratorio', fileStore.lab.length ? fileStore.lab.map(f=>f.name).join(', ') : 'No adjuntado'],
        ['Imágenes', fileStore.img.length ? fileStore.img.map(f=>f.name).join(', ') : 'No adjuntado'],
        ['Otros docs', fileStore.otros.length ? fileStore.otros.map(f=>f.name).join(', ') : 'No adjuntado'],
      ]
    }
  ];

  document.getElementById('summary-container').innerHTML = blocks.map(b => `
    <div class="summary-block">
      <h4>${b.title}</h4>
      <div class="summary-grid">
        ${b.items.map(([l,v]) => `
          <div class="s-item">
            <div class="s-label">${l}</div>
            <div class="s-val">${escHtmlVal(v) || '—'}</div>
          </div>`).join('')}
      </div>
    </div>`).join('');
}

// ── ENVÍO ──────────────────────────────────────────────────
async function enviarFormulario() {
  if (!document.getElementById('consent').checked) {
    toast('Marca la casilla de autorización para poder enviar tu preconsulta', 'err');
    return;
  }
  const btn = document.getElementById('btn-enviar');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Enviando...';

  try {
    // Convertir archivos a base64
    async function processFiles(arr) {
      const result = [];
      for (const f of arr) {
        const data = await fileToBase64(f);
        result.push({ name: f.name, type: f.type, data });
      }
      return result;
    }

    const [labFiles, imgFiles, otrosFiles] = await Promise.all([
      processFiles(fileStore.lab),
      processFiles(fileStore.img),
      processFiles(fileStore.otros)
    ]);

    // Síntomas
    const sintomas = [
      ...Array.from(document.querySelectorAll('#sg-digest input:checked')),
      ...Array.from(document.querySelectorAll('#sg-nervioso input:checked')),
      ...Array.from(document.querySelectorAll('#sg-hormonal input:checked')),
      ...Array.from(document.querySelectorAll('#sg-inmuno input:checked')),
      ...Array.from(document.querySelectorAll('#sg-musculo input:checked'))
    ].map(i => i.value).join(', ');

    const payload = {
      nombre:          getVal('nombre'),
      rut:             getVal('rut'),
      edad:            getVal('edad'),
      fechaNac:        getVal('fechaNac'),
      email:           getVal('email'),
      telefono:        getVal('telefono'),
      ciudad:          getVal('ciudad'),
      ocupacion:       getVal('ocupacion'),
      sexo:            getRadio('sexo'),
      estadoCivil:     getVal('estadoCivil'),
      hijos:           getVal('hijos'),
      saludActual:     getVal('saludActual'),
      diagnosticos:    getVal('diagnosticos'),
      medicamentos:    getVal('medicamentos'),
      suplementos:     getVal('suplementos'),
      cirugias:        getVal('cirugias'),
      antFamiliares:   getVal('antFamiliares'),
      alergias:        getVal('alergias'),
      intolerancias:   getVal('intolerancias'),
      patronAlim:      getRadio('patron'),
      ultraprocesados: getRadio('ultraprocesados'),
      comidas:         getVal('comidas'),
      agua:            getVal('agua'),
      hSueno:          getVal('hSueno'),
      descansado:      getRadio('descansado'),
      problemasSueno:  getVal('problemasSueno'),
      estres:          document.getElementById('estres').value,
      tecnicasRelax:   getVal('tecnicasRelax'),
      eventosEmoc:     getVal('eventosEmocionales'),
      descanso:        getRadio('descanso'),
      actFisica:       getVal('actFisica'),
      sintomas:        sintomas,
      otrosSintomas:   getVal('otrosSintomas'),
      objetivos:       getVal('objetivos'),
      mejorar:         getVal('mejorar'),
      cambios:         getRadio('cambios'),
      notaExtra:       getVal('notaExtra'),
      consentimientoClinico: true,
      versionConsentimiento: '2026-10-25',
      fechaConsentimiento:   new Date().toISOString(),
      archivos: {
        laboratorio: labFiles,
        imagenes:    imgFiles,
        otros:       otrosFiles
      }
    };

    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    const json = await res.json();

    if (json.ok) {
      document.getElementById('cp-form').style.display = 'none';
      document.getElementById('cp-progreso').style.display = 'none';
      document.getElementById('success-screen').style.display = 'block';
      irArriba();
    } else {
      throw new Error(json.error || 'Error desconocido');
    }
  } catch (err) {
    console.error(err);
    toast('No pudimos enviar tu preconsulta. Inténtalo de nuevo o escríbenos por WhatsApp.', 'err');
    btn.disabled = false;
    btn.innerHTML = 'Enviar mi preconsulta';
  }
}

// ── TOAST ─────────────────────────────────────────────────
function toast(msg, type = 'ok') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'show ' + type;
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), 4000);
}

// ── Acciones de la página ───────────────────────────────────────────────────────────────
// Antes cada botón y campo traía onclick="…" / onchange="…" escrito en el HTML. La política de seguridad del
// sitio no permite código en los atributos, así que ahora llevan data-on-click="goTo(1)" (etc.) y este bloque
// las ejecuta. Solo acepta llamadas a las funciones de esta lista, con argumentos simples
// (this, event, números o textos entre comillas): no interpreta código.
function clickEn(id) {
  const el = document.getElementById(id);
  if (el) el.click();
}

(function () {
  const ACCIONES = {
    checkSel: checkSel, radioSel: radioSel, goTo: goTo, dropFiles: dropFiles, dragOver: dragOver,
    dragLeave: dragLeave, fileSelected: fileSelected, updateRange: updateRange, removeFile: removeFile,
    enviarFormulario: enviarFormulario, clickEn: clickEn
  };
  const LLAMADA = /^\s*([A-Za-z_]\w*)\s*\(([^]*)\)\s*;?\s*$/;
  const ARGUMENTO = /\s*(this|event|-?\d+(?:\.\d+)?|'([^']*)'|"([^"]*)")\s*(,|$)/y;

  function argumentos(texto, el, ev) {
    const lista = [];
    ARGUMENTO.lastIndex = 0;
    while (ARGUMENTO.lastIndex < texto.length) {
      const m = ARGUMENTO.exec(texto);
      if (!m) return null;
      const t = m[1];
      lista.push(t === 'this' ? el : t === 'event' ? ev
        : m[2] !== undefined ? m[2] : m[3] !== undefined ? m[3] : Number(t));
      if (m[4] === '') break;
    }
    return lista;
  }

  function ejecutar(texto, el, ev) {
    const m = LLAMADA.exec(texto);
    const fn = m && Object.prototype.hasOwnProperty.call(ACCIONES, m[1]) ? ACCIONES[m[1]] : null;
    const args = m && fn ? argumentos(m[2].trim(), el, ev) : null;
    if (!fn || !args) { console.warn('Acción no reconocida:', texto); return; }
    fn.apply(el, args);
  }

  ['click', 'change', 'input', 'drop', 'dragover', 'dragleave'].forEach(function (tipo) {
    document.addEventListener(tipo, function (ev) {
      // igual que un onclick escrito en el HTML: corre en el elemento y en cada ancestro que tenga la acción
      for (let el = ev.target; el && el.nodeType === 1; el = el.parentElement) {
        const texto = el.getAttribute('data-on-' + tipo);
        if (texto) ejecutar(texto, el, ev);
      }
    });
  });
})();
