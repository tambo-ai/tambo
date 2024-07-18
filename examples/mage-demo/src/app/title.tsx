import Link from "next/link";

export const Title = () => {
  return (
    <div className="p-3 text-center">
      <div>
        Mage - a{" "}
        <Link
          href={"https://github.com/michaelmagan/hydraai"}
          className="text-blue-500"
        >
          Hydra
        </Link>{" "}
        demo by{" "}
        <Link href={"https://x.com/michael_milst"} className="text-blue-500">
          Michael Milstead
        </Link>
      </div>
      <div className="text-xs">
        note: this demo uses fake profiles and discussions
      </div>
      <div className="text-xs">
        see <Link href={"/all-components"}>/all-components</Link> for a list of
        all components Hydra knows about
      </div>
    </div>
  );
};
