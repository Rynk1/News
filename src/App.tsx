import { Suspense } from "react";
import { useRoutes, Routes, Route } from "react-router-dom";
import Home from "./components/home";
import routes from "tempo-routes";
import { NewsProvider } from "./contexts/NewsContext";

function App() {
  // Hooks must run unconditionally; pass no routes when Tempo is disabled.
  const tempoRoutes = useRoutes(
    import.meta.env.VITE_TEMPO === "true" ? routes : [],
  );

  return (
    <NewsProvider>
      <Suspense fallback={<p>Loading...</p>}>
        <>
          <Routes>
            <Route path="/" element={<Home />} />
          </Routes>
          {tempoRoutes}
        </>
      </Suspense>
    </NewsProvider>
  );
}

export default App;