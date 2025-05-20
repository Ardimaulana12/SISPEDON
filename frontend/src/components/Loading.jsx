import React from 'react';

// Warna hijau konsisten untuk semua loading spinner
const greenColor = '#2f9e3e';

// Loading spinner utama (ukuran besar)
const Loading = () => {
  return <div className="w-12 h-12 my-8 mx-auto border-4 border-t-4 border-gray-200 border-t-transparent rounded-full animate-spin"></div>;
};

// Loading spinner untuk login (ukuran kecil)
export const LoginLoading = () => {
  return <div className="w-5 h-5 flex items-center text-center my-auto mx-auto border-4 border-t-4 border-gray-200 border-t-transparent rounded-full animate-spin"></div>;
};

// Loading spinner untuk tombol (ukuran kecil)
export const ButtonLoading = () => {
  return <div className="w-4 h-4 inline-block border-2 border-t-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>;
};

// Loading spinner untuk tabel (ukuran medium)
export const TableLoading = () => {
  return <div className="w-8 h-8 my-4 mx-auto border-3 border-t-3 border-gray-200 border-t-transparent rounded-full animate-spin"></div>;
};

export default Loading;