/* ===================================================================
   STREAKY FOCUS - COMPLETE JAVASCRIPT (ENHANCED 2025)
   Professional Web Landing Page - Interactive Features
   =================================================================== */

"use strict";

/* ===== GLOBAL CONFIGURATION ===== */
const CONFIG = {
  // Animation settings
  SCROLL_THRESHOLD: 100,
  THROTTLE_DELAY: 16,
  DEBOUNCE_DELAY: 300,

  // Intersection Observer settings
  OBSERVER_THRESHOLD: 0.1,
  OBSERVER_ROOT_MARGIN: "0px 0px -50px 0px",

  // Ticker settings
  TICKER_SPEED: 30000, // 30 seconds

  // Toast settings
  TOAST_DURATION: 5000,
  TOAST_FADE_DURATION: 300,

  // Smooth scroll settings
  SCROLL_BEHAVIOR: "smooth",
  SCROLL_OFFSET: 80,

  // Breakpoints
  MOBILE_BREAKPOINT: 768,
  TABLET_BREAKPOINT: 1024,

  // Local storage keys
  STORAGE_KEYS: {
    THEME: "streaky_focus_theme",
    VISITED: "streaky_focus_visited",
    PREFERENCES: "streaky_focus_preferences",
  },
};

/* ===== GLOBAL STATE ===== */
const STATE = {
  isLoaded: false,
  isMobileMenuOpen: false,
  currentSection: "home",
  scrollPosition: 0,
  windowWidth: window.innerWidth,
  windowHeight: window.innerHeight,
  isScrolling: false,
  animations: new Set(),
  observers: new Map(),
  timers: new Map(),
  cache: new Map(),
};

/* ===== UTILITY FUNCTIONS ===== */
const Utils = {
  // DOM utilities
  $(selector) {
    return document.querySelector(selector);
  },

  $$(selector) {
    return document.querySelectorAll(selector);
  },

  createElement(tag, classes = [], attributes = {}) {
    const element = document.createElement(tag);
    if (classes.length) element.className = classes.join(" ");
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
    return element;
  },

  // Throttle function
  throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  // Debounce function
  debounce(func, delay, immediate = false) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func(...args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, delay);
      if (callNow) func(...args);
    };
  },

  // Smooth animation function
  animate({ timing = (t) => t, draw, duration = 1000, delay = 0 }) {
    return new Promise((resolve) => {
      const start = performance.now() + delay;

      const animationId = requestAnimationFrame(function animate(time) {
        let timeFraction = (time - start) / duration;

        if (timeFraction < 0) {
          requestAnimationFrame(animate);
          return;
        }

        if (timeFraction > 1) timeFraction = 1;

        const progress = timing(timeFraction);
        draw(progress);

        if (timeFraction < 1) {
          requestAnimationFrame(animate);
        } else {
          STATE.animations.delete(animationId);
          resolve();
        }
      });

      STATE.animations.add(animationId);
    });
  },

  // Intersection Observer helper
  createObserver(callback, options = {}) {
    const defaultOptions = {
      threshold: CONFIG.OBSERVER_THRESHOLD,
      rootMargin: CONFIG.OBSERVER_ROOT_MARGIN,
    };

    return new IntersectionObserver(callback, {
      ...defaultOptions,
      ...options,
    });
  },

  // Local storage helpers
  storage: {
    get(key, defaultValue = null) {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      } catch (error) {
        console.warn("Failed to get from localStorage:", error);
        return defaultValue;
      }
    },

    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        console.warn("Failed to set localStorage:", error);
        return false;
      }
    },

    remove(key) {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (error) {
        console.warn("Failed to remove from localStorage:", error);
        return false;
      }
    },
  },

  // URL and navigation helpers
  getHash() {
    return window.location.hash.slice(1) || "home";
  },

  setHash(hash) {
    history.replaceState(null, null, `#${hash}`);
  },

  // Performance helpers
  isElementInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <=
        (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  },

  // Device detection
  isMobile() {
    return STATE.windowWidth <= CONFIG.MOBILE_BREAKPOINT;
  },

  isTablet() {
    return (
      STATE.windowWidth <= CONFIG.TABLET_BREAKPOINT &&
      STATE.windowWidth > CONFIG.MOBILE_BREAKPOINT
    );
  },

  // Animation easing functions
  easing: {
    easeOut: (t) => 1 - Math.pow(1 - t, 3),
    easeIn: (t) => t * t * t,
    easeInOut: (t) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    bounce: (t) => {
      const n1 = 7.5625;
      const d1 = 2.75;

      if (t < 1 / d1) {
        return n1 * t * t;
      } else if (t < 2 / d1) {
        return n1 * (t -= 1.5 / d1) * t + 0.75;
      } else if (t < 2.5 / d1) {
        return n1 * (t -= 2.25 / d1) * t + 0.9375;
      } else {
        return n1 * (t -= 2.625 / d1) * t + 0.984375;
      }
    },
  },
};

/* ===== CORE APPLICATION CLASS ===== */
class StreakyFocusApp {
  constructor() {
    this.modules = new Map();
    this.isInitialized = false;

    // Bind methods
    this.init = this.init.bind(this);
    this.handleLoad = this.handleLoad.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleScroll = this.handleScroll.bind(this);
    this.handleHashChange = this.handleHashChange.bind(this);
  }

  async init() {
    if (this.isInitialized) return;

    try {
      console.log("🚀 Initializing Streaky Focus App...");

      // Initialize modules
      await this.initializeModules();

      // Setup event listeners
      this.setupEventListeners();

      // Initialize components
      this.initializeComponents();

      // Start background processes
      this.startBackgroundProcesses();

      // Mark as initialized
      this.isInitialized = true;
      STATE.isLoaded = true;

      console.log("✅ App initialized successfully");

      // Dispatch custom event
      this.dispatchEvent("app:initialized");
    } catch (error) {
      console.error("❌ App initialization failed:", error);
      this.handleError("Failed to initialize application", error);
    }
  }

