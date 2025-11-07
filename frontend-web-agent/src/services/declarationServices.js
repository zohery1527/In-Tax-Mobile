import api from "./api";

export const getPendingDeclarations = (page = 1, limit = 20) =>
  api.get(`/admin/declarations/pending?page=${page}&limit=${limit}`);

export const validateDeclaration = (id) =>
  api.patch(`/admin/declarations/${id}/validate`);

export const getDashboard = () =>
  api.get("/admin/dashboard");
