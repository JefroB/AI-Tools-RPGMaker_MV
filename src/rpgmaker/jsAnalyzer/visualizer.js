/**
 * RPG Maker MV JavaScript Visualizer
 * 
 * This module generates visual representations of JavaScript analysis in RPG Maker MV data files.
 * It creates diagrams of battle animations, decision trees, and dependency graphs.
 */

const fs = require('fs-extra');
const path = require('path');

/**
 * Generate visualizations of JavaScript analysis
 * @param {string} projectPath - Path to the RPG Maker MV project
 * @param {Object} analysisResults - Analysis results
 * @param {Object} options - Options for visualization
 * @returns {Promise<Object>} - Generated visualizations
 */
async function generateVisualizations(projectPath, analysisResults, options = {}) {
  const {
    outputDir = null,
    includeBattleAnimations = true,
    includeDecisionTrees = true,
    includeDependencyGraphs = true,
    includeStatistics = true,
    format = 'html'
  } = options;

  // Initialize results
  const results = {
    battleAnimationDiagrams: [],
    decisionTreeDiagrams: [],
    dependencyGraphs: [],
    statisticsDiagrams: [],
    outputFiles: []
  };

  // Generate battle animation diagrams
  if (includeBattleAnimations && analysisResults.battleAnimations) {
    results.battleAnimationDiagrams = generateBattleAnimationDiagrams(analysisResults.battleAnimations);
  }

  // Generate decision tree diagrams
  if (includeDecisionTrees && analysisResults.conditionalLogic) {
    results.decisionTreeDiagrams = generateDecisionTreeDiagrams(analysisResults.conditionalLogic);
  }

  // Generate dependency graphs
  if (includeDependencyGraphs && analysisResults.relationships) {
    results.dependencyGraphs = generateDependencyGraphs(analysisResults.relationships);
  }

  // Generate statistics diagrams
  if (includeStatistics) {
    results.statisticsDiagrams = generateStatisticsDiagrams(analysisResults);
  }

  // Write visualizations to files if outputDir is provided
  if (outputDir) {
    await writeVisualizationsToFiles(results, outputDir, format);
  }

  return results;
}

/**
 * Generate battle animation diagrams
 * @param {Object} battleAnimations - Battle animation analysis results
 * @returns {Object[]} - Generated diagrams
 */
