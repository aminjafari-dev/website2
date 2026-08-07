const hero = document.querySelector(".hero");
const stage = document.querySelector(".stage");
const logoIntro = document.querySelector(".logo-intro");
const scene = document.querySelector(".card-scene");
const websiteStack = document.querySelector(".website-stack");
const phoneStack = document.querySelector(".phone-stack");
const brand = document.querySelector(".brand");
const problemSection = document.querySelector(".problem-section");
const solutionSection = document.querySelector(".solution-section");
const servicesSection = document.querySelector(".services-section");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const originalWebsiteOrder = [...websiteStack.children];
const originalPhoneOrder = [...phoneStack.children];

let frame;
let readyTimer;
let cycleTimer;
let slideTimer;
let slideLocked = false;
let touchStartY = 0;
const reorderTimers = new Set();

let introStarted = false;
let introFinished = false;
let introSafetyTimer;

function setIntroState(name, enabled) {
  document.documentElement.classList.toggle(name, enabled);
}

function endLogoIntro() {
  if (introFinished) return;
  introFinished = true;
  window.clearTimeout(introSafetyTimer);
  setIntroState("intro-ready", false);
  setIntroState("intro-playing", false);
  logoIntro?.remove();
  startPortfolioCycle();
}

function finishLogoIntro(event) {
  if (event.animationName !== "logo-stage-rise") return;
  endLogoIntro();
}

function beginLogoIntro() {
  if (introStarted) return;
  introStarted = true;

  window.scrollTo({ top: 0, behavior: "auto" });

  if (reduceMotion.matches) {
    endLogoIntro();
    return;
  }

  requestAnimationFrame(() => setIntroState("intro-ready", true));
  introSafetyTimer = window.setTimeout(endLogoIntro, 4800);
}

// The intro is timed in CSS, so it must not start counting down while the
// browser is still fetching fonts and images on an uncached first visit.
function whenPageIsPainted() {
  const loaded =
    document.readyState === "complete"
      ? Promise.resolve()
      : new Promise((resolve) =>
          window.addEventListener("load", resolve, { once: true }),
        );
  const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
  const guard = new Promise((resolve) => window.setTimeout(resolve, 2500));

  return Promise.race([Promise.all([loaded, fonts]), guard]);
}

stage.addEventListener("animationend", finishLogoIntro);
whenPageIsPainted().then(beginLogoIntro);

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

let scrollAnim = 0;

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

// Browser smooth scrollIntoView gets cancelled mid-flight by trackpad wheel
// events (even when we preventDefault). Drive the scroll ourselves so 2→3
// can't stall halfway the way 1→2 never should.
function animateScrollTo(top, duration) {
  const from = window.scrollY;
  const distance = top - from;
  if (Math.abs(distance) < 1) return Promise.resolve();

  const start = performance.now();
  cancelAnimationFrame(scrollAnim);

  return new Promise((resolve) => {
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      window.scrollTo({ top: from + distance * easeInOutCubic(t), behavior: "auto" });
      if (t < 1) {
        scrollAnim = requestAnimationFrame(tick);
      } else {
        window.scrollTo({ top, behavior: "auto" });
        resolve();
      }
    };
    scrollAnim = requestAnimationFrame(tick);
  });
}

function presentableSections() {
  return [problemSection, solutionSection, servicesSection].filter(Boolean);
}

function servicesScrollEnd() {
  return Math.max(
    0,
    servicesSection.offsetTop + servicesSection.offsetHeight - window.innerHeight,
  );
}

const serviceCards = [
  ...(document.querySelectorAll("[data-services-stack] .service-card") ?? []),
];
const STACK_PEEK = 18; // px of previous card visible at the top
const STACK_GAP = 36; // free space between the active card and the next peek

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function updateServicesStack() {
  if (!servicesSection || !serviceCards.length) return;

  const rect = servicesSection.getBoundingClientRect();
  const total = servicesSection.offsetHeight - window.innerHeight;

  if (reduceMotion.matches) {
    serviceCards.forEach((card, index) => {
      card.style.setProperty("--card-y", `${index * 12}px`);
    });
    return;
  }

  if (total <= 0) {
    serviceCards.forEach((card, index) => {
      card.style.setProperty("--card-y", `${index * STACK_PEEK}px`);
    });
    return;
  }

  const progress = clamp(-rect.top / total, 0, 1);
  const last = serviceCards.length - 1;
  const activeSegment = progress * last;

  serviceCards.forEach((card, index) => {
    if (index === 0) {
      card.style.setProperty("--card-y", "0px");
      return;
    }

    const seated = index * STACK_PEEK;
    const cardHeight = card.offsetHeight || window.innerHeight * 0.56;
    // Park the next card fully below the active one with a clear gap,
    // so the panel shows between them like the reference video.
    const waiting = cardHeight + STACK_GAP;
    const raw = activeSegment - (index - 1);

    let y;
    if (raw <= 0) {
      // Only the immediate next card peeks; later cards stay fully below.
      const nextUp = Math.floor(activeSegment) + 1;
      y = index === nextUp ? waiting : window.innerHeight * 1.2;
    } else if (raw >= 1) {
      y = seated;
    } else {
      y = waiting + (seated - waiting) * raw;
    }

    card.style.setProperty("--card-y", `${y}px`);
  });
}

