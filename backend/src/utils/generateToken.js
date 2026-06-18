import jwt from "jsonwebtoken";

/**
 * Generates a signed JWT for the given userId.
 * Reads JWT_SECRET and JWT_EXPIRES_IN from environment variables.
 *
 * @param {string} userId - The MongoDB _id of the user
 * @returns {string} Signed JWT string
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

export default generateToken;