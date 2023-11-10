import express from 'express';
import { activateUser, loginUser, logoutUser, registerUser, updateAccessToken } from '../controllers/user.controller';
import { authorizeRoles, isAuthenticated } from '../middleware/auth';

const userRouter = express.Router();

userRouter.post('/register-user', registerUser);

userRouter.post('/activate-user', activateUser);

userRouter.post('/login', loginUser);

userRouter.get('/logout', isAuthenticated, logoutUser);

userRouter.get('/refreshtoken', updateAccessToken);


export default userRouter;