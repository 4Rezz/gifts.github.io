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
    const key = "giftPageHerNameSofiyka";
    const saved = localStorage.getItem(key);
    if (saved) nameEl.textContent = saved;
    nameEl.addEventListener("blur", function () {
      const t = nameEl.textContent.trim() || "Софійки";
      nameEl.textContent = t;
      localStorage.setItem(key, t);
    });
  }

  const TOGETHER_START = new Date(2026, 1, 2, 0, 25, 0, 0);
  const MS_DAY = 86400000;
  const MS_HOUR = 3600000;
  const MS_MIN = 60000;
  const MS_SEC = 1000;

  function ukMonthWord(n) {
    const a = Math.abs(n) % 100;
    const b = n % 10;
    if (a >= 11 && a <= 14) return "місяців";
    if (b === 1) return "місяць";
    if (b >= 2 && b <= 4) return "місяці";
    return "місяців";
  }

  function ukDayWord(n) {
    const a = Math.abs(n) % 100;
    const b = n % 10;
    if (a >= 11 && a <= 14) return "днів";
    if (b === 1) return "день";
    if (b >= 2 && b <= 4) return "дні";
    return "днів";
  }

  function togetherParts(start, now) {
    if (now < start) {
      return { months: 0, days: 0, h: 0, m: 0, s: 0, before: true };
    }

    let months =
      (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    if (now.getDate() < start.getDate()) {
      months--;
    }
    if (months < 0) {
      months = 0;
    }

    let anchor = new Date(start.getTime());
    anchor.setMonth(anchor.getMonth() + months);

    while (anchor > now && months > 0) {
      months--;
      anchor = new Date(start.getTime());
      anchor.setMonth(anchor.getMonth() + months);
    }

    let diffMs = now - anchor;
    if (diffMs < 0) {
      diffMs = 0;
    }

    const days = Math.floor(diffMs / MS_DAY);
    const rem = diffMs - days * MS_DAY;
    const h = Math.floor(rem / MS_HOUR);
    const m = Math.floor((rem % MS_HOUR) / MS_MIN);
    const s = Math.floor((rem % MS_MIN) / MS_SEC);

    return { months, days, h, m, s, before: false };
  }

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function updateTogetherTimer() {
    const elMain = document.getElementById("togetherMain");
    const elClock = document.getElementById("togetherClock");
    if (!elMain) {
      return;
    }

    const now = new Date();
    const p = togetherParts(TOGETHER_START, now);

    const elTotal = document.getElementById("togetherTotal");

    if (p.before) {
      elMain.innerHTML =
        '<span class="together-timer__prefix">Ми разом</span>зачекай трохи — таймер стартує 2.02.2026 о 00:25';
      if (elClock) {
        elClock.textContent = "";
      }
      if (elTotal) {
        elTotal.textContent = "";
      }
      return;
    }

    elMain.innerHTML =
      '<span class="together-timer__prefix">Ми разом</span>' +
      p.months +
      " " +
      ukMonthWord(p.months) +
      " і " +
      p.days +
      " " +
      ukDayWord(p.days);

    if (elClock) {
      elClock.textContent = pad2(p.h) + ":" + pad2(p.m) + ":" + pad2(p.s);
    }

    if (elTotal) {
      const totalMs = now - TOGETHER_START;
      const totalDays = Math.floor(totalMs / MS_DAY);
      const remTotal = totalMs - totalDays * MS_DAY;
      const th = Math.floor(remTotal / MS_HOUR);
      const tm = Math.floor((remTotal % MS_HOUR) / MS_MIN);
      const ts = Math.floor((remTotal % MS_MIN) / MS_SEC);
      elTotal.textContent =
        totalDays + " " + ukDayWord(totalDays) + " " + pad2(th) + ":" + pad2(tm) + ":" + pad2(ts);
    }
  }

  updateTogetherTimer();
  setInterval(updateTogetherTimer, 1000);

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

  const tgChat = document.querySelector("[data-tg-chat]");
  if (tgChat) {
    if (prefersReduced) {
      tgChat.classList.add("is-inview");
    } else {
      const tgObserver = new IntersectionObserver(
        function (entries, obs) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-inview");
              obs.unobserve(entry.target);
            }
          });
        },
        { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.18 }
      );
      tgObserver.observe(tgChat);
    }
  }

  const musicAudio = document.getElementById("musicAudio");
  const musicToggle = document.getElementById("musicToggle");

  function syncMusicButton() {
    if (!musicToggle || !musicAudio) {
      return;
    }
    const playing = !musicAudio.paused;
    musicToggle.classList.toggle("is-playing", playing);
    musicToggle.setAttribute("aria-label", playing ? "Пауза" : "Увімкнути музику");
  }

  if (musicAudio && musicToggle) {
    musicToggle.addEventListener("click", function () {
      if (musicAudio.paused) {
        musicAudio.play().catch(function () {});
      } else {
        musicAudio.pause();
      }
    });
    musicAudio.addEventListener("play", syncMusicButton);
    musicAudio.addEventListener("pause", syncMusicButton);
    musicAudio.addEventListener("ended", syncMusicButton);
    syncMusicButton();
  }
})();
