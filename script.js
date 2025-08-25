/* ===================================================================
   STREAKY FOCUS - COMPLETE JAVASCRIPT (ENHANCED 2025)
   Clean, Mobile-First Responsive Landing Page - Interactive Features
   =================================================================== */

"use strict";

/* ===== GLOBAL CONFIGURATION ===== */
const CONFIG = {
  // Animation settings
  SCROLL_THRESHOLD: 100,
  THROTTLE_DELAY: 16,
  DEBOUNCE_DELAY: 300,

  // Intersection Observer settings
  OBSERVER_THRESHOLD: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
  OBSERVER_ROOT_MARGIN: "0px 0px -50px 0px",

  // Activity ticker settings
  TICKER_SPEED: 5000, // 5 seconds per update
  TICKER_ANIMATION_DURATION: 40000, // 40 seconds for full cycle

  // Toast settings
  TOAST_DURATION: 5000,
  TOAST_FADE_DURATION: 300,

  // Smooth scroll settings
  SCROLL_BEHAVIOR: "smooth",
  SCROLL_OFFSET: 80,

  // Counter animation settings
  COUNTER_ANIMATION_DURATION: 2000,

  // Breakpoints
  MOBILE_BREAKPOINT: 768,
  TABLET_BREAKPOINT: 1024,
  DESKTOP_BREAKPOINT: 1280,

  // Local storage keys
  STORAGE_KEYS: {
    THEME: "streaky_focus_theme",
    VISITED: "streaky_focus_visited",
    PREFERENCES: "streaky_focus_preferences",
    ANALYTICS: "streaky_focus_analytics",
  },

  // Analytics events
  ANALYTICS_EVENTS: {
    PAGE_VIEW: "page_view",
    SECTION_VIEW: "section_view",
    CTA_CLICK: "cta_click",
    DOWNLOAD_CLICK: "download_click",
    MOBILE_MENU: "mobile_menu",
    SCROLL_DEPTH: "scroll_depth",
    TIME_ON_PAGE: "time_on_page",
    ERROR: "error",
  },
};

/* ===== GLOBAL STATE MANAGEMENT ===== */
const AppState = {
  // App status
  isLoaded: false,
  isInitialized: false,
  isMobileMenuOpen: false,

  // Navigation
  currentSection: "home",
  previousSection: null,

  // Scroll tracking
  scrollPosition: 0,
  scrollDirection: "down",
  lastScrollPosition: 0,
  isScrolling: false,
  scrollDepth: 0,
  maxScrollDepth: 0,

  // Device information
  windowWidth: window.innerWidth,
  windowHeight: window.innerHeight,
  isMobile: window.innerWidth <= CONFIG.MOBILE_BREAKPOINT,
  isTablet:
    window.innerWidth <= CONFIG.TABLET_BREAKPOINT &&
    window.innerWidth > CONFIG.MOBILE_BREAKPOINT,
  isDesktop: window.innerWidth > CONFIG.TABLET_BREAKPOINT,

  // Performance tracking
  animations: new Set(),
  observers: new Map(),
  timers: new Map(),
  intervals: new Map(),
  cache: new Map(),

  // Analytics
  sessionStartTime: Date.now(),
  pageViews: 0,
  events: [],

  // User preferences
  preferences: {
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches,
    highContrast: window.matchMedia("(prefers-contrast: high)").matches,
    darkMode: window.matchMedia("(prefers-color-scheme: dark)").matches,
  },
};

