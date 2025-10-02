import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export async function createDonation(payload) {
  const { data } = await axios.post(`${BASE_URL}/api/donations`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });
  return data;
}

export async function getDonationsByUser(userId) {
  const { data } = await axios.get(`${BASE_URL}/api/donations`, {
    params: { userId },
  });
  return data;
}

export async function getAvailableDonations() {
  const { data } = await axios.get(`${BASE_URL}/api/donations/available`);
  return data;
}

export async function acceptDonation(donationId, receiverId) {
  const { data } = await axios.patch(
    `${BASE_URL}/api/donations/${donationId}/accept`,
    { receiverId },
    { headers: { 'Content-Type': 'application/json' } }
  );
  return data;
}

export async function markReceived(donationId, receiverId) {
  const { data } = await axios.patch(
    `${BASE_URL}/api/donations/${donationId}/received`,
    { receiverId },
    { headers: { 'Content-Type': 'application/json' } }
  );
  return data;
}

export default { createDonation, getDonationsByUser, getAvailableDonations, acceptDonation, markReceived };
