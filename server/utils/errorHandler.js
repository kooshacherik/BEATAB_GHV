// export const errorHandler = (statusCode, message) => {
//   const error = new Error();
//   error.statusCode = statusCode;
//   error.message = message;  
//   throw error;
// };

// utils/errorHandler.js
export const errorHandler = (statusCode, message) => {
  const error = new Error(message || 'Error');
  error.statusCode = statusCode || 500;
  return error;
};