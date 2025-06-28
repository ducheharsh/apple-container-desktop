#!/usr/bin/env node

/**
 * Apple Container Release Monitor
 * Continuously monitors apple/container GitHub repository for new releases
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class AppleContainerMonitor {
  constructor() {
    this.repoOwner = 'apple';
    this.repoName = 'container';
    this.apiBase = 'https://api.github.com';
    this.stateFile = path.join(__dirname, '..', '.release-state.json');
    this.logFile = path.join(__dirname, '..', 'logs', 'release-monitor.log');
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

  async loadState() {
    try {
      const data = await fs.readFile(this.stateFile, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return {
        lastCheckedRelease: null,
        lastProcessedTag: null,
        processedReleases: [],
        lastCheckTime: null
      };
    }
  }

  async saveState(state) {
    try {
      await fs.writeFile(this.stateFile, JSON.stringify(state, null, 2));
    } catch (error) {
      await this.log(`Failed to save state: ${error.message}`);
    }
  }

  async fetchLatestRelease() {
    const url = `${this.apiBase}/repos/${this.repoOwner}/${this.repoName}/releases/latest`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      await this.log(`Failed to fetch latest release: ${error.message}`);
      return null;
    }
  }

  async fetchAllReleases() {
    const url = `${this.apiBase}/repos/${this.repoOwner}/${this.repoName}/releases`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      await this.log(`Failed to fetch releases: ${error.message}`);
      return [];
    }
  }

  async fetchRepoChanges(tag) {
    const url = `${this.apiBase}/repos/${this.repoOwner}/${this.repoName}/compare/main...${tag}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      await this.log(`Failed to fetch changes for ${tag}: ${error.message}`);
      return null;
    }
  }

  async fetchReadmeContent() {
    const url = `${this.apiBase}/repos/${this.repoOwner}/${this.repoName}/readme`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      return Buffer.from(data.content, 'base64').toString('utf-8');
    } catch (error) {
      await this.log(`Failed to fetch README: ${error.message}`);
      return null;
    }
  }

  analyzeReleaseNotes(release) {
    const analysis = {
      version: release.tag_name,
      releaseDate: release.published_at,
      isPrerelease: release.prerelease,
      isDraft: release.draft,
      features: [],
      breakingChanges: [],
      commands: [],
      flags: [],
      deprecations: [],
      bugFixes: []
    };

    const body = release.body || '';
    const lines = body.split('\n');

    // Patterns to detect different types of changes
    const patterns = {
      features: [
        /(?:new|added|feature|implement|introduce)/i,
        /(?:✨|🎉|🚀|⭐)/,
        /feat(?:ure)?[:\s]/i
      ],
      breakingChanges: [
        /breaking.{0,10}change/i,
        /💥|⚠️|🚨/,
        /BREAKING[:\s]/i,
        /breaking[:\s]/i
      ],
      commands: [
        /container\s+(\w+)/g,
        /`container\s+([^`]+)`/g,
        /new.{0,20}command/i
      ],
      flags: [
        /--(\w+)/g,
        /-(\w)\s/g,
        /flag/i
      ],
      deprecations: [
        /deprecat/i,
        /remov/i,
        /discontinu/i
      ],
      bugFixes: [
        /fix/i,
        /bug/i,
        /🐛|🔧/,
        /resolve/i
      ]
    };

    // Analyze each line
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      // Check for features
      if (patterns.features.some(pattern => pattern.test(trimmedLine))) {
        analysis.features.push(trimmedLine);
      }

      // Check for breaking changes
      if (patterns.breakingChanges.some(pattern => pattern.test(trimmedLine))) {
        analysis.breakingChanges.push(trimmedLine);
      }

      // Extract commands
      patterns.commands.forEach(pattern => {
        if (pattern.global) {
          // Use matchAll for global patterns
          try {
            const matches = trimmedLine.matchAll(pattern);
            for (const match of matches) {
              if (match[1] && !analysis.commands.includes(match[1])) {
                analysis.commands.push(match[1]);
              }
            }
          } catch (error) {
            // Fallback for matchAll errors
            const match = trimmedLine.match(pattern);
            if (match && match[1] && !analysis.commands.includes(match[1])) {
              analysis.commands.push(match[1]);
            }
          }
        } else {
          // Use test for non-global patterns (like /new.{0,20}command/i)
          if (pattern.test(trimmedLine) && !analysis.commands.includes('new-command-detected')) {
            analysis.commands.push('new-command-detected');
          }
        }
      });

      // Extract flags
      try {
        const flagMatches = trimmedLine.matchAll(patterns.flags[0]);
        for (const match of flagMatches) {
          if (match[1] && !analysis.flags.includes(`--${match[1]}`)) {
            analysis.flags.push(`--${match[1]}`);
          }
        }
      } catch (error) {
        // Fallback for patterns without global flag
        const flagMatch = trimmedLine.match(patterns.flags[0]);
        if (flagMatch && flagMatch[1] && !analysis.flags.includes(`--${flagMatch[1]}`)) {
          analysis.flags.push(`--${flagMatch[1]}`);
        }
      }

      // Check for deprecations
      if (patterns.deprecations.some(pattern => pattern.test(trimmedLine))) {
        analysis.deprecations.push(trimmedLine);
      }

      // Check for bug fixes
      if (patterns.bugFixes.some(pattern => pattern.test(trimmedLine))) {
        analysis.bugFixes.push(trimmedLine);
      }
    });

    return analysis;
  }

  async generateReleaseReport(release, analysis) {
    const report = {
      timestamp: new Date().toISOString(),
      release: {
        tag: release.tag_name,
        name: release.name,
        published: release.published_at,
        url: release.html_url,
        prerelease: release.prerelease
      },
      analysis,
      recommendations: [],
      integrationTasks: []
    };

    // Generate recommendations based on analysis
    if (analysis.commands.length > 0) {
      report.recommendations.push('Update CLI command mappings in containerUtils.js');
      report.integrationTasks.push('Add new command support to Tauri backend');
    }

    if (analysis.flags.length > 0) {
      report.recommendations.push('Add new flags to UI forms and command builders');
      report.integrationTasks.push('Update form validation and option handling');
    }

    if (analysis.features.length > 0) {
      report.recommendations.push('Review features for potential UI integration');
      report.integrationTasks.push('Plan new UI components for enhanced features');
    }

    if (analysis.breakingChanges.length > 0) {
      report.recommendations.push('URGENT: Review breaking changes for compatibility');
      report.integrationTasks.push('Update command syntax and error handling');
    }

    return report;
  }

  async saveReleaseReport(report) {
    const reportsDir = path.join(__dirname, '..', 'reports');
    await fs.mkdir(reportsDir, { recursive: true });
    
    const filename = `release-${report.release.tag}-${Date.now()}.json`;
    const filepath = path.join(reportsDir, filename);
    
    await fs.writeFile(filepath, JSON.stringify(report, null, 2));
    await this.log(`Release report saved: ${filepath}`);
    
    return filepath;
  }

  async checkForNewReleases() {
    await this.log('🔍 Checking for new releases...');
    
    const state = await this.loadState();
    const latestRelease = await this.fetchLatestRelease();
    
    if (!latestRelease) {
      await this.log('❌ Failed to fetch latest release');
      return false;
    }

    const latestTag = latestRelease.tag_name;
    
    if (state.lastProcessedTag === latestTag) {
      await this.log(`✅ No new releases (current: ${latestTag})`);
      state.lastCheckTime = new Date().toISOString();
      await this.saveState(state);
      return false;
    }

    await this.log(`🎉 New release detected: ${latestTag}`);
    
    // Analyze the release
    const analysis = this.analyzeReleaseNotes(latestRelease);
    const report = await this.generateReleaseReport(latestRelease, analysis);
    
    // Save the report
    await this.saveReleaseReport(report);
    
    // Update state
    state.lastProcessedTag = latestTag;
    state.lastCheckedRelease = latestRelease.id;
    state.processedReleases.push({
      tag: latestTag,
      processedAt: new Date().toISOString(),
      releaseId: latestRelease.id
    });
    state.lastCheckTime = new Date().toISOString();
    
    await this.saveState(state);
    
    // Trigger integration process
    await this.triggerIntegrationWorkflow(report);
    
    return true;
  }

  async triggerIntegrationWorkflow(report) {
    await this.log('🔄 Triggering integration workflow...');
    
    try {
      // Run the integration script
      const integrationScript = path.join(__dirname, 'integrate-release.js');
      execSync(`node "${integrationScript}" "${JSON.stringify(report).replace(/"/g, '\\"')}"`, {
        stdio: 'inherit',
        cwd: path.dirname(__dirname)
      });
      
      await this.log('✅ Integration workflow completed');
    } catch (error) {
      await this.log(`❌ Integration workflow failed: ${error.message}`);
    }
  }

  async start() {
    await this.log('🚀 Starting Apple Container Release Monitor');
    
    // Initial check
    await this.checkForNewReleases();
    
    // Set up periodic checking (every 30 minutes)
    setInterval(async () => {
      try {
        await this.checkForNewReleases();
      } catch (error) {
        await this.log(`❌ Monitor error: ${error.message}`);
      }
    }, 30 * 60 * 1000);
    
    await this.log('⏰ Monitor started - checking every 30 minutes');
  }
}

// CLI execution
if (require.main === module) {
  const monitor = new AppleContainerMonitor();
  
  // Check for single-check flag
  const singleCheck = process.argv.includes('--single-check');
  
  process.on('SIGINT', async () => {
    await monitor.log('🛑 Monitor stopped by user');
    process.exit(0);
  });
  
  process.on('uncaughtException', async (error) => {
    await monitor.log(`💥 Uncaught exception: ${error.message}`);
    process.exit(1);
  });
  
  if (singleCheck) {
    // Run a single check and exit
    monitor.checkForNewReleases().then(async (newRelease) => {
      if (newRelease) {
        await monitor.log('✅ Single check completed - new release processed');
      } else {
        await monitor.log('✅ Single check completed - no new releases');
      }
      process.exit(0);
    }).catch(async (error) => {
      await monitor.log(`💥 Single check failed: ${error.message}`);
      process.exit(1);
    });
  } else {
    // Start continuous monitoring
    monitor.start().catch(async (error) => {
      await monitor.log(`💥 Failed to start monitor: ${error.message}`);
      process.exit(1);
    });
  }
}

module.exports = AppleContainerMonitor;