/* ===== UTILITY FUNCTIONS ===== */
const Utils = {
  // DOM utilities
  $(selector, context = document) {
    return context.querySelector(selector);
  },

  $$(selector, context = document) {
    return context.querySelectorAll(selector);
  },

  createElement(tag, options = {}) {
    const element = document.createElement(tag);

    if (options.className) element.className = options.className;
    if (options.id) element.id = options.id;
    if (options.innerHTML) element.innerHTML = options.innerHTML;
    if (options.textContent) element.textContent = options.textContent;

    if (options.attributes) {
      Object.entries(options.attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
      });
    }

    if (options.styles) {
      Object.assign(element.style, options.styles);
    }

    if (options.listeners) {
      Object.entries(options.listeners).forEach(([event, handler]) => {
        element.addEventListener(event, handler);
      });
    }

    return element;
  },

  // Performance utilities
  throttle(func, limit = CONFIG.THROTTLE_DELAY) {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  debounce(func, delay = CONFIG.DEBOUNCE_DELAY, immediate = false) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func.apply(this, args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, delay);
      if (callNow) func.apply(this, args);
    };
  },

  // Animation utilities
  animate({
    timing = (t) => t,
    draw,
    duration = 1000,
    delay = 0,
    onComplete = null,
  }) {
    return new Promise((resolve) => {
      const start = performance.now() + delay;

      const animationFrame = requestAnimationFrame(function animate(time) {
        let timeFraction = (time - start) / duration;

        if (timeFraction < 0) {
          requestAnimationFrame(animate);
          return;
        }

        if (timeFraction > 1) timeFraction = 1;

        const progress = timing(timeFraction);
        draw(progress);

        if (timeFraction < 1) {
          const nextFrame = requestAnimationFrame(animate);
          AppState.animations.add(nextFrame);
        } else {
          AppState.animations.delete(animationFrame);
          if (onComplete) onComplete();
          resolve();
        }
      });

      AppState.animations.add(animationFrame);
    });
  },

  // Easing functions
  easing: {
    linear: (t) => t,
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
    elastic: (t) => {
      const c4 = (2 * Math.PI) / 3;
      return t === 0
        ? 0
        : t === 1
        ? 1
        : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
    },
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
    history.replaceState(
      null,
      null,
      hash ? `#${hash}` : window.location.pathname
    );
  },

  // Device detection
  updateDeviceInfo() {
    AppState.windowWidth = window.innerWidth;
    AppState.windowHeight = window.innerHeight;
    AppState.isMobile = window.innerWidth <= CONFIG.MOBILE_BREAKPOINT;
    AppState.isTablet =
      window.innerWidth <= CONFIG.TABLET_BREAKPOINT &&
      window.innerWidth > CONFIG.MOBILE_BREAKPOINT;
    AppState.isDesktop = window.innerWidth > CONFIG.TABLET_BREAKPOINT;
  },

  // Element visibility check
  isElementInViewport(element, threshold = 0.5) {
    const rect = element.getBoundingClientRect();
    const elementHeight = rect.height;
    const elementTop = rect.top;
    const elementBottom = rect.bottom;
    const viewportHeight = window.innerHeight;

    const visibleHeight =
      Math.min(elementBottom, viewportHeight) - Math.max(elementTop, 0);
    return visibleHeight / elementHeight >= threshold;
  },

  // Distance between elements
  getDistance(elem1, elem2) {
    const rect1 = elem1.getBoundingClientRect();
    const rect2 = elem2.getBoundingClientRect();

    const dx = rect1.left + rect1.width / 2 - (rect2.left + rect2.width / 2);
    const dy = rect1.top + rect1.height / 2 - (rect2.top + rect2.height / 2);

    return Math.sqrt(dx * dx + dy * dy);
  },

  // Format numbers
  formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toLocaleString();
  },

  // Generate unique ID
  generateId(prefix = "id") {
    return `${prefix}_${Math.random().toString(36).substring(2, 15)}`;
  },

  // Clamp number between min and max
  clamp(num, min, max) {
    return Math.min(Math.max(num, min), max);
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
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.handleBeforeUnload = this.handleBeforeUnload.bind(this);
  }

  async init() {
    if (this.isInitialized) return;

    try {
      console.log("🚀 Initializing Streaky Focus App...");

      // Initialize core modules
      await this.initializeModules();

      // Setup event listeners
      this.setupEventListeners();

      // Initialize components
      this.initializeComponents();

      // Load user preferences
      this.loadUserPreferences();

      // Start background processes
      this.startBackgroundProcesses();

      // Mark as initialized
      this.isInitialized = true;
      AppState.isLoaded = true;

      console.log("✅ App initialized successfully");

      // Dispatch custom event
      this.dispatchEvent("app:initialized", {
        timestamp: Date.now(),
        modules: Array.from(this.modules.keys()),
        device: {
          mobile: AppState.isMobile,
          tablet: AppState.isTablet,
          desktop: AppState.isDesktop,
        },
      });

      // Track initialization
      this.modules
        .get("analytics")
        ?.trackEvent(CONFIG.ANALYTICS_EVENTS.PAGE_VIEW, {
          page: window.location.pathname,
          referrer: document.referrer,
          timestamp: Date.now(),
        });
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
      { name: "mobile", class: MobileModule },
      { name: "toast", class: ToastModule },
      { name: "analytics", class: AnalyticsModule },
      { name: "performance", class: PerformanceModule },
      { name: "accessibility", class: AccessibilityModule },
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
    window.addEventListener("load", this.handleLoad, { passive: true });
    window.addEventListener(
      "resize",
      Utils.debounce(this.handleResize, CONFIG.DEBOUNCE_DELAY),
      { passive: true }
    );
    window.addEventListener(
      "scroll",
      Utils.throttle(this.handleScroll, CONFIG.THROTTLE_DELAY),
      { passive: true }
    );
    window.addEventListener("hashchange", this.handleHashChange, {
      passive: true,
    });
    window.addEventListener("beforeunload", this.handleBeforeUnload);

    // Document events
    document.addEventListener("DOMContentLoaded", this.handleLoad);
    document.addEventListener("visibilitychange", this.handleVisibilityChange, {
      passive: true,
    });

    // Error handling
    window.addEventListener("error", this.handleGlobalError.bind(this));
    window.addEventListener(
      "unhandledrejection",
      this.handleUnhandledRejection.bind(this)
    );

    // Media query changes
    const mediaQueries = [
      window.matchMedia("(prefers-reduced-motion: reduce)"),
      window.matchMedia("(prefers-contrast: high)"),
      window.matchMedia("(prefers-color-scheme: dark)"),
    ];

    mediaQueries.forEach((mq) => {
      mq.addEventListener("change", this.handleMediaQueryChange.bind(this));
    });
  }

  initializeComponents() {
    // Initialize intersection observers
    this.setupIntersectionObservers();

    // Initialize counters
    this.initializeCounters();

    // Initialize interactive elements
    this.initializeInteractiveElements();

    // Initialize accessibility features
    this.modules.get("accessibility")?.initialize();

    // Initialize mobile-specific features
    this.modules.get("mobile")?.initialize();
  }

  loadUserPreferences() {
    const savedPreferences = Utils.storage.get(
      CONFIG.STORAGE_KEYS.PREFERENCES,
      {}
    );
    AppState.preferences = { ...AppState.preferences, ...savedPreferences };

    // Apply preferences
    this.applyUserPreferences();
  }

  applyUserPreferences() {
    // Apply reduced motion preference
    if (AppState.preferences.reducedMotion) {
      document.documentElement.setAttribute("data-reduced-motion", "true");
    }

    // Apply high contrast preference
    if (AppState.preferences.highContrast) {
      document.documentElement.setAttribute("data-high-contrast", "true");
    }

    // Apply dark mode preference
    if (AppState.preferences.darkMode) {
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }

  startBackgroundProcesses() {
    // Start activity ticker
    this.modules.get("animation")?.startActivityTicker();

    // Start performance monitoring
    this.modules.get("performance")?.startMonitoring();

    // Update current section based on hash
    this.updateCurrentSection();

    // Start analytics session
    this.modules.get("analytics")?.startSession();
  }

  // Event handlers
  handleLoad() {
    console.log("📄 Page loaded");

    // Hide loading screen
    this.hideLoadingScreen();

    // Initialize current section
    this.updateCurrentSection();

    // Start scroll depth tracking
    this.startScrollDepthTracking();

    // Trigger initial animations
    this.modules.get("animation")?.triggerInitialAnimations();
  }

  handleResize() {
    console.log("📐 Window resized");

    Utils.updateDeviceInfo();

    // Close mobile menu if switching to desktop
    if (AppState.isDesktop && AppState.isMobileMenuOpen) {
      this.modules.get("mobile")?.closeMobileMenu();
    }

    // Notify modules of resize
    this.modules.forEach((module) => {
      if (typeof module.handleResize === "function") {
        module.handleResize();
      }
    });

    this.dispatchEvent("app:resize", {
      width: AppState.windowWidth,
      height: AppState.windowHeight,
      isMobile: AppState.isMobile,
      isTablet: AppState.isTablet,
      isDesktop: AppState.isDesktop,
    });
  }

  handleScroll() {
    const currentScrollPosition = window.pageYOffset;
    AppState.scrollDirection =
      currentScrollPosition > AppState.lastScrollPosition ? "down" : "up";
    AppState.scrollPosition = currentScrollPosition;
    AppState.isScrolling = true;

    // Update scroll depth
    const documentHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    AppState.scrollDepth = Math.round(
      (currentScrollPosition / documentHeight) * 100
    );
    AppState.maxScrollDepth = Math.max(
      AppState.maxScrollDepth,
      AppState.scrollDepth
    );

    // Update navigation
    this.modules.get("navigation")?.updateActiveNavigation();

    // Handle scroll animations
    this.modules.get("animation")?.handleScroll();

    // Clear scrolling state
    clearTimeout(AppState.timers.get("scrollEnd"));
    AppState.timers.set(
      "scrollEnd",
      setTimeout(() => {
        AppState.isScrolling = false;
      }, 100)
    );

    this.dispatchEvent("app:scroll", {
      position: AppState.scrollPosition,
      direction: AppState.scrollDirection,
      depth: AppState.scrollDepth,
    });

    AppState.lastScrollPosition = currentScrollPosition;
  }

  handleHashChange() {
    console.log("🔗 Hash changed to:", Utils.getHash());
    this.updateCurrentSection();
    this.modules.get("scroll")?.scrollToSection(Utils.getHash());
  }

  handleVisibilityChange() {
    if (document.hidden) {
      console.log("👁️ Page hidden");
      this.modules.get("analytics")?.pauseTracking();
      this.pauseBackgroundProcesses();
    } else {
      console.log("👁️ Page visible");
      this.modules.get("analytics")?.resumeTracking();
      this.resumeBackgroundProcesses();
    }
  }

  handleBeforeUnload() {
    console.log("👋 Page unloading");

    // Save user preferences
    Utils.storage.set(CONFIG.STORAGE_KEYS.PREFERENCES, AppState.preferences);

    // Track session end
    this.modules.get("analytics")?.trackSessionEnd();

    // Cleanup
    this.cleanup();
  }

  handleGlobalError(event) {
    console.error("🚨 Global error:", event.error);
    this.modules.get("analytics")?.trackEvent(CONFIG.ANALYTICS_EVENTS.ERROR, {
      message: event.error?.message || "Unknown error",
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack,
    });
  }

  handleUnhandledRejection(event) {
    console.error("🚨 Unhandled promise rejection:", event.reason);
    this.modules.get("analytics")?.trackEvent(CONFIG.ANALYTICS_EVENTS.ERROR, {
      message: event.reason?.message || "Unhandled promise rejection",
      type: "promise_rejection",
      reason: String(event.reason),
    });
  }

  handleMediaQueryChange(event) {
    console.log("🎨 Media query changed:", event.media, event.matches);

    // Update preferences
    if (event.media.includes("prefers-reduced-motion")) {
      AppState.preferences.reducedMotion = event.matches;
    } else if (event.media.includes("prefers-contrast")) {
      AppState.preferences.highContrast = event.matches;
    } else if (event.media.includes("prefers-color-scheme")) {
      AppState.preferences.darkMode = event.matches;
    }

    this.applyUserPreferences();
  }

  // Component initialization methods
  setupIntersectionObservers() {
    // Section observer for navigation updates
    const sectionObserver = Utils.createObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            const sectionId = entry.target.id;
            if (sectionId && sectionId !== AppState.currentSection) {
              this.updateCurrentSection(sectionId);
            }
          }
        });
      },
      { threshold: [0.5, 0.8] }
    );

    // Observe all sections
    Utils.$$("section[id]").forEach((section) => {
      sectionObserver.observe(section);
    });

    AppState.observers.set("sections", sectionObserver);

    // Animation observer for scroll animations
    const animationObserver = Utils.createObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.modules.get("animation")?.animateElement(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    // Observe animation elements
    Utils.$$(".animate-on-scroll").forEach((element) => {
      animationObserver.observe(element);
    });

    AppState.observers.set("animations", animationObserver);
  }

  initializeCounters() {
    const counterElements = Utils.$$("[data-count]");

    const counterObserver = Utils.createObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.8) {
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

    AppState.observers.set("counters", counterObserver);
  }

  initializeInteractiveElements() {
    // Download buttons
    Utils.$$(".download-button").forEach((button) => {
      button.addEventListener("click", (e) => {
        e.preventDefault();
        const platform = button.classList.contains("ios") ? "ios" : "android";
        this.trackDownload(platform);
      });
    });

    // CTA buttons
    Utils.$$(".cta-button").forEach((button) => {
      button.addEventListener("click", this.handleCTAClick.bind(this));
    });

    // Back to top button
    const backToTopButton = Utils.$(".back-to-top-button");
    if (backToTopButton) {
      backToTopButton.addEventListener("click", () => {
        this.scrollToTop();
        this.modules.get("analytics")?.trackEvent("back_to_top_click");
      });
    }
  }

  // UI Methods
  hideLoadingScreen() {
    const loadingScreen = Utils.$("#loading-screen");
    if (!loadingScreen) return;

    Utils.animate({
      duration: 800,
      timing: Utils.easing.easeOut,
      draw: (progress) => {
        loadingScreen.style.opacity = 1 - progress;
        loadingScreen.style.transform = `scale(${1 + progress * 0.1})`;
      },
      onComplete: () => {
        loadingScreen.style.display = "none";
        loadingScreen.classList.add("hidden");
      },
    });
  }

  updateCurrentSection(sectionId = null) {
    if (!sectionId) {
      sectionId = this.getCurrentSection();
    }

    if (sectionId === AppState.currentSection) return;

    AppState.previousSection = AppState.currentSection;
    AppState.currentSection = sectionId;

    // Update navigation
    this.modules.get("navigation")?.updateActiveNavigation(sectionId);

    // Update URL hash
    Utils.setHash(sectionId);

    // Track section view
    this.modules
      .get("analytics")
      ?.trackEvent(CONFIG.ANALYTICS_EVENTS.SECTION_VIEW, {
        section: sectionId,
        previousSection: AppState.previousSection,
        timestamp: Date.now(),
      });

    console.log("📍 Current section:", sectionId);
  }

  getCurrentSection() {
    const sections = Utils.$$("section[id]");
    const scrollPosition = window.pageYOffset + 100;

    for (let i = sections.length - 1; i >= 0; i--) {
      const section = sections[i];
      const sectionTop = section.offsetTop;

      if (scrollPosition >= sectionTop) {
        return section.id;
      }
    }

    return "home";
  }

  startScrollDepthTracking() {
    const milestones = [25, 50, 75, 90, 100];
    const tracked = new Set();

    const trackScrollDepth = () => {
      milestones.forEach((milestone) => {
        if (AppState.scrollDepth >= milestone && !tracked.has(milestone)) {
          tracked.add(milestone);
          this.modules
            .get("analytics")
            ?.trackEvent(CONFIG.ANALYTICS_EVENTS.SCROLL_DEPTH, {
              depth: milestone,
              timestamp: Date.now(),
            });
        }
      });
    };

    // Track immediately and on scroll
    trackScrollDepth();
    window.addEventListener("scroll", Utils.throttle(trackScrollDepth, 1000), {
      passive: true,
    });
  }

  pauseBackgroundProcesses() {
    // Pause animations
    AppState.animations.forEach((id) => {
      cancelAnimationFrame(id);
    });

    // Pause intervals
    AppState.intervals.forEach((id) => {
      clearInterval(id);
    });
  }

  resumeBackgroundProcesses() {
    // Resume activity ticker
    this.modules.get("animation")?.startActivityTicker();
  }

  // Interactive Methods
  handleCTAClick(event) {
    const button = event.currentTarget;
    const action = button.getAttribute("data-action") || "download";
    const text = button.textContent?.trim() || "Unknown";

    this.modules
      .get("analytics")
      ?.trackEvent(CONFIG.ANALYTICS_EVENTS.CTA_CLICK, {
        action,
        text,
        section: AppState.currentSection,
        timestamp: Date.now(),
      });

    switch (action) {
      case "download":
        this.scrollToDownload();
        break;
      case "demo":
        this.showDemo();
        break;
      case "features":
        this.scrollToSection("features");
        break;
      default:
        this.scrollToDownload();
    }
  }

  // Navigation Methods
  scrollToTop() {
    this.modules.get("scroll")?.scrollToPosition(0);
  }

  scrollToDownload() {
    this.modules.get("scroll")?.scrollToSection("download");
  }

  scrollToSection(sectionId) {
    this.modules.get("scroll")?.scrollToSection(sectionId);
  }

  showDemo() {
    this.modules.get("toast")?.show({
      type: "info",
      message:
        "🎬 Demo video coming soon! Download the app to see it in action.",
      duration: 4000,
    });
  }

  // Analytics Methods
  trackDownload(platform) {
    this.modules
      .get("analytics")
      ?.trackEvent(CONFIG.ANALYTICS_EVENTS.DOWNLOAD_CLICK, {
        platform,
        section: AppState.currentSection,
        timestamp: Date.now(),
      });

    // Show confirmation toast
    this.modules.get("toast")?.show({
      type: "success",
      message: `📱 Redirecting to ${
        platform === "ios" ? "App Store" : "Google Play"
      }...`,
      duration: 3000,
    });

    // Simulate redirect delay
    setTimeout(() => {
      if (platform === "ios") {
        window.open(
          "https://apps.apple.com/app/streaky-focus",
          "_blank",
          "noopener,noreferrer"
        );
      } else {
        window.open(
          "https://play.google.com/store/apps/details?id=com.streakyfocus",
          "_blank",
          "noopener,noreferrer"
        );
      }
    }, 1000);
  }

  // Utility Methods
  dispatchEvent(type, detail = {}) {
    const event = new CustomEvent(type, {
      detail: {
        ...detail,
        timestamp: Date.now(),
        source: "StreakyFocusApp",
      },
    });
    document.dispatchEvent(event);
  }

  handleError(message, error = null) {
    console.error("🚨", message, error);

    this.modules.get("toast")?.show({
      type: "error",
      message: "Something went wrong. Please refresh the page.",
      duration: 5000,
    });

    this.modules.get("analytics")?.trackEvent(CONFIG.ANALYTICS_EVENTS.ERROR, {
      message,
      error: error?.message || "Unknown error",
      stack: error?.stack,
    });
  }

  // Cleanup
  cleanup() {
    console.log("🧹 Cleaning up...");

    // Clear all timers and intervals
    AppState.timers.forEach((timer) => clearTimeout(timer));
    AppState.timers.clear();

    AppState.intervals.forEach((interval) => clearInterval(interval));
    AppState.intervals.clear();

    // Cancel all animations
    AppState.animations.forEach((id) => cancelAnimationFrame(id));
    AppState.animations.clear();

    // Disconnect all observers
    AppState.observers.forEach((observer) => observer.disconnect());
    AppState.observers.clear();

    // Destroy modules
    this.modules.forEach((module) => {
      if (typeof module.destroy === "function") {
        module.destroy();
      }
    });
    this.modules.clear();

    // Reset state
    this.isInitialized = false;
    AppState.isLoaded = false;
  }

  destroy() {
    this.cleanup();
  }
}

