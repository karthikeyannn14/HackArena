const TeamMember = require("./teamMember.model");

describe("TeamMember Model", () => {
    const validMembership = {
        team: "507f1f77bcf86cd799439011",
        user: "507f1f77bcf86cd799439012",
    };

    test("should create a valid team membership", () => {
        const membership = new TeamMember(validMembership);

        expect(membership.team.toString()).toBe(
            "507f1f77bcf86cd799439011"
        );

        expect(membership.user.toString()).toBe(
            "507f1f77bcf86cd799439012"
        );

        expect(membership.role).toBe("MEMBER");
    });

    test("should allow OWNER role", () => {
        const membership = new TeamMember({
            ...validMembership,
            role: "OWNER",
        });

        expect(membership.role).toBe("OWNER");
    });

    test("should reject invalid membership roles", () => {
        const membership = new TeamMember({
            ...validMembership,
            role: "ADMIN",
        });

        const error = membership.validateSync();

        expect(error.errors.role).toBeDefined();
    });

    test("should require team and user", () => {
        const membership = new TeamMember();

        const error = membership.validateSync();

        expect(error.errors.team).toBeDefined();
        expect(error.errors.user).toBeDefined();
    });
});