import { TamboComponent } from "../../model/component-metadata";
import { FileUpload } from "./FileUpload";
import { fileUploadPropsSchema } from "./FileUpload.types";

export const fileUploadComponent: TamboComponent = {
  name: "FileUpload",
  description:
    "Accessible uploader with drag-drop, paste, pre-validation, progress, cancel/retry, and chunking hook",
  component: FileUpload,
  propsSchema: fileUploadPropsSchema,
  associatedTools: [],
};
