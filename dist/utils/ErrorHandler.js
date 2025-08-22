"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ErrorHandler extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        // Ensure instanceof works correctly
        Object.setPrototypeOf(this, new.target.prototype);
        // Node.js specific stack trace helper
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
exports.default = ErrorHandler;
//# sourceMappingURL=ErrorHandler.js.map