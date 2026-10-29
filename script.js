/* ==========================================================================
   JOÃO MATOS — PORTFOLIO CORE SCRIPTS (RESTORED SHADER & CLEAN REFINEMENTS)
   ========================================================================== */

(() => {
  "use strict";

  const MOTION_SPEED = 1.5;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  /* --------------------------------------------------------------------------
     1. EXACT ORIGINAL FLUID BACKGROUND (Aubergine / Plum Domain Warp)
     -------------------------------------------------------------------------- */
  const initFluidBackground = () => {
    const canvas = document.getElementById("fluid-bg");
    if (!canvas || prefersReducedMotion) return;

    const isTouchDevice =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;
    const isLowPowerDevice = (navigator.hardwareConcurrency || 4) <= 4;

    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      preserveDrawingBuffer: false,
      powerPreference: "low-power",
    });

    if (!gl) {
      console.warn("WebGL not available");
      return;
    }

    let mouseX = 0.5;
    let mouseY = 0.5;
    let smoothMouseX = 0.5;
    let smoothMouseY = 0.5;

    window.addEventListener(
      "mousemove",
      (e) => {
        mouseX = Math.max(0.2, Math.min(0.8, e.clientX / window.innerWidth));
        mouseY = Math.max(0.2, Math.min(0.8, e.clientY / window.innerHeight));
      },
      { passive: true },
    );

    const vertexSource = `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fragmentSource = `
      precision highp float;

      uniform float u_time;
      uniform vec2  u_resolution;
      uniform vec2  u_mouse;

      // Simplex noise
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
          -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy));
        vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m * m;
        m = m * m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
        vec3 g;
        g.x = a0.x * x0.x + h.x * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution;
        float aspect = u_resolution.x / u_resolution.y;
        vec2 p = vec2((uv.x - 0.5) * aspect, uv.y - 0.5);
        float t = u_time;

        // Background
        vec3 bgColor = vec3(0.027, 0.021, 0.043);

        // Mouse position (centered coords, Y inverted)
        vec2 mouse = vec2((u_mouse.x - 0.5) * aspect, 0.5 - u_mouse.y);

        // Domain warping — two passes for organic, smooth deformation
        // First warp layer (very slow, large scale)
        float warp1x = snoise(p * 0.8 + vec2(t * 0.04, 0.0)) * 0.3;
        float warp1y = snoise(p * 0.8 + vec2(0.0, t * 0.035)) * 0.3;
        vec2 q = p + vec2(warp1x, warp1y);

        // Second warp layer (feeds back, creates depth)
        float warp2x = snoise(q * 1.2 + vec2(t * 0.025, 1.7)) * 0.15;
        float warp2y = snoise(q * 1.2 + vec2(3.2, t * 0.03)) * 0.15;
        vec2 r = q + vec2(warp2x, warp2y);

        // Combine into a smooth field
        float n1 = snoise(r * 1.0 + t * 0.02) * 0.5 + 0.5;
        float n2 = snoise(r * 1.6 - t * 0.015 + 5.0) * 0.5 + 0.5;
        float n3 = snoise(r * 0.6 + t * 0.03 + 10.0) * 0.5 + 0.5;

        // Blend noise layers smoothly
        float field = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;

        // Mouse influence — gentle radial push into the field
        float mouseDist = length(p - mouse);
        float mouseInfluence = smoothstep(0.6, 0.0, mouseDist) * 0.25;
        field += mouseInfluence;

        // Muted aubergine palette with a restrained violet lift
        vec3 aubergine = vec3(0.045, 0.035, 0.07);
        vec3 plum = vec3(0.08, 0.055, 0.11);
        vec3 blackberry = vec3(0.12, 0.075, 0.15);
        vec3 purpleAccent = vec3(0.18, 0.11, 0.23);

        // Smooth color transitions across the field
        vec3 color = mix(aubergine, plum, smoothstep(0.3, 0.65, field));
        color = mix(color, blackberry, smoothstep(0.52, 0.84, field) * 0.46);
        color = mix(color, purpleAccent, smoothstep(0.68, 0.94, field) * 0.16);

        // Vignette — darken edges smoothly
        float vignette = 1.0 - smoothstep(0.3, 1.1, length(p * 0.9));

        // Final composite — subtle, refined blend
        float opacity = 0.3 * vignette;
        vec3 finalColor = mix(bgColor, color, opacity);

        // Match the existing monochrome treatment without a fullscreen CSS filter.
        float gray = dot(finalColor, vec3(0.2126, 0.7152, 0.0722));
        gl_FragColor = vec4(vec3(gray), 1.0);
      }
    `;

    const compileShader = (source, type) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = compileShader(vertexSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(fragmentSource, gl.FRAGMENT_SHADER);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const aPosition = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, "u_time");
    const uResolution = gl.getUniformLocation(program, "u_resolution");
    const uMouse = gl.getUniformLocation(program, "u_mouse");

    const renderScale = prefersReducedMotion
      ? 0.6
      : isLowPowerDevice || isTouchDevice
        ? 0.45
        : 0.6;
    let dpr = Math.min(window.devicePixelRatio || 1, 1.25);

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      canvas.width = Math.round(window.innerWidth * dpr * renderScale);
      canvas.height = Math.round(window.innerHeight * dpr * renderScale);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
    };

    window.addEventListener("resize", resize, { passive: true });
    resize();

    let animationId = null;
    const startTime = performance.now();
    const targetFrameMs = 1000 / 30;
    let lastFrameTime = 0;

    const animate = (now) => {
      if (now - lastFrameTime >= targetFrameMs) {
        lastFrameTime = now;
        const elapsed = (now - startTime) * 0.001 * MOTION_SPEED;

        smoothMouseX += (mouseX - smoothMouseX) * (1 - Math.pow(1 - 0.05, MOTION_SPEED));
        smoothMouseY += (mouseY - smoothMouseY) * (1 - Math.pow(1 - 0.05, MOTION_SPEED));

        gl.uniform1f(uTime, elapsed);
        gl.uniform2f(uMouse, smoothMouseX, smoothMouseY);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }

      animationId = requestAnimationFrame(animate);
    };

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        if (animationId) cancelAnimationFrame(animationId);
      } else {
        lastFrameTime = performance.now();
        animationId = requestAnimationFrame(animate);
      }
    });

    animationId = requestAnimationFrame(animate);
  };

  /* --------------------------------------------------------------------------
     2. EXACT ORIGINAL BLOB MASK & ENHANCED PHOTO MOVEMENT
     -------------------------------------------------------------------------- */
  const initBlobMask = () => {
    const blobPath = document.getElementById("blob-path");
    const pictureEl = document.querySelector(".hero__picture");
    if (!blobPath) return;

    const numPoints = 12;
    const baseRadius = 0.48;
    const maxRadius = 0.5;

    let globalMouseX = 0.5;
    let globalMouseY = 0.5;
    let smoothMouseX = 0.5;
    let smoothMouseY = 0.5;
    let isHovering = false;

    const isTouchDevice =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;

    window.addEventListener(
      "mousemove",
      (e) => {
        globalMouseX = e.clientX / window.innerWidth;
        globalMouseY = e.clientY / window.innerHeight;
        isHovering = true;
      },
      { passive: true },
    );

    window.addEventListener(
      "mouseleave",
      () => {
        isHovering = false;
      },
      { passive: true },
    );

    const getPoints = (t) => {
      const pts = [];
      for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2 - Math.PI / 2;
        // Organic wobble for liquid feel
        const wobble =
          Math.sin(t * 0.35 + i * 1.0) * 0.03 +
          Math.sin(t * 0.55 + i * 0.5 + 1.2) * 0.025 +
          Math.cos(t * 0.2 + i * 1.3) * 0.02;
        const r = Math.min(baseRadius + wobble, maxRadius);

        let x = 0.5 + Math.cos(angle) * r;
        let y = 0.5 + Math.sin(angle) * r;

        // Organic bump effect towards mouse
        if (!isTouchDevice && isHovering) {
          const dx = smoothMouseX - x;
          const dy = smoothMouseY - y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          const bumpRadius = 0.35;
          const bumpStrength = 0.12;
          const bump = Math.max(0, 1 - dist / bumpRadius);
          const bumpFactor = bump * bump * bumpStrength;

          x += dx * bumpFactor;
          y += dy * bumpFactor;
        }

        pts.push({ x, y });
      }
      return pts;
    };

    const buildPath = (pts) => {
      const n = pts.length;
      let d = `M ${pts[0].x} ${pts[0].y}`;
      const tension = 5;
      for (let i = 0; i < n; i++) {
        const p0 = pts[(i - 1 + n) % n];
        const p1 = pts[i];
        const p2 = pts[(i + 1) % n];
        const p3 = pts[(i + 2) % n];
        const cp1x = p1.x + (p2.x - p0.x) / tension;
        const cp1y = p1.y + (p2.y - p0.y) / tension;
        const cp2x = p2.x - (p3.x - p1.x) / tension;
        const cp2y = p2.y - (p3.y - p1.y) / tension;
        d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
      }
      return d;
    };

    const headingDotPaths = [0, 1, 2, 3]
      .map((i) => document.getElementById(`heading-dot-path-${i}`))
      .filter(Boolean);
    const headingDotPhases = [0.35, 2.1, 4.45, 6.2];
    const headingDotSpeeds = [1.9, 2.25, 1.65, 2.55];

    const getHeadingDotPoints = (t) => {
      const pts = [];
      for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2 - Math.PI / 2;
        const wobble =
          Math.sin(t * 0.7 + i * 1.2) * 0.055 +
          Math.sin(t * 1.05 + i * 0.7 + 1.2) * 0.04 +
          Math.cos(t * 0.45 + i * 1.6) * 0.035;
        const r = Math.min(0.42 + wobble, 0.5);

        pts.push({
          x: 0.5 + Math.cos(angle) * r,
          y: 0.5 + Math.sin(angle) * r,
        });
      }
      return pts;
    };

    let blobVisible = true;
    let blobAnimationId = null;
    let lastBlobFrameTime = 0;
    const blobTargetFrameMs = prefersReducedMotion ? 1000 / 20 : 1000 / 30;

    const updateBlob = (now) => {
      blobAnimationId = null;
      if (document.hidden || !blobVisible) return;
      if (now - lastBlobFrameTime >= blobTargetFrameMs) {
        lastBlobFrameTime = now;
        const t = now * 0.001 * MOTION_SPEED;

        if (isHovering && !isTouchDevice) {
          smoothMouseX += (globalMouseX - smoothMouseX) * (1 - Math.pow(1 - 0.05, MOTION_SPEED));
          smoothMouseY += (globalMouseY - smoothMouseY) * (1 - Math.pow(1 - 0.05, MOTION_SPEED));
        } else {
          smoothMouseX += (0.5 - smoothMouseX) * (1 - Math.pow(1 - 0.03, MOTION_SPEED));
          smoothMouseY += (0.5 - smoothMouseY) * (1 - Math.pow(1 - 0.03, MOTION_SPEED));
        }

        if (blobVisible) {
          blobPath.setAttribute("d", buildPath(getPoints(t)));
        }

        headingDotPaths.forEach((path, i) => {
          path.setAttribute(
            "d",
            buildPath(
              getHeadingDotPoints(t * headingDotSpeeds[i] + headingDotPhases[i]),
            ),
          );
        });
      }

      if (!prefersReducedMotion) blobAnimationId = requestAnimationFrame(updateBlob);
    };

    const heroSection = document.getElementById("hero");
    if (heroSection) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            blobVisible = entry.isIntersecting;
            if (blobVisible && blobAnimationId === null) {
              blobAnimationId = requestAnimationFrame(updateBlob);
            }
          });
        },
        { threshold: 0 },
      );
      observer.observe(heroSection);
    }

    document.addEventListener("visibilitychange", () => {
      if (document.hidden && blobAnimationId !== null) {
        cancelAnimationFrame(blobAnimationId);
        blobAnimationId = null;
      } else if (!document.hidden && blobVisible && blobAnimationId === null) {
        blobAnimationId = requestAnimationFrame(updateBlob);
      }
    });
    blobAnimationId = requestAnimationFrame(updateBlob);
  };

  /* --------------------------------------------------------------------------
     3. CLEAN HEADER & SCROLL-SPY
     -------------------------------------------------------------------------- */
  let setActiveNavInk = () => {};
  const initFluidNavigation = () => {
    const links = Array.from(document.querySelectorAll(".nav-link"));
    const menu = document.querySelector(".header__menu");
    const labels = links.map((link) => {
      const label = document.createElement("span");
      label.className = "nav-label";
      label.textContent = link.textContent.trim();
      link.replaceChildren(label);
      return label;
    });
    let activeIndex = -1;
    const solid = (index, color) => {
      if (index >= 0) labels[index].style.backgroundImage = `linear-gradient(${color}, ${color})`;
    };
    const positionNavInk = (index, animate = true) => {
      if (!menu || index < 0) return;
      if (!animate) menu.classList.add("nav-ink-no-transition");
      menu.style.setProperty("--nav-ink-left", `${links[index].offsetLeft}px`);
      menu.style.setProperty("--nav-ink-width", `${links[index].offsetWidth}px`);
      if (!animate) requestAnimationFrame(() => menu.classList.remove("nav-ink-no-transition"));
    };
    setActiveNavInk = (id) => {
      const nextIndex = links.findIndex((link) => link.dataset.section === id);
      if (nextIndex === activeIndex) return;
      const previousIndex = activeIndex;
      activeIndex = nextIndex;
      positionNavInk(nextIndex, previousIndex >= 0 && !prefersReducedMotion);
      labels.forEach((label, index) => solid(index,
        index === activeIndex ? "var(--text1)" : "var(--text-muted)"));
    };
  };

  const initHeaderScrollSpy = () => {
    const header = document.querySelector(".header");
    const scrollbar = document.querySelector(".custom-scrollbar");
    const scrollbarThumb = document.querySelector(".custom-scrollbar__thumb");
    const hero = document.getElementById("hero");
    const navLinks = document.querySelectorAll(".nav-link");
    const sections = document.querySelectorAll("section[id]");

    if (!header) return;

    let scrollFrame = null;

    const updateScrollbar = () => {
      if (!scrollbarThumb || !scrollbar.getClientRects().length) return;
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
      const trackHeight = document
        .querySelector(".custom-scrollbar")
        ?.getBoundingClientRect().height ?? 0;
      const thumbHeight = scrollableHeight > 0
        ? Math.max(32, trackHeight * (window.innerHeight / document.documentElement.scrollHeight))
        : trackHeight;
      const maxOffset = Math.max(0, trackHeight - thumbHeight);
      const offset = scrollableHeight > 0
        ? (window.scrollY / scrollableHeight) * maxOffset
        : 0;
      scrollbarThumb.style.height = `${thumbHeight}px`;
      scrollbarThumb.style.transform = `translateY(${offset}px)`;
    };

    const sectionMarkers = Array.from(sections, (section) => ({
      id: section.id,
      element: section.querySelector(".section__header") || section,
    }));
    const updateActiveSection = () => {
      const activationLine = header.getBoundingClientRect().height +
        Math.max(28, window.innerHeight * 0.15);
      let currentId = null;
      for (const marker of sectionMarkers) {
        if (marker.element.getBoundingClientRect().top <= activationLine)
          currentId = marker.id;
      }
      if (window.scrollY > 0 && window.scrollY + window.innerHeight >=
          document.documentElement.scrollHeight - 2) {
        currentId = sectionMarkers.at(-1)?.id ?? currentId;
      }
      setActiveNavInk(currentId);
      navLinks.forEach((link) => {
        const isActive = link.getAttribute("data-section") === currentId;
        link.classList.toggle("is-active", isActive);
        if (isActive) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    };

    const scheduleScrollbarUpdate = () => {
      if (scrollFrame !== null) return;
      scrollFrame = window.requestAnimationFrame(() => {
        scrollFrame = null;
        updateScrollbar();
        updateActiveSection();
        updateHeader();
      });
    };

    let headerScrollOverride = null;
    const updateHeader = () => {
      const mobileHeroEnd = hero
        ? hero.offsetTop + hero.offsetHeight - header.getBoundingClientRect().height - 24
        : 20;
      const scrolled = headerScrollOverride ??
        (window.innerWidth <= 900 ? window.scrollY > mobileHeroEnd : window.scrollY > 20);
      header.classList.toggle("scrolled", scrolled);
      hero?.classList.toggle("is-scrolled", window.scrollY > 8);
      scrollbar?.classList.toggle("is-visible", window.scrollY > 0);
    };
    const onScroll = scheduleScrollbarUpdate;

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", scheduleScrollbarUpdate, { passive: true });
    onScroll();
    updateHeader();
    updateScrollbar();
    updateActiveSection();
    window.addEventListener("load", scheduleScrollbarUpdate, { once: true });
    document.fonts?.ready.then(scheduleScrollbarUpdate);

    // Smooth snapping is limited to the landing / Skills boundary.
    const skillsHeading = document.querySelector("#skills .section__header");
    let scrollAnimation = null;
    let jumpUntil = 0;
    let jumpDestination = null;
    const scrollRoot = document.documentElement;
    const finishJump = () => {
      if (scrollAnimation !== null) cancelAnimationFrame(scrollAnimation);
      scrollAnimation = null;
      jumpDestination = null;
      scrollRoot.classList.remove("is-jumping");
      headerScrollOverride = null;
      onScroll();
    };
    const skillsTop = () => skillsHeading
      ? skillsHeading.getBoundingClientRect().top + window.scrollY -
        header.getBoundingClientRect().height - 28
      : null;
    const isOnLanding = () => hero && window.scrollY <
      hero.offsetTop + hero.offsetHeight - window.innerHeight / 2;
    const jump = (top) => {
      if (top === null) return;
      if (scrollAnimation !== null) return;
      jumpDestination = top;
      headerScrollOverride = top > 20;
      onScroll();
      if (prefersReducedMotion) {
        window.scrollTo({ top, behavior: "instant" });
        finishJump();
        jumpUntil = performance.now() + 90;
        return;
      }
      const from = window.scrollY;
      const started = performance.now();
      scrollRoot.classList.add("is-jumping");
      const animateScroll = (now) => {
        const progress = Math.min(1, (now - started) / 300);
        // Respond immediately, then settle precisely in one short transition.
        const eased = 1 - (1 - progress) ** 3;
        window.scrollTo({ top: from + (top - from) * eased, behavior: "instant" });
        if (progress < 1) scrollAnimation = requestAnimationFrame(animateScroll);
        else {
          finishJump();
          jumpUntil = performance.now() + 90;
        }
      };
      scrollAnimation = requestAnimationFrame(animateScroll);
    };
    const snapTarget = (direction) => {
      if (window.innerWidth <= 900) return null;
      const top = skillsTop();
      if (top === null) return null;
      if (direction > 0 && isOnLanding() &&
          (window.innerWidth > 900 || hero.getBoundingClientRect().bottom <= window.innerHeight + 48))
        return top;
      if (direction < 0 && window.scrollY > 0 && window.scrollY <= top + 48)
        return hero?.offsetTop ?? 0;
      return null;
    };
    window.addEventListener("wheel", (event) => {
      if (event.ctrlKey) return;
      if (scrollAnimation !== null || performance.now() < jumpUntil) {
        event.preventDefault();
        return;
      }
      if (Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return;
      const top = snapTarget(event.deltaY);
      if (top === null) return;
      event.preventDefault();
      jump(top);
    }, { passive: false });

    window.addEventListener("keydown", (event) => {
      if (scrollAnimation !== null &&
          ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key) &&
          !event.target?.closest("input, textarea, select, [contenteditable='true']")) {
        event.preventDefault();
      }
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && scrollAnimation !== null) {
        window.scrollTo({ top: jumpDestination, behavior: "instant" });
        finishJump();
      }
    });

    let touchStartY = null;
    window.addEventListener("touchstart", (event) => {
      touchStartY = event.touches.length === 1 ? event.touches[0].clientY : null;
    }, { passive: true });
    window.addEventListener("touchmove", (event) => {
      if (event.touches.length !== 1) return;
      if (scrollAnimation !== null) { event.preventDefault(); return; }
      if (touchStartY === null) return;
      const delta = touchStartY - event.touches[0].clientY;
      if (Math.abs(delta) < 24) return;
      const top = snapTarget(delta);
      if (top === null) return;
      event.preventDefault();
      touchStartY = null;
      jump(top);
    }, { passive: false });

    if (!sections.length || !navLinks.length) return;

    navLinks.forEach((link) => {
      link.addEventListener("click", (event) => {
        const targetId = link.getAttribute("href");
        const target = targetId ? document.querySelector(targetId) : null;
        const heading = target?.querySelector(".section__header");

        if (!target || !heading) return;

        event.preventDefault();
        finishJump();
        jumpUntil = 0;
        const offset = header.getBoundingClientRect().height + 28;
        const top = heading.getBoundingClientRect().top + window.scrollY - offset;
        window.history.pushState(null, "", targetId);
        window.scrollTo({
          top,
          behavior: prefersReducedMotion ? "auto" : "smooth",
        });
      });
    });


  };

  /* --------------------------------------------------------------------------
     4. ONE-CLICK EMAIL COPY & TOAST
     -------------------------------------------------------------------------- */
  const initCopyEmail = () => {
    const copyBtn = document.getElementById("copy-email-btn");
    const toast = document.getElementById("toast");
    const email = "jpnortem@gmail.com";
    let toastTimeout = null;

    if (!copyBtn) return;

    copyBtn.addEventListener("click", async () => {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(email);
        } else {
          const textArea = document.createElement("textarea");
          textArea.value = email;
          textArea.style.position = "fixed";
          textArea.style.opacity = "0";
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand("copy");
          document.body.removeChild(textArea);
        }

        const btnText = copyBtn.querySelector(".btn-copy-text");
        if (btnText) {
          const original = btnText.textContent;
          btnText.textContent = "Copied!";
          setTimeout(() => {
            btnText.textContent = original;
          }, 2000);
        }

        if (toast) {
          clearTimeout(toastTimeout);
          toast.classList.add("is-visible");
          toastTimeout = setTimeout(() => {
            toast.classList.remove("is-visible");
          }, 2600);
        }
      } catch (err) {
        console.error("Failed to copy email:", err);
      }
    });
  };

  // Accent only the pixels of the text inside the animated portrait mask.
  const initHeroOverlap = () => {
    const image = document.querySelector(".hero__image");
    const text = document.querySelector(".hero__text");
    const defs = document.querySelector("#blob-clip")?.parentElement;
    if (!image || !text || !defs) return;

    const ns = "http://www.w3.org/2000/svg";
    const clip = document.createElementNS(ns, "clipPath");
    clip.id = "hero-text-overlap-clip";
    clip.setAttribute("clipPathUnits", "userSpaceOnUse");
    const shape = document.createElementNS(ns, "use");
    shape.setAttribute("href", "#blob-path");
    clip.appendChild(shape);
    defs.appendChild(clip);

    const overlay = text.cloneNode(true);
    // Buttons are opaque controls, so only heading and description get the accent overlay.
    overlay.querySelector(".hero__actions")?.remove();
    overlay.classList.add("hero__text--overlap");
    overlay.setAttribute("aria-hidden", "true");
    overlay.setAttribute("inert", "");
    overlay.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
    overlay.querySelectorAll("a").forEach((link) => {
      link.removeAttribute("href");
      link.removeAttribute("target");
      link.setAttribute("tabindex", "-1");
    });
    text.parentElement.appendChild(overlay);

    const update = () => {
      // offset* coordinates stay stable while the page scrolls.
      overlay.style.left = `${text.offsetLeft}px`;
      overlay.style.top = `${text.offsetTop}px`;
      overlay.style.width = `${text.getBoundingClientRect().width}px`;
      overlay.style.height = `${text.getBoundingClientRect().height}px`;
      const photo = image.getBoundingClientRect();
      const layer = overlay.getBoundingClientRect();
      shape.setAttribute("transform",
        `translate(${photo.left - layer.left} ${photo.top - layer.top}) scale(${photo.width} ${photo.height})`);
    };
    const observer = new ResizeObserver(update);
    observer.observe(text);
    observer.observe(image);
    observer.observe(text.parentElement);
    image.addEventListener("load", update);
    document.fonts?.ready.then(update);
    update();
  };

  const initFluidCards = () => {
    const ns = "http://www.w3.org/2000/svg";
    const frames = new Map();
    const visibleFrames = new Set();
    const finePointer = window.matchMedia("(any-pointer: fine)");
    let latestPointer = null;
    let animationId = null;
    let lastFrame = 0;
    const xy = (x, y) => `${x.toFixed(2)} ${y.toFixed(2)}`;

    // Each side has one spring. Corners stay fixed, and analytic tangents keep
    // every join smooth without sampling, parsing or measuring an SVG path.
    const draw = (frame, now, delta = 0) => {
      const { width: w, height: h, pointer, edges } = frame;
      if (w < 24 || h < 24) return;
      const left = 3, top = 3, right = w - 3, bottom = h - 3;
      const r = Math.min(frame.isButton ? 12 : 22, (w - 6) / 2, (h - 6) / 2);
      const k = r * .55228475;
      const sides = [
        [left + r, top, w - 6 - 2*r, 0],
        [right, top + r, 0, h - 6 - 2*r],
        [right - r, bottom, -(w - 6 - 2*r), 0],
        [left, bottom - r, 0, -(h - 6 - 2*r)],
      ];
      const corners = [
        ` C ${xy(right-r+k, top)}, ${xy(right, top+r-k)}, ${xy(right, top+r)}`,
        ` C ${xy(right, bottom-r+k)}, ${xy(right-r+k, bottom)}, ${xy(right-r, bottom)}`,
        ` C ${xy(left+r-k, bottom)}, ${xy(left, bottom-r+k)}, ${xy(left, bottom-r)}`,
        ` C ${xy(left, top+r-k)}, ${xy(left+r-k, top)}, ${xy(left+r, top)}`,
      ];
      const time = prefersReducedMotion ? 0 : now * .001 * MOTION_SPEED;
      let data = `M ${xy(left + r, top)}`;
      sides.forEach(([x, y, dx, dy], index) => {
        const edge = edges[index];
        const length = Math.hypot(dx, dy) || 1;
        const nx = dy / length, ny = -dx / length;
        const projection = ((pointer.x-x)*dx + (pointer.y-y)*dy) / (length*length);
        const center = Math.max(0, Math.min(1, projection));
        const distanceSquared = (pointer.x-x-dx*center)**2 + (pointer.y-y-dy*center)**2;
        const reach = frame.isButton ? 28 : 72;
        const target = pointer.active
          ? -(frame.isButton ? 1.4 : 5) * Math.exp(-distanceSquared / (reach*reach))
          : 0;
        if (delta) {
          edge.center += (center - edge.center) * (1 - Math.exp(-12*delta));
          for (let step = 0; step < 2; step++) {
            edge.velocity += ((target-edge.position)*120 - edge.velocity*24) * delta/2;
            edge.position += edge.velocity * delta/2;
          }
          if (!pointer.active && Math.abs(edge.position) < .015 && Math.abs(edge.velocity) < .05) {
            edge.position = 0;
            edge.velocity = 0;
          }
        }
        const idle = Math.sin(time * .4 * frame.tempo + frame.phase + index*1.7)
          * (frame.isButton ? .45 : 1.8);
        const spread = Math.max(1, length / (frame.isButton ? 35 : 110));
        const deformed = Math.abs(edge.position) > .02;
        const segments = deformed
          ? Math.min(12, Math.max(4, Math.ceil(length/48))) : 2;
        const point = (t) => {
          // The window and its derivative are both zero at the corners.
          const window = Math.sin(Math.PI*t)**2;
          const slope = Math.PI * Math.sin(2*Math.PI*t);
          const z = (t-edge.center)*spread;
          const bell = deformed ? Math.exp(-z*z*1.5) : 0;
          const offset = window * (idle + edge.position*bell);
          const derivative = slope * (idle + edge.position*bell)
            - window * edge.position * bell * 3*z*spread;
          return { x: x+dx*t+nx*offset, y: y+dy*t+ny*offset,
            tx: dx+nx*derivative, ty: dy+ny*derivative };
        };
        let previous = point(0);
        for (let segment = 1; segment <= segments; segment++) {
          const next = point(segment/segments);
          const step = 1/(segments*3);
          data += ` C ${xy(previous.x+previous.tx*step, previous.y+previous.ty*step)}, ${xy(next.x-next.tx*step, next.y-next.ty*step)}, ${xy(next.x, next.y)}`;
          previous = next;
        }
        data += corners[index];
      });
      data += ' Z';
      if (data !== frame.lastD) {
        frame.path.setAttribute('d', data);
        frame.lastD = data;
      }
    };
    const releaseEdges = () => {
      latestPointer = null;
      frames.forEach((frame) => { frame.pointer.active = false; });
    };
    const updatePointer = () => {
      if (!latestPointer) return;
      const event = latestPointer;
      latestPointer = null;
      // Batch layout reads before drawing any borders, even with a fast mouse.
      visibleFrames.forEach((frame) => {
        const rect = frame.card.getBoundingClientRect();
        const x = event.clientX-rect.left, y = event.clientY-rect.top;
        frame.pointer.x = x;
        frame.pointer.y = y;
        const reach = frame.isButton ? 38 : 90;
        frame.pointer.active = x > -reach && x < rect.width+reach &&
          y > -reach && y < rect.height+reach &&
          Math.min(x, y, rect.width-x, rect.height-y) < reach;
      });
    };
    function scheduleAnimation() {
      if (!prefersReducedMotion && !document.hidden && animationId === null && visibleFrames.size) {
        animationId = requestAnimationFrame(animate);
      }
    }
    const animate = (now) => {
      animationId = null;
      if (document.hidden) return;
      let interacting = latestPointer !== null;
      visibleFrames.forEach((frame) => {
        if (frame.edges.some((edge) => Math.abs(edge.velocity) > .05))
          interacting = true;
      });
      // Slow idle movement needs fewer paints; interactions retain 60 fps.
      const interval = 1000/(interacting && finePointer.matches ? 60 : 30);
      if (now-lastFrame >= interval-1) {
        const delta = Math.min((now-lastFrame)/1000, .05);
        lastFrame = now;
        updatePointer();
        visibleFrames.forEach((frame) => draw(frame, now, delta));
      }
      scheduleAnimation();
    };
    const resize = new ResizeObserver((entries) => {
      entries.forEach(({ target }) => {
        const frame = frames.get(target);
        frame.width = target.clientWidth;
        frame.height = target.clientHeight;
        frame.svg.setAttribute('viewBox', `0 0 ${frame.width} ${frame.height}`);
        draw(frame, performance.now());
      });
    });
    const visibility = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        const frame = frames.get(target);
        if (isIntersecting) visibleFrames.add(frame);
        else { visibleFrames.delete(frame); frame.pointer.active = false; }
      });
      scheduleAnimation();
    });
    document.querySelectorAll(".bento-card, .timeline-item__content, .project-card, .hero__text:not(.hero__text--overlap) .hero__chip, .footer__socials a")
      .forEach((card, index) => {
        const svg = document.createElementNS(ns, 'svg');
        svg.classList.add('fluid-frame');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('focusable', 'false');
        const path = document.createElementNS(ns, 'path');
        svg.appendChild(path);
        card.prepend(svg);
        card.classList.add('has-fluid-frame');
        const frame = {
          card, svg, path, width: 0, height: 0, phase: index*1.7,
          isButton: card.matches('.footer__socials a, .hero__chip'),
          tempo: .8 + ((index*.61803398875)%1)*.4,
          pointer: { x: 0, y: 0, active: false },
          edges: Array.from({ length: 4 }, () => ({ position: 0, velocity: 0, center: .5 })),
        };
        frames.set(card, frame);
        resize.observe(card);
        visibility.observe(card);
      });
    if (prefersReducedMotion) return;
    window.addEventListener('pointermove', (event) => {
      if (event.pointerType !== 'touch' && finePointer.matches) latestPointer = event;
    }, { passive: true });
    document.documentElement.addEventListener('pointerleave', releaseEdges);
    window.addEventListener('blur', releaseEdges);
    window.addEventListener('scroll', releaseEdges, { passive: true });
    document.addEventListener('visibilitychange', () => {
      releaseEdges();
      if (document.hidden && animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
      } else scheduleAnimation();
    });
  };

  /* --------------------------------------------------------------------------
     5. INITIALIZATION
     -------------------------------------------------------------------------- */
  const init = () => {
    initFluidBackground();
    initBlobMask();
    initHeroOverlap();
    initFluidCards();
    initFluidNavigation();
    initHeaderScrollSpy();
    initCopyEmail();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
