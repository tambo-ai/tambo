import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import Image from 'next/image';

export const baseOptions: BaseLayoutProps = {
  nav: {
    title: (
      <Image
        src="/logo/lockup/Tambo-Lockup.svg"
        alt="Tambo Lockup"
        width={100}
        height={26}
        className="h-7 w-auto"
      />
    ),
  },
  // see https://fumadocs.dev/docs/ui/navigation/links
  links: [],
};
