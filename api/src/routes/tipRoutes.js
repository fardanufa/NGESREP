import { Router } from "express";
import * as controller from "../controllers/tipController.js";
import { validateId } from "../validation.js";

const router = Router();
router.param("id", validateId);

router.get("/", controller.list);
router.get("/:id", controller.detail);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

export default router;
