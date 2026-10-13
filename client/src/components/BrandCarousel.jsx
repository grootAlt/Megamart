import { Link } from 'react-router-dom';
import { useBrands } from '../api/hooks.js';
import { useCarousel } from '../lib/useCarousel.js';
import { CarouselDots } from './CarouselDots.jsx';
import { SectionHeading } from './SectionHeading.jsx';

// Card palettes follow the Figma brand cards (dark, warm yellow, peach) and
// continue with softer tints for the extra brands we carry. Brands without a
// specific entry cycle through the fallbacks.
const THEMES = {
  Apple: { bg: '#313131', fg: '#ffffff', chip: '#4a4a4a', chipFg: '#d6d6d6', mark: '#ffffff', markFg: '#111111' },
  Realme: { bg: '#fff3cc', fg: '#222222', chip: '#ffe58f', chipFg: '#7a5c00', mark: '#ffc915', markFg: '#111111' },
  Samsung: { bg: '#fde3d6', fg: '#222222', chip: '#fff', chipFg: '#c2410c', mark: '#1428a0', markFg: '#ffffff' },
};
const FALLBACKS = [
  { bg: '#e6f4fa', fg: '#222222', chip: '#fff', chipFg: '#0077ab', mark: '#008ecc', markFg: '#ffffff' },
  { bg: '#eaf6ed', fg: '#222222', chip: '#fff', chipFg: '#1d7a31', mark: '#249b3e', markFg: '#ffffff' },
  { bg: '#efeafd', fg: '#222222', chip: '#fff', chipFg: '#5b3cc4', mark: '#5b3cc4', markFg: '#ffffff' },
];

export function BrandCarousel() {
  const { data: brands, isPending, isError } = useBrands({ category: 'mobiles,electronics', limit: 8 });
  const { trackProps, index, pageCount, goTo } = useCarousel(brands?.length ?? 0);

  // Decorative section: if it can't load, leave it out rather than show an error.
  if (isError || (!isPending && !brands?.length)) return null;

  return (
    <section className="home__section">
      <SectionHeading lead="Top" highlight="Electronics Brands" to="/products?category=electronics" />
      <div className="brand-track" {...trackProps}>
        {isPending
          ? Array.from({ length: 3 }, (_, i) => <div key={i} className="brand-card skeleton" />)
          : brands.map((b, i) => {
              const t = THEMES[b.name] ?? FALLBACKS[i % FALLBACKS.length];
              return (
                <Link
                  key={b.name}
                  to={`/products?brand=${encodeURIComponent(b.name)}&sort=discount`}
                  className="brand-card"
                  style={{ '--brand-bg': t.bg, '--brand-fg': t.fg, '--brand-chip': t.chip, '--brand-chip-fg': t.chipFg }}
                >
                  <div className="brand-card__copy">
                    <span className="brand-card__chip">{b.name}</span>
                    <span className="brand-card__mark" style={{ background: t.mark, color: t.markFg }} aria-hidden="true">
                      {b.name.slice(0, 1)}
                    </span>
                    <p className="brand-card__offer">
                      {b.maxDiscountPct > 0 ? `UP to ${b.maxDiscountPct}% OFF` : `${b.productCount} products`}
                    </p>
                  </div>
                  {b.image && <img className="brand-card__img" src={b.image} alt="" loading="lazy" />}
                </Link>
              );
            })}
      </div>
      <CarouselDots count={isPending ? 0 : pageCount} index={index} onSelect={goTo} label="Choose brands page" />
    </section>
  );
}
