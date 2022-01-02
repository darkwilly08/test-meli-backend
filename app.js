import "./configs/env.js";

import express from "express";

const app = express();
const PORT = process.env.PORT;
const BASE_URL = process.env.BASE_URL;
//controllers
import productController from "./controllers/product-controller.js";
import { logErrors, clientErrorHandler } from "./middlewares/error-handler.js";

app.use(`/${BASE_URL}/items`, productController);
app.use(logErrors);
app.use(clientErrorHandler);

const startServer = async () => {
  app.listen(PORT);
};

startServer()
  .then(() => console.log("everything is ready, server UP! on PORT: " + PORT))
  .catch((err) => console.log(err));
