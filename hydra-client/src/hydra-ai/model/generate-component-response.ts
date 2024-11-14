import { ReactElement } from "react";

export interface GenerateComponentResponse {
  component?: ReactElement | null;
  message: string;
  stage: GenerationStage;
  loading: boolean;
}

export enum GenerationStage {
  CHOOSING_COMPONENT = 'CHOOSING_COMPONENT',
  FETCHING_CONTEXT = 'FETCHING_CONTEXT',
  HYDRATING_COMPONENT = 'HYDRATING_COMPONENT',
  COMPLETE = 'COMPLETE'
}