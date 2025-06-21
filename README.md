# Container GUI

A modern desktop GUI application for Apple's container CLI tool, built with Tauri (Rust) and React. This application provides a user-friendly interface for managing Apple containers on macOS, designed specifically for Apple Silicon.

## Features

Container GUI supports all major Apple container CLI features through an intuitive graphical interface:

### 🚀 Container Management
- **Run Containers** with comprehensive options:
  - Memory and CPU resource limits (`--memory`, `--cpus`)
  - Architecture selection (ARM64, AMD64 with Rosetta)
  - Volume mounts (`--volume` and `--mount` syntax)
  - Environment variables
  - Interactive/TTY modes
  - Background execution with dedicated IP addresses
  - DNS domain configuration

### 🏗️ Image Building & Multi-Architecture Support
- **Builder Management**:
  - Start/stop/delete builder containers
  - Configure builder resources (memory, CPUs)
  - Status monitoring
- **Multi-Platform Builds**:
  - Build for ARM64 and AMD64 architectures simultaneously
  - Dockerfile editor with syntax highlighting
  - Build context selection
  - Registry push integration

### 📊 Container Monitoring & Inspection
- **Container Logs**:
  - Real-time log streaming with follow mode
  - Boot logs viewing (`--boot` option)
  - Log filtering (tail, since, until)
  - System logs access
  - Download logs to file
- **Resource Inspection**:
  - Detailed JSON inspection of containers and images
  - Formatted JSON output with copy-to-clipboard
  - Container and image metadata viewing

### 🖥️ System Management
- **System Overview**:
  - Container and image statistics
  - System status monitoring
  - Resource usage insights
- **Advanced Features**:
  - System information display
  - Container/image inspection tools
  - Quick navigation to all features

### 🌐 Networking (Apple Container Approach)
- **Dedicated IP Addresses**: Each container gets its own IP address
- **No Port Mapping Required**: Direct access via container IP
- **DNS Domain Support**: Access containers via hostname.domain
- **Network Isolation**: Secure container-to-container communication

## Apple Container CLI Integration

This GUI interfaces with Apple's native container CLI, supporting all major commands:

```bash
# Container operations
container run --memory 4g --cpus 8 --arch arm64 nginx:latest
container ls --format json --all
container logs --follow --boot my-container
container stop my-container

# Image operations  
container build --arch arm64 --arch amd64 --tag my-app:latest .
container images list --format json
container images push my-app:latest

# Builder management
container builder start --memory 32g --cpus 8
container builder stop
container builder delete

# System operations
container system info
container system logs
container inspect my-container
```

## Requirements

- **macOS 15+** (recommended macOS 26 beta for best compatibility)
- **Apple Silicon Mac** (required)
- **Apple Container CLI** installed from [GitHub releases](https://github.com/apple/container/releases)
- **Xcode 26 Beta** (for development)

## Installation

1. **Install Apple Container CLI**:
   ```bash
   # Download from GitHub releases
   # https://github.com/apple/container/releases
   
   # Install and start the system
   container system start
   ```

2. **Install Container GUI**:
   ```bash
   # Clone the repository
   git clone https://github.com/your-repo/container-gui.git
   cd container-gui
   
   # Install dependencies
   npm install
   
   # Run in development mode
   npm run tauri dev
   
   # Build for production
   npm run tauri build
   ```

## Usage

### Running Containers

1. Navigate to **Run Container**
2. Configure your container:
   - Set image name (e.g., `nginx:latest`)
   - Adjust memory/CPU limits as needed
   - Add volume mounts for file sharing
   - Set environment variables
   - Choose architecture (ARM64/AMD64)
3. Click **Run Container**
4. Access your container via its dedicated IP address (shown in container list)

### Building Images

1. Navigate to **Build Image**
2. Manage builder resources:
   - Start builder with custom memory/CPU allocation
   - Monitor builder status
3. Configure build:
   - Enter image tag
   - Select target architectures
   - Edit Dockerfile in integrated editor
4. Click **Build Image**
5. Optionally push to registry after build

### Viewing Logs

1. Navigate to **Logs**
2. Select a container from the dropdown
3. Configure log options:
   - Enable follow mode for live streaming
   - Show boot logs for VM startup information
   - Set tail, since, until filters
4. View real-time logs or download to file

### System Monitoring

1. Navigate to **System Control**
2. View system statistics and container overview
3. Inspect containers and images:
   - Select resource type (container/image)
   - Choose item to inspect
   - View detailed JSON metadata
4. Access system logs and information

## Apple Container Networking

Unlike Docker, Apple containers use a different networking approach:

- **No Port Mapping**: Instead of `-p 8080:80`, each container gets a dedicated IP
- **Direct Access**: Access containers directly via their IP address
- **DNS Support**: Use `--dns-domain test` to access via hostname (e.g., `my-app.test`)
- **Container Discovery**: Use `container ls` to find container IP addresses

### Example Workflow

```bash
# Run a web server
container run -d --name my-web --dns-domain test nginx:latest

# Check container IP
container ls
# Shows: my-web running at 192.168.64.3

# Access directly
curl http://192.168.64.3
# Or via DNS: curl http://my-web.test
```

## Architecture

- **Frontend**: React 18 + Tailwind CSS
- **Backend**: Tauri 2.x (Rust)
- **Container Runtime**: Apple Container CLI
- **Platform**: macOS (Apple Silicon optimized)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with Apple Container CLI
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Apple for the open-source Container project
- Tauri team for the excellent desktop app framework
- React and Tailwind CSS communities

---

**Note**: This GUI is designed specifically for Apple's container CLI and requires Apple Silicon hardware. It provides a modern alternative to command-line container management on macOS.
