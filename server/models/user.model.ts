import "dotenv/config";
import mongoose, { Document, Model, Schema } from "mongoose";
import bycrypt from 'bcryptjs'
import jwt from 'jsonwebtoken';

const emailRegexPattern: RegExp = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  avatar: {
    public_id: string;
    url: string;
  }
  role: string;
  isVerified: boolean;
  comparePassword: (enteredPassword: string) => Promise<boolean>;
  courses: Array<{ courseId: string }>;
  SignAccessToken: () => string;
  SignRefreshToken: () => string;
}

const userSchema: Schema<IUser> = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please enter your name'],
    maxLength: [30, 'Your name cannot exceed 30 characters']
  },
  email: {
    type: String,
    required: [true, 'Please enter your email'],
    unique: true,
    validate: {
      validator: function (value: string) {
        return emailRegexPattern.test(value);
      },
      message: "Please eneter a valid email"
    }
  },
  password: {
    type: String,
    minLength: [6, 'Your password must be longer than 6 characters'],
    select: false,
  },
  avatar: {
    public_id: {
      type: String,
    },
  },
  role: {
    type: String,
    default: 'user'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  courses: [
    {
      courseId: String,

    }
  ],
}, { timestamps: true });


// Hash Password
userSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  this.password = await bycrypt.hash(this.password, 10);
  next();
});

// Sign access token
userSchema.methods.SignAccessToken = function (): string {
  return jwt.sign({ id: this._id }, process.env.ACCESS_TOKEN || '', { expiresIn: '5m' });
};

// Sign refresh token
userSchema.methods.SignRefreshToken = function (): string {
  return jwt.sign({ id: this._id }, process.env.REFRESH_TOKEN || '', { expiresIn: '3d' });
};


// Compare Password
userSchema.methods.comparePassword = async function (enteredPassword: string): Promise<boolean> {
  return await bycrypt.compare(enteredPassword, this.password);
};

const userModel: Model<IUser> = mongoose.model("User", userSchema);

export default userModel;