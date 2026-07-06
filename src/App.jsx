import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from './lib/auth-context.js';
import AppRoutes from './routes/AppRoutes.jsx';
import ChatbotWidget from './components/chatbot/ChatbotWidget.jsx';
import { useAuth } from './lib/auth-context.js';
import useInactivityLogout from './hooks/useInactivityLogout.js';
import './styling/App.css';

const InactivityLogoutManager = () => {
	const { user, loading } = useAuth();

	useInactivityLogout(30, !loading && Boolean(user));

	return null;
};

const App = () => (
	<BrowserRouter>
		<AuthContext>
			<InactivityLogoutManager />
			<AppRoutes />
			<ChatbotWidget />
		</AuthContext>
	</BrowserRouter>
);

export default App;
