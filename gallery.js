document.querySelectorAll(".gallery").forEach((gallery) => {
  if (gallery.dataset.carouselInit === "true") return;
  gallery.dataset.carouselInit = "true";

  const track = gallery.querySelector(".gallery-track");
  if (!track) return;

  const slides = Array.from(track.querySelectorAll(".slide"));
  const slideCount = slides.length;
  if (slideCount <= 1) return;

  let currentIndex = 0;

  function isDesktop() {
    return window.innerWidth > 480;
  }

  function isMobile() {
    return window.innerWidth <= 480;
  }

  function setActiveSlide(index) {
    slides.forEach((slide, i) => {
      slide.classList.toggle("is-active", i === index);
    });
  }

  function next() {
    currentIndex = (currentIndex + 1) % slideCount;
    setActiveSlide(currentIndex);
  }

  function prev() {
    currentIndex = (currentIndex - 1 + slideCount) % slideCount;
    setActiveSlide(currentIndex);
  }

  function updateCursor(e) {
    if (!isDesktop()) return;

    const rect = gallery.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    gallery.style.setProperty("--cursor-x", `${x}px`);
    gallery.style.setProperty("--cursor-y", `${y}px`);

    gallery.classList.add("show-cursor");
    gallery.classList.toggle("cursor-left", x < rect.width / 2);
    gallery.classList.toggle("cursor-right", x >= rect.width / 2);
  }

  function clearCursor() {
    gallery.classList.remove("show-cursor", "cursor-left", "cursor-right");
  }

  function enableDesktop() {
    gallery.classList.add("is-fade");
    currentIndex = 0;
    setActiveSlide(currentIndex);
    track.style.transform = "none";
  }

  function enableMobile() {
    gallery.classList.remove("is-fade");
  }

  function handleMode() {
    if (isDesktop()) enableDesktop();
    else enableMobile();
  }

  /* DESKTOP CLICK */
  gallery.addEventListener("click", (e) => {
    if (!isDesktop()) return;

    const rect = gallery.getBoundingClientRect();
    const x = e.clientX - rect.left;

    if (x < rect.width / 2) prev();
    else next();
  });

  gallery.addEventListener("mousemove", updateCursor);
  gallery.addEventListener("mouseenter", updateCursor);
  gallery.addEventListener("mouseleave", clearCursor);

  /* MOBILE SWIPE */
  let startX = 0;
  let currentX = 0;

  gallery.addEventListener("touchstart", (e) => {
    if (!isMobile()) return;
    startX = e.touches[0].clientX;
  }, { passive: true });

  gallery.addEventListener("touchmove", (e) => {
    if (!isMobile()) return;
    currentX = e.touches[0].clientX;
  }, { passive: true });

  gallery.addEventListener("touchend", () => {
    if (!isMobile()) return;

    const dx = currentX - startX;
    if (dx < -40) next();
    if (dx > 40) prev();
  });

  window.addEventListener("resize", handleMode);

  handleMode();
});
