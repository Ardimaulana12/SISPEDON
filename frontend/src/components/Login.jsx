import React, { useState } from 'react';
import axios from 'axios';
// import image from '../../components/Taru-new/assets/greenpadi.jpg';
import {GoogleOAuthProvider, GoogleLogin} from '@react-oauth/google';
import { useNavigate, NavLink } from 'react-router-dom';
import {LoginLoading} from './Loading';
import { useAuth } from './AuthProvider';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styled from 'styled-components';
import { motion } from 'framer-motion';
// import 'font-awesome/css/font-awesome.min.css';

const AnimatedBackground = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  overflow: hidden;
  background: linear-gradient(45deg, #11998e, #38ef7d);
`;

const Ball = styled(motion.div)`
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  width: ${props => props.size}px;
  height: ${props => props.size}px;
`;

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const apiUrl = import.meta.env.VITE_API_URL;

    // Generate balls with different properties
    const balls = Array.from({ length: 5 }, (_, i) => ({
        size: Math.random() * 30 + 20,
        left: Math.random() * 100,
        top: Math.random() * 100,
        duration: Math.random() * 5 + 5,
        delay: Math.random() * 2
    }));

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        
        try {
            const response = await axios.post(`${apiUrl}/login`, {
                username: username,
                password: password
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    "Accept": "application/json",
                },
            });

            const token = response.data.token;
            const role = response.data.role;
            
            localStorage.setItem("access_token", token);
            localStorage.setItem("role", role);
            login(token, role);
            
            toast.success('Login successful!');
            navigate("/lecturer");
        } catch (error) {
            if (error.response) {
                toast.error(error.response.data.error || 'Invalid credentials');
            } else {
                toast.error('Error connecting to the server');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLoginGoogle = async (credentialResponse) => {
        const token = credentialResponse.credential;
        try {
            const response = await axios.post(`${apiUrl}/auth/google`,{
                token: token  // Kirim token dalam body
            },{
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token }),
            })
            const tokenJwt = response.data.token;
            localStorage.setItem("access_token",tokenJwt),
            navigate("/dev/kecukupan-nutrisi");
        } catch { (error)
            console.log('Error during Google login:', error.response || error)
        }
    };

    return (
        <>
            <AnimatedBackground
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
            >
                {balls.map((ball, index) => (
                    <Ball
                        key={index}
                        size={ball.size}
                        style={{
                            left: `${ball.left}%`,
                            top: `${ball.top}%`
                        }}
                        animate={{
                            y: [-50, -150, -50],
                        }}
                        transition={{
                            duration: ball.duration,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: ball.delay
                        }}
                    />
                ))}
            </AnimatedBackground>
            <motion.div 
                className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <motion.div 
                    className="max-w-md w-full space-y-8 bg-white/90 backdrop-blur-sm p-8 rounded-xl shadow-2xl"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                >
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                            Sign in to SISPENDON
                        </h2>
                    </motion.div>
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="rounded-md shadow-sm -space-y-px">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: 0.3 }}
                            >
                                <label htmlFor="username" className="sr-only">Username or NIM</label>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    required
                                    className="appearance-none mb-3 rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                    placeholder="Enter NIM (for students) or username (for admin)"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    disabled={isLoading}
                                />
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: 0.4 }}
                            >
                                <label htmlFor="password" className="sr-only">Password</label>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={isLoading}
                                />
                            </motion.div>
                        </div>

                        <motion.div 
                            className="flex items-center justify-between"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.5 }}
                        >
                            <div className="flex items-center">
                                <input
                                    id="show-password"
                                    name="show-password"
                                    type="checkbox"
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                    checked={showPassword}
                                    onChange={(e) => setShowPassword(e.target.checked)}
                                />
                                <label htmlFor="show-password" className="ml-2 block text-sm text-gray-900">
                                    Show password
                                </label>
                            </div>
                        </motion.div>

                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
                            >
                                {isLoading ? (
                                    <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    </span>
                                ) : null}
                                {isLoading ? 'Signing in...' : 'Sign in'}
                            </button>
                        </motion.div>
                    </form>
                </motion.div>
            </motion.div>
        </>
    );
}

export default Login;
