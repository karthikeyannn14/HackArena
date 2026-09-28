const Submission = require("./submission.model");

describe("Submission Model", () => {
    const validSubmission = {
        project: "507f1f77bcf86cd799439011",
        team: "507f1f77bcf86cd799439012",
        event: "507f1f77bcf86cd799439013",
        title: "AI Hackathon Project",
        description: "Final project submission",
        repositoryUrl: "https://github.com/example/project",
        demoUrl: "http://localhost:3000",
    };

    test("should create a valid submission", () => {
        const submission = new Submission(validSubmission);

        expect(submission.project.toString()).toBe(
            "507f1f77bcf86cd799439011"
        );

        expect(submission.team.toString()).toBe(
            "507f1f77bcf86cd799439012"
        );

        expect(submission.event.toString()).toBe(
            "507f1f77bcf86cd799439013"
        );

        expect(submission.title).toBe("AI Hackathon Project");
    });

    test("should default status to DRAFT", () => {
        const submission = new Submission(validSubmission);

        expect(submission.status).toBe("DRAFT");
    });

    test("should require project, team, event, title, and description", () => {
        const submission = new Submission();

        const error = submission.validateSync();

        expect(error.errors.project).toBeDefined();
        expect(error.errors.team).toBeDefined();
        expect(error.errors.event).toBeDefined();
        expect(error.errors.title).toBeDefined();
        expect(error.errors.description).toBeDefined();
    });

    test("should allow SUBMITTED status", () => {
        const submission = new Submission({
            ...validSubmission,
            status: "SUBMITTED",
        });

        expect(submission.status).toBe("SUBMITTED");
    });

    test("should allow WITHDRAWN status", () => {
        const submission = new Submission({
            ...validSubmission,
            status: "WITHDRAWN",
        });

        expect(submission.status).toBe("WITHDRAWN");
    });

    test("should reject an invalid submission status", () => {
        const submission = new Submission({
            ...validSubmission,
            status: "INVALID_STATUS",
        });

        const error = submission.validateSync();

        expect(error.errors.status).toBeDefined();
    });
});