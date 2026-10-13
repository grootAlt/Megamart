import { useCallback, useEffect, useRef, useState } from 'react';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Drives a horizontally scrolling, scroll-snapped track. Native scrolling
 * means touch swipe and trackpads work for free; this hook only adds
 * arrows/dots, knows which item is in front, and optionally autoplays.
 *
 * Works for one item per view (hero) and several per view (brand cards):
 * `pageCount` is the number of distinct start positions.
 */
export function useCarousel(itemCount, { autoplayMs = 0 } = {}) {
  const trackRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [pageCount, setPageCount] = useState(itemCount);
  const [paused, setPaused] = useState(false);

  const stride = () => {
    const el = trackRef.current;
    const [a, b] = el?.children ?? [];
    if (!a) return 1;
    return b ? b.offsetLeft - a.offsetLeft : a.offsetWidth;
  };

  const measure = useCallback(() => {
    const el = trackRef.current;
    if (!el || !el.children.length) return;
    const perView = Math.max(1, Math.round(el.clientWidth / stride()));
    setPageCount(Math.max(1, itemCount - perView + 1));
  }, [itemCount]);

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (trackRef.current) ro.observe(trackRef.current);
    return () => ro.disconnect();
  }, [measure]);

  const onScroll = useCallback(() => {
    const el = trackRef.current;
    if (el) setIndex(Math.round(el.scrollLeft / stride()));
  }, []);

  const goTo = useCallback(
    (i) => {
      const el = trackRef.current;
      if (!el) return;
      const target = ((i % pageCount) + pageCount) % pageCount;
      el.scrollTo({ left: target * stride(), behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    },
    [pageCount],
  );

  useEffect(() => {
    if (!autoplayMs || paused || pageCount < 2 || prefersReducedMotion()) return;
    const id = setInterval(() => {
      if (!document.hidden) goTo(index + 1);
    }, autoplayMs);
    return () => clearInterval(id);
  }, [autoplayMs, paused, pageCount, index, goTo]);

  return {
    trackRef,
    index: Math.min(index, pageCount - 1),
    // True while the autoplay timer is actually counting (drives the dot's progress fill).
    playing: Boolean(autoplayMs) && !paused && pageCount > 1 && !prefersReducedMotion(),
    pageCount,
    goTo,
    next: () => goTo(index + 1),
    prev: () => goTo(index - 1),
    trackProps: { ref: trackRef, onScroll },
    // Pause autoplay while the user is pointing at or tabbing through it.
    rootProps: {
      onMouseEnter: () => setPaused(true),
      onMouseLeave: () => setPaused(false),
      onFocus: () => setPaused(true),
      onBlur: () => setPaused(false),
      onTouchStart: () => setPaused(true),
    },
  };
}
