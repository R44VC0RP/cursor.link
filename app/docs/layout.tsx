import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { Banner } from 'fumadocs-ui/components/banner';
import { baseOptions } from '@/lib/layout.shared';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <DocsLayout tree={source.pageTree} {...baseOptions()}>
      <Banner id="cursorlink-announcement" variant="rainbow" className="[--color-fd-primary:#70A7D7]">
        New: Install rules with CLI and explore the community Feed.
      </Banner>
      {children}
    </DocsLayout>
  );
}