function generateBattleAnimationDiagrams(battleAnimations) {
  const diagrams = [];

  // Skip if no animations
  if (!battleAnimations.animations || battleAnimations.animations.length === 0) {
    return diagrams;
  }

  // Generate sequence diagrams for each animation
  for (const animation of battleAnimations.animations) {
    // Skip animations with no commands
    if (!animation.commands || animation.commands.length === 0) {
      continue;
    }

    // Generate sequence diagram
    const diagram = {
      title: `Battle Animation: ${animation.source.name} (${animation.type})`,
      type: 'sequence',
      source: animation.source,
      content: generateSequenceDiagram(animation)
    };

    diagrams.push(diagram);
  }

  // Generate command frequency chart
  if (battleAnimations.commands && battleAnimations.commands.frequency) {
    const commandFrequency = battleAnimations.commands.frequency;
    const topCommands = Object.entries(commandFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    if (topCommands.length > 0) {
      const diagram = {
        title: 'Top 10 Battle Animation Commands',
        type: 'bar',
        content: generateBarChart(
          'Top 10 Battle Animation Commands',
          topCommands.map(([command]) => command),
          topCommands.map(([_, count]) => count)
        )
      };

      diagrams.push(diagram);
    }
  }

  // Generate command sequence chart
  if (battleAnimations.commands && battleAnimations.commands.sequences) {
    const commandSequences = battleAnimations.commands.sequences;
    const topSequences = Object.entries(commandSequences)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    if (topSequences.length > 0) {
      const diagram = {
        title: 'Top 5 Battle Animation Command Sequences',
        type: 'bar',
        content: generateBarChart(
          'Top 5 Battle Animation Command Sequences',
          topSequences.map(([sequence]) => sequence.substring(0, 30) + (sequence.length > 30 ? '...' : '')),
          topSequences.map(([_, count]) => count)
        )
      };

      diagrams.push(diagram);
    }
  }

  return diagrams;
}

/**
 * Generate sequence diagram for a battle animation
 * @param {Object} animation - Animation object
 * @returns {string} - Mermaid sequence diagram
 */
function generateSequenceDiagram(animation) {
  let diagram = 'sequenceDiagram\n';
  diagram += '    participant User\n';
  diagram += '    participant Target\n';
  diagram += '    participant Camera\n';
  diagram += '    participant Animation\n';
  
  for (const cmd of animation.commands) {
    const command = cmd.command;
    const params = cmd.params;
    
    if (command.includes('user')) {
      diagram += '    User->>User: ';
    } else if (command.includes('target')) {
      diagram += '    User->>Target: ';
    } else if (command.includes('camera') || command.includes('zoom')) {
      diagram += '    User->>Camera: ';
    } else if (command.includes('animation')) {
      diagram += '    User->>Animation: ';
    } else if (command.includes('wait')) {
      diagram += '    Note over User,Target: ';
    } else {
      diagram += '    Note over User,Target: ';
    }
    
    diagram += `${command}`;
    if (params.length > 0) {
      diagram += ` (${params.join(', ')})`;
    }
    diagram += '\n';
  }
  
  return diagram;
}

/**
 * Generate decision tree diagrams
 * @param {Object} conditionalLogic - Conditional logic analysis results
 * @returns {Object[]} - Generated diagrams
 */
function generateDecisionTreeDiagrams(conditionalLogic) {
  const diagrams = [];

  // Skip if no decision trees
  if (!conditionalLogic.decisionTrees || conditionalLogic.decisionTrees.length === 0) {
    return diagrams;
  }

  // Generate flowcharts for each decision tree
  for (const tree of conditionalLogic.decisionTrees) {
    // Skip trees with no nodes
    if (!tree.nodes || tree.nodes.length === 0) {
      continue;
    }

    // Generate flowchart
    const diagram = {
      title: `Decision Tree: ${tree.source.name} (${tree.source.type})`,
      type: 'flowchart',
      source: tree.source,
      content: generateFlowchart(tree)
    };

    diagrams.push(diagram);
  }

  // Generate condition type chart
  if (conditionalLogic.commonPatterns && conditionalLogic.commonPatterns.conditional_branch) {
    const conditionTypes = conditionalLogic.commonPatterns.conditional_branch;
    const topConditionTypes = Object.entries(conditionTypes)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([type, info]) => [type, info.count]);

    if (topConditionTypes.length > 0) {
      const diagram = {
        title: 'Top 10 Condition Types',
        type: 'bar',
        content: generateBarChart(
          'Top 10 Condition Types',
          topConditionTypes.map(([type]) => type),
          topConditionTypes.map(([_, count]) => count)
        )
      };

      diagrams.push(diagram);
    }
  }

  // Generate variable usage chart
  if (conditionalLogic.variableUsage) {
    const variableUsage = conditionalLogic.variableUsage;
    const topVariables = Object.entries(variableUsage)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([id, info]) => [id, info.count]);

    if (topVariables.length > 0) {
      const diagram = {
        title: 'Top 10 Variables Used in Conditions',
        type: 'bar',
        content: generateBarChart(
          'Top 10 Variables Used in Conditions',
          topVariables.map(([id]) => `Variable ${id}`),
          topVariables.map(([_, count]) => count)
        )
      };

      diagrams.push(diagram);
    }
  }

  return diagrams;
}

/**
 * Generate flowchart for a decision tree
 * @param {Object} tree - Decision tree
 * @returns {string} - Mermaid flowchart
 */
function generateFlowchart(tree) {
  let flowchart = 'flowchart TD\n';
  let nodeId = 0;
  
  // Recursively generate nodes
  function generateNode(node, parentId = null) {
    const currentId = `node${nodeId++}`;
    
    // Add node
    if (node.condition) {
      if (typeof node.condition === 'object') {
        flowchart += `  ${currentId}["${JSON.stringify(node.condition).replace(/"/g, "'")}"]\n`;
      } else {
        flowchart += `  ${currentId}["${node.condition}"]\n`;
      }
    } else {
      flowchart += `  ${currentId}[Action]\n`;
    }
    
    // Link to parent
    if (parentId !== null) {
      flowchart += `  ${parentId} --> ${currentId}\n`;
    }
    
    // Process children
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        generateNode(child, currentId);
      }
    } else {
      const actionId = `action${nodeId++}`;
      flowchart += `  ${actionId}([Action])\n`;
      flowchart += `  ${currentId} --> ${actionId}\n`;
    }
    
    return currentId;
  }
  
  // Generate each root node
  for (const node of tree.nodes) {
    generateNode(node);
  }
  
  return flowchart;
}

