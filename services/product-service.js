import fetch from "node-fetch";
import { AUTHOR, CACHE_TIME_MILLIS } from "../configs/constants.js";
import cache from "../utils/cache-utils.js";

const BASE_URL_MELI = process.env.MELI_URL;
const SEARCH_PREFIX = "sites/MLA/search";
const PRODUCTS_PREFIX = "items";
const CATEGORIES_PREFIX = "categories";
const CURRENCIES_PREFIX = "currencies";

const getCategoryPath = async (categoryId) => {
  //TODO: add error handling
  const resp = await fetch(
    `${BASE_URL_MELI}/${CATEGORIES_PREFIX}/${categoryId}`
  ).then((res) => res.json());

  return resp.path_from_root.map((c) => c.name);
};

const getCurrency = async (currencyId) => {
  const cacheKey = `${CURRENCIES_PREFIX}/${currencyId}`;
  let currency = cache.get(cacheKey);
  if (currency == null) {
    const resp = await fetch(
      `${BASE_URL_MELI}/${CURRENCIES_PREFIX}/${currencyId}`
    );

    const c = await resp.json();
    if (!resp.ok) {
      throw new Error(c.message);
    }
    currency = c;
    cache.put(cacheKey, currency, CACHE_TIME_MILLIS);
  }

  return currency;
};

const getProductCondition = (product) => {
  return product.attributes.find((a) => a.id === "ITEM_CONDITION").value_name;
};

const findProductsByText = async (text, limit, offset) => {
  const resp = await fetch(
    `${BASE_URL_MELI}/${SEARCH_PREFIX}?q=${text}&limit=${limit}&offset=${offset}`
  );
  const jsonResponse = await resp.json();

  if (!resp.ok) {
    throw new Error(jsonResponse.message);
  }

  const products = [];
  let categories = [];

  for (const p of jsonResponse.results) {
    const currency = await getCurrency(p.currency_id);
    products.push({
      id: p.id,
      title: p.title,
      price: {
        currency: currency.id,
        amount: p.price,
        decimals: currency.decimal_places, //countDecimals(p.price),
      },
      picture: p.thumbnail,
      condition: getProductCondition(p),
      free_shipping: p.shipping.free_shipping,
    });
  }

  //TODO: review and improve category filter. Currently it does not make sense as a business solution
  const attrCategory = jsonResponse.available_filters.find(
    (af) => af.id === "category"
  );
  if (attrCategory !== undefined) {
    categories = attrCategory.values
      .filter((v) => jsonResponse.results.some((p) => p.category_id === v.id))
      .map((c) => c.name);
  }

  return {
    author: AUTHOR,
    categories: categories,
    items: products,
  };
};

const getProductById = async (productId) => {
  const productUrl = `${BASE_URL_MELI}/${PRODUCTS_PREFIX}/${productId}`;
  const resp = await fetch(productUrl);
  const productResponse = await resp.json();
  if (!resp.ok) {
    if (resp.status === 404) {
      return {
        author: AUTHOR,
        item: null,
      };
    } else {
      throw new Error(productResponse.message);
    }
  }

  const descriptionResponse = await fetch(`${productUrl}/description`).then(
    (res) => res.json()
  );
  const currency = await getCurrency(productResponse.currency_id);
  const categoryPath = await getCategoryPath(productResponse.category_id);
  return {
    author: AUTHOR,
    item: {
      id: productResponse.id,
      title: productResponse.title,
      price: {
        currency: currency.id,
        amount: productResponse.price,
        decimals: currency.decimal_places,
      },
      picture: productResponse.pictures.find(
        (p) => productResponse.thumbnail_id === p.id
      ).url,
      condition: getProductCondition(productResponse),
      free_shipping: productResponse.shipping.free_shipping,
      sold_quantity: productResponse.sold_quantity,
      description: descriptionResponse.plain_text,
      categories: categoryPath,
    },
  };
};

export default {
  findProductsByText,
  getProductById,
};
