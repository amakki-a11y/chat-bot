const { execSync } = require('child_process');

/**
 * Migration helper script.
 * Runs Prisma migration in development mode.
 */
const run = () => {
  try {
    console.log('Running Prisma migrations...');
    execSync('npx prisma migrate dev', { stdio: 'inherit' });
    console.log('Migrations completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
};

run();
