import { app } from './app';
import 'dotenv/config';
import connectDB from './utils/db';


//create server
app.listen(process.env.PORT || 8800, () => {
  console.log(`Server running on port ${process.env.PORT}`);
  connectDB();
});