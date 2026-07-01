import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from './lib/auth-context.js';
import AppRoutes from './routes/AppRoutes.jsx';
import ChatbotWidget from './components/chatbot/ChatbotWidget.jsx';
import './styling/App.css';

const App = () => (
	<BrowserRouter>
		<AuthContext>
			<AppRoutes />
			<ChatbotWidget />
		</AuthContext>
	</BrowserRouter>
);

export default App;
