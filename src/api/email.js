import api from "./axios";

export const sendEmail = (data) => {
  return api.post("/send-email", data);
};