import { COMPANY_ROOT } from './services/file-reader.js';
import { createHttpServer } from './create-server.js';

const PORT = Number(process.env.PORT) || 3001;
const server = createHttpServer();

server.listen(PORT, () => {
  console.log(`[API] Server running on http://localhost:${PORT}`);
  console.log(`[API] COMPANY_ROOT: ${COMPANY_ROOT}`);
});
