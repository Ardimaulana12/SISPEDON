import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

export const useLeaderboardData = () => {
  const [lecturers, setLecturers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: 'averageScore',
    direction: 'desc' // Default sort by Average score
  });
  const [previousRanking, setPreviousRanking] = useState({});
  const apiUrl = import.meta.env.VITE_API_URL;

  const fetchLecturers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${apiUrl}/lecturers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Process lecturer data to ensure consistent property names
      const lecturersWithScores = response.data.map(lecturer => ({
        ...lecturer,
        averageScore: (lecturer.average_score != null && !isNaN(lecturer.average_score)) ? lecturer.average_score : 0,
        votersCount: lecturer.voters_count || 0
      }));
      
      setLecturers(lecturersWithScores);
      setError(null);
    } catch (err) {
      console.error('Error fetching lecturers:', err);
      setError('Failed to fetch lecturers');
      toast.error('Failed to fetch lecturers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLecturers();
  }, []);

  // Track position changes when sorting changes
  useEffect(() => {
    if (lecturers.length > 0) {
      const currentRanking = {};
      
      // Store current rankings before sorting
      sortedLecturers.forEach((lecturer, index) => {
        currentRanking[lecturer.nidn] = index + 1;
      });
      
      // If we have previous rankings, compare and update
      if (Object.keys(previousRanking).length > 0) {
        // No action needed here, comparison happens in the component
      } else {
        // First load, set initial rankings
        setPreviousRanking(currentRanking);
      }
    }
  }, [sortConfig, lecturers]);

  const handleSort = (key) => {
    // Save current ranking before changing sort
    const currentRanking = {};
    sortedLecturers.forEach((lecturer, index) => {
      currentRanking[lecturer.nidn] = index + 1;
    });
    setPreviousRanking(currentRanking);
    
    // Update sort configuration
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  // Apply sorting
  const sortedLecturers = [...lecturers].sort((a, b) => {
    if (sortConfig.key === 'name') {
      return sortConfig.direction === 'asc' 
        ? a.name.localeCompare(b.name) 
        : b.name.localeCompare(a.name);
    }
    
    if (sortConfig.key === 'averageScore') {
      return sortConfig.direction === 'asc' 
        ? a.averageScore - b.averageScore 
        : b.averageScore - a.averageScore;
    }
    
    // Weighted score sorting removed
    
    return 0;
  });

  // Get position change for a lecturer
  const getPositionChange = (nidn) => {
    if (Object.keys(previousRanking).length === 0) return null;
    
    const currentIndex = sortedLecturers.findIndex(l => l.nidn === nidn);
    const currentRank = currentIndex + 1;
    const previousRank = previousRanking[nidn] || currentRank;
    
    if (currentRank < previousRank) return 'up';
    if (currentRank > previousRank) return 'down';
    return 'same';
  };

  return {
    lecturers: sortedLecturers,
    loading,
    error,
    sortConfig,
    handleSort,
    getPositionChange,
    refreshData: fetchLecturers
  };
};
