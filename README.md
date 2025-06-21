<br />
<p align="center">
  <a href="https://www.twenty.com">
    <img src="https://github.com/user-attachments/assets/b46c1f73-ec9b-4a4b-9057-22759596c420" width="100px" alt="Container Gui logo" />
  </a>
</p>

<h2 align="center" >Container GUI </h2>

A modern, desktop GUI application for managing [Apple's container CLI](https://github.com/apple/container), built with Tauri and React. Think of it as a Docker Desktop alternative for Apple's container management system.

![Container GUI](https://img.shields.io/badge/Platform-macOS-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![React](https://img.shields.io/badge/React-18+-blue)
![Tauri](https://img.shields.io/badge/Tauri-2.0-orange)
![Apple Container](https://img.shields.io/badge/Apple%20Container-0.1.0+-red)

## About Apple Container

[Apple Container](https://github.com/apple/container) is a tool for creating and running Linux containers using lightweight virtual machines on Mac. It's written in Swift, optimized for Apple silicon, and produces OCI-compliant container images that work with standard container registries.

**System Requirements:**
- 🍎 Apple silicon Mac (M1, M2, M3, etc.)
- 🖥️ macOS 26 beta (limited functionality on macOS 15)  
- 📦 [Apple Container CLI](https://github.com/apple/container/releases) installed

**Key Benefits:**
- ⚡ Native performance on Apple silicon
- 🔒 Lightweight VMs for better security isolation
- 🐳 OCI-compliant container images
- 🔄 Compatible with standard container registries

## 🚀 Features

### 📊 Dashboard
- **Container Overview**: View all containers with status indicators
- **Quick Actions**: Start, stop, restart, and delete containers with one click
- **Real-time Status**: Live updates of container states
- **Direct Navigation**: Jump to logs or other operations

### 🏃‍♂️ Run Containers
- **Interactive Form**: Easy-to-use interface for creating containers
- **Advanced Options**: Port mappings, volume mounts, environment variables
- **Configuration Presets**: Common settings for quick deployment
- **Command Override**: Custom entrypoint and command support

### 📜 Live Logs
- **Real-time Streaming**: Live log viewing with automatic scrolling
- **Historical Logs**: View past container output
- **Download Logs**: Export logs for analysis
- **Multiple Containers**: Switch between different container logs

### 🖼️ Image Management
- **Image Library**: View all available images
- **Pull Images**: Download images from registries
- **Tag Management**: Create and manage image tags
- **Storage Info**: Size and creation date information

### 🔨 Build Images
- **Dockerfile Editor**: Built-in editor with syntax highlighting
- **Template Support**: Pre-built Dockerfile templates
- **Build Context**: Configurable build context and arguments
- **Progress Tracking**: Real-time build output

### ☁️ Registry Operations
- **Registry Login**: Authenticate with container registries
- **Push/Pull**: Upload and download images
- **Multi-Registry**: Support for multiple registry providers
- **Credential Management**: Secure credential storage

### ⚙️ System Control
- **System Management**: Start/stop the container daemon
- **DNS Configuration**: Manage container DNS entries
- **Status Monitoring**: Real-time system status
- **Service Control**: Full control over container services

## 🛠️ Technology Stack

- **Frontend**: React 18+ with modern hooks
- **Styling**: Tailwind CSS for responsive design
- **Icons**: Lucide React for consistent iconography
- **Backend**: Rust with Tauri for native performance
- **Routing**: React Router for single-page navigation
- **State Management**: React built-in state with custom hooks

## 📋 Prerequisites

Before running this application, ensure you have:

1. **Apple's Container CLI** installed and configured
2. **Node.js** (version 16 or higher)
3. **Rust** (latest stable version)
4. **Tauri CLI** installed globally

### Installing Prerequisites

```bash
# Download and install Apple Container CLI from GitHub releases
# https://github.com/apple/container/releases
# Follow the installation instructions for the .pkg installer

# Install Node.js (using Homebrew)
brew install node

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Tauri CLI
npm install -g @tauri-apps/cli

# Start the container system
sudo container system start

# Verify Apple's container CLI is available
container --version
```

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd container-gui
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run tauri:dev
   ```

4. **Build for production**
   ```bash
   npm run tauri:build
   ```

## 🎯 Usage Guide

### Getting Started

1. **Launch the application** - The GUI will automatically start with the sidebar navigation
2. **Check System Status** - Visit the System page to ensure container daemon is running
3. **View Containers** - Dashboard shows all containers with their current status
4. **Create Container** - Use the Run Container page to create new containers
5. **Monitor Logs** - View real-time logs in the Logs section

### Key Operations

#### Running Your First Container
1. Navigate to **Run Container**
2. Enter an image name (e.g., `nginx:latest`)
3. Configure port mappings if needed
4. Click **Run Container**
5. Monitor the output for success

#### Building an Image
1. Go to **Build Image**
2. Enter your image name and tag
3. Create a Dockerfile using the template
4. Set the build context path
5. Click **Build Image**

#### Managing Registry Access
1. Visit **Registry Management**
2. Enter your registry credentials
3. Use Push/Pull tabs for image operations
4. Monitor progress in the output panel

## 🔧 Configuration

### Container CLI Integration

The application automatically detects and uses Apple's `container` CLI. Ensure it's in your PATH:

```bash
which container
# Should return: /usr/local/bin/container (or similar)
```

### Custom Configuration

You can customize the application behavior by modifying:

- **Tauri Config**: `src-tauri/tauri.conf.json`
- **React Config**: Standard React configuration files
- **Styling**: Tailwind configuration in `tailwind.config.js`

## 🎨 UI/UX Features

- **Responsive Design**: Works on different screen sizes
- **Dark/Light Mode**: Adapts to system preferences
- **Loading States**: Clear feedback for all operations
- **Error Handling**: Comprehensive error messages
- **Keyboard Shortcuts**: Quick navigation and actions
- **Status Indicators**: Visual cues for container states

## 🔒 Security

- **Secure Backend**: Rust-based Tauri backend for security
- **Sandboxed Environment**: Limited filesystem access
- **Credential Protection**: Secure handling of registry credentials
- **Command Validation**: Input sanitization for CLI commands

## 🚀 Performance

- **Native Performance**: Rust backend for fast operations
- **Efficient Updates**: Optimized React rendering
- **Memory Management**: Automatic cleanup of resources
- **Async Operations**: Non-blocking UI for long-running tasks

## 🐛 Troubleshooting

### Common Issues

1. **Container CLI not found**
   ```bash
   # Verify installation
   container --version
   # Add to PATH if needed
   export PATH="/usr/local/bin:$PATH"
   ```

2. **Build failures**
   ```bash
   # Clean and rebuild
   npm run clean
   npm install
   npm run tauri:dev
   ```

3. **Permission errors**
   ```bash
   # Check container CLI permissions
   sudo chown $(whoami) /usr/local/bin/container
   ```

### Debug Mode

Enable debug mode for detailed logging:

```bash
RUST_LOG=debug npm run tauri:dev
```

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

### Development Setup

```bash
# Install development dependencies
npm install

# Run linting
npm run lint

# Run tests
npm test

# Build for development
npm run tauri:dev
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Tauri Team** for the excellent desktop framework
- **React Team** for the robust frontend library
- **Tailwind CSS** for the utility-first styling
- **Lucide** for the beautiful icon set
- **Apple** for the container CLI system

## 📞 Support

For support and questions:

- Create an issue on GitHub
- Check the documentation
- Join our community discussions

## 🎯 Apple Container CLI Compatibility

This GUI application has been **verified and optimized** for Apple Container CLI version **0.1.0** and provides complete compatibility with the following commands:

### ✅ **Verified Commands**
| Command | GUI Feature | Status |
|---------|-------------|--------|
| `container ls` | Dashboard - Container listing | ✅ Working |
| `container start/stop/restart/rm` | Dashboard - Container actions | ✅ Working |  
| `container logs --follow` | Logs - Real-time streaming | ✅ Working |
| `container run` | Run Container - Create containers | ✅ Working |
| `container images ls` | Images - List images | ✅ Working |
| `container pull` | Images - Pull from registry | ✅ Working |
| `container tag` | Images - Tag management | ✅ Working |
| `container images rm` | Images - Delete images | ✅ Working |
| `container build` | Build Image - From Dockerfile | ✅ Working |
| `container system start/stop` | System - Daemon control | ✅ Working |
| `container system dns` | System - DNS management | ✅ Working |
| `container login/logout` | Registry - Authentication | ✅ Working |
| `container push` | Registry - Push to registry | ✅ Working |

### 🔍 **System Requirements Detection**
The application automatically detects:
- ✅ Apple Container CLI availability and version
- ✅ Apple Silicon vs Intel architecture
- ✅ System compatibility warnings
- ✅ Installation guidance for missing components

### 📊 **Real-time Status**
- **Container Status**: Live monitoring of running/stopped containers
- **Log Streaming**: Real-time container log output with timestamps
- **System Health**: Automatic detection of container daemon status
- **Error Handling**: Comprehensive error messages and troubleshooting

---

**Built with ❤️ using Tauri and React**
