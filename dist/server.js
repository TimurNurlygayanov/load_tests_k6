/**
 * Server entry point
 */
import app from './app.js';
import { orderService } from './services/orderService.js';
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`🚀 Trading Platform API running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`📈 API endpoints: http://localhost:${PORT}/api`);
    // Start order monitoring
    orderService.startOrderMonitoring();
    console.log('✅ Order monitoring started');
});
// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});
process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});
//# sourceMappingURL=server.js.map