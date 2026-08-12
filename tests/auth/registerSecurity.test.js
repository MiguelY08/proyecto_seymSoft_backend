import test from "node:test";
import assert from "node:assert/strict";

import {
  checkEmailSchema,
  registerSchema,
} from "../../src/modules/auth/validators/authValidators.js";
import { RegisterUseCase } from "../../src/modules/auth/use-cases/registerUseCase.js";
import { AuthRepository } from "../../src/modules/auth/repositories/authRepository.js";
import { ConflictError } from "../../src/shared/errors/index.js";
import { registerRateLimiter } from "../../src/modules/auth/middlewares/registerRateLimiter.js";

const validRegisterPayload = {
  full_name: "Miguel Angel",
  email: "miguel@example.com",
  password: "Password1",
  phone: "3001234567",
  termsAccepted: true,
};

const getIssueMessages = (result) =>
  result.error.issues.map((issue) => issue.message);

test("registerSchema accepts a valid public register payload", () => {
  const result = registerSchema.safeParse(validRegisterPayload);

  assert.equal(result.success, true);
  assert.equal(result.data.email, "miguel@example.com");
  assert.equal(result.data.pass_word, "Password1");
  assert.equal(result.data.phone, 3001234567n);
});

test("registerSchema accepts the existing camelCase fullName payload", () => {
  const { full_name, ...payloadWithFullName } = validRegisterPayload;
  const result = registerSchema.safeParse({
    ...payloadWithFullName,
    fullName: full_name,
  });

  assert.equal(result.success, true);
  assert.equal(result.data.full_name, "Miguel Angel");
});

test("registerSchema rejects missing termsAccepted", () => {
  const { termsAccepted, ...payloadWithoutTerms } = validRegisterPayload;
  const result = registerSchema.safeParse(payloadWithoutTerms);

  assert.equal(result.success, false);
  assert.ok(
    getIssueMessages(result).includes(
      "Debes aceptar los términos y condiciones para registrarte.",
    ),
  );
});

test("registerSchema rejects termsAccepted false", () => {
  const result = registerSchema.safeParse({
    ...validRegisterPayload,
    termsAccepted: false,
  });

  assert.equal(result.success, false);
  assert.ok(
    getIssueMessages(result).includes(
      "Debes aceptar los términos y condiciones para registrarte.",
    ),
  );
});

test("registerSchema rejects HTML tags in full_name", () => {
  const result = registerSchema.safeParse({
    ...validRegisterPayload,
    full_name: "<script>alert(1)</script>",
  });

  assert.equal(result.success, false);
  assert.match(getIssueMessages(result).join(" "), /No se permiten etiquetas HTML/);
});

test("registerSchema rejects HTML tags in another text field", () => {
  const result = registerSchema.safeParse({
    ...validRegisterPayload,
    password: "Password1<img src=x>",
  });

  assert.equal(result.success, false);
  assert.match(getIssueMessages(result).join(" "), /No se permiten etiquetas HTML/);
});

test("registerSchema rejects invalid email", () => {
  const result = registerSchema.safeParse({
    ...validRegisterPayload,
    email: "invalid-email",
  });

  assert.equal(result.success, false);
});

test("registerSchema accepts an email apostrophe in the local part", () => {
  const result = registerSchema.safeParse({
    ...validRegisterPayload,
    email: "miguel'@gmail.com",
  });

  assert.equal(result.success, true);
  assert.equal(result.data.email, "miguel'@gmail.com");
});

test("registerSchema accepts an email plus sign in the local part", () => {
  const result = registerSchema.safeParse({
    ...validRegisterPayload,
    email: "miguel+ventas@gmail.com",
  });

  assert.equal(result.success, true);
  assert.equal(result.data.email, "miguel+ventas@gmail.com");
});

test("checkEmailSchema accepts valid special email characters used by register", () => {
  const apostropheResult = checkEmailSchema.safeParse({
    email: "miguel'@gmail.com",
  });
  const plusResult = checkEmailSchema.safeParse({
    email: "miguel+ventas@gmail.com",
  });

  assert.equal(apostropheResult.success, true);
  assert.equal(plusResult.success, true);
});

test("checkEmailSchema accepts question mark as a valid local-part character", () => {
  const result = checkEmailSchema.safeParse({
    email: "yepesangel8?@gmail.com",
  });

  assert.equal(result.success, true);
});

test("registerSchema rejects incomplete data", () => {
  const result = registerSchema.safeParse({
    email: "miguel@example.com",
    termsAccepted: true,
  });

  assert.equal(result.success, false);
});

test("RegisterUseCase preserves duplicate email protection", async () => {
  const originalFindUserByEmail = AuthRepository.findUserByEmail;
  AuthRepository.findUserByEmail = async () => ({ id_user: 1 });

  try {
    await assert.rejects(
      () => RegisterUseCase.execute(validRegisterPayload),
      ConflictError,
    );
  } finally {
    AuthRepository.findUserByEmail = originalFindUserByEmail;
  }
});

test("registerSchema rejects unexpected fields", () => {
  const result = registerSchema.safeParse({
    ...validRegisterPayload,
    role: "admin",
  });

  assert.equal(result.success, false);
  assert.equal(result.error.issues.some((issue) => issue.code === "unrecognized_keys"), true);
});

const createRateLimitRequest = (ip) => ({
  ip,
  method: "POST",
  originalUrl: "/auth/register",
  headers: {},
  socket: { remoteAddress: ip },
  app: { get: () => false },
});

const createRateLimitResponse = () => ({
  statusCode: 200,
  headers: {},
  setHeader(name, value) {
    this.headers[name] = value;
  },
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    this.finished = true;
    this.onFinish?.();
    return this;
  },
  send(body) {
    this.body = body;
    this.finished = true;
    this.onFinish?.();
    return this;
  },
});

const runRateLimiter = (req, res) =>
  new Promise((resolve, reject) => {
    res.onFinish = resolve;

    registerRateLimiter(req, res, (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

test("registerRateLimiter returns 429 after too many register requests", async () => {
  const ip = "203.0.113.10";
  registerRateLimiter.resetKey(ip);

  for (let index = 0; index < 10; index += 1) {
    const res = createRateLimitResponse();
    await runRateLimiter(createRateLimitRequest(ip), res);
    assert.notEqual(res.statusCode, 429);
  }

  const limitedResponse = createRateLimitResponse();
  await runRateLimiter(createRateLimitRequest(ip), limitedResponse);

  assert.equal(limitedResponse.statusCode, 429);
  assert.equal(limitedResponse.body.success, false);
});
