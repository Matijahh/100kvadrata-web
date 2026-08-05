"use client";

import { useEffect } from "react";

/* The marketing site's behaviour, ported from the original static script.js:
   the load sequence, the brand intro, scroll reveals, the flying arrow, and
   the vertical hero feed. It runs imperatively against the server-rendered
   DOM after mount and tears every listener/observer/timer down on cleanup.
   Renders nothing. */

type TrackT = {
  track: HTMLElement;
  svg: SVGSVGElement;
  path: SVGPathElement;
  arrow: HTMLElement;
  steps: HTMLElement[];
  lean: number;
  len: number;
};

export function SiteEffects() {
  useEffect(() => {
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fine = window.matchMedia("(pointer: fine)");

    // Set while the hero feed is being mouse-dragged, so the phone's pointer
    // tilt stands down and doesn't fight the drag.
    let feedActive = false;

    const cleanups: Array<() => void> = [];
    const on = (
      target: EventTarget,
      type: string,
      handler: EventListenerOrEventListenerObject,
      opts?: boolean | AddEventListenerOptions,
    ) => {
      target.addEventListener(type, handler, opts);
      cleanups.push(() => target.removeEventListener(type, handler, opts));
    };
    const timer = (fn: () => void, ms: number) => {
      const id = window.setTimeout(fn, ms);
      cleanups.push(() => window.clearTimeout(id));
      return id;
    };

    /* ------------------------------------------------ load sequence --- */
    let lit = false;
    const lightUp = () => {
      if (lit) return;
      lit = true;
      document.body.classList.add("is-lit");
    };

    /* -------------------------------------------------- brand intro --- */
    (function setupIntro() {
      const intro = document.getElementById("intro");
      let seen = false;
      try {
        seen = sessionStorage.getItem("introSeen") === "1";
      } catch (e) {}

      if (!intro || calm.matches || seen) {
        if (intro && intro.parentNode) intro.remove();
        requestAnimationFrame(lightUp);
        timer(lightUp, 400);
        return;
      }

      try {
        sessionStorage.setItem("introSeen", "1");
      } catch (e) {}

      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        intro.classList.add("is-done");
        lightUp();
        const gone = () => {
          if (intro.parentNode) intro.remove();
        };
        intro.addEventListener("transitionend", gone, { once: true });
        timer(gone, 900);
      };

      requestAnimationFrame(() => {
        intro.classList.add("is-play");
      });

      // Curtain lifts after the sequence; a hard failsafe guarantees removal.
      const lift = timer(finish, 1250);
      timer(finish, 2600);

      const skip = () => {
        window.clearTimeout(lift);
        finish();
      };
      on(intro, "click", skip);
      on(window, "wheel", skip, { once: true, passive: true });
      on(window, "touchstart", skip, { once: true, passive: true });
      on(window, "keydown", (e) => {
        const key = (e as KeyboardEvent).key;
        if (key === "Escape" || key === " ") skip();
      });
    })();

    /* ------------------------------------------------ optional photos --- */
    // Any missing photo gets dropped so the drawn room / gradient avatar shows
    // through instead of a broken icon.
    document
      .querySelectorAll<HTMLImageElement>(".art__photo, .av__photo")
      .forEach((img) => {
        const drop = () => img.remove();
        on(img, "error", drop);
        if (img.complete && img.naturalWidth === 0) drop();
      });

    /* --------------------------------------------------- sticky head --- */
    const head = document.querySelector<HTMLElement>(".masthead");
    if (head) {
      const docEl = document.documentElement;
      const onScroll = () => {
        const y = window.scrollY;
        head.dataset.stuck = y > 8 ? "true" : "false";
        const max = docEl.scrollHeight - window.innerHeight;
        head.style.setProperty("--sp", max > 0 ? (y / max).toFixed(4) : "0");
      };
      onScroll();
      on(window, "scroll", onScroll, { passive: true });
    }

    /* -------------------------------------------------- flying arrow --- */
    const tracks: TrackT[] = Array.prototype.map.call(
      document.querySelectorAll(".track"),
      (track: HTMLElement): TrackT => {
        const svg = track.querySelector(".track__arc") as SVGSVGElement;
        const path = svg.querySelector("path") as SVGPathElement;

        // Which way the bow leans, read off the authored path.
        const nums = (path.getAttribute("d") || "").match(/-?[\d.]+/g) || [];
        const lean =
          nums.length > 2 &&
          parseFloat(nums[2] ?? "0") < parseFloat(nums[0] ?? "0")
            ? -1
            : 1;

        return {
          track,
          svg,
          path,
          arrow: track.querySelector(".track__arrow") as HTMLElement,
          steps: Array.prototype.slice.call(track.querySelectorAll(".step")),
          lean,
          len: 0,
        };
      },
    ) as TrackT[];

    const shape = (t: TrackT) => {
      const box = t.svg.getBoundingClientRect();
      const w = Math.max(1, box.width);
      const h = Math.max(1, box.height);
      const cx = w / 2;
      const bow = cx + t.lean * w * 0.45;

      t.svg.setAttribute("viewBox", "0 0 " + w + " " + h);
      t.path.setAttribute(
        "d",
        "M" +
          cx +
          ",0 C" +
          bow +
          "," +
          h * 0.26 +
          " " +
          bow +
          "," +
          h * 0.74 +
          " " +
          cx +
          "," +
          h,
      );

      t.len = t.path.getTotalLength();
      t.path.style.strokeDasharray = t.len + "px";
      t.path.style.strokeDashoffset = t.len + "px";
    };

    const pointAt = (t: TrackT, dist: number) =>
      t.path.getPointAtLength(Math.max(0, Math.min(t.len, dist)));

    const place = (t: TrackT, p: number) => {
      const dist = t.len * p;
      const from = Math.min(dist, t.len - 2);
      const here = pointAt(t, dist);
      const a = pointAt(t, from);
      const b = pointAt(t, from + 2);
      const deg = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;

      t.arrow.style.transform =
        "translate(" +
        here.x +
        "px," +
        here.y +
        "px) rotate(" +
        (deg - 12) +
        "deg)";

      return here;
    };

    if (tracks.length) {
      const draw = () => {
        const vh = window.innerHeight;

        tracks.forEach((t) => {
          const r = t.track.getBoundingClientRect();
          const travel = r.height + vh * 0.45;
          let p = (vh * 0.85 - r.top) / travel;
          p = Math.max(0, Math.min(1, p));

          t.track.style.setProperty("--p", p.toFixed(4));
          t.track.dataset.flying = p > 0.001 ? "true" : "false";

          t.path.style.strokeDashoffset = t.len * (1 - p) + "px";

          const here = place(t, p);

          if (!calm.matches) {
            const svgTop = t.svg.getBoundingClientRect().top;
            t.steps.forEach((step) => {
              const mid = step.getBoundingClientRect().top + 10 - svgTop;
              step.dataset.lit = here.y >= mid ? "true" : "false";
            });
          }
        });
      };

      let queued = false;
      const onMove = () => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => {
          queued = false;
          draw();
        });
      };

      const reshape = () => {
        tracks.forEach(shape);
        draw();
      };

      if (!calm.matches) {
        tracks.forEach((t) => {
          t.track.dataset.flight = "on";
        });
      }

      reshape();
      on(window, "scroll", onMove, { passive: true });
      on(window, "resize", reshape);

      if (window.ResizeObserver) {
        const ro = new ResizeObserver(reshape);
        tracks.forEach((t) => ro.observe(t.svg));
        cleanups.push(() => ro.disconnect());
      }

      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(reshape);
      }
    }

    /* -------------------------------------------------- scroll reveals --- */
    const watched = document.querySelectorAll(".reveal, .steps");
    if (!("IntersectionObserver" in window)) {
      watched.forEach((el) => el.classList.add("is-seen"));
    } else {
      const seer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-seen");
            seer.unobserve(entry.target);
          });
        },
        { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
      );
      watched.forEach((el) => seer.observe(el));
      cleanups.push(() => seer.disconnect());
    }

    /* ------------------------------------- pointer microinteractions --- */
    if (fine.matches && !calm.matches) {
      const hero = document.querySelector<HTMLElement>(".hero");
      const heroPhone = document.querySelector<HTMLElement>(".hero .phone");
      if (hero && heroPhone) {
        on(hero, "pointermove", (e) => {
          if (feedActive) return;
          const ev = e as PointerEvent;
          const r = hero.getBoundingClientRect();
          const px = (ev.clientX - r.left) / r.width - 0.5;
          const py = (ev.clientY - r.top) / r.height - 0.5;
          heroPhone.style.setProperty("--ry", (px * 5).toFixed(2) + "deg");
          heroPhone.style.setProperty("--rx", (-py * 5).toFixed(2) + "deg");
        });
        on(hero, "pointerleave", () => {
          heroPhone.style.setProperty("--rx", "0deg");
          heroPhone.style.setProperty("--ry", "0deg");
        });
      }

      document.querySelectorAll<HTMLElement>(".cta").forEach((btn) => {
        on(btn, "pointermove", (e) => {
          const ev = e as PointerEvent;
          const r = btn.getBoundingClientRect();
          const dx = ev.clientX - r.left - r.width / 2;
          const dy = ev.clientY - r.top - r.height / 2;
          btn.style.setProperty("--mx", (dx * 0.18).toFixed(1) + "px");
          btn.style.setProperty("--my", (-2 + dy * 0.18).toFixed(1) + "px");
        });
        on(btn, "pointerleave", () => {
          btn.style.removeProperty("--mx");
          btn.style.removeProperty("--my");
        });
      });
    }

    /* ----------------------------------------------------- the feed --- */
    (function setupFeed() {
      const feed = document.querySelector<HTMLElement>("[data-deck]");
      if (!feed) return;

      const reels = Array.prototype.slice.call(
        feed.querySelectorAll(".reel"),
      ) as HTMLElement[];
      if (reels.length < 2) return;

      const hint = document.querySelector<HTMLElement>(".reels__hint");
      const count = reels.length;
      let idx = 0;
      let busy = false;
      let autoTimer: number | null = null;
      let touched = false;

      const layout = () => {
        reels.forEach((reel, i) => {
          let rel = i - idx;
          if (rel > count / 2) rel -= count;
          if (rel < -count / 2) rel += count;

          reel.style.setProperty("--pos", String(rel));
          reel.style.display = Math.abs(rel) <= 1 ? "" : "none";
          reel.setAttribute("aria-hidden", rel === 0 ? "false" : "true");
        });
      };

      const setDy = (px: number) => {
        feed.style.setProperty("--dy", px + "px");
      };

      // dir: 1 = next reel (swipe up), -1 = previous (swipe down)
      const go = (dir: number) => {
        if (busy) return;
        busy = true;

        const travel = feed.offsetHeight || 500;
        feed.classList.add("is-settling");
        setDy(-dir * travel);

        const finish = () => {
          feed.removeEventListener("transitionend", finish);
          feed.classList.remove("is-settling");
          idx = (idx + dir + count) % count;
          setDy(0);
          layout();
          requestAnimationFrame(() => {
            busy = false;
          });
        };

        feed.addEventListener("transitionend", finish);
        window.setTimeout(() => {
          if (busy) finish();
        }, 650);
      };

      const settleBack = () => {
        feed.classList.add("is-settling");
        setDy(0);
        window.setTimeout(() => {
          feed.classList.remove("is-settling");
        }, 480);
      };

      /* drag — mouse only. On touch a tap advances the feed instead of a
         swipe trapping the page scroll. */
      let startY = 0;
      let startX = 0;
      let dy = 0;
      let dragging = false;

      const stop = () => {
        if (autoTimer) {
          window.clearInterval(autoTimer);
          autoTimer = null;
        }
      };
      const start = () => {
        if (calm.matches || touched || autoTimer) return;
        autoTimer = window.setInterval(() => {
          if (document.hidden || busy) return;
          go(1);
        }, 4000);
      };

      on(feed, "pointerdown", (e) => {
        if (busy) return;
        const ev = e as PointerEvent;

        stop();
        touched = true;
        if (hint) hint.style.opacity = "0";

        if (ev.pointerType !== "mouse") return;

        dragging = true;
        feedActive = true;
        dy = 0;
        startY = ev.clientY;
        startX = ev.clientX;
        feed.classList.remove("is-settling");
        if (feed.setPointerCapture) feed.setPointerCapture(ev.pointerId);
        ev.preventDefault();
      });

      on(window, "pointermove", (e) => {
        if (!dragging) return;
        dy = (e as PointerEvent).clientY - startY;
        setDy(dy * 0.9);
      });

      const release = () => {
        if (!dragging) return;
        dragging = false;
        feedActive = false;

        const threshold = (feed.offsetHeight || 500) * 0.16;
        if (dy <= -threshold) go(1);
        else if (dy >= threshold) go(-1);
        else settleBack();

        dy = 0;
      };

      on(window, "pointerup", release);
      on(window, "pointercancel", release);

      // Touch: a tap moves to the next listing.
      on(feed, "click", (e) => {
        if (dragging || busy) return;
        const ev = e as MouseEvent;
        if (Math.abs(ev.clientX - startX) > 6 || Math.abs(ev.clientY - startY) > 6)
          return;
        go(1);
      });

      on(feed, "keydown", (e) => {
        const ev = e as KeyboardEvent;
        if (ev.key !== "ArrowDown" && ev.key !== "ArrowUp") return;
        ev.preventDefault();
        stop();
        touched = true;
        go(ev.key === "ArrowDown" ? 1 : -1);
      });

      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) start();
            else stop();
          });
        },
        { threshold: 0.4 },
      );
      io.observe(feed);
      cleanups.push(() => {
        io.disconnect();
        stop();
      });

      setDy(0);
      layout();
    })();

    return () => {
      cleanups.forEach((fn) => fn());
    };
  }, []);

  return null;
}
