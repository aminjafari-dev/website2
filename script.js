const hero = document.querySelector(".hero");
const scene = document.querySelector(".card-scene");
const websiteStack = document.querySelector(".website-stack");
const phoneStack = document.querySelector(".phone-stack");
const brand = document.querySelector(".brand");
const problemSection = document.querySelector(".problem-section");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const originalWebsiteOrder = [...websiteStack.children];
const originalPhoneOrder = [...phoneStack.children];

let frame;
let readyTimer;
let cycleTimer;
let slideTimer;
let slideLocked = false;
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
  window.scrollTo({ top: 0, behavior: reduceMotion.matches ? "auto" : "smooth" });

  document.getAnimations().forEach((animation) => {
    animation.cancel();
    animation.play();
  });

  startPortfolioCycle();
}

hero.addEventListener("pointermove", moveArtwork);
hero.addEventListener("pointerleave", resetArtwork);
brand.addEventListener("click", replayIntro);

function moveToSlide(target) {
  slideLocked = true;
  window.clearTimeout(slideTimer);

  if (target === problemSection) {
    problemSection.classList.add("is-presented");
  }

  target.scrollIntoView({
    behavior: reduceMotion.matches ? "auto" : "smooth",
    block: "start",
  });

  slideTimer = window.setTimeout(() => {
    slideLocked = false;
  }, reduceMotion.matches ? 100 : 1150);
}

function handleSlideWheel(event) {
  if (Math.abs(event.deltaY) < 8) return;

  if (slideLocked) {
    event.preventDefault();
    return;
  }

  const heroTop = hero.offsetTop;
  const problemTop = problemSection.offsetTop;
  const currentTop = window.scrollY;

  if (event.deltaY > 0 && currentTop < problemTop - 24) {
    event.preventDefault();
    moveToSlide(problemSection);
    return;
  }

  const nearProblemStart =
    currentTop > heroTop + 24 &&
    currentTop < problemTop + Math.min(180, window.innerHeight * 0.2);

  if (event.deltaY < 0 && nearProblemStart) {
    event.preventDefault();
    moveToSlide(hero);
  }
}

window.addEventListener("wheel", handleSlideWheel, { passive: false });

function ensureProblemIsVisible() {
  const bounds = problemSection.getBoundingClientRect();
  if (bounds.top < window.innerHeight * 0.92 && bounds.bottom > 0) {
    problemSection.classList.add("is-presented");
  }
}

window.addEventListener("scroll", ensureProblemIsVisible, { passive: true });
requestAnimationFrame(ensureProblemIsVisible);

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    window.clearInterval(cycleTimer);
  } else if (scene.classList.contains("portfolio-ready") && !reduceMotion.matches) {
    window.clearInterval(cycleTimer);
    cycleTimer = window.setInterval(rotatePortfolio, 3200);
  }
});

const revealItems = document.querySelectorAll(".scroll-reveal");

if ("IntersectionObserver" in window && !reduceMotion.matches) {
  const problemObserver = new IntersectionObserver(
    ([entry], observer) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-presented");
      observer.unobserve(entry.target);
    },
    { threshold: 0.01, rootMargin: "0px 0px -4% 0px" },
  );

  problemObserver.observe(problemSection);
} else {
  problemSection.classList.add("is-presented");
}

if ("IntersectionObserver" in window && !reduceMotion.matches) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.16 },
  );

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

startPortfolioCycle();
