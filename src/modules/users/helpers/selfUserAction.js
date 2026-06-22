const normalizeUserId = (value) => {
  const numericValue = Number(value);

  return Number.isInteger(numericValue) && numericValue > 0
    ? numericValue
    : null;
};

export const getAuthenticatedUserId = (authUser = {}) =>
  normalizeUserId(authUser.id_user ?? authUser.idUser ?? authUser.id);

export const isSelfUserAction = ({ authUser, targetUserId }) => {
  const authenticatedUserId = getAuthenticatedUserId(authUser);
  const normalizedTargetUserId = normalizeUserId(targetUserId);

  if (!authenticatedUserId || !normalizedTargetUserId) {
    return false;
  }

  return authenticatedUserId === normalizedTargetUserId;
};

