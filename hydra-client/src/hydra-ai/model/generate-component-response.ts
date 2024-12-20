import { ReactElement } from "react";
import { SuggestedAction } from "./component-choice";

export interface GenerateComponentResponse {
  component?: ReactElement | null;
  message: string;
  stage: GenerationStage;
  loading: boolean;
  suggestedActions?: SuggestedAction[];
}

export enum GenerationStage {
  CHOOSING_COMPONENT = 'CHOOSING_COMPONENT',
  FETCHING_CONTEXT = 'FETCHING_CONTEXT',
  HYDRATING_COMPONENT = 'HYDRATING_COMPONENT',
  COMPLETE = 'COMPLETE'
}