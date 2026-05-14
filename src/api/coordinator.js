import api from "./axios";

export const getCoordinatorDashboardStats = (semester) => {
  return api.get("/coordinator-dashboard-stats", {
    params: semester ? { semester } : {},
  });
};

export const getCoordinatorImprovements = (semester) => {
  return api.get("/coordinator-improvements", {
    params: semester ? { semester } : {},
  });
};

export const getCoordinatorImprovementById = (id) => {
  return api.get(`/coordinator-improvements/${id}`);
};

export const getCoordinatorComparison = () => {
  return api.get("/coordinator-comparison");
};

export const getCoordinators = () => {
  return api.get('/users?role=coordinator')
}
