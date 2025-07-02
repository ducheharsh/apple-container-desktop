// Utility functions for Apple Container CLI operations

/**
 * Validates that all command arguments are strings
 * @param {Array} args - Array of command arguments
 * @returns {Array} - Array of string arguments
 */
export const validateCommandArgs = (args) => {
  return args.map(arg => String(arg)).filter(arg => arg && arg.trim() !== '');
};

/**
 * Extracts container name from various container object formats
 * @param {Object} container - Container object from CLI
 * @param {number} fallbackIndex - Fallback index for unnamed containers
 * @returns {string} - Container name
 */
export const extractContainerName = (container, fallbackIndex = 0) => {
  if (!container) return `container-${fallbackIndex}`;
  
  // Try multiple possible name fields
  const possibleNames = [
    container.Names,
    container.name,
    container.Name,
    container.id,
    container.ID,
    container.Id
  ];
  
  for (const name of possibleNames) {
    if (name && typeof name === 'string' && name.trim()) {
      // Remove leading slash if present (common in container names)
      return name.startsWith('/') ? name.substring(1) : name;
    }
  }
  
  return `container-${fallbackIndex}`;
};

/**
 * Formats container status for display
 * @param {Object} container - Container object
 * @returns {Object} - Formatted status info
 */
export const formatContainerStatus = (container) => {
  const status = container.Status || container.status || container.State || 'Unknown';
  const statusLower = status.toLowerCase();
  
  if (statusLower.includes('running') || statusLower.includes('up')) {
    return {
      text: 'Running',
      class: 'status-running',
      color: 'green'
    };
  } else if (statusLower.includes('exited') || statusLower.includes('stopped')) {
    return {
      text: 'Stopped',
      class: 'status-stopped', 
      color: 'red'
    };
  } else if (statusLower.includes('paused')) {
    return {
      text: 'Paused',
      class: 'status-paused',
      color: 'yellow'
    };
  } else if (statusLower.includes('restarting')) {
    return {
      text: 'Restarting',
      class: 'status-restarting',
      color: 'blue'
    };
  }
  
  return {
    text: status,
    class: 'status-unknown',
    color: 'gray'
  };
};

/**
 * Validates that Apple Container CLI is available
 * @param {Function} invoke - Tauri invoke function
 * @returns {Promise<Object>} - Validation result
 */
export const validateContainerCLI = async (invoke) => {
  try {
    const result = await invoke('run_container_command', { args: ['--version'] });
    return {
      available: result.success,
      version: result.success ? result.stdout.trim() : null,
      error: result.success ? null : result.stderr
    };
  } catch (error) {
    return {
      available: false,
      version: null,
      error: error.toString()
    };
  }
};

/**
 * Checks if the container system is running
 * @param {Function} invoke - Tauri invoke function
 * @returns {Promise<Object>} - System status result
 */
export const checkContainerSystemStatus = async (invoke) => {
  try {
    const result = await invoke('run_container_command', { args: ['system', 'status'] });
    
    // Parse the specific status messages
    let isRunning = false;
    let status = null;
    
    if (result.success && result.stdout) {
      const output = result.stdout.trim().toLowerCase();
      status = result.stdout.trim();
      
      console.log('Container system status output:', status);
      
      // Check for running status
      // Message when running: "Verifying apiserver is running...\napiserver is running"
      if (output.includes('apiserver is running')) {
        isRunning = true;
        console.log('Container system detected as running');
      }
      // Message when stopped: "apiserver is not running and not registered with launchd"
      else if (output.includes('apiserver is not running')) {
        isRunning = false;
        console.log('Container system detected as not running');
      }
      // Fallback check for any "running" indication
      else if (output.includes('running') && !output.includes('not running')) {
        isRunning = true;
        console.log('Container system detected as running (fallback)');
      } else {
        console.log('Container system status unclear, assuming not running');
      }
    }
    
    return {
      isRunning,
      status,
      error: isRunning ? null : (result.stderr || 'Container system is not running')
    };
  } catch (error) {
    return {
      isRunning: false,
      status: null,
      error: error.toString()
    };
  }
};

