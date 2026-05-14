import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCoordinatorImprovementById } from "../../api/coordinator";

const ImprovementDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getCoordinatorImprovementById(id);
        setRecord(res.data);
      } catch (err) {
        setError("Could not load this improvement record.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <p className="text-gray-500">{error || "Record not found."}</p>
        <button
          className="text-sm text-(--primary-color) underline"
          onClick={() => navigate("/coordinator/improvements")}
        >
          Back to Improvements
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate("/coordinator/improvements")}
          className="text-(--primary-color) border border-(--primary-color) rounded-full px-3 py-1 text-sm hover:bg-gray-50 transition-colors"
        >
          ← Back
        </button>
        <div>
          <p className="text-2xl font-bold text-(--primary-color)">
            {record.course_code} - {record.course_name}
          </p>
          <p className="text-sm text-gray-500">Improvement Detail</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-5">
        {/* Meta */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Instructor</p>
            <p className="font-medium">{record.instructor_name}</p>
          </div>
          <div>
            <p className="text-gray-500">Semester</p>
            <p className="font-medium">{record.semester}</p>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Improvement text */}
        <div>
          <p className="text-sm font-semibold text-gray-500 mb-2">Improvements</p>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="whitespace-pre-line text-sm text-gray-700">
              {record.improvement_text || "No improvements submitted by this instructor."}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ImprovementDetail;
