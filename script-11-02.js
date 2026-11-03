(function () {
  var root = document.documentElement;
  root.classList.add("js");

  // --u is one Figma design pixel. Desktop scales the 1920px frames to the viewport;
  // mobile switches to the stacked layout, where --u only sizes the few scaled typefaces.
  var MOBILE_MAX = 900;

  function setScale() {
    var width = root.clientWidth;
    root.style.setProperty("--u", (width > MOBILE_MAX ? width / 1920 : 0.5) + "px");
  }

  setScale();
  window.addEventListener("resize", setScale);

  // ---------- How it works: steps swap the screenshot stack ----------

  var STEPS = [
    {
      title: "Tell TimeLine your goal and your timeframe",
      text: "Type your goal in plain language — learn Spanish, launch a product, get promoted. Add how long you have. That's all.",
    },
    {
      title: "Get an AI-generated TimeLine broken down into milestones and tasks",
      text: "Instantly receive a structured roadmap organized by months and weeks. Milestones mark your progress checkpoints; tasks tell you exactly what to do each day.",
    },
    {
      title: "Follow your timeline, pivot when needed with AI and actually achieve your goal",
      text: "Life changes — so does your plan. Ask Pathfinder AI to adjust your timeline whenever you need. Stay on track without starting over.",
    },
  ];

  var tabs = Array.prototype.slice.call(document.querySelectorAll(".step"));
  var shots = Array.prototype.slice.call(document.querySelectorAll(".shot"));
  var panel = document.getElementById("step-panel");

  function selectStep(index, focus) {
    tabs.forEach(function (tab, i) {
      var selected = i === index;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected && focus) tab.focus();
    });

    // The selected step's screenshot comes to the front; the others follow in order behind it
    shots.forEach(function (shot) {
      var n = Number(shot.dataset.shot);
      shot.dataset.slot = String((n - index + STEPS.length) % STEPS.length);
    });

    panel.setAttribute("aria-labelledby", tabs[index].id);
    panel.querySelector(".step-title").textContent = STEPS[index].title;
    panel.querySelector(".step-text").textContent = STEPS[index].text;
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () {
      selectStep(i, false);
    });
    tab.addEventListener("keydown", function (event) {
      var next = null;
      if (event.key === "ArrowDown" || event.key === "ArrowRight") next = (i + 1) % tabs.length;
      if (event.key === "ArrowUp" || event.key === "ArrowLeft") next = (i - 1 + tabs.length) % tabs.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = tabs.length - 1;
      if (next !== null) {
        event.preventDefault();
        selectStep(next, true);
      }
    });
  });

  // ---------- Email sign-up forms ----------
  // No sign-up backend exists yet; this validates the address and confirms on the page.

  var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  document.querySelectorAll("[data-signup]").forEach(function (form) {
    var input = form.querySelector("input[type=email]");
    var status = form.querySelector(".signup-status");

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var value = input.value.trim();
      var valid = EMAIL_PATTERN.test(value);

      status.classList.toggle("is-error", !valid);
      input.setAttribute("aria-invalid", String(!valid));
      status.textContent = valid
        ? "Thanks — you're on the list. We'll be in touch."
        : "Please enter a valid email address.";

      if (valid) form.reset();
      else input.focus();
    });
  });

  // ---------- Scroll fade-in ----------

  var faders = document.querySelectorAll(".fade");
  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.15 }
    );
    faders.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    faders.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
