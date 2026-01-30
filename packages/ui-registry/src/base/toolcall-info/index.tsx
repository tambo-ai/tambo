"use client";

import { ToolcallInfoContent } from "./content/toolcall-info-content";
import { ToolcallInfoParameters } from "./parameters/toolcall-info-parameters";
import { ToolcallInfoResult } from "./result/toolcall-info-result";
import { ToolcallInfoRoot } from "./root/toolcall-info-root";
import { ToolcallInfoStatusIcon } from "./status-icon/toolcall-info-status-icon";
import { ToolcallInfoStatusText } from "./status-text/toolcall-info-status-text";
import { ToolcallInfoToolName } from "./tool-name/toolcall-info-tool-name";
import { ToolcallInfoTrigger } from "./trigger/toolcall-info-trigger";

/**
 * ToolcallInfo namespace containing all toolcall info base components.
 */
const ToolcallInfo = {
  Root: ToolcallInfoRoot,
  Trigger: ToolcallInfoTrigger,
  Content: ToolcallInfoContent,
  StatusIcon: ToolcallInfoStatusIcon,
  StatusText: ToolcallInfoStatusText,
  ToolName: ToolcallInfoToolName,
  Parameters: ToolcallInfoParameters,
  Result: ToolcallInfoResult,
};

export type { ToolcallInfoContentProps } from "./content/toolcall-info-content";
export type {
  ToolcallInfoParametersProps,
  ToolcallInfoParametersRenderProps,
} from "./parameters/toolcall-info-parameters";
export type {
  ToolcallInfoResultProps,
  ToolcallInfoResultRenderProps,
} from "./result/toolcall-info-result";
export type { ToolcallInfoRootProps } from "./root/toolcall-info-root";
export type {
  ToolcallInfoStatusIconProps,
  ToolcallInfoStatusIconRenderProps,
  ToolStatus as ToolcallInfoToolStatus,
} from "./status-icon/toolcall-info-status-icon";
export type { ToolcallInfoStatusTextProps } from "./status-text/toolcall-info-status-text";
export type {
  ToolcallInfoToolNameProps,
  ToolcallInfoToolNameRenderProps,
} from "./tool-name/toolcall-info-tool-name";
export type { ToolcallInfoTriggerProps } from "./trigger/toolcall-info-trigger";

export { ToolcallInfo };
