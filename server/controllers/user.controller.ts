import { NextFunction, Request, Response } from 'express';
import userModel, { IUser } from '../models/user.model';
import { CatchAsyncError } from '../middleware/catchAsyncErrors';
import ErrorHandler from '../utils/ErrorHandler';
import jwt, { Secret, JwtPayload } from 'jsonwebtoken';
import ejs from 'ejs';
import path from 'path';
import sendMail from '../utils/sendMail';
import 'dotenv/config';
import { accessTokenOptions, refreshTokenOptions, sendToken } from '../utils/jwt';
import { redis } from '../utils/redis';
import { getUserById } from '../services/user.service';

// Register a user => /api/v1/register
interface IRegistrationBody {
  name: string;
  email: string;
  password: string;
  avatar?: string;
}

export const registerUser = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password } = req.body;

    const isEmailExist = await userModel.findOne({ email });
    if (isEmailExist) {
      return next(new ErrorHandler("Email already exist", 400))
    };

    const user: IRegistrationBody = {
      name,
      email,
      password,
    };

    const activationToken = createActivationToken(user);

    const activationCode = activationToken.activationCode;

    const data = { user: { name: user.name }, activationCode }

    const html = await ejs.renderFile(path.join(__dirname, "../mails/activation-mail.ejs"), data);

    try {
      await sendMail({
        email: user.email,
        subject: 'Account activation',
        template: 'activation-mail.ejs',
        data,
      });

      res.status(201).json({
        success: true,
        message: `An email has been sent to ${user.email}. Please activate your account`,
        activationToken: activationToken.token,

      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400))
    }

  } catch (error: any) {
    return next(new ErrorHandler(error.message, 400))
  }

});

interface IActivationToken {
  token: string;
  activationCode: string;
}


export const createActivationToken = (user: any): IActivationToken => {
  const activationCode = Math.floor(1000 * Math.random() * 9000).toString();
  const token = jwt.sign({ user, activationCode }, process.env.ACTIVATION_SECRET as Secret, { expiresIn: '5m' });
  return { token, activationCode };
};


// Activate a user => /api/v1/activate-user
interface IActivationRequest {
  activation_token: string;
  activation_code: string;
}


export const activateUser = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { activation_token, activation_code } = req.body as IActivationRequest;

    const newUser: { user: IUser; activationCode: string } = jwt.verify(activation_token, process.env.ACTIVATION_SECRET as string) as { user: IUser; activationCode: string };

    if (newUser.activationCode !== activation_code) {
      return next(new ErrorHandler('Invalid activation code', 400));
    }

    const { name, email, password } = newUser.user;

    // check if user exist
    const existUser = await userModel.findOne({ email });
    if (existUser) {
      return next(new ErrorHandler('User already exist', 400));
    }

    const user = await userModel.create({
      name,
      email,
      password,
    });

    res.status(201).json({
      success: true,
      message: 'Account activated successfully',
      user,
    });

  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});


// Login user => /api/v1/login
interface ILoginRequest {
  email: string;
  password: string;
}

export const loginUser = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body as ILoginRequest;

    if (!email || !password) {
      return next(new ErrorHandler('Please enter email & password', 400));
    };

    const user = await userModel.findOne({ email }).select('+password');

    if (!user) {
      return next(new ErrorHandler('Invalid email or password', 401));
    };

    const isPasswordMatched = await user.comparePassword(password);
    if (!isPasswordMatched) {
      return next(new ErrorHandler('Invalid email or password', 401));
    };

    sendToken(user, 200, res);
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});


// Logout user => /api/v1/logout
export const logoutUser = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.cookie('access_token', "", { maxAge: 1 });
    res.cookie('refresh_token', "", { maxAge: 1 });
    const userId = req.user?._id || '';
    redis.del(userId);
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });


  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});


// update access token => /api/v1/refresh-token
export const updateAccessToken = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refresh_token = req.cookies.refresh_token;
    const decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN as string) as JwtPayload;
    const message = 'Could not refresh token';

    if (!decoded) {
      return next(new ErrorHandler(message, 400));
    };

    const session = await redis.get(decoded.id as string);

    if (!session) {
      return next(new ErrorHandler(message, 400));
    };

    const user = JSON.parse(session);

    const accessToken = jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN as string, { expiresIn: '5m' });
    const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN as string, { expiresIn: '3d' });

    res.cookie('access_token', accessToken, accessTokenOptions);
    res.cookie('refresh_token', refreshToken, refreshTokenOptions);

    res.status(200).json({
      success: "success",
      message: 'Access token refreshed',
      accessToken,
    });

  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});


// get user info
export const getUserInfo = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    getUserById(userId, res);
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

interface ISocialAuthBody {
  name: string;
  email: string;
  avatar: string;

}

// social auth
export const socialAuth = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, avatar } = req.body as ISocialAuthBody;
    const user = await userModel.findOne({ email });
    if (!user) {
      const newUser = await userModel.create({
        name,
        email,
        avatar,
      });
      sendToken(newUser, 200, res);
    } else {
      sendToken(user, 200, res);
    }
  }
  catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});