/* ===== NAVIGATION MODULE ===== */
class NavigationModule {
  constructor(app) {
    this.app = app;
    this.currentSection = "home";
    this.navItems = new Map();
  }

  async init() {
    this.setupSmoothScroll();
    this.cacheNavItems();
    console.log("🧭 Navigation module initialized");
  }

  cacheNavItems() {
    Utils.$$(".nav-item, .mobile-nav-item").forEach((item) => {
      const href = item.getAttribute("href");
      const sectionId = href?.substring(1);
      if (sectionId) {
        if (!this.navItems.has(sectionId)) {
          this.navItems.set(sectionId, []);
        }
        this.navItems.get(sectionId).push(item);
      }
    });
  }

  setupSmoothScroll() {
    Utils.$$('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const targetId = link.getAttribute("href").slice(1);
        if (targetId) {
          this.app.modules.get("scroll")?.scrollToSection(targetId);
        }
      });
    });
  }

  updateActiveNavigation(sectionId) {
    if (sectionId === this.currentSection) return;

    // Remove active class from all nav items
    Utils.$$(".nav-item, .mobile-nav-item").forEach((item) => {
      item.classList.remove("active");
      item.removeAttribute("aria-current");
    });

    // Add active class to current section nav items
    const activeItems = this.navItems.get(sectionId) || [];
    activeItems.forEach((item) => {
      item.classList.add("active");
      item.setAttribute("aria-current", "page");
    });

    this.currentSection = sectionId;

    console.log("🧭 Navigation updated:", sectionId);
  }

  destroy() {
    this.navItems.clear();
  }
}

