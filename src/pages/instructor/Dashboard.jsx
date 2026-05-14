import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from 'react-router-dom'
import Card1 from "../../components/Card1";
import Card2 from "../../components/Card2";
import { useSettings } from "../../context/SettingsContext";
import { useNotifications } from "../../hooks/useNotifications";
import NotificationItem from "../../components/notification/NotificationItem";
import QuickActions from "../../components/QuickActions";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import { getStaff } from "../../api/staff";
import { getInstructorOfferings } from "../../api/offerings";
import { getCoordinators } from "../../api/coordinator";
import { sendEmail } from "../../api/email";
import { useAuth } from "../../context/AuthContext";


export default function Dashboard() {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const currentSemester = settings?.current_semester;
  const { notifications } = useNotifications(currentSemester);
  const [offeringStats, setOfferingStats] = useState({ total: 0, submitted: 0, inProgress: 0, notStarted: 0 });
  const [contactOpen, setContactOpen] = useState(false);
  const [coordinators, setCoordinators] = useState([]);
  const [selectedCoordinatorId, setSelectedCoordinatorId] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");

  useEffect(() => {
    if (!currentSemester) return;
    getInstructorOfferings(currentSemester).then(res => {
      const offerings = Array.isArray(res.data) ? res.data : [];
      let submitted = 0, inProgress = 0, notStarted = 0;
      offerings.forEach(o => {
        if (o.is_submitted) { submitted++; return; }
        const hasAny = o.assignments?.some(a => (a.instructor_pc_submissions || []).length > 0);
        if (hasAny) inProgress++; else notStarted++;
      });
      setOfferingStats({ total: offerings.length, submitted, inProgress, notStarted });
    }).catch(() => {});
  }, [currentSemester]);

  useEffect(() => {
    const fetchCoordinators = async () => {
      try {
        const res = await getCoordinators();
        setCoordinators(res.data || []);
      } catch (err) {
        console.error(err);
      }
    };
  
    fetchCoordinators();
  }, []);

  const selectedCoordinator = useMemo(
    () => coordinators.find((c) => String(c.id) === String(selectedCoordinatorId)),
    [coordinators, selectedCoordinatorId]
  );

  const handleOpenContact = () => {
    setContactOpen(true);
    setSelectedCoordinatorId("");
    setEmailSubject("");
    setEmailMessage("");
  };

  // const handleSendEmail = () => {
  //   if (!selectedCoordinator || !emailSubject.trim() || !emailMessage.trim()) {
  //     return;
  //   }

  //   // Placeholder until backend email endpoint is wired.
  //   alert(`Email sent to ${selectedCoordinator.email}`);
  //   setContactOpen(false);
  // };
  const handleSendEmail = async () => {
    try {
      if (!selectedCoordinator || !emailSubject.trim() || !emailMessage.trim()) {
        return;
      }
  
      await sendEmail({
        email: selectedCoordinator.email,
        subject: emailSubject,
        message: emailMessage,
        from_email: auth.user.email,
        from_name: `${auth.user.first_name} ${auth.user.last_name}`,
      });
  
      alert(`Email sent to ${selectedCoordinator.email}`);
      setContactOpen(false);
    } catch (error) {
      console.error(error);
      alert("Failed to send email");
    }
  };

  return (
    <div>
      {/* HEADER */}
      <div className="pb-4 flex flex-col gap-3">
        <p className="text-(--primary-color) text-3xl font-bold">
          Dashboard
        </p>
        <p className="text-md">
          Welcome back! Manage your assigned forms and view your progress.
        </p>
      </div>

      {/* TOP 4 CARDS */}
      <div className="w-full flex flex-wrap justify-between pt-4 gap-2">
        <Card1
          text1="Assigned Forms"
          text2={offeringStats.total}
          text1Color="text-white"
          text2Color="text-white"
          iconColor="text-white"
          icon="fa-solid fa-file"
          bgColor="bg-[var(--primary-color)]"
          shadow={true}
        />

        <Card1
          text1="Submitted"
          text2={offeringStats.submitted}
          icon="fa-solid fa-check"
        />

        <Card1
          text1="In Progress"
          text2={offeringStats.inProgress}
          icon="fa-solid fa-clock"
        />

        <Card1
          text1="Not Started"
          text2={offeringStats.notStarted}
          icon="fa-solid fa-hourglass"
        />
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 py-4">
        <Card2
          title="Help"
          description="Get help with the system."
          iconClass="fa-solid fa-info"
          primaryBtnText="View Steps"
          onClick={() => navigate("/instructor/help")}
        />
        <Card2
          title="Forms"
          description="Manage your assigned forms."
          iconClass="fa-solid fa-file"
          primaryBtnText="View Forms"
          onClick={() => navigate("/instructor/forms")}
        />

        <Card2
          title="Old Forms"
          description="View your old forms."
          iconClass="fa-solid fa-history"
          primaryBtnText="View Old Forms"
          onClick={() => navigate("/instructor/forms#old-forms")}
        />
        <Card2
          title="Have Questions?"
          description="Get in touch with your coordinator."
          iconClass="fa-solid fa-chart-line"
          primaryBtnText="Contact"
          onClick={handleOpenContact}
        />
      </div>
      <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        <div className="lg:col-span-2 bg-white rounded-lg p-5 h-[360px] overflow-y-auto">
          <div className="flex justify-between items-center">
            <p className="text-(--primary-color) font-bold text-lg mb-4">
              Most Recent Activity
            </p>

            <button onClick={() => navigate("/instructor/notifications")}
              className="cursor-pointer soft-hover bg-white border p-2 border-(--primary-color) text-(--primary-color) rounded-full transition-colors duration-500 text-sm">View All</button>


          </div>

          {[...notifications]
            .reverse()
            .slice(0, 5)
            .map((n) => (
              <NotificationItem key={n.id} notification={n} variant="compact" />
            ))}
        </div>

        <div className="lg:col-span-1 bg-white rounded-lg p-5 h-[360px] overflow-y-auto">
          <div className="h-full">
            <QuickActions />
          </div>
        </div>
      </div>

      <Dialog
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: "10px" } }}
      >
        <DialogTitle className="text-(--primary-color)">Send Email</DialogTitle>
        <DialogContent className="flex flex-col gap-3 pt-3">
          <TextField
            select
            fullWidth
            label="Coordinator"
            value={selectedCoordinatorId}
            onChange={(e) => setSelectedCoordinatorId(e.target.value)}
            sx={{ mt: 1 }} 

          >
            {coordinators.map((coordinator) => (
              <MenuItem key={coordinator.id} value={coordinator.id}>
                {coordinator.first_name} {coordinator.last_name} ({coordinator.email})
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            label="Subject"
            value={emailSubject}
            onChange={(e) => setEmailSubject(e.target.value)}
          />

          <TextField
            fullWidth
            multiline
            rows={4}
            label="Message"
            value={emailMessage}
            onChange={(e) => setEmailMessage(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <button
            onClick={() => setContactOpen(false)}
            className="border border-gray-400 p-2 rounded w-20 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSendEmail}
            disabled={!selectedCoordinatorId || !emailSubject.trim() || !emailMessage.trim()}
            className="bg-(--primary-color) text-white p-2 rounded w-20 cursor-pointer disabled:opacity-60"
          >
            Send
          </button>
        </DialogActions>
      </Dialog>
    </div>
  );
}


