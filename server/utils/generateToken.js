import jwt from 'jsonwebtoken';

/**
 * Generate a signed JWT token containing the user's ID
 * @param {string} userId - Mongoose user document ID
 * @returns {string} Signed JWT token
 */
export const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET || 'stockwise_super_secure_jwt_secret_key_2026';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign({ id: userId }, secret, {
    expiresIn,
  });
};
