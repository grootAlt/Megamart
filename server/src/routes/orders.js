import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { getOrder, listOrders, placeOrder } from '../services/orderService.js';
import { createOrder, idParams } from '../validation/schemas.js';

export const ordersRouter = Router();
ordersRouter.use(requireAuth);

ordersRouter.post('/', validate({ body: createOrder }), async (req, res) => {
  res.status(201).json({ data: await placeOrder(req.userId, req.valid.body) });
});

ordersRouter.get('/', async (req, res) => {
  res.json({ data: await listOrders(req.userId) });
});

ordersRouter.get('/:id', validate({ params: idParams }), async (req, res) => {
  res.json({ data: await getOrder(req.userId, req.valid.params.id) });
});
