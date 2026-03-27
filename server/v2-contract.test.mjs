import { test } from 'node:test';
import assert from 'node:assert';
import { lintV2ContentForPublish } from './v2.js';

test('lintV2ContentForPublish passes minimal valid blocks', () => {
  const r = lintV2ContentForPublish({
    labels: {},
    blocks: [
      { id: 'a', type: 'header', visibility: true, props: { title: 'T', subtitle: '', metaLeft: '', metaRight: '' } },
      { id: 'b', type: 'image', visibility: true, props: { src: '/x.jpg', alt: 'ok' } },
    ],
    meta: { schemaVersion: 1 },
  });
  assert.equal(r.errors.length, 0);
});

test('lintV2ContentForPublish errors on empty header title when visible', () => {
  const r = lintV2ContentForPublish({
    labels: {},
    blocks: [{ id: 'a', type: 'header', visibility: true, props: { title: '  ', subtitle: '' } }],
    meta: {},
  });
  assert.ok(r.errors.some((e) => e.message.includes('Header')));
});
