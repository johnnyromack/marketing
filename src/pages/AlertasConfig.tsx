import { AppLayout } from "@/components/AppLayout";
import { Bell } from "lucide-react";
import { AlertContactsSection } from "@/components/integrations/AlertContactsSection";
import { AlertSettingsSection } from "@/components/integrations/AlertSettingsSection";

const AlertasConfig = () => {
  return (
    <AppLayout>
      <div className="space-y-8 p-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuracao de Alertas</h1>
          <p className="text-muted-foreground">
            Gerencie contatos e regras de alertas de saldo e performance
          </p>
        </div>

        {/* Alertas Section */}
        <section id="alertas" className="scroll-mt-6">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-semibold">Alertas</h2>
          </div>
          <div className="space-y-6">
            <AlertContactsSection />
            <AlertSettingsSection />
          </div>
        </section>
      </div>
    </AppLayout>
  );
};

export default AlertasConfig;