/**
 * Generate dependency graphs
 * @param {Object} relationships - Relationship mapping results
 * @returns {Object[]} - Generated diagrams
 */
function generateDependencyGraphs(relationships) {
  const diagrams = [];

  // Skip if no relationships
  if (!relationships.dependencies) {
    return diagrams;
  }

  // Generate full dependency graph
  const fullGraph = {
    title: 'Full JavaScript Dependency Graph',
    type: 'graph',
    content: generateDependencyGraph(relationships)
  };

  diagrams.push(fullGraph);

  // Generate script to mechanic graph
  if (relationships.dependencies.scriptToMechanic) {
    const scriptToMechanicEntries = Object.entries(relationships.dependencies.scriptToMechanic);
    
    // Skip if no entries
    if (scriptToMechanicEntries.length === 0) {
      return diagrams;
    }
    
    // Get top scripts by number of mechanics
    const topScripts = scriptToMechanicEntries
      .sort((a, b) => Object.keys(b[1]).length - Object.keys(a[1]).length)
      .slice(0, 5);
    
    // Generate subgraph for each top script
    for (const [scriptId, mechanics] of topScripts) {
      const subgraph = {
        title: `Dependencies for ${scriptId}`,
        type: 'graph',
        content: generateScriptSubgraph(scriptId, mechanics)
      };
      
      diagrams.push(subgraph);
    }
  }

  // Generate mechanic to script graph
  if (relationships.dependencies.mechanicToScript) {
    const mechanicToScriptEntries = Object.entries(relationships.dependencies.mechanicToScript);
    
    // Skip if no entries
    if (mechanicToScriptEntries.length === 0) {
      return diagrams;
    }
    
    // Get top mechanics by number of scripts
    const topMechanics = mechanicToScriptEntries
      .sort((a, b) => Object.keys(b[1]).length - Object.keys(a[1]).length)
      .slice(0, 5);
    
    // Generate subgraph for each top mechanic
    for (const [mechanicId, scripts] of topMechanics) {
      const subgraph = {
        title: `Scripts Affecting ${mechanicId}`,
        type: 'graph',
        content: generateMechanicSubgraph(mechanicId, scripts)
      };
      
      diagrams.push(subgraph);
    }
  }

  return diagrams;
}

/**
 * Generate dependency graph
 * @param {Object} relationships - Relationship mapping results
 * @returns {string} - Mermaid graph
 */
