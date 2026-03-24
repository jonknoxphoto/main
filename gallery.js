document.querySelectorAll(".gallery").forEach((gallery) => {
  const track = gallery.querySelector(".gallery-track");
  const slides = Array.from(track.querySelectorAll(".frame"));

  if (slides.length <= 1) return;

  let isPointerDown = false;
  let hasDragged = false;

  let startX = 0;
  let lastX = 0;

  let currentTranslate = 0;
  let targetTranslate = 0;
  let maxTranslate = 0;
  let snapTarget = null;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
  }

  function isDesktop() {
    return window.innerWidth > 480;
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

  function getCurrentSlideIndex() {
    const snapped = getNearestCenterSnap(targetTranslate);
    const galleryCenter = getGalleryCenter();
    const centers = getSlideCenters();

    let bestIndex = 0;
    let smallestDistance = Infinity;

    centers.forEach((center, index) => {
      const translateForCenter = clamp(center - galleryCenter, 0, maxTranslate);
      const distance = Math.abs(translateForCenter - snapped);

      if (distance < smallestDistance) {
        smallestDistance = distance;
        bestIndex = index;
      }
    });

    return bestIndex;
  }

  function snapToSlide(index) {
    const centers = getSlideCenters();
    const galleryCenter = getGalleryCenter();
    const totalSlides = slides.length;
    const wrappedIndex = (index + totalSlides) % totalSlides;
    const translateForCenter = centers[wrappedIndex] - galleryCenter;

    snapTarget = clamp(translateForCenter, 0, maxTranslate);
  }

  function beginSnap() {
    snapTarget = getNearestCenterSnap(targetTranslate);
  }

  function updateDesktopCursor(e) {
    if (!isDesktop() || isPointerDown) return;

    const rect = gallery.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;

    gallery.style.setProperty("--cursor-x", `${x}px`);
    gallery.style.setProperty("--cursor-y", `${y}px`);
    gallery.classList.add("show-cursor");
    gallery.classList.toggle("cursor-left", x < centerX);
    gallery.classList.toggle("cursor-right", x >= centerX);
  }

  function clearDesktopCursor() {
    gallery.classList.remove("show-cursor", "cursor-left", "cursor-right");
  }

  function animate() {
    if (snapTarget !== null && !isPointerDown) {
      targetTranslate += (snapTarget - targetTranslate) * 0.18;

      if (Math.abs(snapTarget - targetTranslate) < 0.5) {
        targetTranslate = snapTarget;
        snapTarget = null;
      }
    }

    targetTranslate = clamp(targetTranslate, 0, maxTranslate);

    currentTranslate += (targetTranslate - currentTranslate) * 0.24;

    if (Math.abs(targetTranslate - currentTranslate) < 0.01) {
      currentTranslate = targetTranslate;
    }

    track.style.transform = `translateX(${-currentTranslate}px)`;
    requestAnimationFrame(animate);
  }

  updateBounds();
  animate();

  window.addEventListener("resize", () => {
    updateBounds();
    beginSnap();

    if (!isDesktop()) {
      clearDesktopCursor();
    }
  });

  gallery.addEventListener("mouseenter", (e) => {
    if (!isDesktop()) return;
    updateDesktopCursor(e);
  });

  gallery.addEventListener("mouseleave", () => {
    clearDesktopCursor();
  });

  // Desktop drag + cursor follow
  gallery.addEventListener("mousemove", (e) => {
    if (!isDesktop()) return;

    if (isPointerDown) {
      if (Math.abs(e.clientX - startX) > 4) {
        hasDragged = true;
      }

      const dx = e.clientX - lastX;
      targetTranslate = clamp(targetTranslate - dx, 0, maxTranslate);

      lastX = e.clientX;
      snapTarget = null;
      return;
    }

    updateDesktopCursor(e);
  });

  // Mobile touch
  gallery.addEventListener(
    "touchstart",
    (e) => {
      const x = e.touches[0].clientX;
      startX = x;
      lastX = x;
      snapTarget = null;
    },
    { passive: true }
  );

gallery.addEventListener(
  "touchmove",
  (e) => {
    const x = e.touches[0].clientX;
    const dx = x - lastX;

    const now = performance.now();
    const dt = now - (lastTime || now);

    // velocity (px per ms)
    const velocity = dt > 0 ? dx / dt : 0;

    // base speed + velocity boost
    const speedMultiplier = 2.6 + Math.abs(velocity) * 6;

    targetTranslate = clamp(
      targetTranslate - dx * speedMultiplier,
      0,
      maxTranslate
    );

    lastX = x;
    lastTime = now;
    snapTarget = null;
  },
  { passive: true }
);

  gallery.addEventListener(
    "touchend",
    () => {
      beginSnap();
    },
    { passive: true }
  );

  // Desktop drag / click
  gallery.addEventListener("mousedown", (e) => {
    if (!isDesktop()) return;

    isPointerDown = true;
    hasDragged = false;
    startX = e.clientX;
    lastX = e.clientX;
    snapTarget = null;
    gallery.classList.add("is-dragging");
    clearDesktopCursor();
  });

  window.addEventListener("mouseup", (e) => {
    if (!isPointerDown) return;

    isPointerDown = false;
    gallery.classList.remove("is-dragging");

    if (!hasDragged && isDesktop()) {
      const rect = gallery.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const centerX = rect.width / 2;
      const currentIndex = getCurrentSlideIndex();
      const totalSlides = slides.length;

      let nextIndex;

      if (x > centerX) {
        nextIndex = (currentIndex + 1) % totalSlides;
      } else {
        nextIndex = (currentIndex - 1 + totalSlides) % totalSlides;
      }

      const centers = getSlideCenters();
      const galleryCenter = getGalleryCenter();
      const translateForCenter = centers[nextIndex] - galleryCenter;
      const finalTranslate = clamp(translateForCenter, 0, maxTranslate);

      targetTranslate = finalTranslate;
      currentTranslate = finalTranslate;
      snapTarget = null;
    } else {
      beginSnap();
    }

    if (isDesktop()) {
      updateDesktopCursor(e);
    }
  });

  gallery.addEventListener("dragstart", (e) => {
    e.preventDefault();
  });
});
