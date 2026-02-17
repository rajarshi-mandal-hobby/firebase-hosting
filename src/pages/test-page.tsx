import { Link, Outlet } from "react-router";

// 1. The Parent Component (Layout)
export default function TestAdminDashboard() {
    return (
        <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif' }}>
            {/* Sidebar - Always visible */}
            <aside style={{ width: '250px', background: '#f4f4f4', padding: '20px' }}>
                <h2>Admin</h2>
                <nav>
                    <ul>
                        <li>
                            <Link to='/'>Home</Link>
                        </li>
                        <li>
                            {/* <Link to='/default-rents'>Default Rents</Link> */}
                        </li>
                    </ul>
                </nav>
            </aside>

            {/* Main Content Area */}
            <main style={{ flex: 1, padding: '20px' }}>
                <h1>Dashboard Header</h1>
                <hr />

                {/* CRITICAL: The child component (DefaultRentsPage) will appear HERE */}
                <Outlet />
            </main>
        </div>
    );
}

// 2. The Child Component
export function TestDefaultRentsPage() {
    console.log('TestDefaultRentsPage rendered');
    return (
        <div style={{ background: '#e0f7fa', padding: '20px', borderRadius: '8px' }}>
            <h2>Default Rents List</h2>
            <p>This is the content showing up from /default-rents</p>
        </div>
    );
}