function generateDependencyGraph(relationships) {
  let graph = 'graph TD\n';
  const addedNodes = new Set();
  
  // Skip if no graph
  if (!relationships.graph || !relationships.graph.nodes || !relationships.graph.edges) {
    return graph;
  }
  
  // Add nodes
  for (const node of relationships.graph.nodes) {
    // Skip if already added
    if (addedNodes.has(node)) continue;
    
    // Add node
    if (node.startsWith('tag_')) {
      graph += `  ${node}["Tag: ${node.substring(4)}"]\n`;
    } else if (node.startsWith('item_')) {
      graph += `  ${node}["Item: ${node.substring(5)}"]\n`;
    } else if (node.startsWith('function_')) {
      graph += `  ${node}["Function: ${node.substring(9)}"]\n`;
    } else if (node.startsWith('variable_')) {
      graph += `  ${node}["Variable: ${node.substring(9)}"]\n`;
    } else if (node.startsWith('conditional_')) {
      graph += `  ${node}["Conditional: ${node.substring(12)}"]\n`;
    } else if (node.startsWith('object_')) {
      graph += `  ${node}["Object: ${node.substring(7)}"]\n`;
    } else if (node.startsWith('state_')) {
      graph += `  ${node}["State: ${node.substring(6)}"]\n`;
    } else if (node.startsWith('damage_')) {
      graph += `  ${node}["Damage: ${node.substring(7)}"]\n`;
    } else if (node.startsWith('element_')) {
      graph += `  ${node}["Element: ${node.substring(8)}"]\n`;
    } else if (node.startsWith('scope_')) {
      graph += `  ${node}["Scope: ${node.substring(6)}"]\n`;
    } else if (node.startsWith('hit_type_')) {
      graph += `  ${node}["Hit Type: ${node.substring(9)}"]\n`;
    } else if (node.startsWith('occasion_')) {
      graph += `  ${node}["Occasion: ${node.substring(9)}"]\n`;
    } else if (node.startsWith('condition_')) {
      graph += `  ${node}["Condition: ${node.substring(10)}"]\n`;
    } else if (node.startsWith('source_')) {
      graph += `  ${node}["Source: ${node.substring(7)}"]\n`;
    } else {
      graph += `  ${node}["${node}"]\n`;
    }
    
    addedNodes.add(node);
  }
  
  // Add edges
  for (const edge of relationships.graph.edges) {
    if (edge.type === 'script_to_mechanic') {
      graph += `  ${edge.from} --> ${edge.to}\n`;
    } else if (edge.type === 'script_to_script') {
      graph += `  ${edge.from} -.-> ${edge.to}\n`;
    }
  }
  
  return graph;
}

/**
 * Generate script subgraph
 * @param {string} scriptId - Script ID
 * @param {Object} mechanics - Mechanics
 * @returns {string} - Mermaid graph
 */
function generateScriptSubgraph(scriptId, mechanics) {
  let graph = 'graph TD\n';
  
  // Add script node
  graph += `  ${scriptId}["${scriptId}"]\n`;
  
  // Add mechanic nodes and edges
  for (const mechanicId of Object.keys(mechanics)) {
    // Add mechanic node
    if (mechanicId.startsWith('tag_')) {
      graph += `  ${mechanicId}["Tag: ${mechanicId.substring(4)}"]\n`;
    } else if (mechanicId.startsWith('item_')) {
      graph += `  ${mechanicId}["Item: ${mechanicId.substring(5)}"]\n`;
    } else if (mechanicId.startsWith('function_')) {
      graph += `  ${mechanicId}["Function: ${mechanicId.substring(9)}"]\n`;
    } else if (mechanicId.startsWith('variable_')) {
      graph += `  ${mechanicId}["Variable: ${mechanicId.substring(9)}"]\n`;
    } else if (mechanicId.startsWith('conditional_')) {
      graph += `  ${mechanicId}["Conditional: ${mechanicId.substring(12)}"]\n`;
    } else if (mechanicId.startsWith('object_')) {
      graph += `  ${mechanicId}["Object: ${mechanicId.substring(7)}"]\n`;
    } else if (mechanicId.startsWith('state_')) {
      graph += `  ${mechanicId}["State: ${mechanicId.substring(6)}"]\n`;
    } else if (mechanicId.startsWith('damage_')) {
      graph += `  ${mechanicId}["Damage: ${mechanicId.substring(7)}"]\n`;
    } else if (mechanicId.startsWith('element_')) {
      graph += `  ${mechanicId}["Element: ${mechanicId.substring(8)}"]\n`;
    } else if (mechanicId.startsWith('scope_')) {
      graph += `  ${mechanicId}["Scope: ${mechanicId.substring(6)}"]\n`;
    } else if (mechanicId.startsWith('hit_type_')) {
      graph += `  ${mechanicId}["Hit Type: ${mechanicId.substring(9)}"]\n`;
    } else if (mechanicId.startsWith('occasion_')) {
      graph += `  ${mechanicId}["Occasion: ${mechanicId.substring(9)}"]\n`;
    } else if (mechanicId.startsWith('condition_')) {
      graph += `  ${mechanicId}["Condition: ${mechanicId.substring(10)}"]\n`;
    } else if (mechanicId.startsWith('source_')) {
      graph += `  ${mechanicId}["Source: ${mechanicId.substring(7)}"]\n`;
    } else {
      graph += `  ${mechanicId}["${mechanicId}"]\n`;
    }
    
    // Add edge
    graph += `  ${scriptId} --> ${mechanicId}\n`;
  }
  
  return graph;
}

