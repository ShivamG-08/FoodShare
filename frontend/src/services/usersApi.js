import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export async function getUser(userId) {
  const { data } = await axios.get(`${BASE_URL}/api/users/${userId}`);
  return data;
}

export async function uploadAvatar(userId, file) {
  const fd = new FormData();
  fd.append('avatar', file);
  const { data } = await axios.post(`${BASE_URL}/api/users/${userId}/avatar`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export default { getUser, uploadAvatar };
