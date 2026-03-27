import type { V2PageContent } from '../types';

export const V2_PAGE_TEMPLATES: { id: string; name: string; content: V2PageContent }[] = [
  {
    id: 'minimal',
    name: 'Minimal (header + text + footer)',
    content: {
      labels: {},
      blocks: [
        {
          id: 'blk_header_01',
          type: 'header',
          visibility: true,
          props: { title: 'Page title', subtitle: '', metaLeft: '', metaRight: '' },
        },
        {
          id: 'blk_richtext_01',
          type: 'richText',
          visibility: true,
          props: { content: '<p>Start writing…</p>' },
        },
        {
          id: 'blk_footer_01',
          type: 'footer',
          visibility: true,
          props: { shopName: '', tagline: '', location: '', linkUrl: '' },
        },
      ],
      meta: { schemaVersion: 1 },
    },
  },
  {
    id: 'gallery',
    name: 'Gallery + CTA',
    content: {
      labels: {},
      blocks: [
        {
          id: 'blk_header_01',
          type: 'header',
          visibility: true,
          props: { title: 'Gallery', subtitle: 'Photos', metaLeft: '', metaRight: '' },
        },
        {
          id: 'blk_grid_01',
          type: 'imageGrid',
          visibility: true,
          props: { images: [] },
        },
        {
          id: 'blk_cta_01',
          type: 'cta',
          visibility: true,
          props: { label: 'Contact us', href: '#' },
        },
        {
          id: 'blk_footer_01',
          type: 'footer',
          visibility: true,
          props: { shopName: '', tagline: '', location: '', linkUrl: '' },
        },
      ],
      meta: { schemaVersion: 1 },
    },
  },
];
