import { notFoundError, unauthorizedError } from "@/errors";
import { paymentRequired } from "@/errors/payment-required";
import enrollmentRepository from "@/repositories/enrollment-repository";
import hotelsRepository from "@/repositories/hotels-repository";
import ticketRepository from "@/repositories/ticket-repository";
import { PAYMENT_REQUIRED } from "http-status";


async function getHotels(userId: number) {

    await findEnrollment(userId)


    const hotels = await hotelsRepository.findHotels();

    if (hotels.length === 0) {
        throw notFoundError();
    }

    return hotels;
}


async function findEnrollment(userId: number) {
    const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);

    if (!enrollment) {
        throw notFoundError();
    }

    const ticket = await ticketRepository.findTicketByEnrollmentId(enrollment.id);

    if (!ticket) {
        throw notFoundError();
    }

    if (ticket.TicketType.isRemote) {
        throw paymentRequired();
    }

    if (!ticket.TicketType.includesHotel) {
        throw paymentRequired();
    }

    if (ticket.status !== "PAID") {
        throw paymentRequired();
      }
}

const hotelsService = {
    getHotels,
};

export default hotelsService;