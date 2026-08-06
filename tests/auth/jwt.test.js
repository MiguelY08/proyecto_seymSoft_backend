import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";

import {
  generateRefreshToken,
  verifyRefreshToken,
} from "../../src/config/jwt.js";

process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "test-refresh-secret";

test("verifyRefreshToken throws a clear error for expired refresh tokens", () => {
  const expiredToken = jwt.sign(
    { id_user: 1, type: "refresh" },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: 0 },
  );

  assert.throws(
    () => verifyRefreshToken(expiredToken),
    /Refresh token expired/,
  );
});

test("verifyRefreshToken throws a clear error for invalid refresh tokens", () => {
  assert.throws(
    () => verifyRefreshToken("not-a-valid-jwt"),
    /Refresh token invalid/,
  );
});

test("generateRefreshToken returns a refresh token payload with the expected type", () => {
  const token = generateRefreshToken(42);
  const decoded = jwt.decode(token);

  assert.equal(decoded.type, "refresh");
  assert.equal(decoded.id_user, 42);
});
