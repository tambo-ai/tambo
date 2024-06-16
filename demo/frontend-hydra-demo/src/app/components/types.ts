import { z } from "zod";

// line-graph-component types
const DataPoint = z.object({
  timestamp: z.string().describe("Timestamp of the data point"),
  value: z.string().describe("Value of the data point"),
});

const Series = z
  .object({
    label: z.string().describe("Label for the series"),
    data: z.array(DataPoint).describe("Array of data points"),
    lineColor: z
      .string()
      .regex(/^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/)
      .describe("RGB for color of the line in the format rgb(r, g, b)"),
  })
  .describe("If not prompted generate at least 10 data points.");

export const LineGraphProps = z.object({
  backgroundColor: z
    .string()
    .default("bg-white")
    .describe("This is tailwinds class for the background color"),
  titleClassName: z.string().describe("Tailwinds class for the title"),
  title: z.string().describe("Title of the line graph"),
  descriptionClassName: z
    .string()
    .describe("Tailwinds class for the description"),
  description: z.string().describe("Description of the line graph"),
  series: z
    .array(Series)
    .describe(
      "Array of series data for the line graph. Make sure the timestamps of the data overlaps."
    ),
});

// profile-photos-row types
export const ProfilePhotoProps = z
  .object({
    container: z
      .object({
        className: z
          .string()
          .default("profile-photo bg-black text-white p-4 rounded-lg")
          .optional(),
      })
      .optional(),
    info: z
      .object({
        className: z.string().default("profile-photo__info p-2").optional(),
        name: z.string().optional(),
        nameClass: z
          .string()
          .default("profile-photo__name text-lg font-bold")
          .optional(),
        description: z.string().optional(),
        descriptionClass: z
          .string()
          .default("profile-photo__description text-sm")
          .optional(),
      })
      .optional(),
    image: z
      .object({
        url: z
          .string()
          .default("/profile_1.webp")
          .optional()
          .describe("always use default image as a relative url."),
        className: z
          .string()
          .default("profile-photo__image w-full h-32 object-cover rounded-t-lg")
          .optional(),
      })
      .optional(),
  })
  .optional();

export type ProfilePhotoProps = z.infer<typeof ProfilePhotoProps>;
export const ProfilePhotoPropsArray = z.object({
  profiles: z
    .array(ProfilePhotoProps)
    .min(1)
    .max(3)
    .describe(
      "Array of profile photos with a minimum of 1 and a maximum of 3 items."
    ),
});
export type ProfilePhotoPropsArray = z.infer<typeof ProfilePhotoPropsArray>;
