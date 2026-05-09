import { AppProviders } from "./app/providers.jsx";
import { AppRouter } from "./app/router.jsx";

export default function App() {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  );
}