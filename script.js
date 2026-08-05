const hero = document.querySelector(".hero");
const scene = document.querySelector(".card-scene");
const foreground = document.querySelector(".foreground-card");
const brand = document.querySelector(".brand");

let frame;

function moveArtwork(event) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const bounds = hero.getBoundingClientRect();
  const x = (event.clientX - bounds.left) / bounds.width - 0.5;
  const y = (event.clientY - bounds.top) / bounds.height - 0.5;

  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(() => {
    scene.style.translate = `${x * 7}px ${y * 5}px`;
    foreground.style.translate = `${x * -5}px ${y * -3}px`;
  });
}

function resetArtwork() {
  scene.style.translate = "";
  foreground.style.translate = "";
}

function replayIntro(event) {
  event.preventDefault();

  document.getAnimations().forEach((animation) => {
    animation.cancel();
    animation.play();
  });
}

hero.addEventListener("pointermove", moveArtwork);
hero.addEventListener("pointerleave", resetArtwork);
brand.addEventListener("click", replayIntro);
