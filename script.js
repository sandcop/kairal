(function() {
        const testimonials = [
            {
                text: "Después de años luchando con fatiga crónica y problemas digestivos, finalmente encontré respuestas. El enfoque de la Dra. Sánchez cambió mi vida completamente. Hoy me siento con más energía que nunca.",
                name: "María González",
                role: "Paciente desde 2023",
                initials: "MG"
            },
            {
                text: "Lo que más valoro es la atención personalizada. No soy solo un número más. La doctora realmente se preocupa por entender mis necesidades y diseñar un plan específico para mí.",
                name: "Carlos Ramírez",
                role: "Paciente desde 2022",
                initials: "CR"
            },
            {
                text: "Finalmente logré equilibrar mis hormonas y recuperar mi vitalidad. El enfoque funcional me ayudó a entender la raíz de mis problemas, no solo a enmascarar los síntomas.",
                name: "Andrea Silva",
                role: "Paciente desde 2021",
                initials: "AS"
            },
            {
                text: "Llegué con dolores crónicos que nadie había podido resolver. Con el protocolo personalizado de la Dra. Yusneily en pocas semanas empecé a ver cambios reales y sostenibles.",
                name: "Valentina Moreno",
                role: "Paciente desde 2023",
                initials: "VM"
            },
            {
                text: "La medicina funcional me abrió los ojos. Por primera vez alguien me escuchó de verdad y me explicó qué estaba pasando en mi cuerpo. Perdí 8 kilos en 3 meses de forma sana.",
                name: "Roberto Fuentes",
                role: "Paciente desde 2022",
                initials: "RF"
            },
            {
                text: "Sufría de insomnio severo y ansiedad. Con el tratamiento integral de la Dra. Sánchez, mi calidad de sueño mejoró notablemente. Me siento como una persona nueva.",
                name: "Claudia Herrera",
                role: "Paciente desde 2024",
                initials: "CH"
            }
        ];

        const star = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/></svg>`;

        function buildCard(t) {
            return `<div class="t-card">
                <div class="t-stars">${star.repeat(5)}</div>
                <p class="t-text">"${t.text}"</p>
                <div class="t-author">
                    <div class="t-avatar">${t.initials}</div>
                    <div>
                        <p class="t-name">${t.name}</p>
                        <p class="t-role">${t.role}</p>
                    </div>
                </div>
            </div>`;
        }

        function buildRow(items, direction) {
            const cards = [...items, ...items].map(buildCard).join('');
            return `<div class="t-row">
                <div class="t-track ${direction}">${cards}</div>
            </div>`;
        }

        const container = document.getElementById('t-rows-container');
        const mid = Math.ceil(testimonials.length / 2);
        container.innerHTML =
            buildRow(testimonials.slice(0, mid), 'forward') +
            buildRow(testimonials.slice(mid), 'backward');
    })();

// EFECTOS DE SCROLL TIPO HONOR
        
        // Intersection Observer para elementos con scroll reveal
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        };

        const scrollRevealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('scroll-reveal');
                }
            });
        }, observerOptions);

        // Observar todos los elementos que necesitan animación de scroll
        document.addEventListener('DOMContentLoaded', () => {
            // Observar secciones principales
            const sectionsToObserve = document.querySelectorAll(`
                .section-header,
                .about-image-container,
                .about-content,
                .highlight-item,
                .service-card,
                .process-step,
                .timeline-info,
                .timeline-item
            `);
            
            sectionsToObserve.forEach(el => {
                scrollRevealObserver.observe(el);
            });

            // Agregar delay escalonado a las tarjetas de servicio
            const serviceCards = document.querySelectorAll('.service-card');
            serviceCards.forEach((card, index) => {
                card.style.transitionDelay = `${index * 0.1}s`;
            });

            // Agregar delay escalonado a los items de timeline
            const timelineItems = document.querySelectorAll('.timeline-item');
            timelineItems.forEach((item, index) => {
                item.style.transitionDelay = `${index * 0.15}s`;
            });

            // Agregar delay escalonado a los highlights
            const highlightItems = document.querySelectorAll('.highlight-item');
            highlightItems.forEach((item, index) => {
                item.style.transitionDelay = `${index * 0.1}s`;
            });

            // Agregar delay escalonado a los pasos del proceso (solo desktop)
            if (window.innerWidth > 768) {
                const processSteps = document.querySelectorAll('.process-step');
                processSteps.forEach((step, index) => {
                    step.style.transitionDelay = `${index * 0.15}s`;
                });
            }
        });

        // Efecto Parallax en el scroll
        let lastScrollTop = 0;
        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollDelta = scrollTop - lastScrollTop;
            
            // Parallax para imágenes de about
            const aboutImage = document.querySelector('.about-image');
            if (aboutImage) {
                const imageTop = aboutImage.getBoundingClientRect().top;
                const imageHeight = aboutImage.offsetHeight;
                if (imageTop < window.innerHeight && imageTop > -imageHeight) {
                    const parallaxValue = (window.innerHeight - imageTop) * 0.15;
                    aboutImage.style.transform = `translateY(${parallaxValue}px) scale(1)`;
                }
            }
            
            lastScrollTop = scrollTop;
        });

        // ── SANITY BLOG INTEGRATION ──────────────────────────────
        const SANITY_PROJECT_ID = 'zu3r11hb';
        const SANITY_DATASET = 'production';
        const SANITY_API_URL = `https://${SANITY_PROJECT_ID}.api.sanity.io/v2021-10-21/data/query/${SANITY_DATASET}`;

        function sanityImageUrl(ref) {
            if (!ref) return 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=500&auto=format&fit=crop';
            const [, id, dimensions, format] = ref.split('-');
            return `https://cdn.sanity.io/images/${SANITY_PROJECT_ID}/${SANITY_DATASET}/${id}-${dimensions}.${format}`;
        }

        function formatDate(dateStr) {
            if (!dateStr) return '';
            const date = new Date(dateStr);
            return date.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });
        }

        function normalizeCategory(str) {
            return str.toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .trim();
        }

        function buildBlogCard(post) {
            const imageUrl = post.image?.asset?._ref ? sanityImageUrl(post.image.asset._ref) : 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=500&auto=format&fit=crop';
            const category = post.category || 'General';
            const categoryLower = normalizeCategory(category);
            return `
            <div class="blog-card" data-category="${categoryLower}">
                <img src="${imageUrl}" alt="${post.title}" class="blog-image">
                <div class="blog-content">
                    <div class="blog-card-header" onclick="toggleBlog(this)">
                        <div><span class="blog-tag">${category}</span><h3>${post.title}</h3></div>
                        <span class="blog-card-toggle">▾</span>
                    </div>
                    <div class="blog-card-body">
                        <p class="blog-excerpt">${post.excerpt || ''}</p>
                        <div class="blog-meta">
                            <span class="blog-date">${formatDate(post.publishedAt)}</span>
                            <a href="blog.html?slug=${post.slug?.current || ''}" class="read-more">Leer más →</a>
                        </div>
                    </div>
                </div>
            </div>`;
        }

        async function loadBlogsFromSanity() {
            const query = encodeURIComponent(`*[_type == "post"] | order(publishedAt desc) { title, slug, category, publishedAt, image, excerpt }`);
            try {
                const res = await fetch(`${SANITY_API_URL}?query=${query}`);
                const data = await res.json();
                if (data.result && data.result.length > 0) {
                    const grid = document.querySelector('.blog-grid');
                    if (grid) {
                        grid.innerHTML = data.result.map(buildBlogCard).join('');
                    }
                }
            } catch (err) {
                console.log('Usando blogs estáticos:', err);
            }
        }

        loadBlogsFromSanity();

        // Cargar posts recientes en el panel lateral
        async function loadRecentPosts() {
            const query = encodeURIComponent(`*[_type == "post"] | order(publishedAt desc)[0...3] { title, slug, publishedAt }`);
            try {
                const res = await fetch(`${SANITY_API_URL}?query=${query}`);
                const data = await res.json();
                if (data.result && data.result.length > 0) {
                    const container = document.querySelector('.side-panel-content');
                    const section = container?.querySelector('.panel-section-title');
                    if (!section) return;
                    const oldPosts = container.querySelectorAll('.recent-post');
                    oldPosts.forEach(p => p.remove());
                    data.result.forEach(post => {
                        const div = document.createElement('div');
                        div.className = 'recent-post';
                        div.innerHTML = `<h4 onclick="window.location='blog.html?slug=${post.slug?.current}'">${post.title}</h4>
                            <p class="recent-post-date">${formatDate(post.publishedAt)}</p>`;
                        container.appendChild(div);
                    });
                }
            } catch (err) {
                console.log('Posts recientes: usando estaticos', err);
            }
        }

        loadRecentPosts();

        // Blog Filter
        function filterBlog(category) {
            const cards = document.querySelectorAll('.blog-card');
            const buttons = document.querySelectorAll('.category-btn');
            
            buttons.forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
            
            cards.forEach((card, index) => {
                const cardCategory = normalizeCategory(card.dataset.category || '');
                const filterCategory = normalizeCategory(category);
                if (filterCategory === 'all' || cardCategory === filterCategory) {
                    setTimeout(() => {
                        card.style.display = 'flex';
                        card.style.animation = 'fadeIn 0.5s ease forwards';
                    }, index * 50);
                } else {
                    card.style.display = 'none';
                }
            });
        }

        // Download Modal Functions
        function openDownloadModal(guideTitle) {
            const modal = document.querySelector('.download-modal');
            const overlay = document.querySelector('.download-overlay');
            const titleElement = document.getElementById('guide-title');
            
            titleElement.textContent = guideTitle;
            modal.classList.add('active');
            overlay.classList.add('active');
            
            document.querySelector('.form-input').focus();
        }

        function closeDownloadModal() {
            const modal = document.querySelector('.download-modal');
            const overlay = document.querySelector('.download-overlay');
            
            modal.classList.remove('active');
            overlay.classList.remove('active');
        }

        function handleDownload(event) {
            event.preventDefault();
            
            const guideTitle = document.getElementById('guide-title').textContent;
            const name = event.target.querySelector('input[type="text"]').value;
            const email = event.target.querySelector('input[type="email"]').value;
            
            // Aquí iría la integración con tu backend/CRM

            
            // Simulación de descarga exitosa
            alert(`¡Gracias ${name}! Recibirás "${guideTitle}" en ${email} en los próximos minutos.`);
            
            // Limpiar formulario y cerrar modal
            event.target.reset();
            closeDownloadModal();
        }

        // AI Chat Modal Toggle
        function toggleAIChat() {
            const modal = document.querySelector('.ai-chat-modal');
            const overlay = document.querySelector('.ai-chat-overlay');
            
            modal.classList.toggle('active');
            overlay.classList.toggle('active');
            
            if (modal.classList.contains('active')) {
                document.querySelector('.ai-chat-input').focus();
            }
        }

        // Fill AI question from chips
        function fillAIQuestion(chip) {
            document.querySelector('.ai-chat-input').value = chip.textContent;
        }

        // Handle AI Chat
        function handleAIChat() {
            const input = document.querySelector('.ai-chat-input');
            const question = input.value.trim();
            
            if (question) {
                alert('Funcionalidad de IA en desarrollo. Tu pregunta: ' + question);
                input.value = '';
            }
        }

        // Side Panel Toggle
        // ── HEADER CHAT BAR ──────────────────────────────────────
        const headerChatBar = document.getElementById('headerChatBar');
        const headerChatInput = document.getElementById('headerChatInput');

        function focusHeaderChat() {
            headerChatInput.focus();
        }

        function expandHeaderChat() {
            headerChatBar.classList.add('focused');
            // Position suggestions below the input bar
            const wrap = headerChatBar.querySelector('.header-chat-input-wrap');
            const rect = wrap.getBoundingClientRect();
            const suggestions = document.getElementById('headerChatSuggestions');
            suggestions.style.top  = (rect.bottom + 8) + 'px';
            // Center on the input bar, clamped to viewport
            const sugWidth = Math.min(420, window.innerWidth * 0.92);
            const idealLeft = rect.left + rect.width / 2 - sugWidth / 2;
            const clampedLeft = Math.max(8, Math.min(idealLeft, window.innerWidth - sugWidth - 8));
            suggestions.style.left = clampedLeft + 'px';
            suggestions.style.transform = 'none';
            suggestions.style.width = sugWidth + 'px';
        }

        function collapseHeaderChat() {
            // Pequeño delay para permitir clic en sugerencias
            setTimeout(() => {
                if (!headerChatBar.contains(document.activeElement)) {
                    headerChatBar.classList.remove('focused');
                }
            }, 200);
        }

        function setHeaderQuestion(el) {
            headerChatInput.value = el.textContent;
            headerChatBar.classList.remove('focused');
            headerChatInput.blur();
            sendHeaderChat();
        }

        function handleHeaderChatKey(e) {
            if (e.key === 'Enter') sendHeaderChat();
            if (e.key === 'Escape') {
                headerChatInput.blur();
                headerChatBar.classList.remove('focused');
            }
        }

        // Respuestas predefinidas profesionales
        const chatResponses = {
            'medicina funcional': 'La medicina funcional investiga las causas raíz de la enfermedad, no solo los síntomas. La Dra. Yusneily analiza tu historial, nutrición, hormonas y estilo de vida para crear un plan totalmente personalizado.',
            'agendar': 'Puedes reservar tu consulta directamente en <a href="https://encuadrado.com/p/dra-yusneily-katherine-sanchez" target="_blank" style="color:#48B9B3;font-weight:600;">este enlace</a>. Los horarios disponibles se muestran al momento de reservar.',
            'cita': 'Para agendar tu consulta, visita <a href="https://encuadrado.com/p/dra-yusneily-katherine-sanchez" target="_blank" style="color:#48B9B3;font-weight:600;">encuadrado.com</a> donde podrás elegir el horario que mejor se adapte a ti.',
            'servicios': 'Ofrecemos: Análisis Funcional Completo, Nutrición Personalizada, Equilibrio Hormonal, Manejo del Estrés, Suplementación Inteligente y Medicina Preventiva. ¿Te gustaría saber más de alguno?',
            'horario': 'Los horarios disponibles se muestran al momento de reservar en la plataforma de citas. Puedes hacerlo en <a href="https://encuadrado.com/p/dra-yusneily-katherine-sanchez" target="_blank" style="color:#48B9B3;font-weight:600;">este enlace</a>.',
            'precio': 'Los valores de las consultas se informan al momento de reservar. Contáctanos al <a href="https://wa.me/56974843834?text=Hola,%20me%20gustaría%20agendar%20una%20consulta%20con%20la%20Dra.%20Yusneily%20Sánchez" target="_blank" style="color:#48B9B3;font-weight:600;">+569 748 43 834</a> para más información.',
            'contacto': 'Puedes contactarnos al <a href="https://wa.me/56974843834?text=Hola,%20me%20gustaría%20agendar%20una%20consulta%20con%20la%20Dra.%20Yusneily%20Sánchez" target="_blank" style="color:#48B9B3;font-weight:600;">+569 748 43 834</a> o escribirnos a dra.yusneily@kairal.cl',
            'hormonas': 'El desequilibrio hormonal puede afectar energía, peso, sueño y estado de ánimo. La Dra. Yusneily realiza una evaluación integral y diseña tratamientos bioidenticos personalizados.',
            'nutricion': 'La nutrición personalizada es clave en medicina funcional. Se diseña un plan basado en tu microbioma, intolerancias y objetivos específicos de salud.',
            'estres': 'El estrés crónico afecta directamente el cortisol y el sistema inmune. Ofrecemos protocolos de manejo del estrés que incluyen técnicas validadas y seguimiento continuo.',
        };

        function sendHeaderChat() {
            const question = headerChatInput.value.trim();
            if (!question) return;

            // Transferir el texto al modal de IA y abrirlo
            const aiInput = document.querySelector('.ai-chat-input');
            if (aiInput) {
                aiInput.value = question;
            }
            
            // Abrir el modal de IA
            toggleAIChat();
            
            // Limpiar y cerrar el header chat
            headerChatInput.value = '';
            headerChatBar.classList.remove('focused');
            headerChatInput.blur();
        }

        // Copiar email al portapapeles
        function copyEmail() {
            const email = 'dra.yusneily@kairal.cl';
            navigator.clipboard.writeText(email).then(() => {
                const btns = document.querySelectorAll('.copy-email-btn');
                btns.forEach(btn => {
                    btn.classList.add('copied');
                    const hint = btn.querySelector('.copy-hint');
                    if (hint) hint.textContent = '¡copiado!';
                    setTimeout(() => {
                        btn.classList.remove('copied');
                        if (hint) hint.textContent = 'copiar';
                    }, 2000);
                });
            }).catch(() => {
                // Fallback para navegadores sin soporte clipboard
                const el = document.createElement('textarea');
                el.value = email;
                document.body.appendChild(el);
                el.select();
                document.execCommand('copy');
                document.body.removeChild(el);
                const btns = document.querySelectorAll('.copy-email-btn');
                btns.forEach(btn => {
                    const hint = btn.querySelector('.copy-hint');
                    if (hint) { hint.textContent = '¡copiado!'; hint.style.opacity = 1; }
                    setTimeout(() => { if (hint) { hint.textContent = 'copiar'; hint.style.opacity = 0; } }, 2000);
                });
            });
        }

        // Cache panel elements once
        const _panel   = document.querySelector('.side-panel');
        const _overlay = document.querySelector('.side-panel-overlay');
        const _toggle  = document.querySelector('.menu-toggle');

        function toggleSidePanel() {
            const isOpening = !_panel.classList.contains('active');

            // Sync DOM changes in one frame — prevents layout thrashing
            requestAnimationFrame(() => {
                _panel.classList.toggle('active');
                _overlay.classList.toggle('active');
                _toggle.classList.toggle('open');
                document.body.style.overflow = isOpening ? 'hidden' : '';
            });
        }

        // Mobile accordion for process steps
        function toggleProcessStep(el) {
            // Only activate on touch/small screens
            if (window.innerWidth > 768) return;
            const steps = document.querySelectorAll('.process-step');
            const isActive = el.classList.contains('active');
            // Collapse all
            steps.forEach(s => s.classList.remove('active'));
            // Expand clicked unless it was already open
            if (!isActive) el.classList.add('active');
        }

        // Auto-open first step on mobile on load
        window.addEventListener('load', () => {
            if (window.innerWidth <= 768) {
                const first = document.querySelector('.process-step');
                if (first) first.classList.add('active');
            }
        });

        // Header scroll effect
        const header = document.querySelector('header');
        
        window.addEventListener('scroll', () => {
            if (window.scrollY > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });

        // Slider functionality
        let currentSlide = 0;
        const slides = document.querySelectorAll('.slide');
        const dots = document.querySelectorAll('.slider-dot');
        let slideInterval;

        function showSlide(index) {
            slides.forEach(slide => slide.classList.remove('active'));
            dots.forEach(dot => dot.classList.remove('active'));
            slides[index].classList.add('active');
            dots[index].classList.add('active');
        }

        function changeSlide(direction) {
            currentSlide = (currentSlide + direction + slides.length) % slides.length;
            showSlide(currentSlide);
            resetSlideInterval();
        }

        function goToSlide(index) {
            currentSlide = index;
            showSlide(currentSlide);
            resetSlideInterval();
        }

        function resetSlideInterval() {
            clearInterval(slideInterval);
            slideInterval = setInterval(() => {
                currentSlide = (currentSlide + 1) % slides.length;
                showSlide(currentSlide);
            }, 5000);
        }

        slideInterval = setInterval(() => {
            currentSlide = (currentSlide + 1) % slides.length;
            showSlide(currentSlide);
        }, 5000);

        // Smooth scroll para navegación
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });

