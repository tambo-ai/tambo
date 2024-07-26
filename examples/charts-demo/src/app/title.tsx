import Link from "next/link";

export const Title = () => {
  return (
    <div className="p-3 text-start">
      <div>HydraCharts</div>
      <div>
        a{" "}
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
    </div>
  );
};
