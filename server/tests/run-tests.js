import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const testFiles = [
  'test-core.js',
  'test-auth.js',
  'test-events.js',
  'test-rsvp-reminders.js',
  'test-share.js',
  'test-chat.js'
];

async function runAll() {
  console.log('🚀 Running EventPulse Server Test Suite...\n');

  for (const file of testFiles) {
    const fullPath = path.join(__dirname, file);
    console.log(`==================== [ ${file} ] ====================`);
    await new Promise((resolve, reject) => {
      const p = spawn('node', [fullPath], { stdio: 'inherit' });
      p.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`${file} failed with exit code ${code}`));
      });
    });
    console.log('');
  }

  console.log('✨ ALL EVENTPULSE SERVER TESTS PASSED SUCCESSFULLY! ✨');
}

runAll().catch((err) => {
  console.error('\n❌ Test suite failed:', err.message);
  process.exit(1);
});