function toggleBlog(header) {
        if (window.innerWidth > 600) return;
        const card = header.closest('.blog-card');
        card.classList.toggle('open');
    }
// ── SPLIT TEXT HERO ANIMATION con Anime.js ────────────────────
(function () {
    function splitTextIntoChars(el) {
        const text = el.getAttribute('aria-label') || el.textContent.trim();
        const words = text.split(' ');
        el.innerHTML = words.map(word => {
            const chars = word.split('').map(char =>
                `<span class="char">${char}</span>`
            ).join('');
            return `<span class="word">${chars}</span>`;
        }).join(' ');
    }

    function runHeroTitleAnimation() {
        if (typeof anime === 'undefined') return;

        const slides = Array.from(document.querySelectorAll('.hero-slide'));
        const dots   = Array.from(document.querySelectorAll('.hero-dot'));
        if (!slides.length) return;

        const SHOW = 4000, IN = 700, OUT = 450;
        let current = 0, timer = null;

        // Forzar todos los slides invisibles al inicio
        slides.forEach(s => { s.style.opacity = '0'; s.style.transform = 'translateY(20px)'; });

        function updateDots(i) {
            dots.forEach((d, j) => d.classList.toggle('active', j === i));
        }

        function animateSlide0(slide) {
            // Mostrar slide contenedor inmediatamente
            slide.style.opacity = '1';
            slide.style.transform = 'translateY(0)';

            const titleEl = slide.querySelector('.split-title');
            if (titleEl) {
                splitTextIntoChars(titleEl);
                const chars = titleEl.querySelectorAll('.char');
                // Forzar chars invisibles
                chars.forEach(c => { c.style.opacity = '0'; c.style.transform = 'translateY(110%)'; });
                anime({
                    targets: Array.from(chars),
                    translateY: ['110%', '0%'],
                    opacity:    [0, 1],
                    easing:     'cubicBezier(0.22, 1, 0.36, 1)',
                    duration:   850,
                    delay:      anime.stagger(32, { start: 100 }),
                });
            }
            const desc = slide.querySelector('.hero-slide-desc');
            if (desc) {
                desc.style.opacity = '0';
                anime({
                    targets: desc,
                    translateY: [20, 0],
                    opacity:    [0, 1],
                    easing:     'cubicBezier(0.22, 1, 0.36, 1)',
                    duration:   600,
                    delay:      750,
                });
            }
        }

        function hideSlide(slide, cb) {
            anime({
                targets:   slide,
                translateY:[0, -22],
                opacity:   [1, 0],
                easing:    'cubicBezier(0.55, 0, 0.45, 1)',
                duration:  OUT,
                complete:  () => {
                    slide.style.transform = 'translateY(20px)';
                    cb();
                }
            });
        }

        function showSlide(index) {
            const slide = slides[index];
            updateDots(index);

            if (index === 0) {
                animateSlide0(slide);
            } else {
                anime({
                    targets:   slide,
                    translateY:[25, 0],
                    opacity:   [0, 1],
                    easing:    'cubicBezier(0.22, 1, 0.36, 1)',
                    duration:  IN,
                });
            }

            timer = setTimeout(() => {
                hideSlide(slide, () => {
                    // Resetear slide 0 para reanimar las letras
                    if (index === 0) {
                        const titleEl = slide.querySelector('.split-title');
                        if (titleEl) titleEl.setAttribute('aria-label', 'Transforma tu Salud desde la Raíz');
                    }
                    current = (current + 1) % slides.length;
                    showSlide(current);
                });
            }, SHOW);
        }

        // ── Eyebrow ──────────────────────────────────────
        anime({
            targets:   '.hero-eyebrow',
            translateY:[20, 0], opacity:[0, 1],
            easing:    'cubicBezier(0.22, 1, 0.36, 1)',
            duration:  700, delay: 150,
        });
        // ── Botones ──────────────────────────────────────
        anime({
            targets:   '.hero-btns a',
            translateY:[20, 0], opacity:[0, 1],
            easing:    'cubicBezier(0.22, 1, 0.36, 1)',
            duration:  600, delay: anime.stagger(120, { start: 1000 }),
        });
        // ── Dots ─────────────────────────────────────────
        dots.forEach(d => { d.style.opacity = '0'; });
        anime({
            targets: dots, opacity:[0, 1],
            easing:  'cubicBezier(0.22, 1, 0.36, 1)',
            duration: 400, delay: anime.stagger(80, { start: 1200 }),
        });

        // Arrancar slides
        setTimeout(() => showSlide(0), 300);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runHeroTitleAnimation);
    } else {
        runHeroTitleAnimation();
    }
})();