  async initializeModules() {
    const modules = [
      { name: "navigation", class: NavigationModule },
      { name: "scroll", class: ScrollModule },
      { name: "animation", class: AnimationModule },
      { name: "form", class: FormModule },
      { name: "toast", class: ToastModule },
      { name: "analytics", class: AnalyticsModule },
      { name: "performance", class: PerformanceModule },
    ];

    for (const { name, class: ModuleClass } of modules) {
      try {
        const module = new ModuleClass(this);
        await module.init?.();
        this.modules.set(name, module);
        console.log(`✅ ${name} module initialized`);
      } catch (error) {
        console.error(`❌ Failed to initialize ${name} module:`, error);
      }
    }
  }

  setupEventListeners() {
    // Window events
    window.addEventListener("load", this.handleLoad);
    window.addEventListener(
      "resize",
      Utils.debounce(this.handleResize, CONFIG.DEBOUNCE_DELAY)
    );
    window.addEventListener(
      "scroll",
      Utils.throttle(this.handleScroll, CONFIG.THROTTLE_DELAY)
    );
    window.addEventListener("hashchange", this.handleHashChange);

    // DOM events
    document.addEventListener("DOMContentLoaded", this.handleLoad);

    // Error handling
    window.addEventListener("error", this.handleGlobalError.bind(this));
    window.addEventListener(
      "unhandledrejection",
      this.handleUnhandledRejection.bind(this)
    );

    // Visibility change
    document.addEventListener(
      "visibilitychange",
      this.handleVisibilityChange.bind(this)
    );

    // Performance monitoring
    if ("performance" in window) {
      window.addEventListener("load", () => {
        this.modules.get("performance")?.measurePageLoad();
      });
    }
  }

  initializeComponents() {
    // Initialize intersection observers
    this.setupIntersectionObservers();

    // Initialize counters
    this.initializeCounters();

    // Initialize forms
    this.initializeForms();

    // Initialize interactive elements
    this.initializeInteractiveElements();

    // Initialize accessibility features
    this.initializeAccessibility();
  }

  startBackgroundProcesses() {
    // Start ticker animation
    this.modules.get("animation")?.startTicker();

    // Start performance monitoring
    this.modules.get("performance")?.startMonitoring();

    // Update current section based on hash
    this.updateCurrentSection();
  }

  // Event handlers
  handleLoad() {
    // Hide loading screen
    this.hideLoadingScreen();

    // Show floating action button after scroll
    this.setupFloatingActionButton();

    // Initialize current section
    this.updateCurrentSection();

    // Track page view
    this.modules.get("analytics")?.trackPageView();
  }

  handleResize() {
    STATE.windowWidth = window.innerWidth;
    STATE.windowHeight = window.innerHeight;

    // Update mobile menu if needed
    if (!Utils.isMobile() && STATE.isMobileMenuOpen) {
      this.closeMobileMenu();
    }

    // Notify modules
    this.modules.forEach((module) => {
      if (typeof module.handleResize === "function") {
        module.handleResize();
      }
    });

    this.dispatchEvent("app:resize", {
      width: STATE.windowWidth,
      height: STATE.windowHeight,
    });
  }

  handleScroll() {
    STATE.scrollPosition = window.pageYOffset;
    STATE.isScrolling = true;

    // Update navigation
    this.modules.get("navigation")?.updateActiveNavigation();

    // Update floating action button
    this.updateFloatingActionButton();

    // Handle scroll animations
    this.modules.get("animation")?.handleScroll();

    // Clear scrolling state
    clearTimeout(STATE.timers.get("scrollEnd"));
    STATE.timers.set(
      "scrollEnd",
      setTimeout(() => {
        STATE.isScrolling = false;
      }, 100)
    );

    this.dispatchEvent("app:scroll", {
      position: STATE.scrollPosition,
      direction:
        STATE.scrollPosition > (STATE.lastScrollPosition || 0) ? "down" : "up",
    });

    STATE.lastScrollPosition = STATE.scrollPosition;
  }

  handleHashChange() {
    this.updateCurrentSection();
    this.modules.get("scroll")?.scrollToSection(Utils.getHash());
  }

  handleVisibilityChange() {
    if (document.hidden) {
      this.modules.get("analytics")?.pauseTracking();
    } else {
      this.modules.get("analytics")?.resumeTracking();
    }
  }

  handleGlobalError(event) {
    console.error("Global error:", event.error);
    this.modules.get("analytics")?.trackError(event.error);
  }

  handleUnhandledRejection(event) {
    console.error("Unhandled promise rejection:", event.reason);
    this.modules.get("analytics")?.trackError(event.reason);
  }

