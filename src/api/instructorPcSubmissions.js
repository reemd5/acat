import api from "./axios";

export const getInstructorPcSubmissions = (instructorId, offeringId) => {
    return api.get("/instructor-assignment-pc-submissions", {
        params: { instructor_id: instructorId, offering_id: offeringId },
    });
};

export const submitInstructorPcData = (formData) => {
    return api.post("/instructor-assignment-pc-submissions", formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};

export const updateOfferingCoordinator = (offeringId, coordinatorId) => {
    return api.patch(`/course-offerings/${offeringId}/coordinator`, { coordinator_id: coordinatorId });
};
