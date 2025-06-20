# Container GUI - Troubleshooting Guide

This guide helps resolve common issues when using Container GUI with Apple's container CLI.

## 🚨 Common Issues and Solutions

### **Issue: "No such file or directory" Error**

**Symptoms:**
- Error message: "Failed to execute command: No such file or directory (os error 2)"
- Commands fail with exit code 1
- System shows CLI as "Not found"

**Root Cause:**
The Apple Container CLI is not installed or not accessible to the application.

**Solutions:**

#### **1. Install Apple Container CLI**
```bash
# Download from GitHub releases
# https://github.com/apple/container/releases

# Install the .pkg file (requires admin password)
# This installs to /usr/local/bin/container

# Verify installation
container --version
```

#### **2. Check Installation Path**
```bash
# Check if container CLI is available
which container

# Should output: /usr/local/bin/container
```

#### **3. Start Container System**
```bash
# Start the container daemon
sudo container system start

# Verify it's running
container ls
```

#### **4. Restart the App**
After installing the CLI, completely quit and restart Container GUI.

---

### **Issue: "CLI Found but Not Working"**

**Symptoms:**
- CLI path shows correctly in System Requirements
- Commands still fail or return errors
- Version check fails

**Solutions:**

#### **1. Check Permissions**
```bash
# Verify CLI is executable
ls -la /usr/local/bin/container

# Should show: -rwxr-xr-x (executable permissions)
```

#### **2. Test CLI Manually**
```bash
# Test basic command
container --version

# Test list command
container ls

# If these fail, the issue is with the CLI installation, not the GUI
```

#### **3. Reinstall Container CLI**
```bash
# Uninstall existing installation
sudo /usr/local/bin/uninstall-container.sh -d

# Download and reinstall the latest version
# https://github.com/apple/container/releases
```

---

### **Issue: "No Containers Found" (but containers exist)**

**Symptoms:**
- Dashboard shows "No containers found"
- CLI works fine in terminal
- Test button may show success but no containers appear

**Solutions:**

#### **1. Check Container Format**
The GUI expects JSON format. Verify:
```bash
# This should work
container ls --format json

# This is what the GUI uses internally
container ls -a --format json
```

#### **2. Restart Container System**
```bash
sudo container system stop
sudo container system start
```

#### **3. Check System Compatibility**
- Ensure you're on macOS 15+ (preferably macOS 26 beta)
- Verify Apple Silicon architecture
- Check Container CLI version compatibility

---

### **Issue: "Images Not Displaying"**

**Symptoms:**
- Images page shows empty or fails to load
- Pull/build works but images don't appear

**Solutions:**

#### **1. Test Images Command**
```bash
# Check if this works
container images ls

# This is what the GUI uses
container images ls --format table
```

#### **2. Refresh Images**
- Click the "Refresh" button in the Images page
- Use the "Test" button to verify command works

#### **3. Check Image Format**
Apple Container CLI may output different formats than expected. The GUI handles the standard format.

---

### **Issue: App Won't Start or Crashes**

**Symptoms:**
- App quits immediately after launching
- Crash reports mention container CLI
- App hangs on startup

**Solutions:**

#### **1. Check System Requirements**
- Apple Silicon Mac required
- macOS 15.0 or later
- At least 50MB free disk space

#### **2. Reset App Preferences**
```bash
# Remove app preferences (macOS)
rm -rf ~/Library/Preferences/com.containergui.app.plist
rm -rf ~/Library/Application\ Support/Container\ GUI/
```

#### **3. Check Console Logs**
Open Console.app and look for "Container GUI" errors for more details.

---

### **Issue: Authentication Failures**

**Symptoms:**
- Docker Hub login fails
- Registry operations don't work
- "401 Unauthorized" errors

**Solutions:**

#### **1. Use Personal Access Token**
Instead of password, use a Docker Hub Personal Access Token:
1. Go to Docker Hub → Account Settings → Security
2. Create new Access Token
3. Use token as password in GUI

#### **2. Test CLI Authentication**
```bash
# Test authentication manually
echo "your_token" | container registry login --username your_username --password-stdin registry-1.docker.io
```

#### **3. Check Registry URL**
- Leave registry field empty for Docker Hub
- For custom registries, use full URL (e.g., `registry.example.com`)

---

## 🔧 Advanced Troubleshooting

### **Debug Mode**
1. Open app in browser: `http://localhost:3000` (during development)
2. Open Developer Tools (F12)
3. Check Console for detailed error messages
4. Use "Test" buttons to verify individual commands

### **CLI Path Detection**
The app checks these paths in order:
1. `/usr/local/bin/container`
2. `/opt/homebrew/bin/container`
3. `/usr/bin/container`
4. `container` (via PATH)

### **Environment Issues**
If CLI works in terminal but not in app:
```bash
# Check your shell environment
echo $PATH
echo $USER

# App may not have same environment as terminal
```

---

## 📞 Getting Help

### **Before Reporting Issues:**
1. Check Container CLI version: `container --version`
2. Test basic CLI commands: `container ls`
3. Verify system compatibility (Apple Silicon + macOS 15+)
4. Check System Requirements in the app

### **Information to Include:**
- macOS version and architecture
- Container CLI version
- Exact error messages
- Steps to reproduce the issue
- Screenshots of error dialogs

### **Known Limitations:**
- Intel Macs have limited support
- macOS 14 and earlier have networking restrictions
- Some advanced CLI features may not be available in GUI

---

## 🎯 Quick Fixes Summary

| Problem | Quick Fix |
|---------|-----------|
| CLI Not Found | Install from GitHub → Restart app |
| Permission Denied | Run `sudo container system start` |
| No Containers | Check `container ls --format json` |
| Auth Failed | Use Personal Access Token instead of password |
| App Crashes | Check Apple Silicon + macOS 15+ requirements |
| Images Missing | Click Refresh → Use Test button |

---

**Still having issues?** The Container GUI System page shows detailed diagnostic information about your setup. 