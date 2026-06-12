const {
  AppError,
  ValidationError,
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
} = require("./AppError");

describe("AppError", () => {
  it("deve criar um AppError com valores padrão", () => {
    const error = new AppError("Erro genérico");

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toBe("Erro genérico");
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe("APP_ERROR");
    expect(error.name).toBe("AppError");
  });

  it("deve criar um AppError com statusCode e code customizados", () => {
    const error = new AppError("Erro customizado", 422, "CUSTOM_ERROR");

    expect(error.message).toBe("Erro customizado");
    expect(error.statusCode).toBe(422);
    expect(error.code).toBe("CUSTOM_ERROR");
  });

  it("deve capturar stack trace", () => {
    const error = new AppError("Com stack");

    expect(error.stack).toBeDefined();
    expect(typeof error.stack).toBe("string");
  });
});

describe("ValidationError", () => {
  it("deve ser instância de AppError e ValidationError", () => {
    const error = new ValidationError("Campo obrigatório ausente");

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(ValidationError);
    expect(error.message).toBe("Campo obrigatório ausente");
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe("VALIDATION_ERROR");
  });
});

describe("ConflictError", () => {
  it("deve ter statusCode 409 e code CONFLICT_ERROR", () => {
    const error = new ConflictError("Registro duplicado");

    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(ConflictError);
    expect(error.message).toBe("Registro duplicado");
    expect(error.statusCode).toBe(409);
    expect(error.code).toBe("CONFLICT_ERROR");
  });
});

describe("UnauthorizedError", () => {
  it("deve ter statusCode 401 e code UNAUTHORIZED_ERROR", () => {
    const error = new UnauthorizedError("Token inválido");

    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(UnauthorizedError);
    expect(error.message).toBe("Token inválido");
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe("UNAUTHORIZED_ERROR");
  });
});

describe("ForbiddenError", () => {
  it("deve ter statusCode 403 e code FORBIDDEN_ERROR", () => {
    const error = new ForbiddenError("Acesso negado");

    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(ForbiddenError);
    expect(error.message).toBe("Acesso negado");
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe("FORBIDDEN_ERROR");
  });
});

describe("NotFoundError", () => {
  it("deve ter statusCode 404 e code NOT_FOUND_ERROR", () => {
    const error = new NotFoundError("Paciente não encontrado");

    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(NotFoundError);
    expect(error.message).toBe("Paciente não encontrado");
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe("NOT_FOUND_ERROR");
  });
});
