import express from 'express';
import { activateUser, getUserInfo, loginUser, logoutUser, registerUser, socialAuth, updateAccessToken } from '../controllers/user.controller';
import { authorizeRoles, isAuthenticated } from '../middleware/auth';

const userRouter = express.Router();

userRouter.post('/register-user', registerUser);

userRouter.post('/activate-user', activateUser);

userRouter.post('/login', loginUser);

userRouter.get('/logout', isAuthenticated, logoutUser);

userRouter.get('/refresh', updateAccessToken);

userRouter.get('/me', isAuthenticated, getUserInfo);

userRouter.post('/social-auth', socialAuth);


export default userRouter;