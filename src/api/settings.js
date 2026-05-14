import api from "./axios";

export const getCurrentSettings = () => {
  return api.get("/settings");
};

export const saveCurrentSettings = (settings) => {
  if (settings.id) {
    return api.put(`/settings/${settings.id}`, settings);
  }
  return api.post("/settings", settings);
};

