import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Query } from 'appwrite';
import { login, logout, ROLE_OPTIONS } from '../lib/appwrite.js';
import { databases } from '../lib/appwrite.js';
import { useAuth } from '../lib/auth-context.js';
import '../styling/login.css';

const roleRoutes = {
	Customer: '/store-home',
	Vendor: '/vendor-dashboard',
	Admin: '/admin-dashboard',
};

const DATABASE_ID = '69c1cfaf003a710f1232';
const USERS_COLLECTION_ID = 'users';

const findUserDocumentForLogin = async ({ userId, email }) => {
	if (userId) {
		const byId = await databases.listDocuments(DATABASE_ID, USERS_COLLECTION_ID, [
			Query.equal('$id', [userId]),
			Query.limit(1),
		]);

		const matchedById = byId?.documents?.[0] || null;
		if (matchedById) {
			return matchedById;
		}
	}

	const normalizedEmail = String(email || '').trim().toLowerCase();
	if (!normalizedEmail) {
		return null;
	}

	const byEmail = await databases.listDocuments(DATABASE_ID, USERS_COLLECTION_ID, [
		Query.equal('email', [normalizedEmail]),
		Query.limit(1),
	]);

	return byEmail?.documents?.[0] || null;
};

const assertNotBanned = (userDocument) => {
	if (userDocument?.isBanned === true) {
		throw new Error('Your account is suspended');
	}
};

const Login = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const { setUser, setRole } = useAuth();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [role, setRoleSelection] = useState('Customer');
	const [error, setError] = useState('');
	const [successMessage, setSuccessMessage] = useState(
		location.state?.success || ''
	);
	const [loading, setLoading] = useState(false);
	const isPasswordlessBypassEnabled =
		String(import.meta.env.VITE_ENABLE_PASSWORDLESS_BYPASS).toLowerCase() ===
			'true';

	const handleSubmit = async (event) => {
		event.preventDefault();
		setError('');
		setSuccessMessage('');
		setLoading(true);

		try {
			if (isPasswordlessBypassEnabled) {
				// TODO: REMOVE BYPASS BEFORE FINAL SUBMISSION
				// TODO: REMOVE BYPASS BEFORE FINAL SUBMISSION
				// TODO: REMOVE BYPASS BEFORE FINAL SUBMISSION
				// TODO: REMOVE BYPASS BEFORE FINAL SUBMISSION
				// TODO: REMOVE BYPASS BEFORE FINAL SUBMISSION
				// TODO: REMOVE BYPASS BEFORE FINAL SUBMISSION
				const response = await databases.listDocuments(
					DATABASE_ID,
					USERS_COLLECTION_ID,
					[Query.equal('email', [email.trim().toLowerCase()]), Query.limit(1)]
				);

				const matchedUser = response?.documents?.[0];
				if (!matchedUser) {
					throw new Error('No user found in users collection for this email.');
				}

				assertNotBanned(matchedUser);

				const storedRole = matchedUser?.role;
				if (!storedRole) {
					throw new Error('No role found for this account.');
				}

				localStorage.setItem('userId', matchedUser.$id);
				localStorage.setItem('role', storedRole);

				setUser({
					$id: matchedUser.$id,
					email: matchedUser.email,
					prefs: { role: storedRole },
				});
				setRole(storedRole);

				const normalizedRole = String(storedRole).toLowerCase();
				if (normalizedRole === 'vendor') {
					navigate('/vendor-dash');
					return;
				}

				if (normalizedRole === 'customer') {
					navigate('/marketplace');
					return;
				}

				navigate(roleRoutes[storedRole] || '/');
				return;
			}

			const { user, role: storedRole } = await login({ email, password });
			const matchedUser = await findUserDocumentForLogin({
				userId: user?.$id,
				email,
			});

			assertNotBanned(matchedUser);

			if (!storedRole) {
				throw new Error('No role found for this account.');
			}

			if (storedRole !== role) {
				throw new Error(`This account is registered as ${storedRole}.`);
			}

			setUser(user);
			setRole(storedRole);
			navigate(roleRoutes[storedRole] || '/');
		} catch (err) {
			if (String(err?.message || '').toLowerCase().includes('suspended')) {
				await logout();
			}

			setError(err?.message || err?.response?.message || 'Unable to sign in.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="page-shell auth-background">
			<div className="auth-card">
				<div className="auth-icon">
					<span aria-hidden="true">&gt;</span>
				</div>
				<h1>Welcome Back</h1>
				<p className="auth-subtitle">Sign in to your account</p>

				<form onSubmit={handleSubmit} className="auth-form">
					{successMessage && (
						<div className="form-success">{successMessage}</div>
					)}
					<label className="field">
						<span>Email Address</span>
						<div className="input-shell">
							<span className="input-icon">@</span>
							<input
								type="email"
								placeholder="you@example.com"
								value={email}
								onChange={(event) => setEmail(event.target.value)}
								required
							/>
						</div>
					</label>

					<label className="field">
						<span>Password</span>
						<div className="input-shell">
							<span className="input-icon">*</span>
							<input
								type="password"
								placeholder="********"
								value={password}
								onChange={(event) => setPassword(event.target.value)}
								required={!isPasswordlessBypassEnabled}
							/>
						</div>
					</label>

					<label className="field">
						<span>Select Role</span>
						<div className="input-shell">
							<span className="input-icon">~</span>
							<select
								value={role}
								onChange={(event) => setRoleSelection(event.target.value)}
							>
								{ROLE_OPTIONS.map((option) => (
									<option key={option} value={option}>{option}</option>
								))}
							</select>
						</div>
					</label>

					{error && <div className="form-error">{error}</div>}

					<button className="primary-btn" type="submit" disabled={loading}>
						{loading ? 'Signing In...' : 'Sign In'}
					</button>
				</form>

				<p className="auth-footer">
					Don&apos;t have an account? <Link to="/signup">Sign up</Link>
				</p>
			</div>
		</div>
	);
};

export default Login;
