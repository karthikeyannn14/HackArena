const Project = require("./project.model");

describe("Project Model", () => {
    const validProject = {
        name: "AI Hackathon Project",
        description: "An AI-powered solution",
        event: "507f1f77bcf86cd799439011",
        team: "507f1f77bcf86cd799439012",
    };

    test("should create a valid project", () => {
        const project = new Project(validProject);

        expect(project.name).toBe("AI Hackathon Project");
        expect(project.description).toBe("An AI-powered solution");
        expect(project.event.toString()).toBe(
            "507f1f77bcf86cd799439011"
        );
        expect(project.team.toString()).toBe(
            "507f1f77bcf86cd799439012"
        );
    });

    test("should default status to DRAFT", () => {
        const project = new Project(validProject);

        expect(project.status).toBe("DRAFT");
    });

    test("should require name, description, event, and team", () => {
        const project = new Project();

        const error = project.validateSync();

        expect(error.errors.name).toBeDefined();
        expect(error.errors.description).toBeDefined();
        expect(error.errors.event).toBeDefined();
        expect(error.errors.team).toBeDefined();
    });

    test("should reject an invalid project status", () => {
        const project = new Project({
            ...validProject,
            status: "INVALID_STATUS",
        });

        const error = project.validateSync();

        expect(error.errors.status).toBeDefined();
    });

    test("should reject a project name shorter than 2 characters", () => {
        const project = new Project({
            ...validProject,
            name: "A",
        });

        const error = project.validateSync();

        expect(error.errors.name).toBeDefined();
    });

    test("should reject a project description longer than 5000 characters", () => {
        const project = new Project({
            ...validProject,
            description: "A".repeat(5001),
        });

        const error = project.validateSync();

        expect(error.errors.description).toBeDefined();
    });
});