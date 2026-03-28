// Wrapper: async Route-Handler → Fehler werden an Express Error-Handler weitergeleitet
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
