/**
 * Type definitions for Null Protocol
 * @author Null Foundation
 */
// Error types
export class RelayerError extends Error {
    code;
    statusCode;
    constructor(message, code, statusCode = 500) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.name = 'RelayerError';
    }
}
export class ValidationError extends RelayerError {
    constructor(message) {
        super(message, 'VALIDATION_ERROR', 400);
    }
}
export class AuthenticationError extends RelayerError {
    constructor(message) {
        super(message, 'AUTHENTICATION_ERROR', 401);
    }
}
export class AuthorizationError extends RelayerError {
    constructor(message) {
        super(message, 'AUTHORIZATION_ERROR', 403);
    }
}
export class NotFoundError extends RelayerError {
    constructor(message) {
        super(message, 'NOT_FOUND_ERROR', 404);
    }
}
export class ConflictError extends RelayerError {
    constructor(message) {
        super(message, 'CONFLICT_ERROR', 409);
    }
}
export class RateLimitError extends RelayerError {
    constructor(message) {
        super(message, 'RATE_LIMIT_ERROR', 429);
    }
}
//# sourceMappingURL=index.js.map