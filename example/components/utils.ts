import * as fa from "react-icons/fa";
import { ComponentType } from "react";

export function getIconComponent(
  iconComponent: string | undefined,
): ComponentType<React.SVGProps<SVGSVGElement>> | null {
  return iconComponent
    ? (fa[iconComponent as keyof typeof fa] as ComponentType<
        React.SVGProps<SVGSVGElement>
      >)
    : null;
}
