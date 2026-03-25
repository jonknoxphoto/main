document.querySelectorAll(".gallery").forEach((gallery) => {
  if (gallery.dataset.carouselInit === "true") return;
  gallery.dataset.carouselInit = "true";

  const track = gallery.querySelector(".gallery-track");
  if (!track) return;

  // remove any stale clones before rebuilding
  track.querySelectorAll(".is-clone").forEach((el) => el.remove());

  const realSlides = Array.from(track.querySelectorAll(".slide"));
  const realCount = realSlides.length;
  if (realCount <= 1) return;

  // create loop clones
  const firstClone = realSlides[0].cloneNode(true);
  const lastClone = realSlides[realCount - 1].cloneNode(true);
  firstClone.classList.add("is-clone");
  lastClone.classList.add("is-clone");

  track.appendChild(firstClone);
  track.insertBefore(lastClone, realSlides[0]);

  let slides = Array.from(track.querySelectorAll(".slide"));

  let currentIndex = 1; // first real slide
  let currentTranslate = 0;
  let targetTranslate = 0;

  let isPointerDown = false;
  let isDragging = false;
  let startX = 0;
  let startTranslate = 0;

  function isDesktop() {
    return window.innerWidth > 480;
  }

  function getTranslateForIndex(index) {
    const slide = slides[index];
    return slide ? slide.offsetLeft : 0;
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
    if (currentIndex >= realCount) {
      setIndex(realCount + 1); // first clone
    } else {
      setIndex(currentIndex + 1);
    }
  }

  function goPrev() {
    if (currentIndex <= 1) {
      setIndex(0); // last clone
    } else {
      setIndex(currentIndex - 1);
    }
  }

  function normalizeLoopPosition() {
    if (currentIndex === 0) {
      instantJumpTo(realCount);
      return;
    }

    if (currentIndex === realCount + 1) {
      instantJumpTo(1);
    }
  }

  function animate() {
    if (!isDragging) {
      currentTranslate += (targetTranslate - currentTranslate) * 0.16;

      if (Math.abs(targetTranslate - currentTranslate) < 0.5) {
        currentTranslate = targetTranslate;
        applyTransform();
        normalizeLoopPosition();
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

  function onStart(e) {
    isPointerDown = true;
    isDragging = false;
    startX = getClientX(e);
    startTranslate = currentTranslate;

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
        setIndex(currentIndex);
      }
      return;
    }

    if (dx < -threshold) {
      goNext();
    } else if (dx > threshold) {
      goPrev();
    } else {
      setIndex(currentIndex);
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
  window.addEventListener("touchmove", onMove, { passive: true });
  window.addEventListener("touchend", onEnd, { passive: true });

  gallery.addEventListener("dragstart", (e) => {
    e.preventDefault();
  });

  window.addEventListener("resize", () => {
    slides = Array.from(track.querySelectorAll(".slide"));
    instantJumpTo(currentIndex);
    if (!isDesktop()) clearDesktopCursor();
  });

  instantJumpTo(1);
  animate();
});

