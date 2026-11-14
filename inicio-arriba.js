/* Siempre se carga desde arriba. Si el navegador restaura el scroll al recargar a mitad de página, el
   scroll-jacking y GSAP quedan descalibrados y el hero puede no volver a aparecer.
   Va en el <head>, antes de cualquier otro script: ScrollTrigger guarda el valor de scrollRestoration cuando carga y
   lo vuelve a poner tras cada refresco, así que si esto corriera después, quedaría otra vez en "auto".
   (Antes era un <script> escrito dentro de index.html; la política de seguridad del sitio no los permite.) */
try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}
window.scrollTo(0, 0);
