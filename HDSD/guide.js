document.addEventListener("DOMContentLoaded", () => {
  const videos = document.querySelectorAll(".guide-img-placeholder video");
  const isMobile = window.matchMedia("(max-width: 768px)").matches;

  const observerOptions = {
    root: null,
    threshold: 0.5,
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const video = entry.target;

      if (entry.isIntersecting) {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {});
        }
      } else {
        if (!video.paused) {
          video.pause();
        }
      }
    });
  }, observerOptions);

  videos.forEach((video) => {
    const desktopSrc = video.getAttribute("data-desktop");
    const mobileSrc = video.getAttribute("data-mobile");

    if (desktopSrc && mobileSrc) {
      const sourceEl = document.createElement("source");
      sourceEl.src = isMobile ? mobileSrc : desktopSrc;
      sourceEl.type = "video/webm";
      video.appendChild(sourceEl);
      video.load();
    }

    observer.observe(video);
  });
});
