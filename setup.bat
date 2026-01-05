@echo off
chcp 65001 >nul
echo.
echo ========================================
echo  Asset Management Backend Setup
echo ========================================
echo.

REM Create main directories
echo Creating directory structure...
mkdir src 2>nul
mkdir src\config 2>nul
mkdir src\db 2>nul
mkdir src\db\schema 2>nul
mkdir src\db\migrations 2>nul
mkdir src\controllers 2>nul
mkdir src\services 2>nul
mkdir src\routes 2>nul
mkdir src\middlewares 2>nul
mkdir src\utils 2>nul
echo [OK] Directories created

REM Create .gitignore
echo Creating .gitignore...
(
echo node_modules
echo dist
echo .env
echo *.log
echo .DS_Store
) > .gitignore
echo [OK] .gitignore created

REM Create .env.example
echo Creating .env.example...
(
echo # Supabase
echo SUPABASE_URL=your-supabase-url
echo SUPABASE_ANON_KEY=your-supabase-anon-key
echo SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
echo.
echo # Database
echo DATABASE_URL=postgresql://postgres:[password]@[host]:[port]/[database]
echo.
echo # Server
echo PORT=3000
echo NODE_ENV=development
) > .env.example
echo [OK] .env.example created

REM Create package.json
echo Creating package.json...
(
echo {
echo   "name": "asset-management-backend",
echo   "version": "1.0.0",
echo   "type": "module",
echo   "scripts": {
echo     "dev": "tsx watch src/index.ts",
echo     "build": "tsc",
echo     "start": "node dist/index.js",
echo     "db:generate": "drizzle-kit generate",
echo     "db:push": "drizzle-kit push",
echo     "db:studio": "drizzle-kit studio"
echo   },
echo   "dependencies": {
echo     "@hono/node-server": "^1.13.7",
echo     "@hono/swagger-ui": "^0.4.1",
echo     "@hono/zod-openapi": "^0.16.4",
echo     "@supabase/supabase-js": "^2.45.4",
echo     "drizzle-orm": "^0.36.4",
echo     "hono": "^4.6.14",
echo     "postgres": "^3.4.5",
echo     "zod": "^3.23.8"
echo   },
echo   "devDependencies": {
echo     "@types/node": "^22.10.2",
echo     "drizzle-kit": "^0.28.1",
echo     "tsx": "^4.19.2",
echo     "typescript": "^5.7.2"
echo   }
echo }
) > package.json
echo [OK] package.json created

REM Create tsconfig.json
echo Creating tsconfig.json...
(
echo {
echo   "compilerOptions": {
echo     "target": "ES2022",
echo     "module": "ESNext",
echo     "lib": ["ES2022"],
echo     "moduleResolution": "bundler",
echo     "esModuleInterop": true,
echo     "skipLibCheck": true,
echo     "strict": true,
echo     "forceConsistentCasingInFileNames": true,
echo     "resolveJsonModule": true,
echo     "allowSyntheticDefaultImports": true,
echo     "outDir": "./dist",
echo     "rootDir": "./src",
echo     "types": ["node"]
echo   },
echo   "include": ["src/**/*"],
echo   "exclude": ["node_modules", "dist"]
echo }
) > tsconfig.json
echo [OK] tsconfig.json created

REM Create drizzle.config.ts
echo Creating drizzle.config.ts...
(
echo import { defineConfig } from 'drizzle-kit';
echo.
echo export default defineConfig^(^{
echo   schema: './src/db/schema/*.ts',
echo   out: './src/db/migrations',
echo   dialect: 'postgresql',
echo   dbCredentials: {
echo     url: process.env.DATABASE_URL!,
echo   },
echo   verbose: true,
echo   strict: true,
echo }^);
) > drizzle.config.ts
echo [OK] drizzle.config.ts created

REM Create placeholder TypeScript files
echo Creating TypeScript files...

REM Config files
echo // TODO: Add code here > src\config\env.ts
echo // TODO: Add code here > src\config\database.ts
echo // TODO: Add code here > src\config\swagger.ts

REM Schema files
echo // TODO: Add code here > src\db\schema\users.ts
echo // TODO: Add code here > src\db\schema\masters.ts
echo // TODO: Add code here > src\db\schema\projects.ts
echo // TODO: Add code here > src\db\schema\mhesi.ts
echo // TODO: Add code here > src\db\schema\assets.ts
echo // TODO: Add code here > src\db\schema\asset-status.ts
echo // TODO: Add code here > src\db\schema\attachments.ts
echo // TODO: Add code here > src\db\schema\index.ts

REM Service files
echo // TODO: Add code here > src\services\masters.service.ts
echo // TODO: Add code here > src\services\projects.service.ts
echo // TODO: Add code here > src\services\mhesi.service.ts
echo // TODO: Add code here > src\services\assets.service.ts
echo // TODO: Add code here > src\services\asset-status.service.ts
echo // TODO: Add code here > src\services\attachments.service.ts

REM Controller files
echo // TODO: Add code here > src\controllers\masters.controller.ts
echo // TODO: Add code here > src\controllers\projects.controller.ts
echo // TODO: Add code here > src\controllers\mhesi.controller.ts
echo // TODO: Add code here > src\controllers\assets.controller.ts
echo // TODO: Add code here > src\controllers\asset-status.controller.ts
echo // TODO: Add code here > src\controllers\attachments.controller.ts

REM Route files
echo // TODO: Add code here > src\routes\masters.routes.ts
echo // TODO: Add code here > src\routes\projects.routes.ts
echo // TODO: Add code here > src\routes\mhesi.routes.ts
echo // TODO: Add code here > src\routes\assets.routes.ts
echo // TODO: Add code here > src\routes\asset-status.routes.ts
echo // TODO: Add code here > src\routes\attachments.routes.ts
echo // TODO: Add code here > src\routes\index.ts

REM Middleware files
echo // TODO: Add code here > src\middlewares\error.ts
echo // TODO: Add code here > src\middlewares\cors.ts
echo // TODO: Add code here > src\middlewares\logger.ts

REM Utils files
echo // TODO: Add code here > src\utils\response.ts

REM Main files
echo // TODO: Add code here > src\app.ts
echo // TODO: Add code here > src\index.ts

echo [OK] All TypeScript files created

REM Create README.md
echo Creating README.md...
(
echo # Asset Management Backend
echo.
echo Backend API for Asset Management System
echo.
echo ## Setup
echo.
echo 1. Copy .env.example to .env and fill in your Supabase credentials
echo 2. Run `npm install`
echo 3. Copy code from artifacts into each .ts file
echo 4. Run `npm run db:push`
echo 5. Run `npm run dev`
echo.
echo ## Documentation
echo.
echo - Swagger UI: http://localhost:3000/docs
echo - Health Check: http://localhost:3000/api/health
echo.
echo ## Next Steps
echo.
echo Copy the code from the artifacts into each file according to the structure provided.
) > README.md
echo [OK] README.md created

echo.
echo ========================================
echo  Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Copy .env.example to .env
echo    Run: copy .env.example .env
echo.
echo 2. Edit .env and add your Supabase credentials
echo.
echo 3. Install dependencies
echo    Run: npm install
echo.
echo 4. Copy code from artifacts to each .ts file
echo.
echo 5. Push database schema
echo    Run: npm run db:push
echo.
echo 6. Start the server
echo    Run: npm run dev
echo.
echo ========================================
echo.
pause