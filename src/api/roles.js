import api from "./axios";

export const getRoles = () => {
  return api.get("/roles");
};
