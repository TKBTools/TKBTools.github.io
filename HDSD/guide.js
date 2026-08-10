document.addEventListener("DOMContentLoaded", () => {
  const videos = document.querySelectorAll(".guide-img-placeholder video");

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

  videos.forEach((video) => observer.observe(video));
});
