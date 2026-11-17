import { Router } from "express";
import * as controller from "../controllers/recipeController.js";

const router = Router();

router.get("/", controller.list);
router.get("/:id", controller.detail);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

export default router;
