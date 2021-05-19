const e = require("express");
const path = require("path");

const orders = require(path.resolve("src/data/orders-data"));

const nextId = require("../utils/nextId");

// MIDDLEWARE

function checkStatus(req, res, next) {
  const {
    data: { status },
  } = req.body;
  if (!status || status === "invalid")
    return next({
      status: 400,
      message:
        "Order must have a status of pending, preparing, out-for-delivery, delivered",
    });
  if (status === "delivered")
    return next({
      status: 400,
      message: "A delivered order cannot be changed",
    });
  next();
}

function checkDishes(req, res, next) {
  const dishes = res.locals.validOrder.data.dishes;
  dishes.forEach((dish, index) => {
    if (
      !dish.quantity ||
      dish.quantity <= 0 ||
      typeof dish.quantity !== "number"
    ) {
      return next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0`,
      });
    }
  });
  next();
}

function isDishValid(req, res, next) {
  const {
    data: { deliverTo, mobileNumber, dishes },
  } = req.body;
  const requiredFields = ["deliverTo", "mobileNumber", "dishes"];
  for (const field of requiredFields) {
    if (!req.body.data[field]) {
      return next({ status: 400, message: `Order must include a ${field}.` });
    }
  }
  if (dishes.length === 0 || !Array.isArray(dishes))
    return next({
      status: 400,
      message: "Order must include one dish",
    });
  res.locals.validOrder = req.body;
  next();
}

function idCheck(req, res, next) {
  const orderId = req.params.orderId;
  const id = req.body.data.id;
  console.log("orderId, ID: ", orderId, id);
  if (id && orderId !== id) {
    next({
      status: 400,
      message: `Route id: ${orderId} does not match order id: ${id}.`,
    });
  }
  next();
}

function orderExists(req, res, next) {
  const orderId = req.params.orderId;
  const foundOrder = orders.find((order) => order.id === orderId);
  res.locals.foundOrder = foundOrder;
  if (foundOrder) {
    return next();
  } else {
    return next({
      status: 404,
      message: `Not found: ${orderId}`,
    });
  }
}

function orderNotPending(req, res, next) {
  const status = res.locals.foundOrder.status;
  if (status !== "pending") {
    return next({
      status: 400,
      message: "An order cannot be deleted unless it is pending",
    });
  }
  return next();
}

// MAIN HANDLERS

function list(req, res) {
  res.json({ data: orders });
}

function create(req, res, next) {
  const id = nextId();
  const newOrder = { ...res.locals.validOrder.data, id };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function update(req, res, next) {
  let index = orders.indexOf(res.locals.foundOrder);
  orders[index] = { ...req.body.data, id: orders[index].id };
  res.json({ data: orders[index] });
}

function destroy(req, res) {
  const orderId = req.params.orderId;
  const foundOrderIndex = orders.indexOf(orderId);
  orders.splice(foundOrderIndex, 1);
  res.sendStatus(204);
}

function read(req, res) {
  const foundOrder = res.locals.foundOrder;
  res.json({ data: foundOrder });
}

module.exports = {
  list,
  read: [orderExists, read],
  create: [isDishValid, checkDishes, create],
  update: [orderExists, isDishValid, checkDishes, checkStatus, idCheck, update],
  delete: [orderExists, orderNotPending, destroy],
};
