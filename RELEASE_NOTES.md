# Container GUI Release Notes

## Latest Update: Support for Apple Container 0.2.0

**Release Date:** 2025-06-28
**Container CLI Version:** 0.2.0
**Release URL:** https://github.com/apple/container/releases/tag/0.2.0

### 🎉 New Features Added

- * Add new  command by @gonzolino in https://github.com/apple/container/pull/118
- * Add issue templates for bugs and features by @katiewasnothere in https://github.com/apple/container/pull/152
- * Move github issues to use feature and bug Types instead of Labels by @katiewasnothere in https://github.com/apple/container/pull/258
- ## New Contributors

### 🔧 New Commands Supported

- `container new-command-detected`
- `container registry`
- `container network`

### 🚩 New Flags & Options

- No new flags in this release

### ⚠️ Breaking Changes

- No breaking changes in this release

### 🐛 Bug Fixes

- * Fix small typo in README by @owenarthur in https://github.com/apple/container/pull/56
- * Fix typo in Parser.swift by @sadikkuzu in https://github.com/apple/container/pull/64
- * Clean up typos in docs, fix reference to default subnet by @owenarthur in https://github.com/apple/container/pull/71
- * Add issue templates for bugs and features by @katiewasnothere in https://github.com/apple/container/pull/152
- * fix: typo by @umitdemirci in https://github.com/apple/container/pull/153
- * Fix: consolidate UserDefaults service name by @yibozhuang in https://github.com/apple/container/pull/161
- * container registry login host:port error fix by @makhov in https://github.com/apple/container/pull/170
- * Fix release workflow: tag regex, artifact validation, and token usage by @Thedarkmatter10 in https://github.com/apple/container/pull/187
- * Fix typos by @pstoeckle in https://github.com/apple/container/pull/122
- * fix(common.yml): globalize CURRENT_SDK, improve shell safety and  imp… by @Thedarkmatter10 in https://github.com/apple/container/pull/178
- * refactor: fix typos by @noritaka1166 in https://github.com/apple/container/pull/77
- * Fix warnings in  by @dkovba in https://github.com/apple/container/pull/220
- * Fix Race Condition in Container Removal (#130) by @ramsyana in https://github.com/apple/container/pull/218
- * Fix typo in technical-overview.md by @johnspurlock in https://github.com/apple/container/pull/253
- * Move github issues to use feature and bug Types instead of Labels by @katiewasnothere in https://github.com/apple/container/pull/258

### 📚 Documentation Updates

- Updated to reflect 0.2.0 compatibility
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

*This release was automatically generated from Apple Container 0.2.0 release analysis.*
*Generated on: 2025-06-28T00:29:52.762Z*
