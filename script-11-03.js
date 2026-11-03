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

  if (panel) {
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
  }

  // ---------- Mobile menu (from TimeLine-Original-Repo) ----------

  var hamburger = document.getElementById("hamburger");
  var mobileNav = document.getElementById("mobile-nav");

  function setMenuOpen(open) {
    mobileNav.classList.toggle("open", open);
    hamburger.setAttribute("aria-expanded", String(open));
    hamburger.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
  }

  if (hamburger && mobileNav) {
    hamburger.addEventListener("click", function () {
      setMenuOpen(!mobileNav.classList.contains("open"));
    });

    document.addEventListener("click", function (event) {
      if (!hamburger.contains(event.target) && !mobileNav.contains(event.target)) setMenuOpen(false);
    });

    mobileNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setMenuOpen(false);
      });
    });
  }

  // ---------- Waitlist sign-ups + analytics (from TimeLine-Original-Repo/main.js) ----------
  // Sign-ups go to the same Supabase table as the original site; events go to GA4 when gtag is loaded.

  var SUPABASE_URL = "https://nfquifgsalsqyvdzyikt.supabase.co";
  var SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mcXVpZmdzYWxzcXl2ZHp5aWt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NjUxOTYsImV4cCI6MjA5MzQ0MTE5Nn0.0GIQO4WRfqMM0QlcdsNhSQUAmV_C95ggQyfU1OWrXic";
  var RESERVATION_URL = "reservation-11-03.html";

  function trackTimeLineEvent(name, params) {
    if (typeof window.gtag === "function") {
      window.gtag("event", name, params || {});
    }
  }

  function submitLead(payload) {
    var body = {
      email: payload.email,
      goal_type: payload.goalType || null,
      user_type: payload.userType || null,
      planning_problem: payload.planningProblem || null,
      source: payload.source || null,
      form: payload.form || null,
      page_path: window.location.pathname,
    };

    return fetch(SUPABASE_URL + "/rest/v1/waitlist_signups", {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: "Bearer " + SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(body),
    }).then(function (res) {
      // 409 means the email is already on the list; treat it as a success
      if (res.status === 409) return { ok: true };
      if (!res.ok) {
        return res.text().then(function (text) {
          throw new Error(text);
        });
      }
      return { ok: true };
    });
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
  }

  function getCheckedValue(form, name) {
    var field = form.querySelector('input[name="' + name + '"]:checked');
    return field ? field.value : "";
  }

  function setButtonBusy(button, isBusy) {
    if (!button) return;
    button.disabled = isBusy;
    button.setAttribute("aria-busy", String(isBusy));
  }

  function redirectToReservation() {
    window.location.href = RESERVATION_URL;
  }

  // ---------- Inline email forms ("Join Community", "Get Started Now") ----------

  document.querySelectorAll("[data-signup]").forEach(function (form) {
    var input = form.querySelector("input[type=email]");
    var button = form.querySelector("button[type=submit]");
    var status = form.querySelector(".signup-status");
    var submitting = false;

    function showError(message) {
      status.classList.add("is-error");
      status.textContent = message;
      input.setAttribute("aria-invalid", "true");
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (submitting) return;

      var email = input.value.trim();
      if (!isValidEmail(email)) {
        showError("Please enter a valid email before joining.");
        input.focus();
        trackTimeLineEvent("signup_error", { source: "join_community", form: "inline_email" });
        return;
      }

      submitting = true;
      status.textContent = "";
      status.classList.remove("is-error");
      input.removeAttribute("aria-invalid");
      setButtonBusy(button, true);

      submitLead({ email: email, source: "join_community", form: "inline_email" })
        .then(function () {
          trackTimeLineEvent("join_community_submit", { source: "join_community" });
          redirectToReservation();
        })
        .catch(function () {
          submitting = false;
          setButtonBusy(button, false);
          showError("Something went wrong. Please try again.");
          trackTimeLineEvent("signup_error", { source: "join_community", form: "inline_email", reason: "submit_failed" });
        });
    });
  });

  // ---------- Early access modal ----------

  var modal = document.getElementById("early-access-modal");
  var modalForm = document.getElementById("early-access-form");
  var modalError = document.getElementById("early-access-error");
  var modalEmail = modalForm ? modalForm.querySelector('input[name="email"]') : null;
  var modalSubmit = modalForm ? modalForm.querySelector(".modal-submit") : null;
  var modalSource = "unknown";
  var lastFocused = null;
  var modalSubmitting = false;

  function closeAllChoiceSelects(except) {
    document.querySelectorAll("[data-choice-select]").forEach(function (select) {
      if (select === except) return;
      select.classList.remove("open");
      var button = select.querySelector(".select-pill");
      if (button) button.setAttribute("aria-expanded", "false");
    });
  }

  function openModal(source) {
    lastFocused = document.activeElement;
    modalSource = source || "unknown";
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    modalError.textContent = "";
    modalEmail.focus();
    trackTimeLineEvent("early_access_modal_open", { source: modalSource });
  }

  function closeModal() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    closeAllChoiceSelects();
    if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
  }

  if (modal && modalForm) {
    document.querySelectorAll("[data-early-access-trigger]").forEach(function (trigger) {
      trigger.addEventListener("click", function (event) {
        event.preventDefault();
        openModal(trigger.getAttribute("data-source"));
      });
    });

    modal.querySelectorAll("[data-modal-close]").forEach(function (closer) {
      closer.addEventListener("click", closeModal);
    });

    document.addEventListener("keydown", function (event) {
      if (!modal.classList.contains("open")) return;
      if (event.key === "Escape") {
        closeModal();
        return;
      }
      // Keep keyboard focus inside the dialog while it is open
      if (event.key === "Tab") {
        var focusable = Array.prototype.filter.call(
          modal.querySelectorAll("button, input:not([type=radio]):not(.honeypot)"),
          function (el) {
            return el.offsetParent !== null && !el.disabled;
          }
        );
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });

    document.querySelectorAll("[data-choice-select]").forEach(function (select) {
      var button = select.querySelector(".select-pill");
      var radios = Array.prototype.slice.call(select.querySelectorAll('input[type="radio"]'));
      var fieldset = select.closest(".modal-fieldset");
      var valueLabel = fieldset ? fieldset.querySelector("[data-select-value]") : null;

      function closeSelect() {
        select.classList.remove("open");
        button.setAttribute("aria-expanded", "false");
      }

      button.addEventListener("click", function (event) {
        event.stopPropagation();
        closeAllChoiceSelects(select);
        var isOpen = select.classList.toggle("open");
        button.setAttribute("aria-expanded", String(isOpen));
        if (isOpen) {
          var current = select.querySelector("input:checked") || radios[0];
          current.focus();
        }
      });

      radios.forEach(function (radio) {
        radio.addEventListener("change", function () {
          var labelText = radio.nextElementSibling ? radio.nextElementSibling.textContent.trim() : "Select";
          if (valueLabel) valueLabel.textContent = labelText;
          if (fieldset) fieldset.classList.add("has-value");
          radios.forEach(function (optionRadio) {
            var option = optionRadio.closest('[role="option"]');
            if (option) option.setAttribute("aria-selected", String(optionRadio.checked));
          });
        });
        // A pointer click picks and closes; arrow keys only move the choice (they fire a click with detail 0)
        radio.addEventListener("click", function (event) {
          if (event.detail === 0) return;
          closeSelect();
          button.focus();
        });
        radio.addEventListener("keydown", function (event) {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (!radio.checked) {
              radio.checked = true;
              radio.dispatchEvent(new Event("change", { bubbles: true }));
            }
            closeSelect();
            button.focus();
          } else if (event.key === "Escape") {
            event.stopPropagation();
            closeSelect();
            button.focus();
          }
        });
      });

      document.addEventListener("click", function (event) {
        if (!select.contains(event.target)) closeSelect();
      });
    });

    modalForm.addEventListener("submit", function (event) {
      event.preventDefault();
      if (modalSubmitting) return;

      // Honeypot: bots fill the hidden field, people don't
      var honeypot = modalForm.querySelector('input[name="website"]');
      if (honeypot && honeypot.value) {
        redirectToReservation();
        return;
      }

      var email = modalEmail.value.trim();
      var goalType = getCheckedValue(modalForm, "goalType");
      var userType = getCheckedValue(modalForm, "userType");
      var planningProblem = getCheckedValue(modalForm, "planningProblem");

      if (!isValidEmail(email) || !goalType || !userType || !planningProblem) {
        modalError.textContent = "Please enter a valid email and select one option in each section.";
        trackTimeLineEvent("signup_error", { source: modalSource, form: "early_access_modal" });
        return;
      }

      modalSubmitting = true;
      setButtonBusy(modalSubmit, true);
      modalError.textContent = "";

      submitLead({
        email: email,
        goalType: goalType,
        userType: userType,
        planningProblem: planningProblem,
        source: modalSource,
        form: "early_access_modal",
      })
        .then(function () {
          trackTimeLineEvent("early_access_modal_submit", {
            source: modalSource,
            goal_type: goalType,
            user_type: userType,
            planning_problem: planningProblem,
          });
          redirectToReservation();
        })
        .catch(function () {
          modalSubmitting = false;
          setButtonBusy(modalSubmit, false);
          modalError.textContent = "Something went wrong. Please try again.";
          trackTimeLineEvent("signup_error", { source: modalSource, form: "early_access_modal", reason: "submit_failed" });
        });
    });
  }

  // ---------- Reservation page ----------

  if (document.body.classList.contains("reservation-page")) {
    trackTimeLineEvent("reservation_page_view", { page: "reservation" });
    var prototypeLink = document.getElementById("prototype-link");
    if (prototypeLink) {
      prototypeLink.addEventListener("click", function () {
        trackTimeLineEvent("prototype_click", { source: "reservation_page" });
      });
    }
  }

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
