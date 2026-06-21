import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Header from "./components/layout/Header";
import ProjectLayout from "./components/layout/ProjectLayout";
import ToastContainer from "./components/Toast";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import NewProjectWizard from "./pages/NewProjectWizard";
import ProjectOverview from "./pages/ProjectOverview";
import SchemaBuilder from "./pages/SchemaBuilder";
import NewDataType from "./pages/NewDataType";
import TableEditor from "./pages/TableEditor";
import RelationshipBuilder from "./pages/RelationshipBuilder";
import ProjectSettings from "./pages/ProjectSettings";
import EntryList from "./pages/EntryList";
import EntryForm from "./pages/EntryForm";
import CollectionList from "./pages/CollectionList";
import CollectionDetail from "./pages/CollectionDetail";
import BookingResourceList from "./pages/BookingResourceList";
import BookingResourceDetail from "./pages/BookingResourceDetail";
import OfferList from "./pages/OfferList";
import OrderList from "./pages/OrderList";
import OrderDetail from "./pages/OrderDetail";
import ReturnList from "./pages/ReturnList";
import EcommerceAnalytics from "./pages/EcommerceAnalytics";
import RegisterPage from "./pages/RegisterPage";
import UserManagement from "./pages/UserManagement";
import RolesPermissions from "./pages/RolesPermissions";
import NotFoundPage from "./pages/NotFoundPage";
import { getProjects } from "./api/cms";
import { useAuth } from "./context/AuthContext";
import PopularSearchesPage from "./pages/search/PopularSearchesPage";
import SearchLogsPage from "./pages/search/SearchLogsPage";
import SearchProblemsPage from "./pages/search/SearchProblemsPage";
import SearchDebugPage from "./pages/search/SearchDebugPage";
import SearchConfigPage from "./pages/search/SearchConfigPage";
import SearchComparePage from "./pages/search/SearchComparePage";
import SearchAiRerunPage from "./pages/search/SearchAiRerunPage";

function HeaderWithProjects() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [projects, setProjects] = useState([]);

  const match = location.pathname.match(/^\/projects\/([^/]+)/);
  const currentProjectId = match ? match[1] : null;
  const currentProject = currentProjectId
    ? projects.find((p) => p.slug === currentProjectId)
    : null;

  useEffect(() => {
    if (isAuthenticated) {
      getProjects()
        .then((res) => setProjects(res.data?.data || res.data || []))
        .catch(() => {});
    }
  }, [isAuthenticated, location.pathname]);

  if (!isAuthenticated) return null;

  return <Header projects={projects} currentProject={currentProject} />;
}

function AppRoutes() {
  return (
    <>
      <HeaderWithProjects />
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/roles"
          element={
            <ProtectedRoute>
              <RolesPermissions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/new"
          element={
            <ProtectedRoute>
              <NewProjectWizard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:slug/*"
          element={
            <ProtectedRoute>
              <ProjectLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ProjectOverview />} />
          <Route path="schema" element={<SchemaBuilder />} />
          <Route path="schema/new" element={<NewDataType />} />
          <Route path="schema/:typeId" element={<TableEditor />} />
          <Route path="relationships" element={<RelationshipBuilder />} />
          <Route path="entries" element={<EntryList />} />
          <Route path="entries/new" element={<EntryForm />} />
          <Route path="entries/:entrySlug" element={<EntryForm />} />
          <Route path="collections" element={<CollectionList />} />
          <Route
            path="collections/:collectionSlug"
            element={<CollectionDetail />}
          />
          <Route path="booking/resources" element={<BookingResourceList />} />
          <Route
            path="booking/resources/:resourceId"
            element={<BookingResourceDetail />}
          />
          <Route path="commerce/offers" element={<OfferList />} />
          <Route path="commerce/orders" element={<OrderList />} />
          <Route path="commerce/orders/:orderId" element={<OrderDetail />} />
          <Route path="commerce/returns" element={<ReturnList />} />
          <Route path="commerce/analytics" element={<EcommerceAnalytics />} />
          {/* شغل بشارة */}
          <Route path="search/popular" element={<PopularSearchesPage />} />
          <Route path="search/logs" element={<SearchLogsPage />} />
          <Route path="search/problems" element={<SearchProblemsPage />} />
          <Route path="search/debug" element={<SearchDebugPage />} />
          <Route path="search/config" element={<SearchConfigPage />} />
          <Route path="search/compare" element={<SearchComparePage />} />
          <Route path="search/ai-rerun" element={<SearchAiRerunPage />} />
          {/* ********** */}
          <Route path="settings" element={<ProjectSettings />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <ToastContainer />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
