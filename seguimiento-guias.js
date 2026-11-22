/* Guías de «Mi seguimiento». Texto propio de Kairal. Lo revisa y ajusta la Dra. antes de publicar.
   Tipos de bloque: 'p' (párrafo), 'lista' (items), 'aviso' (recuadro destacado).
   Se escribe siempre «liberadores de histamina» y «con aminas»; sin siglas. */
window.SEGUIMIENTO_GUIAS = [
  {
    id: 'fase-1',
    titulo: 'Fase 1 · Probar alimentos liberadores de histamina y con aminas',
    bloques: [
      { tipo: 'p', texto: 'Antes de empezar, la Dra. te indicó retirar por un tiempo algunos alimentos para bajar la carga sobre tu sistema digestivo e inmunológico. Ahora, cuando la Dra. te lo indique, vas a volver a probarlos de a uno, para conocer cuáles tolera tu cuerpo y en qué cantidad.' },
      { tipo: 'p', texto: 'La idea no es evitar estos alimentos para siempre, sino identificar cuáles sí puedes comer.' },
      { tipo: 'lista', items: [
        'Elige un solo alimento para probar.',
        'Pruébalo durante 3 días seguidos, aumentando un poco la cantidad cada día.',
        'Cada día anota la cantidad y cómo te sientes, de 0 a 3, en la pestaña «Mi diario».',
        'Después, descansa un día completo sin ese alimento antes de pasar al siguiente.',
        'Cuando termines con un alimento, sigue con el siguiente de la lista.'
      ] },
      { tipo: 'p', texto: 'Mientras pruebas, mantén el resto de tu alimentación como te indicó la Dra.' },
      { tipo: 'aviso', texto: 'Si aparecen síntomas importantes (3): suspende el alimento, espera a que tu cuerpo se recupere, anota lo que sentiste y continúa más adelante con otro alimento. Si te sientes muy mal o es una urgencia, busca atención médica de inmediato.' }
    ]
  },
  {
    id: 'fase-2',
    titulo: 'Fase 2 · Ampliar la alimentación',
    bloques: [
      { tipo: 'p', texto: 'Cuando ya sabes qué alimentos toleras, el siguiente paso es incorporarlos de forma gradual en tu alimentación habitual, sin apurarte, para ampliar lo que puedes comer sin que vuelvan los síntomas.' },
      { tipo: 'lista', items: [
        'Avanza despacio: cambia una cosa a la vez para entender cómo responde tu cuerpo.',
        'Observa tus síntomas y sigue anotándolos en tu diario.',
        'Si un alimento que antes toleraste te cae mal, retíralo por un tiempo y vuelve a intentarlo más adelante.'
      ] },
      { tipo: 'p', texto: 'La Dra. te indicará el ritmo y cuántos alimentos puedes sumar en cada etapa, según cómo evoluciones.' },
      { tipo: 'p', texto: 'Esta fase es un puente hacia una alimentación más amplia y variada, respetando tu tolerancia y el ritmo de tu cuerpo.' },
      { tipo: 'p', texto: 'Al ampliar tu alimentación, también puedes volver a probar otros alimentos que antes te daban molestias digestivas. No todas las personas reaccionan igual: algunas vuelven a comerlos sin síntomas y otras necesitan avanzar más lento y con más estructura.' },
      { tipo: 'lista', items: [
        'Introduce un alimento nuevo a la vez.',
        'Observa tus síntomas digestivos durante 2 a 3 días.',
        'Lleva un registro simple de lo que toleras bien, como en la fase 1.',
        'Si un alimento te provoca molestias importantes, retíralo por un tiempo y vuelve a intentarlo más adelante.'
      ] },
      { tipo: 'aviso', texto: 'Si tienes un diagnóstico de sobrecrecimiento bacteriano u otros síntomas digestivos que persisten, conversa con la Dra. antes de avanzar: puede ser mejor hacerlo con una reintroducción más estructurada.' }
    ]
  }
];
