import 'dotenv/config';
import app from './app.js';

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`[MahaResilience Server]: Running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('[SIGTERM Received]: Shutting down server gracefully...');
  server.close(() => {
    console.log('[MahaResilience Server]: Closed all active HTTP connections.');
    process.exit(0);
  });
});
