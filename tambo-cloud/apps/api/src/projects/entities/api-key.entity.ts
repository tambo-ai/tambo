export class APIKey {
  id?: string;
  name?: string;
  hashedKey?: string;
  partiallyHiddenKey?: string;
  lastUsed?: Date;
  created?: Date;
  createdByUserId?: string;
}
