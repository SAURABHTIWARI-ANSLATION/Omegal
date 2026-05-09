
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
        const existingStatus = this.userStatus.get(socketId);
        if (existingStatus === 'waiting') {
            return this.waitingQueue.find(user => user.socketId === socketId) || null;
        }

        if (existingStatus) {
            this.userStatus.delete(socketId);
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
            console.log(` User ${socketId} removed from queue. Queue size: ${this.waitingQueue.length}`);
            return true;
        }

        console.warn(`User ${socketId} not found in queue`);
        return false;
    }

    getQueuePosition(socketId) {
        const index = this.waitingQueue.findIndex(user => user.socketId === socketId);
        return index === -1 ? null : index + 1;
    }

    /**
     * Remove all queue status for a user, whether waiting or paired.
     * @param {string} socketId - Socket ID of the user
     * @returns {boolean} True if any state was removed
     */
    removeUser(socketId) {
        const index = this.waitingQueue.findIndex(user => user.socketId === socketId);
        const removedFromQueue = index !== -1;
        if (removedFromQueue) {
            this.waitingQueue.splice(index, 1);
        }
        const removedStatus = this.userStatus.delete(socketId);
        return removedFromQueue || removedStatus;
    }

    pruneUnavailableUsers(isAvailable) {
        const before = this.waitingQueue.length;
        this.waitingQueue = this.waitingQueue.filter((user) => {
            const keep = isAvailable(user.socketId);
            if (!keep) {
                this.userStatus.delete(user.socketId);
            }
            return keep;
        });

        return before - this.waitingQueue.length;
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
