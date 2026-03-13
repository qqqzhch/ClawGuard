import type { ErrorCode } from './codes.js';

export class ClawGuardError extends Error {
  code: ErrorCode;
  httpStatus: number;
  details?: unknown;

  constructor(
    message: string,
    code: ErrorCode = 'UNKNOWN_ERROR',
    httpStatus = 500,
    details?: unknown,
  ) {
    super(message);
    this.name = 'ClawGuardError';
    this.code = code;
    this.httpStatus = httpStatus;
    this.details = details;
  }
}

export class BackupError extends ClawGuardError {
  constructor(message: string, details?: unknown) {
    super(message, 'BACKUP_FAILED', 500, details);
    this.name = 'BackupError';
  }
}

export class RestoreError extends ClawGuardError {
  constructor(message: string, details?: unknown) {
    super(message, 'RESTORE_FAILED', 500, details);
    this.name = 'RestoreError';
  }
}

export class FileNotFoundError extends ClawGuardError {
  constructor(path: string) {
    super(`File not found: ${path}`, 'FILE_NOT_FOUND', 404);
    this.name = 'FileNotFoundError';
  }
}

export class PermissionError extends ClawGuardError {
  constructor(message: string) {
    super(message, 'PERMISSION_DENIED', 403);
    this.name = 'PermissionError';
  }
}

export class ValidationError extends ClawGuardError {
  constructor(message: string, details?: unknown) {
    super(message, 'INVALID_CONFIG', 400, details);
    this.name = 'ValidationError';
  }
}

export class EncryptionError extends ClawGuardError {
  constructor(message: string) {
    super(message, 'ENCRYPTION_FAILED', 500);
    this.name = 'EncryptionError';
  }
}

export class DecryptionError extends ClawGuardError {
  constructor(message: string) {
    super(message, 'DECRYPTION_FAILED', 500);
    this.name = 'DecryptionError';
  }
}
