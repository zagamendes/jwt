import express from 'express';
import dotenv from 'dotenv';
import userRouter from './routers/usersRouter';
import jwt from 'jsonwebtoken';
import cookieparser from 'cookie-parser';

import cors from 'cors';

dotenv.config();
const app = express();
app.use(express.json());
app.use(cookieparser());
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
);
const users = [
  { name: 'izaac', type: 1 },
  { name: 'jorge', type: 2 },
  { name: 'gabriel', type: 1 },
];

app.use('/users', userRouter);

app.post('/login', (req, res) => {
  const { name } = req.body.data ?? req.body;
  console.log('zzz', req.cookies);

  const user = users.filter((user) => user.name == name).shift();

  const token = jwt.sign({ user }, process.env.TOKEN, { expiresIn: '10s' });
  const refreshToken = jwt.sign({ user }, process.env.TOKEN, {
    expiresIn: '20s',
  });

  res
    .cookie('accessToken', token)
    .cookie('refreshToken', refreshToken, { httpOnly: true })
    .send({
      token,
      refreshToken,
    });
});

app.post('/refreshToken', async (req, res) => {
  const refreshToken = req.headers.authorization.split(' ').pop();
  let result: any;

  if (!refreshToken)
    return res.status(401).send({ message: 'token is missing' });
  try {
    result = await jwt.verify(refreshToken, process.env.TOKEN);
    const accessToken = jwt.sign({ user: result.user }, process.env.TOKEN, {
      expiresIn: '10s',
    });
    const newRefreshToken = jwt.sign({ user: result.user }, process.env.TOKEN, {
      expiresIn: '1m',
    });

    res
      .cookie('accessToken', accessToken)

      .send({ token: accessToken, refreshToken: newRefreshToken });
  } catch (e) {
    res.status(401).send('no Token');
  }
});

app.listen(process.env.PORT, () =>
  console.log(`running on http://localhost:${process.env.PORT} 🔥`)
);
