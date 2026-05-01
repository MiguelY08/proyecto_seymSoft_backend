import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;


// Función para hashear la contraseña
export const hashPassword = async (plainTextPassword) => {
  if (!plainTextPassword) {
    throw new Error("Password is required for hashing");
  }

  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(plainTextPassword, salt);
};

// Función para comparar la contraseña ingresada con la hasheada
export const comparePassword = async (plainTextPassword, hashedPassword) => {
  if (!plainTextPassword || !hashedPassword) {
    return false;
  }

  return bcrypt.compare(plainTextPassword, hashedPassword);
};
