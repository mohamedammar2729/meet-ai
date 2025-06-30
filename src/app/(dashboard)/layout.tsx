import { SidebarProvider } from '@/components/ui/sidebar';
import { SidebarDashboard } from '@/modules/dashboard/ui/components/dashboard-sidebar';

interface Props {
  children: React.ReactNode;
}

const Layout = ({ children }: Props) => {
  return (
    <SidebarProvider>
      <SidebarDashboard />
      <main className='flex flex-col w-screen h-screen bg-muted'>
        {children}
      </main>
    </SidebarProvider>
  );
};

export default Layout;
