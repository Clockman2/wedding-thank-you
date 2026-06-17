(function () {
  const site = window.THANK_YOU_SITE || {};
  const messages = site.guests || {};
  const defaultMessages = site.defaultMessages || { en: site.defaultMessage || {} };
  const content = site.content || {};
  let approvedSharedPhotos = [];
  let transientGalleryPhotos = [];
  let galleryCycleStart = 0;
  let galleryCycleTimer = 0;

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

  function randomItem(items, fallback = null) {
    if (!items?.length) {
      return fallback;
    }

    return items[Math.floor(Math.random() * items.length)];
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

  function makeFunLayerAvailable(temporary = false) {
    const layer = document.getElementById("fun-layer");

    if (!layer || getMotionMode() === "off") {
      return null;
    }

    fillFunLayer();
    layer.hidden = false;

    if (temporary && getMotionMode() !== "fun") {
      window.setTimeout(() => {
        if (getMotionMode() !== "fun") {
          layer.hidden = true;
        }
      }, 1800);
    }

    return layer;
  }

  function spawnFunBurst(x, y, options = {}) {
    const layer = makeFunLayerAvailable(Boolean(options.temporary));

    if (!layer) {
      return;
    }

    const marks = options.marks || ["+", "*", "x", "."];
    const count = options.count || 14;

    for (let index = 0; index < count; index += 1) {
      const angle = (360 / count) * index + Math.random() * 18;
      const burstSize = 10 + Math.random() * 8;
      const burst = createFunPiece(
        "fun-burst",
        {
          "--burst-x": `${x}px`,
          "--burst-y": `${y}px`,
          "--burst-angle": `${angle}deg`,
          "--burst-distance": `${42 + Math.random() * (options.distance || 70)}px`,
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

  function launchConfetti(options = {}) {
    if (getMotionMode() === "off") {
      return;
    }

    const burstCount = options.burstCount || 5;
    const marks = options.marks || ["+", "*", "x", "."];

    for (let index = 0; index < burstCount; index += 1) {
      const x = options.fullScreen
        ? window.innerWidth * (0.04 + Math.random() * 0.92)
        : window.innerWidth * (0.16 + Math.random() * 0.68);
      const y = options.fullScreen
        ? window.innerHeight * (0.06 + Math.random() * 0.84)
        : window.innerHeight * (0.18 + Math.random() * 0.46);
      window.setTimeout(() => {
        spawnFunBurst(x, y, {
          count: options.count || 18,
          distance: options.distance || 92,
          marks,
          temporary: true
        });
      }, index * 110);
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
    const vibeButtons = Array.from(document.querySelectorAll("[data-vibe-option]"));
    const motionValues = ["off", "default", "fun"];
    const vibeValues = ["classic", "brazil", "new-mexico"];
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

    function setVibe(vibe, playMedia = false) {
      const safeVibe = vibeValues.includes(vibe) ? vibe : "classic";
      root.dataset.vibe = safeVibe;
      vibeButtons.forEach((button) => {
        const isActive = button.dataset.vibeOption === safeVibe;
        button.setAttribute("aria-pressed", isActive ? "true" : "false");
      });
      updateVibePhrase(safeVibe);
      applyVibeMedia(safeVibe, playMedia);
    }

    setTheme(root.dataset.theme === "dark" ? "dark" : "light");
    setMotion(root.dataset.motion || "default");
    setVibe(root.dataset.vibe || "classic");
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

    vibeButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const nextVibe = button.dataset.vibeOption || "classic";
        setVibe(nextVibe, true);
        savePreference("thankYouVibe", nextVibe);
        if (nextVibe !== "classic") {
          launchConfetti({
            burstCount: nextVibe === "brazil" ? 4 : 3,
            marks: nextVibe === "brazil" ? ["BR", "+", "*", "."] : ["NM", "+", "*", "."]
          });
        }
        track("preference_change", { preference: "vibe", value: nextVibe });
      });
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
    if (node && text !== undefined && text !== null) {
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

  function getLocalizedValue(value, language, fallback = "") {
    if (!value) {
      return fallback;
    }

    if (typeof value === "string") {
      return value;
    }

    return value[language] || value.en || fallback;
  }

  function updateVibePhrase(vibe) {
    const phrase = getLocalizedValue(site.vibePhrases?.[vibe], language, "");
    setText("vibe-phrase", phrase);
  }

  function applyVibeMedia(vibe, playAudio = false) {
    const media = site.vibeMedia?.[vibe];
    const audio = document.getElementById("vibe-audio");
    const root = document.documentElement;

    root.style.removeProperty("--vibe-bg-image");

    if (audio && audio.dataset.currentVibe !== vibe) {
      audio.pause();
      audio.removeAttribute("src");
      audio.dataset.currentVibe = vibe;
    }

    if (!media) {
      return;
    }

    const background = randomItem(media.backgrounds);
    if (background) {
      const probe = new Image();
      probe.addEventListener("load", () => {
        root.style.setProperty("--vibe-bg-image", `url("${background}")`);
      }, { once: true });
      probe.src = background;
    }

    if (audio && media.audio) {
      if (audio.getAttribute("src") !== media.audio) {
        audio.src = media.audio;
        audio.loop = true;
        audio.volume = 0.32;
      }

      if (playAudio) {
        audio.play().catch(() => {
          showPanicNote("Add a music file for this mode, then click the mode again.");
        });
      }
    }
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
    const configuredSplash = getLocalizedSplash(guestConfig, language);
    const fallbackText = site.fallbackSplash?.[language] || site.fallbackSplash?.en || {};
    const fallbackPhoto = !configuredSplash && key && !guestConfig ? randomItem(site.gallery || []) : null;
    const splash = configuredSplash || (fallbackPhoto ? {
      image: fallbackPhoto.src,
      rotation: fallbackPhoto.rotation || "-1.4deg",
      kicker: fallbackText.kicker || "A little memory",
      title: fallbackText.title || "Glad you are here, {guestName}",
      caption: fallbackText.caption || "",
      alt: fallbackText.alt || "A shared wedding gallery photo"
    } : null);
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
    setText("celebration-kicker", text.celebrationKicker);
    setText("celebration-title", text.celebrationTitle);
    setText("celebration-copy", text.celebrationCopy);
    setText("envelope-title", text.envelopeTitle);
    setText("envelope-copy", text.envelopeCopyClosed);
    setText("confetti-button", text.confettiButton);
    setText("do-not-press", text.doNotPress);
    setText("gallery-kicker", text.galleryKicker);
    setText("gallery-title", text.galleryTitle);
    setText("guestbook-kicker", text.guestbookKicker);
    setText("guestbook-title", text.guestbookTitle);
    setText("guestbook-name-label", text.guestbookNameLabel);
    setText("guestbook-message-label", text.guestbookMessageLabel);
    setText("guestbook-submit", text.guestbookSubmit);
    setText("photo-upload-kicker", text.photoUploadKicker);
    setText("photo-upload-title", text.photoUploadTitle);
    setText("photo-upload-copy", text.photoUploadCopy);
    setText("photo-upload-name-label", text.photoUploadNameLabel);
    setText("photo-upload-file-label", text.photoUploadFileLabel);
    setText("photo-upload-submit", text.photoUploadSubmit);
    setText("gratitude-kicker", text.gratitudeKicker);
    setText("gratitude-title", text.gratitudeTitle);
    setText("gratitude-copy", text.gratitudeCopy);

    const signature = document.getElementById("animated-signature");
    if (signature && text.closingSignature) {
      signature.dataset.signature = text.closingSignature;
    }

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

  function getPageText() {
    return content[language] || content.en || {};
  }

  function setupLoadingExperience() {
    const loader = document.getElementById("site-loader");
    const messageNode = document.getElementById("loading-message");
    const messages = site.loadingMessages?.length
      ? site.loadingMessages
      : ["Loading happy tears...", "Importing wedding cake..."];
    let messageIndex = Math.max(0, messages.indexOf(randomItem(messages, messages[0])));

    if (!loader || !messageNode) {
      document.body.classList.add("is-ready");
      return;
    }

    messageNode.textContent = messages[messageIndex] || messages[0];

    const rotateMessages = window.setInterval(() => {
      messageIndex = (messageIndex + 1) % messages.length;
      messageNode.textContent = messages[messageIndex];
    }, 760);

    function finishLoading() {
      window.clearInterval(rotateMessages);
      document.body.classList.add("is-ready");
      window.setTimeout(() => {
        loader.hidden = true;
      }, shouldUseMotion() ? 900 : 80);
    }

    if (document.readyState === "complete") {
      window.setTimeout(finishLoading, shouldUseMotion() ? 650 : 0);
    } else {
      window.addEventListener("load", () => {
        window.setTimeout(finishLoading, shouldUseMotion() ? 650 : 0);
      }, { once: true });
    }
  }

  function setupMarriedCounter() {
    const counter = document.getElementById("married-counter");
    const weddingDate = new Date(`${site.weddingDate || "2026-01-01"}T00:00:00`);
    const text = getPageText();

    if (!counter || Number.isNaN(weddingDate.getTime())) {
      return;
    }

    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfWedding = new Date(weddingDate.getFullYear(), weddingDate.getMonth(), weddingDate.getDate());
    const days = Math.max(0, Math.floor((startOfToday - startOfWedding) / 86400000));
    const unit = days === 1 ? text.marriedCounterOne : text.marriedCounterMany;
    counter.textContent = `${text.marriedCounterPrefix || "We've been married for"} ${days.toLocaleString(toLocale(language))} ${unit || "days."}`;
  }

  function createPolaroidCard(photo, index) {
    const figure = document.createElement("figure");
    const image = document.createElement("img");
    const caption = document.createElement("figcaption");
    const rotation = photo.rotation || `${index % 2 === 0 ? -1.5 : 1.5}deg`;
    const rotationNumber = Number.parseFloat(rotation) || 0;

    figure.className = "polaroid-card";
    figure.style.setProperty("--polaroid-rotation", rotation);
    figure.style.setProperty("--polaroid-counter-rotation", `${(rotationNumber * -0.6).toFixed(2)}deg`);
    figure.style.setProperty("--polaroid-index", String(index));
    figure.style.setProperty("--polaroid-delay", `${index * 120}ms`);
    image.src = photo.src;
    image.alt = getLocalizedValue(photo.alt, language, getLocalizedValue(photo.caption, language, "Wedding photo"));
    image.loading = "lazy";
    caption.textContent = getLocalizedValue(photo.caption, language, "A favorite moment");

    figure.append(image, caption);
    return figure;
  }

  function renderGallery(extraPhotos) {
    const gallery = document.getElementById("wedding-gallery");

    if (!gallery) {
      return;
    }

    if (Array.isArray(extraPhotos)) {
      transientGalleryPhotos = extraPhotos;
    }

    const approvedPhotos = approvedSharedPhotos.length ? approvedSharedPhotos : (site.gallery || []);
    const photos = [...approvedPhotos, ...transientGalleryPhotos];

    if (!photos.length) {
      gallery.replaceChildren();
      return;
    }

    const visibleCount = Math.min(6, photos.length);
    const safeStart = galleryCycleStart % photos.length;
    const orderedPhotos = [...photos.slice(safeStart), ...photos.slice(0, safeStart)].slice(0, visibleCount);
    gallery.replaceChildren(...orderedPhotos.map(createPolaroidCard));
  }

  function setupGalleryCycle() {
    const photos = approvedSharedPhotos.length ? approvedSharedPhotos : (site.gallery || []);

    if (galleryCycleTimer || photos.length < 2) {
      return;
    }

    galleryCycleTimer = window.setInterval(() => {
      if (!shouldUseMotion()) {
        return;
      }

      galleryCycleStart = (galleryCycleStart + 1) % photos.length;
      renderGallery();
    }, 4800);
  }

  async function loadUploadedPhotos() {
    try {
      const response = await fetch("/gallery.php", { headers: { Accept: "application/json" } });
      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      if (!data.ok || !Array.isArray(data.photos)) {
        return [];
      }

      return data.photos.map((photo) => ({
        src: photo.url || photo.src,
        rotation: photo.rotation || `${Math.random() > 0.5 ? 1.8 : -1.8}deg`,
        caption: photo.caption || {
          en: photo.name ? `Shared by ${photo.name}` : "Shared by a guest",
          pt: photo.name ? `Enviada por ${photo.name}` : "Enviada por um convidado"
        }
      }));
    } catch {
      return [];
    }
  }

  function setupEnvelope() {
    const button = document.getElementById("envelope-button");
    const copy = document.getElementById("envelope-copy");
    const text = getPageText();

    button?.addEventListener("click", () => {
      button.classList.add("is-open");
      button.setAttribute("aria-expanded", "true");
      if (copy) {
        copy.textContent = text.envelopeCopyOpen || text.envelopeCopyClosed;
      }
      openSweetNote();
      launchConfetti({ burstCount: 2, count: 12 });
      track("envelope_open");
    });
  }

  function showPanicNote(message) {
    const panicNote = document.getElementById("panic-note");

    if (!panicNote) {
      return;
    }

    panicNote.textContent = message;
    panicNote.hidden = false;

    window.setTimeout(() => {
      panicNote.hidden = true;
    }, 4200);
  }

  function openSweetNote() {
    const modal = document.getElementById("note-modal");
    const message = document.getElementById("note-modal-message");
    const closeButton = modal?.querySelector("[data-note-close]");
    const notes = site.sweetNotes?.[language] || site.sweetNotes?.en || [];

    if (!modal || !message) {
      return;
    }

    message.textContent = randomItem(notes, getPageText().envelopeCopyOpen || "Thank you for being part of this.");
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");

    window.requestAnimationFrame(() => {
      modal.classList.add("is-visible");
      closeButton?.focus({ preventScroll: true });
    });
  }

  function closeSweetNote() {
    const modal = document.getElementById("note-modal");

    if (!modal || modal.hidden) {
      return;
    }

    modal.classList.remove("is-visible");
    modal.setAttribute("aria-hidden", "true");
    window.setTimeout(() => {
      modal.hidden = true;
    }, 220);
  }

  function setupSweetNoteModal() {
    document.querySelectorAll("[data-note-close]").forEach((control) => {
      control.addEventListener("click", closeSweetNote);
    });

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeSweetNote();
      }
    });
  }

  function setupCelebrationActions() {
    const text = getPageText();
    const confettiButton = document.getElementById("confetti-button");
    const doNotPress = document.getElementById("do-not-press");

    confettiButton?.addEventListener("click", () => {
      launchConfetti({
        burstCount: 34,
        count: 34,
        distance: 185,
        fullScreen: true,
        marks: ["+", "*", "x", ".", "!!"]
      });
      track("confetti_button");
    });

    doNotPress?.addEventListener("click", () => {
      doNotPress.textContent = text.doNotPressAfter || "Too late.";
      document.body.classList.add("is-mischief");
      launchConfetti({ burstCount: 12, count: 20, distance: 130, marks: ["!", "?", "+", "*"] });
      showPanicNote(text.panicNote || "Opening something extremely serious.");
      window.open(site.rickRollUrl || "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "_blank", "noopener,noreferrer");
      track("do_not_press");

      window.setTimeout(() => {
        document.body.classList.remove("is-mischief");
      }, 4200);
    });
  }

  function renderGuestbookEntries(entries) {
    const wall = document.getElementById("guestbook-wall");
    const text = getPageText();

    if (!wall) {
      return;
    }

    if (!entries.length) {
      const empty = document.createElement("p");
      empty.className = "guestbook-empty";
      empty.textContent = text.guestbookEmpty || "No notes yet.";
      wall.replaceChildren(empty);
      return;
    }

    const cards = entries.slice(0, 12).map((entry, index) => {
      const article = document.createElement("article");
      const quote = document.createElement("p");
      const name = document.createElement("span");

      article.className = "guestbook-note";
      article.style.setProperty("--note-rotation", `${index % 2 === 0 ? -0.8 : 0.8}deg`);
      quote.textContent = entry.message || "";
      name.textContent = entry.name || "Guest";

      article.append(quote, name);
      return article;
    });

    wall.replaceChildren(...cards);
  }

  async function fetchGuestbookEntries() {
    const text = getPageText();
    setText("guestbook-status", text.guestbookLoading);

    try {
      const response = await fetch("/guestbook.php", { headers: { Accept: "application/json" } });
      const data = await response.json();
      const entries = data.ok && Array.isArray(data.entries) ? data.entries : [];
      renderGuestbookEntries(entries);
      setText("guestbook-status", "");
    } catch {
      renderGuestbookEntries([]);
      setText("guestbook-status", "");
    }
  }

  function setupGuestbook() {
    const form = document.getElementById("guestbook-form");
    const text = getPageText();

    fetchGuestbookEntries();

    form?.addEventListener("submit", async (event) => {
      event.preventDefault();

      const formData = new FormData(form);
      const payload = {
        name: String(formData.get("name") || "").trim(),
        message: String(formData.get("message") || "").trim(),
        guest_key: key || "default",
        language: toLocale(language)
      };

      if (!payload.name || !payload.message) {
        return;
      }

      try {
        const response = await fetch("/guestbook.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok || !data.ok) {
          throw new Error("Guestbook request failed");
        }

        form.reset();
        setText("guestbook-status", text.guestbookSuccess);
        renderGuestbookEntries(data.entries || [payload]);
        launchConfetti({ burstCount: 2, count: 12 });
        track("guestbook_submit");
      } catch {
        setText("guestbook-status", text.guestbookError);
      }
    });
  }

  function setupPhotoUpload() {
    const form = document.getElementById("photo-upload-form");
    const fileInput = document.getElementById("photo-upload-file");
    const fileLabel = document.getElementById("photo-upload-file-label");
    const text = getPageText();
    let previewUrl = "";

    fileInput?.addEventListener("change", () => {
      const file = fileInput.files?.[0];
      if (!file) {
        setText("photo-upload-file-label", text.photoUploadFileLabel);
        return;
      }

      setText("photo-upload-file-label", file.name);
      setText("photo-upload-status", text.photoUploadReady);

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      previewUrl = URL.createObjectURL(file);
      renderGallery([{
        src: previewUrl,
        rotation: "-2deg",
        caption: {
          en: "Preview from your upload",
          pt: "Prévia do seu envio"
        }
      }]);
    });

    form?.addEventListener("submit", async (event) => {
      event.preventDefault();

      const formData = new FormData(form);
      formData.set("guest_key", key || "default");
      formData.set("language", toLocale(language));

      try {
        const response = await fetch("/upload-photo.php", {
          method: "POST",
          body: formData
        });
        const data = await response.json();
        if (!response.ok || !data.ok) {
          throw new Error("Upload failed");
        }

        setText("photo-upload-status", text.photoUploadSuccess);
        if (fileLabel) {
          fileLabel.textContent = text.photoUploadFileLabel;
        }
        form.reset();
        transientGalleryPhotos = [];
        renderGallery();
        launchConfetti({ burstCount: 3, count: 12 });
        track("photo_upload", { upload_name: data.file || "" });
      } catch {
        setText("photo-upload-status", text.photoUploadError);
      }
    });
  }

  function setupAnimatedSignature() {
    const signature = document.getElementById("animated-signature");

    if (!signature) {
      return;
    }

    const fullText = signature.dataset.signature || "";
    let hasWritten = false;

    function writeSignature() {
      if (hasWritten) {
        return;
      }

      hasWritten = true;

      if (!shouldUseMotion()) {
        signature.textContent = fullText;
        return;
      }

      signature.textContent = "";
      [...fullText].forEach((letter, index) => {
        window.setTimeout(() => {
          signature.textContent += letter;
        }, index * 42);
      });
    }

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            writeSignature();
            observer.disconnect();
          }
        });
      }, { threshold: 0.45 });
      observer.observe(signature);
    } else {
      writeSignature();
    }
  }

  function setupSectionReveals() {
    const sections = document.querySelectorAll(".celebration, .gallery, .guestbook, .photo-upload, .gratitude, .closing-signature");

    if (!("IntersectionObserver" in window)) {
      sections.forEach((section) => section.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.18 });

    sections.forEach((section) => observer.observe(section));
  }

  setupDisplayPreferences();
  setupGuestSplash(guestConfig, language, { guestName });
  setupLoadingExperience();
  setupMarriedCounter();
  renderGallery();
  loadUploadedPhotos().then((photos) => {
    approvedSharedPhotos = photos;
    renderGallery();
    setupGalleryCycle();
  });
  setupEnvelope();
  setupSweetNoteModal();
  setupCelebrationActions();
  setupGuestbook();
  setupPhotoUpload();
  setupAnimatedSignature();
  setupSectionReveals();

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
