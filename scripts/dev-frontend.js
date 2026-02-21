const { spawn } = require('child_process');
const path = require('path');

const clientDir = path.join(__dirname, '..', 'client');
const child = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', '5173'], {
  cwd: clientDir,
  stdio: 'inherit',
});

child.on('exit', (code) => process.exit(code));
