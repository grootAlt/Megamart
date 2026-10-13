import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { requireAuth, signToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { login, register } from '../validation/schemas.js';

export const authRouter = Router();

authRouter.post('/register', validate({ body: register }), async (req, res) => {
  const { name, email, password } = req.valid.body;
  if (await User.exists({ email })) {
    throw ApiError.conflict('EMAIL_TAKEN', 'An account with this email already exists');
  }
  const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 10) });
  res.status(201).json({ data: { token: signToken(user), user } });
});

authRouter.post('/login', validate({ body: login }), async (req, res) => {
  const { email, password } = req.valid.body;
  const user = await User.findOne({ email }).select('+passwordHash');
  // Same message either way so the endpoint doesn't reveal which emails exist.
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect');
  }
  res.json({ data: { token: signToken(user), user } });
});

authRouter.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) throw ApiError.unauthorized('Account no longer exists');
  res.json({ data: user });
});
