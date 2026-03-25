document.querySelectorAll(".gallery").forEach((gallery) => {
  const track = gallery.querySelector(".gallery-track");
  const slides = Array.from(track.querySelectorAll(".slide"));

  if (!track || slides.length <= 1) return;

  let currentIndex = 0;
  let currentTranslate = 0;
  let targetTranslate = 0;

  let isPointerDown = false;
  let isDragging = false;
  let startX = 0;
  let startTranslate = 0;

  function isDesktop() {
    return window.innerWidth > 480;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
  }

  function getGap() {
    return parseFloat(getComputedStyle(track).gap || "0");
  }

  function getSlideWidth() {
    return gallery.clientWidth + getGap();
  }

  function getTranslateForIndex(index) {
    return clamp(index, 0, slides.length - 1) * getSlideWidth();
  }

  function applyTransform() {
    track.style.transform = `translate3d(${-currentTranslate}px, 0, 0)`;
  }

  function updateDesktopCursor(e) {
    if (!isDesktop() || isPointerDown || e.clientX === undefined) return;

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

  function snapTo(index, immediate = false) {
    currentIndex = clamp(index, 0, slides.length - 1);
    targetTranslate = getTranslateForIndex(currentIndex);

    if (immediate) {
      currentTranslate = targetTranslate;
      applyTransform();
    }
  }

  function goNext() {
    if (currentIndex >= slides.length - 1) {
      snapTo(0);
    } else {
      snapTo(currentIndex + 1);
    }
  }

  function goPrev() {
    if (currentIndex <= 0) {
      snapTo(slides.length - 1);
    } else {
      snapTo(currentIndex - 1);
    }
  }

  function animate() {
    if (!isDragging) {
      currentTranslate += (targetTranslate - currentTranslate) * 0.14;

      if (Math.abs(targetTranslate - currentTranslate) < 0.25) {
        currentTranslate = targetTranslate;
      }

      applyTransform();
    }

    requestAnimationFrame(animate);
  }

  function getClientX(e) {
    if (e.touches && e.touches.length) return e.touches[0].clientX;
    if (e.changedTouches && e.changedTouches.length) return e.changedTouches[0].clientX;
    return e.clientX;
  }

  function onStart(e) {
    isPointerDown = true;
    isDragging = false;
    startX = getClientX(e);
    startTranslate = targetTranslate;

    gallery.classList.add("is-dragging");
    clearDesktopCursor();
  }

  function onMove(e) {
    if (!isPointerDown) {
      updateDesktopCursor(e);
      return;
    }

    const dx = getClientX(e) - startX;

    if (Math.abs(dx) > 4) {
      isDragging = true;
    }

    if (isDragging) {
      currentTranslate = startTranslate - dx;
      applyTransform();
    }
  }

  function onEnd(e) {
    if (!isPointerDown) return;

    isPointerDown = false;
    gallery.classList.remove("is-dragging");

    const dx = getClientX(e) - startX;
    const threshold = gallery.clientWidth * 0.12;

    if (!isDragging) {
      if (isDesktop() && e.clientX !== undefined) {
        const rect = gallery.getBoundingClientRect();
        const clickX = e.clientX - rect.left;

        if (clickX > rect.width / 2) {
          goNext();
        } else {
          goPrev();
        }

        updateDesktopCursor(e);
      } else {
        snapTo(currentIndex);
      }

      return;
    }

    if (dx < -threshold) {
      goNext();
    } else if (dx > threshold) {
      goPrev();
    } else {
      snapTo(currentIndex);
    }

    isDragging = false;
  }

  gallery.addEventListener("mouseenter", updateDesktopCursor);
  gallery.addEventListener("mousemove", updateDesktopCursor);
  gallery.addEventListener("mouseleave", clearDesktopCursor);

  gallery.addEventListener("mousedown", onStart);
  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onEnd);

  gallery.addEventListener("touchstart", onStart, { passive: true });
  gallery.addEventListener("touchmove", onMove, { passive: true });
  gallery.addEventListener("touchend", onEnd, { passive: true });

  gallery.addEventListener("dragstart", (e) => {
    e.preventDefault();
  });

  window.addEventListener("resize", () => {
    snapTo(currentIndex, true);
    if (!isDesktop()) clearDesktopCursor();
  });

  snapTo(0, true);
  animate();
});
