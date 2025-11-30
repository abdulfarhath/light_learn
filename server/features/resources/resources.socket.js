/**
 * Resources Socket Handler
 * Handles file upload/download via Socket.IO
 */

class ResourcesSocket {
    constructor() {
        this.resources = []; // Stores { id, name, type, size, data }
    }

    /**
     * Initialize socket handlers for resources
     */
    init(io) {
        io.on('connection', (socket) => {
            // Send existing resources list (metadata only) to new user
            const resourceList = this.resources.map(({ id, name, type, size }) => ({
                id, name, type, size
            }));
            socket.emit('resource_list_update', resourceList);

            // Upload resource (Teacher)
            socket.on('upload_resource', (fileData) => {
                // fileData = { name, type, size, data }
                const newFile = { id: Date.now(), ...fileData };
                this.resources.push(newFile);

                // Broadcast ONLY metadata (lightweight) to everyone
                const meta = {
                    id: newFile.id,
                    name: newFile.name,
                    type: newFile.type,
                    size: newFile.size
                };
                io.emit('new_resource_available', meta);
            });

            // Download resource (Student)
            socket.on('request_download', (fileId) => {
                const file = this.resources.find(r => r.id === fileId);
                if (file) {
                    // Send heavy data ONLY to the person who asked
                    socket.emit('receive_download_data', file);
                }
            });
        });
    }

    /**
     * Get all resources metadata
     */
    getResourcesList() {
        return this.resources.map(({ id, name, type, size }) => ({
            id, name, type, size
        }));
    }

    /**
     * Get resource by ID
     */
    getResourceById(id) {
        return this.resources.find(r => r.id === id);
    }
}

module.exports = new ResourcesSocket();
