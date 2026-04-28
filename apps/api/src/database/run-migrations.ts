import 'reflect-metadata';

import { AppDataSource } from './data-source';

async function main() {
  await AppDataSource.initialize();
  const migrations = await AppDataSource.runMigrations();
  console.log(`Ran ${migrations.length} migrations`);
  await AppDataSource.destroy();
  process.exit(0);
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
