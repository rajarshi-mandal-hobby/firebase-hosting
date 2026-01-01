import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { theme } from "./theme";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { MemberDashboard } from "./features/member-dashboard";
import { SignIn } from "./pages/SignIn";
import { AuthProvider } from "./contexts/AuthContext";
import { AdminDashboard } from "./features/admin/pages/AdminDashboard";
import { AppContainer } from "./shared/components";
import { GenerateBillsPage } from "./features/admin/pages/GenerateBillsPage";
import { DefaultRentsPage } from "./features/admin/pages/DefaultRentsPage";
import { MemberFormPage } from "./features/admin/pages/MemberFormPage";

const router = createBrowserRouter([
   {
      path: "/",
      element: <AdminDashboard />
   },
   {
      path: "/admin",
      element: <AdminDashboard />
   },
   {
      path: "/member",
      element: <MemberDashboard />
   },
   {
      path: "/signin",
      element: <SignIn />
   },
   {
      path: "/generate-bills",
      element: <GenerateBillsPage />
   },
   {
      path: "/default-rents",
      element: <DefaultRentsPage />
   },
   {
      path: "/add-member",
      element: <MemberFormPage />
   },
   {
      path: "/edit-member/",
      element: <MemberFormPage />
   },
   {
      path: "*",
      element: <div>404 Not Found</div>
   }
]);

export default function App() {
   return (
      <MantineProvider theme={theme}>
         <AuthProvider>
            <Notifications position='bottom-center' containerWidth='max-content' />
            <AppContainer>
               <RouterProvider router={router} />
            </AppContainer>
         </AuthProvider>
      </MantineProvider>
   );
}
