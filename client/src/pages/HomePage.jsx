import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCategories, useProducts } from '../api/hooks.js';
import { BrandCarousel } from '../components/BrandCarousel.jsx';
import { HeroCarousel } from '../components/HeroCarousel.jsx';
import { ProductCard } from '../components/ProductCard.jsx';
import { SectionHeading } from '../components/SectionHeading.jsx';
import { ErrorState, ProductGridSkeleton } from '../components/StateViews.jsx';

const IMG = 'https://cdn.dummyjson.com/product-images';
const CATEGORY_IMAGES = {
  mobiles: `${IMG}/smartphones/samsung-galaxy-s10/1.webp`,
  electronics: `${IMG}/laptops/apple-macbook-pro-14-inch-space-grey/1.webp`,
  watches: `${IMG}/mens-watches/brown-leather-belt-watch/1.webp`,
  fashion: `${IMG}/mens-shoes/nike-air-jordan-1-red-and-black/1.webp`,
  beauty: `${IMG}/beauty/red-lipstick/1.webp`,
  furniture: `${IMG}/furniture/knoll-saarinen-executive-conference-chair/1.webp`,
  groceries: `${IMG}/groceries/strawberry/1.webp`,
};

export default function HomePage() {
  const deals = useProducts({ category: 'mobiles', sort: 'discount', limit: 5 });
  const { data: categories } = useCategories();

  useEffect(() => {
    document.title = 'MegaMart | Best deals online';
  }, []);

  return (
    <div className="container home">
      <h1 className="visually-hidden">MegaMart: best deals online</h1>
      <HeroCarousel />

      <section className="home__section">
        <SectionHeading lead="Grab the best deal on" highlight="Smartphones" to="/products?category=mobiles&sort=discount" />
        {deals.isPending ? (
          <ProductGridSkeleton count={5} />
        ) : deals.isError ? (
          <ErrorState error={deals.error} onRetry={deals.refetch} title="Couldn’t load deals" />
        ) : (
          <div className="product-grid product-grid--row">
            {deals.data.data.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      <section className="home__section">
        <SectionHeading lead="Shop From" highlight="Top Categories" to="/products" />
        <ul className="category-circles">
          {categories?.map((c) => (
            <li key={c.slug}>
              <Link to={`/products?category=${c.slug}`}>
                <span className="category-circles__img">
                  <img src={CATEGORY_IMAGES[c.slug]} alt="" loading="lazy" />
                </span>
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <BrandCarousel />
    </div>
  );
}
