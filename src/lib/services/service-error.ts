export type ServiceErrorCode =
  | "missing_configuration"
  | "database_error"
  | "unknown";

export class ServiceError extends Error {
  code: ServiceErrorCode;

  constructor(message: string, code: ServiceErrorCode = "database_error") {
    super(message);
    this.name = "ServiceError";
    this.code = code;
  }
}

export function createServiceError(message: string) {
  const code = message.includes("Supabase ist noch nicht verbunden") ||
    message.includes("serverseitig nicht konfiguriert")
    ? "missing_configuration"
    : "database_error";

  return new ServiceError(message, code);
}
