// ===== Typing effect =====
const roles = ["Power BI Enthusiast", "Industrial IT Undergraduate", "Data Analytics Learner", "Software Developer", "QA Automation Tester"];
const typedEl = document.getElementById("typed");
let roleIdx = 0, charIdx = 0, deleting = false;

function type() {
  const word = roles[roleIdx];
  typedEl.textContent = word.slice(0, charIdx);
  if (!deleting && charIdx < word.length) charIdx++;
  else if (deleting && charIdx > 0) charIdx--;
  else if (!deleting) { deleting = true; return setTimeout(type, 1600); }
  else { deleting = false; roleIdx = (roleIdx + 1) % roles.length; }
  setTimeout(type, deleting ? 45 : 90);
}
type();

// ===== Navbar: scroll style + active link =====
const navbar = document.getElementById("navbar");
const sections = document.querySelectorAll("section[id]");
const navAnchors = document.querySelectorAll(".nav-links a:not(.btn)");

function onScroll() {
  navbar.classList.toggle("scrolled", window.scrollY > 40);
  let current = "";
  sections.forEach((s) => { if (window.scrollY >= s.offsetTop - 160) current = s.id; });
  navAnchors.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === `#${current}`));
}
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// ===== Mobile menu =====
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");
menuToggle.addEventListener("click", () => {
  menuToggle.classList.toggle("open");
  navLinks.classList.toggle("open");
});
navLinks.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    menuToggle.classList.remove("open");
    navLinks.classList.remove("open");
  })
);

// ===== Counters =====
function animateCount(el) {
  const target = +el.dataset.target;
  const duration = 1800;
  const start = performance.now();
  function step(now) {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.floor(eased * target).toLocaleString();
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ===== Reveal on scroll =====
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("visible");
      entry.target.querySelectorAll(".count").forEach(animateCount);
      observer.unobserve(entry.target);
    });
  },
  { threshold: 0.15 }
);
document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