  // Component initialization methods
  setupIntersectionObservers() {
    // Section observer for navigation updates
    const sectionObserver = Utils.createObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.id;
            if (sectionId && sectionId !== STATE.currentSection) {
              STATE.currentSection = sectionId;
              this.modules.get("navigation")?.updateActiveNavigation(sectionId);
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    // Observe all sections
    Utils.$$("section[id]").forEach((section) => {
      sectionObserver.observe(section);
    });

    STATE.observers.set("sections", sectionObserver);

    // Animation observer for scroll animations
    const animationObserver = Utils.createObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.modules.get("animation")?.animateElement(entry.target);
          animationObserver.unobserve(entry.target);
        }
      });
    });

    // Observe animation elements
    Utils.$$(
      ".animate-on-scroll, .stats-grid .stat-card, .testimonial-card, .feature-card"
    ).forEach((element) => {
      animationObserver.observe(element);
    });

    STATE.observers.set("animations", animationObserver);
  }

  initializeCounters() {
    const counterElements = Utils.$$("[data-count]");

    const counterObserver = Utils.createObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.modules.get("animation")?.animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.8 }
    );

    counterElements.forEach((element) => {
      counterObserver.observe(element);
    });

    STATE.observers.set("counters", counterObserver);
  }

  initializeForms() {
    Utils.$$("form").forEach((form) => {
      this.modules.get("form")?.setupForm(form);
    });
  }

  initializeInteractiveElements() {
    // FAQ items
    Utils.$$(".faq-question").forEach((question) => {
      question.addEventListener("click", (e) => {
        this.toggleFAQ(e.target.closest(".faq-item"));
      });
    });

    // Pricing toggle
    const pricingToggle = Utils.$("#pricing-toggle");
    if (pricingToggle) {
      pricingToggle.addEventListener("click", this.togglePricing.bind(this));
    }

    // Download buttons
    Utils.$$(".download-button").forEach((button) => {
      button.addEventListener("click", (e) => {
        const platform = button.classList.contains("ios") ? "ios" : "android";
        this.trackDownload(platform);
      });
    });

    // CTA buttons
    Utils.$$(".cta-button").forEach((button) => {
      button.addEventListener("click", this.handleCTAClick.bind(this));
    });
  }

  initializeAccessibility() {
    // Skip links
    Utils.$$(".skip-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const target = Utils.$(link.getAttribute("href"));
        if (target) {
          target.focus();
          target.scrollIntoView({ behavior: "smooth" });
        }
      });
    });

    // Keyboard navigation
    document.addEventListener("keydown", (e) => {
      // Escape key closes mobile menu
      if (e.key === "Escape" && STATE.isMobileMenuOpen) {
        this.closeMobileMenu();
      }

      // Enter key on interactive elements
      if (e.key === "Enter" && e.target.matches(".faq-question")) {
        e.target.click();
      }
    });
  }

  // UI Methods
  hideLoadingScreen() {
    const loadingScreen = Utils.$("#loading-screen");
    if (loadingScreen) {
      Utils.animate({
        duration: 500,
        timing: Utils.easing.easeOut,
        draw: (progress) => {
          loadingScreen.style.opacity = 1 - progress;
        },
      }).then(() => {
        loadingScreen.style.display = "none";
      });
    }
  }

  setupFloatingActionButton() {
    const fab = Utils.$("#fab-scroll-to-top");
    if (fab) {
      fab.addEventListener("click", () => {
        this.scrollToTop();
        this.modules.get("analytics")?.trackEvent("fab_click", "scroll_to_top");
      });
    }
  }

  updateFloatingActionButton() {
    const fab = Utils.$("#fab-scroll-to-top");
    if (fab) {
      if (STATE.scrollPosition > CONFIG.SCROLL_THRESHOLD) {
        fab.style.opacity = "1";
        fab.style.transform = "scale(1)";
        fab.style.pointerEvents = "auto";
      } else {
        fab.style.opacity = "0";
        fab.style.transform = "scale(0.8)";
        fab.style.pointerEvents = "none";
      }
    }
  }

  updateCurrentSection() {
    const hash = Utils.getHash();
    if (hash !== STATE.currentSection) {
      STATE.currentSection = hash;
      this.modules.get("navigation")?.updateActiveNavigation(hash);
    }
  }

  // Interactive Methods
  toggleMobileMenu() {
    if (STATE.isMobileMenuOpen) {
      this.closeMobileMenu();
    } else {
      this.openMobileMenu();
    }
  }

  openMobileMenu() {
    const overlay = Utils.$("#mobile-menu-overlay");
    const toggle = Utils.$("#mobile-menu-toggle");

    if (overlay && toggle) {
      overlay.classList.add("active");
      toggle.classList.add("active");
      toggle.setAttribute("aria-expanded", "true");

      document.body.style.overflow = "hidden";
      STATE.isMobileMenuOpen = true;

      // Focus management
      const firstFocusable = overlay.querySelector("a, button, [tabindex]");
      if (firstFocusable) {
        setTimeout(() => firstFocusable.focus(), 100);
      }

      this.modules.get("analytics")?.trackEvent("mobile_menu", "open");
    }
  }

  closeMobileMenu() {
    const overlay = Utils.$("#mobile-menu-overlay");
    const toggle = Utils.$("#mobile-menu-toggle");

    if (overlay && toggle) {
      overlay.classList.remove("active");
      toggle.classList.remove("active");
      toggle.setAttribute("aria-expanded", "false");

      document.body.style.overflow = "";
      STATE.isMobileMenuOpen = false;

      this.modules.get("analytics")?.trackEvent("mobile_menu", "close");
    }
  }

  toggleFAQ(faqItem) {
    if (!faqItem) return;

    const isActive = faqItem.classList.contains("active");

    // Close all other FAQs
    Utils.$$(".faq-item.active").forEach((item) => {
      if (item !== faqItem) {
        item.classList.remove("active");
        const toggle = item.querySelector(".question-toggle");
        if (toggle) toggle.textContent = "+";
      }
    });

    // Toggle current FAQ
    if (isActive) {
      faqItem.classList.remove("active");
      const toggle = faqItem.querySelector(".question-toggle");
      if (toggle) toggle.textContent = "+";
    } else {
      faqItem.classList.add("active");
      const toggle = faqItem.querySelector(".question-toggle");
      if (toggle) toggle.textContent = "−";
    }

    this.modules
      .get("analytics")
      ?.trackEvent("faq", isActive ? "close" : "open");
  }

  togglePricing() {
    const toggle = Utils.$("#pricing-toggle");
    const monthlyElements = Utils.$$(".monthly");
    const annualElements = Utils.$$(".annual");

    if (toggle) {
      toggle.classList.toggle("active");
      const isAnnual = toggle.classList.contains("active");

      monthlyElements.forEach((el) => {
        el.classList.toggle("hidden", isAnnual);
      });

      annualElements.forEach((el) => {
        el.classList.toggle("hidden", !isAnnual);
      });

      this.modules
        .get("analytics")
        ?.trackEvent("pricing_toggle", isAnnual ? "annual" : "monthly");
    }
  }

  handleCTAClick(event) {
    const button = event.currentTarget;
    const action = button.getAttribute("data-action") || "download";

    switch (action) {
      case "download":
        this.scrollToDownload();
        break;
      case "demo":
        this.openDemo();
        break;
      case "signup":
        this.scrollToSignup();
        break;
      default:
        this.scrollToDownload();
    }

    this.modules.get("analytics")?.trackEvent("cta_click", action);
  }

  // Navigation Methods
  scrollToTop() {
    this.modules.get("scroll")?.scrollToPosition(0);
  }

  scrollToDownload() {
    this.modules.get("scroll")?.scrollToSection("download");
  }

  scrollToSignup() {
    this.modules.get("scroll")?.scrollToSection("pricing");
  }

  openDemo() {
    this.modules.get("toast")?.show({
      type: "info",
      message: "Demo video coming soon! Download the app to see it in action.",
      duration: 4000,
    });
  }

  // Analytics Methods
  trackDownload(platform) {
    this.modules.get("analytics")?.trackEvent("download_click", platform);

    // Show confirmation toast
    this.modules.get("toast")?.show({
      type: "success",
      message: `Redirecting to ${
        platform === "ios" ? "App Store" : "Google Play"
      }...`,
      duration: 3000,
    });
  }

  selectPlan(plan) {
    this.modules.get("analytics")?.trackEvent("plan_select", plan);
    this.modules.get("toast")?.show({
      type: "success",
      message: `${plan} plan selected! Redirecting to checkout...`,
      duration: 3000,
    });
  }

  startFreeTrial() {
    this.modules.get("analytics")?.trackEvent("free_trial", "start");
    this.scrollToDownload();
  }

  // Utility Methods
  dispatchEvent(type, detail = {}) {
    const event = new CustomEvent(type, { detail });
    document.dispatchEvent(event);
  }

  handleError(message, error) {
    console.error(message, error);
    this.modules.get("toast")?.show({
      type: "error",
      message: "Something went wrong. Please refresh the page.",
      duration: 5000,
    });
  }

  // Cleanup
  destroy() {
    // Clear all timers
    STATE.timers.forEach((timer) => clearTimeout(timer));
    STATE.timers.clear();

    // Cancel all animations
    STATE.animations.forEach((id) => cancelAnimationFrame(id));
    STATE.animations.clear();

    // Disconnect all observers
    STATE.observers.forEach((observer) => observer.disconnect());
    STATE.observers.clear();

    // Destroy modules
    this.modules.forEach((module) => {
      if (typeof module.destroy === "function") {
        module.destroy();
      }
    });
    this.modules.clear();

    // Reset state
    this.isInitialized = false;
    STATE.isLoaded = false;
  }
}

