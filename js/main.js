// rok w stopce
document.querySelectorAll('[data-year]').forEach(function (el) {
	el.textContent = new Date().getFullYear();
});

// menu mobilne
var burger = document.getElementById('nav-burger');
var navLinks = document.getElementById('nav-links');
if (burger && navLinks) {
	burger.addEventListener('click', function () {
		var open = navLinks.classList.toggle('open');
		burger.setAttribute('aria-expanded', open ? 'true' : 'false');
		burger.setAttribute('aria-label', open ? 'Zamknij menu' : 'Otwórz menu');
	});
	// zamykaj po wyborze pozycji — inaczej menu zasłania cel kotwicy
	navLinks.querySelectorAll('a').forEach(function (a) {
		a.addEventListener('click', function () {
			navLinks.classList.remove('open');
			burger.setAttribute('aria-expanded', 'false');
		});
	});
}

// widget kontaktu (FAB)
var fabWrapper = document.getElementById('fab-wrapper');
var fabBtn = document.getElementById('fab-btn');
if (fabWrapper && fabBtn) {
	fabBtn.addEventListener('click', function () {
		fabWrapper.classList.toggle('is-open');
	});
	// zamknij po wyborze — inaczej rozwinięte menu zasłania cel kotwicy
	fabWrapper.querySelectorAll('.fab-menu-item').forEach(function (item) {
		item.addEventListener('click', function () {
			fabWrapper.classList.remove('is-open');
		});
	});
	document.addEventListener('click', function (e) {
		if (!fabWrapper.contains(e.target)) {
			fabWrapper.classList.remove('is-open');
		}
	});
}

// leniwe ładowanie mapy — iframe dostaje src dopiero przy dojeździe do sekcji
var mapFrame = document.querySelector('iframe[data-map-src]');
if (mapFrame && 'IntersectionObserver' in window) {
	var mapObserver = new IntersectionObserver(function (entries) {
		entries.forEach(function (entry) {
			if (entry.isIntersecting) {
				mapFrame.src = mapFrame.dataset.mapSrc;
				mapObserver.disconnect();
			}
		});
	}, { rootMargin: '300px' });
	mapObserver.observe(mapFrame);
} else if (mapFrame) {
	mapFrame.src = mapFrame.dataset.mapSrc;
}

// podświetlenie aktywnej sekcji w nawigacji
var sectionLinks = document.querySelectorAll('.nav-links a[href^="#"]');
if (sectionLinks.length && 'IntersectionObserver' in window) {
	var sections = [];
	sectionLinks.forEach(function (a) {
		var target = document.querySelector(a.getAttribute('href'));
		if (target) sections.push({ link: a, el: target });
	});
	var spy = new IntersectionObserver(function (entries) {
		entries.forEach(function (entry) {
			var match = sections.find(function (s) { return s.el === entry.target; });
			if (match && entry.isIntersecting) {
				sectionLinks.forEach(function (a) { a.classList.remove('active'); });
				match.link.classList.add('active');
			}
		});
	}, { rootMargin: '-40% 0px -55% 0px' });
	sections.forEach(function (s) { spy.observe(s.el); });
}

// --- animacje GSAP; awaria CDN nie może niczego ukryć ---
try {
	gsap.registerPlugin(ScrollTrigger);

	var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	// przy redukcji ruchu elementy nadal się pojawiają, ale bez jazdy po osi Y
	var shift = reduced ? 0 : 34;
	var dur = reduced ? 0.45 : 0.8;

	// hero czeka, aż zniknie ekran ładowania (czasy w .loader w style.css)
	var heroDelay = document.getElementById('loader') ? 2 : 0;
	gsap.from('.hero-text > *', {
		opacity: 0,
		y: shift,
		duration: dur + 0.1,
		delay: heroDelay,
		ease: 'power3.out',
		stagger: 0.12
	});

	// wjazdy sekcji: nagłówki, kafle, karty — każda grupa na własnym triggerze
	[
		{ trigger: '.counters', targets: '.counter' },
		{ trigger: '#o-nas', targets: '#o-nas .eyebrow, #o-nas .o-nas-grid > *' },
		{ trigger: '#jak-pracujemy', targets: '#jak-pracujemy .eyebrow, #jak-pracujemy h2' },
		{ trigger: '#jak-pracujemy .steps', targets: '.step' },
		{ trigger: '.realizacje', targets: '.realizacje-title' },
		{ trigger: '.realizacje-grid', targets: '.realizacje-grid figure' },
		{ trigger: '#cennik', targets: '#cennik .eyebrow, #cennik h2, #cennik .section-lead' },
		{ trigger: '.price-grid', targets: '.price-card' },
		{ trigger: '.extra-services', targets: '.extra-services h3' },
		{ trigger: '.extra-grid', targets: '.extra-card' },
		{ trigger: '#kontakt', targets: '#kontakt .eyebrow, #kontakt h2' },
		{ trigger: '#kontakt .kontakt-grid', targets: '#kontakt .kontakt-grid > *' }
	].forEach(function (cfg) {
		gsap.from(cfg.targets, {
			scrollTrigger: { trigger: cfg.trigger, start: 'top 80%', once: true },
			opacity: 0,
			y: shift,
			duration: dur,
			ease: 'power3.out',
			stagger: 0.12
		});
	});

	// countery liczą zawsze — zatrzymany wskaźnik gubi informację
	document.querySelectorAll('[data-count]').forEach(function (el) {
		var target = parseInt(el.dataset.count, 10);
		var obj = { val: 0 };
		gsap.to(obj, {
			scrollTrigger: { trigger: el, start: 'top 90%', once: true },
			val: target,
			duration: 1.6,
			ease: 'power2.out',
			onUpdate: function () {
				el.textContent = Math.round(obj.val);
			}
		});
	});
} catch (e) {
	// bez GSAP strona zostaje w pełni widoczna
}
