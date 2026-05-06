import axios from 'axios';

const agentApi = axios.create({
  baseURL: import.meta.env.VITE_AGENT_URL || 'http://localhost:8000'
});

agentApi.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error.response?.data || { message: 'Network error' })
);

export default agentApi;
