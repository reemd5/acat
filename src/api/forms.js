
import api from "./axios";

export const getTotalForms = (semester) => {
    return api.get("/total-forms", {
        params: semester ? { semester } : {}
    });
}
export const getDetails =  (current_semester) => {
    return api.get("/forms", {
        params: { semester: current_semester }
    });
}

