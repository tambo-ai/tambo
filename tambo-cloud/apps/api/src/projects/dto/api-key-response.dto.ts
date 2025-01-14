export class APIKeyResponseDto {
  id?: string;
  name?: string;
  partiallyHiddenKey?: string;
  lastUsed?: Date;
  created?: Date;
  createdByUserId?: string;
}