/* ===== SCROLL MODULE ===== */
class ScrollModule {
  constructor(app) {
    this.app = app;
  }

  async init() {
    console.log("📜 Scroll module initialized");
  }

  scrollToSection(sectionId) {
    const section = Utils.$(`#${sectionId}`);
    if (!section) {
      console.warn("⚠️ Section not found:", sectionId);
      return;
    }

    const headerHeight = Utils.$(".main-header")?.offsetHeight || 0;
    const targetPosition =
      section.offsetTop - headerHeight - CONFIG.SCROLL_OFFSET;

    this.scrollToPosition(Math.max(0, targetPosition));
  }

  scrollToPosition(position) {
    if (AppState.preferences.reducedMotion) {
      window.scrollTo(0, position);
      return;
    }

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
}

/* ===== ANIMATION MODULE ===== */
class AnimationModule {
  constructor(app) {
    this.app = app;
    this.animatedElements = new Set();
    this.counters = new Set();
    this.tickerInterval = null;
    this.tickerItems = [
      { icon: "🔥", text: "Alex just completed a 127-day focus streak!" },
      { icon: "📱", text: "Sarah reduced phone usage by 78% in 30 days" },
      { icon: "⚡", text: "Mike earned 1000 focus coins today" },
      { icon: "🏆", text: 'Emma unlocked "Focus Master" achievement' },
      { icon: "🎯", text: "Jordan completed 100 focus sessions this month" },
      { icon: "💎", text: "Lisa joined the 1000+ focus hours club" },
      { icon: "🚀", text: "Chris reached level 25 in focus ranking" },
      { icon: "🌟", text: "Taylor maintained perfect weekly focus streak" },
      { icon: "⭐", text: "Maria achieved 500+ hours of deep work" },
      { icon: "🎊", text: "David unlocked all productivity achievements" },
    ];
    this.currentTickerIndex = 0;
  }

  async init() {
    this.setupFloatingElements();
    console.log("✨ Animation module initialized");
  }

  setupFloatingElements() {
    Utils.$$(".floating-element").forEach((element, index) => {
      if (AppState.preferences.reducedMotion) {
        element.style.animation = "none";
        return;
      }

      const delay = index * 0.5;
      const duration = 20 + Math.random() * 10; // 20-30 seconds

      element.style.animationDelay = `${delay}s`;
      element.style.animationDuration = `${duration}s`;
    });
  }

  triggerInitialAnimations() {
    // Hero title animation
    const heroTitle = Utils.$(".hero-title");
    if (heroTitle && !AppState.preferences.reducedMotion) {
      Utils.animate({
        duration: 1200,
        timing: Utils.easing.easeOut,
        delay: 300,
        draw: (progress) => {
          heroTitle.style.opacity = progress;
          heroTitle.style.transform = `translateY(${50 * (1 - progress)}px)`;
        },
      });
    }

    // Hero subtitle animation
    const heroSubtitle = Utils.$(".hero-subtitle");
    if (heroSubtitle && !AppState.preferences.reducedMotion) {
      Utils.animate({
        duration: 1000,
        timing: Utils.easing.easeOut,
        delay: 800,
        draw: (progress) => {
          heroSubtitle.style.opacity = progress;
          heroSubtitle.style.transform = `translateY(${30 * (1 - progress)}px)`;
        },
      });
    }

    // Hero CTA animation
    const heroCTA = Utils.$(".hero-cta");
    if (heroCTA && !AppState.preferences.reducedMotion) {
      Utils.animate({
        duration: 1000,
        timing: Utils.easing.easeOut,
        delay: 1200,
        draw: (progress) => {
          heroCTA.style.opacity = progress;
          heroCTA.style.transform = `translateY(${
            40 * (1 - progress)
          }px) scale(${0.95 + 0.05 * progress})`;
        },
      });
    }
  }

