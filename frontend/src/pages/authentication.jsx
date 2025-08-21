import * as React from 'react';
import { AuthContext } from '../contexts/AuthContext';

import "../authentication.css";
import axios from 'axios';

const client=axios.create({
    baseURL:"http://localhost:8080/api/v1/users"
})

export default function Authentication() {
    const [username, setUsername] = React.useState();
    const [password, setPassword] = React.useState();
    const [name, setName] = React.useState();
    const [error, setError] = React.useState();
    const [message, setMessage] = React.useState();
    const [formState, setFormState] = React.useState(0);
    const [open, setOpen] = React.useState(false);
    const { handleRegister, handleLogin } = React.useContext(AuthContext);

    let handleAuth = async () => {
        try {
            if (formState === 0) {
                let result = await handleLogin(username, password);
            }
            if (formState === 1) {
                let result = await handleRegister(name, username, password);
                console.log(result);
                setUsername("");
                setMessage(result);
                setOpen(true);
                setError("")
                setFormState(0)// takes to login
                setPassword("") // makes password empty
            }
        } catch (err) {
            console.log(err);
            let message = (err.response.data.message);
            setError(message);
        }
    }

    return (
        <div className="auth-container">
            <div className="auth-image-section"></div>
            
            <div className="auth-form-section">
                <div className="auth-form-wrapper">
                    <div className="auth-avatar">
                        <svg viewBox="0 0 24 24" className="lock-icon">
                            <path d="M12 1C8.14 1 5 4.14 5 8v1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h16c.55 0 1-.45 1-1V10c0-.55-.45-1-1-1h-1V8c0-3.86-3.14-7-7-7zm6 9v9H6V10h12zm-6-5c1.66 0 3 1.34 3 3v1H9V8c0-1.66 1.34-3 3-3z"/>
                        </svg>
                    </div>

                    <div className="auth-tabs">
                        <button 
                            className={`auth-tab ${formState === 0 ? 'active' : ''}`}
                            onClick={() => setFormState(0)}
                        >
                            Sign In
                        </button>
                        <button 
                            className={`auth-tab ${formState === 1 ? 'active' : ''}`}
                            onClick={() => setFormState(1)}
                        >
                            Sign Up
                        </button>
                    </div>

                    <div className="auth-form">
                        {formState === 1 && (
                            <div className="form-group">
                                <label htmlFor="name">Full Name</label>
                                <input
                                    type="text"
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                        )}

                        <div className="form-group">
                            <label htmlFor="username">Username</label>
                            <input
                                type="text"
                                id="username"
                                value={username} // bound the value to username previously its not bound to remove
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        {error && <div className="error-message">{error}</div>}

                        <button className="auth-button" onClick={handleAuth}>
                            {formState === 0 ? "Login" : "Register"}
                        </button>
                    </div>
                </div>
            </div>

            {open && (
                <div className="snackbar">
                    {message}
                </div>
            )}
        </div>
    );
}