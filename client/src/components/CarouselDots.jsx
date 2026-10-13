// Pill-style pager from Figma: the active page is a wide pill, others are dots.
// With `progressMs`, the active pill fills up as a countdown to the next slide.
export function CarouselDots({ count, index, onSelect, label, tone = 'dark', progressMs }) {
  if (count < 2) return null;
  return (
    <div
      className={`carousel-dots carousel-dots--${tone}${progressMs ? ' carousel-dots--timed' : ''}`}
      style={progressMs ? { '--progress-ms': `${progressMs}ms` } : undefined}
      role="group"
      aria-label={label}
    >
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          className={i === index ? 'is-active' : ''}
          aria-label={`Go to slide ${i + 1}`}
          aria-current={i === index ? 'true' : undefined}
          onClick={() => onSelect(i)}
        />
      ))}
    </div>
  );
}
