import api from "./axios";

export const getInstructors = () => {
    return api.get("/users?role=instructor");
}