/**
 * Starts the container system
 * @param {Function} invoke - Tauri invoke function
 * @returns {Promise<Object>} - Start result
 */
export const startContainerSystem = async (invoke) => {
  try {
    const result = await invoke('run_container_command', { args: ['system', 'start'] });
    return {
      success: result.success,
      stdout: result.stdout,
      stderr: result.stderr
    };
  } catch (error) {
    return {
      success: false,
      stdout: '',
      stderr: error.toString()
    };
  }
};

/**
 * Enhanced container command runner with automatic system status checking
 * @param {Function} invoke - Tauri invoke function
 * @param {Array} args - Command arguments
 * @param {Function} showToast - Toast notification function
 * @returns {Promise<Object>} - Command result with system status checking
 */
export const runContainerCommandWithStatusCheck = async (invoke, args, showToast) => {
  try {
    const result = await invoke('run_container_command', { args });
    
    // If command failed, check if it's due to system not running
    if (!result.success && result.stderr) {
      const errorMessage = result.stderr.toLowerCase();
      
      // Check for common system not running errors
      if (errorMessage.includes('not running') || 
          errorMessage.includes('service unavailable') ||
          errorMessage.includes('connection refused') ||
          errorMessage.includes('daemon not running') ||
          errorMessage.includes('apiserver is not running') ||
          errorMessage.includes('not registered with launchd')) {
        
        // Check system status to confirm
        const systemStatus = await checkContainerSystemStatus(invoke);
        
        if (!systemStatus.isRunning) {
          if (showToast) {
            showToast(
              'Container system is not running. Click the "Start Container System" button in the sidebar to start it.',
              'error',
              8000
            );
          }
          
          return {
            ...result,
            systemNotRunning: true,
            canStartSystem: true
          };
        }
      }
    }
    
    return result;
  } catch (error) {
    return {
      success: false,
      stdout: '',
      stderr: error.toString(),
      exit_code: 1
    };
  }
};

/**
 * Common container CLI commands for reference
 */
export const CONTAINER_COMMANDS = {
  // Container lifecycle
  RUN: 'run',
  START: 'start',
  STOP: 'stop',
  RESTART: 'restart',
  REMOVE: 'delete',
  DELETE: 'delete',
  LIST: 'ls',
  
  // Image management
  PULL: ['images', 'pull'],
  PUSH: ['images', 'push'],
  BUILD: 'build',
  TAG: 'tag',
  IMAGES: ['images', 'ls'],
  
  // System management
  SYSTEM_START: ['system', 'start'],
  SYSTEM_STOP: ['system', 'stop'],
  SYSTEM_STATUS: ['system', 'status'],
  
  // Logs
  LOGS: 'logs',
  
  // Registry
  LOGIN: ['registry', 'login'],
  LOGOUT: ['registry', 'logout']
};

/**
 * Creates a standardized error object for container operations
 * @param {string} operation - The operation that failed
 * @param {string} error - Error message
 * @returns {Object} - Standardized error object
 */
export const createContainerError = (operation, error) => {
  return {
    success: false,
    stdout: '',
    stderr: `Failed to ${operation}: ${error}`,
    exit_code: 1,
    operation
  };
};

/**
 * Parses container CLI output into structured data
 * @param {string} output - Raw CLI output
 * @param {string} format - Expected format (json, table, etc.)
 * @returns {Array|Object} - Parsed data
 */
export const parseContainerOutput = (output, format = 'table') => {
  if (!output || !output.trim()) {
    return [];
  }
  
  if (format === 'json') {
    try {
      // Handle both single JSON objects and newline-delimited JSON
      const lines = output.trim().split('\n').filter(line => line.trim());
      if (lines.length === 1) {
        return [JSON.parse(lines[0])];
      } else {
        return lines.map(line => JSON.parse(line));
      }
    } catch (error) {
      console.error('Failed to parse JSON output:', error);
      return [];
    }
  }
  
  // Default table parsing
  const lines = output.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(/\s+/);
  return lines.slice(1).map(line => {
    const values = line.split(/\s+/);
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] || '';
    });
    return obj;
  });
}; 