  animateElement(element) {
    if (
      this.animatedElements.has(element) ||
      AppState.preferences.reducedMotion
    ) {
      return;
    }

    this.animatedElements.add(element);
    element.classList.add("animated");

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
    if (element.matches(".approach-card, .testimonial-card")) return "slideIn";
    if (element.matches(".feature-card, .timeline-item")) return "fadeUp";
    return "fadeIn";
  }

  animateFadeUp(element) {
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
    const rect = element.getBoundingClientRect();
    const direction = rect.left < window.innerWidth / 2 ? -50 : 50;

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
    const duration = CONFIG.COUNTER_ANIMATION_DURATION;

    Utils.animate({
      duration,
      timing: Utils.easing.easeOut,
      draw: (progress) => {
        const currentValue = Math.floor(target * progress);
        element.textContent = Utils.formatNumber(currentValue);
      },
      onComplete: () => {
        element.textContent = Utils.formatNumber(target);
      },
    });
  }

  startActivityTicker() {
    const ticker = Utils.$("#activity-ticker");
    if (!ticker) return;

    this.updateTicker();

    this.tickerInterval = setInterval(() => {
      this.updateTicker();
    }, CONFIG.TICKER_SPEED);

    AppState.intervals.set("activityTicker", this.tickerInterval);
  }

  updateTicker() {
    const ticker = Utils.$("#activity-ticker");
    if (!ticker) return;

    // Create new ticker items
    const items = [];
    for (let i = 0; i < 4; i++) {
      const itemIndex = (this.currentTickerIndex + i) % this.tickerItems.length;
      const item = this.tickerItems[itemIndex];

      const tickerItem = Utils.createElement("div", {
        className: "ticker-item",
        innerHTML: `
          <span class="ticker-icon">${item.icon}</span>
          <span class="ticker-text">${item.text}</span>
        `,
      });

      items.push(tickerItem);
    }

    // Smooth transition
    if (!AppState.preferences.reducedMotion) {
      ticker.style.opacity = "0.5";
      ticker.style.transform = "translateY(10px)";
    }

    setTimeout(
      () => {
        // Replace content
        ticker.innerHTML = "";
        items.forEach((item) => ticker.appendChild(item));

        if (!AppState.preferences.reducedMotion) {
          ticker.style.opacity = "1";
          ticker.style.transform = "translateY(0)";
        }
      },
      AppState.preferences.reducedMotion ? 0 : 200
    );

    this.currentTickerIndex =
      (this.currentTickerIndex + 1) % this.tickerItems.length;
  }

  handleScroll() {
    // Handle scroll-based animations if needed
    const scrollProgress =
      AppState.scrollPosition /
      (document.documentElement.scrollHeight - window.innerHeight);

    // Parallax effect for floating elements (if not reduced motion)
    if (!AppState.preferences.reducedMotion) {
      Utils.$$(".floating-element").forEach((element, index) => {
        const speed = 0.5 + (index % 3) * 0.2;
        const yPos = -(AppState.scrollPosition * speed);
        element.style.transform += ` translateY(${yPos}px)`;
      });
    }
  }

  destroy() {
    if (this.tickerInterval) {
      clearInterval(this.tickerInterval);
    }
    this.animatedElements.clear();
    this.counters.clear();
  }
}

/* ===== MOBILE MODULE ===== */
class MobileModule {
  constructor(app) {
    this.app = app;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.isMenuOpen = false;
  }

  async init() {
    this.setupMobileMenu();
    this.setupTouchGestures();
    console.log("📱 Mobile module initialized");
  }

  initialize() {
    // Additional mobile-specific initialization
    this.optimizeForMobile();
  }

  setupMobileMenu() {
    const toggle = Utils.$("#mobile-menu-toggle");
    const overlay = Utils.$("#mobile-menu-overlay");
    const backdrop = Utils.$(".mobile-menu-backdrop");
    const closeButton = Utils.$(".mobile-close");

    if (toggle) {
      toggle.addEventListener("click", (e) => {
        e.preventDefault();
        this.toggleMobileMenu();
      });
    }

    if (backdrop) {
      backdrop.addEventListener("click", () => {
        this.closeMobileMenu();
      });
    }

    if (closeButton) {
      closeButton.addEventListener("click", () => {
        this.closeMobileMenu();
      });
    }

    // Close menu when clicking nav links
    Utils.$$(".mobile-nav-item").forEach((link) => {
      link.addEventListener("click", () => {
        this.closeMobileMenu();
      });
    });

    // Handle escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isMenuOpen) {
        this.closeMobileMenu();
      }
    });
  }

  setupTouchGestures() {
    // Add touch gesture support for mobile menu
    document.addEventListener("touchstart", this.handleTouchStart.bind(this), {
      passive: true,
    });
    document.addEventListener("touchmove", this.handleTouchMove.bind(this), {
      passive: false,
    });
    document.addEventListener("touchend", this.handleTouchEnd.bind(this), {
      passive: true,
    });
  }

  handleTouchStart(e) {
    this.touchStartX = e.touches[0].clientX;
    this.touchStartY = e.touches[0].clientY;
  }

  handleTouchMove(e) {
    if (!this.touchStartX || !this.touchStartY) return;

    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    const deltaX = touchX - this.touchStartX;
    const deltaY = touchY - this.touchStartY;

    // Prevent vertical scrolling when swiping horizontally
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      e.preventDefault();
    }
  }

  handleTouchEnd(e) {
    if (!this.touchStartX || !this.touchStartY) return;

    const touchX = e.changedTouches[0].clientX;
    const touchY = e.changedTouches[0].clientY;
    const deltaX = touchX - this.touchStartX;
    const deltaY = touchY - this.touchStartY;

    // Swipe gestures
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 100) {
      if (deltaX > 0) {
        // Swipe right - close menu if open
        if (this.isMenuOpen) {
          this.closeMobileMenu();
        }
      } else {
        // Swipe left - open menu if closed and near right edge
        if (!this.isMenuOpen && this.touchStartX > window.innerWidth - 50) {
          this.openMobileMenu();
        }
      }
    }

    this.touchStartX = 0;
    this.touchStartY = 0;
  }

  toggleMobileMenu() {
    if (this.isMenuOpen) {
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
      this.isMenuOpen = true;
      AppState.isMobileMenuOpen = true;

      // Focus management
      const firstFocusable = overlay.querySelector(
        'button, a, [tabindex]:not([tabindex="-1"])'
      );
      if (firstFocusable) {
        setTimeout(() => firstFocusable.focus(), 100);
      }

      this.app.modules
        .get("analytics")
        ?.trackEvent(CONFIG.ANALYTICS_EVENTS.MOBILE_MENU, {
          action: "open",
          method: "manual",
        });
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
      this.isMenuOpen = false;
      AppState.isMobileMenuOpen = false;

      this.app.modules
        .get("analytics")
        ?.trackEvent(CONFIG.ANALYTICS_EVENTS.MOBILE_MENU, {
          action: "close",
        });
    }
  }

  optimizeForMobile() {
    // Add mobile-specific optimizations
    if (AppState.isMobile) {
      // Prevent zoom on input focus
      Utils.$$("input, select, textarea").forEach((input) => {
        input.addEventListener("focus", () => {
          const viewport = Utils.$('meta[name="viewport"]');
          if (viewport) {
            viewport.setAttribute(
              "content",
              viewport.getAttribute("content") + ", user-scalable=no"
            );
          }
        });

        input.addEventListener("blur", () => {
          const viewport = Utils.$('meta[name="viewport"]');
          if (viewport) {
            viewport.setAttribute(
              "content",
              viewport.getAttribute("content").replace(", user-scalable=no", "")
            );
          }
        });
      });

      // Add touch feedback for buttons
      Utils.$$("button, .cta-button, .download-button").forEach((button) => {
        button.addEventListener(
          "touchstart",
          () => {
            button.style.transform = "scale(0.98)";
          },
          { passive: true }
        );

        button.addEventListener(
          "touchend",
          () => {
            button.style.transform = "";
          },
          { passive: true }
        );
      });
    }
  }

  handleResize() {
    // Close mobile menu if switching to desktop
    if (AppState.isDesktop && this.isMenuOpen) {
      this.closeMobileMenu();
    }
  }

  destroy() {
    this.isMenuOpen = false;
    AppState.isMobileMenuOpen = false;
    document.body.style.overflow = "";
  }
}

