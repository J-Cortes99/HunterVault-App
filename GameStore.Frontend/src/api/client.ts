import axios from 'axios';

export const apiClient = axios.create({
  baseURL: 'http://localhost:5147',
  headers: { 'Content-Type': 'application/json' },
});
