document.querySelectorAll(".gallery").forEach((gallery) => {
  const track = gallery.querySelector(".gallery-track");
  const slides = Array.from(track.querySelectorAll(".frame"));

  if (slides.length <= 1) return;

  let isDown = false;
  let isHovering = false;
  let startX = 0;
  let currentTranslate = 0;
  let targetTranslate = 0;
  let maxTranslate = 0;

  function updateBounds() {
    maxTranslate = track.scrollWidth - gallery.offsetWidth;
    if (maxTranslate < 0) maxTranslate = 0;
  }

  function animate() {
    currentTranslate += (targetTranslate - currentTranslate) * 0.26;
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
    if (!isHovering || window.innerWidth <= 480) return;

    const rect = gallery.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(x / rect.width, 1));

    targetTranslate = percent * maxTranslate;
  });

  // mobile swipe / drag
  let touchStartX = 0;
  let touchStartTranslate = 0;

  gallery.addEventListener("touchstart", (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartTranslate = targetTranslate;
  }, { passive: true });

  gallery.addEventListener("touchmove", (e) => {
    const diff = touchStartX - e.touches[0].clientX;
    targetTranslate = Math.max(
      0,
      Math.min(touchStartTranslate + diff, maxTranslate)
    );
  }, { passive: true });

  // desktop drag
  gallery.addEventListener("mousedown", (e) => {
    if (window.innerWidth <= 480) return;
    isDown = true;
    startX = e.clientX;
    gallery.classList.add("is-dragging");
  });

  window.addEventListener("mousemove", (e) => {
    if (!isDown || window.innerWidth <= 480) return;

    const diff = startX - e.clientX;
    startX = e.clientX;

    targetTranslate = Math.max(
      0,
      Math.min(targetTranslate + diff, maxTranslate)
    );
  });

  window.addEventListener("mouseup", () => {
    isDown = false;
    gallery.classList.remove("is-dragging");
  });

  // desktop wheel
  gallery.addEventListener("wheel", (e) => {
    if (window.innerWidth <= 480) return;

    e.preventDefault();

    targetTranslate = Math.max(
      0,
      Math.min(targetTranslate + e.deltaY + e.deltaX, maxTranslate)
    );
  }, { passive: false });
});
