const Team = require("./team.model");

describe("Team Model", () => {
    const validTeam = {
        name: "AI Warriors",
        event: "507f1f77bcf86cd799439011",
        owner: "507f1f77bcf86cd799439012",
    };

    test("should create a valid team", () => {
        const team = new Team(validTeam);

        expect(team.name).toBe("AI Warriors");
        expect(team.event.toString()).toBe(
            "507f1f77bcf86cd799439011"
        );
        expect(team.owner.toString()).toBe(
            "507f1f77bcf86cd799439012"
        );
    });

    test("should require name, event, and owner", () => {
        const team = new Team();

        const error = team.validateSync();

        expect(error.errors.name).toBeDefined();
        expect(error.errors.event).toBeDefined();
        expect(error.errors.owner).toBeDefined();
    });

    test("should reject a team name shorter than 2 characters", () => {
        const team = new Team({
            ...validTeam,
            name: "A",
        });

        const error = team.validateSync();

        expect(error.errors.name).toBeDefined();
    });

    test("should reject a team name longer than 100 characters", () => {
        const team = new Team({
            ...validTeam,
            name: "A".repeat(101),
        });

        const error = team.validateSync();

        expect(error.errors.name).toBeDefined();
    });
});