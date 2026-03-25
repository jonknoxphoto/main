document.querySelectorAll(".gallery").forEach((gallery) => {
  const track = gallery.querySelector(".gallery-track");
  let slides = Array.from(track.querySelectorAll(".slide"));

  if (!track || slides.length <= 1) return;

  // 🔁 CLONE FIRST + LAST
  const firstClone = slides[0].cloneNode(true);
  const lastClone = slides[slides.length - 1].cloneNode(true);

  track.appendChild(firstClone);
  track.insertBefore(lastClone, slides[0]);

  slides = Array.from(track.querySelectorAll(".slide"));

  let currentIndex = 1; // start on real first slide
  let currentTranslate = 0;
  let targetTranslate = 0;

  let isPointerDown = false;
  let isDragging = false;
  let startX = 0;
  let startTranslate = 0;
  let pointerX = 0;

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

  function getTranslate(index) {
    return index * getSlideWidth();
  }

  function applyTransform() {
    track.style.transform = `translate3d(${-currentTranslate}px,0,0)`;
  }

  function snap(index) {
    currentIndex = index;
    targetTranslate = getTranslate(currentIndex);
  }

  function instantJump(index) {
    currentIndex = index;
    currentTranslate = getTranslate(currentIndex);
    targetTranslate = currentTranslate;
    applyTransform();
  }

  function goNext() {
    snap(currentIndex + 1);
  }

  function goPrev() {
    snap(currentIndex - 1);
  }

  function animate() {
    if (!isDragging) {
      currentTranslate += (targetTranslate - currentTranslate) * 0.14;

      if (Math.abs(targetTranslate - currentTranslate) < 0.3) {
        currentTranslate = targetTranslate;

        // 🔁 LOOP FIX
        if (currentIndex === slides.length - 1) {
          instantJump(1);
        }

        if (currentIndex === 0) {
          instantJump(slides.length - 2);
        }
      }

      applyTransform();
    }

    requestAnimationFrame(animate);
  }

  function getClientX(e) {
    if (e.touches) return e.touches[0].clientX;
    return e.clientX;
  }

  function onStart(e) {
    isPointerDown = true;
    isDragging = false;
    startX = getClientX(e);
    pointerX = startX;
    startTranslate = targetTranslate;

    gallery.classList.add("is-dragging");
  }

  function onMove(e) {
    if (!isPointerDown) return;

    pointerX = getClientX(e);
    const dx = pointerX - startX;

    if (Math.abs(dx) > 4) isDragging = true;

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

    if (dx < -threshold) goNext();
    else if (dx > threshold) goPrev();
    else snap(currentIndex);

    isDragging = false;
  }

  // EVENTS
  gallery.addEventListener("mousedown", onStart);
  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onEnd);

  gallery.addEventListener("touchstart", onStart, { passive: true });
  gallery.addEventListener("touchmove", onMove, { passive: true });
  gallery.addEventListener("touchend", onEnd, { passive: true });

  gallery.addEventListener("dragstart", (e) => e.preventDefault());

  window.addEventListener("resize", () => {
    instantJump(currentIndex);
  });

  // INIT
  instantJump(1);
  animate();
});
