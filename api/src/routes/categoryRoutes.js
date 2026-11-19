import { Router } from "express";
import * as controller from "../controllers/categoryController.js";
import { validateId } from "../validation.js";

// Route hanya memetakan URL ke controller.
const router = Router();
router.param("id", validateId);

router.get("/", controller.list);
router.get("/:id", controller.detail);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

export default router;
