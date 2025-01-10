// socketManager.js
let io;

module.exports = {
    init: (server) => {
        const { Server } = require('socket.io');
        io = new Server(server);
        return io;
    },
    getIO: () => {
        if (!io) {
            throw new Error('Socket.io is not initialized!');
        }
        return io;
    },
};
