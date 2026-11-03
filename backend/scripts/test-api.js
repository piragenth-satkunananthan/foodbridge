const { execFileSync, spawnSync } = require('node:child_process');
const { randomUUID } = require('node:crypto');
const path = require('node:path');
const mongoose = require('mongoose');
const name = `foodbridge-test-${randomUUID().slice(0, 8)}`;
const docker = (...args) =>
  execFileSync('docker', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  }).trim();
(async () => {
  let started = false;
  try {
    docker(
      'run',
      '--rm',
      '-d',
      '--name',
      name,
      '-p',
      '127.0.0.1::27017',
      'mongo:latest',
      '--replSet',
      'rs0',
      '--bind_ip_all'
    );
    started = true;
    const port = docker('port', name, '27017/tcp').split(':').pop();
    const uri = `mongodb://127.0.0.1:${port}/foodbridge_test_${name.replaceAll('-', '_')}?directConnection=true`;
    for (let i = 0; i < 60; i++) {
      try {
        docker(
          'exec',
          name,
          'mongosh',
          '--quiet',
          '--eval',
          'rs.initiate({_id:"rs0",members:[{_id:0,host:"127.0.0.1:27017"}]})'
        );
        break;
      } catch {
        if (i === 59) throw new Error('Test MongoDB did not start');
        await new Promise((r) => setTimeout(r, 500));
      }
    }
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    for (let i = 0; i < 60; i++) {
      if (
        (await mongoose.connection.db.admin().command({ hello: 1 }))
          .isWritablePrimary
      )
        break;
      if (i === 59) throw new Error('Test replica set did not become primary');
      await new Promise((r) => setTimeout(r, 500));
    }
    await mongoose.disconnect();
    const files = process.argv.slice(2);
    const testFiles = files.length
      ? files
      : require('node:fs')
          .readdirSync(path.resolve(__dirname, '../test'))
          .filter((file) => file.endsWith('.test.js'))
          .map((file) => `test/${file}`);
    const testArgs = ['--test', '--test-concurrency=1', ...testFiles];
    const env = {
      ...process.env,
      MONGO_URI: uri,
      JWT_SECRET: randomUUID(),
      NODE_ENV: 'test'
    };
    const image = process.env.TEST_NODE_IMAGE;
    const result = spawnSync(
      image ? 'docker' : process.execPath,
      image
        ? [
            'run',
            '--rm',
            '--network',
            'host',
            '-e',
            'MONGO_URI',
            '-e',
            'JWT_SECRET',
            '-e',
            'NODE_ENV',
            image,
            'node',
            ...testArgs
          ]
        : testArgs,
      { cwd: path.resolve(__dirname, '..'), stdio: 'inherit', env }
    );
    process.exitCode = result.status ?? 1;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    if (started) docker('stop', name);
  }
})();
