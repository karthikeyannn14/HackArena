const User = require("./user.model");

describe("User Model", () => {
    test("should have the correct default role", () => {
        const user = new User({
            name: "Test User",
            email: "test@example.com",
            password: "testpassword",
        });

        expect(user.role).toBe("PARTICIPANT");
    });

    test("should require name, email, and password", () => {
        const user = new User();

        const error = user.validateSync();

        expect(error.errors.name).toBeDefined();
        expect(error.errors.email).toBeDefined();
        expect(error.errors.password).toBeDefined();
    });
});