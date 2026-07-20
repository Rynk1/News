import { Suspense } from "react";
import { useRoutes, Routes, Route } from "react-router-dom";
import Home from "./components/home";
import routes from "tempo-routes";
import { NewsProvider } from "./contexts/NewsContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import LoginPage from "./components/auth/LoginPage";

function AppRoutes() {
  const { user, loading, usesBackend } = useAuth();

  // Hooks must run unconditionally; pass no routes when Tempo is disabled.
  const tempoRoutes = useRoutes(
    import.meta.env.VITE_TEMPO === "true" ? routes : [],
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  // Require authentication only when a real backend is configured; in demo
  // mode the mock user is always present.
  if (usesBackend && !user) {
    return <LoginPage />;
  }

  return (
    <NewsProvider>
      <>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
        {tempoRoutes}
      </>
    </NewsProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<p>Loading...</p>}>
        <AppRoutes />
      </Suspense>
    </AuthProvider>
  );
}

export default App;
