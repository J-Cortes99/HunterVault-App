import axios from 'axios';

export const apiClient = axios.create({
  baseURL: 'https://huntervault-api-dvarbrfud9g2c9b6.spaincentral-01.azurewebsites.net/api',
  headers: { 'Content-Type': 'application/json' },
});
