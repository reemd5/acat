import * as React from "react";
import {
  TableContainer, Table, TableHead, TableBody, TableRow, TableCell,
  Typography, Box, TextField, FormControl, InputLabel, Select, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions,
  OutlinedInput, Chip, FormHelperText,
  IconButton,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import InsightsIcon from '@mui/icons-material/Insights';
import { getCourses } from "../../api/courses";
import { getSOs, getPCs } from "../../api/so";
import { getStaff } from "../../api/staff";
import { useSettings } from "../../context/SettingsContext";
import { getAssignments, addAssignment, updateAssignmentById, deleteAssignmentById } from "../../api/assignment";
import { getOfferings } from "../../api/offerings";
import { getCampuses } from "../../api/campuses";


const YEAR_SO_MAPPING = {
  1: [1, 2, 3],  // Year 1: SO1, SO2, SO3
  2: [4, 5, 6],  // Year 2: SO4, SO5, SO6
  3: [],         // Year 3: no SOs
};
const SEMESTERS = ["Fall", "Spring"];

const normalizeId = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = typeof value === "string" ? parseInt(value, 10) : value;
  return Number.isNaN(parsed) ? null : parsed;
};


// sorts PC codes numerically, so 1.1 comes before 1.3.
const comparePcCodes = (leftCode = "", rightCode = "") => {
  const [leftMajor = 0, leftMinor = 0] = leftCode.split(".").map(Number);
  const [rightMajor = 0, rightMinor = 0] = rightCode.split(".").map(Number);

  if (leftMajor !== rightMajor) {
    return leftMajor - rightMajor;
  }

  return leftMinor - rightMinor;
};

