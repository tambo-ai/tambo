import {
  clerkClient,
  clerkMiddleware,
  getAuth,
  requireAuth,
} from "@clerk/express";
import cors from "cors";
import express, { Request, Response } from "express";
import { ENV_PARSER } from "./utils/configEnv";

const app: express.Application = express();

app.use(clerkMiddleware());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: ENV_PARSER.CLIENT_URL,
  }),
);

app.get("/", (req: Request, res: Response) => {
  res.send("Hello from the API!");
});

app.get("/protected", requireAuth(), async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const user = await clerkClient.users.getUser(userId);

  return res.json({ user });
});

const PORT = ENV_PARSER.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API server is running on http://localhost:${PORT}`);
});
