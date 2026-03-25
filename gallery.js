document.querySelectorAll(".gallery").forEach((gallery) => {
  const track = gallery.querySelector(".gallery-track");
  const slides = Array.from(track.querySelectorAll(".item"));

  if (!track || slides.length <= 1) return;

  let isPointerDown = false;
  let hasDragged = false;

  let startX = 0;
  let lastX = 0;

  let currentIndex = 0;
  let currentTranslate = 0;
  let targetTranslate = 0;

  function isDesktop() {
    return window.innerWidth > 480;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
  }

  function getGap() {
    return parseFloat(getComputedStyle(track).gap || "0");
  }

  function getSlideTranslate(index) {
    const safeIndex = clamp(index, 0, slides.length - 1);
    const slideWidth = gallery.clientWidth;
    const gap = getGap();
    return safeIndex * (slideWidth + gap);
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

  function goNext() {
    if (currentIndex === slides.length - 1) {
      animateToSlide(0);
    } else {
      animateToSlide(currentIndex + 1);
    }
  }

  function goPrev() {
    if (currentIndex === 0) {
      animateToSlide(slides.length - 1);
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
    currentTranslate += (targetTranslate - currentTranslate) * 0.18;

    if (Math.abs(targetTranslate - currentTranslate) < 0.5) {
      currentTranslate = targetTranslate;
    }

    applyTransform();
    requestAnimationFrame(animate);
  }

  jumpToSlide(0);
  animate();

  window.addEventListener("resize", () => {
    jumpToSlide(currentIndex);
    if (!isDesktop()) clearDesktopCursor();
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
      startX = e.touches[0].clientX;
      lastX = startX;
    },
    { passive: true }
  );

  gallery.addEventListener(
    "touchmove",
    (e) => {
      lastX = e.touches[0].clientX;
    },
    { passive: true }
  );

  gallery.addEventListener(
    "touchend",
    () => {
      const swipeDistance = lastX - startX;

      if (swipeDistance < -30) {
        goNext();
      } else if (swipeDistance > 30) {
        goPrev();
      } else {
        animateToSlide(currentIndex);
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

    if (!hasDragged) {
      const rect = gallery.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const centerX = rect.width / 2;

      if (x > centerX) {
        goNext();
      } else {
        goPrev();
      }
    } else if (dx < -30) {
      goNext();
    } else if (dx > 30) {
      goPrev();
    } else {
      animateToSlide(currentIndex);
    }

    if (isDesktop()) {
      updateDesktopCursor(e);
    }
  });

  gallery.addEventListener("dragstart", (e) => {
    e.preventDefault();
  });
});
