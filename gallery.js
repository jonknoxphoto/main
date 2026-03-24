document.querySelectorAll(".gallery").forEach((gallery) => {
  const track = gallery.querySelector(".gallery-track");
  const slides = Array.from(track.querySelectorAll(".frame"));

  if (slides.length <= 1) return;

  let isPointerDown = false;
  let isHovering = false;

  let startX = 0;
  let lastX = 0;
  let lastTime = 0;

  let currentTranslate = 0;
  let targetTranslate = 0;
  let maxTranslate = 0;
  let velocity = 0;
  let snapTarget = null;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
  }

  function getGalleryCenter() {
    return gallery.clientWidth / 2;
  }

  function getSlideCenters() {
    const gap = parseFloat(getComputedStyle(track).gap || "0");
    let offset = 0;

    return slides.map((slide) => {
      const center = offset + slide.offsetWidth / 2;
      offset += slide.offsetWidth + gap;
      return center;
    });
  }

  function updateBounds() {
    maxTranslate = Math.max(0, track.scrollWidth - gallery.clientWidth);
    currentTranslate = clamp(currentTranslate, 0, maxTranslate);
    targetTranslate = clamp(targetTranslate, 0, maxTranslate);
  }

  function getNearestCenterSnap(rawTranslate) {
    const galleryCenter = getGalleryCenter();
    const centers = getSlideCenters();

    let best = 0;
    let smallestDistance = Infinity;

    centers.forEach((center) => {
      const translateForCenter = center - galleryCenter;
      const clamped = clamp(translateForCenter, 0, maxTranslate);
      const distance = Math.abs(clamped - rawTranslate);

      if (distance < smallestDistance) {
        smallestDistance = distance;
        best = clamped;
      }
    });

    return best;
  }

  function animate() {
    if (!isPointerDown && !isHovering) {
      targetTranslate += velocity;
      velocity *= 0.92;

      if (Math.abs(velocity) < 0.02) velocity = 0;

      if (snapTarget !== null) {
        const snapPull = (snapTarget - targetTranslate) * 0.08;
        targetTranslate += snapPull;

        if (Math.abs(snapTarget - targetTranslate) < 0.5 && Math.abs(velocity) < 0.05) {
          targetTranslate = snapTarget;
          snapTarget = null;
        }
      }
    }

    targetTranslate = clamp(targetTranslate, 0, maxTranslate);

    // Slightly tighter response, closer to Instagram
    currentTranslate += (targetTranslate - currentTranslate) * 0.22;

    if (Math.abs(targetTranslate - currentTranslate) < 0.01) {
      currentTranslate = targetTranslate;
    }

    track.style.transform = `translateX(${-currentTranslate}px)`;
    requestAnimationFrame(animate);
  }

  function beginSnap() {
    snapTarget = getNearestCenterSnap(targetTranslate);
  }

  updateBounds();
  animate();

  window.addEventListener("resize", () => {
    updateBounds();
    beginSnap();
  });

  // Desktop hover scrub
  gallery.addEventListener("mouseenter", () => {
    if (window.innerWidth <= 480) return;
    isHovering = true;
    snapTarget = null;
    velocity = 0;
  });

  gallery.addEventListener("mouseleave", () => {
    if (window.innerWidth <= 480) return;
    isHovering = false;
    beginSnap();
  });

  gallery.addEventListener("mousemove", (e) => {
    if (window.innerWidth <= 480) return;

    if (isPointerDown) {
      const now = performance.now();
      const dx = e.clientX - lastX;
      const dt = Math.max(now - lastTime, 1);

      targetTranslate = clamp(targetTranslate - dx, 0, maxTranslate);

      // Lower multiplier = more controlled, Instagram-like
      velocity = (-dx / dt) * 7;

      lastX = e.clientX;
      lastTime = now;
      snapTarget = null;
      return;
    }

    if (!isHovering) return;

    const rect = gallery.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = clamp(x / rect.width, 0, 1);

    targetTranslate = percent * maxTranslate;
    velocity = 0;
    snapTarget = null;
  });

  // Mobile touch
  gallery.addEventListener("touchstart", (e) => {
    const x = e.touches[0].clientX;
    startX = x;
    lastX = x;
    lastTime = performance.now();
    velocity = 0;
    snapTarget = null;
  }, { passive: true });

  gallery.addEventListener("touchmove", (e) => {
    const now = performance.now();
    const x = e.touches[0].clientX;
    const dx = x - lastX;
    const dt = Math.max(now - lastTime, 1);

    targetTranslate = clamp(targetTranslate - dx, 0, maxTranslate);

    // Slightly faster on touch for phone feel
    velocity = (-dx / dt) * 8.5;

    lastX = x;
    lastTime = now;
  }, { passive: true });

  gallery.addEventListener("touchend", () => {
    beginSnap();
  }, { passive: true });

  // Desktop click-drag only
  gallery.addEventListener("mousedown", (e) => {
    if (window.innerWidth <= 480) return;

    isPointerDown = true;
    startX = e.clientX;
    lastX = e.clientX;
    lastTime = performance.now();
    velocity = 0;
    snapTarget = null;
    gallery.classList.add("is-dragging");
  });

  window.addEventListener("mouseup", () => {
    if (!isPointerDown) return;

    isPointerDown = false;
    gallery.classList.remove("is-dragging");
    beginSnap();
  });

  gallery.addEventListener("dragstart", (e) => {
    e.preventDefault();
  });
});
