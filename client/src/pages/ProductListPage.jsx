import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCategories, useProducts } from '../api/hooks.js';
import { ChevronLeft, ChevronRight, CloseIcon, FilterIcon, SearchIcon } from '../components/Icons.jsx';
import { ProductCard } from '../components/ProductCard.jsx';
import { SectionHeading } from '../components/SectionHeading.jsx';
import { EmptyState, ErrorState, ProductGridSkeleton } from '../components/StateViews.jsx';
import { formatPrice } from '../lib/format.js';

const PAGE_SIZE = 12;
const SORT_OPTIONS = [
  { value: 'relevance', label: 'Featured' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'discount', label: 'Biggest discount' },
  { value: 'newest', label: 'Newest first' },
];
const PRICE_PRESETS = [
  { label: 'Under ₹1,000', max: 999 },
  { label: '₹1,000 – ₹10,000', min: 1000, max: 10000 },
  { label: '₹10,000 – ₹50,000', min: 10000, max: 50000 },
  { label: '₹50,000 – ₹2,00,000', min: 50000, max: 200000 },
  { label: 'Above ₹2,00,000', min: 200000 },
];

// The URL is the single source of truth for filters: refresh, back/forward
// and shared links all reproduce the same listing.
function useListingParams() {
  const [params, setParams] = useSearchParams();
  const query = {
    category: params.get('category') || undefined,
    brand: params.get('brand') || undefined,
    minPrice: params.get('minPrice') || undefined,
    maxPrice: params.get('maxPrice') || undefined,
    sort: params.get('sort') || 'relevance',
    q: params.get('q') || undefined,
    page: Number(params.get('page')) || 1,
    limit: PAGE_SIZE,
  };

  const update = (changes, { resetPage = true } = {}) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(changes)) {
      if (v === undefined || v === null || v === '') next.delete(k);
      else next.set(k, String(v));
    }
    if (resetPage && !('page' in changes)) next.delete('page');
    if (next.get('sort') === 'relevance') next.delete('sort');
    setParams(next);
  };

  const clear = () => setParams(query.q ? { q: query.q } : {});
  return { query, update, clear };
}

