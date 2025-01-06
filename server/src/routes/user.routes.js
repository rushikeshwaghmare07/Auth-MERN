import express from "express";
import { getUserData } from "../controllers/user.controller.js";
import userAuth from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/data", userAuth, getUserData);

export default router;