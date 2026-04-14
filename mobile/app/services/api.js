import axios from 'axios';

// Replace '192.168.1.XX' with your computer's actual IPv4 address
// You can find it by typing 'ipconfig' (Windows) or 'ifconfig' (Mac) in terminal
const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;