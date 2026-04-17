import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSelector } from "@/components/language-selector";
import { AppSidebar } from "@/components/AppSidebar";
import { VerifyDistrictButton } from "@/components/VerifyDistrictButton";
import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function DashboardLayout() {
  const { t } = useTranslation();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border px-4 bg-card">
            <SidebarTrigger className="mr-4" />
            <h1 className="text-lg font-semibold text-foreground flex-1">
              {t('header.title')}
            </h1>
            <div className="flex items-center gap-2">
              <LanguageSelector />
              <ThemeToggle />
              <VerifyDistrictButton />
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