// ===== Live Power BI dashboard (hero) =====
(function liveDashboard() {
  const dash = document.getElementById("liveDash");
  if (!dash) return;

  const views = [
    {
      file: "Sales_Performance.pbix",
      kpis: [
        { label: "Total Revenue", value: 842, pre: "$", suf: "K", delta: 12.4 },
        { label: "Orders", value: 1290, delta: 8.1 },
        { label: "Profit Margin", value: 34, suf: "%", delta: -1.2 },
      ],
      barTitle: "Monthly Sales", barUnit: (v) => `$${v * 9}K`,
      bars: [45, 62, 38, 75, 58, 88, 70, 95],
      donutTitle: "By Region", donut: [45, 30, 25],
      lineTitle: "Revenue Trend", line: [18, 28, 22, 45, 38, 58, 52, 70, 64, 86, 80],
      dax: [["Total Revenue", ""], [" = ", ""], ["SUMX", "f"], ["(Sales, Sales[Qty] * Sales[Price])", ""]],
    },
    {
      file: "Customer_Insights.pbix",
      kpis: [
        { label: "Active Customers", value: 3420, delta: 6.7 },
        { label: "New This Month", value: 286, delta: 14.2 },
        { label: "Retention Rate", value: 87, suf: "%", delta: 2.3 },
      ],
      barTitle: "New Customers / Month", barUnit: (v) => `${v * 3}`,
      bars: [30, 42, 55, 48, 66, 72, 61, 84],
      donutTitle: "By Segment", donut: [52, 28, 20],
      lineTitle: "Customer Growth", line: [10, 16, 25, 30, 41, 47, 55, 61, 70, 76, 88],
      dax: [["Retention %", ""], [" = ", ""], ["DIVIDE", "f"], ["([Returning], [Total Customers])", ""]],
    },
    {
      file: "Product_Analytics.pbix",
      kpis: [
        { label: "Units Sold", value: 12480, delta: 9.6 },
        { label: "Products", value: 148, delta: 3.5 },
        { label: "Return Rate", value: 2.1, suf: "%", dec: 1, delta: -0.8 },
      ],
      barTitle: "Units by Category", barUnit: (v) => `${v * 25}`,
      bars: [80, 52, 68, 35, 90, 44, 60, 72],
      donutTitle: "By Category", donut: [38, 37, 25],
      lineTitle: "Units Sold Trend", line: [40, 52, 46, 60, 55, 48, 66, 72, 64, 78, 83],
      dax: [["Top Product", ""], [" = ", ""], ["TOPN", "f"], ["(1, ", ""], ["VALUES", "f"], ["(Product[Name]), [Units])", ""]],
    },
  ];

  const $ = (s) => dash.querySelector(s);
  const tabs = [...dash.querySelectorAll(".dash-tabs button")];
  const ink = $("#tabInk");
  const live = [...dash.querySelectorAll(".viz-live")];
  const barsWrap = $("#bars");
  const bars = [...barsWrap.querySelectorAll("span")];
  const tip = $("#barTip");
  const segs = [...dash.querySelectorAll(".donut .seg")];
  const linePath = $("#linePath");
  const lineArea = $("#lineArea");
  const lineDot = $("#lineDot");
  const cursor = $("#fakeCursor");
  const daxEl = document.getElementById("daxCode");
  const kpiVals = [0, 0, 0];
  let lineVals = new Array(11).fill(0);
  let current = -1, daxTimer;

  const fmt = (k, v) => (k.pre || "") + (k.dec ? v.toFixed(k.dec) : Math.round(v).toLocaleString()) + (k.suf || "");

  function tween(duration, onStep) {
    const start = performance.now();
    return new Promise((res) => {
      (function frame(now) {
        const p = Math.min((now - start) / duration, 1);
        onStep(1 - Math.pow(1 - p, 3));
        p < 1 ? requestAnimationFrame(frame) : res();
      })(start);
    });
  }

  function moveInk(btn) {
    ink.style.left = btn.offsetLeft + "px";
    ink.style.width = btn.offsetWidth + "px";
  }

  function linePoints(vals) {
    return vals.map((v, i) => [i * 29, 64 - v * 0.56]);
  }
  function drawLine(vals) {
    const pts = linePoints(vals);
    const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
    linePath.setAttribute("d", d);
    lineArea.setAttribute("d", `${d} L290,70 L0,70 Z`);
    const last = pts[pts.length - 1];
    lineDot.style.left = (last[0] / 300) * 100 + "%";
    lineDot.style.top = (last[1] / 70) * 100 + "%";
  }

  // morph the line from whatever is on screen now; a newer call cancels an older one
  let lineTok = 0;
  function animateLine(target, ms) {
    const tok = ++lineTok, from = lineVals.slice();
    tween(ms, (p) => {
      if (tok !== lineTok) return;
      lineVals = from.map((f, i) => f + (target[i] - f) * p);
      drawLine(lineVals);
    });
  }

  function setBars(data, unit) {
    const peak = data.indexOf(Math.max(...data));
    bars.forEach((b, i) => {
      b.style.height = data[i] + "%";
      b.classList.toggle("peak", i === peak);
    });
    const pb = bars[peak];
    tip.style.left = pb.offsetLeft + pb.offsetWidth / 2 + "px";
    tip.style.top = barsWrap.clientHeight * (1 - data[peak] / 100) + "px";
    tip.textContent = unit(data[peak]);
  }

  function setDonut(parts) {
    let offset = 0;
    segs.forEach((s, i) => {
      s.style.strokeDasharray = `${parts[i]} ${100 - parts[i]}`;
      s.style.strokeDashoffset = -offset;
      offset += parts[i];
    });
    $("#donutCenter").textContent = parts[0] + "%";
  }

  function typeDax(tokens) {
    clearTimeout(daxTimer);
    const flat = [];
    tokens.forEach(([text, cls]) => [...text].forEach((ch) => flat.push([ch, cls])));
    let n = 0;
    (function step() {
      let html = "", open = null;
      for (let i = 0; i < n; i++) {
        const [ch, cls] = flat[i];
        if (cls !== open) { if (open) html += "</span>"; if (cls) html += `<span class="${cls}">`; open = cls; }
        html += ch.replace(/&/g, "&amp;").replace(/</g, "&lt;");
      }
      if (open) html += "</span>";
      daxEl.innerHTML = html;
      if (n++ < flat.length) daxTimer = setTimeout(step, 35 + Math.random() * 45);
    })();
  }

  function apply(idx) {
    const v = views[idx];
    current = idx;
    tabs.forEach((t, i) => t.classList.toggle("active", i === idx));
    moveInk(tabs[idx]);
    $("#dashFile").textContent = v.file;
    $("#pageNo").textContent = idx + 1;
    $("#barTitle").textContent = v.barTitle;
    $("#donutTitle").textContent = v.donutTitle;
    $("#lineTitle").textContent = v.lineTitle;

    v.kpis.forEach((k, i) => {
      dash.querySelector(`[data-kpi-label="${i}"]`).textContent = k.label;
      const d = dash.querySelector(`[data-kpi-delta="${i}"]`);
      d.className = k.delta >= 0 ? "up" : "down";
      d.textContent = `${k.delta >= 0 ? "▲" : "▼"} ${Math.abs(k.delta)}%`;
      const valEl = dash.querySelector(`[data-kpi-value="${i}"]`);
      const from = kpiVals[i];
      tween(1100, (p) => (valEl.textContent = fmt(k, from + (k.value - from) * p))).then(() => (kpiVals[i] = k.value));
    });

    setBars(v.bars, v.barUnit);
    setDonut(v.donut);
    animateLine(v.line, 1000);
    typeDax(v.dax);
  }

  function switchTo(idx) {
    live.forEach((el) => el.classList.add("switching"));
    setTimeout(() => { apply(idx); live.forEach((el) => el.classList.remove("switching")); }, 300);
  }

  // small "live" jitter so the data never looks frozen
  function jitter() {
    const v = views[current];
    setBars(v.bars.map((h) => Math.round(Math.max(15, Math.min(98, h + (Math.random() * 14 - 7))))), v.barUnit);
    animateLine(v.line.map((y, i) => (i === v.line.length - 1 ? y + (Math.random() * 10 - 5) : y)), 800);
  }

  function cursorClick(btn) {
    const bar = btn.parentElement;
    const x = bar.offsetLeft + btn.offsetLeft + btn.offsetWidth / 2;
    const y = bar.offsetTop + btn.offsetTop + btn.offsetHeight / 2;
    cursor.style.left = x + "px";
    cursor.style.top = y + "px";
    return new Promise((res) =>
      setTimeout(() => {
        cursor.classList.remove("click"); void cursor.offsetWidth; cursor.classList.add("click");
        const r = document.createElement("span");
        r.className = "click-ripple";
        r.style.left = x + "px"; r.style.top = y + "px";
        dash.appendChild(r);
        setTimeout(() => r.remove(), 700);
        res();
      }, 1050)
    );
  }

  function wander() {
    const wide = window.innerWidth > 900;
    cursor.style.left = (wide ? 58 + Math.random() * 36 : 15 + Math.random() * 70) + "%";
    cursor.style.top = (wide ? 25 + Math.random() * 55 : 55 + Math.random() * 35) + "%";
  }

  let timers = [], run = 0;
  function cycle() {
    timers.forEach(clearTimeout);
    const myRun = ++run;
    timers = [
      setTimeout(wander, 1200),
      setTimeout(jitter, 2400),
      setTimeout(async () => {
        const next = (current + 1) % views.length;
        await cursorClick(tabs[next]);
        if (myRun !== run) return; // user clicked meanwhile
        switchTo(next);
        cycle();
      }, 5200),
    ];
  }

  tabs.forEach((t, i) =>
    t.addEventListener("click", () => {
      switchTo(i);
      cycle();
    })
  );
  window.addEventListener("resize", () => { if (current >= 0) { moveInk(tabs[current]); drawLine(lineVals); } });

  apply(0);
  cycle();
})();

