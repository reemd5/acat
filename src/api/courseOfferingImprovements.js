import api from "./axios";

export const getInstructorImprovement = (offeringId, instructorId) => {
    return api.get("/course-offering-instructor-improvements", {
        params: { offering_id: offeringId, instructor_id: instructorId },
    });
};

export const saveInstructorImprovement = (offeringId, instructorId, improvements) => {
    return api.post("/course-offering-instructor-improvements", {
        offering_id: offeringId,
        instructor_id: instructorId,
        improvements,
    });
};
