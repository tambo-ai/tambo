import { IsNotEmpty } from 'class-validator';

export class ProjectDto {
  name?: string;
  @IsNotEmpty()
  userId?: string;
}
