document.querySelectorAll(".gallery").forEach((gallery) => {
  const track = gallery.querySelector(".gallery-track");
  const slides = Array.from(track.querySelectorAll(".frame"));

  if (!track || slides.length <= 1) return;

  let isPointerDown = false;
  let hasDragged = false;

  let startX = 0;
  let lastX = 0;
  let touchDirection = 0;

  let currentIndex = 0;
  let currentTranslate = 0;
  let targetTranslate = 0;

  function isDesktop() {
    return window.innerWidth > 480;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
  }

  function getGalleryCenter() {
    return gallery.clientWidth / 2;
  }

  function getMaxTranslate() {
    return Math.max(0, track.scrollWidth - gallery.clientWidth);
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

  function getSlideTranslate(index) {
    const centers = getSlideCenters();
    const galleryCenter = getGalleryCenter();
    const safeIndex = clamp(index, 0, slides.length - 1);
    const rawTranslate = centers[safeIndex] - galleryCenter;
    return clamp(rawTranslate, 0, getMaxTranslate());
  }

  function applyTransform() {
    track.style.transform = `translateX(${-currentTranslate}px)`;
  }

  function jumpToSlide(index) {
    currentIndex = clamp(index, 0, slides.length - 1);
    const translate = getSlideTranslate(currentIndex);
    currentTranslate = translate;
    targetTranslate = translate;
    applyTransform();
  }

  function animateToSlide(index) {
    currentIndex = clamp(index, 0, slides.length - 1);
    targetTranslate = getSlideTranslate(currentIndex);
  }

  function goNextInstant() {
    if (currentIndex === slides.length - 1) {
      jumpToSlide(0);
    } else {
      jumpToSlide(currentIndex + 1);
    }
  }

  function goPrevInstant() {
    if (currentIndex === 0) {
      jumpToSlide(slides.length - 1);
    } else {
      jumpToSlide(currentIndex - 1);
    }
  }

  function goNextAnimated() {
    if (currentIndex === slides.length - 1) {
      jumpToSlide(0);
    } else {
      animateToSlide(currentIndex + 1);
    }
  }

  function goPrevAnimated() {
    if (currentIndex === 0) {
      jumpToSlide(slides.length - 1);
    } else {
      animateToSlide(currentIndex - 1);
    }
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
    currentTranslate += (targetTranslate - currentTranslate) * 0.24;

    if (Math.abs(targetTranslate - currentTranslate) < 0.01) {
      currentTranslate = targetTranslate;
    }

    applyTransform();
    requestAnimationFrame(animate);
  }

  jumpToSlide(0);
  animate();

  window.addEventListener("resize", () => {
    jumpToSlide(currentIndex);

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

  gallery.addEventListener("mousemove", (e) => {
    if (!isDesktop()) return;

    if (isPointerDown) {
      if (Math.abs(e.clientX - startX) > 4) {
        hasDragged = true;
      }
      return;
    }

    updateDesktopCursor(e);
  });

  gallery.addEventListener(
    "touchstart",
    (e) => {
      const x = e.touches[0].clientX;
      startX = x;
      lastX = x;
      touchDirection = 0;
    },
    { passive: true }
  );

  gallery.addEventListener(
    "touchmove",
    (e) => {
      const x = e.touches[0].clientX;
      const dx = x - lastX;

      if (dx !== 0) {
        touchDirection = dx;
      }

      lastX = x;
    },
    { passive: true }
  );

  gallery.addEventListener(
    "touchend",
    () => {
      const swipeDistance = lastX - startX;

      if (swipeDistance < -20) {
        goNextInstant();
      } else if (swipeDistance > 20) {
        goPrevInstant();
      } else if (touchDirection < 0) {
        goNextInstant();
      } else if (touchDirection > 0) {
        goPrevInstant();
      } else {
        jumpToSlide(currentIndex);
      }
    },
    { passive: true }
  );

  gallery.addEventListener("mousedown", (e) => {
    if (!isDesktop()) return;

    isPointerDown = true;
    hasDragged = false;
    startX = e.clientX;
    lastX = e.clientX;
    gallery.classList.add("is-dragging");
    clearDesktopCursor();
  });

  window.addEventListener("mouseup", (e) => {
    if (!isPointerDown) return;

    isPointerDown = false;
    gallery.classList.remove("is-dragging");

    const dx = e.clientX - startX;

    if (!hasDragged && isDesktop()) {
      const rect = gallery.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const centerX = rect.width / 2;

      if (x > centerX) {
        goNextInstant();
      } else {
        goPrevInstant();
      }
    } else if (dx < -20) {
      goNextAnimated();
    } else if (dx > 20) {
      goPrevAnimated();
    } else {
      jumpToSlide(currentIndex);
    }

    if (isDesktop()) {
      updateDesktopCursor(e);
    }
  });

  gallery.addEventListener("dragstart", (e) => {
    e.preventDefault();
  });
});
