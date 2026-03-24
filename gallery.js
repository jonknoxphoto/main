document.querySelectorAll(".gallery").forEach((gallery) => {
  const track = gallery.querySelector(".gallery-track");
  const slides = Array.from(track.querySelectorAll(".frame"));

  if (slides.length <= 1) return;

  let isDown = false;
  let isHovering = false;
  let startX = 0;
  let lastX = 0;
  let lastTime = 0;

  let touchStartX = 0;
  let touchLastX = 0;
  let touchLastTime = 0;

  let currentTranslate = 0;
  let targetTranslate = 0;
  let maxTranslate = 0;
  let velocity = 0;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
  }

  function updateBounds() {
    maxTranslate = track.scrollWidth - gallery.offsetWidth;
    if (maxTranslate < 0) maxTranslate = 0;

    currentTranslate = clamp(currentTranslate, 0, maxTranslate);
    targetTranslate = clamp(targetTranslate, 0, maxTranslate);
  }

  function animate() {
    if (!isDown) {
      targetTranslate += velocity;
      velocity *= 0.92;

      if (Math.abs(velocity) < 0.02) {
        velocity = 0;
      }
    }

    targetTranslate = clamp(targetTranslate, 0, maxTranslate);

    currentTranslate += (targetTranslate - currentTranslate) * 0.18;
    track.style.transform = `translateX(${-currentTranslate}px)`;

    requestAnimationFrame(animate);
  }

  updateBounds();
  animate();

  window.addEventListener("resize", updateBounds);

  // desktop hover scrub
  gallery.addEventListener("mouseenter", () => {
    if (window.innerWidth <= 480) return;
    isHovering = true;
  });

  gallery.addEventListener("mouseleave", () => {
    isHovering = false;
  });

  gallery.addEventListener("mousemove", (e) => {
    if (window.innerWidth <= 480) return;

    if (isDown) {
      const now = performance.now();
      const dx = e.clientX - lastX;
      const dt = Math.max(now - lastTime, 1);

      targetTranslate = clamp(targetTranslate - dx, 0, maxTranslate);

      velocity = (-dx / dt) * 12;

      lastX = e.clientX;
      lastTime = now;
      return;
    }

    if (!isHovering) return;

    const rect = gallery.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = clamp(x / rect.width, 0, 1);

    targetTranslate = percent * maxTranslate;
    velocity = 0;
  });

  // mobile swipe / drag with speed-sensitive momentum
  gallery.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.touches[0].clientX;
      touchLastX = touchStartX;
      touchLastTime = performance.now();
      velocity = 0;
    },
    { passive: true }
  );

  gallery.addEventListener(
    "touchmove",
    (e) => {
      const now = performance.now();
      const x = e.touches[0].clientX;
      const dx = x - touchLastX;
      const dt = Math.max(now - touchLastTime, 1);

      targetTranslate = clamp(targetTranslate - dx, 0, maxTranslate);

      velocity = (-dx / dt) * 14;

      touchLastX = x;
      touchLastTime = now;
    },
    { passive: true }
  );

  gallery.addEventListener(
    "touchend",
    () => {
      targetTranslate = clamp(targetTranslate, 0, maxTranslate);
    },
    { passive: true }
  );

  // desktop click-drag only
  gallery.addEventListener("mousedown", (e) => {
    if (window.innerWidth <= 480) return;

    isDown = true;
    startX = e.clientX;
    lastX = e.clientX;
    lastTime = performance.now();
    velocity = 0;
    gallery.classList.add("is-dragging");
  });

  window.addEventListener("mouseup", () => {
    if (!isDown) return;

    isDown = false;
    gallery.classList.remove("is-dragging");
    targetTranslate = clamp(targetTranslate, 0, maxTranslate);
  });

  gallery.addEventListener("dragstart", (e) => {
    e.preventDefault();
  });
});
