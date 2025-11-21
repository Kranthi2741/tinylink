import express from "express";
import {
  createShortUrl,
  getAllLinks,
  deleteLink,
  getLinkInfo
} from "../controllers/linkController.js";

const router = express.Router();

router.post("/links", createShortUrl);
router.get("/links", getAllLinks);
router.get("/links/:code", getLinkInfo);
router.delete("/links/:code", deleteLink);

export default router;