window.addEventListener("scroll", updateServicesStack, { passive: true });
window.addEventListener("resize", updateServicesStack);
requestAnimationFrame(updateServicesStack);

function moveToSlide(target) {
  if (!target || slideLocked) return;

  slideLocked = true;
  window.clearTimeout(slideTimer);
  cancelAnimationFrame(scrollAnim);

  // Start the clip-rise as the scroll begins — identical to 1 → 2 → 3.
  if (presentableSections().includes(target)) {
    target.classList.add("is-presented");
  }

  const duration = reduceMotion.matches ? 0 : 1150;
  const top = target.offsetTop;

  animateScrollTo(top, duration).then(() => {
    slideLocked = false;
    updateServicesStack();
  });

  // Safety unlock if the animation promise is interrupted.
  slideTimer = window.setTimeout(() => {
    slideLocked = false;
  }, duration + 80);
}

function handleSlideWheel(event) {
  if (Math.abs(event.deltaY) < 2) return;

  // Always eat wheel during a snap so native scrolling can't fight it.
  if (slideLocked) {
    event.preventDefault();
    return;
  }

  const heroTop = hero.offsetTop;
  const problemTop = problemSection.offsetTop;
  const solutionTop = solutionSection.offsetTop;
  const servicesTop = servicesSection.offsetTop;
  const servicesEnd = servicesScrollEnd();
  const currentTop = window.scrollY;
  const edge = Math.min(180, window.innerHeight * 0.2);

  // ↓ hero → challenge
  if (event.deltaY > 0 && currentTop < problemTop - 24) {
    event.preventDefault();
    moveToSlide(problemSection);
    return;
  }

  // ↓ challenge → approach
  if (event.deltaY > 0 && currentTop < solutionTop - 24) {
    event.preventDefault();
    moveToSlide(solutionSection);
    return;
  }

  // ↓ approach → services
  if (event.deltaY > 0 && currentTop < servicesTop - 24) {
    event.preventDefault();
    moveToSlide(servicesSection);
    return;
  }

  // ↓ inside services: let sticky cards scroll and seat naturally
  if (event.deltaY > 0 && currentTop < servicesEnd - 4) {
    return;
  }

  // ↓ settled past the last service card
  if (event.deltaY > 0) {
    event.preventDefault();
    return;
  }

  // ↑ mid-services stack: native scroll reveals the card underneath
  if (currentTop > servicesTop + edge) {
    return;
  }

  // ↑ top of services → approach
  if (currentTop > servicesTop - edge) {
    event.preventDefault();
    moveToSlide(solutionSection);
    return;
  }

  // ↑ approach → challenge
  if (currentTop > solutionTop - edge) {
    event.preventDefault();
    moveToSlide(problemSection);
    return;
  }

  // ↑ challenge → hero
  if (currentTop > heroTop + 24 && currentTop < problemTop + edge) {
    event.preventDefault();
    moveToSlide(hero);
  }
}

window.addEventListener("wheel", handleSlideWheel, { passive: false });

window.addEventListener(
  "touchstart",
  (event) => {
    touchStartY = event.touches[0]?.clientY ?? 0;
  },
  { passive: true },
);

