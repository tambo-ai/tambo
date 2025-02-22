import { ApiSchema } from '@nestjs/swagger';

interface ComponentPropsMetadata {
  type: string;
}

@ApiSchema({ name: 'ExtractComponentResponse' })
export class ExtractComponentResponseDto {
  name?: string;
  description?: string;
  propsDefinition?: ComponentPropsMetadata;
  isDefaultExport?: boolean;
  srcfileName?: string;
}
