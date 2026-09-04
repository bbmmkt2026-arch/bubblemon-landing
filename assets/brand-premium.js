(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const progressBar = document.querySelector('.scroll-progress i');
  const header = document.querySelector('[data-header]');
  const heroFilm = document.querySelector('[data-hero-film]');
  const parallaxItems = [...document.querySelectorAll('[data-parallax]')];
  const timeline = document.querySelector('[data-timeline]');
  const root = document.documentElement;
  let ticking = false;
  let updateActiveStory = () => {};

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  if (!reducedMotion && finePointer) {
    root.classList.add('has-inertia');

    const inertia = {
      current: window.scrollY,
      target: window.scrollY,
      frame: 0
    };

    const getMaxScroll = () => Math.max(document.documentElement.scrollHeight - window.innerHeight, 0);

    const runInertia = () => {
      const distance = inertia.target - inertia.current;
      inertia.current += distance * 0.075;

      if (Math.abs(distance) < 0.45) {
        inertia.current = inertia.target;
        window.scrollTo(0, inertia.current);
        inertia.frame = 0;
        return;
      }

      window.scrollTo(0, inertia.current);
      inertia.frame = window.requestAnimationFrame(runInertia);
    };

    const startInertia = () => {
      if (inertia.frame) return;
      inertia.current = window.scrollY;
      inertia.frame = window.requestAnimationFrame(runInertia);
    };

    window.addEventListener(
      'wheel',
      (event) => {
        if (event.ctrlKey || event.defaultPrevented) return;
        if (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable="true"]')) return;

        const modeScale = event.deltaMode === 1 ? 18 : event.deltaMode === 2 ? window.innerHeight : 1;
        const delta = event.deltaY * modeScale;
        if (Math.abs(delta) < 0.5) return;

        event.preventDefault();
        inertia.target = clamp(inertia.target + delta * 0.78, 0, getMaxScroll());
        startInertia();
      },
      { passive: false }
    );

    window.addEventListener(
      'scroll',
      () => {
        if (inertia.frame) return;
        inertia.current = window.scrollY;
        inertia.target = window.scrollY;
      },
      { passive: true }
    );

    window.addEventListener('resize', () => {
      inertia.target = clamp(inertia.target, 0, getMaxScroll());
      inertia.current = clamp(inertia.current, 0, getMaxScroll());
    });

    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (event) => {
        const id = link.getAttribute('href');
        const destination = id ? document.querySelector(id) : null;
        if (!destination) return;

        event.preventDefault();
        const headerOffset = id === '#top' ? 0 : 68;
        inertia.target = clamp(
          destination.getBoundingClientRect().top + window.scrollY - headerOffset,
          0,
          getMaxScroll()
        );
        startInertia();
        window.history.replaceState(null, '', id);
      });
    });
  }

  const updateScrollEffects = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollRange = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollRange > 0 ? scrollTop / scrollRange : 0;

    if (progressBar) progressBar.style.transform = `scaleX(${progress})`;
    if (header) header.classList.toggle('is-scrolled', scrollTop > 24);

    if (!reducedMotion && heroFilm) {
      const heroProgress = clamp(scrollTop / Math.max(window.innerHeight, 1), 0, 1);
      heroFilm.style.setProperty('--hero-scale', (heroProgress * 0.08).toFixed(4));
    }

    if (!reducedMotion) {
      parallaxItems.forEach((item) => {
        const rect = item.getBoundingClientRect();
        if (rect.bottom < -120 || rect.top > window.innerHeight + 120) return;
        const centerOffset = rect.top + rect.height / 2 - window.innerHeight / 2;
        const distance = clamp(centerOffset * -0.045, -42, 42);
        item.style.setProperty('--parallax-y', `${distance.toFixed(1)}px`);
      });
    }

    if (timeline) {
      const rect = timeline.getBoundingClientRect();
      const timelineProgress = clamp(
        (window.innerHeight * 0.62 - rect.top) / Math.max(rect.height, 1),
        0,
        1
      );
      timeline.style.setProperty('--timeline-progress', timelineProgress.toFixed(4));
    }

    updateActiveStory();

    ticking = false;
  };

  const requestScrollUpdate = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateScrollEffects);
  };

  window.addEventListener('scroll', requestScrollUpdate, { passive: true });
  window.addEventListener('resize', requestScrollUpdate);
  updateScrollEffects();

  const revealItems = document.querySelectorAll('[data-reveal]');
  document.querySelectorAll('.evidence-grid, .principles-grid, .history-timeline').forEach((group) => {
    [...group.children]
      .filter((item) => item.matches('[data-reveal]'))
      .forEach((item, index) => item.style.setProperty('--reveal-delay', `${Math.min(index, 4) * 85}ms`));
  });

  if (reducedMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.08 }
    );
    revealItems.forEach((item) => revealObserver.observe(item));
  }

  const storyChapters = [...document.querySelectorAll('[data-story-chapter]')];
  const storyImages = [...document.querySelectorAll('[data-story-image]')];
  const storyIndex = document.querySelector('.story-frame-index');
  let activeStoryIndex = Math.max(storyChapters.findIndex((chapter) => chapter.classList.contains('is-active')), 0);
  const setActiveStory = (index) => {
    const nextIndex = Number(index);
    if (!Number.isInteger(nextIndex) || nextIndex === activeStoryIndex) return;
    activeStoryIndex = nextIndex;

    storyChapters.forEach((chapter) => {
      chapter.classList.toggle('is-active', chapter.dataset.storyChapter === String(nextIndex));
    });
    storyImages.forEach((image) => {
      image.classList.toggle('is-active', image.dataset.storyImage === String(nextIndex));
    });
    if (storyIndex) storyIndex.textContent = `${String(nextIndex + 1).padStart(2, '0')} — 03`;
  };

  if (storyChapters.length) {
    updateActiveStory = () => {
      const focusY = window.innerHeight * 0.5;
      let nearestIndex = 0;
      let nearestDistance = Number.POSITIVE_INFINITY;

      storyChapters.forEach((chapter, index) => {
        const rect = chapter.getBoundingClientRect();
        const chapterCenter = rect.top + rect.height * 0.5;
        const distance = Math.abs(chapterCenter - focusY);
        if (distance >= nearestDistance) return;
        nearestDistance = distance;
        nearestIndex = index;
      });

      setActiveStory(nearestIndex);
    };
    updateActiveStory();
  }

  const navLinks = [...document.querySelectorAll('[data-nav-link]')];
  const navSections = document.querySelectorAll('[data-nav-section]');
  if ('IntersectionObserver' in window && navLinks.length) {
    const navObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.dataset.navSection;
          navLinks.forEach((link) => {
            link.classList.toggle('is-active', link.dataset.navLink === id);
          });
        });
      },
      { rootMargin: '-28% 0px -64% 0px', threshold: 0 }
    );
    navSections.forEach((section) => navObserver.observe(section));
  }

  const counter = document.querySelector('[data-count]');
  if (counter && 'IntersectionObserver' in window && !reducedMotion) {
    const targetValue = Number(counter.dataset.count);
    counter.textContent = '0';
    const countObserver = new IntersectionObserver(
      (entries, observer) => {
        if (!entries[0].isIntersecting) return;
        const duration = 1600;
        const start = performance.now();
        const tick = (now) => {
          const elapsed = clamp((now - start) / duration, 0, 1);
          const eased = 1 - Math.pow(1 - elapsed, 4);
          counter.textContent = Math.round(targetValue * eased).toLocaleString('ko-KR');
          if (elapsed < 1) window.requestAnimationFrame(tick);
        };
        window.requestAnimationFrame(tick);
        observer.disconnect();
      },
      { threshold: 0.45 }
    );
    countObserver.observe(counter);
  }

  if (finePointer && !reducedMotion) {
    const interactiveFrames = [
      ...document.querySelectorAll('.story-stage, .evidence-card, .network-reel figure, .ceo-image')
    ];

    window.addEventListener(
      'pointermove',
      (event) => {
        root.style.setProperty('--pointer-x', `${event.clientX}px`);
        root.style.setProperty('--pointer-y', `${event.clientY}px`);
        root.style.setProperty('--pointer-opacity', '1');
      },
      { passive: true }
    );

    document.documentElement.addEventListener('mouseleave', () => {
      root.style.setProperty('--pointer-opacity', '0');
    });

    interactiveFrames.forEach((frame) => {
      frame.addEventListener('pointermove', (event) => {
        const rect = frame.getBoundingClientRect();
        const normalizedX = clamp((event.clientX - rect.left) / rect.width, 0, 1);
        const normalizedY = clamp((event.clientY - rect.top) / rect.height, 0, 1);
        const centeredX = normalizedX - 0.5;
        const centeredY = normalizedY - 0.5;

        frame.style.setProperty('--local-x', `${(normalizedX * 100).toFixed(1)}%`);
        frame.style.setProperty('--local-y', `${(normalizedY * 100).toFixed(1)}%`);
        frame.style.setProperty('--tilt-x', `${(-centeredY * 2.2).toFixed(2)}deg`);
        frame.style.setProperty('--tilt-y', `${(centeredX * 2.8).toFixed(2)}deg`);
        frame.style.setProperty('--shift-x', `${(centeredX * 10).toFixed(1)}px`);
        frame.style.setProperty('--shift-y', `${(centeredY * 8).toFixed(1)}px`);
      });

      frame.addEventListener('pointerleave', () => {
        frame.style.setProperty('--local-x', '50%');
        frame.style.setProperty('--local-y', '50%');
        frame.style.setProperty('--tilt-x', '0deg');
        frame.style.setProperty('--tilt-y', '0deg');
        frame.style.setProperty('--shift-x', '0px');
        frame.style.setProperty('--shift-y', '0px');
      });
    });

    document.querySelectorAll('[data-magnetic]').forEach((link) => {
      link.addEventListener('pointermove', (event) => {
        const rect = link.getBoundingClientRect();
        const x = (event.clientX - rect.left - rect.width / 2) * 0.08;
        const y = (event.clientY - rect.top - rect.height / 2) * 0.12;
        link.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      });
      link.addEventListener('pointerleave', () => {
        link.style.transform = '';
      });
    });
  }

  document.querySelectorAll('[data-store-link]').forEach((link) => {
    link.addEventListener('click', () => {
      if (typeof window.fbq === 'function') {
        window.fbq('trackCustom', 'OfficialStoreClick', {
          button_name: 'store_view',
          destination: 'naver_smartstore'
        });
      }
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'official_store_click', {
          button_name: 'store_view',
          destination: 'naver_smartstore'
        });
      }
    });
  });
})();