/* ===== NAVIGATION MODULE ===== */
class NavigationModule {
  constructor(app) {
    this.app = app;
    this.currentSection = "home";
  }

  async init() {
    this.setupSmoothScroll();
    this.setupMobileMenu();
  }

  setupSmoothScroll() {
    Utils.$$('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const targetId = link.getAttribute("href").slice(1);
        this.app.modules.get("scroll")?.scrollToSection(targetId);
      });
    });
  }

  setupMobileMenu() {
    const toggle = Utils.$("#mobile-menu-toggle");
    const overlay = Utils.$("#mobile-menu-overlay");
    const backdrop = Utils.$(".mobile-menu-backdrop");

    if (toggle) {
      toggle.addEventListener("click", () => {
        this.app.toggleMobileMenu();
      });
    }

    if (backdrop) {
      backdrop.addEventListener("click", () => {
        this.app.closeMobileMenu();
      });
    }

    // Close menu when clicking nav links
    Utils.$$(".mobile-nav-item").forEach((link) => {
      link.addEventListener("click", () => {
        this.app.closeMobileMenu();
      });
    });
  }

  updateActiveNavigation(sectionId = null) {
    if (!sectionId) {
      sectionId = this.getCurrentSection();
    }

    if (sectionId === this.currentSection) return;

    this.currentSection = sectionId;

    // Update navigation items
    Utils.$$(".nav-item").forEach((item) => {
      item.classList.remove("active");
      item.removeAttribute("aria-current");
    });

    Utils.$$(".mobile-nav-item").forEach((item) => {
      item.classList.remove("active");
    });

    // Set active navigation
    const activeNavItem = Utils.$(`a[href="#${sectionId}"].nav-item`);
    const activeMobileNavItem = Utils.$(
      `a[href="#${sectionId}"].mobile-nav-item`
    );

    if (activeNavItem) {
      activeNavItem.classList.add("active");
      activeNavItem.setAttribute("aria-current", "page");
    }

    if (activeMobileNavItem) {
      activeMobileNavItem.classList.add("active");
    }

    // Update URL hash
    Utils.setHash(sectionId);
  }

  getCurrentSection() {
    const sections = Utils.$$("section[id]");
    const scrollPosition = window.pageYOffset + 100;

    for (const section of sections) {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;

      if (
        scrollPosition >= sectionTop &&
        scrollPosition < sectionTop + sectionHeight
      ) {
        return section.id;
      }
    }

    return "home";
  }
}

