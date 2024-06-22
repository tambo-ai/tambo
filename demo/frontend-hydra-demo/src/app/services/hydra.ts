import Hydra from "hydra-ai-backup";
import ProfilePhotosRow from "../components/profile-photos-row";
import { ProfilePhotoPropsArray } from "../components/types";

export const initHydra = (openAIKey: string) => {
  const hydra = new Hydra(openAIKey);

  hydra.registerComponent(
    "profilephotosrow",
    ProfilePhotosRow,
    ProfilePhotoPropsArray
  );
  return hydra;
};
