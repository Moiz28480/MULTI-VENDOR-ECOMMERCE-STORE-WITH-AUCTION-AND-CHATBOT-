import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { account, databases, ROLE_OPTIONS } from '@/lib/appwrite.js';
import { ID } from 'appwrite';
import '../styling/signup.css';

const Signup = () => {
	const navigate = useNavigate();
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [role, setRoleSelection] = useState('Customer');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const DATABASE_ID = '69c1cfaf003a710f1232';
	const USERS_COLLECTION_ID = 'users';
	const VENDORS_COLLECTION_ID = 'vendors';

	const handleSignup = async (event) => {
		event.preventDefault();
		setError('');

		if (password !== confirmPassword) {
			setError('Passwords do not match.');
			return;
		}

		setLoading(true);

		try {
			const authUser = await account.create(ID.unique(), email, password, name);
			const authId = authUser.$id;

			await databases.createDocument(DATABASE_ID, USERS_COLLECTION_ID, authId, {
				name,
				email,
				role,
			});

			if (role.toLowerCase() === 'vendor') {
				await databases.createDocument(DATABASE_ID, VENDORS_COLLECTION_ID, authId, {
					vendorId: authId,
					shopName: null,
					shopLogo: null,
					isVerified: false,
				});
			}

			await account.createEmailPasswordSession(email, password);
			await account.updatePrefs({ role });
			await account.deleteSession('current');

			navigate('/login', {
				replace: true,
				state: { success: 'Account created. Please sign in.' },
			});
		} catch (err) {
			setError(err?.message || 'Unable to create account.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="page-shell auth-background">
			<div className="auth-card">
				<div className="auth-icon">
					<span aria-hidden="true">+</span>
				</div>
				<h1>Create Account</h1>
				<p className="auth-subtitle">Join our marketplace today</p>

				<form onSubmit={handleSignup} className="auth-form">
					<label className="field">
						<span>Full Name</span>
						<div className="input-shell">
							<span className="input-icon">o</span>
							<input
								type="text"
								placeholder="John Doe"
								value={name}
								onChange={(event) => setName(event.target.value)}
								required
							/>
						</div>
					</label>

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
								required
							/>
						</div>
					</label>

					<label className="field">
						<span>Confirm Password</span>
						<div className="input-shell">
							<span className="input-icon">*</span>
							<input
								type="password"
								placeholder="********"
								value={confirmPassword}
								onChange={(event) => setConfirmPassword(event.target.value)}
								required
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
						{loading ? 'Creating Account...' : 'Create Account'}
					</button>
				</form>

				<p className="auth-footer">
					Already have an account? <Link to="/login">Sign in</Link>
				</p>
			</div>
		</div>
	);
};

export default Signup;
