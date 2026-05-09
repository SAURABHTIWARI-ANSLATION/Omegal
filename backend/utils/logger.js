/**
 * Logger utility for consistent logging
 */

const logLevels = {
    INFO: 'INFO',
    ERROR: 'ERROR',
    WARN: 'WARN',
    SUCCESS: 'SUCCESS',
    DEBUG: 'DEBUG'
};

const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[36m',
    gray: '\x1b[90m'
};

/**
 * Log message with level and color
 * @param {string} level - Log level
 * @param {string} message - Message to log
 * @param {*} data - Additional data to log
 */
const log = (level, message, data = null) => {
    const timestamp = new Date().toISOString();
    let color = colors.reset;

    switch (level) {
        case logLevels.ERROR:
            color = colors.red;
            break;
        case logLevels.WARN:
            color = colors.yellow;
            break;
        case logLevels.SUCCESS:
            color = colors.green;
            break;
        case logLevels.DEBUG:
            color = colors.gray;
            break;
        default:
            color = colors.blue;
    }

    const output = `${color}[${timestamp}] [${level}] ${message}${colors.reset}`;
    console.log(output);

    if (data) {
        console.log(data);
    }
};

export const logger = {
    info: (message, data) => log(logLevels.INFO, message, data),
    error: (message, data) => log(logLevels.ERROR, message, data),
    warn: (message, data) => log(logLevels.WARN, message, data),
    success: (message, data) => log(logLevels.SUCCESS, message, data),
    debug: (message, data) => log(logLevels.DEBUG, message, data)
};