import express from "express";
import dotenv from "dotenv";
import userRouter from "./routers/usersRouter";
import jwt from "jsonwebtoken";
import cookieparser from "cookie-parser";
import dayjs from "dayjs";
import cors from "cors";
dotenv.config();
const app = express();
app.use(express.json());
app.use(cookieparser());
app.use(cors());
const users = [
  { name: "izaac", type: 1 },
  { name: "jorge", type: 2 },
  { name: "gabriel", type: 1 },
];
let refreshTokens = [];

app.use("/users", userRouter);

app.post("/login", (req, res) => {
  const { name } = req.body.data ?? req.body;

  const user = users.filter((user) => user.name == name).shift();

  const token = jwt.sign({ user }, process.env.TOKEN, { expiresIn: "10s" });
  const refreshToken = jwt.sign({ user }, process.env.TOKEN);
  const expiresIn = dayjs().add(45, "s");
  refreshTokens.push({ token: refreshToken, expiresIn, user });
  res.send({ token, refreshToken });
});

app.post("/refreshToken", (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(401).send({ message: "token is missing" });
  const refreshTokenFromDB = refreshTokens.filter(
    (currentRefreshToken) => currentRefreshToken.token == refreshToken
  );
  if (refreshTokenFromDB.length == 0)
    return res.status(403).send({ message: "invalid token" });
  const [info] = refreshTokenFromDB;
  const { user } = info;

  const isExpired = dayjs().isAfter(info.expiresIn);

  if (isExpired) {
    refreshTokens = refreshTokens.filter(
      (currentRefreshToken) => currentRefreshToken.token != refreshToken
    );

    const token = jwt.sign({ user }, process.env.TOKEN, { expiresIn: "10s" });

    const newRefreshToken = jwt.sign({ user }, process.env.TOKEN);
    const expiresIn = dayjs().add(1, "m");
    refreshTokens.push({ token: newRefreshToken, expiresIn, user });
    res
      .cookie("token", token)
      .cookie("refreshToken", newRefreshToken)
      .send({ token, refreshToken });
  } else {
    jwt.verify(refreshToken, process.env.TOKEN, (err, result) => {
      if (err) return res.status(403).send({ message: "invalid token" });

      const user = result.user;
      const token = jwt.sign({ user }, process.env.TOKEN, { expiresIn: "10s" });
      res.cookie("token", token).send({ token });
    });
  }
});

app.listen(process.env.PORT, () =>
  console.log(`running on http://localhost:${process.env.PORT} 🔥`)
);
