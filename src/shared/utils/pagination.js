export const getPagination = ({ page = 1, limit = 10 } = {}) => {
  const normalizedPage = Number(page) >= 1 ? Number(page) : 1;
  const normalizedLimit = Number(limit) >= 1 ? Number(limit) : 10;

  const skip = (normalizedPage - 1) * normalizedLimit;
  const take = normalizedLimit;

  return { skip, take };
};
