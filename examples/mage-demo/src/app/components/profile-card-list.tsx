import { Profile } from "../model/profile";

interface ProfileCardListProps {
  profiles: Profile[];
}

export const ProfileCardList = ({ profiles }: ProfileCardListProps) => {
  return (
    <div className=" flex flex-row overflow-auto">
      {profiles.map((profile) => (
        <div
          key={profile.id}
          className={
            "w-60 h-60 min-w-[200px] flex flex-col items-center m-4 bg-white rounded-lg shadow-lg"
          }
        >
          <div className="h-[60%] w-full bg-[#B5D3BF] rounded-lg flex justify-center items-center">
            <img
              src={profile.imageUrl}
              alt={profile.name}
              className="rounded-full h-[60px] w-[60px]"
            />
          </div>
          <div className="p-4 text-center">
            <h2>{profile.name}</h2>

            <p className="text-xs p-2">{profile.about}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
