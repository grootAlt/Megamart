import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { addItem, getCart, removeItem, updateItem } from '../services/cartService.js';
import { addCartItem, idParams, updateCartItem } from '../validation/schemas.js';

export const cartRouter = Router();
cartRouter.use(requireAuth);

// Every cart route answers with the whole hydrated cart, so the client can
// replace its single cached copy instead of patching it.
cartRouter.get('/', async (req, res) => {
  res.json({ data: await getCart(req.userId) });
});

cartRouter.post('/items', validate({ body: addCartItem }), async (req, res) => {
  res.status(201).json({ data: await addItem(req.userId, req.valid.body) });
});

cartRouter.patch('/items/:id', validate({ params: idParams, body: updateCartItem }), async (req, res) => {
  res.json({ data: await updateItem(req.userId, req.valid.params.id, req.valid.body.quantity) });
});

cartRouter.delete('/items/:id', validate({ params: idParams }), async (req, res) => {
  res.json({ data: await removeItem(req.userId, req.valid.params.id) });
});
