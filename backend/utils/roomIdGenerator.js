/**
 * Utility to generate unique room IDs
 */

/**
 * Generate a unique room ID
 * @returns {string} Unique room ID
 */
export const generateRoomId = () => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 15);
    return `room_${timestamp}_${randomStr}`;
};

/**
 * Generate a unique user ID
 * @returns {string} Unique user ID
 */
export const generateUserId = () => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 15);
    return `user_${timestamp}_${randomStr}`;
};

/**
 * Validate room ID format
 * @param {string} roomId - Room ID to validate
 * @returns {boolean} True if valid
 */
export const isValidRoomId = (roomId) => {
    return /^room_[a-z0-9_]+$/.test(roomId);
};