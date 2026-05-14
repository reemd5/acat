import api from "./axios";

export const getSubmissionGrades = (offeringId) => {
    return api.get("/course-offering-submission-grades", { params: { offering_id: offeringId } });
};

export const saveSubmissionGrades = (offeringId, grades) => {
    return api.post("/course-offering-submission-grades", { offering_id: offeringId, ...grades });
};
