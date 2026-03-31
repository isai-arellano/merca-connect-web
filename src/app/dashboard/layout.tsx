import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-[#EEFAEE] dark:bg-background flex flex-col">
            <Navbar />
            <div className="flex-1 flex pt-16">
                <Sidebar />
                <main className="flex-1 md:ml-64 p-6 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
