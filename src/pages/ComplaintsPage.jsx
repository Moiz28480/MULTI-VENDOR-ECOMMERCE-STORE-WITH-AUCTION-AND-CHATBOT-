import { Link } from 'react-router-dom';
import Header from '../components/admindash-components/Header.jsx';
import ComplaintManagement from '../components/admindash-components/ComplaintManagement.jsx';
import { AdminDashProvider } from '../context/AdminDashContext.jsx';
import '../styling/adminDash.css';

const ComplaintsPage = () => {
    return (
        <AdminDashProvider>
            <div className="admin-marketplace-page">
                <div className="admin-marketplace-shell">
                    <Header />
                    <main className="admin-marketplace-content">
                        <Link to="/admin" className="admin-back-dashboard-btn mb-4 inline-flex">
                            ← Back to Dashboard
                        </Link>
                        <ComplaintManagement />
                    </main>
                </div>
            </div>
        </AdminDashProvider>
    );
};

export default ComplaintsPage;