/* ===== TOAST MODULE ===== */
class ToastModule {
  constructor(app) {
    this.app = app;
    this.container = null;
    this.toasts = new Set();
    this.maxToasts = 5;
  }

  async init() {
    this.createContainer();
    console.log("🍞 Toast module initialized");
  }

  createContainer() {
    this.container = Utils.$("#toast-container");

    if (!this.container) {
      this.container = Utils.createElement("div", {
        className: "toast-container",
        id: "toast-container",
        attributes: {
          "aria-live": "polite",
          "aria-atomic": "true",
        },
      });
      document.body.appendChild(this.container);
    }
  }

  show({
    type = "info",
    message,
    duration = CONFIG.TOAST_DURATION,
    persistent = false,
  }) {
    // Limit number of toasts
    if (this.toasts.size >= this.maxToasts) {
      const oldestToast = this.toasts.values().next().value;
      if (oldestToast) {
        this.remove(oldestToast);
      }
    }

    const toast = this.createToast(type, message, persistent);

    this.container.appendChild(toast);
    this.toasts.add(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.style.transform = "translateX(0)";
      toast.style.opacity = "1";
    });

    // Auto remove (unless persistent)
    if (!persistent && duration > 0) {
      const timer = setTimeout(() => {
        this.remove(toast);
      }, duration);

      toast.setAttribute("data-timer", timer);
    }

    return toast;
  }

  createToast(type, message, persistent) {
    const toastId = Utils.generateId("toast");

    const icons = {
      success: "✅",
      error: "❌",
      warning: "⚠️",
      info: "ℹ️",
    };

    const toast = Utils.createElement("div", {
      className: `toast ${type}`,
      id: toastId,
      attributes: {
        role: "alert",
        "aria-live": type === "error" ? "assertive" : "polite",
      },
      innerHTML: `
        <span class="toast-icon" aria-hidden="true">${
          icons[type] || icons.info
        }</span>
        <span class="toast-message">${message}</span>
        ${
          !persistent
            ? '<button class="toast-close" aria-label="Close notification" type="button">×</button>'
            : ""
        }
      `,
    });

    // Setup close button
    if (!persistent) {
      const closeButton = toast.querySelector(".toast-close");
      if (closeButton) {
        closeButton.addEventListener("click", () => {
          this.remove(toast);
        });
      }
    }

    return toast;
  }

  remove(toast) {
    if (!this.toasts.has(toast)) return;

    // Clear timer
    const timer = toast.getAttribute("data-timer");
    if (timer) {
      clearTimeout(parseInt(timer));
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
    this.batchSize = 10;
    this.flushInterval = 30000; // 30 seconds
  }

  async init() {
    this.setupPerformanceTracking();
    this.startBatchFlushing();
    console.log("📊 Analytics module initialized");
  }

  generateSessionId() {
    return (
      "session_" +
      Date.now() +
      "_" +
      Math.random().toString(36).substring(2, 15)
    );
  }

  setupPerformanceTracking() {
    // Track page load performance
    if ("performance" in window) {
      window.addEventListener("load", () => {
        setTimeout(() => {
          const navigation = performance.getEntriesByType("navigation")[0];
          if (navigation) {
            this.trackEvent("page_performance", {
              loadTime: Math.round(
                navigation.loadEventEnd - navigation.loadEventStart
              ),
              domReady: Math.round(
                navigation.domContentLoadedEventEnd -
                  navigation.domContentLoadedEventStart
              ),
              totalTime: Math.round(
                navigation.loadEventEnd - navigation.requestStart
              ),
              transferSize: navigation.transferSize,
              encodedBodySize: navigation.encodedBodySize,
            });
          }
        }, 0);
      });
    }
  }

  startSession() {
    this.trackEvent(CONFIG.ANALYTICS_EVENTS.PAGE_VIEW, {
      page: window.location.pathname,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onlineStatus: navigator.onLine,
      devicePixelRatio: window.devicePixelRatio || 1,
    });
  }

  trackEvent(eventName, properties = {}) {
    if (!this.isTracking) return;

    const event = {
      id: Utils.generateId("event"),
      event: eventName,
      properties: {
        ...properties,
        sessionId: this.sessionId,
        timestamp: Date.now(),
        pageUrl: window.location.href,
        pagePath: window.location.pathname,
        pageTitle: document.title,
        referrer: document.referrer,
        scrollDepth: AppState.scrollDepth,
        timeOnPage: Date.now() - this.startTime,
        currentSection: AppState.currentSection,
        deviceInfo: {
          isMobile: AppState.isMobile,
          isTablet: AppState.isTablet,
          isDesktop: AppState.isDesktop,
          viewportWidth: AppState.windowWidth,
          viewportHeight: AppState.windowHeight,
        },
      },
    };

    this.events.push(event);

    // Log in development
    if (this.isDevelopment()) {
      console.log("📊 Analytics Event:", event);
    }

    // Auto-flush if batch is full
    if (this.events.length >= this.batchSize) {
      this.flushEvents();
    }
  }

  startBatchFlushing() {
    const flushTimer = setInterval(() => {
      this.flushEvents();
    }, this.flushInterval);

    AppState.intervals.set("analyticsFlush", flushTimer);
  }

  flushEvents() {
    if (this.events.length === 0) return;

    const eventsToSend = [...this.events];
    this.events = [];

    // In production, send to analytics service
    if (!this.isDevelopment()) {
      this.sendEvents(eventsToSend);
    }
  }

  sendEvents(events) {
    // Simulate sending to analytics service
    // In real implementation, this would be an API call
    try {
      // fetch('/api/analytics', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ events })
      // }).catch(console.error);

      console.log("📤 Sending analytics events:", events.length);
    } catch (error) {
      console.error("Failed to send analytics events:", error);
      // Re-add events to queue for retry
      this.events.unshift(...events);
    }
  }

  trackSessionEnd() {
    const sessionDuration = Date.now() - this.startTime;

    this.trackEvent(CONFIG.ANALYTICS_EVENTS.TIME_ON_PAGE, {
      duration: sessionDuration,
      eventsCount: this.events.length,
      maxScrollDepth: AppState.maxScrollDepth,
      sectionsVisited: AppState.previousSection ? 2 : 1,
    });

    // Flush remaining events
    this.flushEvents();
  }

  pauseTracking() {
    this.isTracking = false;
    console.log("⏸️ Analytics tracking paused");
  }

  resumeTracking() {
    this.isTracking = true;
    console.log("▶️ Analytics tracking resumed");
  }

  isDevelopment() {
    return (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname.includes("dev") ||
      window.location.protocol === "file:"
    );
  }

  getSessionDuration() {
    return Date.now() - this.startTime;
  }

  destroy() {
    this.trackSessionEnd();
  }
}

