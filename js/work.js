const SERVICES = {
  mobile: {
    eyebrow: "Mobile Application",
    title: "Mobile Application",
    items: [
      {
        label: "Health",
        copy: "Care workflows that feel calm, clear, and production-ready on every device.",
        kind: "mobile",
        src: "assets/images/projects/apps/Place_UI_into_iPhone_mockup_202608052024-Photoroom.png",
      },
      {
        label: "Fitness",
        copy: "Training products engineered for daily habit loops — not just first-day dazzle.",
        kind: "mobile",
        src: "assets/images/projects/apps/Place_UI_into_iPhone_mockup_202608052024%20(1)-Photoroom.png",
      },
      {
        label: "Finance",
        copy: "Money surfaces with the clarity and hardening customers expect from day one.",
        kind: "mobile",
        src: "assets/images/projects/apps/Place_UI_into_iPhone_mockup_202608052024%20(2)-Photoroom.png",
      },
      {
        label: "Trading",
        copy: "Fast-moving market UIs kept readable under pressure and safe under load.",
        kind: "mobile",
        src: "assets/images/projects/apps/Place_UI_into_iPhone_mockup_202608052023-Photoroom.png",
      },
      {
        label: "Reports",
        copy: "Operational dashboards that turn dense data into decisions you can trust.",
        kind: "mobile",
        src: "assets/images/projects/apps/Place_UI_into_iPhone_mockup_202608052020-Photoroom.png",
      },
      {
        label: "Security",
        copy: "Sensitive flows designed with threat modeling baked into the product DNA.",
        kind: "mobile",
        src: "assets/images/projects/apps/Place_UI_into_iPhone_mockup_202608052025-Photoroom.png",
      },
    ],
  },
  website: {
    eyebrow: "Build Website",
    title: "Website",
    items: [
      {
        label: "Estate",
        copy: "Property platforms that feel premium on first paint and stay fast on return visits.",
        kind: "website",
        src: "assets/images/projects/websites/Screenshot_2026-08-05_at_9.21.00_pm.png_202608052128.jpeg",
      },
      {
        label: "Tennis",
        copy: "Sports and membership sites with crisp storytelling and conversion-ready paths.",
        kind: "website",
        src: "assets/images/projects/websites/Screenshot_2026-08-05_at_9.22.42_pm.png_202608052130.jpeg",
      },
      {
        label: "Studio",
        copy: "Creative brand sites where motion, type, and performance stay in the same room.",
        kind: "website",
        src: "assets/images/projects/websites/Screenshot_2026-08-05_at_9.23.11_pm.png_202608052129.jpeg",
      },
      {
        label: "Audio",
        copy: "Media-first experiences tuned for immersion without sacrificing load time.",
        kind: "website",
        src: "assets/images/projects/websites/Screenshot_2026-08-05_at_9.24.02_pm.png_202608052130.jpeg",
      },
    ],
  },
  ai: {
    eyebrow: "AI Automation",
    title: "AI Automation",
    items: [
      {
        label: "Workflows",
        copy: "End-to-end automation that removes busywork while keeping humans in the loop.",
        kind: "ai",
        ai: { kicker: "Ops systems", title: "Workflow engines", gx: "22%", gy: "18%" },
      },
      {
        label: "Agents",
        copy: "Task agents that act with guardrails — useful in production, not just demos.",
        kind: "ai",
        ai: { kicker: "Assisted work", title: "Controlled agents", gx: "70%", gy: "28%" },
      },
      {
        label: "Integrations",
        copy: "Toolchains stitched together so data and actions move without fragile glue.",
        kind: "ai",
        ai: { kicker: "Connected stack", title: "System bridges", gx: "40%", gy: "70%" },
      },
      {
        label: "LLM",
        copy: "Language systems shaped around your domain, policies, and failure modes.",
        kind: "ai",
        ai: { kicker: "Model layer", title: "Domain LLMs", gx: "18%", gy: "60%" },
      },
      {
        label: "Ops",
        copy: "Monitoring, handoff, and recovery paths so automation stays operable at scale.",
        kind: "ai",
        ai: { kicker: "Reliability", title: "Automation ops", gx: "78%", gy: "55%" },
      },
    ],
  },
};

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const params = new URLSearchParams(window.location.search);
const serviceKey = SERVICES[params.get("service")] ? params.get("service") : "mobile";
const service = SERVICES[serviceKey];

const track = document.querySelector("[data-work-track]");
const wheelTrack = document.querySelector("[data-work-wheel-track]");
const stage = document.querySelector("[data-work-stage]");
const eyebrow = document.querySelector("[data-work-eyebrow]");
const title = document.querySelector("[data-work-title]");
const indexEl = document.querySelector("[data-work-index]");
const copyEl = document.querySelector("[data-work-copy]");

