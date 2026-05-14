import api from "./axios";

export const getFormCompletionStats = (semester) =>
    api.get("/instructors-form-completion-stats", {
        params: semester ? { semester } : {}
    });