const AssignmentTable = () => {
  const [assignments, setAssignments] = React.useState([]);
  const [courses, setCourses] = React.useState([]);
  const [SOs, setSOs] = React.useState([]);
  const [PCs, setPCs] = React.useState([]);
  const [users, setUsers] = React.useState([]);
  const { settings } = useSettings();
  const [campuses, setCampuses] = React.useState([]);
  const [offerings, setOfferings] = React.useState([]);
  const [selectedProcess, setSelectedProcess] = React.useState("");
  const [availableProcesses, setAvailableProcesses] = React.useState([]);
  const [openDialog, setOpenDialog] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState(null);
  const [dialogYear, setDialogYear] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState(null);
  // generate empty assignment with dynamic campus fields
  const getEmptyAssignment = () => {
    const base = {
      id: "",
      year: settings?.year_number,
      academic_year: settings?.academic_year || "",
      so_id: "",
      course_id: "",
      offering_id: null,
      pc_ids: [],
    };

    return base;
  };
  // Initialize assignmentData with empty assignment
  const [assignmentData, setAssignmentData] = React.useState(getEmptyAssignment());
  // Update assignmentData when campuses are loaded
  React.useEffect(() => {
    if (campuses.length > 0) {
      const updatedData = getEmptyAssignment();
      setAssignmentData(updatedData);
    }
  }, [campuses]);
  React.useEffect(() => {
    fetchAllData();
  }, []);
  React.useEffect(() => {
  }, [assignmentData]);
  React.useEffect(() => {
    if (settings && settings.academic_year && settings.year_number) {
      const processes = generateProcesses();
      setAvailableProcesses(processes);
      if (processes.length > 0 && !selectedProcess) {
        const currentProcess = processes.find(p => p.includes("(Current)")) || processes[0];
        setSelectedProcess(currentProcess);
      }
    }
  }, [settings]);
  const generateProcesses = () => {
    const processes = [];
    if (!settings?.academic_year || !settings?.year_number) {
      return processes;
    }
    try {
      const academicStart = parseInt(settings.academic_year.split("-")[0], 10);
      const yearNumber = settings.year_number;
      const processStart = academicStart - (yearNumber - 1);
      const processEnd = processStart + 3;
      processes.push(`${processStart}-${processEnd} (Current)`);
      for (let i = 1; i <= 2; i++) {
        const prevStart = processStart - 3 * i;
        const prevEnd = prevStart + 3;
        processes.push(`${prevStart}-${prevEnd}`);
      }
      return processes;
    } catch (error) {
      console.error("Error generating processes:", error);
      return processes;
    }
  };
  const getAcademicYearsForProcess = () => {
    if (!selectedProcess) {
      return [];
    }
    const match = selectedProcess.match(/(\d{4})-(\d{4})/);
    if (!match) {
      return [];
    }
    const startYear = parseInt(match[1]);
    const years = [
      `${startYear}-${startYear + 1}`,
      `${startYear + 1}-${startYear + 2}`,
      `${startYear + 2}-${startYear + 3}`
    ];
    return years;
  };
  // const getCurrentYearNumber = () => {
  //   return settings?.year_number;
  // };
  const getCurrentYearNumber = () => {
    return Number(settings?.year_number);
  };
  const isCurrentProcess = () => {
    const isCurrent = selectedProcess && selectedProcess.includes("(Current)");
    return isCurrent;
  };
  const isYearEditable = (yearNumber) => {
    const isEditable = isCurrentProcess() &&
      yearNumber === getCurrentYearNumber() &&
      yearNumber !== 3;
    return isEditable;
  };
  const fetchAllData = async () => {
    try {
      setIsLoading(true);
      const [coursesRes, soRes, pcRes, usersRes, assignmentsRes, campusesRes, offeringsRes] = await Promise.all([
        getCourses(),
        getSOs(),
        getPCs(),
        getStaff(),
        getAssignments(),
        getCampuses(),
        getOfferings()
      ]);
      setCourses(coursesRes.data);
      setSOs(soRes.data);
      setPCs(pcRes.data);
      setUsers(usersRes.data);
      setAssignments(assignmentsRes.data);
      setCampuses(campusesRes.data);
      setIsLoading(false);
      setOfferings(offeringsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      setIsLoading(false);
    }
  };
  const getSOsForYear = (yearNumber) => {
    const soIds = YEAR_SO_MAPPING[yearNumber] || [];
    const filteredSOs = SOs.filter(so => {
      // Handle both string and number IDs
      const soIdNum = typeof so.id === 'string' ? parseInt(so.id) : so.id;
      return soIds.includes(soIdNum);
    });


    return filteredSOs;
  };
  const getAssignmentsForYear = (yearNumber, academicYear) => {
    if (!academicYear) {
      return [];
    }
    const filteredAssignments = assignments.filter(assignment => {
      // Convert IDs to numbers for comparison
      const assignmentYear = typeof assignment.year === 'string' ? parseInt(assignment.year) : assignment.year;

      return assignment.offering.academic_year === academicYear;
    });
    return filteredAssignments;
  };
  const getGroupedAssignments = (yearNumber, academicYear) => {
    const yearAssignments = getAssignmentsForYear(yearNumber, academicYear);
    const soList = getSOsForYear(yearNumber);

    const grouped = soList.map(so => {
      const courseAssignments = {};
      // Convert SO ID to appropriate type for comparison
      const soIdNum = typeof so.id === 'string' ? parseInt(so.id) : so.id;


      yearAssignments
        .filter(a => {
          const aSoId = typeof a.so_id === 'string' ? parseInt(a.so_id) : a.so_id;
          return aSoId === soIdNum;
        })
        .forEach(assignment => {

          const key = `${assignment.offering.course_id}-${assignment.so_id}`;

          if (!courseAssignments[key]) {
            courseAssignments[key] = {
              course_id: assignment.course_id,
              so_id: assignment.so_id,
              pc_ids: []
            };
            // Initialize all campus slots
            campuses.forEach(campus => {
              courseAssignments[key][campus.campus_name] = null;
            });
          }
          // Assign to correct campus
          if (assignment.campus_id && campuses.find(c => c.id === assignment.campus_id)) {
            courseAssignments[key][assignment.campus] = assignment;
          }

          // Combine PC IDs from all campuses
          if (assignment.pc_ids && Array.isArray(assignment.pc_ids)) {
            // Convert all IDs to strings for consistency
            const pcIdsAsStrings = assignment.pc_ids.map(id => id.toString());
            courseAssignments[key].pc_ids = [
              ...new Set([...courseAssignments[key].pc_ids, ...pcIdsAsStrings])
            ];
          }
        });
      // Convert to course rows format

      const courseRows = Object.values(courseAssignments).map(data => {
        const course = courses.find(c => {
          const cId = typeof c.id === 'string' ? parseInt(c.id) : c.id;
          const dCourseId = typeof data.course_id === 'string' ? parseInt(data.course_id) : data.course_id;
          return cId === dCourseId;
        });
        const campusAssignments = {};

        campuses.forEach(campus => {
          campusAssignments[campus.campus_name] = data[campus.campus_name];
        });
        return {
          course,
          campusAssignments, // Store campus assignments here
          pc_ids: data.pc_ids || []
        };
      });
      return {
        so,
        courseRows
      };
    });
    return grouped;
  };
  /*const getCoursesBySO = (soId) => {
    if (!soId) {
      return [];
    }
    const soIdNum = typeof soId === 'string' ? parseInt(soId) : soId;

    const filteredCourses = courses.filter(course => {
      if (!course.sos || !Array.isArray(course.sos)) {
        return false;
      }


      // Convert all IDs to numbers for comparison
      const courseSoIds = course.sos.map(so => typeof so.id === 'string' ? parseInt(so.id) : so.id);
      return courseSoIds.includes(soIdNum);
    });
    return filteredCourses;
  };*/
  /*const getCourseById = (courseId) => {
    if (!courseId) {
      return null;
    }
    const courseIdNum = typeof courseId === 'string' ? parseInt(courseId) : courseId;
    return courses.find(course => {
      const currentCourseId = typeof course.id === 'string' ? parseInt(course.id) : course.id;
      return currentCourseId === courseIdNum;
    }) || null;
  };*/
  /*const getCourseOptions = (soId, selectedCourseId) => {

    const soCourses = getCoursesBySO(soId);
    const selectedCourse = getCourseById(selectedCourseId);
    if (!selectedCourse) {
      return soCourses;
    }
    const alreadyIncluded = soCourses.some(course => {
      const courseIdNum = typeof course.id === 'string' ? parseInt(course.id) : course.id;
      const selectedIdNum = typeof selectedCourse.id === 'string' ? parseInt(selectedCourse.id) : selectedCourse.id;
      return courseIdNum === selectedIdNum;
    });
    return alreadyIncluded ? soCourses : [selectedCourse, ...soCourses];
  };*/
  const getPCsBySO = (soId) => {
    if (!soId) {
      return [];
    }
    const soIdNum = normalizeId(soId);
    return PCs
      .filter((pc) => normalizeId(pc.so_id) === soIdNum)
      .sort((left, right) => comparePcCodes(left.pc_code, right.pc_code));
  };

  const sortAndFilterPcIds = React.useCallback((pcIds, soId) => {
    if (!Array.isArray(pcIds) || !soId) {
      return [];
    }

    const soIdNum = normalizeId(soId);
    const allowedPcIds = new Set(
      PCs
        .filter((pc) => normalizeId(pc.so_id) === soIdNum)
        .map((pc) => normalizeId(pc.id))
        .filter((id) => id !== null)
    );

    return [...new Set(pcIds.map(normalizeId))]
      .filter((id) => id !== null && allowedPcIds.has(id))
      .sort((leftId, rightId) => {
        const leftPc = PCs.find((pc) => normalizeId(pc.id) === leftId);
        const rightPc = PCs.find((pc) => normalizeId(pc.id) === rightId);
        return comparePcCodes(leftPc?.pc_code, rightPc?.pc_code);
      })
      .map((id) => id.toString());
  }, [PCs]);
  // Filter instructors for a specific campus
  /*const filterInstructors = (campusName) => {
    const filtered = users.filter((user) => {
      const hasInstructorRole = Array.isArray(user.roles) && user.roles.some(role => role.role_name === "instructor");

      const isCampusMatch = Array.isArray(user.campuses)
        ? user.campuses.some(campus => campus.campus_name === campusName)
        : user.campus === campusName ||
        user.campus === "NULL" ||
        !user.campus ||
        user.campus === "";
      return hasInstructorRole && isCampusMatch;
    });
    return filtered;
  };*/
  /*const getUserName = (id) => {
    if (!id) {
      return "";
    }
    const idStr = id.toString();
    const user = users.find(u => u.id.toString() === idStr);
    const name = user ? `${user.first_name} ${user.last_name}` : "";
    return name;
  };*/
  // const getCurrentSemesterOptions = () => {
  //   const academicYears = getAcademicYearsForProcess();

  //   const academicYear = academicYears[dialogYear - 1];
  //   if (!academicYear) {
  //     return [];
  //   }
  //   const yearPart = academicYear.split("-")[0];
  //   const currentSemester = settings?.current_semester || "";
  //   const isEditableYear = isYearEditable(dialogYear);
  //   const options = SEMESTERS.map(sem => {
  //     const fullSemester = `${sem} ${yearPart}`;
  //     const disabled = isEditableYear ? fullSemester !== currentSemester : true;
  //     return {
  //       value: fullSemester,
  //       label: fullSemester,
  //       disabled: disabled
  //     };
  //   });
  //   return options;
  // };
  const getCurrentSemesterOptions = () => {
    const currentSemester = settings?.current_semester;
    if (!currentSemester) return [];
    return [{ value: currentSemester, label: currentSemester }];
  };
  const handleFieldChange = (field, value) => {
    const newData = { ...assignmentData, [field]: value };
    if (field === 'so_id' || field === 'campus_id' || field === 'semester') {
      newData.offering_id = "";
      newData.pc_ids = [];
    }
    setAssignmentData(newData);
  };
  // Handle PC selection change
  const handlePCChange = (e) => {
    const selectedPCIds = e.target.value;
    setAssignmentData(prev => {
      const newData = {
        ...prev,
        pc_ids: sortAndFilterPcIds(
          Array.isArray(selectedPCIds) ? selectedPCIds : [selectedPCIds],
          prev.so_id
        )
      };
      return newData;
    });
  };
  // Add new assignment
  const handleAdd = async () => {
    if (!validateForm()) {
      return;
    }
    try {
      const academicYears = getAcademicYearsForProcess();
      const academicYear = academicYears[dialogYear - 1];
      const assignmentsToSave = [];

      /*
      // Create assignments for each campus with data
      campuses.forEach(campus => {
        const semesterField = `semester_${campus.campus_name}`;
        const instructorField = `instructor_id_${campus.campus_name}`;
        if (assignmentData[semesterField] && assignmentData[instructorField]) {
          const assignmentDataToSave = {
            course_id: typeof assignmentData.course_id === 'string' ? parseInt(assignmentData.course_id) : assignmentData.course_id,
            so_id: typeof assignmentData.so_id === 'string' ? parseInt(assignmentData.so_id) : assignmentData.so_id,
            instructor_id: assignmentData[instructorField] || null,
            pc_ids: Array.isArray(assignmentData.pc_ids)
              ? assignmentData.pc_ids.map(id => typeof id === 'string' ? parseInt(id) : id)
              : [],
            year: dialogYear,
            academic_year: academicYear,
            semester: assignmentData[semesterField],
            campus: campus.campus_name,
            created_at: new Date().toISOString()
          };
          assignmentsToSave.push(assignmentDataToSave);
        } else {
        }
      });
      if (assignmentsToSave.length === 0) {
        alert("Please fill in at least one campus with semester and instructor");
        return;
      }*/
      // Save all assignments\

      const res = await addAssignment(assignmentData);


      /*const savedAssignments = [];
      for (const data of assignmentsToSave) {
        const res = await addAssignment(data);
        savedAssignments.push(res.data);
      }*/
      // Update local state
      const assignmentsRes = await getAssignments();
      setAssignments(assignmentsRes.data);
      setOpenDialog(false);
      resetForm();
    } catch (error) {
      console.error("Error creating assignments:", error);
      alert(`Error creating assignments: ${error.message}`);
    }
  };
  // Update existing assignment
  const handleUpdate = async () => {
    if (!validateForm()) {
      return;
    }
    try {
      const academicYears = getAcademicYearsForProcess();
      const academicYear = academicYears[dialogYear - 1];
      // Get existing assignments for this course+SO+year
      await updateAssignmentById(selectedId, assignmentData);
      // Refresh data
      const assignmentsRes = await getAssignments();
      setAssignments(assignmentsRes.data);
      setOpenDialog(false);
      resetForm();
    } catch (error) {
      console.error("Error updating assignments:", error);
      alert(`Error updating assignments: ${error.message}`);
    }
  };
  // Delete assignment
  const handleDelete = async (id, so) => {
    if (!window.confirm("Are you sure you want to delete this assignment?")) {
      return;
    }
    try {
      await deleteAssignmentById(id);
      setAssignments(prev => {
        const newAssignments = prev.filter(a => a.id !== id);
        return newAssignments;
      });
    } catch (error) {
      console.error("Error deleting assignment:", error);
      alert(`Error deleting assignment: ${error.message}`);
    }
  };
  // Validate form data
  const validateForm = () => {
    if (!assignmentData.offering_id) {
      alert("Please select a course");
      return false;
    }
    if (!assignmentData.so_id) {
      alert("Please select a Student Outcome");
      return false;
    }
    if (!assignmentData.pc_ids || assignmentData.pc_ids.length === 0) {
      alert("Please select at least one Performance Criterion");
      return false;
    }


    // At least one campus should have semester and instructor
    /*
    const hasAtLeastOneCampus = campuses.some(campus => {
      const hasSemester = !!assignmentData[`semester`];
      const hasInstructor = !!assignmentData[`instructor_id_${campus.campus_name}`];
      return hasSemester && hasInstructor;
    });
    if (!hasAtLeastOneCampus) {
      alert("Please fill in at least one campus with semester and instructor");
      return false;
    }*/
    return true;
  };
  // Reset form to initial state
  const resetForm = () => {
    const academicYears = getAcademicYearsForProcess();
    if (!academicYears || academicYears.length === 0) {
      return;
    }
    const academicYear = academicYears[dialogYear - 1];
    if (!academicYear) {
      return;
    }
    const resetData = getEmptyAssignment();
    resetData.year = dialogYear;
    resetData.academic_year = academicYear;
    setAssignmentData(resetData);
    setSelectedId(null);
  };
  // Open add dialog
  const openAddDialog = (so, yearNumber) => {
    if (!isYearEditable(yearNumber)) {
      return;
    }
    setDialogYear(yearNumber);
    const academicYears = getAcademicYearsForProcess();
    if (!academicYears || academicYears.length === 0) {
      return;
    }
    const academicYear = academicYears[yearNumber - 1];
    if (!academicYear) {
      return;
    }
    const semesterOptions = getCurrentSemesterOptions();
    const currentSemester = semesterOptions.find(opt => !opt.disabled)?.value || "";
    const newAssignment = getEmptyAssignment();
    newAssignment.so_id = so.id.toString();
    newAssignment.year = yearNumber;
    newAssignment.academic_year = academicYear;
    newAssignment.semester = currentSemester;


    setAssignmentData(newAssignment);
    setSelectedId(null);
    setOpenDialog(true);
  };
  // Open edit dialog
  const openEditDialog = (assignment, yearNumber) => {
    if (!isYearEditable(yearNumber)) {
      return;
    }
    setDialogYear(yearNumber);


    setSelectedId(assignment.id);
    const academicYears = getAcademicYearsForProcess();
    if (!academicYears || academicYears.length === 0) {
      return;
    }
    const academicYear = academicYears[yearNumber - 1];
    // Combine PC IDs from all campus assignments
    const allPCIds = [];
    /*campuses.forEach(campus => {
      if (assignmentsByCampus[campus.campus_name]?.pc_ids) {
        const pcIds = assignmentsByCampus[campus.campus_name].pc_ids;
        if (Array.isArray(pcIds)) {
          allPCIds.push(...pcIds.map(id => id.toString()));
        }
      }
    });*/
    const uniquePCIds = sortAndFilterPcIds(allPCIds, assignment.so_id);
    // Build assignment data

    const pcIds = Array.isArray(assignment.assignment_pcs) ? assignment.assignment_pcs.map(pc => pc.pc_id.toString()) : [];



    const newAssignmentData = {
      course_id: assignment.course_id?.toString() || "",
      campus_id: assignment.offering?.campus_id?.toString() || "",
      semester: assignment.offering?.semester || "",
      offering_id: assignment.offering_id?.toString() || "",
      so_id: assignment.so_id?.toString() || "",
      year: yearNumber,
      academic_year: assignment.offering?.academic_year || "",
      pc_ids: pcIds || []
    };

    setAssignmentData(newAssignmentData);
    setOpenDialog(true);
  };
  // Get PC codes for display
  const getPCCodes = (pcIds) => {
    if (!pcIds || !Array.isArray(pcIds)) {
      return "";
    }
    const codes = pcIds
      .map((id) => {
        const pc = PCs.find((p) => normalizeId(p.id) === normalizeId(id));
        return pc ? pc.pc_code : "";
      })
      .filter(Boolean)
      .sort(comparePcCodes);
    return codes.join(", ");
  };
  // Loading state
  if (isLoading) {
    return (
      <Box sx={{ width: "100%", textAlign: "center", py: 4 }}>
        <Typography>Loading assignments data...</Typography>
      </Box>
    );
  }
  const academicYears = getAcademicYearsForProcess();
  const currentYearNumber = getCurrentYearNumber();
  // Set default process if not set
  if (!selectedProcess && availableProcesses.length > 0) {
    setSelectedProcess(availableProcesses[0]);
  }


  return (
    <Box sx={{ width: "100%" }}>
      {/* Header Section */}
      <Box className="mb-2 rounded-lg">
        <Box className="">
          <Box className="flex items-center justify-between gap-4">
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>View Assignment Tables</InputLabel>
              <Select
                value={selectedProcess}
                onChange={(e) => {
                  setSelectedProcess(e.target.value);
                }}
                label="View Assignment Tables"
                size="small"
              >
                {availableProcesses.map(process => (
                  <MenuItem key={process} value={process}>
                    {process}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <button className="bg-(--primary-color) px-3 py-2 text-white rounded-lg hover:bg-(--primary-color-hover) transition-colors duration-500 text-sm">
              Send Assignment to Staff
            </button>
          </Box>
        </Box>
      </Box>
      {/* Add/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => {
          setOpenDialog(false);
          resetForm();
        }}
        fullWidth
        maxWidth="md"
        PaperProps={{ sx: { borderRadius: "10px" } }}
      >
        <DialogTitle className="text-(--primary-color)">
          {selectedId ? "Edit Course Assignment" : `Add Course to SO - Year ${dialogYear}`}
        </DialogTitle>
        <DialogContent>
          <Box className="flex flex-col gap-4 pt-4">
            {/* SO Display */}
            <FormControl fullWidth>
              <TextField
                label="Student Outcome"
                value={SOs.find(s => {
                  const sId = typeof s.id === 'string' ? parseInt(s.id) : s.id;
                  const dataSoId = typeof assignmentData.so_id === 'string' ? parseInt(assignmentData.so_id) : assignmentData.so_id;
                  return sId === dataSoId;
                })?.so_code || ""}
                InputProps={{ readOnly: true }}
                variant="filled"
              />
            </FormControl>
            {/* Semester Selection */}
            <FormControl fullWidth>
              <InputLabel id={`semester-label`}>Semester</InputLabel>
              <Select
                labelId={`semester-label`}
                value={assignmentData[`semester`] || ""}
                onChange={(e) => handleFieldChange(`semester`, e.target.value)}
                label={`Semester`}
              >
                <MenuItem value="">Select Semester</MenuItem>
                {getCurrentSemesterOptions().map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {/* Campus Selection */}
            <FormControl fullWidth>
              <InputLabel id="course-select-label">Campus *</InputLabel>
              <Select
                labelId="course-select-label"
                value={assignmentData.campus_id || ""}
                onChange={(e) => handleFieldChange("campus_id", e.target.value)}
                label="Campus *"
                renderValue={(selected) => {
                  if (!selected) {
                    return "";
                  }
                  const campus = campuses.filter(c => c.id == selected)[0];
                  return campus ? campus?.campus_name : "";
                }}
              >
                <MenuItem value="">Select Campus</MenuItem>
                {campuses.map(campus => (
                  <MenuItem key={campus.id} value={campus.id.toString()}>
                    {campus.campus_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {/* Course Selection */}
            <FormControl fullWidth>
              <InputLabel id="course-select-label">Course *</InputLabel>
              <Select
                labelId="course-select-label"
                value={assignmentData.offering_id || ""}
                onChange={(e) => handleFieldChange("offering_id", e.target.value)}
                label="Course *"
                renderValue={(selected) => {
                  if (!selected) {
                    return "";
                  }
                  const course = offerings.filter(off => off.id == selected)[0]?.course;
                  return course ? `${course.course_code}: ${course.course_name}` : "";
                }}
              >
                <MenuItem value="">Select Course</MenuItem>
                {offerings.filter(off => off.semester == assignmentData.semester).filter(off => off.campus_id == assignmentData.campus_id).filter(off => off.course.sos.some(sos => sos.id == assignmentData.so_id)).map(offering => (

                  <MenuItem key={offering.id} value={offering.id.toString()}>
                    {offering.course.course_code}: {offering.course.course_name} / Instructors: {offering.instructors.map(instructor => `${instructor.first_name} ${instructor.last_name}`).join(', ')} / Campus: {offering.campus.campus_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* PC Selection */}
            {assignmentData.so_id && (
              <FormControl fullWidth>
                <InputLabel id="pc-select-label">Performance Criteria *</InputLabel>
                <Select
                  labelId="pc-select-label"
                  multiple
                  value={assignmentData.pc_ids || []}
                  onChange={handlePCChange}
                  input={<OutlinedInput label="Performance Criteria *" />}
                  renderValue={(selected) => {
                    return (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((id) => {
                          const pcIdNum = typeof id === 'string' ? parseInt(id) : id;
                          const pc = PCs.find(p => {
                            const pId = typeof p.id === 'string' ? parseInt(p.id) : p.id;
                            return pId === pcIdNum;
                          });
                          return pc ? (
                            <Chip key={id} label={pc.pc_code} size="small" />
                          ) : null;
                        })}
                      </Box>
                    );
                  }}
                >
                  {getPCsBySO(assignmentData.so_id).map(pc => {
                    return (
                      <MenuItem key={pc.id} value={pc.id.toString()}>
                        {pc.pc_code}
                      </MenuItem>
                    );
                  })}
                </Select>
                <FormHelperText>
                  Select Performance Criteria for {SOs.find(s => {
                    const sId = typeof s.id === 'string' ? parseInt(s.id) : s.id;
                    const dataSoId = typeof assignmentData.so_id === 'string' ? parseInt(assignmentData.so_id) : assignmentData.so_id;
                    return sId === dataSoId;
                  })?.so_code || "Selected SO"}
                </FormHelperText>
              </FormControl>
            )}

          </Box>
        </DialogContent>
        <DialogActions>
          <button
            className="border border-gray-400 p-1 rounded w-16"
            onClick={() => {
              setOpenDialog(false);
              resetForm();
            }}
          >
            Cancel
          </button>
          <button
            onClick={selectedId ? handleUpdate : handleAdd}
            className="bg-(--primary-color) text-white p-1 rounded w-16"
          >
            {selectedId ? "Update" : "Add"}
          </button>
        </DialogActions>
      </Dialog>
      {/* DELETE DIALOG */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDeleteId(null);
        }}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: "10px" } }}
      >
        <DialogTitle className="text-(--primary-color)">
          Confirm Deletion
        </DialogTitle>

        <DialogContent>
          <Box sx={{ mt: 1 }}>
            Are you sure you want to remove this assignment?
            <br />
            This action cannot be undone.
          </Box>
        </DialogContent>

        <DialogActions sx={{ pb: 2, pr: 3 }}>
          <button
            className="border border-gray-400 px-4 py-1 rounded hover:bg-gray-100 transition"
            onClick={() => {
              setDeleteDialogOpen(false);
              setDeleteId(null);
            }}
          >
            Cancel
          </button>

          <button
            className="bg-(--primary-color) text-white px-4 py-1 rounded hover:bg-(--primary-color-hover) transition-colors duration-500"
            onClick={async () => {
              await handleDelete(deleteId);
              setDeleteDialogOpen(false);
              setDeleteId(null);
            }}
          >
            Delete
          </button>
        </DialogActions>
      </Dialog>
      {/* Display all 3 years in sequence */}
      {[1, 2, 3].map(yearNumber => {
        const academicYear = academicYears[yearNumber - 1];
        const isEditable = isYearEditable(yearNumber);
        const groupedAssignments = getGroupedAssignments(yearNumber, academicYear);

        if (!academicYear) {
          return null;
        }
        return (
          <Box key={`year-${yearNumber}`} className="mb-8">
            {/* Year Header */}
            <Box className={`p-3 rounded-lg ${yearNumber === 3 ? 'bg-yellow-50' : isEditable ? 'bg-(--primary-color) text-white' : 'bg-(--secondary-color)'}`}>
              <Box className="flex items-center justify-between">
                <Typography variant="h6" className={yearNumber === 3 ? 'text-yellow-800' : ''}>
                  Year {yearNumber}: {academicYear}
                </Typography>
                {yearNumber === 3 && (
                  <Box className="flex items-center gap-1 text-black">
                    <InsightsIcon fontSize="small" />
                    <Typography variant="body2">Analysis Period</Typography>
                  </Box>
                )}
                {!isCurrentProcess() && yearNumber !== 3 && (
                  <Box className="flex items-center gap-1 text-black">
                    <LockIcon fontSize="small" />
                    <Typography variant="body2">View Only</Typography>
                  </Box>
                )}
                {isCurrentProcess() && !isEditable && yearNumber !== 3 && (
                  <Box className="flex items-center gap-1 text-black">
                    <LockIcon fontSize="small" />
                    <Typography variant="body2">View Only</Typography>
                  </Box>
                )}
                {isEditable && (
                  <Box className="flex items-center gap-1 text-white">
                    <LockOpenIcon fontSize="small" />
                    <Typography variant="body2">Editable</Typography>
                  </Box>
                )}
              </Box>
            </Box>
            {/* Year 3 Analysis Message */}
            {yearNumber === 3 ? (
              <Box className="p-2 text-start rounded bg-white">
                <Typography variant="body2" color="textSecondary">
                  Analyze data collected during the assessment cycle, including data collected from the program's constituencies. Recommend possible changes to the department. Review and refine courses and or the program.
                </Typography>
              </Box>
            ) : (
              /* Years 1-2 Table */
              <Box sx={{ width: '100%' }}>
                <TableContainer>
                  <Table sx={{ width: '100%' }}>
                    <TableHead>
                      <TableRow className="bg-gray-100">
                        <TableCell
                          rowSpan={2}
                          sx={{ width: '20%', borderRight: '1px solid #e0e0e0', p: 1 }}
                        >
                          Outcomes
                        </TableCell>

                        <TableCell
                          rowSpan={2}
                          sx={{ width: '8%', borderRight: '1px solid #e0e0e0', p: 1 }}
                        >
                          Course
                        </TableCell>

                        {/* ✅ Bigger PCs column */}
                        <TableCell
                          rowSpan={2}
                          sx={{ width: '25%', borderRight: '1px solid #e0e0e0', p: 1 }}
                        >
                          PCs
                        </TableCell>
                      </TableRow>

                      <TableRow className="bg-gray-100">
                        <TableCell
                          sx={{
                            width: '12%',
                            borderRight: '1px solid #e0e0e0',
                            p: 1,
                            fontSize: '0.75rem'
                          }}
                        >
                          Campus
                        </TableCell>
                        <TableCell
                          sx={{
                            width: '12%',
                            borderRight: '1px solid #e0e0e0',
                            p: 1,
                            fontSize: '0.75rem'
                          }}
                        >
                          Semester
                        </TableCell>

                        <TableCell
                          sx={{
                            width: '25%',
                            borderRight: '1px solid #e0e0e0',
                            p: 1,
                            fontSize: '0.75rem'
                          }}
                        >
                          Instructor
                        </TableCell>

                        {isEditable && (
                          <TableCell sx={{ width: '10%', p: 1 }}>
                            Actions
                          </TableCell>
                        )}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {getSOsForYear(yearNumber).map((so) => {
                        return (
                          <React.Fragment key={`${yearNumber}-${so.id}`}>
                            {/* SO Header Row */}
                            <TableRow className="bg-gray-200">
                              <TableCell colSpan={isEditable ? (3 + campuses.length * 2 + 1) : (3 + campuses.length * 2)}>
                                <Box className="flex items-center justify-between">
                                  <Typography variant="subtitle1" className="font-semibold" sx={{ fontSize: '0.875rem' }}>
                                    {so.so_code}: {so.description}
                                  </Typography>
                                  {isEditable && (
                                    <button
                                      className="bg-(--primary-color) px-3 py-1 text-white rounded-lg hover:bg-(--primary-color-hover) transition-colors duration-500 text-sm"
                                      onClick={() => openAddDialog(so, yearNumber)}
                                    >
                                      Add Course
                                    </button>
                                  )}
                                </Box>
                              </TableCell>
                            </TableRow>
                            {/* Course Rows */}
                            {assignments.filter(ass => ass.so_id === so.id).filter(ass => ass.offering?.academic_year === academicYear).map((assignment, rowIndex) => {
                              return (
                                <TableRow
                                  key={`${yearNumber}-${assignment.so_id}-${assignment.offering?.course_id || rowIndex}`}
                                  className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}
                                >
                                  {/* Empty SO cell for subsequent rows */}

                                  <TableCell sx={{
                                    borderRight: '1px solid #e0e0e0',
                                    p: 1
                                  }}>
                                    {/* Leave empty, SO is in header row */}
                                  </TableCell>

                                  {/* Course Code */}
                                  <TableCell sx={{
                                    borderRight: '1px solid #e0e0e0',
                                    p: 1
                                  }}>
                                    <Typography variant="body2" className="font-medium" sx={{ fontSize: '0.75rem' }}>
                                      {assignment.offering?.course?.course_code + " - " + assignment.offering?.course?.course_name || ""}
                                    </Typography>
                                  </TableCell>
                                  {/* PCs Assessed */}
                                  <TableCell sx={{
                                    borderRight: '1px solid #e0e0e0',
                                    p: 1
                                  }}>
                                    <Box className="flex flex-wrap gap-0.5">

                                      {assignment.assignment_pcs?.map((pc, idx) => (
                                        pc?.pc ? (
                                          <Chip
                                            key={idx}
                                            label={pc.pc.pc_code}
                                            size="small"
                                            sx={{
                                              fontSize: '0.6rem',
                                              height: '20px',
                                              p: 0.2
                                            }}
                                          />
                                        ) : null
                                      ))}
                                    </Box>
                                  </TableCell>

                                  <React.Fragment >
                                    <TableCell sx={{
                                      borderRight: '1px solid #e0e0e0',
                                      p: 1
                                    }}>

                                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                                        {assignment?.offering.campus.campus_name || ""}
                                      </Typography>
                                    </TableCell>
                                    <TableCell sx={{
                                      borderRight: '1px solid #e0e0e0',
                                      p: 1
                                    }}>

                                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                                        {assignment?.offering.semester || ""}
                                      </Typography>
                                    </TableCell>
                                    <TableCell sx={{
                                      borderRight: '1px solid #e0e0e0',
                                      p: 1
                                    }}>
                                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                                        {assignment?.offering?.instructors?.map(instr => `${instr.first_name} ${instr.last_name}`).join(', ') || ""}
                                      </Typography>
                                    </TableCell>
                                  </React.Fragment>

                                  {/* Actions (only for editable years and current semester) */}
                                  {isEditable && (
                                    <TableCell sx={{ p: 1 }}>
                                      {assignment.offering?.semester === settings?.current_semester && (
                                        <Box className="flex gap-0.5">
                                          <IconButton
                                            size="small"
                                            sx={{ p: 0.5 }}
                                            onClick={() => {
                                              openEditDialog(assignment, yearNumber);
                                            }}
                                            title="Edit assignment"
                                          >
                                            <EditIcon fontSize="small" />
                                          </IconButton>
                                          <IconButton
                                            size="small"
                                            sx={{ p: 0.5 }}
                                            onClick={() => {
                                              setDeleteId(assignment.id);
                                              setDeleteDialogOpen(true);
                                            }}
                                            title="Delete assignment"
                                            color="error"
                                          >
                                            <DeleteIcon fontSize="small" />
                                          </IconButton>
                                        </Box>
                                      )}
                                    </TableCell>
                                  )}
                                </TableRow>
                              );
                            })}
                            {/* Empty state for SO with no courses */}

                            {assignments.filter(ass => ass.so_id === so.id).filter(ass => ass.offering?.academic_year === academicYear).length === 0 && (
                              <TableRow>
                                <TableCell colSpan={isEditable ? (3 + campuses.length * 2 + 1) : (3 + campuses.length * 2)} align="center" className="py-4 bg-white" sx={{ p: 2 }}>
                                  <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                                    No courses assigned
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        );
                      })}
                      {groupedAssignments.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={isEditable ? (3 + campuses.length * 2 + 1) : (3 + campuses.length * 2)} align="center" className="py-8" sx={{ p: 2 }}>
                            <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.875rem' }}>
                              No assignments found
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
};

const Assignment = () => {
  return (
    <div>
      <div className='pb-4 flex flex-col gap-3'>
        <p className='text-(--primary-color) text-3xl font-bold'>Setup & Assignment</p>
        <p className="text-md">Fill the below table to assign forms to staff.
        </p>
      </div>
      <AssignmentTable />
    </div>
  )
}

export default Assignment
