
/**
 * Validate socket ID format
 * @param {string} socketId - Socket ID to validate
 * @returns {boolean} True if valid
 */
export const isValidSocketId = (socketId) => {
    return typeof socketId === 'string' && socketId.length > 0 && socketId.length <= 128;
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

export const normalizeMessage = (message) => {
    if (typeof message !== 'string') return '';
    return message.trim().slice(0, 1000);
};

/**
 * Validate user data
 * @param {Object} userData - User data to validate
 * @returns {boolean} True if valid
 */
export const isValidUserData = (userData) => {
    if (typeof userData !== 'object' || userData === null || Array.isArray(userData)) {
        return false;
    }

    const entries = Object.entries(userData);
    if (entries.length > 10) return false;

    return entries.every(([key, value]) => {
        if (!/^[a-zA-Z0-9_-]{1,32}$/.test(key)) return false;
        if (value === null || value === undefined) return true;
        if (typeof value === 'string') return value.length <= 120;
        if (typeof value === 'number') return Number.isFinite(value);
        if (typeof value === 'boolean') return true;
        if (Array.isArray(value)) {
            return value.length <= 10 && value.every((item) => typeof item === 'string' && item.length <= 80);
        }
        return false;
    });
};

export const sanitizeUserData = (userData = {}) => {
    if (!isValidUserData(userData)) return {};

    return Object.fromEntries(
        Object.entries(userData)
            .filter(([, value]) => value !== undefined)
            .map(([key, value]) => {
                if (typeof value === 'string') return [key, value.trim()];
                if (Array.isArray(value)) return [key, value.map((item) => item.trim()).filter(Boolean)];
                return [key, value];
            })
    );
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
        typeof offer.sdp === 'string' &&
        offer.sdp.length > 0 &&
        offer.sdp.length <= 200_000
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
        typeof answer.sdp === 'string' &&
        answer.sdp.length > 0 &&
        answer.sdp.length <= 200_000
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
        typeof candidate === 'object' &&
        (!candidate.candidate || (typeof candidate.candidate === 'string' && candidate.candidate.length <= 5000)) &&
        (!candidate.sdpMid || (typeof candidate.sdpMid === 'string' && candidate.sdpMid.length <= 64)) &&
        (candidate.sdpMLineIndex === null ||
            candidate.sdpMLineIndex === undefined ||
            (Number.isInteger(candidate.sdpMLineIndex) && candidate.sdpMLineIndex >= 0 && candidate.sdpMLineIndex <= 64))
    );
};
