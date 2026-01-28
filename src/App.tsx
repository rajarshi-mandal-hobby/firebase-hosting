import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";
import { Center, MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { theme } from "./theme";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { MemberDashboard } from "./features/member-dashboard";
import { SignIn } from "./pages/SignIn";
import { AuthProvider } from "./contexts/AuthContext";
import { AppContainer, LoadingBox, NothingToShow } from "./shared/components";
import { GenerateBillsPage } from "./features/admin/pages/GenerateBillsPage";
import { DefaultRentsPage } from "./features/admin/pages/DefaultRentsPage";
import { lazyImport } from "./shared/utils";
import { Suspense } from "react";


const MemberFormPage = lazyImport(() => import("./features/admin/pages/MemberFormPage"), "MemberFormPage");
const AdminDashboard = lazyImport(() => import("./features/admin/pages/AdminDashboard"), "AdminDashboard");
const SuspenseBox = ({ children }: { children: React.ReactNode }) => <Suspense fallback={<LoadingBox />}>
	{children}
</Suspense>


const router = createBrowserRouter([
	{
		path: "/",
		element: <SuspenseBox><AdminDashboard /></SuspenseBox>
	},
	{
		path: "/admin",
		element: <SuspenseBox><AdminDashboard /></SuspenseBox>
	},
	{
		path: "/member",
		element: <SuspenseBox><MemberDashboard /></SuspenseBox>
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
		element: <Center h='100vh'><NothingToShow /></Center>
	}
]);

export default function App() {
	return (
		<MantineProvider theme={theme}>
			<Suspense fallback={<LoadingBox />}>
				<AuthProvider>
					<Notifications position='bottom-center' containerWidth='max-content' />
					<AppContainer>
						<RouterProvider router={router} />
					</AppContainer>
				</AuthProvider>
			</Suspense>
		</MantineProvider>
	);
}
