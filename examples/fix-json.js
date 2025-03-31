/**
 * RPG Maker MV JSON Fixer Example
 * 
 * This example demonstrates how to use the rpgmaker-ai-tools library
 * to fix broken JSON files in an RPG Maker MV project.
 * 
 * Usage:
 * node fix-json.js <path-to-project> [options]
 * 
 * Options:
 *   --output-dir <dir>   Directory to write fixed files to (default: overwrite originals)
 *   --approach <name>    Approach to use (basic, intermediate, advanced, manual, auto)
 *   --recursive          Process files recursively
 *   --include <pattern>  File pattern to include (can be used multiple times)
 *   --exclude <pattern>  File pattern to exclude (can be used multiple times)
 */

const path = require('path');
const { program } = require('commander');
const chalk = require('chalk');
const rpgmakerTools = require('../src');

// Parse command line arguments
program
  .argument('<project-path>', 'Path to the RPG Maker MV project')
  .option('-o, --output-dir <dir>', 'Directory to write fixed files to')
  .option('-a, --approach <name>', 'Approach to use (basic, intermediate, advanced, manual, auto)', 'auto')
  .option('-r, --recursive', 'Process files recursively')
  .option('-i, --include <pattern>', 'File pattern to include', collectValues, ['*.json'])
  .option('-e, --exclude <pattern>', 'File pattern to exclude', collectValues, [])
  .parse(process.argv);

// Helper function to collect multiple values for an option
function collectValues(value, previous) {
  return previous.concat([value]);
}

// Get the project path and options
const projectPath = program.args[0];
const options = program.opts();

// Validate the project path
if (!projectPath) {
  console.error(chalk.red('Error: Project path is required'));
  process.exit(1);
}

// Run the fixer
async function run() {
  try {
    // Check if the project is valid
    const isValid = await rpgmakerTools.utils.isValidProject(projectPath);
    if (!isValid) {
      console.error(chalk.red(`Error: ${projectPath} is not a valid RPG Maker MV project`));
      process.exit(1);
    }
    
    // Get the data directory
    const dataDir = path.join(projectPath, 'data');
    
    // Set up options for fixing
    const fixOptions = {
      approach: options.approach,
      outputDir: options.outputDir || dataDir,
      recursive: options.recursive,
      include: options.include,
      exclude: options.exclude
    };
    
    console.log(chalk.blue('RPG Maker MV JSON Fixer'));
    console.log(chalk.blue('======================='));
    console.log(`Project: ${chalk.green(projectPath)}`);
    console.log(`Approach: ${chalk.green(options.approach)}`);
    console.log(`Output directory: ${chalk.green(fixOptions.outputDir)}`);
    console.log(`Recursive: ${chalk.green(options.recursive ? 'Yes' : 'No')}`);
    console.log(`Include patterns: ${chalk.green(options.include.join(', '))}`);
    console.log(`Exclude patterns: ${chalk.green(options.exclude.join(', ') || 'None')}`);
    console.log('');
    
    // Fix the JSON files
    console.log(chalk.blue('Fixing JSON files...'));
    const result = await rpgmakerTools.dataFixer.fixJsonFiles(dataDir, fixOptions);
    
    // Print the results
    console.log('');
    console.log(chalk.blue('Results:'));
    console.log(`Total files: ${chalk.green(result.totalFiles)}`);
    console.log(`Fixed files: ${chalk.green(result.fixedFiles)}`);
    console.log(`Total issues fixed: ${chalk.green(result.totalIssues)}`);
    
    // Print details for each file
    console.log('');
    console.log(chalk.blue('Details:'));
    result.results.forEach(fileResult => {
      const fileName = path.basename(fileResult.filePath);
      if (fileResult.issues > 0) {
        console.log(`${chalk.green('✓')} ${fileName}: Fixed ${chalk.green(fileResult.issues)} issues using ${chalk.green(fileResult.approach)} approach`);
      } else if (fileResult.error) {
        console.log(`${chalk.red('✗')} ${fileName}: ${chalk.red(fileResult.error)}`);
      } else {
        console.log(`${chalk.yellow('⚠')} ${fileName}: No issues found`);
      }
    });
    
    console.log('');
    console.log(chalk.green('Done!'));
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}

// Run the script
run();
