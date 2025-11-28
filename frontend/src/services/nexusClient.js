import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// Helper to handle API errors gracefully for the prototype
const safeRequest = async (requestFn) => {
  try {
    const response = await requestFn();
    return response.data;
  } catch (error) {
    console.error("Nexus API Error:", error);
    // Return mock data if API fails (for prototype stability)
    return null;
  }
};

export const nexusClient = {
  getChatHistory: (characterId) => safeRequest(() => axios.get(`${API_URL}/api/chat/${characterId}/history`)),
  
  sendChat: (characterId, message) => safeRequest(() => axios.post(`${API_URL}/api/chat/${characterId}`, { message })),
  
  getSystemStatus: () => safeRequest(() => axios.get(`${API_URL}/api/nexus/status`)),
  
  getMemories: (characterId) => safeRequest(() => axios.get(`${API_URL}/api/memories/fetch?character=${characterId}`)),
  
  getRelationship: (characterId) => safeRequest(() => axios.get(`${API_URL}/api/memories/relationship?character=${characterId}`)),
  
  getCharacterStatus: (characterId) => safeRequest(() => axios.get(`${API_URL}/api/characters/${characterId}/status`)),
  
  getLatestVideos: () => safeRequest(() => axios.get(`${API_URL}/api/videos/latest`)),
};