/**
 * Generate mechanic subgraph
 * @param {string} mechanicId - Mechanic ID
 * @param {Object} scripts - Scripts
 * @returns {string} - Mermaid graph
 */
function generateMechanicSubgraph(mechanicId, scripts) {
  let graph = 'graph TD\n';
  
  // Add mechanic node
  if (mechanicId.startsWith('tag_')) {
    graph += `  ${mechanicId}["Tag: ${mechanicId.substring(4)}"]\n`;
  } else if (mechanicId.startsWith('item_')) {
    graph += `  ${mechanicId}["Item: ${mechanicId.substring(5)}"]\n`;
  } else if (mechanicId.startsWith('function_')) {
    graph += `  ${mechanicId}["Function: ${mechanicId.substring(9)}"]\n`;
  } else if (mechanicId.startsWith('variable_')) {
    graph += `  ${mechanicId}["Variable: ${mechanicId.substring(9)}"]\n`;
  } else if (mechanicId.startsWith('conditional_')) {
    graph += `  ${mechanicId}["Conditional: ${mechanicId.substring(12)}"]\n`;
  } else if (mechanicId.startsWith('object_')) {
    graph += `  ${mechanicId}["Object: ${mechanicId.substring(7)}"]\n`;
  } else if (mechanicId.startsWith('state_')) {
    graph += `  ${mechanicId}["State: ${mechanicId.substring(6)}"]\n`;
  } else if (mechanicId.startsWith('damage_')) {
    graph += `  ${mechanicId}["Damage: ${mechanicId.substring(7)}"]\n`;
  } else if (mechanicId.startsWith('element_')) {
    graph += `  ${mechanicId}["Element: ${mechanicId.substring(8)}"]\n`;
  } else if (mechanicId.startsWith('scope_')) {
    graph += `  ${mechanicId}["Scope: ${mechanicId.substring(6)}"]\n`;
  } else if (mechanicId.startsWith('hit_type_')) {
    graph += `  ${mechanicId}["Hit Type: ${mechanicId.substring(9)}"]\n`;
  } else if (mechanicId.startsWith('occasion_')) {
    graph += `  ${mechanicId}["Occasion: ${mechanicId.substring(9)}"]\n`;
  } else if (mechanicId.startsWith('condition_')) {
    graph += `  ${mechanicId}["Condition: ${mechanicId.substring(10)}"]\n`;
  } else if (mechanicId.startsWith('source_')) {
    graph += `  ${mechanicId}["Source: ${mechanicId.substring(7)}"]\n`;
  } else {
    graph += `  ${mechanicId}["${mechanicId}"]\n`;
  }
  
  // Add script nodes and edges
  for (const scriptId of Object.keys(scripts)) {
    // Add script node
    graph += `  ${scriptId}["${scriptId}"]\n`;
    
    // Add edge
    graph += `  ${scriptId} --> ${mechanicId}\n`;
  }
  
  return graph;
}

/**
 * Generate statistics diagrams
 * @param {Object} analysisResults - Analysis results
 * @returns {Object[]} - Generated diagrams
 */
