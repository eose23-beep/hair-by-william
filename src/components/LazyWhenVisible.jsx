import { Suspense, useEffect, useRef, useState } from "react";

/**
 * Keeps a reserved-height slot and only mounts the lazy child when near the viewport.
 * Cuts main-thread work after hydration (TBT / LCP render-delay races) without CLS.
 */
export default function LazyWhenVisible({
  className,
  rootMargin = "280px 0px",
  children,
}) {
  const ref = useRef(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || show) return undefined;

    if (typeof IntersectionObserver === "undefined") {
      setShow(true);
      return undefined;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setShow(true);
        io.disconnect();
      },
      { root: null, rootMargin, threshold: 0.01 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [rootMargin, show]);

  return (
    <div ref={ref} className={className}>
      {show ? <Suspense fallback={null}>{children}</Suspense> : null}
    </div>
  );
}