window.addEventListener(
  "touchend",
  (event) => {
    if (slideLocked) return;

    const touchEndY = event.changedTouches[0]?.clientY ?? touchStartY;
    const distance = touchStartY - touchEndY;
    const problemTop = problemSection.offsetTop;
    const solutionTop = solutionSection.offsetTop;
    const servicesTop = servicesSection.offsetTop;
    const servicesEnd = servicesScrollEnd();
    const edge = Math.min(180, window.innerHeight * 0.2);
    const y = window.scrollY;

    if (distance > 45 && y < problemTop - 24) {
      moveToSlide(problemSection);
    } else if (distance > 45 && y < solutionTop - 24) {
      moveToSlide(solutionSection);
    } else if (distance > 45 && y < servicesTop - 24) {
      moveToSlide(servicesSection);
    } else if (distance > 45 && y < servicesEnd - 4) {
      // Inside the services stack — native touch scroll handles seating.
      return;
    } else if (distance < -45 && y > servicesTop + edge) {
      return;
    } else if (distance < -45 && y > servicesTop - edge) {
      moveToSlide(solutionSection);
    } else if (distance < -45 && y > solutionTop - edge) {
      moveToSlide(problemSection);
    } else if (distance < -45 && y > hero.offsetTop + 24 && y < problemTop + edge) {
      moveToSlide(hero);
    }
  },
  { passive: true },
);

function presentSlidesInView() {
  if (slideLocked) return;

  presentableSections().forEach((section) => {
    const bounds = section.getBoundingClientRect();
    if (bounds.top < window.innerHeight * 0.92 && bounds.bottom > 0) {
      section.classList.add("is-presented");
    }
  });
}

window.addEventListener("scroll", presentSlidesInView, { passive: true });
requestAnimationFrame(presentSlidesInView);

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    window.clearInterval(cycleTimer);
  } else if (scene.classList.contains("portfolio-ready") && !reduceMotion.matches) {
    window.clearInterval(cycleTimer);
    cycleTimer = window.setInterval(rotatePortfolio, 3200);
  }
});

const solutionGrid = document.querySelector(".solution-grid");

if (solutionGrid) {
  const solutionCards = [...solutionGrid.querySelectorAll(".solution-card")];
  const defaultCard =
    solutionGrid.querySelector(".solution-card[data-default-card]") ??
    solutionCards[Math.floor(solutionCards.length / 2)];

  const expandCard = (target) => {
    solutionCards.forEach((card) => {
      card.classList.toggle("is-active", card === target);
    });
  };

  solutionCards.forEach((card) => {
    card.addEventListener("pointerenter", () => expandCard(card));
    card.addEventListener("focus", () => expandCard(card));
  });

  solutionGrid.addEventListener("pointerleave", () => expandCard(defaultCard));
  solutionGrid.addEventListener("focusout", (event) => {
    if (!solutionGrid.contains(event.relatedTarget)) expandCard(defaultCard);
  });
}

if ("IntersectionObserver" in window && !reduceMotion.matches) {
  const slideObserver = new IntersectionObserver(
    ([entry], observer) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-presented");
      observer.unobserve(entry.target);
    },
    { threshold: 0.01, rootMargin: "0px 0px -4% 0px" },
  );

  presentableSections().forEach((section) => slideObserver.observe(section));
} else {
  presentableSections().forEach((section) => section.classList.add("is-presented"));
}

// Shared lock clip is encoded locked → open. Scrub the solution seal
// backwards so it still reads as closing, without a second asset.
function playReversedLoop(video) {
  if (!video || reduceMotion.matches) {
    if (video?.readyState >= 1) video.currentTime = video.duration || 0;
    else {
      video?.addEventListener(
        "loadedmetadata",
        () => {
          video.currentTime = video.duration || 0;
        },
        { once: true },
      );
    }
    return;
  }

  const fps = 30;
  const frameDuration = 1000 / fps;
  let rafId = 0;
  let lastTs = 0;
  let seeking = false;

  const stopNative = () => {
    video.pause();
    video.autoplay = false;
    video.loop = false;
  };

  const step = (ts) => {
    rafId = requestAnimationFrame(step);
    if (document.hidden || seeking || !Number.isFinite(video.duration) || video.duration === 0) {
      return;
    }

    if (!lastTs) lastTs = ts;
    if (ts - lastTs < frameDuration) return;
    lastTs = ts;

    const next = video.currentTime - 1 / fps;
    seeking = true;
    video.currentTime = next <= 0.001 ? video.duration : next;
  };

  video.addEventListener("seeked", () => {
    seeking = false;
  });

  const start = () => {
    stopNative();
    video.currentTime = video.duration;
    lastTs = 0;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(step);
  };

  if (video.readyState >= 1) start();
  else video.addEventListener("loadedmetadata", start, { once: true });
}

document
  .querySelectorAll('video[data-playback="reverse"]')
  .forEach((video) => playReversedLoop(video));
