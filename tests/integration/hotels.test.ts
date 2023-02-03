import app, { init } from "@/app";
import { disconnectDB } from "@/config";
import faker from "@faker-js/faker";
import { TicketStatus, TicketType } from "@prisma/client";
import httpStatus from "http-status";
import * as jwt from "jsonwebtoken";
import supertest from "supertest";
import { createUser, createEnrollmentWithAddress, createTicket, createTicketTypeWithOptions, createHotel, createTicketType } from "../factories";
import { cleanDb, generateValidToken } from "../helpers";

beforeAll(async () => {
    await init();
  });
  
  beforeEach(async () => {
    await cleanDb();
  });

  afterAll(async () => {
   disconnectDB()
 });

  const server = supertest(app);

  describe("GET /hotels", () => {
    it("should respond with status 401 if no token is given", async () => {
      const response = await server.get("/hotels");
  
      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
  
    it("should respond with status 401 if given token is not valid", async () => {
      const token = faker.lorem.word();
  
      const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);
  
      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
  
    it("should respond with status 401 if there is no session for given token", async () => {
      const userWithoutSession = await createUser();
      const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
  
      const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);
  
      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
  
    describe("when token is valid", () => {
      
        it("should respond with status 404 when user doesnt have an enrollment yet", async () => {
        const token = await generateValidToken();
  
        const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);
  
        expect(response.status).toEqual(httpStatus.NOT_FOUND);
      });
  
      it("should respond with status 404 when user doesnt have a ticket yet", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        await createEnrollmentWithAddress(user);
  
        const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);
  
        expect(response.status).toEqual(httpStatus.NOT_FOUND);
      });

      it("should respond with status 402 when event is remote", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const isRemote = true;
        const isHotelIncluded = false;
        const createTicketType = await createTicketTypeWithOptions(isHotelIncluded, isRemote);
        const ticket = await createTicket(enrollment.id, createTicketType.id, TicketStatus.PAID);
        
        const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);
  
        expect(response.status).toEqual(httpStatus.PAYMENT_REQUIRED);
      });

      it("should respond with status 402 when hotel is not included", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const isRemote = false;
        const isHotelIncluded = false;
        const createTicketType = await createTicketTypeWithOptions(isHotelIncluded, isRemote);
        const ticket = await createTicket(enrollment.id, createTicketType.id, TicketStatus.PAID);
        
        const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);
  
        expect(response.status).toEqual(httpStatus.PAYMENT_REQUIRED);
      });

      it("should respond with status 402 when ticket has not been paid", async () => {
        const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);

      const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);
  
        expect(response.status).toEqual(httpStatus.PAYMENT_REQUIRED);
      });

      it("should respond with empty array when there are no hotels created", async () => {
        const token = await generateValidToken();
  
        const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);
  
        expect(response.body).toEqual([]);
      });
  
      it("should respond with status 200 and with hotels data", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const isRemote = false;
        const isHotelIncluded = true;
        const createTicketType = await createTicketTypeWithOptions(isHotelIncluded, isRemote);
        const ticket = await createTicket(enrollment.id, createTicketType.id, TicketStatus.PAID);
        const hotel = await createHotel();
  
        const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);
  
        expect(response.status).toEqual(httpStatus.OK);
        expect(response.body).toEqual([{
            id: hotel.id,
            name: hotel.name,
            image: hotel.image,
            createdAt: hotel.createdAt.toISOString(),
            updatedAt: hotel.updatedAt.toISOString(),
        }]);
      });
    });
  });