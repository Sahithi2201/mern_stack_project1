import jwt from 'jsonwebtoken';

/**
 * Generate a JSON Web Token (JWT)
 * Signs the user ID with the secret key from environment variables.
 * 
 * @param {string} id - The MongoDB user ID (_id)
 * @returns {string} Signed JWT token valid for 7 days
 */
export const generateToken = (id) => {
  const secret = process.env.JWT_SECRET || 'tixora-secret-key-development-fallback';

  return jwt.sign({ id }, secret, {
    expiresIn: '7d',
  });
};

export default generateToken;
