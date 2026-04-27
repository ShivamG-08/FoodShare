import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export async function createTask(taskData) {
  const { data } = await axios.post(`${BASE_URL}/api/tasks/create`, taskData, {
    headers: { 'Content-Type': 'application/json' },
  });
  return data;
}

export async function getAvailableTasks(limit = 50, priority) {
  const params = new URLSearchParams();
  if (limit) params.append('limit', limit);
  if (priority) params.append('priority', priority);
  
  const { data } = await axios.get(`${BASE_URL}/api/tasks/available?${params}`);
  return data;
}

export async function acceptTask(taskId, volunteerId) {
  const { data } = await axios.post(`${BASE_URL}/api/tasks/${taskId}/accept`, {
    volunteerId
  }, {
    headers: { 'Content-Type': 'application/json' },
  });
  return data;
}

export async function updateTaskStatus(taskId, status, volunteerId, notes) {
  const { data } = await axios.put(`${BASE_URL}/api/tasks/${taskId}/status`, {
    status,
    volunteerId,
    notes
  }, {
    headers: { 'Content-Type': 'application/json' },
  });
  return data;
}

export async function getVolunteerTasks(volunteerId, status) {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  
  const { data } = await axios.get(`${BASE_URL}/api/tasks/volunteer/${volunteerId}?${params}`);
  return data;
}

export async function getTaskStats() {
  const { data } = await axios.get(`${BASE_URL}/api/tasks/stats`);
  return data;
}

export async function confirmFoodReceived(taskId, receiverId, rating, feedback) {
  const { data } = await axios.patch(`${BASE_URL}/api/donations/${taskId}/receive-food`, {
    receiverId,
    rating,
    feedback
  }, {
    headers: { 'Content-Type': 'application/json' },
  });
  return data;
}

export default { 
  createTask, 
  getAvailableTasks, 
  acceptTask, 
  updateTaskStatus, 
  getVolunteerTasks, 
  getTaskStats,
  confirmFoodReceived
};
