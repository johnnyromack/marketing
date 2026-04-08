import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { TabProvider } from "@/context/TabContext";
import Dashboard from "./pages/Dashboard";
import LandingPage from "./pages/LandingPage";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import ChangePassword from "./pages/ChangePassword";
import DataEntry from "./pages/DataEntry";
import MidiaDataEntry from "./pages/MidiaDataEntry";
import MidiaDashboard from "./pages/MidiaDashboard";
import AdminUsers from "./pages/AdminUsers";
import GestorApproval from "./pages/GestorApproval";
import ActivityLogs from "./pages/ActivityLogs";
import Fornecedores from "./pages/Fornecedores";
import Orcamentos from "./pages/Orcamentos";
import OrcamentosArea from "./pages/OrcamentosArea";
import MarcasUnidades from "./pages/MarcasUnidades";
import PitchDeck from "./pages/PitchDeck";
import Help from "./pages/Help";
import ControleOrcamentario from "./pages/ControleOrcamentario";
import Integracoes from "./pages/Integracoes";
import SimuladorConversao from "./pages/SimuladorConversao";
import NotFound from "./pages/NotFound";

// Lazy-loaded Ad Insights Hub routes
const Plataformas = React.lazy(() => import("./pages/Plataformas"));
const SaldosContas = React.lazy(() => import("./pages/SaldosContas"));
const Relatorios = React.lazy(() => import("./pages/Relatorios"));
const Credenciais = React.lazy(() => import("./pages/Credenciais"));
const AlertasConfig = React.lazy(() => import("./pages/AlertasConfig"));
const Documentacao = React.lazy(() => import("./pages/Documentacao"));
const SyncLogs = React.lazy(() => import("./pages/SyncLogs"));

// Lazy-loaded Social Monitor routes
const SocialDashboard = React.lazy(() => import("./pages/social/Dashboard"));
const SocialInbox = React.lazy(() => import("./pages/social/Inbox"));
const SocialPublishing = React.lazy(() => import("./pages/social/Publishing"));
const SocialAnalytics = React.lazy(() => import("./pages/social/Analytics"));
const SocialAutomations = React.lazy(() => import("./pages/social/Automations"));
const SocialCrisis = React.lazy(() => import("./pages/social/Crisis"));
const SocialCompetitive = React.lazy(() => import("./pages/social/Competitive"));
const SocialConnectors = React.lazy(() => import("./pages/social/Connectors"));
const SocialQueries = React.lazy(() => import("./pages/social/Queries"));
const SocialTopics = React.lazy(() => import("./pages/social/Topics"));
const SocialSources = React.lazy(() => import("./pages/social/Sources"));
const SocialListening = React.lazy(() => import("./pages/social/Listening"));
const SocialVisual = React.lazy(() => import("./pages/social/Visual"));
const SocialReports = React.lazy(() => import("./pages/social/Reports"));
const SocialBestTime = React.lazy(() => import("./pages/social/BestTime"));
const SocialSettings = React.lazy(() => import("./pages/social/SocialSettings"));

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <TabProvider>
            <Suspense
              fallback={
                <div className="flex items-center justify-center min-h-screen">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              }
            >
              <Routes>
                <Route path="/" element={<Auth />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/home" element={<Home />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/alterar-senha" element={<ChangePassword />} />
                <Route path="/entrada-dados" element={<DataEntry />} />
                <Route path="/midia" element={<MidiaDataEntry />} />
                <Route path="/midia/dashboard" element={<MidiaDashboard />} />
                <Route path="/admin/usuarios" element={<AdminUsers />} />
                <Route path="/admin/fornecedores" element={<Fornecedores />} />
                <Route path="/admin/orcamentos" element={<Orcamentos />} />
                <Route path="/admin/orcamentos-area" element={<OrcamentosArea />} />
                <Route path="/admin/marcas-unidades" element={<MarcasUnidades />} />
                <Route path="/gestor/aprovacao" element={<GestorApproval />} />
                <Route path="/logs" element={<ActivityLogs />} />
                <Route path="/pitch" element={<PitchDeck />} />
                <Route path="/ajuda" element={<Help />} />
                <Route path="/controle-orcamentario" element={<ControleOrcamentario />} />
                <Route path="/integracoes" element={<Integracoes />} />
                <Route path="/ferramentas/simulador-conversao" element={<SimuladorConversao />} />
                {/* === NOVAS ROTAS (Ad Insights Hub) — lazy-loaded === */}
                <Route path="/plataformas" element={<Plataformas />} />
                <Route path="/saldos" element={<SaldosContas />} />
                <Route path="/relatorios" element={<Relatorios />} />
                <Route path="/credenciais" element={<Credenciais />} />
                <Route path="/admin/alertas" element={<AlertasConfig />} />
                <Route path="/documentacao" element={<Documentacao />} />
                <Route path="/logs/sync" element={<SyncLogs />} />
                {/* === Social Monitor routes === */}
                <Route path="/social" element={<SocialDashboard />} />
                <Route path="/social/inbox" element={<SocialInbox />} />
                <Route path="/social/publishing" element={<SocialPublishing />} />
                <Route path="/social/analytics" element={<SocialAnalytics />} />
                <Route path="/social/automations" element={<SocialAutomations />} />
                <Route path="/social/crisis" element={<SocialCrisis />} />
                <Route path="/social/competitive" element={<SocialCompetitive />} />
                <Route path="/social/connectors" element={<Navigate to="/integracoes" replace />} />
                <Route path="/social/queries" element={<SocialQueries />} />
                <Route path="/social/topics" element={<SocialTopics />} />
                <Route path="/social/sources" element={<SocialSources />} />
                <Route path="/social/listening" element={<SocialListening />} />
                <Route path="/social/visual" element={<SocialVisual />} />
                <Route path="/social/reports" element={<SocialReports />} />
                <Route path="/social/best-time" element={<SocialBestTime />} />
                <Route path="/social/settings" element={<SocialSettings />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            </TabProvider>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
