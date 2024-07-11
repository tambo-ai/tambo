import { Profile } from "../model/profile";

interface ProfileCardListProps {
  profiles: Profile[];
}

export const ProfileCardList = ({ profiles }: ProfileCardListProps) => {
  return (
    <div>
      {profiles.map((profile) => (
        <div key={profile.id}>
          <img src={profile.imageUrl} alt={profile.name} />
          <h2>{profile.name}</h2>

          <p>{profile.about}</p>
        </div>
      ))}
    </div>
  );
};
