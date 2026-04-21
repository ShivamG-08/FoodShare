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

export async function uploadProfilePicture(file) {
  const fd = new FormData();
  fd.append('profilePic', file);
  
  // Get auth token from localStorage
  const token = localStorage.getItem('token');
  
  const { data } = await axios.put(`${BASE_URL}/api/users/upload-profile`, fd, {
    headers: { 
      'Content-Type': 'multipart/form-data',
      'Authorization': `Bearer ${token}`
    },
  });
  return data;
}

export default { getUser, uploadAvatar, uploadProfilePicture };
