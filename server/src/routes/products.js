import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { getProductBySlug, listBrands, listCategories, listProducts } from '../services/productService.js';
import { brandListQuery, productListQuery, slugParams } from '../validation/schemas.js';

export const productsRouter = Router();

productsRouter.get('/', validate({ query: productListQuery }), async (req, res) => {
  res.json(await listProducts(req.valid.query));
});

productsRouter.get('/:slug', validate({ params: slugParams }), async (req, res) => {
  res.json({ data: await getProductBySlug(req.valid.params.slug) });
});

export const categoriesRouter = Router();

categoriesRouter.get('/', async (_req, res) => {
  res.json({ data: await listCategories() });
});

export const brandsRouter = Router();

brandsRouter.get('/', validate({ query: brandListQuery }), async (req, res) => {
  const { category, limit } = req.valid.query;
  res.json({ data: await listBrands({ categories: category, limit }) });
});
