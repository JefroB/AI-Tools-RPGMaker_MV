/**
 * Schema Validator for RPG Maker MV Data
 * 
 * This module provides validation for RPG Maker MV data structures.
 * It ensures that generated data conforms to the expected schema for each data type.
 */

const { Validator } = require('jsonschema');
const schemas = require('./schemas');

// Create validator instance
const validator = new Validator();

// Register all schemas
const registerSchemas = () => {
  Object.keys(schemas).forEach(schemaName => {
    validator.addSchema(schemas[schemaName], `/${schemaName}`);
  });
};

// Initialize schemas
registerSchemas();

/**
 * Validate data against a schema
 * @param {string} type - Type of data to validate (actor, item, skill, etc.)
 * @param {Object} data - Data to validate
 * @returns {Object} - Validation result with success flag and any errors
 */
const validate = (type, data) => {
  if (!schemas[type]) {
    return {
      success: false,
      errors: [`Unknown schema type: ${type}`]
    };
  }

  const result = validator.validate(data, schemas[type]);
  
  return {
    success: result.valid,
    errors: result.errors.map(error => error.stack)
  };
};

/**
 * Get a clean template object for a specific data type
 * @param {string} type - Type of data template to get
 * @returns {Object} - Template object with default values
 */
const getTemplate = (type) => {
  if (!schemas[type] || !schemas[type].template) {
    throw new Error(`No template available for type: ${type}`);
  }
  
  // Return a deep copy of the template to avoid modifying the original
  return JSON.parse(JSON.stringify(schemas[type].template));
};

/**
 * Sanitize data to ensure it conforms to the schema
 * @param {string} type - Type of data to sanitize
 * @param {Object} data - Data to sanitize
 * @returns {Object} - Sanitized data
 */
const sanitize = (type, data) => {
  if (!schemas[type]) {
    throw new Error(`Unknown schema type: ${type}`);
  }

  const template = getTemplate(type);
  const schema = schemas[type];
  const result = { ...template };

  // Apply data to template, respecting schema constraints
  Object.keys(data).forEach(key => {
    if (key in template) {
      const propSchema = schema.properties[key];
      
      // Handle different types of properties based on schema
      if (propSchema) {
        if (propSchema.type === 'array' && Array.isArray(data[key])) {
          result[key] = data[key];
        } else if (propSchema.type === 'object' && typeof data[key] === 'object') {
          result[key] = { ...template[key], ...data[key] };
        } else if (propSchema.type === 'string' && typeof data[key] === 'string') {
          result[key] = data[key];
        } else if (propSchema.type === 'number' && typeof data[key] === 'number') {
          result[key] = data[key];
        } else if (propSchema.type === 'boolean' && typeof data[key] === 'boolean') {
          result[key] = data[key];
        } else if (propSchema.type === 'integer' && Number.isInteger(data[key])) {
          result[key] = data[key];
        }
      }
    }
  });

  return result;
};

module.exports = {
  validate,
  getTemplate,
  sanitize
};
