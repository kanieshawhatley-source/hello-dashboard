import { Nav } from '@/components/Nav';
import { logOut } from '@/app/actions';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell">
      <header className="topbar">
        <span className="brand">Productivity</span>
        <Nav />
        <form action={logOut}>
          <button className="ghost" type="submit">
            Sign out
          </button>
        </form>
      </header>
      <main>{children}</main>
    </div>
  );
}