// ===== Project filter =====
const filterBtns = document.querySelectorAll(".filter");
const cards = document.querySelectorAll(".project-card");
filterBtns.forEach((btn) =>
  btn.addEventListener("click", () => {
    filterBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const f = btn.dataset.filter;
    cards.forEach((card) => {
      const match = f === "all" || card.dataset.category.split(" ").includes(f);
      card.classList.toggle("hide", !match);
      if (match) card.classList.add("visible");
    });
  })
);

// ===== Project galleries + lightbox =====
const lightbox = document.getElementById("lightbox");
const lbImg = document.getElementById("lbImg");
const lbCaption = document.getElementById("lbCaption");
let lbList = [], lbIndex = 0;

function showLb(i) {
  lbIndex = (i + lbList.length) % lbList.length;
  lbImg.src = lbList[lbIndex].src;
  lbImg.alt = lbList[lbIndex].alt;
  lbCaption.textContent = `${lbList[lbIndex].alt}  ·  ${lbIndex + 1} / ${lbList.length}`;
}
function closeLb() {
  lightbox.classList.remove("open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

document.querySelectorAll("[data-gallery]").forEach((gallery) => {
  const mainBtn = gallery.querySelector(".gallery-main");
  const mainImg = mainBtn.querySelector("img");
  const thumbs = [...gallery.querySelectorAll(".gallery-thumbs button")];
  const images = thumbs.map((t) => t.querySelector("img"));
  let current = 0;

  thumbs.forEach((thumb, i) =>
    thumb.addEventListener("click", () => {
      if (i === current) return;
      current = i;
      thumbs.forEach((t) => t.classList.toggle("active", t === thumb));
      mainImg.classList.add("fading");
      setTimeout(() => {
        mainImg.src = images[i].src;
        mainImg.alt = images[i].alt;
        mainImg.classList.remove("fading");
      }, 200);
    })
  );

  mainBtn.addEventListener("click", () => {
    lbList = images;
    showLb(current);
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  });
});

lightbox.querySelector(".lb-close").addEventListener("click", closeLb);
lightbox.querySelector(".lb-prev").addEventListener("click", () => showLb(lbIndex - 1));
lightbox.querySelector(".lb-next").addEventListener("click", () => showLb(lbIndex + 1));
lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLb(); });
document.addEventListener("keydown", (e) => {
  if (!lightbox.classList.contains("open")) return;
  if (e.key === "Escape") closeLb();
  if (e.key === "ArrowLeft") showLb(lbIndex - 1);
  if (e.key === "ArrowRight") showLb(lbIndex + 1);
});

