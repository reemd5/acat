import { useEffect, useState } from "react";
import api from "../api/axios";

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/notifications")
      .then(res => {
        const data = res.data;
        if (!Array.isArray(data)) {
          console.error("[useNotifications] unexpected response:", data);
        }
        setNotifications(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        console.error("[useNotifications] API error:", err.response?.status, err.response?.data || err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  return { notifications, setNotifications, loading };
}