const items = service.items;
let activeIndex = 0;
let frame = 0;
let scrollingTo = null;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function build() {
  document.title = `${service.title} — Byto.tech`;
  if (eyebrow) eyebrow.textContent = service.eyebrow;
  if (title) title.textContent = service.title;
  if (track) track.style.setProperty("--work-count", String(Math.max(items.length, 1)));

  wheelTrack.innerHTML = "";
  stage.innerHTML = "";

  items.forEach((item, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "work-wheel-item";
    button.dataset.index = String(index);
    button.setAttribute("aria-label", `Show ${item.label}`);
    button.innerHTML = `<span class="work-wheel-arrow" aria-hidden="true">→</span><span>${item.label}</span>`;
    button.addEventListener("click", () => goTo(index));
    wheelTrack.appendChild(button);

    const slide = document.createElement("figure");
    slide.className = "work-slide";
    slide.dataset.kind = item.kind;
    slide.dataset.index = String(index);

    if (item.kind === "ai") {
      slide.innerHTML = `
        <div class="work-ai-panel" style="--gx:${item.ai.gx};--gy:${item.ai.gy}">
          <p class="work-ai-kicker">${item.ai.kicker}</p>
          <h2 class="work-ai-title">${item.ai.title}</h2>
        </div>
      `;
    } else {
      slide.innerHTML = `<img src="${item.src}" alt="${item.label} project preview" loading="${index === 0 ? "eager" : "lazy"}" />`;
    }

    stage.appendChild(slide);
  });

  updateFromScroll();
}

function goTo(index) {
  if (!track || !items.length) return;

  if (reduceMotion.matches) {
    setActive(index);
    styleWheel(index);
    return;
  }

  const total = track.offsetHeight - window.innerHeight;
  const target = items.length <= 1 ? 0 : (index / (items.length - 1)) * total;
  scrollingTo = index;

  window.scrollTo({
    top: track.offsetTop + target,
    behavior: "smooth",
  });

  window.setTimeout(() => {
    scrollingTo = null;
  }, 700);
}

function styleWheel(floatIndex) {
  const buttons = [...wheelTrack.querySelectorAll(".work-wheel-item")];
  const spacing = window.matchMedia("(max-width: 900px)").matches ? 46 : 68;

  buttons.forEach((button, index) => {
    const d = index - floatIndex;
    const abs = Math.abs(d);
    const y = d * spacing;
    const x = abs * abs * 2.4;
    const scale = clamp(1 - abs * 0.07, 0.72, 1);
    const opacity = clamp(1 - abs * 0.22, 0.12, 1);
    const blur = clamp(abs * 3.4, 0, 10);

    button.style.setProperty("--y", `${y}px`);
    button.style.setProperty("--x", `${x}px`);
    button.style.setProperty("--scale", String(scale));
    button.style.setProperty("--opacity", String(opacity));
    button.style.setProperty("--blur", `${blur}px`);
    button.classList.toggle("is-active", Math.round(floatIndex) === index);
    button.setAttribute("aria-current", Math.round(floatIndex) === index ? "true" : "false");
  });
}

function setActive(index) {
  activeIndex = index;
  const item = items[index];
  if (!item) return;

  stage.querySelectorAll(".work-slide").forEach((slide, i) => {
    slide.classList.toggle("is-active", i === index);
  });

  if (indexEl) indexEl.textContent = `${pad(index + 1)} / ${pad(items.length)}`;
  if (copyEl) copyEl.textContent = item.copy;
}

function updateFromScroll() {
  if (!track || !items.length) return;

  if (reduceMotion.matches) {
    styleWheel(activeIndex);
    setActive(activeIndex);
    return;
  }

  const rect = track.getBoundingClientRect();
  const total = track.offsetHeight - window.innerHeight;
  const progress = total <= 0 ? 0 : clamp(-rect.top / total, 0, 1);
  const floatIndex = progress * (items.length - 1);
  const nearest = Math.round(floatIndex);

  styleWheel(scrollingTo == null ? floatIndex : scrollingTo);
  setActive(scrollingTo == null ? nearest : scrollingTo);
}

function onScroll() {
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(updateFromScroll);
}

function rememberHomeReturn(state) {
  try {
    sessionStorage.setItem("byto:return", JSON.stringify(state));
  } catch {
    // Ignore quota / private-mode failures.
  }
}

document.querySelector(".work-back")?.addEventListener("click", () => {
  rememberHomeReturn({
    section: "services",
    service: serviceKey,
    serviceIndex: Math.max(0, ["mobile", "website", "ai"].indexOf(serviceKey)),
  });
});

document.querySelector(".work-contact")?.addEventListener("click", () => {
  rememberHomeReturn({ section: "contact" });
});

document.querySelector(".work-brand")?.addEventListener("click", () => {
  try {
    sessionStorage.removeItem("byto:return");
  } catch {
    // Ignore storage failures.
  }
});

build();
window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", onScroll);
requestAnimationFrame(updateFromScroll);
