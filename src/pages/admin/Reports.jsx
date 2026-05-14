import { useEffect, useState, useCallback } from 'react'
import OutcomesGraph from '../../components/admin/OutcomesGraph'
import Card1 from '../../components/Card1'
import { createReport, downloadReport, getReportStats, getReports, viewReport } from '../../api/reports'
import CustomSnackbar from '../../components/CustomSnackbar'
import { showSnackbar } from '../../utils/snackbar'

const BadPerformanceCard = ({ items }) => (
  <div className="bg-white rounded-lg p-6 shadow-sm h-[340px] md:h-[380px] xl:h-[420px] flex flex-col">
    <div className="flex items-center gap-2 mb-4">
      <i className="fa-solid fa-circle-exclamation text-(--primary-color) text-xl"></i>
      <h3 className="text-lg font-semibold">Courses Below Expectations</h3>
    </div>
    <div className="space-y-3 overflow-y-auto flex-1">
      {items.length === 0 ? (
        <p className="text-sm text-gray-400">No courses below expectations.</p>
      ) : items.map((c, i) => (
        <div key={i} className="bg-red-100 border border-gray-300 rounded-md px-4 py-3">
          <div className="flex items-center justify-between mb-1.5">
            <div>
              <span className="font-semibold text-sm">{c.course_code}</span>
              <span className="text-xs ml-2">{c.so_code} - {c.pc_code}</span>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full">
              {c.percentage}%
            </span>
          </div>
          {c.comment && (
            <p className="text-xs">
              <span className="font-medium">Comment:</span> {c.comment}
            </p>
          )}
        </div>
      ))}
    </div>
  </div>
)

const Reports = () => {
  const [stats, setStats] = useState(null)
  const [selectedYear, setSelectedYear] = useState("")
  const [reportData, setReportData] = useState([])
  const [generating, setGenerating] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" })

  const loadStats = useCallback(async () => {
    try {
      const res = await getReportStats()
      setStats(res.data)
    } catch (err) {
      console.error(err)
    }
  }, [])

  const loadReports = useCallback(async () => {
    try {
      const res = await getReports()
      const sorted = Array.isArray(res.data)
        ? [...res.data].sort((a, b) => new Date(b.generated_at) - new Date(a.generated_at))
        : []
      setReportData(sorted)
    } catch (err) {
      console.error(err)
    }
  }, [])

  useEffect(() => {
    loadStats()
    loadReports()
  }, [loadStats, loadReports])

  const handleGenerate = async () => {
    if (!selectedYear) {
      showSnackbar(setSnackbar, "Please select an academic year.", "error")
      return
    }
    setGenerating(true)
    try {
      const res = await createReport({ year_range: selectedYear })
      setReportData((prev) => [res.data, ...prev])
      showSnackbar(setSnackbar, "Report generated successfully.", "success")
    } catch (err) {
      console.error(err)
      showSnackbar(setSnackbar, "Failed to generate report.", "error")
    } finally {
      setGenerating(false)
    }
  }

  const handleDownload = async (id, name) => {
    try {
      const res = await downloadReport(id)
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `${name}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      showSnackbar(setSnackbar, "Failed to download report.", "error")
    }
  }

  const handleView = async (id) => {
    try {
      const res = await viewReport(id)
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      window.open(url, '_blank')
    } catch (err) {
      showSnackbar(setSnackbar, "Failed to open report.", "error")
    }
  }

  function ReportRow({ item }) {
    const formattedDate = new Date(item.generated_at).toLocaleString("en-US", {
      month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
    })
    return (
      <div className="flex justify-between border border-gray-300 rounded-lg p-2 mb-2 soft-hover">
        <div className="flex flex-col">
          <p className="text-sm font-medium">{item.name}</p>
          <p className="text-xs text-gray-500">Generated on: {formattedDate}</p>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => handleDownload(item.id, item.name)}
            className="text-sm bg-(--primary-color) text-white rounded-lg px-3 py-1 hover:bg-(--primary-color-hover) hover:transition-colors hover:duration-500"
          >
            Download
          </button>
          <button
            onClick={() => handleView(item.id)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1 soft-hover"
          >
            View PDF
          </button>
        </div>
      </div>
    )
  }

  const soByYear = stats?.so_by_year ?? { labels: [], so_data: {} }

  return (
    <div>
      <div className="pb-4 flex flex-col gap-3">
        <p className="text-(--primary-color) text-3xl font-bold">Reports and Statistics</p>
        <p className="text-md">Generate and view course assessment reports. View courses' statistics.</p>
      </div>

      {/* Stats Cards */}
      <div className="w-full flex flex-wrap justify-between py-4 gap-2">
        <Card1
          text1="Total Courses"
          text2={(stats?.total_courses ?? "-").toString()}
          text1Color="text-white"
          text2Color="text-white"
          iconColor="text-white"
          icon="fa-solid fa-book"
          bgColor="bg-(--primary-color)"
          shadow={true}
        />
        <Card1
          text1="Average Score"
          text2={stats ? `${stats.average_score}%` : "-"}
          icon="fa-solid fa-percent"
        />
        <Card1
          text1="Best Performing Course"
          text2={stats?.best_course ? `${stats.best_course.course_code} - ${stats.best_course.percentage}%` : "-"}
          icon="fa-solid fa-trophy"
        />
        <Card1
          text1="Least Performing Course"
          text2={stats?.worst_course ? `${stats.worst_course.course_code} - ${stats.worst_course.percentage}%` : "-"}
          icon="fa-solid fa-face-frown"
        />
      </div>

      {/* Generate + History */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-5 lg:h-[310px]">
        <div className="bg-white rounded p-4 col-span-2 flex flex-col">
          <p className="text-lg font-semibold text-(--primary-color)">Generate a report</p>
          <p className="text-sm text-gray-500">Generate a PDF report for a selected academic year.</p>

          <div className="my-6 flex flex-col gap-6 flex-1">
            <div>
              <label className="block mb-1">Academic Year:</label>
              <select
                className="border rounded p-1 w-full"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                <option value="">Select academic year</option>
                {(stats?.academic_years ?? []).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            className="bg-(--primary-color) text-white hover:bg-(--primary-color-hover) hover:transition-colors hover:duration-500 rounded p-2 w-full mt-auto disabled:opacity-60"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? "Generating..." : "Generate"}
          </button>
        </div>

        <div className="bg-white rounded-lg p-5 overflow-y-auto col-span-3 lg:h-[310px]">
          <p className="text-lg font-semibold text-(--primary-color) mb-4">Report History</p>
          {reportData.length === 0 ? (
            <p className="text-sm text-gray-400">No reports generated yet.</p>
          ) : reportData.map((item) => <ReportRow key={item.id} item={item} />)}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 my-4">
        <OutcomesGraph soByYear={soByYear} />
        <BadPerformanceCard items={stats?.below_expectations ?? []} />
      </div>

      <CustomSnackbar
        open={snackbar.open}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        severity={snackbar.severity}
      />
    </div>
  )
}

export default Reports
