import { IsNotEmpty } from 'class-validator';

export class UserDto {
  @IsNotEmpty()
  authId?: string;
  username?: string;
  @IsNotEmpty()
  email?: string;
  avatarUrl?: string;
}
