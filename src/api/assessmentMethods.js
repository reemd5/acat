import api from "./axios";

export const getAssessmentMethods = () => {
    return api.get("/assessment-methods");
};
