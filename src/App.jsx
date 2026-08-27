// import { useState, useEffect } from "react";
import { useState, useEffect, lazy } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useParams,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import HyperCoreRoute from "./components/HyperCoreRoute";
import TenantRoute from "./components/TenantRoute";
import Header from "./components/layout/Header";
import ProjectLayout from "./components/layout/ProjectLayout";
import PlatformLayout from "./components/layout/PlatformLayout";
import ToastContainer from "./components/Toast";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import NewProjectWizard from "./pages/NewProjectWizard";
import ClinicSetupPage from "./pages/ClinicSetupPage";
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
import OfferDetail from "./pages/OfferDetail";
import ApiDocs from "./pages/ApiDocs";
import OrderList from "./pages/OrderList";
import OrderDetail from "./pages/OrderDetail";
import ReturnList from "./pages/ReturnList";
import EcommerceAnalytics from "./pages/EcommerceAnalytics";
import AnalyticsDashboard from "./pages/Analyticsdashboard";
import AiConversationList from "./pages/AiConversationList";
import AiChat from "./pages/AiChat";
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
import SearchAiRerunPage from "./pages/search/SearchAiRerunPage";
import PlatformOverview from "./pages/platform/PlatformOverview";
import AllProjectsPage from "./pages/platform/AllProjectsPage";
import SystemHealthPage from "./pages/platform/SystemHealthPage";
import PlatformLogsPage from "./pages/platform/PlatformLogsPage";
import AuditTrailPage from "./pages/platform/AuditTrailPage";
import PlansPage from "./pages/subscriptions/PlansPage";
import SubscribersPage from "./pages/subscriptions/SubscribersPage";
import FeatureRulesPage from "./pages/subscriptions/FeatureRulesPage";
import ContentAccessPage from "./pages/subscriptions/ContentAccessPage";
import DocsLayout from "./pages/docs/DocsLayout";
import DocsComingSoon from "./components/docs/DocsComingSoon";
import { getFlatDocsLinks, DOCS_READY_PATHS } from "./pages/docs/docsNav";

// Redirect /ai-conversations/:id → /ai-chat/:id so old links still work.
function RedirectToChat() {
  const { id } = useParams();
  return <Navigate to={`/ai-chat/${id}`} replace />;
}

// "/" lands on whichever dashboard belongs to this account. Hard-coding
// /dashboard here sent the platform operator through a second bounce, since
// TenantRoute turns them away from it.
function HomeRedirect() {
  const { loading, isAuthenticated, homePath } = useAuth();

  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <Navigate to={homePath} replace />;
}

