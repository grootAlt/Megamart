import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
  },
  { timestamps: true },
);

userSchema.methods.toJSON = function toJSON() {
  return { id: this._id.toString(), name: this.name, email: this.email };
};

export const User = mongoose.model('User', userSchema);
