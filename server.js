import { config } from 'dotenv';
import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import cors from 'cors';
import corsOptions from './config/corsOptions.js';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import connectDB from './config/dbConn.js';

// Routes
import subdirRoute from './routes/subdir.js';
import rootRoute from './routes/root.js';
import employeeApiRoute from './routes/api/employees.js';
import reigisterUserRoute from './routes/api/register.js';
import authRouter from './routes/api/auth.js';
import refreshRouter from './routes/api/refreshToken.js';
import logoutRouter from './routes/api/logout.js';

// Middlewares
import logger from './middleware/logEvents.js';
import errorHandler from './middleware/errorHandler.js';
import verifyJWT from './middleware/verifyJWT.js';
import credentials from './middleware/credentials.js';

config();

// Connect to DB
connectDB();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3500;
const app = express();

// custom middleware logger
app.use(logger);

// Handle options credentials check - before CORS
// and fetch cookies credentials requirement
app.use(credentials);

// cors = cross origin resource sharing
app.use(cors(corsOptions));

// built-in middleware to handle urlencoded data
// in other words, form data:
// content-type: application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: false }));

// built-in middleware for json
app.use(express.json());

// set cookies
app.use(cookieParser());

// serve static files
app.use('/', express.static(path.join(__dirname, '/public')));
app.use('/subdir', express.static(path.join(__dirname, '/public')));

// routes
app.use('/', rootRoute);
app.use('/subdir', subdirRoute);
app.use('/register', reigisterUserRoute);
app.use('/auth', authRouter);
app.use('/refresh', refreshRouter);
app.use('/logout', logoutRouter);

app.use(verifyJWT);
app.use('/employees', employeeApiRoute);

app.all('*', (req, res) => {
  res.status(404);
  if (req.accepts('html')) {
    res.sendFile(path.join(__dirname, 'views', '404.html'));
  } else if (req.accepts('json')) {
    res.json({ error: '404 Not Found' });
  } else {
    res.type('txt').send('404 Not Found');
  }
});

app.use(errorHandler);

mongoose.connection.once('open', () => {
  console.log('Connected to DB');
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
