import { createBrowserRouter, Navigate } from "react-router-dom";
import ProtectedRoute from "../libs/ProtectedRoute.jsx";
import MainLayout from "../layout/index.jsx";
import DashboardPage from "../pages/DashboardPage.jsx";
import LoginPage from "../pages/LoginPage.jsx";
import RoomMap from "../pages/RoomMap.jsx";
import TenantsPage from "../pages/TenantsPage.jsx";
import ContractsPage from "../pages/ContractsPage.jsx";
import UtilitiesPage from "../pages/UtilitiesPage.jsx";
import InvoicesPage from "../pages/InvoicesPage.jsx";
import MaintenancePage from "../pages/MaintenancePage.jsx";

const router = createBrowserRouter([
    {
        path: "/login",
        element: <LoginPage />,
    },
    {
        path: "/",
        element: <ProtectedRoute />,
        children: [
            {
                element: <MainLayout />,
                children: [
                    // Các page cần đăng nhập đặt cùng cấp trong layout này.
                    {
                        index: true,
                        element: <DashboardPage />,
                    },
                    {
                        path: "rooms",
                        element: <RoomMap />,
                    },
                    {
                        path: "tenants",
                        element: <TenantsPage />,
                    },
                    {
                        path: "contracts",
                        element: <ContractsPage />,
                    },
                    {
                        path: "utilities",
                        element: <UtilitiesPage />,
                    },
                    {
                        path: "invoices",
                        element: <InvoicesPage />,
                    },
                    {
                        path: "maintenance",
                        element: <MaintenancePage />,
                    },
                ],
            },
        ],
    },
    {
        path: "*",
        element: <Navigate to="/" replace />,
    },
]);

export default router;
