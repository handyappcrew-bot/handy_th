import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { NavToastProvider } from "@/hooks/use-nav-toast";
import Test from "@/pages/Test";

import ScrollToTop from "@/utils/scrollToTop"

// 전역 페이지 로딩 fallback
const PageLoader = () => (
  <div style={{
    position: 'fixed', inset: 0, zIndex: 10000,
    backgroundColor: 'rgba(255,255,255,0.85)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    backdropFilter: 'blur(1.5px)',
  }}>
    <div style={{ display: 'flex', gap: '9px', alignItems: 'center' }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{
          width: '10px', height: '10px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #4261FF, #6b8cff)',
          animation: `navDotBounce 0.72s ease-in-out ${i * 0.12}s infinite`,
        }} />
      ))}
    </div>
    <style>{`
      @keyframes navDotBounce {
        0%, 80%, 100% { transform: scale(0.6) translateY(0); opacity: 0.3; }
        40% { transform: scale(1.1) translateY(-4px); opacity: 1; }
      }
    `}</style>
  </div>
);

import NotFound from "@/pages/NotFound";
import Login from "@/pages/Login";
import AuthGuard from "@/components/AuthGuard";

// lazy 로딩 페이지들
const Signup = lazy(() => import("@/pages/signup/Signup"));
const CodeVerifyPage = lazy(() => import("@/pages/signup/CodeVerify"));
const PasswordPage = lazy(() => import("@/pages/signup/PasswordPage"));
const ProfileInfoPage = lazy(() => import("@/pages/signup/ProfileInfoPage"));
const ProfilePhotoPage = lazy(() => import("@/pages/signup/ProfilePhotoPage"));
const SignupCompletePage = lazy(() => import("@/pages/signup/SignupCompletePage"));

const PublicIndex = lazy(() => import("@/pages/Index"));
const MemberTypePage = lazy(() => import("@/pages/onboarding/MemberTypePage"));
const EmployeeHome = lazy(() => import("@/pages/employee/Index"));
const OwnerHome = lazy(() => import("./pages/owner/Index"));

const EmployeeBusinessVerify = lazy(() => import("@/pages/employee/StoreRegistration"));
const OwnerBusinessVerify = lazy(() => import("@/pages/owner/BusinessVerify"));
const OwnerBusinessVerifyUpload = lazy(() => import("@/pages/owner/BusinessVerifyUpload"));

const BoardList = lazy(() => import("./pages/BoardList"));
const BoardDetail = lazy(() => import("./pages/BoardDetail"));
const BoardWrite = lazy(() => import("./pages/BoardWrite"));

