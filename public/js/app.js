(function () {
  const site = window.THANK_YOU_SITE || {};
  const messages = site.guests || {};
  const defaultMessages = site.defaultMessages || { en: site.defaultMessage || {} };
  const content = site.content || {};

  function getRouteFromUrl() {
    const pathParts = window.location.pathname
      .split("/")
      .map((part) => part.trim())
      .filter(Boolean);
    const firstPathPart = (pathParts[0] || "").toLowerCase();
    const language = firstPathPart === "pt" ? "pt" : "en";
    const slugParts = firstPathPart === "pt" || firstPathPart === "en"
      ? pathParts.slice(1)
      : pathParts;
    const lastPathPart = slugParts[slugParts.length - 1] || "";
    const cleanPathPart = lastPathPart.replace(/\.html$/i, "");

    if (cleanPathPart && cleanPathPart.toLowerCase() !== "index") {
      return { language, slug: cleanPathPart };
    }

    return { language, slug: new URLSearchParams(window.location.search).get("to") || "" };
  }

  function normalizeSlug(value) {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  function toKey(value) {
    return normalizeSlug(value)
      .trim()
      .toLowerCase()
      .replace(/['"]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function toGuestName(value) {
    const cleanValue = normalizeSlug(value)
      .replace(/\.html$/i, "")
      .replace(/[_+]+/g, " ")
      .replace(/[-]+/g, " ")
      .replace(/[^a-zA-Z0-9& ]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleanValue) {
      return "friends and family";
    }

    return cleanValue
      .split(" ")
      .map((word, index) => {
        const lower = word.toLowerCase();
        const smallWords = ["and", "or", "the", "of", "to"];

        if (index > 0 && smallWords.includes(lower)) {
          return lower;
        }

        if (word === "&") {
          return "&";
        }

        return lower.charAt(0).toUpperCase() + lower.slice(1);
      })
      .join(" ");
  }

  function fillTemplate(text, replacements) {
    if (!text) {
      return text;
    }

    return text.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, token) => replacements[token] || match);
  }

  function clampNumber(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function getMotionMode() {
    return document.documentElement.dataset.motion || "default";
  }

  function shouldUseMotion() {
    return getMotionMode() !== "off";
  }

  function savePreference(name, value) {
    try {
      window.localStorage.setItem(name, value);
    } catch {
      // Display preferences still apply for this page load when storage is unavailable.
    }
  }

  function createFunPiece(className, styles = {}, text = "") {
    const piece = document.createElement("span");
    piece.className = className;
    piece.textContent = text;

    Object.entries(styles).forEach(([property, value]) => {
      piece.style.setProperty(property, value);
    });

    return piece;
  }

  function removeFunPiece(piece, fallbackMs) {
    const remove = () => piece.remove();
    piece.addEventListener("animationend", remove, { once: true });
    window.setTimeout(remove, fallbackMs);
  }

  function fillFunLayer() {
    const layer = document.getElementById("fun-layer");

    if (!layer || layer.children.length) {
      return;
    }

    const marks = ["+", "*", ".", "x"];

    for (let index = 0; index < 34; index += 1) {
      const size = 7 + (index % 5) * 2;
      const mark = createFunPiece(
        "fun-sparkle",
        {
          "--x": `${(index * 29) % 100}%`,
          "--y": `${(index * 47) % 100}%`,
          "--size": `${size}px`,
          "--font-size": `${(size * 1.8).toFixed(1)}px`,
          "--delay": `${(index % 12) * -0.42}s`,
          "--duration": `${5.4 + (index % 7) * 0.45}s`,
          "--drift-distance": `${index % 2 === 0 ? 46 : -46}px`
        },
        marks[index % marks.length]
      );
      layer.append(mark);
    }

    const colors = ["var(--gold)", "var(--teal)", "var(--berry)", "var(--cream)"];

    for (let index = 0; index < 28; index += 1) {
      const width = 6 + (index % 4) * 2;
      const confetti = createFunPiece("fun-confetti", {
        "--x": `${(index * 17 + 4) % 100}%`,
        "--piece-color": colors[index % colors.length],
        "--delay": `${(index % 14) * -0.36}s`,
        "--duration": `${4.8 + (index % 6) * 0.52}s`,
        "--width": `${width}px`,
        "--height": `${(width * 2.25).toFixed(1)}px`,
        "--spin-deg": `${index % 2 === 0 ? 520 : -520}deg`,
        "--sway-distance": `${index % 3 === 0 ? 64 : -42}px`
      });
      layer.append(confetti);
    }

    for (let index = 0; index < 9; index += 1) {
      const ribbon = createFunPiece("fun-ribbon", {
        "--x": `${(index * 13 + 8) % 100}%`,
        "--delay": `${index * -0.7}s`,
        "--duration": `${7.5 + (index % 4) * 0.8}s`,
        "--height": `${110 + (index % 3) * 42}px`,
        "--piece-color": colors[(index + 1) % colors.length],
        "--sway-distance": `${index % 2 === 0 ? 54 : -54}px`
      });
      layer.append(ribbon);
    }
  }

  function updateFunLayer(mode) {
    const layer = document.getElementById("fun-layer");

    if (!layer) {
      return;
    }

    if (mode === "fun") {
      fillFunLayer();
      layer.hidden = false;
    } else {
      layer.hidden = true;
    }
  }

  function setupFunPointer() {
    let frame = 0;
    let lastTrailAt = 0;

    function isQuietTarget(target) {
      return target instanceof Element && target.closest(".site-controls, .guest-splash, a, button, input, label");
    }

    function spawnFunTrail(x, y) {
      const layer = document.getElementById("fun-layer");

      if (!layer || layer.hidden || getMotionMode() !== "fun") {
        return;
      }

      const marks = [".", "+", "*"];
      const trailSize = 8 + Math.random() * 10;
      const trail = createFunPiece(
        "fun-trail",
        {
          "--trail-x": `${x}px`,
          "--trail-y": `${y}px`,
          "--trail-size": `${trailSize.toFixed(1)}px`,
          "--trail-font-size": `${(trailSize * 1.35).toFixed(1)}px`,
          "--trail-rotate": `${Math.random() * 110 - 55}deg`
        },
        marks[Math.floor(Math.random() * marks.length)]
      );

      layer.append(trail);
      removeFunPiece(trail, 900);
    }

    function spawnFunBurst(x, y) {
      const layer = document.getElementById("fun-layer");

      if (!layer || layer.hidden || getMotionMode() !== "fun") {
        return;
      }

      const marks = ["+", "*", "x", "."];

      for (let index = 0; index < 14; index += 1) {
        const angle = (360 / 14) * index + Math.random() * 18;
        const burstSize = 10 + Math.random() * 8;
        const burst = createFunPiece(
          "fun-burst",
          {
            "--burst-x": `${x}px`,
            "--burst-y": `${y}px`,
            "--burst-angle": `${angle}deg`,
            "--burst-distance": `${42 + Math.random() * 70}px`,
            "--burst-delay": `${index * 0.012}s`,
            "--burst-size": `${burstSize.toFixed(1)}px`,
            "--burst-font-size": `${(burstSize * 1.35).toFixed(1)}px`
          },
          marks[index % marks.length]
        );

        layer.append(burst);
        removeFunPiece(burst, 1100);
      }
    }

    window.addEventListener("pointermove", (event) => {
      if (getMotionMode() !== "fun") {
        return;
      }

      if (frame) {
        window.cancelAnimationFrame(frame);
      }

      frame = window.requestAnimationFrame(() => {
        const x = event.clientX / Math.max(window.innerWidth, 1);
        const y = event.clientY / Math.max(window.innerHeight, 1);
        document.documentElement.style.setProperty("--pointer-x", `${(x * 100).toFixed(1)}%`);
        document.documentElement.style.setProperty("--pointer-y", `${(y * 100).toFixed(1)}%`);
        document.documentElement.style.setProperty("--tilt-x", (x - 0.5).toFixed(3));
        document.documentElement.style.setProperty("--tilt-y", (y - 0.5).toFixed(3));
        document.documentElement.style.setProperty("--tilt-shift-x", `${((x - 0.5) * -18).toFixed(2)}px`);
        document.documentElement.style.setProperty("--tilt-shift-y", `${((y - 0.5) * -12).toFixed(2)}px`);
        frame = 0;
      });

      const now = performance.now();
      if (now - lastTrailAt > 80 && !isQuietTarget(event.target)) {
        lastTrailAt = now;
        spawnFunTrail(event.clientX, event.clientY);
      }
    });

    window.addEventListener("click", (event) => {
      if (getMotionMode() !== "fun" || isQuietTarget(event.target)) {
        return;
      }

      spawnFunBurst(event.clientX, event.clientY);
      track("super_fun_burst", {
        pointer_x: Math.round(event.clientX),
        pointer_y: Math.round(event.clientY)
      });
    });
  }

  function setupDisplayPreferences() {
    const root = document.documentElement;
    const themeToggle = document.getElementById("theme-toggle");
    const themeText = document.getElementById("theme-toggle-text");
    const motionControl = document.getElementById("motion-control");
    const motionValues = ["off", "default", "fun"];
    const motionLabels = {
      off: "No motion",
      default: "Default motion",
      fun: "Super fun mode"
    };

    function setTheme(theme) {
      root.dataset.theme = theme;
      if (themeText) {
        themeText.textContent = theme === "dark" ? "Dark" : "Light";
      }
      if (themeToggle) {
        themeToggle.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
        themeToggle.setAttribute("aria-label", `Switch to ${theme === "dark" ? "light" : "dark"} mode`);
      }
    }

    function setMotion(mode) {
      const safeMode = motionValues.includes(mode) ? mode : "default";
      root.dataset.motion = safeMode;
      updateFunLayer(safeMode);
      if (motionControl) {
        motionControl.value = String(motionValues.indexOf(safeMode));
        motionControl.setAttribute("aria-valuetext", motionLabels[safeMode]);
      }
    }

    setTheme(root.dataset.theme === "dark" ? "dark" : "light");
    setMotion(root.dataset.motion || "default");
    setupFunPointer();

    themeToggle?.addEventListener("click", () => {
      const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
      setTheme(nextTheme);
      savePreference("thankYouTheme", nextTheme);
      track("preference_change", { preference: "theme", value: nextTheme });
    });

    motionControl?.addEventListener("input", () => {
      const nextMotion = motionValues[Number(motionControl.value)] || "default";
      setMotion(nextMotion);
      savePreference("thankYouMotion", nextMotion);
      track("preference_change", { preference: "motion", value: nextMotion });
    });
  }

  function personalizeMessage(message = {}, replacements) {
    return ["greeting", "message", "signature"].reduce((personalized, field) => {
      if (message[field]) {
        personalized[field] = fillTemplate(message[field], replacements);
      }

      return personalized;
    }, {});
  }

  function setText(id, text) {
    const node = document.getElementById(id);
    if (node && text) {
      node.textContent = text;
    }
  }

  function getLocalizedGuestMessage(guestConfig, language) {
    if (!guestConfig) {
      return null;
    }

    if (guestConfig[language]) {
      return guestConfig[language];
    }

    if (guestConfig.en) {
      return guestConfig.en;
    }

    return guestConfig;
  }

  function toLocale(language) {
    return language === "pt" ? "pt-BR" : "en";
  }

  function getLocalizedSplash(guestConfig, language) {
    if (!guestConfig?.splash) {
      return null;
    }

    const splash = guestConfig.splash;
    const localizedText = splash[language];

    if (!localizedText) {
      return null;
    }

    return { ...splash, ...localizedText };
  }

  function setupGuestSplash(guestConfig, language, replacements) {
    const splash = getLocalizedSplash(guestConfig, language);
    const splashNode = document.getElementById("guest-splash");
    const card = splashNode?.querySelector(".guest-splash__card");
    const image = document.getElementById("guest-splash-image");
    const closeButton = document.getElementById("guest-splash-close");

    if (!splash?.image || !splashNode || !card || !image || !closeButton) {
      return;
    }

    const closeControls = splashNode.querySelectorAll("[data-splash-close]");
    const title = fillTemplate(splash.title || "So glad you are here", replacements);
    const caption = fillTemplate(splash.caption || "", replacements);
    const kicker = fillTemplate(splash.kicker || "A favorite memory", replacements);
    const alt = fillTemplate(splash.alt || title, replacements);
    let closeTracked = false;
    let splashShown = false;

    card.style.setProperty("--splash-rotation", splash.rotation || "-2deg");
    image.alt = alt;
    setText("guest-splash-kicker", kicker);
    setText("guest-splash-title", title);
    setText("guest-splash-caption", caption);

    function setupSplashDrag() {
      let isDragging = false;
      let startPointerX = 0;
      let startPointerY = 0;
      let startDragX = 0;
      let startDragY = 0;
      let currentDragX = 0;
      let currentDragY = 0;
      let trackedDrag = false;

      function getDragLimit() {
        return {
          x: Math.min(110, Math.max(42, window.innerWidth * 0.09)),
          y: Math.min(86, Math.max(34, window.innerHeight * 0.08))
        };
      }

      function setDragPosition(x, y) {
        const dragLimit = getDragLimit();
        currentDragX = clampNumber(x, -dragLimit.x, dragLimit.x);
        currentDragY = clampNumber(y, -dragLimit.y, dragLimit.y);

        card.style.setProperty("--splash-drag-x", `${currentDragX.toFixed(1)}px`);
        card.style.setProperty("--splash-drag-y", `${currentDragY.toFixed(1)}px`);
        card.style.setProperty("--splash-drag-rotation", `${clampNumber(currentDragX / 34, -2.2, 2.2).toFixed(2)}deg`);
      }

      function finishDrag(event) {
        if (!isDragging) {
          return;
        }

        isDragging = false;
        card.classList.remove("is-dragging");

        if (card.releasePointerCapture && event?.pointerId !== undefined) {
          card.releasePointerCapture(event.pointerId);
        }
      }

      card.addEventListener("pointerdown", (event) => {
        if (event.button && event.button !== 0) {
          return;
        }

        if (event.target.closest("[data-splash-close]")) {
          return;
        }

        isDragging = true;
        startPointerX = event.clientX;
        startPointerY = event.clientY;
        startDragX = currentDragX;
        startDragY = currentDragY;
        card.classList.add("is-dragging");

        if (card.setPointerCapture) {
          card.setPointerCapture(event.pointerId);
        }

        event.preventDefault();
      });

      card.addEventListener("pointermove", (event) => {
        if (!isDragging) {
          return;
        }

        const nextX = startDragX + event.clientX - startPointerX;
        const nextY = startDragY + event.clientY - startPointerY;
        setDragPosition(nextX, nextY);

        if (!trackedDrag && Math.hypot(currentDragX - startDragX, currentDragY - startDragY) > 10) {
          trackedDrag = true;
          track("splash_drag", { splash_image: splash.image });
        }
      });

      card.addEventListener("pointerup", finishDrag);
      card.addEventListener("pointercancel", finishDrag);
      window.addEventListener("resize", () => setDragPosition(currentDragX, currentDragY));
    }

    function closeSplash() {
      if (splashNode.hidden) {
        return;
      }

      splashNode.classList.remove("is-visible");
      document.body.classList.remove("has-splash");

      if (!closeTracked) {
        closeTracked = true;
        track("splash_close", { splash_image: splash.image });
      }

      window.setTimeout(() => {
        splashNode.hidden = true;
        splashNode.setAttribute("aria-hidden", "true");
      }, 260);
    }

    function handleKeydown(event) {
      if (event.key === "Escape") {
        closeSplash();
      }
    }

    function showSplash() {
      if (splashShown) {
        return;
      }

      splashShown = true;
      splashNode.hidden = false;
      splashNode.setAttribute("aria-hidden", "false");
      document.body.classList.add("has-splash");

      window.requestAnimationFrame(() => {
        splashNode.classList.add("is-visible");
        closeButton.focus({ preventScroll: true });
      });

      track("splash_view", { splash_image: splash.image });
    }

    closeControls.forEach((control) => {
      control.addEventListener("click", closeSplash);
    });

    setupSplashDrag();
    window.addEventListener("keydown", handleKeydown);
    image.addEventListener("load", showSplash, { once: true });
    image.src = splash.image;

    if (image.complete && image.naturalWidth > 0) {
      showSplash();
    }
  }

  function setLocalizedContent(language) {
    const text = content[language] || content.en || {};
    const storyParagraphs = text.storyParagraphs || [];
    const metaDescription = document.querySelector("meta[name='description']");

    document.documentElement.lang = toLocale(language);

    if (metaDescription && text.description) {
      metaDescription.setAttribute("content", text.description);
    }

    setText("hero-eyebrow", text.heroEyebrow);
    setText("scroll-cue-text", text.scrollCue);
    setText("story-kicker", text.storyKicker);
    setText("story-title", text.storyTitle);
    setText("story-paragraph-1", storyParagraphs[0]);
    setText("story-paragraph-2", storyParagraphs[1]);
    setText("story-paragraph-3", storyParagraphs[2]);
    setText("gratitude-kicker", text.gratitudeKicker);
    setText("gratitude-title", text.gratitudeTitle);
    setText("gratitude-copy", text.gratitudeCopy);

    const scrollCue = document.getElementById("scroll-cue");
    if (scrollCue && text.scrollCueLabel) {
      scrollCue.setAttribute("aria-label", text.scrollCueLabel);
    }
  }

  const route = getRouteFromUrl();
  const language = route.language;
  const slug = route.slug;
  const key = toKey(slug);
  const guestConfig = messages[key];
  const hasSpecificMessage = Boolean(key && guestConfig);
  const languageFallback = defaultMessages[language] || defaultMessages.en || {};
  const guestName = hasSpecificMessage ? toGuestName(key) : toGuestName(slug);
  const fallbackMessage = personalizeMessage(languageFallback, { guestName });
  const guestMessage = getLocalizedGuestMessage(guestConfig, language);
  const message = hasSpecificMessage
    ? { ...fallbackMessage, ...personalizeMessage(guestMessage, { guestName }) }
    : fallbackMessage;
  const visitId = getVisitId();
  const visitStartedAt = Date.now();

  setLocalizedContent(language);
  setText("greeting", message.greeting);
  setText("message", message.message);
  setText("signature", message.signature);

  const pageTitle = (content[language] || content.en || {}).pageTitle || "Thank You";
  if (key) {
    document.title = `${message.greeting.replace(/,$/, "")} | ${pageTitle}`;
  } else {
    document.title = pageTitle;
  }

  function getVisitId() {
    const keyName = "thankYouVisitId";
    let existingId = "";

    try {
      existingId = window.sessionStorage.getItem(keyName);
    } catch {
      existingId = "";
    }

    if (existingId) {
      return existingId;
    }

    const nextId = window.crypto?.randomUUID
      ? window.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    try {
      window.sessionStorage.setItem(keyName, nextId);
    } catch {
      // Some privacy modes can block sessionStorage; the random id still works for this page load.
    }

    return nextId;
  }

  function getGuestLabel() {
    return (message.greeting || guestName)
      .replace(/^dear\s+/i, "")
      .replace(/,$/, "")
      .trim();
  }

  function getNavigationTiming() {
    const navigation = performance.getEntriesByType?.("navigation")?.[0];

    if (!navigation) {
      return {};
    }

    return {
      load_ms: Math.round(navigation.loadEventEnd || navigation.duration || 0),
      dom_ready_ms: Math.round(navigation.domContentLoadedEventEnd || 0),
      transfer_bytes: Math.round(navigation.transferSize || 0)
    };
  }

  function getLogPayload(eventName, extra = {}) {
    return {
      event: eventName,
      visit_id: visitId,
      guest_slug_raw: normalizeSlug(slug),
      guest_key: key || "default",
      guest_known: hasSpecificMessage,
      guest_label: getGuestLabel(),
      page_language: toLocale(language),
      page_title: document.title,
      url: window.location.href,
      path: window.location.pathname,
      query: window.location.search,
      referrer: document.referrer || "",
      language: navigator.language || "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
      local_time: new Date().toString(),
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      screen: `${window.screen.width}x${window.screen.height}`,
      device_pixel_ratio: window.devicePixelRatio || 1,
      color_scheme: window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
      reduced_motion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      seconds_on_page: Math.round((Date.now() - visitStartedAt) / 1000),
      ...getNavigationTiming(),
      ...extra
    };
  }

  function track(eventName, extra = {}, useBeacon = false) {
    const payload = JSON.stringify(getLogPayload(eventName, extra));

    if (useBeacon && navigator.sendBeacon) {
      navigator.sendBeacon("/log.php", new Blob([payload], { type: "application/json" }));
      return;
    }

    fetch("/log.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true
    }).catch(() => {
      // Logging is best-effort; the thank-you page should never break because of it.
    });
  }

  setupDisplayPreferences();
  setupGuestSplash(guestConfig, language, { guestName });

  const story = document.getElementById("story");
  const scrollCue = document.querySelector(".scroll-cue");
  let trackedStoryView = false;

  if (scrollCue && story) {
    scrollCue.addEventListener("click", (event) => {
      event.preventDefault();
      track("story_click", { scroll_y: Math.round(window.scrollY) });
      story.scrollIntoView({ behavior: shouldUseMotion() ? "smooth" : "auto", block: "start" });
    });
  }

  if (story && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            story.classList.add("is-visible");
            if (!trackedStoryView) {
              trackedStoryView = true;
              track("story_view", {
                intersection_ratio: Number(entry.intersectionRatio.toFixed(3)),
                scroll_y: Math.round(window.scrollY)
              });
            }
            observer.disconnect();
          }
        });
      },
      { threshold: 0.28 }
    );

    observer.observe(story);
  } else if (story) {
    story.classList.add("is-visible");
    trackedStoryView = true;
    track("story_view", { fallback_observer: true });
  }

  function trackPageView() {
    window.setTimeout(() => {
      track("page_view");
    }, 0);
  }

  if (document.readyState === "complete") {
    trackPageView();
  } else {
    window.addEventListener("load", trackPageView);
  }

  window.addEventListener("pagehide", () => {
    track("page_exit", { scroll_y: Math.round(window.scrollY) }, true);
  });
})();
