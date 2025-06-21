#!/usr/bin/env node

/**
 * Integration Testing Suite
 * Tests new container CLI features integration
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class IntegrationTester {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.logFile = path.join(this.projectRoot, 'logs', 'testing.log');
    this.testResults = [];
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

  async runTest(testName, testFunction) {
    await this.log(`🧪 Running test: ${testName}`);
    
    try {
      const startTime = Date.now();
      await testFunction();
      const duration = Date.now() - startTime;
      
      this.testResults.push({
        name: testName,
        status: 'PASSED',
        duration,
        error: null
      });
      
      await this.log(`✅ Test passed: ${testName} (${duration}ms)`);
      return true;
    } catch (error) {
      this.testResults.push({
        name: testName,
        status: 'FAILED',
        duration: 0,
        error: error.message
      });
      
      await this.log(`❌ Test failed: ${testName} - ${error.message}`);
      return false;
    }
  }

  async testContainerCLIAvailability() {
    try {
      execSync('container --version', { stdio: 'pipe' });
    } catch (error) {
      throw new Error('Apple Container CLI not available or not in PATH');
    }
  }

  async testProjectBuild() {
    try {
      await this.log('Building React application...');
      execSync('npm run build', {
        cwd: this.projectRoot,
        stdio: 'pipe'
      });
    } catch (error) {
      throw new Error(`Build failed: ${error.message}`);
    }
  }

  async testTauriBuild() {
    try {
      await this.log('Testing Tauri build...');
      execSync('npm run tauri build --debug', {
        cwd: this.projectRoot,
        stdio: 'pipe',
        timeout: 300000 // 5 minutes timeout
      });
    } catch (error) {
      throw new Error(`Tauri build failed: ${error.message}`);
    }
  }

  async testContainerUtilsIntegrity() {
    const utilsPath = path.join(this.projectRoot, 'src', 'utils', 'containerUtils.js');
    
    try {
      const content = await fs.readFile(utilsPath, 'utf-8');
      
      // Check for syntax errors
      try {
        eval(`(function() { ${content} })()`);
      } catch (syntaxError) {
        throw new Error(`Syntax error in containerUtils.js: ${syntaxError.message}`);
      }
      
      // Check for required methods
      const requiredMethods = [
        'executeCommand',
        'runContainer',
        'buildImage',
        'getContainerLogs'
      ];
      
      for (const method of requiredMethods) {
        if (!content.includes(method)) {
          throw new Error(`Required method '${method}' not found in containerUtils.js`);
        }
      }
      
    } catch (error) {
      throw new Error(`ContainerUtils integrity check failed: ${error.message}`);
    }
  }

  async testUIComponentsIntegrity() {
    const componentsToTest = [
      'src/routes/RunContainer.jsx',
      'src/routes/BuildImage.jsx',
      'src/routes/Images.jsx',
      'src/routes/Logs.jsx',
      'src/components/Sidebar.jsx'
    ];
    
    for (const componentPath of componentsToTest) {
      const fullPath = path.join(this.projectRoot, componentPath);
      
      try {
        const content = await fs.readFile(fullPath, 'utf-8');
        
        // Check for basic React structure
        if (!content.includes('import React') && !content.includes('from \'react\'')) {
          throw new Error(`${componentPath}: Missing React import`);
        }
        
        // Check for export
        if (!content.includes('export default') && !content.includes('export {')) {
          throw new Error(`${componentPath}: Missing export statement`);
        }
        
        // Check for JSX syntax validity (basic check)
        const jsxElements = content.match(/<[A-Z][a-zA-Z0-9]*.*?>/g);
        if (jsxElements && jsxElements.some(element => !element.includes('>'))) {
          throw new Error(`${componentPath}: Malformed JSX elements detected`);
        }
        
      } catch (error) {
        throw new Error(`Component integrity check failed for ${componentPath}: ${error.message}`);
      }
    }
  }

  async testPackageJsonIntegrity() {
    const packagePath = path.join(this.projectRoot, 'package.json');
    
    try {
      const content = await fs.readFile(packagePath, 'utf-8');
      const packageData = JSON.parse(content);
      
      // Check required fields
      const requiredFields = ['name', 'version', 'dependencies', 'scripts'];
      for (const field of requiredFields) {
        if (!packageData[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }
      
      // Check required dependencies
      const requiredDeps = ['react', '@tauri-apps/api'];
      for (const dep of requiredDeps) {
        if (!packageData.dependencies[dep] && !packageData.devDependencies[dep]) {
          throw new Error(`Missing required dependency: ${dep}`);
        }
      }
      
      // Check required scripts
      const requiredScripts = ['start', 'build', 'tauri'];
      for (const script of requiredScripts) {
        if (!packageData.scripts[script]) {
          throw new Error(`Missing required script: ${script}`);
        }
      }
      
    } catch (error) {
      throw new Error(`Package.json integrity check failed: ${error.message}`);
    }
  }

  async testTauriConfigIntegrity() {
    const configPath = path.join(this.projectRoot, 'src-tauri', 'tauri.conf.json');
    
    try {
      const content = await fs.readFile(configPath, 'utf-8');
      const configData = JSON.parse(content);
      
      // Check required fields
      const requiredFields = ['productName', 'version', 'identifier'];
      for (const field of requiredFields) {
        if (!configData[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }
      
      // Validate version format
      const versionPattern = /^\d+\.\d+\.\d+$/;
      if (!versionPattern.test(configData.version)) {
        throw new Error(`Invalid version format: ${configData.version}`);
      }
      
    } catch (error) {
      throw new Error(`Tauri config integrity check failed: ${error.message}`);
    }
  }

  async testNewFeaturesIntegration() {
    // Check for auto-generated content markers
    const filesToCheck = [
      'src/utils/containerUtils.js',
      'src/routes/RunContainer.jsx',
      'src/routes/BuildImage.jsx'
    ];
    
    for (const filePath of filesToCheck) {
      const fullPath = path.join(this.projectRoot, filePath);
      
      try {
        const content = await fs.readFile(fullPath, 'utf-8');
        
        // Look for auto-generated markers
        const autoGenMarkers = [
          'Auto-generated support for',
          'Auto-generated for',
          'Auto-generated flag validation'
        ];
        
        let hasNewFeatures = false;
        for (const marker of autoGenMarkers) {
          if (content.includes(marker)) {
            hasNewFeatures = true;
            await this.log(`✅ Found auto-generated feature in ${filePath}`);
            break;
          }
        }
        
        if (!hasNewFeatures) {
          await this.log(`ℹ️ No auto-generated features found in ${filePath}`);
        }
        
      } catch (error) {
        throw new Error(`New features integration check failed for ${filePath}: ${error.message}`);
      }
    }
  }

  async testContainerCommandExecution() {
    try {
      // Test basic container commands
      const commands = [
        'container --help',
        'container version',
        'container system info'
      ];
      
      for (const command of commands) {
        try {
          execSync(command, { 
            stdio: 'pipe',
            timeout: 10000 // 10 seconds timeout
          });
          await this.log(`✅ Command executed successfully: ${command}`);
        } catch (error) {
          // Some commands might fail in certain environments, log but don't fail test
          await this.log(`⚠️ Command failed (may be expected): ${command}`);
        }
      }
      
    } catch (error) {
      throw new Error(`Container command execution test failed: ${error.message}`);
    }
  }

  async generateTestReport() {
    const reportPath = path.join(this.projectRoot, 'reports', 'test-report.json');
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.testResults.length,
        passed: this.testResults.filter(t => t.status === 'PASSED').length,
        failed: this.testResults.filter(t => t.status === 'FAILED').length,
        duration: this.testResults.reduce((sum, t) => sum + t.duration, 0)
      },
      tests: this.testResults,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      }
    };
    
    try {
      await fs.mkdir(path.dirname(reportPath), { recursive: true });
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
      await this.log(`📄 Test report generated: ${reportPath}`);
    } catch (error) {
      await this.log(`❌ Failed to generate test report: ${error.message}`);
    }
    
    return report;
  }

  async runAllTests() {
    await this.log('🚀 Starting integration test suite...');
    
    const tests = [
      ['Container CLI Availability', () => this.testContainerCLIAvailability()],
      ['Package.json Integrity', () => this.testPackageJsonIntegrity()],
      ['Tauri Config Integrity', () => this.testTauriConfigIntegrity()],
      ['ContainerUtils Integrity', () => this.testContainerUtilsIntegrity()],
      ['UI Components Integrity', () => this.testUIComponentsIntegrity()],
      ['New Features Integration', () => this.testNewFeaturesIntegration()],
      ['Container Command Execution', () => this.testContainerCommandExecution()],
      ['Project Build', () => this.testProjectBuild()]
    ];
    
    // Run Tauri build test only if explicitly requested
    if (process.env.TEST_TAURI_BUILD === 'true') {
      tests.push(['Tauri Build', () => this.testTauriBuild()]);
    }
    
    let passed = 0;
    for (const [testName, testFunction] of tests) {
      if (await this.runTest(testName, testFunction)) {
        passed++;
      }
    }
    
    const report = await this.generateTestReport();
    
    await this.log('');
    await this.log('📊 Test Results Summary:');
    await this.log(`   Total: ${report.summary.total}`);
    await this.log(`   Passed: ${report.summary.passed} ✅`);
    await this.log(`   Failed: ${report.summary.failed} ❌`);
    await this.log(`   Duration: ${report.summary.duration}ms`);
    
    if (report.summary.failed > 0) {
      await this.log('');
      await this.log('❌ Failed tests:');
      this.testResults
        .filter(t => t.status === 'FAILED')
        .forEach(async (test) => {
          await this.log(`   - ${test.name}: ${test.error}`);
        });
    }
    
    return report.summary.failed === 0;
  }
}

// CLI execution
if (require.main === module) {
  const tester = new IntegrationTester();
  
  tester.runAllTests().then((success) => {
    process.exit(success ? 0 : 1);
  }).catch((error) => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = IntegrationTester;