var REVEAL_GROUPS = [
	{ trigger: '.counters', targets: '.counter' },
	{ trigger: '#o-nas', targets: '#o-nas .o-nas-grid > *' },
	{ trigger: '#jak-pracujemy', targets: '#jak-pracujemy h2' },
	{ trigger: '#jak-pracujemy .steps', targets: '.step' },
	{ trigger: '.realizacje', targets: '.realizacje-title' },
	{ trigger: '.realizacje-grid', targets: '.realizacje-grid figure' },
	{ trigger: '#cennik', targets: '#cennik h2, #cennik .section-lead' },
	{ trigger: '.price-grid', targets: '.price-card' },
	{ trigger: '.extra-services', targets: '.extra-services h3' },
	{ trigger: '.extra-grid', targets: '.extra-card' },
	{ trigger: '#kontakt', targets: '#kontakt h2' },
	{ trigger: '#kontakt .kontakt-grid', targets: '#kontakt .kontakt-grid > *' }
];

/**
 * Wstawia bieżący rok do wszystkich elementów z atrybutem data-year.
 *
 * Rok wpisany w HTML zostaje jako zapas dla wyłączonego JavaScriptu, dlatego
 * funkcja działa poza obsługą animacji i nie zależy od bibliotek z CDN.
 *
 * @returns {void}
 */
function setFooterYear() {
	document.querySelectorAll('[data-year]').forEach(function (el) {
		el.textContent = new Date().getFullYear();
	});
}

/**
 * Przełącza klasę .scrolled na przyklejonej nawigacji.
 *
 * Klasa odpowiada w CSS za niższy i ciemniejszy pasek po zejściu z góry strony;
 * stan ustawiany jest też przy starcie, bo przeglądarka potrafi przywrócić
 * pozycję przewinięcia przed wykonaniem skryptu.
 *
 * @returns {void}
 */
function initNavScrollState() {
	var nav = document.getElementById('nav');
	if (!nav) return;

	var update = function () {
		nav.classList.toggle('scrolled', window.scrollY > 24);
	};

	window.addEventListener('scroll', update, { passive: true });
	update();
}

/**
 * Obsługuje rozwijane menu mobilne pod przyciskiem hamburgera.
 *
 * Menu zamyka się po kliknięciu pozycji, w przeciwnym razie zasłania nagłówek
 * sekcji, do której prowadzi kotwica.
 *
 * @returns {void}
 */
function initMobileMenu() {
	var burger = document.getElementById('nav-burger');
	var links = document.getElementById('nav-links');
	if (!burger || !links) return;

	burger.addEventListener('click', function () {
		var open = links.classList.toggle('open');
		burger.setAttribute('aria-expanded', open ? 'true' : 'false');
		burger.setAttribute('aria-label', open ? 'Zamknij menu' : 'Otwórz menu');
	});

	links.querySelectorAll('a').forEach(function (link) {
		link.addEventListener('click', function () {
			links.classList.remove('open');
			burger.setAttribute('aria-expanded', 'false');
		});
	});
}

/**
 * Obsługuje widget kontaktu w prawym dolnym rogu.
 *
 * Rozwinięte menu zamyka się po wyborze pozycji oraz po kliknięciu poza
 * widgetem, żeby nie zasłaniało treści strony.
 *
 * @returns {void}
 */
function initContactFab() {
	var wrapper = document.getElementById('fab-wrapper');
	var btn = document.getElementById('fab-btn');
	if (!wrapper || !btn) return;

	btn.addEventListener('click', function () {
		wrapper.classList.toggle('is-open');
	});

	wrapper.querySelectorAll('.fab-menu-item').forEach(function (item) {
		item.addEventListener('click', function () {
			wrapper.classList.remove('is-open');
		});
	});

	document.addEventListener('click', function (e) {
		if (!wrapper.contains(e.target)) {
			wrapper.classList.remove('is-open');
		}
	});
}

/**
 * Ładuje mapę Google dopiero przy dojściu do sekcji kontaktu.
 *
 * Adres iframe czeka w atrybucie data-map-src; bez obsługi IntersectionObserver
 * mapa wstawiana jest od razu, żeby sekcja nie została pusta.
 *
 * @returns {void}
 */
function initLazyMap() {
	var frame = document.querySelector('iframe[data-map-src]');
	if (!frame) return;

	if (!('IntersectionObserver' in window)) {
		frame.src = frame.dataset.mapSrc;
		return;
	}

	var observer = new IntersectionObserver(function (entries) {
		entries.forEach(function (entry) {
			if (entry.isIntersecting) {
				frame.src = frame.dataset.mapSrc;
				observer.disconnect();
			}
		});
	}, { rootMargin: '300px' });

	observer.observe(frame);
}

