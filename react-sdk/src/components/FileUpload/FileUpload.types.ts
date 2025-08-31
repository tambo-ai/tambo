import { z } from "zod";

// File upload status enum
export const fileStatusSchema = z.enum([
  "pending",
  "uploading",
  "success",
  "error",
  "cancelled",
]);

// Individual file with metadata
export const uploadFileSchema = z.object({
  id: z.string(),
  file: z.any(), // File object
  status: fileStatusSchema,
  progress: z.number().min(0).max(100),
  error: z.string().optional(),
  url: z.string().optional(), // Result URL after upload
});

// Props schema following issue requirements
export const fileUploadPropsSchema = z.object({
  accept: z
    .string()
    .optional()
    .describe("Accepted file types (e.g., '.jpg,.png,.pdf')"),
  multiple: z
    .boolean()
    .optional()
    .default(false)
    .describe("Allow multiple file selection"),
  maxSizeMB: z
    .number()
    .positive()
    .optional()
    .describe("Maximum file size in megabytes"),
  uploader: z
    .function()
    .args(
      z.array(z.any()), // files array
      z.function().args(z.string(), z.number()).returns(z.void()), // onProgress callback
    )
    .returns(z.promise(z.array(z.string())))
    .describe("Upload function that returns file references"),
  disabled: z.boolean().optional().default(false),
  className: z.string().optional(),
  children: z.any().optional().describe("Custom content for drop zone"),
});

export type FileUploadProps = z.infer<typeof fileUploadPropsSchema>;
export type UploadFile = z.infer<typeof uploadFileSchema>;
export type FileStatus = z.infer<typeof fileStatusSchema>;