// ===== Contact form =====
// 1) EmailJS (custom designed email) — fill these 3 values from emailjs.com
const EMAILJS = {
  publicKey: "YOUR_PUBLIC_KEY",   // Account > General > Public Key
  serviceId: "YOUR_SERVICE_ID",   // Email Services > (your Gmail service) > Service ID
  templateId: "YOUR_TEMPLATE_ID", // Email Templates > (your template) > Template ID
};
// 2) Fallback: FormSubmit (plain email) is used while the EmailJS values above are not filled in
const CONTACT_EMAIL = "indeewariupamalika04@gmail.com";
const useEmailJS = window.emailjs && !Object.values(EMAILJS).some((v) => v.startsWith("YOUR_"));
if (useEmailJS) emailjs.init({ publicKey: EMAILJS.publicKey });
const contactForm = document.getElementById("contactForm");
const sendBtn = document.getElementById("sendBtn");
const formStatus = document.getElementById("formStatus");

function setStatus(msg, type) {
  formStatus.textContent = msg;
  formStatus.className = "form-status " + (type || "");
}

contactForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (document.getElementById("honey").value) return; // bot

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const subject = document.getElementById("subject").value.trim() || `Portfolio enquiry from ${name}`;
  const message = document.getElementById("message").value.trim();

  // FormSubmit refuses pages opened directly as files (file:///...)
  if (!useEmailJS && location.protocol === "file:") {
    setStatus("⚠ The form only works when the site is opened through a web server (e.g. http://localhost or your hosted link), not as a file.", "err");
    return;
  }

  sendBtn.disabled = true;
  sendBtn.classList.add("loading");
  setStatus("Sending your message…");

  try {
    if (useEmailJS) {
      await emailjs.send(EMAILJS.serviceId, EMAILJS.templateId, {
        from_name: name,
        from_email: email,
        reply_to: email,
        subject,
        message,
        sent_at: new Date().toLocaleString("en-GB", {
          timeZone: "Asia/Colombo", weekday: "short", day: "numeric", month: "short",
          year: "numeric", hour: "2-digit", minute: "2-digit",
        }) + " (Sri Lanka time)",
        page_url: location.origin + location.pathname,
      });
      contactForm.reset();
      setStatus("✓ Thank you! Your message has been sent. I'll get back to you soon.", "ok");
      return;
    }

    const res = await fetch(`https://formsubmit.co/ajax/${CONTACT_EMAIL}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        name,
        email,
        message,
        _subject: `[Portfolio] ${subject}`,
        _replyto: email,
        _template: "table",
        _captcha: "false",
      }),
    });
    const data = await res.json().catch(() => ({}));
    console.log("[contact form] FormSubmit response:", res.status, data);

    // first ever submission: FormSubmit emails an activation link instead of delivering
    if (/activat/i.test(data.message || "")) {
      setStatus("📧 Almost there! This form needs a one-time activation — check the inbox (and Spam) of " + CONTACT_EMAIL + " and click “Activate Form”. Then send again.", "warn");
      return;
    }
    if (!res.ok || String(data.success) !== "true") throw new Error(data.message || `HTTP ${res.status}`);

    contactForm.reset();
    setStatus("✓ Thank you! Your message has been sent. I'll get back to you soon.", "ok");
  } catch (err) {
    console.error("[contact form] send failed:", err);
    setStatus("", "");
    const body = `${message}\n\n— ${name} (${email})`;
    formStatus.innerHTML =
      `Sorry, the message couldn't be sent (${String(err.message || err.text || err.status).replace(/</g, "&lt;")}). Please email me directly at ` +
      `<a href="mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}">${CONTACT_EMAIL}</a>.`;
    formStatus.className = "form-status err";
  } finally {
    sendBtn.disabled = false;
    sendBtn.classList.remove("loading");
  }
});

// ===== Signature: written left-to-right when it scrolls into view (animation is pure CSS) =====
const sig = document.getElementById("signature");
if (sig) {
  const sigObs = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    sigObs.disconnect();
    const draw = () => sig.classList.add("draw");
    // wait (max 1.5s) for the script font so the real letters are revealed
    const font = document.fonts ? document.fonts.load('96px "Great Vibes"') : Promise.resolve();
    Promise.race([font, new Promise((r) => setTimeout(r, 1500))]).then(draw, draw);
  }, { threshold: 0.3 });
  sigObs.observe(sig);
}

// ===== Footer year =====
document.getElementById("year").textContent = new Date().getFullYear();
