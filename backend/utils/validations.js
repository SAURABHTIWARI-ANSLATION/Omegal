/**
 * Validation utilities
 */

/**
 * Validate socket ID format
 * @param {string} socketId - Socket ID to validate
 * @returns {boolean} True if valid
 */
export const isValidSocketId = (socketId) => {
    return typeof socketId === 'string' && socketId.length > 0;
};

/**
 * Validate message content
 * @param {string} message - Message to validate
 * @returns {boolean} True if valid
 */
export const isValidMessage = (message) => {
    if (typeof message !== 'string') return false;
    const trimmed = message.trim();
    return trimmed.length > 0 && trimmed.length <= 1000;
};

/**
 * Validate user data
 * @param {Object} userData - User data to validate
 * @returns {boolean} True if valid
 */
export const isValidUserData = (userData) => {
    if (typeof userData !== 'object' || userData === null) {
        return false;
    }
    // Add more validation as needed
    return true;
};

/**
 * Validate WebRTC offer
 * @param {Object} offer - Offer object
 * @returns {boolean} True if valid
 */
export const isValidOffer = (offer) => {
    return (
        offer &&
        typeof offer === 'object' &&
        offer.type === 'offer' &&
        offer.sdp
    );
};

/**
 * Validate WebRTC answer
 * @param {Object} answer - Answer object
 * @returns {boolean} True if valid
 */
export const isValidAnswer = (answer) => {
    return (
        answer &&
        typeof answer === 'object' &&
        answer.type === 'answer' &&
        answer.sdp
    );
};

/**
 * Validate ICE candidate
 * @param {Object} candidate - ICE candidate object
 * @returns {boolean} True if valid
 */
export const isValidICECandidate = (candidate) => {
    return (
        candidate &&
        typeof candidate === 'object'
    );
};