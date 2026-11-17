import { Router } from "express";
import * as controller from "../controllers/recipeController.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();

router.get("/", controller.list);
router.get("/:id", controller.detail);
router.post("/", requireAdmin, controller.create);
router.put("/:id", requireAdmin, controller.update);
router.delete("/:id", requireAdmin, controller.remove);

export default router;
