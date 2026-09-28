const Event = require("./event.model");

describe("Event Model", () => {
    const validEvent = {
        name: "AI Hackathon 2026",
        description: "A hackathon focused on artificial intelligence",
        startDate: new Date("2026-10-10"),
        endDate: new Date("2026-10-12"),
        registrationStart: new Date("2026-09-01"),
        registrationEnd: new Date("2026-10-05"),
        submissionDeadline: new Date("2026-10-12"),
        organizer: "507f1f77bcf86cd799439011",
    };

    test("should create an event with the default DRAFT status", () => {
        const event = new Event(validEvent);

        expect(event.status).toBe("DRAFT");
    });

    test("should require the main event fields", () => {
        const event = new Event();

        const error = event.validateSync();

        expect(error.errors.name).toBeDefined();
        expect(error.errors.description).toBeDefined();
        expect(error.errors.startDate).toBeDefined();
        expect(error.errors.endDate).toBeDefined();
        expect(error.errors.registrationStart).toBeDefined();
        expect(error.errors.registrationEnd).toBeDefined();
        expect(error.errors.submissionDeadline).toBeDefined();
        expect(error.errors.organizer).toBeDefined();
    });

    test("should only allow valid event statuses", () => {
        const event = new Event({
            ...validEvent,
            status: "INVALID_STATUS",
        });

        const error = event.validateSync();

        expect(error.errors.status).toBeDefined();
    });
});