const Announcements = lazy(() => import("./pages/Announcements"));
const AnnouncementDetail = lazy(() => import("./pages/AnnouncementDetail"));
const EmployeeAttendanceManagement = lazy(() => import("./pages/employee/AttendanceManagement"));
const AttendanceRecordEdit = lazy(() => import("./pages/AttendanceRecordEdit"));
const EmployeeSalaryManagement = lazy(() => import("./pages/employee/SalaryManagement"));
const Schedule = lazy(() => import("./pages/employee/Schedule"));
const ScheduleChangeRequest = lazy(() => import("./pages/employee/ScheduleChangeRequest"));
const ClosingReport = lazy(() => import("./pages/employee/ClosingReport"));
const PayStubDetail = lazy(() => import("./pages/employee/PayStubDetail"));
const Feedback = lazy(() => import("./pages/Feedback"));
const FeedbackDetail = lazy(() => import("./pages/FeedbackDetail"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Notifications = lazy(() => import("./pages/Notifications"));
const NotificationScheduleChanged = lazy(() => import("./pages/NotificationScheduleChanged"));
const NotificationScheduleAdded = lazy(() => import("./pages/NotificationScheduleAdded"));
const EmployeeProfile = lazy(() => import("./pages/employee/Profile"));
const EmployeeProfileEdit = lazy(() => import("./pages/employee/ProfileEdit"));
const PasswordChange = lazy(() => import("./pages/PasswordChange"));
const VacationRequest = lazy(() => import("./pages/VacationRequest"));
const Withdrawal = lazy(() => import("./pages/Withdrawal"));
const StoreInfo = lazy(() => import("./pages/owner/StoreInfo"));
const StoreInfoEdit = lazy(() => import("./pages/owner/StoreInfoEdit"));
const StoreHours = lazy(() => import("./pages/owner/StoreHours"));
const StoreHoursParts = lazy(() => import("./pages/owner/StoreHoursParts"));
const AttendanceStandard = lazy(() => import("./pages/owner/AttendanceStandard"));
const StoreDelete = lazy(() => import("./pages/owner/StoreDelete"));
import BottomNav from "./components/home/employee/BottomNav";
import BottomNavBar from "./components/home/owner/BottomNavBar";
const StaffManagement = lazy(() => import("./pages/owner/StaffManagement"));
const StaffDetail = lazy(() => import("./pages/owner/StaffDetail"));
const StaffEdit = lazy(() => import("./pages/owner/StaffEdit"));
const OwnerSalaryManagement = lazy(() => import("./pages/owner/SalaryManagement"));
const OwnerSalaryDetail = lazy(() => import("./pages/owner/SalaryDetail"));
const OwnerSalaryDetailEdit = lazy(() => import("./pages/owner/SalaryDetailEdit"));
const PayslipDetail = lazy(() => import("./pages/owner/PayslipDetail"));
const PayslipEdit = lazy(() => import("./pages/owner/PayslipEdit"));
const PayslipPublish = lazy(() => import("./pages/owner/PayslipPublish"));
const SalesManagement = lazy(() => import("./pages/owner/SalesManagement"));
const SalesDailyDetail = lazy(() => import("./pages/owner/SalesDailyDetail"));
const SalesDailyEdit = lazy(() => import("./pages/owner/SalesDailyEdit"));
const SalesMonthlyDetail = lazy(() => import("./pages/owner/SalesMonthlyDetail"));
const OwnerProfile = lazy(() => import("./pages/owner/Profile"));
const OwnerProfileEdit = lazy(() => import("./pages/owner/ProfileEdit"));
const AccountWithdrawal = lazy(() => import("./pages/owner/AccountWithdrawal"));
const OwnerAttendanceManagement = lazy(() => import("./pages/owner/AttendanceManagement"));
const OwnerAttendanceEdit = lazy(() => import("./pages/owner/AttendanceEdit"));
const OwnerAttendanceDetail = lazy(() => import("./pages/owner/AttendanceDetail"));
const OwnerScheduleManagement = lazy(() => import("./pages/owner/ScheduleManagement"));
const SelectRole = lazy(() => import("./pages/SelectRole"));

const queryClient = new QueryClient();

const OWNER_NAV_ROOTS = ["/owner/home", "/owner/staff", "/owner/salary", "/owner/sales", "/owner/store", "/owner/board", "/owner/schedule", "/owner/attendance", "/board", "/owner/profile"];
const EMPLOYEE_NAV_ROOTS = ["/employee/home", "/attendance", "/schedule", "/board", "/employee/salary", "/employee/profile"];
const FADE_ROOTS = [...OWNER_NAV_ROOTS, ...EMPLOYEE_NAV_ROOTS];

const isFadeRoot = (path: string) => FADE_ROOTS.some((p) => path === p);
const showBottomNav = (path: string) => FADE_ROOTS.some((p) => path === p);

const getEmployeeActiveTab = (pathname: string): "home" | "salary" | "attendance" | "board" | "myinfo" => {
  if (pathname === "/employee/home") return "home";
  if (pathname === "/employee/salary") return "salary";
  if (pathname === "/attendance") return "attendance";
  if (pathname === "/board") return "board";
  if (pathname === "/employee/profile") return "myinfo";
  return "home";
};

const GlobalBottomNav = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState(
    () => localStorage.getItem("currentRole") ?? "employee"
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setOverlayOpen(document.body.hasAttribute('data-overlay-open'));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-overlay-open'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setCurrentRole(localStorage.getItem("currentRole") ?? "employee");
  }, [pathname]);

  if (!showBottomNav(pathname) || overlayOpen) return null;

  const isOwner = currentRole === "owner";
  if (isOwner) return <BottomNavBar />;

  const activeTab = getEmployeeActiveTab(pathname);
  return (
    <BottomNav
      activeTab={activeTab}
      onTabChange={(tab) => {
        if (tab === "home") navigate("/employee/home");
        else if (tab === "salary") navigate("/employee/salary");
        else if (tab === "attendance") navigate("/attendance");
        else if (tab === "board") navigate("/board");
        else if (tab === "myinfo") navigate("/employee/profile");
      }}
    />
  );
};

