import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { MotionConfig } from "motion/react";
import { ArchiveProvider, useArchive } from "./lib/store.jsx";
import { ToastProvider } from "./lib/toast.jsx";
import { Shell } from "./components/Shell.jsx";
import Landing from "./pages/Landing.jsx";
import Archive from "./pages/Archive.jsx";
import Cabinet from "./pages/Cabinet.jsx";
import Lost from "./pages/Lost.jsx";
import Unsent from "./pages/Unsent.jsx";
import Settings from "./pages/Settings.jsx";
import { useEffect } from "react";
import { checkCached, selectModel } from "./lib/ai.js";

function Root() {
  const { ready, settings } = useArchive();

  useEffect(() => {
    if (ready) {
      selectModel(settings.modelId).then(() => checkCached(settings.modelId));
    }
  }, [ready, settings.modelId]);

  useEffect(() => {
    document.documentElement.style.fontSize =
      settings.textSize === "large" ? "18px" : "";
  }, [settings.textSize]);

  if (!ready) {
    return (
      <div className="min-h-dvh grid place-items-center">
        <span className="wordmark text-silver/60 text-sm animate-pulse">
          Afterhours
        </span>
      </div>
    );
  }

  return (
    <div className={settings.ambient ? "" : "ambient-off"}>
      {/* Global candle cursor — available across all routes */}

      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/archive" element={<Archive />} />

        <Route element={<Shell />}>
          <Route path="/cabinet" element={<Cabinet />} />
          <Route path="/lost" element={<Lost />} />
          <Route path="/unsent" element={<Unsent />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <ArchiveProvider>
        <ToastProvider>
          <HashRouter>
            <Root />
          </HashRouter>
        </ToastProvider>
      </ArchiveProvider>
    </MotionConfig>
  );
}