/* ===== SCROLL MODULE ===== */
class ScrollModule {
  constructor(app) {
    this.app = app;
  }

  async init() {
    // Module is initialized
  }

  scrollToSection(sectionId) {
    const section = Utils.$(`#${sectionId}`);
    if (!section) return;

    const headerHeight = Utils.$(".main-header")?.offsetHeight || 0;
    const targetPosition =
      section.offsetTop - headerHeight - CONFIG.SCROLL_OFFSET;

    this.scrollToPosition(targetPosition);
  }

  scrollToPosition(position) {
    Utils.animate({
      duration: 800,
      timing: Utils.easing.easeInOut,
      draw: (progress) => {
        const start = window.pageYOffset;
        const distance = position - start;
        window.scrollTo(0, start + distance * progress);
      },
    });
  }

  scrollToTop() {
    this.scrollToPosition(0);
  }
}

/* ===== ANIMATION MODULE ===== */
class AnimationModule {
  constructor(app) {
    this.app = app;
    this.counters = new Set();
    this.tickerTimer = null;
  }

  async init() {
    this.setupFloatingElements();
  }

  setupFloatingElements() {
    Utils.$$(".floating-element").forEach((element, index) => {
      Utils.animate({
        duration: 20000,
        timing: (t) => t,
        draw: (progress) => {
          const angle = progress * 2 * Math.PI + index * 0.5;
          const x = Math.sin(angle) * 30;
          const y = Math.cos(angle) * 20;
          const rotation = progress * 360;
          const scale = 0.9 + Math.sin(progress * 4 * Math.PI) * 0.2;

          element.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${scale})`;
        },
      });
    });
  }

  animateElement(element) {
    if (element.hasAttribute("data-animated")) return;
    element.setAttribute("data-animated", "true");

    const animationType = this.getAnimationType(element);

    switch (animationType) {
      case "fadeUp":
        this.animateFadeUp(element);
        break;
      case "scaleIn":
        this.animateScaleIn(element);
        break;
      case "slideIn":
        this.animateSlideIn(element);
        break;
      default:
        this.animateFadeIn(element);
    }
  }

  getAnimationType(element) {
    if (element.matches(".stat-card")) return "scaleIn";
    if (element.matches(".testimonial-card")) return "slideIn";
    if (element.matches(".feature-card")) return "fadeUp";
    return "fadeIn";
  }

  animateFadeUp(element) {
    element.style.opacity = "0";
    element.style.transform = "translateY(30px)";

    Utils.animate({
      duration: 600,
      timing: Utils.easing.easeOut,
      draw: (progress) => {
        element.style.opacity = progress;
        element.style.transform = `translateY(${30 * (1 - progress)}px)`;
      },
    });
  }

  animateScaleIn(element) {
    element.style.opacity = "0";
    element.style.transform = "scale(0.8)";

    Utils.animate({
      duration: 500,
      timing: Utils.easing.bounce,
      draw: (progress) => {
        element.style.opacity = progress;
        element.style.transform = `scale(${0.8 + 0.2 * progress})`;
      },
    });
  }

  animateSlideIn(element) {
    const isEven =
      Array.from(element.parentNode.children).indexOf(element) % 2 === 0;
    const direction = isEven ? -50 : 50;

    element.style.opacity = "0";
    element.style.transform = `translateX(${direction}px)`;

    Utils.animate({
      duration: 700,
      timing: Utils.easing.easeOut,
      draw: (progress) => {
        element.style.opacity = progress;
        element.style.transform = `translateX(${direction * (1 - progress)}px)`;
      },
    });
  }

  animateFadeIn(element) {
    element.style.opacity = "0";

    Utils.animate({
      duration: 400,
      timing: Utils.easing.easeOut,
      draw: (progress) => {
        element.style.opacity = progress;
      },
    });
  }

  animateCounter(element) {
    if (this.counters.has(element)) return;
    this.counters.add(element);

    const target = parseInt(element.getAttribute("data-count")) || 0;
    const duration = 2000;

    Utils.animate({
      duration,
      timing: Utils.easing.easeOut,
      draw: (progress) => {
        const currentValue = Math.floor(target * progress);
        element.textContent = this.formatNumber(currentValue);
      },
    }).then(() => {
      element.textContent = this.formatNumber(target);
    });
  }

  formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toLocaleString();
  }

  startTicker() {
    const ticker = Utils.$("#live-ticker");
    if (!ticker) return;

    const tickerItems = [
      { icon: "🔥", text: "Alex completed a 127-day focus streak!" },
      { icon: "📱", text: "Sarah reduced phone usage by 78% in 30 days" },
      { icon: "⚡", text: "Mike earned 1000 focus coins today" },
      { icon: "🏆", text: 'Emma unlocked "Focus Master" achievement' },
      { icon: "🎯", text: "Jordan completed 100 focus sessions this month" },
      { icon: "💎", text: "Lisa joined the 1000+ focus hours club" },
      { icon: "🚀", text: "Chris reached level 25 in focus ranking" },
      { icon: "🌟", text: "Taylor maintained perfect weekly focus streak" },
    ];

    let currentIndex = 0;

    const updateTicker = () => {
      const currentItems = ticker.querySelectorAll(".ticker-item");

      // Create new ticker items
      const newItems = [];
      for (let i = 0; i < 4; i++) {
        const itemIndex = (currentIndex + i) % tickerItems.length;
        const item = tickerItems[itemIndex];

        const tickerItem = Utils.createElement("div", ["ticker-item"]);
        tickerItem.innerHTML = `
          <span class="ticker-icon">${item.icon}</span>
          <span class="ticker-text">${item.text}</span>
        `;

        newItems.push(tickerItem);
      }

      // Replace content
      ticker.innerHTML = "";
      newItems.forEach((item) => ticker.appendChild(item));

      currentIndex = (currentIndex + 1) % tickerItems.length;
    };

    // Initial update
    updateTicker();

    // Continue updating
    this.tickerTimer = setInterval(updateTicker, CONFIG.TICKER_SPEED);
  }

  handleScroll() {
    // Handle scroll-based animations
    const parallaxElements = Utils.$$(".parallax-element");
    const scrolled = window.pageYOffset;

    parallaxElements.forEach((element) => {
      const speed = element.getAttribute("data-speed") || 0.5;
      const yPos = -(scrolled * speed);
      element.style.transform = `translateY(${yPos}px)`;
    });
  }

  destroy() {
    if (this.tickerTimer) {
      clearInterval(this.tickerTimer);
    }
    this.counters.clear();
  }
}

/* ===== FORM MODULE ===== */
class FormModule {
  constructor(app) {
    this.app = app;
    this.forms = new Map();
  }

  async init() {
    // Module initialized
  }

  setupForm(form) {
    if (this.forms.has(form)) return;

    this.forms.set(form, {
      isSubmitting: false,
      fields: new Map(),
    });

    // Setup form submission
    form.addEventListener("submit", (e) => {
      this.handleFormSubmit(e, form);
    });

    // Setup field validation
    const inputs = form.querySelectorAll("input, select, textarea");
    inputs.forEach((input) => {
      input.addEventListener("blur", () => this.validateField(input));
      input.addEventListener("input", () => this.clearFieldError(input));
    });
  }

  async handleFormSubmit(event, form) {
    event.preventDefault();

    const formData = this.forms.get(form);
    if (!formData || formData.isSubmitting) return;

    // Validate all fields
    const inputs = form.querySelectorAll(
      "input[required], select[required], textarea[required]"
    );
    let isValid = true;

    inputs.forEach((input) => {
      if (!this.validateField(input)) {
        isValid = false;
      }
    });

    if (!isValid) {
      this.showFormMessage(form, "error", "Please correct the errors above.");
      return;
    }

    // Set loading state
    formData.isSubmitting = true;
    this.setFormLoading(form, true);

    try {
      const formDataObj = new FormData(form);
      const data = Object.fromEntries(formDataObj);

      // Simulate API call
      await this.simulateFormSubmission(data);

      // Success
      this.showFormMessage(
        form,
        "success",
        "Thank you! We'll be in touch soon."
      );
      form.reset();

      // Track form submission
      this.app.modules
        .get("analytics")
        ?.trackEvent("form_submit", form.id || "unknown");

      // Show success toast
      this.app.modules.get("toast")?.show({
        type: "success",
        message: "Form submitted successfully!",
        duration: 4000,
      });
    } catch (error) {
      this.showFormMessage(
        form,
        "error",
        "Something went wrong. Please try again."
      );
      console.error("Form submission error:", error);
    } finally {
      formData.isSubmitting = false;
      this.setFormLoading(form, false);
    }
  }

  simulateFormSubmission(data) {
    return new Promise((resolve) => {
      setTimeout(resolve, Math.random() * 2000 + 1000);
    });
  }

  validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let message = "";

    // Required field validation
    if (field.hasAttribute("required") && !value) {
      isValid = false;
      message = "This field is required";
    }

    // Email validation
    else if (field.type === "email" && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        isValid = false;
        message = "Please enter a valid email address";
      }
    }

    // Phone validation
    else if (field.type === "tel" && value) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ""))) {
        isValid = false;
        message = "Please enter a valid phone number";
      }
    }

    // URL validation
    else if (field.type === "url" && value) {
      try {
        new URL(value);
      } catch {
        isValid = false;
        message = "Please enter a valid URL";
      }
    }

    this.showFieldError(field, isValid ? "" : message);
    return isValid;
  }

  showFieldError(field, message) {
    let errorElement = field.parentNode.querySelector(".field-error");

    if (message) {
      if (!errorElement) {
        errorElement = Utils.createElement("span", ["field-error"]);
        errorElement.setAttribute("aria-live", "polite");
        field.parentNode.appendChild(errorElement);
      }

      errorElement.textContent = message;
      field.setAttribute("aria-invalid", "true");
      field.classList.add("error");
    } else {
      if (errorElement) {
        errorElement.remove();
      }
      field.removeAttribute("aria-invalid");
      field.classList.remove("error");
    }
  }

  clearFieldError(field) {
    this.showFieldError(field, "");
  }

  setFormLoading(form, loading) {
    const submitButton = form.querySelector('button[type="submit"]');

    if (submitButton) {
      submitButton.disabled = loading;

      if (loading) {
        submitButton.classList.add("loading");
        const originalText = submitButton.textContent;
        submitButton.setAttribute("data-original-text", originalText);
        submitButton.textContent = "Submitting...";
      } else {
        submitButton.classList.remove("loading");
        const originalText = submitButton.getAttribute("data-original-text");
        if (originalText) {
          submitButton.textContent = originalText;
        }
      }
    }
  }

  showFormMessage(form, type, message) {
    let messageElement = form.querySelector(".form-message");

    if (!messageElement) {
      messageElement = Utils.createElement("div", ["form-message"]);
      form.appendChild(messageElement);
    }

    messageElement.className = `form-message ${type}`;
    messageElement.textContent = message;
    messageElement.style.display = "block";

    // Auto-hide success messages
    if (type === "success") {
      setTimeout(() => {
        messageElement.style.display = "none";
      }, 5000);
    }
  }
}

/* ===== TOAST MODULE ===== */
class ToastModule {
  constructor(app) {
    this.app = app;
    this.container = null;
    this.toasts = new Set();
  }

  async init() {
    this.createContainer();
  }

  createContainer() {
    this.container = Utils.$("#toast-container");

    if (!this.container) {
      this.container = Utils.createElement("div", ["toast-container"]);
      this.container.id = "toast-container";
      document.body.appendChild(this.container);
    }
  }

  show({ type = "info", message, duration = CONFIG.TOAST_DURATION }) {
    const toast = this.createToast(type, message);

    this.container.appendChild(toast);
    this.toasts.add(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.style.transform = "translateX(0)";
      toast.style.opacity = "1";
    });

    // Auto remove
    const timer = setTimeout(() => {
      this.remove(toast);
    }, duration);

    toast.setAttribute("data-timer", timer);

    return toast;
  }

  createToast(type, message) {
    const toast = Utils.createElement("div", ["toast", type]);

    const icons = {
      success: "✅",
      error: "❌",
      warning: "⚠️",
      info: "ℹ️",
    };

    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close" aria-label="Close notification">×</button>
    `;

    // Setup close button
    const closeButton = toast.querySelector(".toast-close");
    closeButton.addEventListener("click", () => {
      this.remove(toast);
    });

    return toast;
  }

  remove(toast) {
    if (!this.toasts.has(toast)) return;

    // Clear timer
    const timer = toast.getAttribute("data-timer");
    if (timer) {
      clearTimeout(timer);
    }

    // Animate out
    toast.style.transform = "translateX(100%)";
    toast.style.opacity = "0";

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
      this.toasts.delete(toast);
    }, CONFIG.TOAST_FADE_DURATION);
  }

  clear() {
    this.toasts.forEach((toast) => this.remove(toast));
  }

  destroy() {
    this.clear();
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}

/* ===== ANALYTICS MODULE ===== */
class AnalyticsModule {
  constructor(app) {
    this.app = app;
    this.events = [];
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    this.isTracking = true;
  }

  async init() {
    this.setupPerformanceTracking();
    this.trackPageView();
  }

  setupPerformanceTracking() {
    // Track page load performance
    if ("performance" in window) {
      window.addEventListener("load", () => {
        setTimeout(() => {
          const navigation = performance.getEntriesByType("navigation")[0];
          if (navigation) {
            this.trackEvent("page_performance", {
              load_time: Math.round(
                navigation.loadEventEnd - navigation.loadEventStart
              ),
              dom_ready: Math.round(
                navigation.domContentLoadedEventEnd -
                  navigation.domContentLoadedEventStart
              ),
              total_time: Math.round(
                navigation.loadEventEnd - navigation.requestStart
              ),
            });
          }
        }, 0);
      });
    }

    // Track errors
    window.addEventListener("error", (event) => {
      this.trackError(event.error);
    });
  }

  generateSessionId() {
    return (
      "session_" +
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  trackPageView() {
    this.trackEvent("page_view", {
      page: window.location.pathname,
      referrer: document.referrer,
      user_agent: navigator.userAgent,
      screen_resolution: `${screen.width}x${screen.height}`,
      viewport_size: `${window.innerWidth}x${window.innerHeight}`,
    });
  }

  trackEvent(eventName, properties = {}) {
    if (!this.isTracking) return;

    const event = {
      event: eventName,
      properties: {
        ...properties,
        session_id: this.sessionId,
        timestamp: Date.now(),
        page_url: window.location.href,
        page_path: window.location.pathname,
        referrer: document.referrer,
      },
    };

    this.events.push(event);

    // Log in development
    if (window.location.hostname === "localhost") {
      console.log("📊 Analytics Event:", event);
    }

    // In production, send to analytics service
    this.sendEvent(event);
  }

  trackError(error) {
    this.trackEvent("error", {
      message: error.message,
      stack: error.stack,
      line: error.lineno,
      column: error.colno,
      file: error.filename,
    });
  }

  sendEvent(event) {
    // In a real application, send to your analytics service
    // fetch('/analytics', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(event)
    // }).catch(console.error);
  }

  pauseTracking() {
    this.isTracking = false;
  }

  resumeTracking() {
    this.isTracking = true;
  }

  getSessionDuration() {
    return Date.now() - this.startTime;
  }

  destroy() {
    // Send final events
    this.trackEvent("session_end", {
      duration: this.getSessionDuration(),
      events_count: this.events.length,
    });
  }
}

/* ===== PERFORMANCE MODULE ===== */
class PerformanceModule {
  constructor(app) {
    this.app = app;
    this.metrics = new Map();
    this.observer = null;
  }

  async init() {
    this.setupPerformanceObserver();
    this.setupResourceMonitoring();
  }

  setupPerformanceObserver() {
    if ("PerformanceObserver" in window) {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processPerformanceEntry(entry);
        }
      });

      try {
        this.observer.observe({
          entryTypes: ["measure", "mark", "navigation"],
        });
      } catch (error) {
        console.warn("Performance observer not supported:", error);
      }
    }
  }

  setupResourceMonitoring() {
    // Monitor resource loading
    if ("performance" in window) {
      window.addEventListener("load", () => {
        const resources = performance.getEntriesByType("resource");
        this.analyzeResourcePerformance(resources);
      });
    }
  }

  processPerformanceEntry(entry) {
    switch (entry.entryType) {
      case "navigation":
        this.metrics.set("navigation", {
          dns_lookup: entry.domainLookupEnd - entry.domainLookupStart,
          tcp_connect: entry.connectEnd - entry.connectStart,
          request_response: entry.responseEnd - entry.requestStart,
          dom_processing: entry.domComplete - entry.domLoading,
          load_complete: entry.loadEventEnd - entry.loadEventStart,
        });
        break;

      case "measure":
        this.metrics.set(entry.name, entry.duration);
        break;
    }
  }

  analyzeResourcePerformance(resources) {
    const analysis = {
      total_resources: resources.length,
      total_size: 0,
      slow_resources: [],
      resource_types: {},
    };

    resources.forEach((resource) => {
      // Track resource types
      const type = this.getResourceType(resource.name);
      analysis.resource_types[type] = (analysis.resource_types[type] || 0) + 1;

      // Track slow resources (>1s)
      if (resource.duration > 1000) {
        analysis.slow_resources.push({
          name: resource.name,
          duration: resource.duration,
          size: resource.transferSize,
        });
      }

      // Add to total size
      analysis.total_size += resource.transferSize || 0;
    });

    this.metrics.set("resources", analysis);

    // Log performance warnings
    if (analysis.slow_resources.length > 0) {
      console.warn(
        "🐌 Slow loading resources detected:",
        analysis.slow_resources
      );
    }
  }

  getResourceType(url) {
    if (url.includes(".css")) return "css";
    if (url.includes(".js")) return "javascript";
    if (/\.(jpg|jpeg|png|gif|svg|webp)/.test(url)) return "image";
    if (/\.(woff|woff2|ttf|eot)/.test(url)) return "font";
    return "other";
  }

  measurePageLoad() {
    if ("performance" in window && performance.timing) {
      const timing = performance.timing;
      const metrics = {
        page_load_time: timing.loadEventEnd - timing.navigationStart,
        dom_ready_time:
          timing.domContentLoadedEventEnd - timing.navigationStart,
        first_byte_time: timing.responseStart - timing.navigationStart,
      };

      this.app.modules
        .get("analytics")
        ?.trackEvent("page_performance", metrics);
    }
  }

  mark(name) {
    if ("performance" in window && performance.mark) {
      performance.mark(name);
    }
  }

  measure(name, startMark, endMark) {
    if ("performance" in window && performance.measure) {
      performance.measure(name, startMark, endMark);
    }
  }

  startMonitoring() {
    // Monitor memory usage (if available)
    if ("memory" in performance) {
      const logMemory = () => {
        const memory = performance.memory;
        if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.9) {
          console.warn("🚨 High memory usage detected:", {
            used: Math.round(memory.usedJSHeapSize / 1024 / 1024) + "MB",
            limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) + "MB",
          });
        }
      };

      setInterval(logMemory, 30000); // Check every 30 seconds
    }
  }

