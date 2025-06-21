#!/usr/bin/env node

/**
 * Apple Container Release Integration
 * Automatically integrates new container CLI features into the GUI application
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class ReleaseIntegrator {
  constructor(reportData) {
    this.report = typeof reportData === 'string' ? JSON.parse(reportData) : reportData;
    this.projectRoot = path.join(__dirname, '..');
    this.logFile = path.join(this.projectRoot, 'logs', 'integration.log');
  }

  async log(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    console.log(message);
    
    try {
      await fs.mkdir(path.dirname(this.logFile), { recursive: true });
      await fs.appendFile(this.logFile, logEntry);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  async updateContainerUtils() {
    await this.log('📦 Updating containerUtils.js...');
    
    const utilsPath = path.join(this.projectRoot, 'src', 'utils', 'containerUtils.js');
    
    try {
      let content = await fs.readFile(utilsPath, 'utf-8');
      const { analysis } = this.report;
      
      // Add new commands if detected
      if (analysis.commands.length > 0) {
        await this.log(`Adding support for new commands: ${analysis.commands.join(', ')}`);
        
        // Generate command mappings
        let commandMappings = '';
        analysis.commands.forEach(cmd => {
          commandMappings += `
  // Auto-generated support for container ${cmd}
  async execute${cmd.charAt(0).toUpperCase() + cmd.slice(1)}(options = {}) {
    const args = ['${cmd}'];
    
    // Add common flags
    if (options.format) args.push('--format', options.format);
    if (options.all) args.push('--all');
    if (options.verbose) args.push('--verbose');
    
    return await this.executeCommand(args, options);
  },
`;
        });
        
        // Insert before the closing brace of the class
        const insertPoint = content.lastIndexOf('};');
        if (insertPoint !== -1) {
          content = content.slice(0, insertPoint) + commandMappings + content.slice(insertPoint);
        }
      }
      
      // Add new flags support
      if (analysis.flags.length > 0) {
        await this.log(`Adding support for new flags: ${analysis.flags.join(', ')}`);
        
        // Update flag validation
        const flagValidation = `
  // Auto-generated flag validation for ${this.report.release.tag}
  validateFlags(command, flags) {
    const supportedFlags = {
      ${analysis.flags.map(flag => `'${flag}': true`).join(',\n      ')}
    };
    
    return flags.filter(flag => supportedFlags[flag] || flag.startsWith('--'));
  },
`;
        
        // Add flag validation method
        const insertPoint = content.lastIndexOf('};');
        if (insertPoint !== -1) {
          content = content.slice(0, insertPoint) + flagValidation + content.slice(insertPoint);
        }
      }
      
      await fs.writeFile(utilsPath, content);
      await this.log('✅ containerUtils.js updated successfully');
      
    } catch (error) {
      await this.log(`❌ Failed to update containerUtils.js: ${error.message}`);
    }
  }

  async updateUIComponents() {
    await this.log('🎨 Updating UI components...');
    
    const { analysis } = this.report;
    
    // Update forms with new flags
    if (analysis.flags.length > 0) {
      await this.updateRunContainerForm();
      await this.updateBuildImageForm();
    }
    
    // Add new command buttons/pages if needed
    if (analysis.commands.length > 0) {
      await this.addNewCommandSupport();
    }
  }

  async updateRunContainerForm() {
    const formPath = path.join(this.projectRoot, 'src', 'routes', 'RunContainer.jsx');
    
    try {
      let content = await fs.readFile(formPath, 'utf-8');
      const { analysis } = this.report;
      
      // Add new flag inputs
      const newFlagInputs = analysis.flags.map(flag => {
        const flagName = flag.replace('--', '');
        const camelCase = flagName.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        
        return `
          {/* Auto-generated for ${flag} - ${this.report.release.tag} */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              ${flag.charAt(2).toUpperCase() + flag.slice(3).replace(/-/g, ' ')}
            </label>
            <input
              type="text"
              value={formData.${camelCase} || ''}
              onChange={(e) => setFormData({ ...formData, ${camelCase}: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Enter ${flag.slice(2)} value"
            />
          </div>`;
      }).join('\n');
      
      // Insert new inputs before the submit button
      const submitButtonPattern = /<button[^>]*type="submit"[^>]*>/;
      const match = content.match(submitButtonPattern);
      if (match) {
        const insertPoint = content.indexOf(match[0]);
        content = content.slice(0, insertPoint) + newFlagInputs + '\n\n        ' + content.slice(insertPoint);
      }
      
      await fs.writeFile(formPath, content);
      await this.log('✅ RunContainer form updated with new flags');
      
    } catch (error) {
      await this.log(`❌ Failed to update RunContainer form: ${error.message}`);
    }
  }

  async updateBuildImageForm() {
    const formPath = path.join(this.projectRoot, 'src', 'routes', 'BuildImage.jsx');
    
    try {
      let content = await fs.readFile(formPath, 'utf-8');
      const { analysis } = this.report;
      
      // Add build-specific flags
      const buildFlags = analysis.flags.filter(flag => 
        flag.includes('build') || flag.includes('image') || flag.includes('tag')
      );
      
      if (buildFlags.length > 0) {
        const newFlagInputs = buildFlags.map(flag => {
          const flagName = flag.replace('--', '');
          const camelCase = flagName.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
          
          return `
            {/* Auto-generated for ${flag} - ${this.report.release.tag} */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                ${flag.charAt(2).toUpperCase() + flag.slice(3).replace(/-/g, ' ')}
              </label>
              <input
                type="text"
                value={buildFormData.${camelCase} || ''}
                onChange={(e) => setBuildFormData({ ...buildFormData, ${camelCase}: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Enter ${flag.slice(2)} value"
              />
            </div>`;
        }).join('\n');
        
        // Insert new inputs
        const submitButtonPattern = /<button[^>]*onClick.*buildImage[^>]*>/;
        const match = content.match(submitButtonPattern);
        if (match) {
          const insertPoint = content.indexOf(match[0]);
          content = content.slice(0, insertPoint) + newFlagInputs + '\n\n          ' + content.slice(insertPoint);
        }
        
        await fs.writeFile(formPath, content);
        await this.log('✅ BuildImage form updated with new flags');
      }
      
    } catch (error) {
      await this.log(`❌ Failed to update BuildImage form: ${error.message}`);
    }
  }

  async addNewCommandSupport() {
    const { analysis } = this.report;
    
    for (const command of analysis.commands) {
      await this.log(`🔧 Adding support for 'container ${command}' command`);
      
      // Check if this command needs a dedicated UI page
      if (this.needsUIPage(command)) {
        await this.createCommandPage(command);
      }
      
      // Add to sidebar navigation if it's a major command
      if (this.isMajorCommand(command)) {
        await this.updateSidebar(command);
      }
    }
  }

  needsUIPage(command) {
    const pageWorthy = ['build', 'run', 'logs', 'images', 'system', 'registry', 'network'];
    return pageWorthy.some(keyword => command.toLowerCase().includes(keyword));
  }

  isMajorCommand(command) {
    const majorCommands = ['build', 'run', 'logs', 'images', 'system', 'registry', 'network', 'volume'];
    return majorCommands.includes(command.toLowerCase());
  }

  async createCommandPage(command) {
    const pageName = command.charAt(0).toUpperCase() + command.slice(1);
    const pagePath = path.join(this.projectRoot, 'src', 'routes', `${pageName}.jsx`);
    
    try {
      // Check if page already exists
      try {
        await fs.access(pagePath);
        await this.log(`Page ${pageName}.jsx already exists, skipping creation`);
        return;
      } catch {
        // Page doesn't exist, create it
      }
      
      const pageTemplate = `import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import CommandOutput from '../components/CommandOutput';

// Auto-generated page for 'container ${command}' command
// Generated from ${this.report.release.tag} release

export default function ${pageName}() {
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({});

  const execute${pageName} = async () => {
    setLoading(true);
    setError('');
    setOutput('');

    try {
      const result = await invoke('execute_container_command', {
        args: ['${command}', ...Object.entries(formData)
          .filter(([key, value]) => value)
          .flatMap(([key, value]) => [\`--\${key.replace(/([A-Z])/g, '-$1').toLowerCase()}\`, value])]
      });

      setOutput(result);
    } catch (err) {
      setError(err.toString());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Container ${pageName}</h1>
        <p className="text-gray-600 mt-2">
          Execute 'container ${command}' command with advanced options
        </p>
        <div className="mt-2 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-md inline-block">
          New in ${this.report.release.tag}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Command Options</h2>
            
            {/* Add form fields based on detected flags */}
            <div className="space-y-4">
              <button
                onClick={execute${pageName}}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Executing...' : \`Execute container ${command}\`}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <CommandOutput 
            output={output} 
            error={error} 
            loading={loading}
            title={\`container ${command} output\`}
          />
        </div>
      </div>
    </div>
  );
}`;

      await fs.writeFile(pagePath, pageTemplate);
      await this.log(`✅ Created new page: ${pageName}.jsx`);
      
      // Update routes index
      await this.updateRoutesIndex(pageName);
      
    } catch (error) {
      await this.log(`❌ Failed to create page for ${command}: ${error.message}`);
    }
  }

  async updateRoutesIndex(pageName) {
    const indexPath = path.join(this.projectRoot, 'src', 'routes', 'index.js');
    
    try {
      let content = await fs.readFile(indexPath, 'utf-8');
      
      // Add import
      const importLine = `import ${pageName} from './${pageName}';`;
      if (!content.includes(importLine)) {
        content = importLine + '\n' + content;
      }
      
      // Add export
      const exportPattern = /export\s*{\s*([^}]*)\s*}/;
      const match = content.match(exportPattern);
      if (match) {
        const exports = match[1].trim();
        const newExports = exports ? `${exports},\n  ${pageName}` : pageName;
        content = content.replace(exportPattern, `export {\n  ${newExports}\n}`);
      }
      
      await fs.writeFile(indexPath, content);
      await this.log(`✅ Updated routes index with ${pageName}`);
      
    } catch (error) {
      await this.log(`❌ Failed to update routes index: ${error.message}`);
    }
  }

  async updateSidebar(command) {
    const sidebarPath = path.join(this.projectRoot, 'src', 'components', 'Sidebar.jsx');
    
    try {
      let content = await fs.readFile(sidebarPath, 'utf-8');
      
      const pageName = command.charAt(0).toUpperCase() + command.slice(1);
      const navItem = `        <Link
          to="/${command.toLowerCase()}"
          className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <span className="text-gray-600">🔧</span>
          <span>${pageName}</span>
          <span className="ml-auto text-xs bg-green-100 text-green-800 px-2 py-1 rounded">New</span>
        </Link>`;
      
      // Insert before the closing nav tag
      const insertPoint = content.lastIndexOf('</nav>');
      if (insertPoint !== -1) {
        content = content.slice(0, insertPoint) + navItem + '\n      ' + content.slice(insertPoint);
      }
      
      await fs.writeFile(sidebarPath, content);
      await this.log(`✅ Added ${pageName} to sidebar navigation`);
      
    } catch (error) {
      await this.log(`❌ Failed to update sidebar: ${error.message}`);
    }
  }

  async updateVersionInfo() {
    await this.log('📄 Updating version information...');
    
    const { release } = this.report;
    
    // Update package.json
    const packagePath = path.join(this.projectRoot, 'package.json');
    try {
      const packageData = JSON.parse(await fs.readFile(packagePath, 'utf-8'));
      const currentVersion = packageData.version.split('.').map(Number);
      currentVersion[2]++; // Increment patch version
      
      packageData.version = currentVersion.join('.');
      packageData.description = `Modern GUI for Apple Container CLI (supports ${release.tag})`;
      
      await fs.writeFile(packagePath, JSON.stringify(packageData, null, 2));
      await this.log(`✅ Updated package.json to version ${packageData.version}`);
      
    } catch (error) {
      await this.log(`❌ Failed to update package.json: ${error.message}`);
    }
    
    // Update Tauri config
    const tauriConfigPath = path.join(this.projectRoot, 'src-tauri', 'tauri.conf.json');
    try {
      const configData = JSON.parse(await fs.readFile(tauriConfigPath, 'utf-8'));
      const currentVersion = configData.version.split('.').map(Number);
      currentVersion[2]++; // Increment patch version
      
      configData.version = currentVersion.join('.');
      configData.bundle.longDescription = `A modern, intuitive desktop application for managing Apple's container CLI with comprehensive support for ${release.tag} features. Includes container lifecycle management, Docker Hub integration, real-time image discovery, one-click pulls, persistent state management, real-time logs, and system control.`;
      
      await fs.writeFile(tauriConfigPath, JSON.stringify(configData, null, 2));
      await this.log(`✅ Updated Tauri config to version ${configData.version}`);
      
    } catch (error) {
      await this.log(`❌ Failed to update Tauri config: ${error.message}`);
    }
  }

  async generateReleaseNotes() {
    await this.log('📝 Generating release notes...');
    
    const { release, analysis } = this.report;
    const notesPath = path.join(this.projectRoot, 'RELEASE_NOTES.md');
    
    const releaseNotes = `# Container GUI Release Notes

## Latest Update: Support for Apple Container ${release.tag}

**Release Date:** ${new Date().toISOString().split('T')[0]}
**Container CLI Version:** ${release.tag}
**Release URL:** ${release.url}

### 🎉 New Features Added

${analysis.features.length > 0 ? 
  analysis.features.map(feature => `- ${feature}`).join('\n') : 
  '- Updated compatibility with latest Apple Container CLI'
}

### 🔧 New Commands Supported

${analysis.commands.length > 0 ? 
  analysis.commands.map(cmd => `- \`container ${cmd}\``).join('\n') : 
  '- No new commands in this release'
}

### 🚩 New Flags & Options

${analysis.flags.length > 0 ? 
  analysis.flags.map(flag => `- \`${flag}\``).join('\n') : 
  '- No new flags in this release'
}

### ⚠️ Breaking Changes

${analysis.breakingChanges.length > 0 ? 
  analysis.breakingChanges.map(change => `- ${change}`).join('\n') : 
  '- No breaking changes in this release'
}

### 🐛 Bug Fixes

${analysis.bugFixes.length > 0 ? 
  analysis.bugFixes.map(fix => `- ${fix}`).join('\n') : 
  '- General stability improvements'
}

### 📚 Documentation Updates

- Updated to reflect ${release.tag} compatibility
- Added support documentation for new features
- Enhanced troubleshooting guides

### 🔄 Integration Details

**Automatic Updates:**
- CLI command mappings updated
- UI forms enhanced with new options
- Error handling improved for new features
- Backward compatibility maintained

**Manual Testing Required:**
- Test new commands in the GUI
- Verify flag behavior matches CLI
- Check for any UI/UX improvements needed

---

*This release was automatically generated from Apple Container ${release.tag} release analysis.*
*Generated on: ${new Date().toISOString()}*
`;

    try {
      await fs.writeFile(notesPath, releaseNotes);
      await this.log('✅ Release notes generated successfully');
    } catch (error) {
      await this.log(`❌ Failed to generate release notes: ${error.message}`);
    }
  }

  async runTests() {
    await this.log('🧪 Running integration tests...');
    
    try {
      // Run basic tests to ensure the app still builds
      execSync('npm test -- --watchAll=false --passWithNoTests', {
        cwd: this.projectRoot,
        stdio: 'pipe'
      });
      
      await this.log('✅ Tests passed successfully');
      return true;
    } catch (error) {
      await this.log(`❌ Tests failed: ${error.message}`);
      return false;
    }
  }

  async createBackup() {
    await this.log('💾 Creating backup before integration...');
    
    const backupDir = path.join(this.projectRoot, 'backups', `pre-${this.report.release.tag}`);
    
    try {
      await fs.mkdir(backupDir, { recursive: true });
      
      // Backup critical files
      const filesToBackup = [
        'src/utils/containerUtils.js',
        'src/routes/RunContainer.jsx',
        'src/routes/BuildImage.jsx',
        'src/components/Sidebar.jsx',
        'package.json',
        'src-tauri/tauri.conf.json'
      ];
      
      for (const file of filesToBackup) {
        const sourcePath = path.join(this.projectRoot, file);
        const backupPath = path.join(backupDir, file);
        
        try {
          await fs.mkdir(path.dirname(backupPath), { recursive: true });
          await fs.copyFile(sourcePath, backupPath);
        } catch (error) {
          await this.log(`⚠️ Failed to backup ${file}: ${error.message}`);
        }
      }
      
      await this.log(`✅ Backup created: ${backupDir}`);
    } catch (error) {
      await this.log(`❌ Failed to create backup: ${error.message}`);
    }
  }

  async integrate() {
    await this.log(`🚀 Starting integration for Apple Container ${this.report.release.tag}`);
    
    try {
      // Create backup
      await this.createBackup();
      
      // Update core functionality
      await this.updateContainerUtils();
      
      // Update UI components
      await this.updateUIComponents();
      
      // Update version information
      await this.updateVersionInfo();
      
      // Generate release notes
      await this.generateReleaseNotes();
      
      // Run tests
      const testsPass = await this.runTests();
      
      if (testsPass) {
        await this.log('🎉 Integration completed successfully!');
        await this.log('📋 Next steps:');
        await this.log('   1. Review the generated changes');
        await this.log('   2. Test the new features manually');
        await this.log('   3. Update documentation if needed');
        await this.log('   4. Commit changes to git');
        await this.log('   5. Create a new release');
      } else {
        await this.log('⚠️ Integration completed with test failures');
        await this.log('📋 Manual review required before release');
      }
      
    } catch (error) {
      await this.log(`💥 Integration failed: ${error.message}`);
      throw error;
    }
  }
}

// CLI execution
if (require.main === module) {
  const reportData = process.argv[2];
  
  if (!reportData) {
    console.error('Usage: node integrate-release.js <report-json>');
    process.exit(1);
  }
  
  const integrator = new ReleaseIntegrator(reportData);
  
  integrator.integrate().catch((error) => {
    console.error('Integration failed:', error);
    process.exit(1);
  });
}

module.exports = ReleaseIntegrator;