import { Router } from "express";
import { addUpvote, getUpvote, removeUpvote } from "../controllers/upvotes.js";

const router = Router();

router.post("/", addUpvote);
router.get("/", getUpvote);
router.delete("/", removeUpvote);

export default router;