  getMetrics() {
    return Object.fromEntries(this.metrics);
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

/* ===== GLOBAL FUNCTIONS (for HTML compatibility) ===== */

// Make functions available globally for HTML onclick handlers
window.toggleMobileMenu = () => app.toggleMobileMenu();
window.closeMobileMenu = () => app.closeMobileMenu();
window.scrollToTop = () => app.scrollToTop();
window.scrollToDownload = () => app.scrollToDownload();
window.watchDemo = () => app.openDemo();
window.startFreeTrial = () => app.startFreeTrial();
window.selectPlan = (plan) => app.selectPlan(plan);
window.togglePricing = () => app.togglePricing();
window.toggleFAQ = (element) => app.toggleFAQ(element.closest(".faq-item"));
window.trackDownload = (platform) => app.trackDownload(platform);

/* ===== APPLICATION INITIALIZATION ===== */

// Create global app instance
const app = new StreakyFocusApp();

// Initialize app when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    app.init();
  });
} else {
  app.init();
}

// Handle page unload
window.addEventListener("beforeunload", () => {
  app.destroy();
});

// Development helpers
if (
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
) {
  window.streakyApp = app;
  window.streakyUtils = Utils;
  window.streakyConfig = CONFIG;
  window.streakyState = STATE;

  console.log("🛠️ Development mode detected");
  console.log("🎯 App instance available at: window.streakyApp");
  console.log("🔧 Utilities available at: window.streakyUtils");
  console.log("⚙️ Config available at: window.streakyConfig");
  console.log("📊 State available at: window.streakyState");
}

