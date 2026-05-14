import api from "./axios";

export const getOfferings = (params) => {
    return api.get("/course-offerings", { params });
}

export const createOffering = (data) => {
    return api.post("/course-offerings", data);
}

export const updateOffering = (id, data) => {
    return api.put(`/course-offerings/${id}`, data);
}

export const deleteOffering = (id) => {
    return api.delete(`/course-offerings/${id}`);
}

export const getInstructorOfferings = (semester) => {
    return api.get("/instructor/offerings", {
        params: semester ? { semester } : {}
    });
}

export const getOfferingById = (offeringId, instructorId) => {
    const params = instructorId ? { instructor_id: instructorId } : {};
    return api.get(`/course-offerings/${offeringId}`, { params });
}

export const submitInstructorForm = (offeringId, instructorId) =>
    api.post(`/course-offerings/${offeringId}/instructor-submit`, { instructor_id: instructorId });

export const getAdminOfferingDetail = (id) => {
    return api.get(`/admin-offering-detail/${id}`);
}