/* ===== PERFORMANCE MODULE ===== */
class PerformanceModule {
  constructor(app) {
    this.app = app;
    this.metrics = new Map();
    this.observer = null;
    this.memoryCheckInterval = null;
  }

  async init() {
    this.setupPerformanceObserver();
    this.setupResourceMonitoring();
    console.log("⚡ Performance module initialized");
  }

  setupPerformanceObserver() {
    if ("PerformanceObserver" in window) {
      try {
        this.observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.processPerformanceEntry(entry);
          }
        });

        this.observer.observe({
          entryTypes: ["measure", "mark", "navigation", "paint"],
        });
      } catch (error) {
        console.warn("Performance observer not supported:", error);
      }
    }
  }

  setupResourceMonitoring() {
    if ("performance" in window) {
      window.addEventListener("load", () => {
        setTimeout(() => {
          const resources = performance.getEntriesByType("resource");
          this.analyzeResourcePerformance(resources);
        }, 1000);
      });
    }
  }

  startMonitoring() {
    // Monitor memory usage
    if ("memory" in performance) {
      this.memoryCheckInterval = setInterval(() => {
        this.checkMemoryUsage();
      }, 30000); // Check every 30 seconds

      AppState.intervals.set("memoryCheck", this.memoryCheckInterval);
    }

    // Monitor frame rate
    this.startFPSMonitoring();
  }

  checkMemoryUsage() {
    if ("memory" in performance) {
      const memory = performance.memory;
      const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
      const limitMB = Math.round(memory.jsHeapSizeLimit / 1024 / 1024);
      const usagePercent =
        (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;

      this.metrics.set("memory", {
        used: usedMB,
        limit: limitMB,
        percentage: usagePercent,
      });

      if (usagePercent > 90) {
        console.warn("🚨 High memory usage detected:", {
          used: `${usedMB}MB`,
          limit: `${limitMB}MB`,
          percentage: `${usagePercent.toFixed(1)}%`,
        });

        this.app.modules.get("analytics")?.trackEvent("performance_warning", {
          type: "memory",
          usage: usagePercent,
          usedMB,
          limitMB,
        });
      }
    }
  }

  startFPSMonitoring() {
    let lastTime = performance.now();
    let frameCount = 0;

    const measureFPS = (currentTime) => {
      frameCount++;

      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));

        this.metrics.set("fps", fps);

        if (fps < 30) {
          console.warn("🚨 Low FPS detected:", fps);
          this.app.modules.get("analytics")?.trackEvent("performance_warning", {
            type: "fps",
            value: fps,
          });
        }

        frameCount = 0;
        lastTime = currentTime;
      }

      requestAnimationFrame(measureFPS);
    };

    requestAnimationFrame(measureFPS);
  }

  processPerformanceEntry(entry) {
    switch (entry.entryType) {
      case "navigation":
        this.metrics.set("navigation", {
          dnsLookup: entry.domainLookupEnd - entry.domainLookupStart,
          tcpConnect: entry.connectEnd - entry.connectStart,
          requestResponse: entry.responseEnd - entry.requestStart,
          domProcessing: entry.domComplete - entry.domLoading,
          loadComplete: entry.loadEventEnd - entry.loadEventStart,
        });
        break;

      case "paint":
        this.metrics.set(entry.name, entry.startTime);
        break;

      case "measure":
        this.metrics.set(entry.name, entry.duration);
        break;
    }
  }

  analyzeResourcePerformance(resources) {
    const analysis = {
      totalResources: resources.length,
      totalSize: 0,
      slowResources: [],
      resourceTypes: {},
      cacheEfficiency: { hits: 0, misses: 0 },
    };

    resources.forEach((resource) => {
      // Skip data URIs and blob URLs
      if (
        resource.name.startsWith("data:") ||
        resource.name.startsWith("blob:")
      ) {
        return;
      }

      // Track resource types
      const type = this.getResourceType(resource.name);
      analysis.resourceTypes[type] = (analysis.resourceTypes[type] || 0) + 1;

      // Track slow resources (>2s)
      if (resource.duration > 2000) {
        analysis.slowResources.push({
          name: resource.name,
          duration: Math.round(resource.duration),
          size: resource.transferSize,
          type,
        });
      }

      // Track cache efficiency
      if (resource.transferSize === 0 && resource.decodedBodySize > 0) {
        analysis.cacheEfficiency.hits++;
      } else {
        analysis.cacheEfficiency.misses++;
      }

      // Add to total size
      analysis.totalSize += resource.transferSize || 0;
    });

    this.metrics.set("resources", analysis);

    // Log performance warnings
    if (analysis.slowResources.length > 0) {
      console.warn(
        "🐌 Slow loading resources detected:",
        analysis.slowResources
      );
    }

    // Track in analytics
    this.app.modules
      .get("analytics")
      ?.trackEvent("resource_performance", analysis);
  }

  getResourceType(url) {
    const extension = url.split(".").pop()?.split("?")[0]?.toLowerCase();

    switch (extension) {
      case "css":
        return "stylesheet";
      case "js":
        return "script";
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "svg":
      case "webp":
      case "avif":
        return "image";
      case "woff":
      case "woff2":
      case "ttf":
      case "eot":
        return "font";
      case "json":
        return "xhr";
      default:
        return "other";
    }
  }

  mark(name) {
    if ("performance" in window && performance.mark) {
      performance.mark(name);
    }
  }

  measure(name, startMark, endMark) {
    if ("performance" in window && performance.measure) {
      try {
        performance.measure(name, startMark, endMark);
      } catch (error) {
        console.warn("Failed to measure performance:", error);
      }
    }
  }

  getMetrics() {
    return Object.fromEntries(this.metrics);
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }

    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
    }
  }
}

/* ===== ACCESSIBILITY MODULE ===== */
class AccessibilityModule {
  constructor(app) {
    this.app = app;
    this.focusableElements =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    this.trapFocus = null;
  }

  async init() {
    console.log("♿ Accessibility module initialized");
  }

  initialize() {
    this.setupKeyboardNavigation();
    this.setupFocusManagement();
    this.setupARIAAttributes();
    this.announcePageReady();
  }