export default function ProductListPage() {
  const { query, update, clear } = useListingParams();
  const { data, isPending, isFetching, isError, error, refetch } = useProducts(query);
  const { data: categories } = useCategories();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const category = categories?.find((c) => c.slug === query.category);
  const activeFilters = Boolean(query.category || query.brand || query.minPrice || query.maxPrice);

  useEffect(() => {
    document.title = `${query.brand ?? category?.name ?? (query.q ? `“${query.q}”` : 'All products')} | MegaMart`;
  }, [category, query.brand, query.q]);

  return (
    <div className="container listing">
      <SectionHeading
        as="h1"
        lead={query.q ? 'Results for' : 'Shop'}
        highlight={query.q ? `“${query.q}”` : [query.brand, category?.name].filter(Boolean).join(' ') || 'All Products'}
      />

      <div className="listing__layout">
        <aside className={`filters${filtersOpen ? ' filters--open' : ''}`} aria-label="Filters">
          <div className="filters__head">
            <h2>Filters</h2>
            {activeFilters && (
              <button type="button" className="link-btn" onClick={clear}>Clear all</button>
            )}
            <button type="button" className="icon-btn filters__close" onClick={() => setFiltersOpen(false)} aria-label="Close filters">
              <CloseIcon />
            </button>
          </div>

          <fieldset className="filters__group">
            <legend>Category</legend>
            <label className="radio">
              <input type="radio" name="category" checked={!query.category} onChange={() => update({ category: undefined })} />
              All categories
            </label>
            {categories?.map((c) => (
              <label key={c.slug} className="radio">
                <input
                  type="radio"
                  name="category"
                  checked={query.category === c.slug}
                  onChange={() => update({ category: c.slug })}
                />
                {c.name} <span className="radio__count">{c.productCount}</span>
              </label>
            ))}
          </fieldset>

          <PriceFilter
            key={`${query.minPrice}-${query.maxPrice}`}
            min={query.minPrice}
            max={query.maxPrice}
            onApply={(minPrice, maxPrice) => update({ minPrice, maxPrice })}
          />

          <button type="button" className="btn btn--primary filters__done" onClick={() => setFiltersOpen(false)}>
            Show {data?.meta.total ?? ''} results
          </button>
        </aside>
        {filtersOpen && <div className="scrim" onClick={() => setFiltersOpen(false)} />}

        <section className="listing__results" aria-busy={isFetching}>
          <div className="listing__toolbar">
            <button type="button" className="btn btn--outline btn--sm listing__filter-btn" onClick={() => setFiltersOpen(true)}>
              <FilterIcon /> Filters{activeFilters && <span className="dot" />}
            </button>
            {query.brand && (
              <button type="button" className="filter-chip" onClick={() => update({ brand: undefined })} aria-label={`Remove brand filter ${query.brand}`}>
                Brand: {query.brand} <CloseIcon />
              </button>
            )}
            <p className="listing__count">
              {data ? `${data.meta.total} ${data.meta.total === 1 ? 'product' : 'products'}` : ' '}
            </p>
            <label className="select">
              <span>Sort by</span>
              <select value={query.sort} onChange={(e) => update({ sort: e.target.value })}>
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
          </div>

          {isPending ? (
            <ProductGridSkeleton count={8} />
          ) : isError ? (
            <ErrorState
              error={error}
              title={error.status === 400 ? 'Those filters don’t look right' : 'Couldn’t load products'}
              onRetry={error.status === 400 ? clear : refetch}
            />
          ) : data.data.length === 0 ? (
            <EmptyState
              icon={<SearchIcon className="state-view__icon" />}
              title="No products match"
              action={
                activeFilters || query.q ? (
                  <button type="button" className="btn btn--outline" onClick={() => (activeFilters ? clear() : update({ q: undefined }))}>
                    {activeFilters ? 'Clear filters' : 'Clear search'}
                  </button>
                ) : null
              }
            >
              Try a different search or widen the price range.
            </EmptyState>
          ) : (
            <>
              <div className={`product-grid${isFetching ? ' is-refreshing' : ''}`}>
                {data.data.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              <Pagination meta={data.meta} onPage={(page) => update({ page: page === 1 ? undefined : page }, { resetPage: false })} />
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function PriceFilter({ min, max, onApply }) {
  const [lo, setLo] = useState(min ?? '');
  const [hi, setHi] = useState(max ?? '');
  const invalid = lo !== '' && hi !== '' && Number(lo) > Number(hi);
  const preset = PRICE_PRESETS.find((p) => String(p.min ?? '') === String(min ?? '') && String(p.max ?? '') === String(max ?? ''));

  return (
    <fieldset className="filters__group">
      <legend>Price</legend>
      {PRICE_PRESETS.map((p) => (
        <label key={p.label} className="radio">
          <input type="radio" name="price" checked={preset === p} onChange={() => onApply(p.min, p.max)} />
          {p.label}
        </label>
      ))}
      <form
        className="price-range"
        onSubmit={(e) => {
          e.preventDefault();
          if (!invalid) onApply(lo || undefined, hi || undefined);
        }}
      >
        <input type="number" inputMode="numeric" min="0" placeholder="Min ₹" value={lo} onChange={(e) => setLo(e.target.value)} aria-label="Minimum price" />
        <span>to</span>
        <input type="number" inputMode="numeric" min="0" placeholder="Max ₹" value={hi} onChange={(e) => setHi(e.target.value)} aria-label="Maximum price" />
        <button type="submit" className="btn btn--outline btn--sm" disabled={invalid}>Go</button>
      </form>
      {invalid && <p className="field-error">Min should be less than max</p>}
      {(min || max) && !preset && (
        <p className="filters__hint">
          Showing {min ? formatPrice(min) : '₹0'} – {max ? formatPrice(max) : 'any'}
        </p>
      )}
    </fieldset>
  );
}

function Pagination({ meta, onPage }) {
  const { page, totalPages } = meta;
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
  );
  return (
    <nav className="pagination" aria-label="Pagination">
      <button type="button" className="icon-btn" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
        <ChevronLeft />
      </button>
      {pages.map((p, i) => (
        <span key={p} className="pagination__item">
          {i > 0 && p - pages[i - 1] > 1 && <span className="pagination__gap">…</span>}
          <button type="button" className={`pagination__page${p === page ? ' is-current' : ''}`} aria-current={p === page ? 'page' : undefined} onClick={() => onPage(p)}>
            {p}
          </button>
        </span>
      ))}
      <button type="button" className="icon-btn" disabled={page >= totalPages} onClick={() => onPage(page + 1)} aria-label="Next page">
        <ChevronRight />
      </button>
    </nav>
  );
}
