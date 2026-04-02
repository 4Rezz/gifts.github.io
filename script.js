(function () {
  const compliments = [
    "Ти моя кохана — і це найкраще, що я можу про себе сказати.",
    "Ти моє все: спокій, пригода й дім в одному серці.",
    "Ти моя людина. Просто так, без варіантів і без «але».",
    "Моє серце обрало тебе давно — і не збирається передумувати.",
    "Ти моя найм’якша сміливість і найсміливіша ніжність.",
    "Я люблю тебе — сьогодні, завтра і в усіх маленьких буднях між ними.",
    "Ти моє найкраще «так» у цьому шумному світі.",
    "Поруч з тобою я хочу бути собою — і кращим собою.",
    "Ти моя зірка, яку я не ховаю: хочу, щоб усі бачили, як ти сяєш.",
    "Ти моя кохана — і кожен день з тобою схожий на подарунок.",
  ];

  const btn = document.getElementById("complimentBtn");
  const textEl = document.getElementById("complimentText");
  const nameEl = document.getElementById("herName");

  if (nameEl) {
    const key = "giftPageHerName";
    const saved = localStorage.getItem(key);
    if (saved) nameEl.textContent = saved;
    nameEl.addEventListener("blur", function () {
      const t = nameEl.textContent.trim() || "найкращого сонечка";
      nameEl.textContent = t;
      localStorage.setItem(key, t);
    });
  }

  if (btn && textEl) {
    let last = -1;
    btn.addEventListener("click", function () {
      let i;
      do {
        i = Math.floor(Math.random() * compliments.length);
      } while (compliments.length > 1 && i === last);
      last = i;
      textEl.textContent = compliments[i];
      textEl.hidden = false;
    });
  }

  const prefersReduced =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const canvas = document.getElementById("stars");
  if (canvas && !prefersReduced) {
    const ctx = canvas.getContext("2d");
    let stars = [];
    let w = 0;
    let h = 0;
    let raf = 0;

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      const count = Math.min(140, Math.floor((w * h) / 18000));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.2 + 0.3,
        tw: Math.random() * Math.PI * 2,
        sp: 0.015 + Math.random() * 0.025,
      }));
    }

    function tick() {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        s.tw += s.sp;
        const a = 0.25 + Math.sin(s.tw) * 0.35;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(232, 212, 255, ${a})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    }

    resize();
    tick();
    window.addEventListener("resize", function () {
      cancelAnimationFrame(raf);
      resize();
      tick();
    });
  }

  if (!prefersReduced) {
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) e.target.classList.add("is-visible");
        });
      },
      { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    document.querySelectorAll(".reveal").forEach(function (el) {
      observer.observe(el);
    });
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) {
      el.classList.add("is-visible");
    });
  }
})();