const AnimatedRoutes = () => {
  const location = useLocation();
  const prevPath = useRef(location.pathname);
  const currentPath = location.pathname;
  const from = prevPath.current;

  useEffect(() => { prevPath.current = currentPath; });

  const getAnimClass = () => {
    if (isFadeRoot(currentPath) && isFadeRoot(from)) return "page-fade-enter";
    return "page-enter";
  };

  const [animDone, setAnimDone] = useState(false);
  useEffect(() => {
    setAnimDone(false);
    const t = setTimeout(() => setAnimDone(true), 290);
    return () => clearTimeout(t);
  }, [location.key]);

  return (
    <>
      <div key={location.key} className={`${getAnimClass()}${animDone ? " page-enter-done" : ""}`}>
      <Routes location={location}>
        <Route path="/test" element={<Test />} />

        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify" element={<CodeVerifyPage />} />
        <Route path="/password" element={<PasswordPage />} />
        <Route path="/profile-info" element={<ProfileInfoPage />} />
        <Route path="/profile-photo" element={<ProfilePhotoPage />} />
        <Route path="/signup-complete" element={<SignupCompletePage />} />
        <Route path="/onboarding/member-type" element={<MemberTypePage />} />
        <Route path="/select-role" element={<SelectRole />} />

        {/* ===== 공통 기능 ===== */}
        <Route path="/board" element={<AuthGuard><BoardList /></AuthGuard>} />
        <Route path="/board/write" element={<AuthGuard><BoardWrite /></AuthGuard>} />
        <Route path="/board/:id" element={<AuthGuard><BoardDetail /></AuthGuard>} />
        <Route path="/feedback" element={<AuthGuard><Feedback /></AuthGuard>} />
        <Route path="/feedback/:id" element={<AuthGuard><FeedbackDetail /></AuthGuard>} />
        <Route path="/announcements" element={<AuthGuard><Announcements /></AuthGuard>} />
        <Route path="/announcements/:id" element={<AuthGuard><AnnouncementDetail /></AuthGuard>} />
        <Route path="/withdrawal" element={<AuthGuard><Withdrawal /></AuthGuard>} />
        <Route path="/faq" element={<AuthGuard><FAQ /></AuthGuard>} />
        <Route path="/notifications" element={<AuthGuard><Notifications /></AuthGuard>} />
        <Route path="/notifications/schedule-changed/:id" element={<AuthGuard><NotificationScheduleChanged /></AuthGuard>} />
        <Route path="/notifications/schedule-added/:id" element={<AuthGuard><NotificationScheduleAdded /></AuthGuard>} />
        <Route path="/profile/edit/password" element={<AuthGuard><PasswordChange /></AuthGuard>} />
        <Route path="/schedule" element={<AuthGuard><Schedule /></AuthGuard>} />
        <Route path="/schedule/change-request" element={<ScheduleChangeRequest />} />
        <Route path="/schedule/vacation-request" element={<VacationRequest />} />
        <Route path="/closing-report" element={<AuthGuard><ClosingReport /></AuthGuard>} />

        {/* ===== 사장유형 ===== */}
        <Route path="/owner/business-verify" element={<AuthGuard><OwnerBusinessVerify /></AuthGuard>} />
        <Route path="/owner/business/upload" element={<AuthGuard><OwnerBusinessVerifyUpload /></AuthGuard>} />
        <Route path="/owner/home" element={<OwnerHome />} />
        <Route path="/owner/store" element={<StoreInfo />} />
        <Route path="/owner/store/edit" element={<StoreInfoEdit />} />
        <Route path="/owner/store/hours" element={<StoreHours />} />
        <Route path="/owner/store/hours/parts" element={<StoreHoursParts />} />
        <Route path="/owner/store/attendance-standard" element={<AttendanceStandard />} />
        <Route path="/owner/schedule" element={<OwnerScheduleManagement />} />
        <Route path="/owner/attendance" element={<OwnerAttendanceManagement />} />
        <Route path="/owner/attendance/edit" element={<OwnerAttendanceEdit />} />
        <Route path="/owner/attendance/:id" element={<OwnerAttendanceDetail />} />
        <Route path="/owner/store/delete" element={<StoreDelete />} />
        <Route path="/owner/staff" element={<StaffManagement />} />
        <Route path="/owner/staff/:id" element={<StaffDetail />} />
        <Route path="/owner/staff/:id/edit" element={<StaffEdit />} />
        <Route path="/owner/salary" element={<OwnerSalaryManagement />} />
        <Route path="/owner/salary/detail" element={<OwnerSalaryDetail />} />
        <Route path="/owner/salary/detail/edit" element={<OwnerSalaryDetailEdit />} />
        <Route path="/owner/salary/payslip" element={<PayslipDetail />} />
        <Route path="/owner/salary/payslip/edit" element={<PayslipEdit />} />
        <Route path="/owner/salary/payslip/publish" element={<PayslipPublish />} />
        <Route path="/owner/sales" element={<SalesManagement />} />
        <Route path="/owner/sales/daily" element={<SalesDailyDetail />} />
        <Route path="/owner/sales/daily-edit" element={<SalesDailyEdit />} />
        <Route path="/owner/sales/monthly" element={<SalesMonthlyDetail />} />
        <Route path="/owner/profile" element={<OwnerProfile />} />
        <Route path="/owner/profile/edit" element={<OwnerProfileEdit />} />
        <Route path="/owner/account/withdrawal" element={<AccountWithdrawal />} />

        {/* ===== 직원유형 ===== */}
        <Route path="/employee/business-verify" element={<AuthGuard><EmployeeBusinessVerify /></AuthGuard>} />
        <Route path="/employee/home" element={<AuthGuard><EmployeeHome /></AuthGuard>} />
        <Route path="/employee/salary" element={<AuthGuard><EmployeeSalaryManagement /></AuthGuard>} />
        <Route path="/employee/salary/pay-stub/:id" element={<AuthGuard><PayStubDetail /></AuthGuard>} />
        <Route path="/attendance" element={<AuthGuard><EmployeeAttendanceManagement /></AuthGuard>} />
        <Route path="/attendance/record-edit" element={<AuthGuard><AttendanceRecordEdit /></AuthGuard>} />
        <Route path="/employee/profile" element={<AuthGuard><EmployeeProfile /></AuthGuard>} />
        <Route path="/employee/profile/edit" element={<AuthGuard><EmployeeProfileEdit /></AuthGuard>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
        <NavToastProvider>
          <ScrollToTop />
          <div className="max-w-lg mx-auto bg-background min-h-screen relative app-root">
            <Suspense fallback={<PageLoader />}>
            <AnimatedRoutes />
          </Suspense>
          </div>
          <GlobalBottomNav />
        </NavToastProvider>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