/**
 * Podświetla w nawigacji pozycję sekcji widocznej w środku ekranu.
 *
 * @returns {void}
 */
function initSectionSpy() {
	var links = document.querySelectorAll('.nav-links a[href^="#"]');
	if (!links.length || !('IntersectionObserver' in window)) return;

	var pairs = [];
	links.forEach(function (link) {
		var target = document.querySelector(link.getAttribute('href'));
		if (target) pairs.push({ link: link, el: target });
	});

	var observer = new IntersectionObserver(function (entries) {
		entries.forEach(function (entry) {
			var match = pairs.find(function (pair) {
				return pair.el === entry.target;
			});
			if (match && entry.isIntersecting) {
				links.forEach(function (link) {
					link.classList.remove('active');
				});
				match.link.classList.add('active');
			}
		});
	}, { rootMargin: '-40% 0px -55% 0px' });

	pairs.forEach(function (pair) {
		observer.observe(pair.el);
	});
}

/**
 * Uruchamia animacje GSAP: wejścia sekcji, liczniki i przewijanie do kotwic.
 *
 * Elementy chowane są od razu, jeszcze pod ekranem ładowania, a animacje
 * startują po zdarzeniu animationend nakładki (czasy ustawione w CSS).
 * Liczniki ruszają od zera także przy zredukowanym ruchu, bo zatrzymany
 * wskaźnik gubi informację. Awaria CDN nie może zostawić schowanej treści,
 * dlatego cała logika jest w jednym bloku try/catch, który w razie błędu
 * przywraca widoczność i docelowe wartości liczników.
 *
 * @returns {void}
 */
function initMotion() {
	var heroTargets = '.hero-text > *';
	var allTargets = heroTargets + ', ' + REVEAL_GROUPS.map(function (group) {
		return group.targets;
	}).join(', ');

	try {
		gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

		var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		var shift = reduced ? 0 : 34;
		var dur = reduced ? 0.45 : 0.8;
		var nav = document.getElementById('nav');

		document.querySelectorAll('a[href^="#"]').forEach(function (link) {
			link.addEventListener('click', function (e) {
				var id = link.getAttribute('href');
				if (id.length < 2) return;
				var target = document.querySelector(id);
				if (!target) return;
				e.preventDefault();
				gsap.to(window, {
					duration: reduced ? 0.5 : 0.9,
					ease: 'power2.inOut',
					scrollTo: { y: target, offsetY: nav ? nav.offsetHeight + 16 : 0 }
				});
			});
		});

		gsap.set(allTargets, { opacity: 0 });

		document.querySelectorAll('[data-count]').forEach(function (el) {
			el.textContent = '0';
		});

		var loader = document.getElementById('loader');
		var started = false;

		var start = function () {
			if (started) return;
			started = true;

			gsap.fromTo(heroTargets,
				{ opacity: 0, y: shift },
				{ opacity: 1, y: 0, duration: dur + 0.1, ease: 'power3.out', stagger: 0.12 }
			);

			REVEAL_GROUPS.forEach(function (group) {
				gsap.fromTo(group.targets,
					{ opacity: 0, y: shift },
					{
						scrollTrigger: { trigger: group.trigger, start: 'top 80%', once: true },
						opacity: 1,
						y: 0,
						duration: dur,
						ease: 'power3.out',
						stagger: 0.12
					}
				);
			});

			document.querySelectorAll('[data-count]').forEach(function (el) {
				var counter = { val: 0 };
				gsap.to(counter, {
					scrollTrigger: { trigger: '.counters', start: 'top 80%', once: true },
					val: parseInt(el.dataset.count, 10),
					duration: 1.6,
					ease: 'power2.out',
					onUpdate: function () {
						el.textContent = Math.round(counter.val);
					}
				});
			});
		};

		if (!loader || getComputedStyle(loader).visibility === 'hidden') {
			start();
		} else {
			loader.addEventListener('animationend', function (e) {
				if (e.animationName === 'loader-out') start();
			});
			gsap.delayedCall(3, start);
		}
	} catch (e) {
		document.querySelectorAll(allTargets).forEach(function (el) {
			el.style.opacity = '';
		});
		document.querySelectorAll('[data-count]').forEach(function (el) {
			el.textContent = el.dataset.count;
		});
	}
}

setFooterYear();
initNavScrollState();
initMobileMenu();
initContactFab();
initLazyMap();
initSectionSpy();
initMotion();
