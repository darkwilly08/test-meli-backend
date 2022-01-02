function logErrors(err, req, res, next) {
  console.error(err.stack);
  next(err);
}

function clientErrorHandler(err, req, res, next) {
  const status = err.status ?? 500;
  res.status(status).send({ error: err.message, status: status });
}

export { logErrors, clientErrorHandler };
