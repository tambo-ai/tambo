import { IsString } from "class-validator";

export class AddProviderKeyRequest {
  @IsString()
  providerName?: string;

  @IsString()
  providerKey?: string;
}
