/**
 * Queue Service - Manages user waiting queue and pairing logic
 * Uses in-memory storage for queue management
 */

class QueueService {
    constructor() {
        // Queue to store waiting users
        this.waitingQueue = [];
        // Map to track user's current status
        this.userStatus = new Map();
    }

    /**
     * Add user to waiting queue
     * @param {string} socketId - Socket ID of the user
     * @param {Object} userData - User data (name, etc.)
     * @returns {Object} User object added to queue
     */
    addToQueue(socketId, userData) {
        // Check if user already in queue
        if (this.userStatus.has(socketId)) {
            console.warn(`User ${socketId} already in queue`);
            return null;
        }

        const userObject = {
            socketId,
            ...userData,
            joinedAt: Date.now(),
            status: 'waiting'
        };

        this.waitingQueue.push(userObject);
        this.userStatus.set(socketId, 'waiting');

        console.log(`✅ User ${socketId} added to queue. Queue size: ${this.waitingQueue.length}`);
        return userObject;
    }

    /**
     * Remove user from queue
     * @param {string} socketId - Socket ID of the user
     * @returns {boolean} True if removed, false if not found
     */
    removeFromQueue(socketId) {
        const index = this.waitingQueue.findIndex(user => user.socketId === socketId);

        if (index !== -1) {
            const removedUser = this.waitingQueue.splice(index, 1)[0];
            this.userStatus.delete(socketId);
            console.log(`✅ User ${socketId} removed from queue. Queue size: ${this.waitingQueue.length}`);
            return true;
        }

        console.warn(`⚠️ User ${socketId} not found in queue`);
        return false;
    }

    /**
     * Get next pair of users from queue
     * @returns {Array|null} Array of two users if available, null otherwise
     */
    getPair() {
        if (this.waitingQueue.length < 2) {
            return null;
        }

        // Get first two users from queue (FIFO)
        const user1 = this.waitingQueue.shift();
        const user2 = this.waitingQueue.shift();

        // Update status
        this.userStatus.set(user1.socketId, 'paired');
        this.userStatus.set(user2.socketId, 'paired');

        console.log(`🔗 Pairing users: ${user1.socketId} <-> ${user2.socketId}`);
        return [user1, user2];
    }

    /**
     * Check if user is in queue
     * @param {string} socketId - Socket ID to check
     * @returns {boolean} True if user is in queue
     */
    isInQueue(socketId) {
        return this.waitingQueue.some(user => user.socketId === socketId);
    }

    /**
     * Get queue size
     * @returns {number} Current queue size
     */
    getQueueSize() {
        return this.waitingQueue.length;
    }

    /**
     * Get user status
     * @param {string} socketId - Socket ID to check
     * @returns {string|null} User status or null if not found
     */
    getUserStatus(socketId) {
        return this.userStatus.get(socketId) || null;
    }

    /**
     * Update user status
     * @param {string} socketId - Socket ID of user
     * @param {string} status - New status
     */
    setUserStatus(socketId, status) {
        this.userStatus.set(socketId, status);
    }

    /**
     * Clear all data (useful for testing)
     */
    clear() {
        this.waitingQueue = [];
        this.userStatus.clear();
        console.log('Queue service cleared');
    }

    /**
     * Get queue statistics
     * @returns {Object} Queue statistics
     */
    getStats() {
        return {
            queueSize: this.waitingQueue.length,
            totalUsers: this.userStatus.size,
            userStatuses: {
                waiting: [...this.userStatus.values()].filter(s => s === 'waiting').length,
                paired: [...this.userStatus.values()].filter(s => s === 'paired').length,
                disconnected: [...this.userStatus.values()].filter(s => s === 'disconnected').length
            }
        };
    }
}

// Export singleton instance
export default new QueueService();