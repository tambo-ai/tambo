interface ComponentPropsMetadata {
  type: string;
}

export class ExtractComponentResponseDto {
  name?: string;
  description?: string;
  propsDefinition?: ComponentPropsMetadata;
  isDefaultExport?: boolean;
  srcfileName?: string;
}
