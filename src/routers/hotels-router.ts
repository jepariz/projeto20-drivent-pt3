import { Router } from "express";
import { authenticateToken } from "@/middlewares";
import { getHotels, getHotelRoomsById } from "@/controllers";


const hotelsRouter = Router();

hotelsRouter
  .all("/*", authenticateToken)
  .get("/", getHotels)
.get("/:hotelId", getHotelRoomsById);

export { hotelsRouter };