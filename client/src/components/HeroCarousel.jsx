import { Link } from 'react-router-dom';
import { useCategories } from '../api/hooks.js';
import { useCarousel } from '../lib/useCarousel.js';
import { CarouselDots } from './CarouselDots.jsx';
import { ChevronLeft, ChevronRight } from './Icons.jsx';

const IMG = 'https://cdn.dummyjson.com/product-images';

// Copy and art per slide. The "UP to X% OFF" line is filled in from the
// category's real best discount, so the banner never promises more than the
// catalogue has.
const SLIDES = [
  {
    category: 'watches',
    eyebrow: 'Best Deal Online on smart watches',
    title: 'SMART WEARABLE.',
    image: `${IMG}/mens-watches/rolex-submariner-watch/1.webp`,
  },
  {
    category: 'mobiles',
    eyebrow: 'Best Deal Online on smartphones',
    title: 'FLAGSHIP PHONES.',
    image: `${IMG}/smartphones/iphone-13-pro/1.webp`,
  },
  {
    category: 'fashion',
    eyebrow: 'Fresh drops in footwear',
    title: 'STEP UP STYLE.',
    image: `${IMG}/mens-shoes/nike-air-jordan-1-red-and-black/1.webp`,
  },
  {
    category: 'electronics',
    eyebrow: 'Work and play, anywhere',
    title: 'LAPTOPS & TABLETS.',
    image: `${IMG}/laptops/apple-macbook-pro-14-inch-space-grey/1.webp`,
  },
  {
    category: 'furniture',
    eyebrow: 'Make your home yours',
    title: 'LIVING ROOM EDIT.',
    image: `${IMG}/furniture/annibale-colombo-sofa/1.webp`,
  },
];

const AUTOPLAY_MS = 5000;

export function HeroCarousel() {
  const { data: categories } = useCategories();
  const { trackProps, rootProps, index, pageCount, goTo, next, prev, playing } = useCarousel(SLIDES.length, {
    autoplayMs: AUTOPLAY_MS,
  });

  return (
    <section className="hero-carousel" aria-roledescription="carousel" aria-label="Featured deals" {...rootProps}>
      <div className="hero-carousel__track" {...trackProps}>
        {SLIDES.map((s, i) => {
          const discount = categories?.find((c) => c.slug === s.category)?.maxDiscountPct;
          return (
            <Link
              key={s.category}
              to={`/products?category=${s.category}&sort=discount`}
              className={`hero${i === index ? ' is-active' : ''}`}
              aria-hidden={i === index ? undefined : true}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${SLIDES.length}: ${s.title}`}
              tabIndex={i === index ? 0 : -1}
            >
              <div className="hero__copy">
                <p className="hero__eyebrow">{s.eyebrow}</p>
                <h2 className="hero__title">{s.title}</h2>
                <p className="hero__offer">{discount ? `UP to ${discount}% OFF` : 'Shop the collection'}</p>
              </div>
              <img className="hero__img" src={s.image} alt="" loading={i === 0 ? 'eager' : 'lazy'} />
            </Link>
          );
        })}
      </div>

      <CarouselDots
        count={pageCount}
        index={index}
        onSelect={goTo}
        label="Choose slide"
        tone="light"
        progressMs={playing ? AUTOPLAY_MS : undefined}
      />

      <button type="button" className="carousel-arrow carousel-arrow--prev" onClick={prev} aria-label="Previous slide">
        <ChevronLeft />
      </button>
      <button type="button" className="carousel-arrow carousel-arrow--next" onClick={next} aria-label="Next slide">
        <ChevronRight />
      </button>
    </section>
  );
}
