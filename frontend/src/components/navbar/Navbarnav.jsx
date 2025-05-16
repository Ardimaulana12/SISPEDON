// Navbarnav.jsx
import { NavLink, useLocation } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../AuthProvider";
import { FaSignOutAlt, FaKey, FaUser, FaCog } from "react-icons/fa";
import axios from "axios";

// prop path
const Navbarnav = ({path =[] ,Logout} ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [userName, setUserName] = useState("");
    const { role, isAuthenticated } = useAuth();
    const dropdownRef = useRef(null);
    const apiUrl = import.meta.env.VITE_API_URL;
    
    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };
    
    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };
    
    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);
    
    // Fetch user data to get name for initials
    useEffect(() => {
        const fetchUserData = async () => {
            if (isAuthenticated) {
                try {
                    const token = localStorage.getItem("access_token");
                    const response = await axios.get(`${apiUrl}/api/profile`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    
                    // Get name from response
                    let name = "";
                    if (response.data.name) {
                        name = response.data.name; // If student
                    } else {
                        name = response.data.username; // Fallback to username
                    }
                    
                    setUserName(name);
                } catch (error) {
                    console.error("Error fetching user data:", error);
                }
            }
        };
        
        fetchUserData();
    }, [isAuthenticated, apiUrl]);
    
    // Generate initials from name
    const getInitials = (name) => {
        if (!name) return "";
        
        const names = name.split(" ");
        if (names.length === 1) {
            return names[0].substring(0, 2).toUpperCase();
        }
        
        return (names[0][0] + names[1][0]).toUpperCase();
    };

    return (
        <>
        <nav className='relative w-full bg-gradient-to-r from-green-500 to-teal-500 top-0 left-0 right-0 z-10 shadow-md'>
            <div className='relative flex items-center justify-between p-4 max-lg:py-4 max-lg:pr-0 max-lg:pl-2'>
                {/* Logo - Hidden on mobile */}
                <ul className="flex z-50 items-center text-white font-poppins font-bold text-[16pt] gap-2 md:flex max-md:hidden">
                    {/* <img src={image} alt="" className="max-w-10" /> */}
                    <li>
                        SISPEDON
                    </li>
                </ul>

                {/* Mobile profile and logo */}
                {isAuthenticated ? (
                    <div className="relative z-50 md:hidden" ref={dropdownRef}>
                        <button 
                            onClick={toggleDropdown}
                            className="flex items-center cursor-pointer space-x-2 text-white bg-green-500 hover:bg-green-600 transition-colors rounded-full p-1 mr-8 md:hidden"
                        >
                            <div className="w-9 h-9 rounded-full bg-gradient-to-r from-green-500 to-teal-400 text-white flex items-center justify-center font-bold shadow-md border-2 border-white">
                                {getInitials(userName || name)}
                            </div>
                        </button>
                        
                        {isDropdownOpen && (
                            <div className="absolute md:hidden left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-green-200">
                                <NavLink to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-green-50 transition-colors">
                                    <FaUser className="inline mr-2 text-green-500" /> Lihat Profile
                                </NavLink>
                                <NavLink to="/change-password" className="block px-4 py-2 text-sm text-gray-700 hover:bg-green-50 transition-colors">
                                    <FaKey className="inline mr-2 text-green-500" /> Ganti Password
                                </NavLink>
                                <button onClick={Logout} className="block cursor-pointer w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                                    <FaSignOutAlt className="inline mr-2" /> Logout
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <NavLink to="/login" className="text-white z-99 bg-green-600 hover:bg-green-700 transition-colors cursor-pointer px-5 py-2 rounded-md mr-8 text-base md:hidden font-bold shadow-md">
                        Login
                    </NavLink>
                )}

                {/* (tablet/desktop) */}
                <ul className="hidden md:flex items-center text-white list-none font-poppins">
                {path.map((item) => (
                    <li key={item.path} className="px-4 text-[14pt] max-lg:px-2 max-lg:text-base">
                    <NavLink
                        to={item.path}
                        className={({ isActive }) =>
                        isActive ? "nav-link font-extrabold" : "nav-link"
                        }
                    >
                        {item.label}
                    </NavLink>
                    </li>
                    ))}
                </ul>
                {isAuthenticated ? (
                    <div className="relative hidden md:block" ref={dropdownRef}>
                        <button 
                            onClick={toggleDropdown}
                            className="flex items-center cursor-pointer space-x-2 text-white bg-green-500 hover:bg-green-600 transition-colors rounded-full p-1 mr-8 max-md:hidden"
                        >
                            <div className="w-9 h-9 rounded-full bg-gradient-to-r from-green-500 to-teal-400 text-white flex items-center justify-center font-bold shadow-md border-2 border-white">
                                {getInitials(userName || name)}
                            </div>
                        </button>
                        
                        {isDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-green-200">
                                <NavLink to="/profile" className="block cursor-pointer px-4 py-2 text-sm text-gray-700 hover:bg-green-50 transition-colors">
                                    <FaUser className="inline mr-2 text-green-500" /> Lihat Profile
                                </NavLink>
                                <NavLink to="/change-password" className="block cursor-pointer px-4 py-2 text-sm text-gray-700 hover:bg-green-50 transition-colors">
                                    <FaKey className="inline mr-2 text-green-500" /> Ganti Password
                                </NavLink>
                                <button onClick={Logout} className="block cursor-pointer w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                                    <FaSignOutAlt className="inline mr-2" /> Logout
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <NavLink to="/login" className="text-white bg-green-600 hover:bg-green-700 transition-colors cursor-pointer px-5 py-2 rounded-md mr-8 text-base max-md:hidden font-bold shadow-md">
                        Login
                    </NavLink>
                )}

                {/* Menu Hamburger untuk mobile */}
                <div className="md:hidden z-20 mr-4 flex flex-col justify-between w-8 h-6 cursor-pointer" onClick={toggleMenu}>
                    <span className={`block h-1 bg-white transform transition duration-300 ease-in-out ${isOpen ? 'rotate-45 translate-y-2.5' : ''}`}></span>
                    <span className={`block h-1 bg-white transition duration-300 ease-in-out ${isOpen ? 'opacity-0' : ''}`}></span>
                    <span className={`block h-1 bg-white transform transition duration-300 ease-in-out ${isOpen ? '-rotate-45 -translate-y-2.5' : ''}`}></span>
                </div>

                {/* Menu mobile yang slide-in from top */}
                <div className={`absolute -top-1 bg-gradient-to-br from-green-600 to-teal-600 left-0 w-full border-white border-b-2 rounded-b-lg text-white transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-y-0' : '-translate-y-full'} md:hidden shadow-lg`}>
                    <ul className="flex flex-col items-center list-none space-y-3 text-xl max-md:mt-16 mb-8">
                        {/* Mobile menu header */}
                        {/* <li className="text-white font-bold text-2xl mb-4 border-b border-green-400 pb-2 w-full text-center">
                            Menu SISPEDON
                        </li> */}
                        
                        {path.map((item) => (
                            <li key={item.path} className="px-4 text-[14pt] max-lg:px-2 max-lg:text-base w-full text-center">
                                <NavLink
                                    to={item.path}
                                    onClick={toggleMenu}
                                    className={({ isActive }) =>
                                    isActive 
                                        ? "nav-link font-extrabold bg-green-700 block py-2 rounded-md w-full" 
                                        : "nav-link block py-2 hover:bg-green-700 rounded-md w-full transition-colors"
                                    }
                                >
                                    {item.label}
                                </NavLink>
                            </li>
                        ))}
                        <div className="flex items-center justify-center space-x-3 p-3 rounded-lg w-full mt-2">
                            {/* <div className="w-14 h-14 rounded-full bg-gradient-to-r from-green-400 to-teal-300 text-white flex items-center justify-center font-bold text-xl shadow-md border-2 border-white">
                                {getInitials(userName)}
                            </div> */}
                            <p className="text-white font-bold text-xl">SISPEDON</p>
                        </div>
                        {/* {isAuthenticated ? (
                            <div className="flex flex-col items-center mt-4 space-y-2 w-full px-4">
                                
                                <NavLink to="/profile" className="flex items-center px-4 py-3 text-white hover:bg-green-700 rounded-md w-full mb-1 transition-colors">
                                    <FaUser className="mr-3" /> Lihat Profile
                                </NavLink>
                                
                                <NavLink to="/change-password" className="flex items-center px-4 py-3 text-white hover:bg-green-700 rounded-md w-full mb-1 transition-colors">
                                    <FaKey className="mr-3" /> Ganti Password
                                </NavLink>
                                
                                <button onClick={Logout} className="flex items-center px-4 py-3 text-white bg-red-500 hover:bg-red-600 rounded-md w-full transition-colors mt-2">
                                    <FaSignOutAlt className="mr-3" /> Logout
                                </button>
                            </div>
                        ) : (
                            <NavLink to="/login" className="text-white bg-green-600 hover:bg-green-700 px-5 py-2 rounded-md font-bold mt-4 transition-colors shadow-md">
                                Login
                            </NavLink>
                        )} */}
                    </ul>
                </div>
            </div>
        </nav>

        </>
    )
};
export default Navbarnav;