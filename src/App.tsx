import { MantineProvider, createTheme } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { ModalsProvider } from "@mantine/modals";
import { DatesProvider } from "@mantine/dates";
import { AuthProvider } from "./contexts/AuthContext";
import AppRouter from "./components/AppRouter";
import "dayjs/locale/en";

// Import Mantine styles
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/dates/styles.css";

// Create custom theme
const theme = createTheme({
  // You can customize your theme here
  primaryColor: "blue",
  defaultRadius: "md",
});

function App() {
  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
      <Notifications position="top-right" />
      <ModalsProvider>
        <DatesProvider
          settings={{ locale: "en", firstDayOfWeek: 0, weekendDays: [0, 6] }}
        >
          <AuthProvider>
            <AppRouter />
          </AuthProvider>
        </DatesProvider>
      </ModalsProvider>
    </MantineProvider>
  );
}

export default App;
