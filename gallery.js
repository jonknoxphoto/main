document.querySelectorAll(".gallery").forEach((gallery) => {
  if (gallery.dataset.carouselInit === "true") return;
  gallery.dataset.carouselInit = "true";

  const track = gallery.querySelector(".gallery-track");
  if (!track) return;

  const originalSlides = Array.from(track.querySelectorAll(".slide"));
  const realCount = originalSlides.length;
  if (realCount <= 1) return;

  let slides = [];
  let currentIndex = 1;

  let currentTranslate = 0;
  let targetTranslate = 0;

  let isPointerDown = false;
  let isDragging = false;
  let isScrollingY = false;
  let isWrapping = false;

  let startX = 0;
  let startY = 0;
  let startTranslate = 0;

  let lastMoveX = 0;
  let lastMoveTime = 0;
  let velocityX = 0;

  function isDesktop() {
    return window.innerWidth > 480;
  }

  function getTranslateForIndex(index) {
    const slide = slides[index];
    if (!slide) return 0;

    const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
    const galleryCenter = gallery.clientWidth / 2;

    return slideCenter - galleryCenter;
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

  function warmImage(img) {
    if (!img || img.dataset.warmed === "true") return;

    img.dataset.warmed = "true";
    img.loading = "eager";
    img.fetchPriority = "high";

    if (img.dataset.src && !img.src) img.src = img.dataset.src;
    if (img.dataset.srcset && !img.srcset) img.srcset = img.dataset.srcset;

    if (img.decode) {
      img.decode().catch(() => {});
    } else {
      const preloader = new Image();
      preloader.src = img.currentSrc || img.src;
    }
  }

  function warmSlide(index) {
    const slide = slides[index];
    if (!slide) return;
    slide.querySelectorAll("img").forEach(warmImage);
  }

  function warmDesktopSlides(realIndex) {
    const prev = realIndex === 0 ? realCount - 1 : realIndex - 1;
    const next = realIndex === realCount - 1 ? 0 : realIndex + 1;

    [realIndex, prev, next].forEach((i) => {
      originalSlides[i]?.querySelectorAll("img").forEach(warmImage);
    });
  }

  function warmMobileSlides(centerIndex) {
    warmSlide(centerIndex);
    warmSlide(centerIndex - 1);
    warmSlide(centerIndex + 1);

    if (centerIndex === 1) warmSlide(realCount + 1);
    if (centerIndex === realCount) warmSlide(0);
    if (centerIndex === 0) warmSlide(realCount);
    if (centerIndex === realCount + 1) warmSlide(1);
  }

  function buildMobileLoop() {
    track.querySelectorAll(".is-clone").forEach((el) => el.remove());

    const freshRealSlides = Array.from(track.querySelectorAll(".slide")).filter(
      (slide) => !slide.classList.contains("is-clone")
    );

    const firstClone = freshRealSlides[0].cloneNode(true);
    const lastClone = freshRealSlides[freshRealSlides.length - 1].cloneNode(true);

    firstClone.classList.add("is-clone");
    lastClone.classList.add("is-clone");

    track.appendChild(firstClone);
    track.insertBefore(lastClone, freshRealSlides[0]);

    slides = Array.from(track.querySelectorAll(".slide"));
  }

  function destroyMobileLoop() {
    track.querySelectorAll(".is-clone").forEach((el) => el.remove());
    slides = Array.from(track.querySelectorAll(".slide"));
  }

  function setDesktopActive(realIndex) {
    originalSlides.forEach((slide, i) => {
      slide.classList.toggle("is-active", i === realIndex);
    });

    warmDesktopSlides(realIndex);
  }

  function setMobileIndex(index, immediate = false) {
    currentIndex = index;
    targetTranslate = getTranslateForIndex(index);
    warmMobileSlides(index);

    if (immediate) {
      currentTranslate = targetTranslate;
      applyTransform();
    }
  }

  function instantJumpTo(index) {
    currentIndex = index;
    currentTranslate = getTranslateForIndex(index);
    targetTranslate = currentTranslate;
    applyTransform();
    warmMobileSlides(index);
  }

  function goNext() {
    if (isDesktop()) {
      currentIndex = currentIndex >= realCount ? 1 : currentIndex + 1;
      setDesktopActive(currentIndex - 1);
      return;
    }

    if (isWrapping) return;

    if (currentIndex === realCount) {
      isWrapping = true;
      setMobileIndex(realCount + 1);
    } else {
      setMobileIndex(currentIndex + 1);
    }
  }

  function goPrev() {
    if (isDesktop()) {
      currentIndex = currentIndex <= 1 ? realCount : currentIndex - 1;
      setDesktopActive(currentIndex - 1);
      return;
    }

    if (isWrapping) return;

    if (currentIndex === 1) {
      isWrapping = true;
      setMobileIndex(0);
    } else {
      setMobileIndex(currentIndex - 1);
    }
  }

  function normalizeLoopPosition() {
    if (currentIndex === 0) {
      instantJumpTo(realCount);
      isWrapping = false;
      return true;
    }

    if (currentIndex === realCount + 1) {
      instantJumpTo(1);
      isWrapping = false;
      return true;
    }

    return false;
  }

  function animate() {
    if (!isDesktop() && !isDragging) {
      currentTranslate += (targetTranslate - currentTranslate) * 0.14;

      if (Math.abs(targetTranslate - currentTranslate) < 0.35) {
        currentTranslate = targetTranslate;
        applyTransform();

        if (!normalizeLoopPosition()) {
          isWrapping = false;
        }
      } else {
        applyTransform();
      }
    }

    requestAnimationFrame(animate);
  }

  function getClientX(e) {
    if (e.touches && e.touches.length) return e.touches[0].clientX;
    if (e.changedTouches && e.changedTouches.length) return e.changedTouches[0].clientX;
    return e.clientX;
  }

  function getClientY(e) {
    if (e.touches && e.touches.length) return e.touches[0].clientY;
    if (e.changedTouches && e.changedTouches.length) return e.changedTouches[0].clientY;
    return e.clientY;
  }

  function onStart(e) {
    if (isDesktop()) {
      isPointerDown = true;
      clearDesktopCursor();
      return;
    }

    if (isWrapping) return;

    isPointerDown = true;
    isDragging = false;
    isScrollingY = false;

    startX = getClientX(e);
    startY = getClientY(e);
    startTranslate = currentTranslate;

    lastMoveX = startX;
    lastMoveTime = performance.now();
    velocityX = 0;

    gallery.classList.add("is-dragging");
    clearDesktopCursor();
    warmMobileSlides(currentIndex);
  }

  function onMove(e) {
    if (isDesktop()) {
      if (!isPointerDown) updateDesktopCursor(e);
      return;
    }

    if (!isPointerDown) {
      updateDesktopCursor(e);
      return;
    }

    const x = getClientX(e);
    const y = getClientY(e);
    const dx = x - startX;
    const dy = y - startY;

    if (!isDragging && !isScrollingY) {
      if (Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) {
        isScrollingY = true;
        gallery.classList.remove("is-dragging");
        return;
      }

      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
        isDragging = true;
      }
    }

    if (isScrollingY) return;

    if (isDragging) {
      const now = performance.now();
      const dt = now - lastMoveTime || 1;

      velocityX = (x - lastMoveX) / dt;
      lastMoveX = x;
      lastMoveTime = now;

      currentTranslate = startTranslate - dx * 0.92;
      applyTransform();

      if (dx < 0) {
        warmSlide(currentIndex + 1);
        if (currentIndex === realCount) warmSlide(realCount + 1);
      } else if (dx > 0) {
        warmSlide(currentIndex - 1);
        if (currentIndex === 1) warmSlide(0);
      }
    }
  }

  function onEnd(e) {
    if (!isPointerDown) return;

    if (isDesktop()) {
      isPointerDown = false;

      if (e.clientX !== undefined) {
        const rect = gallery.getBoundingClientRect();
        const clickX = e.clientX - rect.left;

        if (clickX > rect.width / 2) {
          goNext();
        } else {
          goPrev();
        }

        updateDesktopCursor(e);
      }

      return;
    }

    isPointerDown = false;
    gallery.classList.remove("is-dragging");

    if (isScrollingY) {
      isDragging = false;
      isScrollingY = false;
      return;
    }

    const dx = getClientX(e) - startX;
    const threshold = gallery.clientWidth * 0.1;
    const flickVelocity = 0.45;

    if (!isDragging) {
      setMobileIndex(currentIndex);
      isDragging = false;
      isScrollingY = false;
      velocityX = 0;
      return;
    }

    if (!isWrapping) {
      if (dx < -threshold || velocityX < -flickVelocity) {
        goNext();
      } else if (dx > threshold || velocityX > flickVelocity) {
        goPrev();
      } else {
        setMobileIndex(currentIndex);
      }
    }

    isDragging = false;
    isScrollingY = false;
    velocityX = 0;
  }

  function setupMode() {
    if (isDesktop()) {
      destroyMobileLoop();
      track.style.transform = "";
      currentIndex = Math.min(Math.max(currentIndex, 1), realCount);
      setDesktopActive(currentIndex - 1);
      clearDesktopCursor();
    } else {
      buildMobileLoop();
      currentIndex = Math.min(Math.max(currentIndex, 1), realCount);
      instantJumpTo(currentIndex);
      isWrapping = false;
      clearDesktopCursor();
    }
  }

  gallery.addEventListener("mouseenter", updateDesktopCursor);
  gallery.addEventListener("mousemove", updateDesktopCursor);
  gallery.addEventListener("mouseleave", clearDesktopCursor);

  gallery.addEventListener("mousedown", onStart);
  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onEnd);

  gallery.addEventListener("touchstart", onStart, { passive: true });
  window.addEventListener("touchmove", onMove, { passive: true });
  window.addEventListener("touchend", onEnd, { passive: true });
  window.addEventListener("touchcancel", onEnd, { passive: true });

  gallery.addEventListener("dragstart", (e) => {
    e.preventDefault();
  });

  window.addEventListener("resize", setupMode);

  setupMode();
  animate();
});
