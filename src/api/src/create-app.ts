/**
 * create-app.ts — Express 앱 팩토리
 *
 * server.ts에서 분리하여 테스트에서 재사용 가능하게 한다.
 * supertest 등에서 import 후 테스트용 앱으로 활용.
 */
import express from 'express';
import cors from 'cors';
import { COMPANY_ROOT } from './services/file-reader.js';
import { rolesRouter } from './routes/roles.js';
import { projectsRouter } from './routes/projects.js';
import { operationsRouter } from './routes/operations.js';
import { companyRouter } from './routes/company.js';
import { engineRouter } from './routes/engine.js';
import { sessionsRouter } from './routes/sessions.js';

export function createApp() {
  const app = express();

  const corsOrigin = process.env.NODE_ENV === 'production' ? true : /^http:\/\/localhost:\d+$/;
  app.use(cors({ origin: corsOrigin }));
  app.use(express.json());

  app.use('/api/roles', rolesRouter);
  app.use('/api/projects', projectsRouter);
  app.use('/api/operations', operationsRouter);
  app.use('/api/company', companyRouter);
  app.use('/api/engine', engineRouter);
  app.use('/api/sessions', sessionsRouter);

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', companyRoot: COMPANY_ROOT });
  });

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const status = err.name === 'FileNotFoundError' ? 404 : 500;
    res.status(status).json({ error: err.message });
  });

  return app;
}
