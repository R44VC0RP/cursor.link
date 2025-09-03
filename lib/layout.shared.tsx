import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: 'cursor.link',
      transparentMode: 'none',
    },
    links: [
      {
        type: 'button',
        text: 'CLI',
        url: '/docs/cli',
      },
    ],
  };
}