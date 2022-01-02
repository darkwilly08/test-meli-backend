import express from "express";
import { DEFAULT_PAGINATION, MAX_PAGINATION } from "../configs/constants.js";
const router = express.Router();

import productService from "../services/product-service.js";

router.get("/", async (req, res, next) => {
  let limit =
    !req.query.l || req.query.l > MAX_PAGINATION
      ? DEFAULT_PAGINATION
      : req.query.l;
  let offset = req.query.o ? req.query.o : 0;

  if (!req.query.q) {
    const err = new Error("Required q param missing");
    err.status = 400;
    return next(err);
  }

  productService
    .findProductsByText(req.query.q, limit, offset)
    .then((products) => {
      res.status(200).send(products);
    })
    .catch((err) => {
      next(err);
    });
});

router.get("/:itemId", async (req, res, next) => {
  const itemId = req.params.itemId;
  productService
    .getProductById(itemId)
    .then((product) => {
      res.status(200).send(product);
    })
    .catch((err) => {
      next(err);
    });
});

export default router;
