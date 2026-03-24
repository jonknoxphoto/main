document.querySelectorAll(".gallery").forEach((gallery) => {
  const track = gallery.querySelector(".gallery-track");
  const slides = Array.from(track.querySelectorAll(".frame"));

  if (slides.length <= 1) return;

  let index = 0;
  let startX = 0;
  let currentX = 0;

  function update() {
    track.style.transform = `translateX(-${index * 100}%)`;
  }

  function next() {
    index = Math.min(index + 1, slides.length - 1);
    update();
  }

  function prev() {
    index = Math.max(index - 1, 0);
    update();
  }

  // mobile swipe
  gallery.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX;
  }, { passive: true });

  gallery.addEventListener("touchend", (e) => {
    currentX = e.changedTouches[0].clientX;
    const diff = currentX - startX;

    if (diff < -50) next();
    if (diff > 50) prev();
  });

  // desktop scroll
  gallery.addEventListener("wheel", (e) => {
    e.preventDefault();
    if (e.deltaY > 0) next();
    else prev();
  }, { passive: false });

  // desktop drag
  let isDown = false;

  gallery.addEventListener("mousedown", (e) => {
    isDown = true;
    startX = e.clientX;
  });

  window.addEventListener("mouseup", (e) => {
    if (!isDown) return;
    isDown = false;

    const diff = e.clientX - startX;

    if (diff < -60) next();
    if (diff > 60) prev();
  });

  update();
});
