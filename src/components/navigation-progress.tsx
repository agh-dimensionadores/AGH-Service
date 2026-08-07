"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function NavigationProgressInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);
  const [hint, setHint] = useState(false);
  const [progress, setProgress] = useState(0);

  const progressRef = useRef(0);
  const activeRef = useRef(false);
  const timers = useRef<number[]>([]);
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const routeKeyRef = useRef(routeKey);

  function clearTimers() {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }

  function finish() {
    if (!activeRef.current && progressRef.current === 0) return;
    clearTimers();
    progressRef.current = 100;
    setProgress(100);
    const hide = window.setTimeout(() => {
      activeRef.current = false;
      setActive(false);
      setHint(false);
      progressRef.current = 0;
      setProgress(0);
    }, 220);
    timers.current.push(hide);
  }

  function start() {
    clearTimers();
    activeRef.current = true;
    setActive(true);
    setHint(false);
    progressRef.current = 8;
    setProgress(8);

    const startedAt = routeKeyRef.current;

    timers.current.push(
      window.setTimeout(() => {
        if (activeRef.current) setHint(true);
      }, 120)
    );

    [28, 48, 62, 74, 82, 88].forEach((value, i) => {
      timers.current.push(
        window.setTimeout(() => {
          if (!activeRef.current || progressRef.current >= 100) return;
          progressRef.current = value;
          setProgress(value);
        }, 280 * (i + 1))
      );
    });

    // Si el formulario falla o no cambia la ruta, no dejar la barra colgada.
    timers.current.push(
      window.setTimeout(() => {
        if (routeKeyRef.current === startedAt) finish();
      }, 12000)
    );
  }

  useEffect(() => {
    if (routeKeyRef.current !== routeKey) {
      routeKeyRef.current = routeKey;
      finish();
    } else {
      routeKeyRef.current = routeKey;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeKey]);

  useEffect(() => {
    function sameDestination(href: string) {
      try {
        const url = new URL(href, window.location.href);
        return (
          url.origin === window.location.origin &&
          url.pathname === window.location.pathname &&
          url.search === window.location.search
        );
      } catch {
        return true;
      }
    }

    function onClick(e: MouseEvent) {
      if (e.defaultPrevented) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const anchor = (e.target as HTMLElement | null)?.closest("a");
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      ) {
        return;
      }

      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (sameDestination(href)) return;

      start();
    }

    function onSubmit(e: SubmitEvent) {
      if (e.defaultPrevented) return;
      const form = e.target as HTMLFormElement | null;
      if (!form) return;
      if (form.target && form.target !== "_self") return;
      start();
    }

    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!active) return null;

  return (
    <>
      <div
        className="nav-progress"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        aria-label="Cargando"
      >
        <div className="nav-progress-bar" style={{ width: `${progress}%` }} />
      </div>
      {hint ? (
        <div className="nav-loading-chip" role="status" aria-live="polite">
          <span className="nav-loading-spinner" aria-hidden />
          Cargando…
        </div>
      ) : null}
    </>
  );
}

export function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressInner />
    </Suspense>
  );
}
