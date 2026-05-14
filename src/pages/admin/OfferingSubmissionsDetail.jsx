import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAdminOfferingDetail } from "../../api/offerings";

const GRADE_LABELS = [
  { key: "a",       label: "A"   },
  { key: "a_minus", label: "A-"  },
  { key: "b_plus",  label: "B+"  },
  { key: "b",       label: "B"   },
  { key: "b_minus", label: "B-"  },
  { key: "c_plus",  label: "C+"  },
  { key: "c",       label: "C"   },
  { key: "c_minus", label: "C-"  },
  { key: "d_plus",  label: "D+"  },
  { key: "d",       label: "D"   },
  { key: "f",       label: "F"   },
  { key: "w",       label: "W"   },
  { key: "i",       label: "I"   },
];

const OfferingSubmissionsDetail = () => {
  const { offeringId } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getAdminOfferingDetail(offeringId);
        setRecord(res.data);
      } catch (err) {
        setError("Could not load offering submissions.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [offeringId]);

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
          onClick={() => navigate("/admin/forms")}
        >
          Back to Forms
        </button>
      </div>
    );
  }

  const grades = record.grade_distribution;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate("/admin/forms")}
          className="text-(--primary-color) border border-(--primary-color) rounded-full px-3 py-1 text-sm hover:bg-gray-50 transition-colors"
        >
          ← Back
        </button>
        <div>
          <p className="text-2xl font-bold text-(--primary-color)">
            {record.course_code} - {record.course_name}
          </p>
          <p className="text-sm text-gray-500">
            {record.semester} &nbsp;|&nbsp; {record.campus}
            {record.coordinator_name && (
              <> &nbsp;|&nbsp; Coordinator: {record.coordinator_name}</>
            )}
          </p>
        </div>
      </div>

      {/* Grade Distribution */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 mb-5">
        <p className="font-semibold text-gray-700 mb-3">Grade Distribution</p>
        {grades ? (
          <div className="overflow-x-auto">
            <table className="text-sm text-center w-full">
              <thead>
                <tr className="bg-gray-50">
                  {GRADE_LABELS.map((g) => (
                    <th key={g.key} className="px-3 py-2 font-medium text-gray-600 border border-gray-200">
                      {g.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {GRADE_LABELS.map((g) => (
                    <td key={g.key} className="px-3 py-2 border border-gray-200">
                      {grades[g.key] ?? 0}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-400">No grade data submitted.</p>
        )}
      </div>

      {/* Per-instructor sections */}
      {(record.instructors ?? []).map((instructor) => (
        <div key={instructor.instructor_id} className="bg-white rounded-lg border border-gray-200 p-5 mb-5">
          <p className="text-lg font-semibold text-(--primary-color) mb-4">
            {instructor.instructor_name}
          </p>

          {/* PC Submissions */}
          <p className="text-sm font-semibold text-gray-600 mb-2">PC Submissions</p>
          {instructor.pc_submissions && instructor.pc_submissions.length > 0 ? (
            <div className="overflow-x-auto mb-4">
              <table className="text-sm w-full">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-3 py-2 font-medium text-gray-600 border border-gray-200">SO</th>
                    <th className="px-3 py-2 font-medium text-gray-600 border border-gray-200">PC Code</th>
                    <th className="px-3 py-2 font-medium text-gray-600 border border-gray-200">PC Description</th>
                    <th className="px-3 py-2 font-medium text-gray-600 border border-gray-200">Assessment Method</th>
                    <th className="px-3 py-2 font-medium text-gray-600 border border-gray-200">Avg Score</th>
                    <th className="px-3 py-2 font-medium text-gray-600 border border-gray-200">% Meeting Standard</th>
                    <th className="px-3 py-2 font-medium text-gray-600 border border-gray-200">Performance Standard</th>
                    <th className="px-3 py-2 font-medium text-gray-600 border border-gray-200">Comment</th>
                    <th className="px-3 py-2 font-medium text-gray-600 border border-gray-200">Upload</th>
                  </tr>
                </thead>
                <tbody>
                  {instructor.pc_submissions.map((sub, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-3 py-2 border border-gray-200">{sub.so_code ?? "-"}</td>
                      <td className="px-3 py-2 border border-gray-200">{sub.pc_code ?? "-"}</td>
                      <td className="px-3 py-2 border border-gray-200">{sub.pc_description ?? "-"}</td>
                      {/* <td className="px-3 py-2 border border-gray-200">{sub.assessment_method ?? "-"}</td> */}
                      <td className="px-3 py-2 border border-gray-200">
                        <div>{sub.assessment_method ?? "-"}</div>

                        {sub.assessment_method === "Embedded Assessment" && (
                          <div className="text-xs text-gray-500 mt-1 leading-5">
                            <div>Assessment: {sub.assessment_type || "—"}</div>
                            <div>Question: {sub.question_number || "—"}</div>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 border border-gray-200 text-center">{sub.average_score ?? "-"}</td>
                      <td className="px-3 py-2 border border-gray-200 text-center">
                        {sub.percentage_meeting_standard != null ? (
                          <span
                            style={{
                              color:
                                Number(sub.percentage_meeting_standard) < 70
                                  ? "#d32f2f"
                                  : "#2e7d32",
                              fontWeight: "bold",
                            }}
                          >
                            {sub.percentage_meeting_standard}%
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-3 py-2 border border-gray-200 text-center">
                        {sub.performance_standard ?? "-"}
                      </td>
                      <td className="px-3 py-2 border border-gray-200">{sub.comment || "-"}</td>
                      <td className="px-3 py-2 border border-gray-200 text-center">
                        {sub.upload_path ? (
                          <a
                            href={`http://localhost:5000/storage/${sub.upload_path}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-(--primary-color) underline"
                          >
                            View File
                          </a>
                        ) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-400 mb-4">No PC submissions for this instructor.</p>
          )}

          {/* Improvements */}
          <p className="text-sm font-semibold text-gray-600 mb-2">Improvements</p>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="whitespace-pre-line text-sm text-gray-700">
              {instructor.improvements || "No improvements submitted."}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default OfferingSubmissionsDetail;
