const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

const notFound = require("../errors/notFound");
const e = require("express");

// TODO: Implement the /dishes handlers needed to make the tests pass

// MIDDLEWARE

function dishExists(req, res, next) {
  const dishId = req.params.dishId;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.foundDish = foundDish;
    return next();
  }
  return next({
    status: 404,
    message: `Dish id not found ${dishId}`,
  });
}

function dishIdsMatch(req, res, next) {
  if (req.body.data.id) {
    if (req.body.data.id !== req.params.dishId) {
      return next({
        message: `Dish id does not match route id. Dish: ${req.body.data.id}, Route: ${req.params.dishId}`,
        status: 400,
      });
    }
  }
  next();
}

function dishIsValid(req, res, next) {
  const { data: { name } = {} } = req.body;
  const { data: { description } = {} } = req.body;
  const { data: { price } = {} } = req.body;
  const { data: { image_url } = {} } = req.body;
  if (!name || name === "") {
    return next({
      message: "Dish must include a name",
      status: 400,
    });
  } else if (!description || description === "") {
    return next({
      message: "Dish must include a description",
      status: 400,
    });
  } else if (!price) {
    return next({
      message: "Dish must include a price",
      status: 400,
    });
  } else if (price <= 0 || !Number.isInteger(price)) {
    return next({
      message: "Dish must have a price that is an integer greater than 0",
      status: 400,
    });
  } else if (!image_url || image_url === "") {
    return next({
      message: "Dish must include an image_url",
      status: 400,
    });
  } else {
    res.locals.validDish = req.body.data;
    next();
  }
}

function create(req, res) {
  const { name, price, image_url } = res.locals.validDish;
  const newDish = {
    id: nextId(),
    name,
    price,
    image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function read(req, res) {
  const foundDish = res.locals.foundDish;
  res.json({ data: foundDish });
}

function update(req, res) {
  const foundDish = res.locals.foundDish;
  const { data: { id, name, description, price, image_url } = {} } = req.body;

  foundDish.id = id;
  foundDish.name = name;
  foundDish.description = description;
  foundDish.price = price;
  foundDish.image_url = image_url;
  res.json({ data: foundDish });
}

function list(req, res) {
  res.json({ data: dishes });
}

module.exports = {
  read: [dishExists, read],
  list,
  create: [dishIsValid, create],
  update: [dishExists, dishIdsMatch, dishIsValid, update],
};
