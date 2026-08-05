const hero = document.querySelector(".hero");
const scene = document.querySelector(".card-scene");
const websiteStack = document.querySelector(".website-stack");
const phoneStack = document.querySelector(".phone-stack");
const brand = document.querySelector(".brand");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const originalWebsiteOrder = [...websiteStack.children];
const originalPhoneOrder = [...phoneStack.children];

let frame;
let readyTimer;
let cycleTimer;
const reorderTimers = new Set();

function moveArtwork(event) {
  if (reduceMotion.matches) return;

  const bounds = hero.getBoundingClientRect();
  const x = (event.clientX - bounds.left) / bounds.width - 0.5;
  const y = (event.clientY - bounds.top) / bounds.height - 0.5;

  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(() => {
    scene.style.translate = `${x * 3}px ${y * 2}px`;
    websiteStack.style.translate = `${x * -5}px ${y * -3}px`;
    phoneStack.style.translate = `${x * 8}px ${y * 5}px`;
  });
}

function resetArtwork() {
  scene.style.translate = "";
  websiteStack.style.translate = "";
  phoneStack.style.translate = "";
}

function rotateStack(stack) {
  const frontItem = stack.firstElementChild;
  if (!frontItem) return;

  frontItem.classList.add("is-lifting");

  const timer = window.setTimeout(() => {
    reorderTimers.delete(timer);
    stack.append(frontItem);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => frontItem.classList.remove("is-lifting"));
    });
  }, 460);
  reorderTimers.add(timer);
}

function rotatePortfolio() {
  rotateStack(websiteStack);
  rotateStack(phoneStack);
}

function stopPortfolioCycle() {
  window.clearTimeout(readyTimer);
  window.clearInterval(cycleTimer);
  reorderTimers.forEach((timer) => window.clearTimeout(timer));
  reorderTimers.clear();
}

function startPortfolioCycle() {
  if (reduceMotion.matches) return;

  readyTimer = window.setTimeout(() => {
    scene.classList.add("portfolio-ready");
    cycleTimer = window.setInterval(rotatePortfolio, 3200);
  }, 2600);
}

function restoreStackOrder() {
  originalWebsiteOrder.forEach((item) => websiteStack.append(item));
  originalPhoneOrder.forEach((item) => phoneStack.append(item));
  scene.querySelectorAll(".is-lifting").forEach((item) => {
    item.classList.remove("is-lifting");
  });
}

function replayIntro(event) {
  event.preventDefault();
  stopPortfolioCycle();
  scene.classList.remove("portfolio-ready");
  restoreStackOrder();

  document.getAnimations().forEach((animation) => {
    animation.cancel();
    animation.play();
  });

  startPortfolioCycle();
}

hero.addEventListener("pointermove", moveArtwork);
hero.addEventListener("pointerleave", resetArtwork);
brand.addEventListener("click", replayIntro);

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    window.clearInterval(cycleTimer);
  } else if (scene.classList.contains("portfolio-ready") && !reduceMotion.matches) {
    window.clearInterval(cycleTimer);
    cycleTimer = window.setInterval(rotatePortfolio, 3200);
  }
});

startPortfolioCycle();
