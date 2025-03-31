/**
 * RPG Maker MV Project Analyzer Example
 * 
 * This example demonstrates how to use the rpgmaker-ai-tools library
 * to analyze an RPG Maker MV project and generate a report.
 * 
 * Usage:
 * node analyze-project.js <path-to-project> [options]
 * 
 * Options:
 *   --output-dir <dir>   Directory to write analysis results to
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
  .option('-o, --output-dir <dir>', 'Directory to write analysis results to')
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

// Run the analyzer
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
    
    // Set up options for analysis
    const analysisOptions = {
      recursive: options.recursive,
      include: options.include,
      exclude: options.exclude,
      outputDir: options.outputDir
    };
    
    console.log(chalk.blue('RPG Maker MV Project Analyzer'));
    console.log(chalk.blue('============================'));
    console.log(`Project: ${chalk.green(projectPath)}`);
    console.log(`Output directory: ${chalk.green(options.outputDir || 'None (results will not be saved)')}`);
    console.log(`Recursive: ${chalk.green(options.recursive ? 'Yes' : 'No')}`);
    console.log(`Include patterns: ${chalk.green(options.include.join(', '))}`);
    console.log(`Exclude patterns: ${chalk.green(options.exclude.join(', ') || 'None')}`);
    console.log('');
    
    // Analyze the project
    console.log(chalk.blue('Analyzing project...'));
    const { results, summary } = await rpgmakerTools.analyzer.analyzeProject(dataDir, analysisOptions);
    
    // Print the summary
    console.log('');
    console.log(chalk.blue('Summary:'));
    console.log(`Total files: ${chalk.green(summary.totalFiles)}`);
    console.log(`Files with issues: ${chalk.green(summary.filesWithIssues)}`);
    console.log(`Total issues: ${chalk.green(summary.totalIssues)}`);
    
    // Print issues by type
    console.log('');
    console.log(chalk.blue('Issues by type:'));
    Object.entries(summary.issuesByType).forEach(([type, count]) => {
      console.log(`${type.replace(/_/g, ' ')}: ${chalk.green(count)}`);
    });
    
    // Print issues by severity
    console.log('');
    console.log(chalk.blue('Issues by severity:'));
    Object.entries(summary.issuesBySeverity).forEach(([severity, count]) => {
      const color = severity === 'error' ? chalk.red : severity === 'warning' ? chalk.yellow : chalk.blue;
      console.log(`${severity}: ${color(count)}`);
    });
    
    // Print fixability
    console.log('');
    console.log(chalk.blue('Fixability:'));
    console.log(`Fixable issues: ${chalk.green(summary.fixableIssues)}`);
    console.log(`Unfixable issues: ${chalk.red(summary.unfixableIssues)}`);
    
    // Print details for each file with issues
    console.log('');
    console.log(chalk.blue('Files with issues:'));
    results
      .filter(result => result.issues.length > 0)
      .forEach(result => {
        const fileName = path.basename(result.file);
        console.log(`${chalk.yellow(fileName)}: ${chalk.red(result.issues.length)} issues`);
        
        // Group issues by type
        const issuesByType = result.issues.reduce((acc, issue) => {
          acc[issue.type] = (acc[issue.type] || 0) + 1;
          return acc;
        }, {});
        
        // Print issue types
        Object.entries(issuesByType).forEach(([type, count]) => {
          console.log(`  - ${type.replace(/_/g, ' ')}: ${chalk.red(count)}`);
        });
      });
    
    // Print output location
    if (options.outputDir) {
      console.log('');
      console.log(chalk.blue('Output:'));
      console.log(`Analysis results saved to: ${chalk.green(path.join(options.outputDir, 'analysis-results.json'))}`);
      console.log(`Analysis summary saved to: ${chalk.green(path.join(options.outputDir, 'analysis-summary.json'))}`);
      console.log(`HTML report saved to: ${chalk.green(path.join(options.outputDir, 'analysis-report.html'))}`);
    }
    
    console.log('');
    console.log(chalk.green('Done!'));
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}

// Run the script
run();
