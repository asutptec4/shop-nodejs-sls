const { build } = require('esbuild');

(async () =>
  await build({
    entryPoints: ['src/index.js'],
    bundle: true,
    platform: 'node',
    target: ['node16'],
    outfile: 'import-service.js',
  }))();
