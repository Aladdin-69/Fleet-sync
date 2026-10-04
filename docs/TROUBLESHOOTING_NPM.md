# 🔧 Troubleshooting Guide - npm install Issues

## Problem: npm install Gets Stuck

This is a common issue with several possible causes and solutions.

---

## Quick Fix (Try This First)

```bash
# Stop the stuck process
Ctrl + C

# Run the fix script
cd backend  # or cd frontend
chmod +x ../fix-npm.sh
../fix-npm.sh
```

---

## Manual Solutions

### Solution 1: Clean Install

```bash
# Remove old files
rm -rf node_modules package-lock.json

# Clear npm cache
npm cache clean --force

# Try installing again
npm install
```

### Solution 2: Use Minimal Dependencies (Backend Only)

```bash
cd backend

# Backup original package.json
mv package.json package-full.json

# Use minimal version
mv package-minimal.json package.json

# Install
npm install

# After successful install, restore full version if needed
mv package-full.json package.json
npm install
```

### Solution 3: Install with Legacy Peer Dependencies

```bash
npm install --legacy-peer-deps
```

### Solution 4: Increase Timeout

```bash
npm config set fetch-timeout 60000
npm config set fetch-retry-maxtimeout 120000
npm install
```

### Solution 5: Use Yarn Instead

```bash
# Install yarn globally
npm install -g yarn

# Install dependencies
yarn install
```

### Solution 6: Install Without Optional Dependencies

```bash
npm install --no-optional
```

### Solution 7: Change npm Registry

```bash
# Set registry to npm official
npm config set registry https://registry.npmjs.org/

# Or try npm mirror (faster in some regions)
npm config set registry https://registry.npmmirror.com/

# Install
npm install
```

---

## Common Causes & Solutions

### Cause 1: Network Issues

**Symptoms:**
- Stuck at "fetchMetadata"
- Timeout errors
- Connection refused

**Solutions:**
```bash
# Try different network
# - Use mobile hotspot
# - Use VPN
# - Disable firewall temporarily

# Or use offline installation
npm install --prefer-offline
```

### Cause 2: npm Cache Corruption

**Symptoms:**
- "EINTEGRITY" errors
- "sha512" errors
- Random failures

**Solutions:**
```bash
npm cache clean --force
npm cache verify
rm -rf ~/.npm
npm install
```

### Cause 3: Incompatible Node.js Version

**Symptoms:**
- "engine" errors
- Version mismatch warnings

**Solutions:**
```bash
# Check Node version
node --version

# Should be 18.x or higher
# If not, update Node.js

# macOS
brew upgrade node

# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Or use nvm
nvm install 18
nvm use 18
```

### Cause 4: Permission Issues

**Symptoms:**
- "EACCES" errors
- Permission denied

**Solutions:**
```bash
# Option 1: Fix npm permissions (recommended)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# Option 2: Use sudo (not recommended)
sudo npm install --unsafe-perm

# Option 3: Change ownership
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) node_modules
```

### Cause 5: Low Disk Space

**Symptoms:**
- "ENOSPC" errors
- No space left on device

**Solutions:**
```bash
# Check disk space
df -h

# Clean npm cache
npm cache clean --force

# Remove old node_modules
find . -name "node_modules" -type d -prune -exec rm -rf '{}' +
```

### Cause 6: Behind Corporate Proxy/Firewall

**Symptoms:**
- Connection timeouts
- Cannot reach registry

**Solutions:**
```bash
# Set proxy
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080

# Or bypass SSL (use with caution)
npm config set strict-ssl false

# Install
npm install
```

---

## Alternative: Skip npm install (For Testing)

If you just want to test the backend quickly:

```bash
# Use the Docker option instead
cd ..
docker-compose up -d

# Or run a minimal version
cd backend
node server.js
# (Will fail on missing imports, but shows which are actually needed)
```

---

## Debugging: Verbose Install

To see exactly where it's stuck:

```bash
npm install --verbose
```

Look for the last line before it hangs. Common stuck points:

1. **"fetchMetadata"** → Network issue
2. **"loadIdealTree"** → Dependency resolution issue
3. **"loadAllDepsIntoIdealTree"** → Circular dependency
4. **Specific package name** → That package is the problem

### If Stuck on Specific Package

```bash
# Try installing that package alone
npm install <package-name> --verbose

# If it fails, find an alternative or skip it
```

---

## Backend-Specific Issues

### Problem: pg-native fails to install

```bash
# This is optional, skip it
npm install --no-optional
```

### Problem: bcrypt compilation fails

```bash
# Use bcryptjs instead (already in package.json)
# Just continue with install
```

### Problem: googleapis too large

```bash
# Install specific google auth only
npm install google-auth-library
# Comment out calendar routes temporarily
```

---

## Frontend-Specific Issues

### Problem: Too many dependencies

```bash
cd frontend

# Install in stages
npm install react react-dom
npm install vite @vitejs/plugin-react
npm install -D tailwindcss postcss autoprefixer

# Then install rest
npm install
```

### Problem: Vite build fails

```bash
# Clear vite cache
rm -rf node_modules/.vite

# Reinstall
npm install
```

---

## Nuclear Option: Complete Reset

If nothing works:

```bash
# 1. Remove everything
rm -rf node_modules package-lock.json
rm -rf ~/.npm
rm -rf ~/.npm-global

# 2. Reinstall npm
sudo npm install -g npm@latest

# 3. Update Node.js
nvm install --lts
nvm use --lts

# 4. Try again
npm install
```

---

## Still Not Working?

### Use Docker Instead

```bash
cd ..
docker-compose up -d
# This bypasses all npm install issues on your host machine
```

### Or Use Pre-built Backend

Contact support for a pre-compiled backend binary (if available).

---

## Getting More Help

1. **Check npm logs:**
```bash
cat ~/.npm/_logs/[latest-log-file].log
```

2. **Check system logs:**
```bash
# macOS
tail -f /var/log/system.log

# Linux
journalctl -f
```

3. **Create issue with details:**
- Node version: `node --version`
- npm version: `npm --version`
- OS: `uname -a`
- Error log: Last 50 lines of npm install output

---

## Prevention for Future

```bash
# Use package-lock.json
# Commit it to version control

# Use exact versions in package.json
# Change "^1.0.0" to "1.0.0"

# Test installs in clean environment
docker run -it node:18 bash
cd /app
npm install
```

---

## Quick Reference

| Problem | Quick Fix |
|---------|-----------|
| Stuck | `npm cache clean --force && npm install` |
| Timeout | `npm install --legacy-peer-deps` |
| Permissions | `sudo chown -R $(whoami) ~/.npm` |
| Network | Try different network or use `--prefer-offline` |
| Specific package | `npm install --no-optional` |
| Everything fails | Use Docker: `docker-compose up -d` |

---

## Success Indicators

After successful install, you should see:

```bash
added XXX packages
audited XXX packages

found 0 vulnerabilities
```

Then you can run:

```bash
npm run dev    # For development
npm start      # For production
```

---

**Remember: When in doubt, use Docker! It handles all dependencies automatically.**
