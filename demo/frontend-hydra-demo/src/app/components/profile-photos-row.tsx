"use client";

import Image from "next/image";
import { ProfilePhotoProps, ProfilePhotoPropsArray } from "./types";

function ProfilePhoto(props: ProfilePhotoProps) {
  if (!props) return <div>No profile data provided</div>;

  return (
    <div className={props.container?.className}>
      {props.image?.url && (
        <Image
          src={props.image.url}
          alt={props.info?.name || ""}
          width={500}
          height={500}
          className={props.image.className}
        />
      )}
      {(props.info?.name || props.info?.description) && (
        <div className={props.info.className}>
          {props.info.name && (
            <h3 className={props.info.nameClass}>{props.info.name}</h3>
          )}
          {props.info.description && (
            <p className={props.info.descriptionClass}>
              {props.info.description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ProfilePhotosRow(props: ProfilePhotoPropsArray) {
  const profiles = props.profiles;
  if (!profiles || profiles.length === 0) {
    return (
      <div className="profile-photos-row flex space-x-4">
        No profiles available
      </div>
    );
  }

  return (
    <div className="profile-photos-row flex space-x-4">
      {profiles.map((profile, index) => (
        <ProfilePhoto key={index} {...profile} />
      ))}
    </div>
  );
}

export default ProfilePhotosRow;
