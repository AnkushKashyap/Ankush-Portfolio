document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // 1. MANDATORY INTRO VIDEO (SOUND ON BY DEFAULT)
  // ==========================================
  const loader = document.getElementById('intro-loader');
  const video = document.getElementById('intro-video');

  let isExited = false;
  let customCursorInitialized = false;

  // Unmute function to guarantee sound is ON
  function ensureSoundOn() {
    if (!video) return;
    video.muted = false;
    video.volume = 1.0;
    if (video.paused && !isExited && !video.ended) {
      video.play().catch(() => {});
    }
  }

  // Set sound ON by default
  video.muted = false;
  video.volume = 1.0;

  // Play immediately with sound ON
  const startPlay = video.play();
  if (startPlay !== undefined) {
    startPlay.catch((err) => {
      // If browser strict autoplay policy restricts audio prior to a gesture,
      // begin playback muted and immediately unmute on the earliest interaction
      console.info('Browser policy deferred audio until user interaction:', err.message);
      video.muted = true;
      video.play().catch(() => {});
    });
  }

  // Unmute immediately on any user gesture anywhere on screen
  if (loader) {
    loader.addEventListener('click', ensureSoundOn);
  }
  window.addEventListener('pointerdown', ensureSoundOn, { once: true });
  window.addEventListener('keydown', ensureSoundOn, { once: true });
  window.addEventListener('touchstart', ensureSoundOn, { once: true, passive: true });

  // Guard: If browser pauses video while intro is active, resume immediately
  video.addEventListener('pause', () => {
    if (!isExited && !video.ended) {
      video.play().catch(() => {});
    }
  });

  // Function called ONLY when video has completely finished playing
  function onVideoFinished() {
    if (isExited) return;
    isExited = true;

    // Fade out overlay to reveal dark hero webpage
    loader.classList.add('fade-out');
    document.body.classList.remove('intro-active');

    // Pause video to free up memory
    setTimeout(() => {
      video.pause();
    }, 900);

    // Initialize custom cursor ONLY after video is done
    if (!customCursorInitialized) {
      customCursorInitialized = true;
      initCustomCursor();
    }

    // Trigger hero entrance (pop out from bottom + typewriter + floating)
    triggerHeroEntrance();
  }

  video.addEventListener('ended', onVideoFinished);
  video.addEventListener('error', onVideoFinished);

  // Desktop convenience: Escape key can finish intro video early during testing
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !isExited) {
      onVideoFinished();
    }
  });

  // ==========================================
  // 2. HERO ENTRANCE, TYPEWRITER & SCROLL RE-TRIGGER
  // ==========================================
  const heroCard = document.querySelector('.hero-card');
  const heroSection = document.getElementById('hero-section');
  const bylines = document.querySelectorAll('.hero-byline');
  const bylineTargetText = (bylines[0] && bylines[0].getAttribute('data-text')) || 'CREATOR / DEVELOPER / PHOTOGRAPHER';

  let typewriterTimer = null;
  let floatingTimer = null;
  let isHeroActive = false;

  function startTypewriter() {
    if (typewriterTimer) clearInterval(typewriterTimer);
    bylines.forEach((el) => { el.textContent = ''; });
    if (heroCard) heroCard.classList.add('is-typing');

    let charIndex = 0;
    typewriterTimer = setInterval(() => {
      charIndex++;
      const current = bylineTargetText.slice(0, charIndex);
      // Synchronize both solid and outline text layers simultaneously
      bylines.forEach((el) => { el.textContent = current; });

      if (charIndex >= bylineTargetText.length) {
        clearInterval(typewriterTimer);
        typewriterTimer = null;
        setTimeout(() => {
          if (heroCard) heroCard.classList.remove('is-typing');
        }, 1200);
      }
    }, 40);
  }

  function resetTypewriter() {
    if (typewriterTimer) {
      clearInterval(typewriterTimer);
      typewriterTimer = null;
    }
    bylines.forEach((el) => { el.textContent = ''; });
    if (heroCard) heroCard.classList.remove('is-typing');
  }

  function triggerHeroEntrance() {
    if (isHeroActive) return;
    isHeroActive = true;

    if (floatingTimer) clearTimeout(floatingTimer);

    // 1. Reset any previous floating and trigger bottom pop-up entrance
    if (heroCard) {
      heroCard.classList.remove('is-floating');
      heroCard.classList.add('is-revealed');
    }

    // 2. Start typewriter intro for byline as ANKUSH rises
    setTimeout(() => {
      if (isHeroActive) {
        startTypewriter();
      }
    }, 300);

    // 3. Once entrance pop-up completes (~1.2s), smoothly start floating style
    floatingTimer = setTimeout(() => {
      if (isHeroActive && heroCard) {
        heroCard.classList.add('is-floating');
      }
    }, 1200);
  }

  function resetHeroEntrance() {
    if (!isHeroActive) return;
    isHeroActive = false;

    if (floatingTimer) {
      clearTimeout(floatingTimer);
      floatingTimer = null;
    }
    resetTypewriter();

    if (heroCard) {
      heroCard.classList.remove('is-revealed');
      heroCard.classList.remove('is-floating');
    }
  }

  // IntersectionObserver: Re-triggers on scroll down and scroll back up
  if ('IntersectionObserver' in window && heroSection) {
    const heroObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        // Do not process scroll observer triggers until intro video is done
        if (!isExited) return;

        if (entry.isIntersecting && entry.intersectionRatio >= 0.25) {
          triggerHeroEntrance();
        } else if (!entry.isIntersecting || entry.intersectionRatio < 0.1) {
          resetHeroEntrance();
        }
      });
    }, {
      threshold: [0, 0.1, 0.25, 0.5]
    });

    heroObserver.observe(heroSection);
  }

  // ==========================================
  // 3. ROUND WHITE CURSOR (ZERO TOP-LEFT GLITCH)
  // ==========================================
  function initCustomCursor() {
    // Only enable on desktop with fine mouse pointer
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    // Outer container
    const cursorContainer = document.createElement('div');
    cursorContainer.className = 'custom-cursor';

    // Position wrapper (handles translate3d ONLY - never touched by animations)
    const cursorDot = document.createElement('div');
    cursorDot.className = 'cursor-dot';

    // Visual inner element (handles bounce scale ONLY - never moves from center)
    const cursorDotInner = document.createElement('div');
    cursorDotInner.className = 'cursor-dot-inner';
    cursorDot.appendChild(cursorDotInner);
    cursorContainer.appendChild(cursorDot);

    // 6 trailing dots (fluid, visible trail)
    const trailConfigs = [
      { size: 10.5, opacity: 0.60 },
      { size: 8.5, opacity: 0.48 },
      { size: 7.0, opacity: 0.38 },
      { size: 5.5, opacity: 0.28 },
      { size: 4.0, opacity: 0.18 },
      { size: 2.5, opacity: 0.10 }
    ];

    const trails = trailConfigs.map((cfg) => {
      const dot = document.createElement('div');
      dot.className = 'cursor-trail-dot';
      dot.style.width = cfg.size + 'px';
      dot.style.height = cfg.size + 'px';
      dot.style.opacity = cfg.opacity;
      cursorContainer.appendChild(dot);
      return { el: dot, x: -100, y: -100 };
    });

    document.body.appendChild(cursorContainer);

    let mouseX = -100;
    let mouseY = -100;
    let isVisible = false;
    let prevTime = performance.now();

    function damp(curr, target, speed, dt) {
      return curr + (target - curr) * (1 - Math.exp(-speed * dt));
    }

    // Pointer move listener
    window.addEventListener('pointermove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!isVisible) {
        isVisible = true;
        cursorContainer.classList.add('is-active');
        trails.forEach((t) => {
          t.x = mouseX;
          t.y = mouseY;
        });
      }
    }, { passive: true });

    // Click Bounce Effect (Only animates cursorDotInner so position never resets to (0,0))
    window.addEventListener('pointerdown', () => {
      cursorDotInner.classList.remove('is-bouncing');
      void cursorDotInner.offsetWidth; // Force reflow
      cursorDotInner.classList.add('is-bouncing');
    });

    cursorDotInner.addEventListener('animationend', () => {
      cursorDotInner.classList.remove('is-bouncing');
    });

    // Hide when leaving window
    document.documentElement.addEventListener('pointerleave', () => {
      cursorContainer.classList.remove('is-active');
      isVisible = false;
    });

    // Animation render loop
    function render(now) {
      const dt = Math.min(0.05, (now - prevTime) / 1000);
      prevTime = now;

      if (isVisible) {
        // Position wrapper moved to mouse position
        cursorDot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;

        // Update trailing dots
        let leaderX = mouseX;
        let leaderY = mouseY;

        trails.forEach((t) => {
          t.x = damp(t.x, leaderX, 26, dt);
          t.y = damp(t.y, leaderY, 26, dt);
          t.el.style.transform = `translate3d(${t.x}px, ${t.y}px, 0) translate(-50%, -50%)`;

          leaderX = t.x;
          leaderY = t.y;
        });
      }

      requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
  }

  // ==========================================
  // 4. SERVICES ROLLER FOCUS & BLUR ON SCROLL + DYNAMIC STICKY CENTERING
  // ==========================================
  const serviceItems = document.querySelectorAll('.service-item');
  const servicesSection = document.getElementById('section-services');
  const servicesStickyContent = document.querySelector('.services-sticky-content');

  function adjustStickyTop() {
    if (servicesStickyContent && window.innerWidth > 900) {
      const h = servicesStickyContent.offsetHeight;
      const topOffset = Math.max(20, Math.round((window.innerHeight - h) / 2));
      servicesStickyContent.style.top = `${topOffset}px`;
    } else if (servicesStickyContent) {
      servicesStickyContent.style.top = '';
    }
  }

  adjustStickyTop();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(adjustStickyTop);
  }

  if (serviceItems.length > 0 && servicesSection) {
    let rollerTicking = false;

    function updateServiceBlur() {
      // On mobile view where items stack, keep all sharp
      if (window.innerWidth <= 900) {
        serviceItems.forEach((item) => {
          item.style.opacity = '1';
          item.style.filter = 'none';
          item.style.transform = 'none';
        });
        rollerTicking = false;
        return;
      }

      // Focal center in viewport matching the vertically-centered sticky left side (50% from top)
      const focalY = window.innerHeight * 0.50;

      serviceItems.forEach((item) => {
        const rect = item.getBoundingClientRect();
        const itemCenter = rect.top + rect.height / 2;
        const dist = itemCenter - focalY;

        let opacity = 1;
        let blur = 0;
        let scale = 1;

        if (dist < -100) {
          // Scrolled above the focus zone: drifts up, fades and blurs out
          const progress = Math.min(1, Math.max(0, (-dist - 100) / 280));
          opacity = 1 - progress * 0.90;
          blur = progress * 10;
          scale = 1 - progress * 0.04;
        } else if (dist > 140) {
          // Below the focus zone: enters blurred and sharpens as it approaches
          const progress = Math.min(1, Math.max(0, (dist - 140) / 360));
          opacity = 1 - progress * 0.88;
          blur = progress * 12;
          scale = 1 - progress * 0.03;
        } else {
          // In sharp focal zone
          opacity = 1;
          blur = 0;
          scale = 1;
        }

        item.style.opacity = opacity.toFixed(3);
        item.style.filter = blur > 0.2 ? `blur(${blur.toFixed(1)}px)` : 'none';
        item.style.transform = `scale(${scale.toFixed(3)})`;
      });

      rollerTicking = false;
    }

    window.addEventListener('scroll', () => {
      if (!rollerTicking) {
        requestAnimationFrame(updateServiceBlur);
        rollerTicking = true;
      }
    }, { passive: true });

    window.addEventListener('resize', () => {
      adjustStickyTop();
      if (!rollerTicking) {
        requestAnimationFrame(updateServiceBlur);
        rollerTicking = true;
      }
    }, { passive: true });

    // Initial pass
    updateServiceBlur();
  }

  // ==========================================
  // 5. EASTER EGG: FLOATING BOUNCING CAMERA & FULL-SCREEN FLASH WITH SHUTTER SOUND
  // ==========================================
  const camWidget = document.getElementById('floating-camera');
  const flashOverlay = document.getElementById('camera-flash-overlay');

  if (camWidget && flashOverlay) {
    let tCamRestore = null;

    // Preload camera flash audio
    const flashAudio = new Audio('flash.mp3');
    flashAudio.preload = 'auto';

    camWidget.addEventListener('click', () => {
      if (tCamRestore) clearTimeout(tCamRestore);

      // 1. Play realistic shutter flash audio immediately on click
      try {
        flashAudio.currentTime = 0;
        const playPromise = flashAudio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('Flash audio playback caught:', err);
          });
        }
      } catch (e) {
        console.warn('Flash audio error:', e);
      }

      // 2. Trigger camflash.png on camera widget
      camWidget.classList.remove('is-flashing');
      void camWidget.offsetWidth; // Force reflow
      camWidget.classList.add('is-flashing');

      // 3. Trigger full-screen white flash: holds pure white for ~1.3s, then smoothly fades out over ~6.5s
      flashOverlay.classList.remove('is-flashing');
      void flashOverlay.offsetWidth; // Force reflow to immediately restart animation on repeated clicks
      flashOverlay.classList.add('is-flashing');

      // 4. Restore camera icon to cam.png behind the white flash (~600ms)
      tCamRestore = setTimeout(() => {
        camWidget.classList.remove('is-flashing');
      }, 600);
    });

    flashOverlay.addEventListener('animationend', () => {
      flashOverlay.classList.remove('is-flashing');
    });
  }

  // ==========================================
  // 6. SECTION 4: PINNED PINBOARD SCROLL-DRIVEN COLLAGE
  // ==========================================
  const pinboardTrack = document.getElementById('section-projects');
  const pinCards = document.querySelectorAll('.pin-card');

  if (pinboardTrack && pinCards.length > 0) {
    let pinTicking = false;

    // Target positions for each card on desktop (>768px):
    // Offset X (vw from center), Offset Y (vh from center), Rotation (deg)
    // Sized generously (36vw) with offsets (-24, -7, +8, +25) to create deep >50% continuous overlapping
    const cardTargetsDesktop = [
      { x: -24, y: -10, rot: -4.5 },   // Card 1: Top-Left
      { x: -7,  y: 16,  rot: 2.2 },    // Card 2: Bottom-Center-Left (overlaps Card 1 by >50%)
      { x: 8,   y: -8,  rot: -2.5 },   // Card 3: Top-Center-Right (overlaps Card 2 by >50%)
      { x: 25,  y: 14,  rot: 3.8 }     // Card 4: Bottom-Right (overlaps Card 3 by >50%)
    ];

    // Mobile targets (stacked in center with alternating organic tilt)
    const cardTargetsMobile = [
      { x: 0, y: -24, rot: -2.5 },
      { x: 0, y: -8,  rot: 2.0 },
      { x: 0, y: 8,   rot: -1.8 },
      { x: 0, y: 24,  rot: 3.0 }
    ];

    // Scroll progress windows where each card enters one by one
    const cardWindows = [
      { start: 0.08, end: 0.26 },
      { start: 0.28, end: 0.46 },
      { start: 0.48, end: 0.66 },
      { start: 0.68, end: 0.86 }
    ];

    function updatePinboard() {
      const rect = pinboardTrack.getBoundingClientRect();
      const maxScroll = pinboardTrack.offsetHeight - window.innerHeight;

      if (maxScroll <= 0) {
        pinTicking = false;
        return;
      }

      // Scroll progress through the track: 0.0 (just reached) to 1.0 (bottom reached)
      const scrollDist = -rect.top;
      const progress = Math.min(1.0, Math.max(0.0, scrollDist / maxScroll));
      const isMobile = window.innerWidth <= 768;
      const targets = isMobile ? cardTargetsMobile : cardTargetsDesktop;

      pinCards.forEach((card, idx) => {
        const target = targets[idx] || targets[0];
        const win = cardWindows[idx] || cardWindows[0];

        let ease = 0;
        if (progress >= win.end) {
          // Card fully arrived and settled
          ease = 1;
        } else if (progress > win.start) {
          // Card in flight: glide in from bottom
          const t = (progress - win.start) / (win.end - win.start);
          // Smooth cubic ease-out
          ease = 1 - Math.pow(1 - t, 3);
        } else {
          // Not yet entering
          ease = 0;
        }

        // When ease is 0, card is below the viewport (+120vh)
        // When ease is 1, card is at target position
        const currentY = target.y + (1 - ease) * 115; // in vh
        const currentX = target.x;                    // in vw
        const currentRot = target.rot + (1 - ease) * 6; // slight entrance tilt
        const currentScale = 0.88 + ease * 0.12;
        const currentOpacity = Math.min(1, ease * 1.6);

        // Store transform in CSS variable so hover can scale from the current state
        const transformStr = `translate3d(calc(-50% + ${currentX}vw), calc(-50% + ${currentY}vh), 0) scale(${currentScale.toFixed(3)}) rotate(${currentRot.toFixed(2)}deg)`;
        
        card.style.transform = transformStr;
        card.style.opacity = currentOpacity.toFixed(3);
        card.style.setProperty('--current-transform', transformStr);
        card.style.pointerEvents = ease > 0.8 ? 'auto' : 'none';
      });

      pinTicking = false;
    }

    window.addEventListener('scroll', () => {
      if (!pinTicking) {
        requestAnimationFrame(updatePinboard);
        pinTicking = true;
      }
    }, { passive: true });

    window.addEventListener('resize', () => {
      if (!pinTicking) {
        requestAnimationFrame(updatePinboard);
        pinTicking = true;
      }
    }, { passive: true });

    // Initial pass
    updatePinboard();
  }

  // ==========================================
  // 7. FOOTER: SMOOTH BACK TO TOP
  // ==========================================
  const backToTopBtn = document.getElementById('back-to-top-btn');
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }
});
