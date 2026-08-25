import apiClient from './axios';

export const apiGet = (url, params) =>
  apiClient.get(url, { params }).then((res) => res.data);

export const apiPost = (url, data) =>
  apiClient.post(url, data).then((res) => res.data);

export const apiPut = (url, data) =>
  apiClient.put(url, data).then((res) => res.data);

export const apiPatch = (url, data) =>
  apiClient.patch(url, data).then((res) => res.data);

export const apiDelete = (url) =>
  apiClient.delete(url).then((res) => res.data);

export default apiClient;