// Service worker registration
if ("serviceWorker" in navigator && window.location.protocol === "https:") {
  navigator.serviceWorker
    .register("/sw.js")
    .then((registration) => {
      console.log("✅ Service Worker registered:", registration);
      app.modules.get("analytics")?.trackEvent("service_worker", "registered");
    })
    .catch((error) => {
      console.error("❌ Service Worker registration failed:", error);
    });
}

/* ===== EXPORT FOR MODULE SYSTEMS ===== */
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    StreakyFocusApp,
    Utils,
    CONFIG,
    STATE,
  };
}

/* ===== PERFORMANCE MONITORING ===== */

// Monitor and log performance
window.addEventListener("load", () => {
  setTimeout(() => {
    if ("performance" in window) {
      const navigation = performance.getEntriesByType("navigation")[0];
      if (navigation) {
        console.log("📊 Page Performance:", {
          "DOM Ready":
            Math.round(
              navigation.domContentLoadedEventEnd -
                navigation.domContentLoadedEventStart
            ) + "ms",
          "Load Complete":
            Math.round(navigation.loadEventEnd - navigation.loadEventStart) +
            "ms",
          "Total Time":
            Math.round(navigation.loadEventEnd - navigation.requestStart) +
            "ms",
        });
      }
    }
  }, 0);
});

console.log("🚀 Streaky Focus JavaScript loaded successfully!");
console.log("📱 Ready for focus transformation!");
