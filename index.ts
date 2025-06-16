import { generateAllReports } from './src/generator';

async function main() {
  try {
    await generateAllReports();
    process.exit(0);
  } catch (error) {
    console.error('Failed to generate reports:', error);
    process.exit(1);
  }
}

main();