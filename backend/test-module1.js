// Retained entry point; all writes use the disposable database runner.
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const result = spawnSync(
  process.execPath,
  [path.join(__dirname, 'scripts/test-api.js'), 'test/posting.test.js'],
  { stdio: 'inherit' }
);
process.exitCode = result.status || (result.error ? 1 : 0);