// ── Acordeón servicios: click en móvil, hover en desktop ──────
function toggleServiceCard(card) {
    // En desktop con hover nativo no hace falta el click
    // Pero si se clickea, toggleamos igual para accesibilidad
    const isTouchDevice = window.matchMedia('(hover: none)').matches;
    if (!isTouchDevice) return; // desktop: solo hover CSS

    const isOpen = card.classList.contains('open');
    // Cerrar todos
    document.querySelectorAll('.service-card.open').forEach(c => c.classList.remove('open'));
    // Abrir el clickeado (si no estaba abierto)
    if (!isOpen) card.classList.add('open');
}

// ── FILTROS VISUALES ──────────────────────────────────────────
(function() {
    const FILTERS = ['none', 'night', 'sepia', 'red', 'lowlight'];
    let currentFilter = 'none';
    let menuOpen = false;

    function getInitialFilter() {
        const saved = localStorage.getItem('kairal-filter');
        if (saved) return saved;
        return 'none'; // Siempre normal por defecto
    }

    function applyFilter(filter) {
        FILTERS.forEach(f => document.body.classList.remove('filter-' + f));
        if (filter !== 'none') document.body.classList.add('filter-' + filter);
        currentFilter = filter;
        localStorage.setItem('kairal-filter', filter);

        // Marcar círculo activo
        document.querySelectorAll('.filter-opt').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
    }

    function toggleFilterMenu() {
        menuOpen = !menuOpen;
        const wrap = document.getElementById('filterWrap');
        if (wrap) wrap.classList.toggle('open', menuOpen);
    }

    // Cerrar al click fuera
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.filter-btn-wrap')) {
            menuOpen = false;
            const wrap = document.getElementById('filterWrap');
            if (wrap) wrap.classList.remove('open');
        }
    });

    window.setFilter = function(filter) {
        applyFilter(filter);
        menuOpen = false;
        const wrap = document.getElementById('filterWrap');
        if (wrap) wrap.classList.remove('open');
    };
    window.toggleFilterMenu = toggleFilterMenu;

    document.addEventListener('DOMContentLoaded', () => {
        applyFilter(getInitialFilter());
    });
})();