import React, { useEffect, useMemo, useState } from "react";
import InstructorFormTable from "../../components/instructor/InstructorFormTable";
import SemesterCountdown from "../../components/SemesterCountdown";
import { useLocation, useNavigate } from "react-router-dom";
import FormCompletionChart from "../../components/FormCompletionChart";
import { getInstructorOfferings } from "../../api/offerings";
import { useSettings } from "../../context/SettingsContext";

const OldForms = ({ offerings }) => {
  const navigate = useNavigate();
  const [selectedCourse, setSelectedCourse] = useState("Any");
  const [selectedSemester, setSelectedSemester] = useState("Any");
  const [results, setResults] = useState(null);

  const courseOptions = [
    "Any",
    ...new Set(offerings.map((o) => o.course?.course_code).filter(Boolean)),
  ];
  const semesterOptions = [
    "Any",
    ...new Set(offerings.map((o) => o.semester).filter(Boolean)),
  ];

  const handleChoose = () => {
    const filtered = offerings.filter((o) => {
      const courseMatch =
        selectedCourse === "Any" || o.course?.course_code === selectedCourse;
      const semesterMatch =
        selectedSemester === "Any" || o.semester === selectedSemester;
      return courseMatch && semesterMatch;
    });
    setResults(filtered);
  };

  return (
    <div className="w-full mt-4 grid grid-cols-1 xl:grid-cols-2 gap-4 items-stretch" id="old-forms">
      <div className="bg-white p-4 rounded-lg h-[320px] overflow-y-auto">
        <p className="text-(--primary-color) font-bold text-lg mb-4">
          Old Forms
        </p>

        <label className="block mb-3">
          Choose a semester and/or a course to view old forms
        </label>

        <div className="flex flex-col md:flex-row gap-4">
          <label className="w-full">Course:
            <select
              className="w-full border rounded-md p-2 mb-3"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
            >
              {courseOptions.map((course, index) => (
                <option key={index} value={course}>
                  {course}
                </option>
              ))}
            </select>
          </label>

          <label className="w-full">Semester:
            <select
              className="w-full border rounded-md p-2 mb-3"
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
            >
              {semesterOptions.map((semester, index) => (
                <option key={index} value={semester}>
                  {semester}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleChoose}
            className="bg-(--primary-color) hover:transition hover:bg-(--primary-color-hover) hover:duration-300 text-white px-4 py-2 rounded-md"
          >
            Choose
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg h-[320px] overflow-y-auto">
        <p className="text-(--primary-color) font-bold text-lg mb-4">Results</p>
        {results && results.length > 0 ? (
          <div className="space-y-3">
            {results.map((offering) => (
              <div
                key={offering.id}
                className="border border-gray-300 rounded-md p-3 flex justify-between items-center soft-hover"
              >
                <div>
                  <p className="font-semibold">
                    {offering.course?.course_code} Course Evaluation
                  </p>
                  <p className="text-sm text-gray-500">
                    {offering.course?.course_code} | {offering.semester}
                  </p>
                </div>

                <div className="flex justify-end gap-2">
                  <i
                    className="fa-solid fa-eye cursor-pointer"
                    onClick={() =>
                      navigate(`/instructor/forms/${offering.id}/view`)
                    }
                  ></i>
                </div>
              </div>
            ))}
          </div>
        ) : results && results.length === 0 ? (
          <p className="text-gray-500 mt-2">No forms found.</p>
        ) : (
          <p className="text-gray-500 mt-2">Choose filters, then click Choose to view results.</p>
        )}
      </div>
    </div>
  );
};


const Forms = () => {
  const location = useLocation();
  const { settings } = useSettings();
  const currentSemester = settings?.current_semester;
  const [offerings, setOfferings] = useState([]);

  useEffect(() => {
    getInstructorOfferings().then((res) => setOfferings(res.data));
  }, []);

  useEffect(() => {
    if (location.hash) {
      const element = document.querySelector(location.hash);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [location]);

  const chartData = useMemo(() => {
    let submitted = 0;
    let inProgress = 0;
    let unopened = 0;
    offerings.forEach((o) => {
      if (o.is_submitted) {
        submitted++;
      } else {
        const assignments = o.assignments || [];
        const hasSubmissions = assignments.some(
          (a) => (a.instructor_pc_submissions || []).length > 0
        );
        if (hasSubmissions) {
          inProgress++;
        } else {
          unopened++;
        }
      }
    });
    return [
      { value: submitted, label: "Submitted", labelMarkType: "square", color: "var(--primary-color)" },
      { value: inProgress, label: "In Progress", labelMarkType: "square", color: "var(--secondary-color)" },
      { value: unopened, label: "Unopened", labelMarkType: "square", color: "gray" },
    ];
  }, [offerings]);

  return (
    <div className="rounded-lg">
      <InstructorFormTable offerings={offerings} currentSemester={currentSemester} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <div className="min-h-[220px]">
          <SemesterCountdown />
        </div>
        <FormCompletionChart
          data={chartData}
          width={280}
          height={180}
          className="h-full"
        />
      </div>

      <OldForms offerings={offerings} />
    </div>
  );
};

export default Forms;
