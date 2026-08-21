const os = require('os');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal && !iface.address.startsWith('169.254')) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const localIp = getLocalIp();
const appJsonPath = path.join(__dirname, '..', 'app.json');

if (fs.existsSync(appJsonPath)) {
  try {
    let content = fs.readFileSync(appJsonPath, 'utf8');
    content = content.replace(/"apiBaseUrl":\s*"http:\/\/[^"]+"/, `"apiBaseUrl": "http://${localIp}:8000/api/v1"`);
    fs.writeFileSync(appJsonPath, content, 'utf8');
    console.log(`\x1b[32m✔ Dexter API Base URL bound to: http://${localIp}:8000/api/v1\x1b[0m`);
  } catch (err) {
    console.warn('Could not update app.json:', err.message);
  }
}

// Pass any additional CLI args to expo
const args = ['expo', 'start', ...process.argv.slice(2)];
const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const child = spawn(npxCmd, args, {
  stdio: 'inherit',
  shell: true,
  cwd: path.join(__dirname, '..'),
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
