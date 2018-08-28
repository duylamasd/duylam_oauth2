import winston from "winston";

/**
 * Logger
 */
const logger = winston.createLogger({
    transports: [
        new winston.transports.Console({ level: (process.env.NODE_ENV === "prod" || process.env.NODE_ENV === "production") ? "error" : "debug" }),
        new winston.transports.File({filename: "debug.log", level: "debug"})
    ]
});

if (process.env.NODE_ENV === "prod" || process.env.NODE_ENV === "production") {
    logger.debug("Logging initialized at debug level");
}

export default logger;