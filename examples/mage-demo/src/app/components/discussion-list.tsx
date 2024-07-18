import { Discussion } from "../model/discussion";
import { DiscussionCard } from "./discussion-card";

interface DiscussionListProps {
  discussions: Discussion[];
}

export const DiscussionList = ({ discussions }: DiscussionListProps) => {
  return (
    <div className=" flex flex-col ">
      {discussions.map((discussion) => (
        <DiscussionCard key={discussion.id} discussion={discussion} />
      ))}
    </div>
  );
};