// Each docs content page is its own chunk, loaded only when the person
// actually navigates to it (see DocsLayout's <Suspense>).
const IntroductionPage = lazy(() => import("./pages/docs/IntroductionPage"));
const ArchitecturePage = lazy(() => import("./pages/docs/ArchitecturePage"));
const SetupPage = lazy(() => import("./pages/docs/SetupPage"));
const CmsOverviewPage = lazy(() => import("./pages/docs/cms/CmsOverviewPage"));
const CmsArchitecturePage = lazy(
  () => import("./pages/docs/cms/CmsArchitecturePage"),
);
const CmsDatabasePage = lazy(() => import("./pages/docs/cms/CmsDatabasePage"));
const CmsProjectsPage = lazy(() => import("./pages/docs/cms/CmsProjectsPage"));
const CmsDataTypesPage = lazy(
  () => import("./pages/docs/cms/CmsDataTypesPage"),
);
const CmsFieldsPage = lazy(() => import("./pages/docs/cms/CmsFieldsPage"));
const CmsFieldTypesPage = lazy(
  () => import("./pages/docs/cms/CmsFieldTypesPage"),
);
const CmsEntriesPage = lazy(() => import("./pages/docs/cms/CmsEntriesPage"));
const CmsStatesPage = lazy(() => import("./pages/docs/cms/CmsStatesPage"));
const CmsVersionsPage = lazy(() => import("./pages/docs/cms/CmsVersionsPage"));
const CmsRelationsPage = lazy(
  () => import("./pages/docs/cms/CmsRelationsPage"),
);
const CmsCollectionsPage = lazy(
  () => import("./pages/docs/cms/CmsCollectionsPage"),
);
const CmsRatingsPage = lazy(() => import("./pages/docs/cms/CmsRatingsPage"));
const CmsAnalyticsPage = lazy(
  () => import("./pages/docs/cms/CmsAnalyticsPage"),
);
const CmsSubscriptionsPage = lazy(
  () => import("./pages/docs/cms/CmsSubscriptionsPage"),
);
const CmsPaymentsPage = lazy(() => import("./pages/docs/cms/CmsPaymentsPage"));
const CmsAiPage = lazy(() => import("./pages/docs/cms/CmsAiPage"));
const CmsSearchPage = lazy(() => import("./pages/docs/cms/CmsSearchPage"));
const CmsStockPage = lazy(() => import("./pages/docs/cms/CmsStockPage"));
const BookingOverviewPage = lazy(
  () => import("./pages/docs/booking/BookingOverviewPage"),
);
const BookingArchitecturePage = lazy(
  () => import("./pages/docs/booking/BookingArchitecturePage"),
);
const BookingDatabasePage = lazy(
  () => import("./pages/docs/booking/BookingDatabasePage"),
);
const BookingResourcesPage = lazy(
  () => import("./pages/docs/booking/BookingResourcesPage"),
);
const BookingAvailabilityPage = lazy(
  () => import("./pages/docs/booking/BookingAvailabilityPage"),
);
const BookingPoliciesPage = lazy(
  () => import("./pages/docs/booking/BookingPoliciesPage"),
);
const BookingBookingsPage = lazy(
  () => import("./pages/docs/booking/BookingBookingsPage"),
);
const BookingPaymentsPage = lazy(
  () => import("./pages/docs/booking/BookingPaymentsPage"),
);
const BookingEventsPage = lazy(
  () => import("./pages/docs/booking/BookingEventsPage"),
);
const BookingAnalyticsDocsPage = lazy(
  () => import("./pages/docs/booking/BookingAnalyticsPage"),
);
const BookingReliabilityPage = lazy(
  () => import("./pages/docs/booking/BookingReliabilityPage"),
);
const EcomOverviewPage = lazy(
  () => import("./pages/docs/ecommerce/EcomOverviewPage"),
);
const EcomArchitecturePage = lazy(
  () => import("./pages/docs/ecommerce/EcomArchitecturePage"),
);
const EcomDatabasePage = lazy(
  () => import("./pages/docs/ecommerce/EcomDatabasePage"),
);
const EcomBusinessLogicPage = lazy(
  () => import("./pages/docs/ecommerce/EcomBusinessLogicPage"),
);
const EcommerceProductsPage = lazy(
  () => import("./pages/docs/ecommerce/EcommerceProductsPage"),
);
const EcommercePricingPage = lazy(
  () => import("./pages/docs/ecommerce/EcommercePricingPage"),
);
const EcommerceCartPage = lazy(
  () => import("./pages/docs/ecommerce/EcommerceCartPage"),
);
const EcommerceCheckoutPage = lazy(
  () => import("./pages/docs/ecommerce/EcommerceCheckoutPage"),
);
const EcommerceOrdersPage = lazy(
  () => import("./pages/docs/ecommerce/EcommerceOrdersPage"),
);
const EcommerceOffersPage = lazy(
  () => import("./pages/docs/ecommerce/EcommerceOffersPage"),
);
const EcommerceWishlistPage = lazy(
  () => import("./pages/docs/ecommerce/EcommerceWishlistPage"),
);
const EcommerceReturnsPage = lazy(() => import("./pages/docs/ecommerce/EcommerceReturnsPage"));
const EcommercePaymentsPage = lazy(() => import("./pages/docs/ecommerce/EcommercePaymentsPage"));
const EcommerceAnalyticsPage = lazy(() => import("./pages/docs/ecommerce/EcommerceAnalyticsPage"));