function generateStatisticsDiagrams(analysisResults) {
  const diagrams = [];

  // Generate JavaScript usage pie chart
  if (analysisResults.gameTags && analysisResults.gameTags.statistics && 
      analysisResults.gameTags.statistics.javascriptUsage) {
    const jsUsage = analysisResults.gameTags.statistics.javascriptUsage;
    
    const diagram = {
      title: 'JavaScript Usage in Tags',
      type: 'pie',
      content: generateJavaScriptUsageChart(jsUsage, analysisResults.gameTags.statistics.totalTags)
    };
    
    diagrams.push(diagram);
  }

  // Generate tag distribution chart
  if (analysisResults.gameTags && analysisResults.gameTags.statistics && 
      analysisResults.gameTags.statistics.byTagType) {
    const tagTypes = analysisResults.gameTags.statistics.byTagType;
    
    const diagram = {
      title: 'Tag Distribution by Type',
      type: 'pie',
      content: generateTagDistributionChart(tagTypes)
    };
    
    diagrams.push(diagram);
  }

  // Generate custom eval complexity chart
  if (analysisResults.customEvals && analysisResults.customEvals.statistics && 
      analysisResults.customEvals.statistics.complexityScores) {
    const complexityScores = analysisResults.customEvals.statistics.complexityScores;
    
    // Skip if no scores
    if (complexityScores.length === 0) {
      return diagrams;
    }
    
    // Get top 10 most complex evaluations
    const topComplexity = complexityScores.slice(0, 10);
    
    const diagram = {
      title: 'Top 10 Most Complex Custom Evaluations',
      type: 'bar',
      content: generateBarChart(
        'Top 10 Most Complex Custom Evaluations',
        topComplexity.map(score => `${score.source.name} (${score.type})`),
        topComplexity.map(score => score.score)
      )
    };
    
    diagrams.push(diagram);
  }

  return diagrams;
}

/**
 * Generate JavaScript usage chart
 * @param {Object} jsUsage - JavaScript usage statistics
 * @param {number} totalTags - Total number of tags
 * @returns {string} - Mermaid pie chart
 */
function generateJavaScriptUsageChart(jsUsage, totalTags) {
  let chart = 'pie\n';
  chart += '    title JavaScript Usage in Tags\n';
  
  const jsCount = jsUsage.total;
  const nonJsCount = totalTags - jsCount;
  
  chart += `    "JavaScript" : ${jsCount}\n`;
  chart += `    "No JavaScript" : ${nonJsCount}\n`;
  
  return chart;
}

/**
 * Generate tag distribution chart
 * @param {Object} tagTypes - Tag type statistics
 * @returns {string} - Mermaid pie chart
 */
