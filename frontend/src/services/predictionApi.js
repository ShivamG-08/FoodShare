import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/**
 * Calls backend AI prediction endpoint without changing any UI.
 * @param {Object} foodData - The payload expected by the AI model.
 * @returns {Promise<string>} prediction - e.g., 'fresh' or 'not_fresh'
 */
export async function predictFreshness(foodData) {
  const { data } = await axios.post(`${BASE_URL}/predict`, foodData);
  return data?.prediction;
}

export default { predictFreshness };
