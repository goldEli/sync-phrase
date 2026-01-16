## Implementation Plan for migrateI18n.ts

### Overview
Create a TypeScript CLI script that provides an interactive selection between Trade and Pages, runs the existing getWebKeyValue.ts script, and then calls migrateToPhrase with the appropriate project ID.

### Steps

1. **Install Dependencies**
   - Add `inquirer` and its TypeScript types as dependencies for interactive prompts

2. **Create migrateI18n.ts**
   - Import necessary modules: `inquirer`, `child_process`, `dotenv`, and `migrateToPhrase`
   - Load environment variables from .env file

3. **Implement Interactive Selection**
   - Use inquirer to create a single-choice prompt for Trade or Pages
   - Validate the selection

4. **Execute getWebKeyValue.ts**
   - Run `npx ts-node getWebKeyValue.ts` using child_process.execSync
   - Handle any errors that might occur

5. **Call migrateToPhrase**
   - Determine the appropriate project ID based on the selection:
     - Trade: Use `TRADE_PROJECT_ID` from .env
     - Pages: Use `PAGES_PROJECT_ID` from .env
   - Call `migrateToPhrase` with the selected project ID

6. **Add Error Handling**
   - Handle missing environment variables
   - Handle execution errors from getWebKeyValue.ts
   - Handle any errors from migrateToPhrase

7. **Add Script to package.json**
   - Add a new script entry for easy execution

### Expected Usage
```bash
# Run the script
npx ts-node migrateI18n.ts

# Or with package.json script
npm run migrate-i18n
```

### Key Features
- Interactive selection between Trade and Pages
- Automatic execution of getWebKeyValue.ts
- Proper environment variable usage for project IDs
- Comprehensive error handling
- Clean, user-friendly output

This implementation will provide a streamlined workflow for migrating translations to Phrase while maintaining flexibility for different projects.