const router = require("express").Router();
const { route } = require("../dishes/dishes.router");
const methodNotAllowed = require("../errors/methodNotAllowed");
const controller = require("./orders.controller");
// TODO: Implement the /orders routes needed to make the tests pass

router.route("/").get(controller.list).post(controller.create);
router
  .route("/:orderId")
  .put(controller.update)
  .get(controller.read)
  .delete(controller.delete);
  .all(methodNotAllowed);

module.exports = router;
