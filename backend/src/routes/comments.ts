import { Router } from "express";
import {
  getAllComments,
  postComment,
  editComment,
  deleteComment,
} from "../controllers/comments.js";

const router = Router();

router.get("/", getAllComments);
router.post("/", postComment);
router.put("/:id", editComment);
router.delete("/:id", deleteComment);

export default router;
