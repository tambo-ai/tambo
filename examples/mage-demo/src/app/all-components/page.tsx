import { DiscussionList } from "../components/discussion-list";
import { ProfileCardList } from "../components/profile-card-list";
import { SendMessage } from "../components/send-message";
import { sampleDiscussions } from "../services/discussion-service";
import { sampleProfiles } from "../services/profile-service";

export default function AllComponentsPage() {
  return (
    <div
      className="flex flex-col min-h-screen  text-black p-4 justify-center items-center"
      style={{ backgroundColor: "#AAB7B5" }}
    >
      <div className="p-3 text-center">
        <div className="text-xs">
          These are the components Hydra knows about
        </div>
      </div>
      <div className=" w-full max-w-xl flex flex-col items-center">
        <ProfileCardList profiles={[sampleProfiles[0]]} />
        <SendMessage
          message={{ id: "0", to: "Michael", message: "hi Michael" }}
        />
        <DiscussionList discussions={sampleDiscussions} />
      </div>
    </div>
  );
}
