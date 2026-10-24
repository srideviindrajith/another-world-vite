(function() {
  'use strict';

  var scrollbar, track, thumb, progress, tooltip, ticks, stars;
  var phase;
  var isDragging = false;
  var scrollY = 0;
  var rotation = 0;
  var idleRotation = 0;
  var lastScrollY = 0;
  var lastScrollTime = 0;
  var fadeTimeout = null;
  var rafId = null;
  var starRafId = null;
  var reducedMotion = matchMedia('(prefers-reduced-motion:reduce)').matches;
  var isMobile = matchMedia('(pointer:coarse)').matches;
  var sections = [];
  var starsArray = [];
  var lastSectionIndex = -1;

  function init() {
    scrollbar = document.createElement('div');
    scrollbar.className = 'custom-scrollbar';
    scrollbar.setAttribute('role', 'scrollbar');
    scrollbar.setAttribute('aria-controls', 'main');
    scrollbar.setAttribute('aria-orientation', 'vertical');
    scrollbar.setAttribute('aria-valuemin', '0');
    scrollbar.setAttribute('aria-valuemax', '100');
    scrollbar.setAttribute('tabindex', '0');

    track = document.createElement('div');
    track.className = 'custom-scrollbar-track';
    scrollbar.appendChild(track);

    progress = document.createElement('div');
    progress.className = 'custom-scrollbar-progress';
    track.appendChild(progress);

    stars = document.createElement('div');
    stars.className = 'custom-scrollbar-stars';
    track.appendChild(stars);

    thumb = document.createElement('div');
    thumb.className = 'custom-scrollbar-thumb';
    thumb.setAttribute('aria-hidden', 'true');
    scrollbar.appendChild(thumb);

    phase = document.createElement('div');
    phase.className = 'custom-scrollbar-phase';
    thumb.appendChild(phase);

    tooltip = document.createElement('div');
    tooltip.className = 'custom-scrollbar-tooltip';
    scrollbar.appendChild(tooltip);

    ticks = document.createElement('div');
    ticks.className = 'custom-scrollbar-ticks';
    track.appendChild(ticks);

    document.body.appendChild(scrollbar);

    setupSections();
    setupTicks();
    setupStars();
    setupEventListeners();
    setupResizeObserver();
    updateScroll();
    startIdleAnimation();
    startStarAnimation();
  }

  function setupSections() {
    sections = [
      { id: 'top', label: 'Hero' },
      { id: 'services', label: 'Research' },
      { id: 'mission', label: 'Mission' },
      { id: 'contact', label: 'Contact' }
    ];
  }

  function setupTicks() {
    sections.forEach(function(section) {
      var el = document.getElementById(section.id);
      if (el) {
        var tick = document.createElement('div');
        tick.className = 'custom-scrollbar-tick';
        tick.setAttribute('aria-label', section.label);
        tick.addEventListener('click', function(e) {
          e.stopPropagation();
          var rect = el.getBoundingClientRect();
          var targetY = window.scrollY + rect.top - 80;
          window.scrollTo({ top: targetY, behavior: 'smooth' });
        });
        ticks.appendChild(tick);
      }
    });
  }

  function setupStars() {
    for (var i = 0; i < 12; i++) {
      var star = document.createElement('div');
      star.className = 'custom-scrollbar-star';
      stars.appendChild(star);
      starsArray.push({
        element: star,
        x: 0,
        y: 0,
        opacity: 0,
        life: 0
      });
    }
  }

  function setupEventListeners() {
    window.addEventListener('scroll', onScroll, { passive: true });
    thumb.addEventListener('pointerdown', onPointerDown);
    track.addEventListener('click', onTrackClick);
    scrollbar.addEventListener('keydown', onKeyDown);
    scrollbar.addEventListener('focus', onFocus);
    scrollbar.addEventListener('blur', onBlur);
  }

  function setupResizeObserver() {
    var resizeObserver = new ResizeObserver(function() {
      updateScroll();
    });
    resizeObserver.observe(document.body);
  }

  function onScroll() {
    scrollY = window.scrollY;
    lastScrollTime = Date.now();
    resetFade();

    if (!reducedMotion) {
      var scrollDelta = Math.abs(scrollY - lastScrollY);
      rotation += scrollDelta * 0.8;
      updateStars();
    }

    lastScrollY = scrollY;
    updateScroll();
  }

  function updateStars() {
    var trackHeight = track.offsetHeight;
    var thumbHeight = thumb.offsetHeight;
    var thumbY = parseFloat(thumb.style.top) || 0;
    var thumbCenter = thumbY + thumbHeight / 2;

    starsArray.forEach(function(star) {
      if (star.life > 0) {
        star.life -= 0.02;
        star.opacity = star.life;
        star.y += 1;
        star.element.style.top = star.y + 'px';
        star.element.style.opacity = star.opacity;
      } else if (Math.random() < 0.1) {
        star.x = Math.random() * 6;
        star.y = thumbCenter + (Math.random() - 0.5) * 20;
        star.life = 1;
        star.opacity = 1;
        star.element.style.left = star.x + 'px';
        star.element.style.top = star.y + 'px';
        star.element.style.opacity = star.opacity;
      }
    });
  }

  function startStarAnimation() {
    if (reducedMotion || isMobile) return;

    function animate() {
      if (Date.now() - lastScrollTime < 100) {
        updateStars();
      }
      starRafId = requestAnimationFrame(animate);
    }
    animate();
  }

  function onPointerDown(e) {
    isDragging = true;
    thumb.classList.add('dragging');
    thumb.setPointerCapture(e.pointerId);
    thumb.addEventListener('pointermove', onPointerMove);
    thumb.addEventListener('pointerup', onPointerUp);
    thumb.addEventListener('pointercancel', onPointerUp);
    e.preventDefault();
  }

  function onPointerMove(e) {
    if (!isDragging) return;
    var trackRect = track.getBoundingClientRect();
    var thumbHeight = thumb.offsetHeight;
    var trackHeight = trackRect.height;
    var y = e.clientY - trackRect.top - thumbHeight / 2;
    y = Math.max(0, Math.min(y, trackHeight - thumbHeight));
    var scrollRatio = y / (trackHeight - thumbHeight);
    var maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo(0, scrollRatio * maxScroll);
  }

  function onPointerUp(e) {
    isDragging = false;
    thumb.classList.remove('dragging');
    thumb.releasePointerCapture(e.pointerId);
    thumb.removeEventListener('pointermove', onPointerMove);
    thumb.removeEventListener('pointerup', onPointerUp);
    thumb.removeEventListener('pointercancel', onPointerUp);
  }

  function onTrackClick(e) {
    if (e.target !== track && e.target !== progress && e.target !== stars && e.target !== ticks) return;
    var trackRect = track.getBoundingClientRect();
    var thumbHeight = thumb.offsetHeight;
    var y = e.clientY - trackRect.top - thumbHeight / 2;
    var trackHeight = trackRect.height;
    y = Math.max(0, Math.min(y, trackHeight - thumbHeight));
    var scrollRatio = y / (trackHeight - thumbHeight);
    var maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: scrollRatio * maxScroll, behavior: 'smooth' });
  }

  function onKeyDown(e) {
    var maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    var currentScroll = window.scrollY;
    var pageHeight = window.innerHeight * 0.9;

    switch (e.key) {
      case 'ArrowUp':
        window.scrollBy({ top: -40, behavior: 'smooth' });
        e.preventDefault();
        break;
      case 'ArrowDown':
        window.scrollBy({ top: 40, behavior: 'smooth' });
        e.preventDefault();
        break;
      case 'PageUp':
        window.scrollBy({ top: -pageHeight, behavior: 'smooth' });
        e.preventDefault();
        break;
      case 'PageDown':
        window.scrollBy({ top: pageHeight, behavior: 'smooth' });
        e.preventDefault();
        break;
      case 'Home':
        window.scrollTo({ top: 0, behavior: 'smooth' });
        e.preventDefault();
        break;
      case 'End':
        window.scrollTo({ top: maxScroll, behavior: 'smooth' });
        e.preventDefault();
        break;
    }
  }

  function onFocus() {
    scrollbar.classList.remove('faded');
  }

  function onBlur() {
    resetFade();
  }

  function updateScroll() {
    var maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    var scrollRatio = maxScroll > 0 ? scrollY / maxScroll : 0;
    var trackHeight = track.offsetHeight;
    var thumbHeight = thumb.offsetHeight;
    var availableHeight = trackHeight - thumbHeight;
    var thumbY = scrollRatio * availableHeight;

    thumb.style.top = thumbY + 'px';
    progress.style.height = (thumbY + thumbHeight / 2) + 'px';

    var percentage = Math.round(scrollRatio * 100);
    var currentSection = getCurrentSection(scrollRatio);
    tooltip.textContent = percentage + '% - ' + currentSection;
    scrollbar.setAttribute('aria-valuenow', percentage);

    if (!reducedMotion) {
      thumb.style.backgroundPosition = rotation + '% center';
      updateMoonPhase(scrollRatio);
    }

    var isScrollable = maxScroll > 0;
    var loader = document.getElementById('loader');
    var shouldShow = isScrollable && !loader;

    if (shouldShow) {
      scrollbar.classList.add('visible');
    } else {
      scrollbar.classList.remove('visible');
    }

    updateTicks(trackHeight);
    checkSectionTick(scrollRatio);
  }

  function getCurrentSection(scrollRatio) {
    for (var i = 0; i < sections.length; i++) {
      if (scrollRatio <= (i + 1) / sections.length) {
        return sections[i].label;
      }
    }
    return sections[sections.length - 1].label;
  }

  function updateMoonPhase(scrollRatio) {
    var phaseOffset = scrollRatio * 100;
    var darkness = Math.max(0, (scrollRatio - 0.5) * 2);
    var gradient;
    
    if (scrollRatio < 0.5) {
      var size = 100 - (scrollRatio * 200);
      gradient = 'radial-gradient(circle at ' + (50 + size) + '% 50%, transparent 40%, rgba(0,0,0,' + (0.7 + scrollRatio * 0.2) + ') 80%)';
    } else {
      var size = (scrollRatio - 0.5) * 200;
      gradient = 'radial-gradient(circle at ' + (50 - size) + '% 50%, transparent 40%, rgba(0,0,0,' + (0.7 + (1 - scrollRatio) * 0.2) + ') 80%)';
    }
    
    phase.style.background = gradient;
  }

  function checkSectionTick(scrollRatio) {
    var sectionIndex = Math.floor(scrollRatio * sections.length);
    if (sectionIndex !== lastSectionIndex && sectionIndex >= 0 && sectionIndex < sections.length) {
      var tickElements = ticks.querySelectorAll('.custom-scrollbar-tick');
      if (tickElements[sectionIndex]) {
        tickElements[sectionIndex].classList.remove('pulse');
        void tickElements[sectionIndex].offsetWidth;
        tickElements[sectionIndex].classList.add('pulse');
      }
      lastSectionIndex = sectionIndex;
    }
  }

  function updateTicks(trackHeight) {
    var tickElements = ticks.querySelectorAll('.custom-scrollbar-tick');
    sections.forEach(function(section, i) {
      var el = document.getElementById(section.id);
      if (el && tickElements[i]) {
        var rect = el.getBoundingClientRect();
        var sectionTop = window.scrollY + rect.top;
        var maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        var ratio = maxScroll > 0 ? sectionTop / maxScroll : 0;
        var tickY = ratio * trackHeight;
        tickElements[i].style.top = tickY + 'px';
      }
    });
  }

  function resetFade() {
    scrollbar.classList.remove('faded');
    if (fadeTimeout) clearTimeout(fadeTimeout);
    fadeTimeout = setTimeout(function() {
      if (!isDragging && document.activeElement !== scrollbar) {
        scrollbar.classList.add('faded');
      }
    }, 1500);
  }

  function startIdleAnimation() {
    if (reducedMotion) return;

    function animate() {
      if (!isDragging && Date.now() - lastScrollTime > 500) {
        idleRotation += 0.1;
        thumb.style.backgroundPosition = (rotation + idleRotation) + '% center';
      }
      rafId = requestAnimationFrame(animate);
    }
    animate();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
