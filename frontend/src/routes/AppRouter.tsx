import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";

import HomePage from "../pages/Home/HomePage";
import ImportPage from "../pages/Import/ImportPage";
import WorkspacePage from "../pages/Workspace/WorkspacePage";
import OutputPage from "../pages/Output/OutputPage";
import TemplatesPage from "../pages/Templates/TemplatesPage";
import ProjectsPage from "../pages/Projects/ProjectsPage";
import WorkbookPage from "../pages/Workbook/WorkbookPage";
import CleaningPage from "../pages/Cleaning/CleaningPage";
import AIPage from "../pages/AI/AIPage";
import ChartsPage from "../pages/Charts/ChartsPage";
import ReportsPage from "../pages/Reports/ReportsPage";
import ExportPage from "../pages/Export/ExportPage";
import TransformPage from "../pages/Transform/TransformPage";
import DesignPage from "../pages/Design/DesignPage";
import ColumnPropertiesPage from "../pages/ColumnProperties/ColumnPropertiesPage";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/import" element={<ImportPage />} />
          <Route path="/workspace" element={<WorkspacePage />} />
          <Route path="/output" element={<OutputPage />} />
          <Route path="/templates" element={<TemplatesPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/workbook" element={<WorkbookPage />} />
          <Route path="/cleaning" element={<CleaningPage />} />
          <Route path="/ai" element={<AIPage />} />
          <Route path="/charts" element={<ChartsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/export" element={<ExportPage />} />
          <Route path="/transform" element={<TransformPage />} />
          <Route path="/design" element={<DesignPage />} />
          <Route path="/columns" element={<ColumnPropertiesPage />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}