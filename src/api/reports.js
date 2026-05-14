import api from "./axios";

export const getReports = () => api.get("/reports");

export const createReport = (data) => api.post("/reports", data);

export const getReportStats = () => api.get("/report-stats");

export const downloadReport = (id) =>
  api.get(`/reports/${id}/download`, { responseType: "blob" });

export const viewReport = (id) =>
  api.get(`/reports/${id}/view`, { responseType: "blob" });
