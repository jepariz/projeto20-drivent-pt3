import { AuthenticatedRequest } from "@/middlewares";
import { Response } from "express";
import httpStatus from "http-status";
import hotelsService from "@/services/hotels-service";

export async function getHotels(req: AuthenticatedRequest, res: Response) {

    const { userId } = req;

  try {
    const hotelList = await hotelsService.getHotels(userId);

    return res.status(httpStatus.OK).send(hotelList);
  } catch (error) {
    if (error.name === "PaymentRequired") {
      return res.status(httpStatus.PAYMENT_REQUIRED).send([]);
    }
    if (error.name === "NotFoundError") {
      return res.status(httpStatus.NOT_FOUND).send([]);
    }
  }
}

// export async function getHotelsById(hotelId:number) {
    
// }