function HeaderWithProjects() {
  const location = useLocation();
  const { isAuthenticated, isHyperCore } = useAuth();
  const [projects, setProjects] = useState([]);

  const match = location.pathname.match(/^\/projects\/([^/]+)/);
  const currentProjectId = match ? match[1] : null;
  const currentProject = currentProjectId
    ? projects.find((p) => p.slug === currentProjectId)
    : null;

  useEffect(() => {
    // The operator's header shows no project selector, so this list would go
    // unused — and for that role /api/projects returns every project on the
    // platform, which is a pointless payload to pull on each navigation.
    if (isAuthenticated && !isHyperCore) {
      getProjects()
        .then((res) => setProjects(res.data?.data || res.data || []))
        .catch(() => {});
    }
  }, [isAuthenticated, isHyperCore, location.pathname]);

  if (!isAuthenticated) return null;

  return <Header projects={projects} currentProject={currentProject} />;
}

function AppRoutes() {
  return (
    <>
      <HeaderWithProjects />
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <TenantRoute>
              <DashboardPage />
            </TenantRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <TenantRoute>
              <AnalyticsDashboard />
            </TenantRoute>
          }
        />
        <Route
          path="/ai-conversations"
          element={
            <TenantRoute>
              <AiConversationList />
            </TenantRoute>
          }
        />
        {/* Legacy /ai-conversations/:id → redirect to chat */}
        <Route
          path="/ai-conversations/:id"
          element={
            <TenantRoute>
              <RedirectToChat />
            </TenantRoute>
          }
        />
        <Route
          path="/ai-chat"
          element={
            <TenantRoute>
              <AiChat />
            </TenantRoute>
          }
        />
        <Route
          path="/ai-chat/:id"
          element={
            <TenantRoute>
              <AiChat />
            </TenantRoute>
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
        {/* Platform owner (hyper_core) — not scoped to any single project */}
        <Route
          path="/platform"
          element={
            <HyperCoreRoute>
              <PlatformLayout />
            </HyperCoreRoute>
          }
        >
          <Route index element={<PlatformOverview />} />
          <Route path="projects" element={<AllProjectsPage />} />
          <Route path="health" element={<SystemHealthPage />} />
          <Route path="logs" element={<PlatformLogsPage />} />
          <Route path="audit-logs" element={<AuditTrailPage />} />
        </Route>

        <Route
          path="/projects/new"
          element={
            <TenantRoute>
              <NewProjectWizard />
            </TenantRoute>
          }
        />
        <Route
          path="/projects/:slug/*"
          element={
            <TenantRoute>
              <ProjectLayout />
            </TenantRoute>
          }
        >
          <Route index element={<ProjectOverview />} />
          <Route path="schema" element={<SchemaBuilder />} />
          <Route path="schema/new" element={<NewDataType />} />
          <Route path="schema/:typeId" element={<TableEditor />} />
          <Route path="relationships" element={<RelationshipBuilder />} />
          <Route path="clinic-setup" element={<ClinicSetupPage />} />
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
          <Route path="commerce/offers/:collectionSlug" element={<OfferDetail />} />
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
          <Route path="search/ai-rerun" element={<SearchAiRerunPage />} />
          {/* ********** */}
          {/* Subscriptions admin */}
          <Route
            path="subscriptions"
            element={<Navigate to="plans" replace />}
          />
          <Route path="subscriptions/plans" element={<PlansPage />} />
          <Route path="subscriptions/subscribers" element={<SubscribersPage />} />
          <Route path="subscriptions/feature-rules" element={<FeatureRulesPage />} />
          <Route path="subscriptions/content-access" element={<ContentAccessPage />} />
          {/* ********** */}
          <Route path="api-docs" element={<ApiDocs />} />
          <Route path="settings" element={<ProjectSettings />} />
        </Route>

        {/* Documentation — top-level like /admin, not scoped to a project */}
        <Route
          path="/docs/*"
          element={
            <ProtectedRoute>
              <DocsLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/docs/introduction" replace />} />
          <Route path="introduction" element={<IntroductionPage />} />
          <Route path="architecture" element={<ArchitecturePage />} />
          <Route path="setup" element={<SetupPage />} />
          <Route path="cms" element={<CmsOverviewPage />} />
          <Route path="cms/architecture" element={<CmsArchitecturePage />} />
          <Route path="cms/database" element={<CmsDatabasePage />} />
          <Route path="cms/projects" element={<CmsProjectsPage />} />
          <Route path="cms/data-types" element={<CmsDataTypesPage />} />
          <Route path="cms/fields" element={<CmsFieldsPage />} />
          <Route path="cms/field-types" element={<CmsFieldTypesPage />} />
          <Route path="cms/entries" element={<CmsEntriesPage />} />
          <Route path="cms/states" element={<CmsStatesPage />} />
          <Route path="cms/versions" element={<CmsVersionsPage />} />
          <Route path="cms/relations" element={<CmsRelationsPage />} />
          <Route path="cms/collections" element={<CmsCollectionsPage />} />
          <Route path="cms/ratings" element={<CmsRatingsPage />} />
          <Route path="cms/analytics" element={<CmsAnalyticsPage />} />
          <Route path="cms/subscriptions" element={<CmsSubscriptionsPage />} />
          <Route path="cms/payments" element={<CmsPaymentsPage />} />
          <Route path="cms/ai" element={<CmsAiPage />} />
          <Route path="cms/search" element={<CmsSearchPage />} />
          <Route path="cms/stock" element={<CmsStockPage />} />
          <Route path="booking" element={<BookingOverviewPage />} />
          <Route path="booking/architecture" element={<BookingArchitecturePage />} />
          <Route path="booking/database" element={<BookingDatabasePage />} />
          <Route path="booking/resources" element={<BookingResourcesPage />} />
          <Route path="booking/availability" element={<BookingAvailabilityPage />} />
          <Route path="booking/policies" element={<BookingPoliciesPage />} />
          <Route path="booking/bookings" element={<BookingBookingsPage />} />
          <Route path="booking/payments" element={<BookingPaymentsPage />} />
          <Route path="booking/events" element={<BookingEventsPage />} />
          <Route path="booking/analytics" element={<BookingAnalyticsDocsPage />} />
          <Route path="booking/reliability" element={<BookingReliabilityPage />} />
          <Route path="ecommerce" element={<EcomOverviewPage />} />
          <Route
            path="ecommerce/architecture"
            element={<EcomArchitecturePage />}
          />
          <Route path="ecommerce/database" element={<EcomDatabasePage />} />
          <Route
            path="ecommerce/business-logic"
            element={<EcomBusinessLogicPage />}
          />
          <Route
            path="ecommerce/products"
            element={<EcommerceProductsPage />}
          />
          <Route path="ecommerce/pricing" element={<EcommercePricingPage />} />
          <Route path="ecommerce/cart" element={<EcommerceCartPage />} />
          <Route
            path="ecommerce/checkout"
            element={<EcommerceCheckoutPage />}
          />
          <Route path="ecommerce/orders" element={<EcommerceOrdersPage />} />
          <Route path="ecommerce/offers" element={<EcommerceOffersPage />} />
          <Route path="ecommerce/wishlist" element={<EcommerceWishlistPage />} />
          <Route path="ecommerce/returns" element={<EcommerceReturnsPage />} />
          <Route path="ecommerce/payments" element={<EcommercePaymentsPage />} />
          <Route path="ecommerce/analytics" element={<EcommerceAnalyticsPage />} />
          {getFlatDocsLinks()
            .filter((link) => !DOCS_READY_PATHS.has(link.to))
            .map((link) => (
              <Route
                key={link.to}
                path={link.to.replace("/docs/", "")}
                element={<DocsComingSoon title={link.label} />}
              />
            ))}
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
