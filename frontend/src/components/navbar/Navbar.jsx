// Navbar.jsx
import React, { useEffect, useState } from "react";
import Navbarnav from "./Navbarnav";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthProvider";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const {  handleLogout } = useAuth(); // Get isVerified from context
    const navigate = useNavigate();

    // Set the logged-in state based on the access_token
    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (token) {
            setIsLoggedIn(true);
        }
    }, []);

    const handleLogoutClick = () => {
        // Show the logout confirmation modal instead of logging out immediately
        setShowLogoutModal(true);
    };
    
    // Function to actually perform the logout after confirmation
    const confirmLogout = () => {
        handleLogout(); // Handle logout using context
        setIsLoggedIn(false); // Set isLoggedIn to false after logout
        setShowLogoutModal(false); // Close the modal
        navigate("/login"); // Navigate to the login page
    };
    
    // Function to close the modal without logging out
    const cancelLogout = () => {
        setShowLogoutModal(false);
    };

    const navItems = [
        { path: "/home", label: "Home" },
        { path: "/lecturer", label: "Form" },
        { path: "/leaderboard", label: "Leaderboard" },
        { path: "/history", label: "History", hideFor: ["admin"] }, // Visible to all except admin
        { path: "/admin", label: "Admin", role: ["admin"] },
        // { path: "/contact", label: "Contact" },
    ];

    // get role from context
    const { role } = useAuth();

    // Filter by role and hideFor properties
    const filteredPaths = navItems.filter(item => {
        // Check if the item should be hidden for the current role
        if (item.hideFor && item.hideFor.includes(role)) {
            return false;
        }
        
        // If no role restriction, all roles can access
        if (!item.role) return true;
        
        // Check if the current role is allowed
        return item.role.includes(role);
    });
        return (
        <div>
            <Navbarnav
                // props path
                path={filteredPaths}
                isLoggedIn={isLoggedIn}
                // isVerified={isVerified} // Pass isVerified from context
                Logout={handleLogoutClick} // Pass logout handler
            />
            
            {/* Logout Confirmation Modal */}
            <AnimatePresence>
                {showLogoutModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-opacity-50 z-50 flex items-center justify-center p-4"
                        onClick={cancelLogout}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-lg p-6 max-w-md w-full border border-teal-100 shadow-md"
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 className="text-xl font-bold text-gray-800 mb-4">Konfirmasi Logout</h3>
                            <p className="text-gray-600 mb-6">Apakah Anda yakin ingin keluar dari akun Anda?</p>
                            
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={cancelLogout}
                                    className="px-4 cursor-pointer py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={confirmLogout}
                                    className="px-4 cursor-pointer py-2 bg-gradient-to-r from-rose-500 to-red-500 text-white rounded-md hover:from-rose-600 hover:to-red-600 transition-colors"
                                >
                                     Logout
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Navbar;
