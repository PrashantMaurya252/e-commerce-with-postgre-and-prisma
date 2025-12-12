import { User } from "../src/utils/jwt.ts";

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}