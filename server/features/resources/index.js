/**
 * Resources Feature Module
 * 
 * This module handles resource management:
 * - Upload files (teachers)
 * - Download files (students)
 * - List available resources
 * - Optimized for low-bandwidth scenarios
 */

const resourcesSocket = require('./resources.socket');

module.exports = {
    socket: resourcesSocket
};
