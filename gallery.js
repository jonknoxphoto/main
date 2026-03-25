document.querySelectorAll(".gallery").forEach((gallery) => {
  if (gallery.dataset.carouselInit === "true") return;
  gallery.dataset.carouselInit = "true";

  const track = gallery.querySelector(".gallery-track");
  if (!track) return;

  // force vertical centering instead of top alignment
  gallery.style.display = "flex";
  gallery.style.alignItems = "center";

  track.style.display = "flex";
  track.style.alignItems = "center";

  track.querySelectorAll(".is-clone").forEach((el) => el.remove());

  const realSlides = Array.from(track.querySelectorAll(".slide"));
  const realCount = realSlides.length;
  if (realCount <= 1) return;

  // force each slide/frame to center its image content
  realSlides.forEach((slide) => {
    slide.style.display = "flex";
    slide.style.alignItems = "center";
    slide.style.justifyContent = "center";

    const frame = slide.querySelector(".frame");
    if (frame) {
      frame.style.display = "flex";
      frame.style.alignItems = "center";
      frame.style.justifyContent = "center";
    }
  });

  const firstClone = realSlides[0].cloneNode(true);
  const lastClone = realSlides[realCount - 1].cloneNode(true);
  firstClone.classList.add("is-clone");
  lastClone.classList.add("is-clone");

  track.appendChild(firstClone);
  track.insertBefore(lastClone, realSlides[0]);

  let slides = Array.from(track.querySelectorAll(".slide"));

  // apply centering to clones too
  slides.forEach((slide) => {
    slide.style.display = "flex";
    slide.style.alignItems = "center";
    slide.style.justifyContent = "center";

    const frame = slide.querySelector(".frame");
    if (frame) {
      frame.style.display = "flex";
      frame.style.alignItems = "center";
      frame.style.justifyContent = "center";
    }
  });

  let currentIndex = 1;
  let currentTranslate = 0;
  let targetTranslate = 0;

  let isPointerDown = false;
  let isDragging = false;
  let startX = 0;
  let startTranslate = 0;

  function getClientX(e) {
    if (e.touches && e.touches.length) return e.touches[0].clientX;
    if (e.changedTouches && e.changedTouches.length) return e.changedTouches[0].clientX;
    return e.clientX;
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

  function setIndex(index, immediate = false) {
    currentIndex = index;
    targetTranslate = getTranslateForIndex(index);

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
  }

  function goNext() {
    setIndex(currentIndex >= realCount ? realCount + 1 : currentIndex + 1);
  }

  function goPrev() {
    setIndex(currentIndex <= 1 ? 0 : currentIndex - 1);
  }

  function normalizeLoopPosition() {
    if (currentIndex === 0) instantJumpTo(realCount);
    if (currentIndex === realCount + 1) instantJumpTo(1);
  }

  function animate() {
    if (!isDragging) {
      currentTranslate += (targetTranslate - currentTranslate) * 0.14;

      if (Math.abs(targetTranslate - currentTranslate) < 0.35) {
        currentTranslate = targetTranslate;
        applyTransform();
        normalizeLoopPosition();
      } else {
        applyTransform();
      }
    }

    requestAnimationFrame(animate);
  }

  function onStart(e) {
    isPointerDown = true;
    isDragging = false;
    startX = getClientX(e);
    startTranslate = currentTranslate;
  }

  function onMove(e) {
    if (!isPointerDown) return;

    const dx = getClientX(e) - startX;

    if (Math.abs(dx) > 8) isDragging = true;

    if (isDragging) {
      currentTranslate = startTranslate - dx;
      applyTransform();
    }
  }

  function onEnd(e) {
    if (!isPointerDown) return;
    isPointerDown = false;

    const dx = getClientX(e) - startX;
    const threshold = gallery.clientWidth * 0.12;

    if (isDragging) {
      if (dx < -threshold) goNext();
      else if (dx > threshold) goPrev();
      else setIndex(currentIndex);
    } else {
      const rect = gallery.getBoundingClientRect();
      const clickX = getClientX(e) - rect.left;
      if (clickX > rect.width / 2) goNext();
      else goPrev();
    }

    isDragging = false;
  }

  gallery.addEventListener("mousedown", onStart);
  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onEnd);

  gallery.addEventListener("touchstart", onStart, { passive: true });
  window.addEventListener("touchmove", onMove, { passive: true });
  window.addEventListener("touchend", onEnd, { passive: true });

  window.addEventListener("resize", () => {
    slides = Array.from(track.querySelectorAll(".slide"));

    slides.forEach((slide) => {
      slide.style.display = "flex";
      slide.style.alignItems = "center";
      slide.style.justifyContent = "center";

      const frame = slide.querySelector(".frame");
      if (frame) {
        frame.style.display = "flex";
        frame.style.alignItems = "center";
        frame.style.justifyContent = "center";
      }
    });

    instantJumpTo(currentIndex);
  });

  instantJumpTo(1);
  animate();
});
