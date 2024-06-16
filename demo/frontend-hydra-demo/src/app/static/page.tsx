"use client";

import ProfilePhotosRow from "../components/profile-photos-row";
import { ProfilePhotoPropsArray } from "../components/types";

const exampleProfiles: ProfilePhotoPropsArray = {
  profiles: [
    {
      container: {
        className: "profile-photo bg-black text-white p-4 rounded-lg",
      },
      info: {
        className: "profile-photo__info p-2",
        name: "John Doe",
        nameClass: "profile-photo__name text-lg font-bold",
        description: "Software Engineer",
        descriptionClass: "profile-photo__description text-sm",
      },
      image: {
        url: "/profile_1.webp",
        className: "profile-photo__image w-full h-32 object-cover rounded-t-lg",
      },
    },
    {
      container: {
        className: "profile-photo bg-black text-white p-4 rounded-lg",
      },
      info: {
        className: "profile-photo__info p-2",
        name: "Jane Smith",
        nameClass: "profile-photo__name text-lg font-bold",
        description: "Product Manager",
        descriptionClass: "profile-photo__description text-sm",
      },
      image: {
        url: "/profile_1.webp",
        className: "profile-photo__image w-full h-32 object-cover rounded-t-lg",
      },
    },
  ],
};

export default function Page() {
  return (
    <div className="p-4">
      <ProfilePhotosRow {...exampleProfiles} />
    </div>
  );
}
