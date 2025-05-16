import React from 'react';

const Loading = () => {
  return <div className="w-12 h-12 my-8 mx-auto border-4 border-t-4 border-white border-t-[#515751] rounded-full animate-spin"></div>;
};
export const LoginLoading = () => {
  return <div className="w-5 h-5 flex items-center text-center my-auto mx-auto border-4 border-t-4 border-white border-t-[#2f9e3e] rounded-full animate-spin"></div>;
};

export default Loading;