import { Outlet, Link } from 'react-router-dom';
import { Navbar } from './components';

function Layout() {
    return (
        <div className='max-w-screen-xl mx-auto my-10 px-6'>
            <div className='flex items-center justify-between'>
            <Navbar />
            <div className="absolute top-11 right-6 sm:right-6 md:relative md:top-auto md:right-auto">
            <Link to="/logout" className="ml-4 text-blue-900 font-bold text-xs text-nowrap">
                Log Out
            </Link>
            </div>
            </div>
            <hr></hr>
            <main className="flex-1 pt-8">
                <Outlet />
            </main>
        </div>
    )
}

export { Layout };