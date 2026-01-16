import inquirer from 'inquirer';
import { execSync } from 'child_process';
import dotenv from 'dotenv';
import { migrateToPhrase } from './migrate';

// Load environment variables from .env file
dotenv.config();

interface ProjectType {
  name: string;
  value: 'trade' | 'pages';
}

async function main(): Promise<void> {
  console.log('🚀 Starting i18n Migration Process\n');

  // Step 1: Interactive selection between Trade and Pages
  console.log('Step 1: Select project type');
  const { projectType } = await inquirer.prompt<{ projectType: 'trade' | 'pages' }>([
    {
      type: 'list',
      name: 'projectType',
      message: 'Select project type:',
      choices: [
        { name: 'Trade', value: 'trade' },
        { name: 'Pages', value: 'pages' }
      ],
      default: 'pages'
    }
  ]);

  console.log(`\n📋 Selected: ${projectType === 'trade' ? 'Trade' : 'Pages'}\n`);

  // Step 2: Run getWebKeyValue.ts
  console.log('Step 2: Running getWebKeyValue.ts...');
  try {
    execSync('npx ts-node getWebKeyValue.ts', { stdio: 'inherit' });
    console.log('\n✅ getWebKeyValue.ts completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Error running getWebKeyValue.ts:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  // Step 3: Call migrateToPhrase with the appropriate project ID
  console.log('Step 3: Migrating translations to Phrase...');
  try {
    let projectId: string;

    if (projectType === 'trade') {
      projectId = process.env.TRADE_PROJECT_ID!
      if (!projectId) {
        throw new Error('TRADE_PROJECT_ID not found in .env file');
      }
    } else {
      projectId = process.env.PAGES_PROJECT_ID!
      if (!projectId) {
        throw new Error('PAGES_PROJECT_ID not found in .env file');
      }
    }

    console.log(`\n📋 Using project ID: ${projectId}`);
    console.log('📋 Migrating translations...\n');

    await migrateToPhrase(projectId);

    console.log('\n🎉 All steps completed successfully!');
  } catch (error) {
    console.error('\n❌ Error during migration:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run the main function
main().catch(console.error);
