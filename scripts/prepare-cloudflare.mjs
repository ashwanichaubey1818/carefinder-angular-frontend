import {
  copyFileSync,
  existsSync
} from 'node:fs';

const source = new URL(
  '../dist/health-insurance-locator/browser/index.csr.html',
  import.meta.url
);

const target = new URL(
  '../dist/health-insurance-locator/browser/index.html',
  import.meta.url
);

if (!existsSync(source)) {
  throw new Error(
    'Angular CSR index file was not generated.'
  );
}

copyFileSync(
  source,
  target
);

console.log(
  'Created browser/index.html for Cloudflare Workers.'
);