  setupKeyboardNavigation() {
    // Global keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      // Skip links with Alt + S
      if (e.altKey && e.key === "s") {
        e.preventDefault();
        const skipLink = Utils.$(".skip-link");
        if (skipLink) {
          skipLink.focus();
          skipLink.click();
        }
      }

      // Mobile menu with Alt + M
      if (e.altKey && e.key === "m") {
        e.preventDefault();
        this.app.modules.get("mobile")?.toggleMobileMenu();
      }

      // Home with Alt + H
      if (e.altKey && e.key === "h") {
        e.preventDefault();
        this.app.scrollToTop();
      }
    });
  }

  setupFocusManagement() {
    // Trap focus in mobile menu
    const mobileMenu = Utils.$("#mobile-menu-overlay");
    if (mobileMenu) {
      mobileMenu.addEventListener("keydown", (e) => {
        if (e.key === "Tab") {
          this.handleFocusTrap(e, mobileMenu);
        }
      });
    }

    // Focus management for dynamic content
    document.addEventListener("DOMNodeInserted", (e) => {
      const element = e.target;
      if (element.nodeType === Node.ELEMENT_NODE) {
        this.enhanceAccessibility(element);
      }
    });
  }

  handleFocusTrap(e, container) {
    const focusableElements = container.querySelectorAll(
      this.focusableElements
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }

  setupARIAAttributes() {
    // Add ARIA labels to buttons without text
    Utils.$$("button:not([aria-label]):not([aria-labelledby])").forEach(
      (button) => {
        const icon = button.querySelector(".btn-icon, .button-icon");
        const text = button.textContent?.trim();

        if (!text && icon) {
          const iconText = icon.textContent?.trim();
          if (iconText) {
            button.setAttribute("aria-label", `Button with ${iconText} icon`);
          }
        }
      }
    );

    // Add ARIA expanded to toggles
    Utils.$$("[data-toggle]").forEach((toggle) => {
      if (!toggle.hasAttribute("aria-expanded")) {
        toggle.setAttribute("aria-expanded", "false");
      }
    });

    // Add ARIA current to navigation
    Utils.$$(".nav-item.active").forEach((item) => {
      item.setAttribute("aria-current", "page");
    });
  }

  enhanceAccessibility(element) {
    // Add focus styles for dynamic elements
    if (element.matches("button, a, input, select, textarea")) {
      element.addEventListener("focus", () => {
        this.announceElement(element);
      });
    }

    // Add ARIA live regions for dynamic content
    if (element.matches(".toast, .notification")) {
      element.setAttribute("aria-live", "polite");
      element.setAttribute("role", "status");
    }
  }

  announceElement(element) {
    // Announce element purpose to screen readers
    const role = element.getAttribute("role");
    const label =
      element.getAttribute("aria-label") || element.textContent?.trim();

    if (role || label) {
      // Create temporary announcement
      this.announce(`${role ? role + ":" : ""} ${label}`.trim());
    }
  }

  announce(message, priority = "polite") {
    const announcer = document.createElement("div");
    announcer.setAttribute("aria-live", priority);
    announcer.setAttribute("aria-atomic", "true");
    announcer.className = "sr-only";
    announcer.textContent = message;

    document.body.appendChild(announcer);

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  }

  announcePageReady() {
    setTimeout(() => {
      this.announce(
        "Streaky Focus page loaded. Use Alt + S for skip links, Alt + M for menu.",
        "polite"
      );
    }, 1000);
  }

  updateLiveRegion(regionId, content) {
    const region = Utils.$(`#${regionId}`);
    if (region) {
      region.textContent = content;
    }
  }

  destroy() {
    // Cleanup any focus traps or listeners
  }
}

/* ===== GLOBAL FUNCTIONS FOR HTML COMPATIBILITY ===== */

// Make functions available globally for HTML onclick handlers
window.toggleMobileMenu = () => app.modules.get("mobile")?.toggleMobileMenu();
window.closeMobileMenu = () => app.modules.get("mobile")?.closeMobileMenu();
window.scrollToTop = () => app.scrollToTop();
window.scrollToDownload = () => app.scrollToDownload();
window.scrollToSection = (sectionId) => app.scrollToSection(sectionId);
window.watchDemo = () => app.showDemo();
window.trackDownload = (platform) => app.trackDownload(platform);

/* ===== APPLICATION INITIALIZATION ===== */

// Create global app instance
const app = new StreakyFocusApp();

// Initialize app when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    app.init().catch(console.error);
  });
} else {
  app.init().catch(console.error);
}

// Handle page unload
window.addEventListener("beforeunload", () => {
  app.destroy();
});

// Development helpers
if (
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1" ||
  window.location.protocol === "file:"
) {
  // Expose app to global scope for debugging
  window.streakyApp = app;
  window.streakyUtils = Utils;
  window.streakyConfig = CONFIG;
  window.streakyState = AppState;

  console.log("🛠️ Development mode detected");
  console.log("🎯 App instance: window.streakyApp");
  console.log("🔧 Utilities: window.streakyUtils");
  console.log("⚙️ Config: window.streakyConfig");
  console.log("📊 State: window.streakyState");

  // Add development helpers
  window.devHelpers = {
    toggleSection: (sectionId) => {
      app.scrollToSection(sectionId);
    },
    showToast: (type, message) => {
      app.modules.get("toast")?.show({ type, message });
    },
    getMetrics: () => {
      return app.modules.get("performance")?.getMetrics();
    },
    clearCache: () => {
      AppState.cache.clear();
      console.log("💨 Cache cleared");
    },
    simulateError: () => {
      throw new Error("Simulated error for testing");
    },
  };
}

// Service worker registration (if available)
if ("serviceWorker" in navigator && window.location.protocol === "https:") {
  navigator.serviceWorker
    .register("/sw.js")
    .then((registration) => {
      console.log("✅ Service Worker registered:", registration.scope);
      app.modules.get("analytics")?.trackEvent("service_worker_registered", {
        scope: registration.scope,
      });
    })
    .catch((error) => {
      console.error("❌ Service Worker registration failed:", error);
    });
}

// Performance monitoring
window.addEventListener("load", () => {
  setTimeout(() => {
    if ("performance" in window) {
      const perfData = performance.getEntriesByType("navigation")[0];
      if (perfData) {
        console.log("📊 Page Performance:", {
          "DOM Ready": `${Math.round(
            perfData.domContentLoadedEventEnd -
              perfData.domContentLoadedEventStart
          )}ms`,
          "Load Complete": `${Math.round(
            perfData.loadEventEnd - perfData.loadEventStart
          )}ms`,
          "Total Time": `${Math.round(
            perfData.loadEventEnd - perfData.requestStart
          )}ms`,
          "Transfer Size": `${(perfData.transferSize / 1024).toFixed(1)}KB`,
        });
      }
    }
  }, 0);
});

// Console art and info
console.log(`
🎯 Streaky Focus - Focus Revolution
   ────────────────────────────────
   Version: 2.0.1
   Build: ${new Date().toISOString().split("T")[0]}
   
   Ready to transform phone addiction
   into focus superpowers! 🚀
   
   ${
     window.location.hostname === "localhost"
       ? "🛠️ Development Mode"
       : "🚀 Production Mode"
   }
`);

// Export for module systems
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    StreakyFocusApp,
    Utils,
    CONFIG,
    AppState,
  };
}

/* ===== END OF JAVASCRIPT FILE ===== */
