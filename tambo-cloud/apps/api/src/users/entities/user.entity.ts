import { IsNotEmpty } from "class-validator";

export class User {
  @IsNotEmpty()
  id?: string;
  @IsNotEmpty()
  authId?: string;
  username?: string;
  email?: string;
  avatarUrl?: string;
}
