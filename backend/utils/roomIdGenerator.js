/**
 * Utility to generate unique room IDs
 */
import { randomUUID } from 'crypto';

/**
 * Generate a unique room ID
 * @returns {string} Unique room ID
 */
export const generateRoomId = () => {
    return `room_${randomUUID().replace(/-/g, '')}`;
};

/**
 * Generate a unique user ID
 * @returns {string} Unique user ID
 */
export const generateUserId = () => {
    return `user_${randomUUID().replace(/-/g, '')}`;
};

/**
 * Validate room ID format
 * @param {string} roomId - Room ID to validate
 * @returns {boolean} True if valid
 */
export const isValidRoomId = (roomId) => {
    return /^room_[a-z0-9_]+$/.test(roomId);
};
