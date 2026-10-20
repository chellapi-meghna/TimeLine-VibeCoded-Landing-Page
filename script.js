const navbar = document.getElementById("navbar");
const hamburger = document.getElementById("hamburger");
const mobileNav = document.getElementById("mobile-nav");
const track = document.querySelector(".carousel-track");
const dots = document.querySelectorAll(".carousel-dot");

if (navbar) {
  let lastScrollY = 0;

  window.addEventListener(
    "scroll",
    () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        navbar.style.transform = "translateY(-100%)";
      } else {
        navbar.style.transform = "translateY(0)";
      }

      lastScrollY = currentScrollY;
    },
    { passive: true }
  );
}

if (hamburger && mobileNav) {
  hamburger.addEventListener("click", () => {
    const isOpen = mobileNav.classList.toggle("open");
    hamburger.setAttribute("aria-expanded", String(isOpen));
  });

  document.addEventListener("click", (event) => {
    if (!hamburger.contains(event.target) && !mobileNav.contains(event.target)) {
      mobileNav.classList.remove("open");
      hamburger.setAttribute("aria-expanded", "false");
    }
  });
}

if (track && dots.length) {
  const updateDot = (index) => {
    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle("active", dotIndex === index);
    });
  };

  track.addEventListener("scroll", () => {
    const index = Math.round(track.scrollLeft / track.offsetWidth);
    updateDot(index);
  });

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      track.scrollTo({ left: index * track.offsetWidth, behavior: "smooth" });
      updateDot(index);
    });
  });
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

document.querySelectorAll(".fade-in").forEach((element) => observer.observe(element));

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", (event) => {
    const targetSelector = anchor.getAttribute("href");
    const target = targetSelector ? document.querySelector(targetSelector) : null;

    if (target) {
      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});
