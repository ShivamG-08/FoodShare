import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Warn in dev if env is not set and we fall back to localhost
if (!process.env.REACT_APP_API_URL && typeof window !== 'undefined') {
  // eslint-disable-next-line no-console
  console.warn('[notificationApi] REACT_APP_API_URL not set; using', BASE_URL);
}

export async function getNotifications(userId, { unread = false } = {}) {
  const { data } = await axios.get(`${BASE_URL}/api/notifications`, {
    params: { userId, unread: unread ? 'true' : undefined },
  });
  return data;
}

export async function markNotificationRead(id) {
  const { data } = await axios.patch(`${BASE_URL}/api/notifications/${id}/read`);
  return data;
}

export default { getNotifications, markNotificationRead };
