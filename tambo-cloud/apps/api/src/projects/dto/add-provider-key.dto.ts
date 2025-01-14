import { IsString } from 'class-validator';

export class AddProviderKeyDto {
  @IsString()
  providerName?: string;

  @IsString()
  providerKey?: string;
}
