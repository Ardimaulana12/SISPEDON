import React, { createContext, useState, useContext } from 'react';

const NutrientContext = createContext();

export const NutrientProvider = ({ children }) => {
    const [selectedNutrient, setSelectedNutrient] = useState("-Nitrogen (N)");

    const handleNutrientClick = (nutrient) => {
        setSelectedNutrient(nutrient);
    };

    return (
        <NutrientContext.Provider value={{ selectedNutrient, handleNutrientClick }}>
            {children}
        </NutrientContext.Provider>
    );
};

// Hook custom untuk menggunakan Context
export const useNutrient = () => {
    const context = useContext(NutrientContext);
    if (context === undefined) {
        throw new Error('useNutrient must be used within a NutrientProvider');
    }
    return context;
};
