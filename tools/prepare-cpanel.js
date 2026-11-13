/**
 * OmniFlow SaaS — Production cPanel Deployment Packager
 * Generates ready-to-upload bundles for ProCloudify cPanel (No SSH / No Terminal)
 */
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT_DIR, 'cpanel_deploy');

console.log('🚀 Preparing OmniFlow SaaS deployment package for cPanel (ProCloudify)...');

function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src);
  for (const entry of entries) {
    const srcPath = path.join(src, entry);
    const destPath = path.join(dest, entry);
    try {
      const stat = fs.statSync(srcPath);
      if (stat.isDirectory()) {
        copyDirSync(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    } catch (e) {
      // Skip broken symlinks or unreadable files
    }
  }
}

// 1. Clean output directories
if (fs.existsSync(OUTPUT_DIR)) {
  fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
}
fs.mkdirSync(path.join(OUTPUT_DIR, '1_DATABASE'), { recursive: true });
fs.mkdirSync(path.join(OUTPUT_DIR, '2_BACKEND_API'), { recursive: true });
fs.mkdirSync(path.join(OUTPUT_DIR, '3_FRONTEND_WEB'), { recursive: true });

// 2. Database SQL File
const sqlSource = path.join(ROOT_DIR, 'omniflow_cpanel_import.sql');
const sqlDest = path.join(OUTPUT_DIR, '1_DATABASE', 'omniflow_cpanel_import.sql');
if (fs.existsSync(sqlSource)) {
  fs.copyFileSync(sqlSource, sqlDest);
  console.log('✓ Database SQL copied to: cpanel_deploy/1_DATABASE/omniflow_cpanel_import.sql');
}

// 3. Backend API Files
console.log('📦 Preparing Backend API bundle...');
const apiSrcDir = path.join(ROOT_DIR, 'apps', 'api');
const apiOutDir = path.join(OUTPUT_DIR, '2_BACKEND_API');

// Copy dist & server.js
copyDirSync(path.join(apiSrcDir, 'dist'), path.join(apiOutDir, 'dist'));
fs.copyFileSync(path.join(apiSrcDir, 'server.js'), path.join(apiOutDir, 'server.js'));

// API package.json
const apiPkg = JSON.parse(fs.readFileSync(path.join(apiSrcDir, 'package.json'), 'utf8'));
delete apiPkg.dependencies['@omniflow/database'];
delete apiPkg.dependencies['@omniflow/shared'];
delete apiPkg.dependencies['@omniflow/integrations'];
delete apiPkg.dependencies['bcrypt'];
apiPkg.dependencies['bcryptjs'] = '^2.4.3';
apiPkg.dependencies['@prisma/client'] = '^5.22.0';
apiPkg.scripts = {
  start: 'node server.js'
};
fs.writeFileSync(path.join(apiOutDir, 'package.json'), JSON.stringify(apiPkg, null, 2));

// Copy packages to node_modules/@omniflow
fs.mkdirSync(path.join(apiOutDir, 'node_modules', '@omniflow'), { recursive: true });
for (const pkg of ['shared', 'database', 'integrations']) {
  const pkgDist = path.join(ROOT_DIR, 'packages', pkg, 'dist');
  const pkgDest = path.join(apiOutDir, 'node_modules', '@omniflow', pkg);
  if (fs.existsSync(pkgDist)) {
    copyDirSync(pkgDist, path.join(pkgDest, 'dist'));
    const pkgJson = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'packages', pkg, 'package.json'), 'utf8'));
    fs.writeFileSync(path.join(pkgDest, 'package.json'), JSON.stringify(pkgJson, null, 2));
  }
}

// Copy Linux Prisma Client & Engines into apiOutDir/node_modules/.prisma & @prisma
const pnpmPrismaDir = path.join(ROOT_DIR, 'node_modules', '.pnpm');
if (fs.existsSync(pnpmPrismaDir)) {
  const pnpmEntries = fs.readdirSync(pnpmPrismaDir);
  const clientDirEntry = pnpmEntries.find(e => e.startsWith('@prisma+client@'));
  if (clientDirEntry) {
    const srcDotPrisma = path.join(pnpmPrismaDir, clientDirEntry, 'node_modules', '.prisma');
    if (fs.existsSync(srcDotPrisma)) {
      copyDirSync(srcDotPrisma, path.join(apiOutDir, 'node_modules', '.prisma'));
      console.log('✓ Linux Prisma Engines bundled into .prisma/client');
    }
    const srcPrismaClient = path.join(pnpmPrismaDir, clientDirEntry, 'node_modules', '@prisma', 'client');
    if (fs.existsSync(srcPrismaClient)) {
      copyDirSync(srcPrismaClient, path.join(apiOutDir, 'node_modules', '@prisma', 'client'));
    }
  }
}

