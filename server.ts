import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './apps/api/src/app.module';
import { AllExceptionsFilter } from './apps/api/src/common/filters/all-exceptions.filter';
import { setupSwagger } from './apps/api/src/swagger.setup';

/**
 * Bootstraps the full-stack BAO BAO application.
 * Combines NestJS API server with Vite frontend middleware for development.
 */
async function bootstrap() {
  // Create NestJS application with logging configuration
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // Set global API prefix with exclusions for health and docs endpoints
  app.setGlobalPrefix('api/v1', {
    exclude: ['health', 'api/docs'],
  });

  // Configure global validation pipe for request DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties not in DTO
      forbidNonWhitelisted: false, // Allow extra properties without error
      transform: true, // Auto-transform payloads to DTO instances
    }),
  );

  // Apply global exception filter for consistent error responses
  app.useGlobalFilters(new AllExceptionsFilter());

  // Setup Swagger/OpenAPI documentation
  setupSwagger(app);

  // Mount Vite middleware for React Frontend (development only)
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true, // Use as Express middleware
        hmr: process.env.DISABLE_HMR !== 'true', // Enable/disable hot module replacement
      },
      appType: 'spa',
    });

    // Route middleware: API/health/webhooks go to NestJS, everything else to Vite
    app.use((req: any, res: any, next: any) => {
      const url = req.originalUrl || req.url || '';
      console.log(`[HTTP] ${req.method} ${url}`);
      if (
        url.startsWith('/api') ||
        url.startsWith('/health') ||
        url.startsWith('/webhooks')
      ) {
        return next();
      }
      vite.middlewares(req, res, next);
    });
  }

  // Start server on port 3001
  const port = 3001;
  await app.listen(port, '0.0.0.0');

  // Log startup information
  console.log(`\n======================================================`);
  console.log(`  BAO BAO Platform running on http://localhost:${port}`);
  console.log(`  - Web App:      http://localhost:${port}/`);
  console.log(`  - API Base:     http://localhost:${port}/api/v1`);
  console.log(`  - Swagger Docs: http://localhost:${port}/api/docs`);
  console.log(`  - Health Check: http://localhost:${port}/health`);
  console.log(`======================================================\n`);
}

// Handle bootstrap errors
bootstrap().catch((err) => {
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});