function generateTagDistributionChart(tagTypes) {
  let chart = 'pie\n';
  chart += '    title Tag Distribution by Type\n';
  
  // Get top 10 tag types
  const topTagTypes = Object.entries(tagTypes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  for (const [tagType, count] of topTagTypes) {
    chart += `    "${tagType}" : ${count}\n`;
  }
  
  return chart;
}

/**
 * Generate bar chart
 * @param {string} title - Chart title
 * @param {string[]} labels - Chart labels
 * @param {number[]} values - Chart values
 * @returns {string} - Mermaid bar chart
 */
function generateBarChart(title, labels, values) {
  let chart = 'bar\n';
  chart += `    title ${title}\n`;
  
  for (let i = 0; i < labels.length; i++) {
    chart += `    "${labels[i]}" : ${values[i]}\n`;
  }
  
  return chart;
}

/**
 * Write visualizations to files
 * @param {Object} visualizations - Visualization results
 * @param {string} outputDir - Output directory
 * @param {string} format - Output format
 * @returns {Promise<void>}
 */
async function writeVisualizationsToFiles(visualizations, outputDir, format) {
  // Ensure output directory exists
  await fs.ensureDir(outputDir);
  
  // Write battle animation diagrams
  for (let i = 0; i < visualizations.battleAnimationDiagrams.length; i++) {
    const diagram = visualizations.battleAnimationDiagrams[i];
    const fileName = `battle_animation_${i + 1}.${format}`;
    const filePath = path.join(outputDir, fileName);
    
    await writeVisualizationToFile(diagram, filePath, format);
    visualizations.outputFiles.push(filePath);
  }
  
  // Write decision tree diagrams
  for (let i = 0; i < visualizations.decisionTreeDiagrams.length; i++) {
    const diagram = visualizations.decisionTreeDiagrams[i];
    const fileName = `decision_tree_${i + 1}.${format}`;
    const filePath = path.join(outputDir, fileName);
    
    await writeVisualizationToFile(diagram, filePath, format);
    visualizations.outputFiles.push(filePath);
  }
  
  // Write dependency graphs
  for (let i = 0; i < visualizations.dependencyGraphs.length; i++) {
    const diagram = visualizations.dependencyGraphs[i];
    const fileName = `dependency_graph_${i + 1}.${format}`;
    const filePath = path.join(outputDir, fileName);
    
    await writeVisualizationToFile(diagram, filePath, format);
    visualizations.outputFiles.push(filePath);
  }
  
  // Write statistics diagrams
  for (let i = 0; i < visualizations.statisticsDiagrams.length; i++) {
    const diagram = visualizations.statisticsDiagrams[i];
    const fileName = `statistics_${i + 1}.${format}`;
    const filePath = path.join(outputDir, fileName);
    
    await writeVisualizationToFile(diagram, filePath, format);
    visualizations.outputFiles.push(filePath);
  }
  
  // Write index file
  const indexPath = path.join(outputDir, `index.${format}`);
  await writeIndexFile(visualizations, indexPath, format);
  visualizations.outputFiles.push(indexPath);
}

/**
 * Write visualization to file
 * @param {Object} diagram - Diagram object
 * @param {string} filePath - File path
 * @param {string} format - Output format
 * @returns {Promise<void>}
 */
async function writeVisualizationToFile(diagram, filePath, format) {
  if (format === 'html') {
    await fs.writeFile(filePath, generateHtmlVisualization(diagram));
  } else if (format === 'md') {
    await fs.writeFile(filePath, generateMarkdownVisualization(diagram));
  } else if (format === 'txt') {
    await fs.writeFile(filePath, generateTextVisualization(diagram));
  } else {
    await fs.writeFile(filePath, diagram.content);
  }
}

/**
 * Write index file
 * @param {Object} visualizations - Visualization results
 * @param {string} filePath - File path
 * @param {string} format - Output format
 * @returns {Promise<void>}
 */
async function writeIndexFile(visualizations, filePath, format) {
  if (format === 'html') {
    await fs.writeFile(filePath, generateHtmlIndex(visualizations));
  } else if (format === 'md') {
    await fs.writeFile(filePath, generateMarkdownIndex(visualizations));
  } else if (format === 'txt') {
    await fs.writeFile(filePath, generateTextIndex(visualizations));
  } else {
    await fs.writeFile(filePath, 'JavaScript Analysis Visualizations');
  }
}

/**
 * Generate HTML visualization
 * @param {Object} diagram - Diagram object
 * @returns {string} - HTML visualization
 */
function generateHtmlVisualization(diagram) {
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${diagram.title}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px; }
    .diagram { background: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 30px; }
    pre { background: #f9f9f9; padding: 10px; border-radius: 5px; overflow-x: auto; }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
  <script>
    mermaid.initialize({ startOnLoad: true });
  </script>
</head>
<body>
  <h1>${diagram.title}</h1>
  
  <div class="diagram">
    <div class="mermaid">
${diagram.content}
    </div>
  </div>
</body>
</html>`;

  return html;
}

/**
 * Generate Markdown visualization
 * @param {Object} diagram - Diagram object
 * @returns {string} - Markdown visualization
 */
function generateMarkdownVisualization(diagram) {
  let markdown = `# ${diagram.title}\n\n`;
  
  markdown += `\`\`\`mermaid\n${diagram.content}\n\`\`\`\n`;
  
  return markdown;
}

/**
 * Generate text visualization
 * @param {Object} diagram - Diagram object
 * @returns {string} - Text visualization
 */
function generateTextVisualization(diagram) {
  let text = `${diagram.title}\n${'='.repeat(diagram.title.length)}\n\n`;
  
  text += `${diagram.content}\n`;
  
  return text;
}

/**
 * Generate HTML index
 * @param {Object} visualizations - Visualization results
 * @returns {string} - HTML index
 */
function generateHtmlIndex(visualizations) {
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>JavaScript Analysis Visualizations</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px; }
    h2 { color: #444; margin-top: 30px; }
    .section { background: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 30px; }
    ul { list-style-type: none; padding: 0; }
    li { margin-bottom: 10px; }
    a { color: #0066cc; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>JavaScript Analysis Visualizations</h1>
  
  <div class="section">
    <h2>Battle Animation Diagrams</h2>
    <ul>
      ${visualizations.battleAnimationDiagrams.map((diagram, i) => 
        `<li><a href="battle_animation_${i + 1}.html">${diagram.title}</a></li>`
      ).join('\n      ')}
    </ul>
  </div>
  
  <div class="section">
    <h2>Decision Tree Diagrams</h2>
    <ul>
      ${visualizations.decisionTreeDiagrams.map((diagram, i) => 
        `<li><a href="decision_tree_${i + 1}.html">${diagram.title}</a></li>`
      ).join('\n      ')}
    </ul>
  </div>
  
  <div class="section">
    <h2>Dependency Graphs</h2>
    <ul>
      ${visualizations.dependencyGraphs.map((diagram, i) => 
        `<li><a href="dependency_graph_${i + 1}.html">${diagram.title}</a></li>`
      ).join('\n      ')}
    </ul>
  </div>
  
  <div class="section">
    <h2>Statistics Diagrams</h2>
    <ul>
      ${visualizations.statisticsDiagrams.map((diagram, i) => 
        `<li><a href="statistics_${i + 1}.html">${diagram.title}</a></li>`
      ).join('\n      ')}
    </ul>
  </div>
</body>
</html>`;

  return html;
}

/**
 * Generate Markdown index
 * @param {Object} visualizations - Visualization results
 * @returns {string} - Markdown index
 */
function generateMarkdownIndex(visualizations) {
  let markdown = `# JavaScript Analysis Visualizations\n\n`;
  
  markdown += `## Battle Animation Diagrams\n\n`;
  for (let i = 0; i < visualizations.battleAnimationDiagrams.length; i++) {
    const diagram = visualizations.battleAnimationDiagrams[i];
    markdown += `- [${diagram.title}](battle_animation_${i + 1}.md)\n`;
  }
  
  markdown += `\n## Decision Tree Diagrams\n\n`;
  for (let i = 0; i < visualizations.decisionTreeDiagrams.length; i++) {
    const diagram = visualizations.decisionTreeDiagrams[i];
    markdown += `- [${diagram.title}](decision_tree_${i + 1}.md)\n`;
  }
  
  markdown += `\n## Dependency Graphs\n\n`;
  for (let i = 0; i < visualizations.dependencyGraphs.length; i++) {
    const diagram = visualizations.dependencyGraphs[i];
    markdown += `- [${diagram.title}](dependency_graph_${i + 1}.md)\n`;
  }
  
  markdown += `\n## Statistics Diagrams\n\n`;
  for (let i = 0; i < visualizations.statisticsDiagrams.length; i++) {
    const diagram = visualizations.statisticsDiagrams[i];
    markdown += `- [${diagram.title}](statistics_${i + 1}.md)\n`;
  }
  
  return markdown;
}

/**
 * Generate text index
 * @param {Object} visualizations - Visualization results
 * @returns {string} - Text index
 */
function generateTextIndex(visualizations) {
  let text = `JavaScript Analysis Visualizations\n================================\n\n`;
  
  text += `Battle Animation Diagrams:\n`;
  for (let i = 0; i < visualizations.battleAnimationDiagrams.length; i++) {
    const diagram = visualizations.battleAnimationDiagrams[i];
    text += `- ${diagram.title} (battle_animation_${i + 1}.txt)\n`;
  }
  
  text += `\nDecision Tree Diagrams:\n`;
  for (let i = 0; i < visualizations.decisionTreeDiagrams.length; i++) {
    const diagram = visualizations.decisionTreeDiagrams[i];
    text += `- ${diagram.title} (decision_tree_${i + 1}.txt)\n`;
  }
  
  text += `\nDependency Graphs:\n`;
  for (let i = 0; i < visualizations.dependencyGraphs.length; i++) {
    const diagram = visualizations.dependencyGraphs[i];
    text += `- ${diagram.title} (dependency_graph_${i + 1}.txt)\n`;
  }
  
  text += `\nStatistics Diagrams:\n`;
  for (let i = 0; i < visualizations.statisticsDiagrams.length; i++) {
    const diagram = visualizations.statisticsDiagrams[i];
    text += `- ${diagram.title} (statistics_${i + 1}.txt)\n`;
  }
  
  return text;
}

module.exports = {
  generateVisualizations,
  generateBattleAnimationDiagrams,
  generateDecisionTreeDiagrams,
  generateDependencyGraphs,
  generateStatisticsDiagrams,
  generateSequenceDiagram,
  generateFlowchart,
  generateDependencyGraph,
  generateBarChart
};