// Backend .env
const apiEnv = `# ==============================================================================
# OmniFlow Backend API Environment Configuration for cPanel
# ==============================================================================
NODE_ENV=production
PORT=4000

# ProCloudify cPanel MySQL Connection
# Format: mysql://<CPANEL_USER>_<DB_USER>:<PASSWORD>@localhost:3306/<CPANEL_USER>_<DB_NAME>
DATABASE_URL=mysql://yourcpanel_dbuser:YourPassword123!@localhost:3306/yourcpanel_omniflow

# Application URL
APP_BASE_URL=https://omniflow.antcodes.dev

# Security Secrets
JWT_SECRET=omniflow_prod_jwt_super_secret_signing_key_998877!
ENCRYPTION_SECRET=omniflow_prod_aes256_secret_key_32bytes_2026!

# Redis (Optional on cPanel)
REDIS_URL=redis://localhost:6379

# AI
OPENAI_API_KEY=sk-proj-YOUR_OPENAI_KEY
DEFAULT_AI_MODEL=gpt-4o

# Webhooks
META_VERIFY_TOKEN=omniflow_webhook_verify_token_2026_antcodes
`;
fs.writeFileSync(path.join(apiOutDir, '.env'), apiEnv);
console.log('✓ Backend API prepared at: cpanel_deploy/2_BACKEND_API/');

// 4. Frontend Web Files (Next.js Standalone Runner)
console.log('📦 Preparing Frontend Web bundle (Standalone)...');
const webSrcDir = path.join(ROOT_DIR, 'apps', 'web');
const webOutDir = path.join(OUTPUT_DIR, '3_FRONTEND_WEB');
const standaloneDir = path.join(webSrcDir, '.next', 'standalone');

if (fs.existsSync(standaloneDir)) {
  // Standalone server and bundled modules
  const standaloneAppDir = path.join(standaloneDir, 'apps', 'web');
  if (fs.existsSync(standaloneAppDir)) {
    copyDirSync(standaloneAppDir, webOutDir);
  }
  if (fs.existsSync(path.join(standaloneDir, 'node_modules'))) {
    copyDirSync(path.join(standaloneDir, 'node_modules'), path.join(webOutDir, 'node_modules'));
  }
}

// Ensure .next/static and public are copied to webOutDir
copyDirSync(path.join(webSrcDir, '.next', 'static'), path.join(webOutDir, '.next', 'static'));
copyDirSync(path.join(webSrcDir, 'public'), path.join(webOutDir, 'public'));
fs.copyFileSync(path.join(webSrcDir, 'server.js'), path.join(webOutDir, 'server.js'));

const webEnv = `# ==============================================================================
# OmniFlow Frontend Environment Configuration for cPanel
# ==============================================================================
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_APP_URL=https://omniflow.antcodes.dev
NEXT_PUBLIC_API_URL=https://omniflow.antcodes.dev/api/v1
NEXT_PUBLIC_SOCKET_URL=https://omniflow.antcodes.dev
`;
fs.writeFileSync(path.join(webOutDir, '.env'), webEnv);
console.log('✓ Frontend Web prepared at: cpanel_deploy/3_FRONTEND_WEB/');

// 5. Root .htaccess for cPanel public_html
const htaccessContent = `# ==============================================================================
# OmniFlow SaaS — cPanel Apache Reverse Proxy (.htaccess)
# Place this file in public_html
# ==============================================================================
RewriteEngine On

# 1. Route API requests to NestJS Backend (Port 4000)
RewriteRule ^api/(.*)$ http://127.0.0.1:4000/api/$1 [P,L]

# 2. Route WebSockets to Backend Socket.IO
RewriteCond %{HTTP:Upgrade} websocket [NC]
RewriteCond %{HTTP:Connection} upgrade [NC]
RewriteRule ^socket.io/(.*)$ ws://127.0.0.1:4000/socket.io/$1 [P,L]

# 3. Route all other requests to Next.js Web Frontend (Port 3000)
RewriteRule ^(.*)$ http://127.0.0.1:3000/$1 [P,L]
`;
fs.writeFileSync(path.join(OUTPUT_DIR, '.htaccess'), htaccessContent);
console.log('✓ .htaccess generated at: cpanel_deploy/.htaccess');

console.log('\n🎉 ALL DONE! Your cPanel deployment files are ready in: E:\\AI Agent\\Social_Automation_saas\\cpanel_deploy\\');
