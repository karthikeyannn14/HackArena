const express = require("express");
const dotenv = require("dotenv");

const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");

const authRoutes = require("./modules/auth/auth.routes");
const eventRoutes = require("./modules/events/event.routes");
const teamRoutes = require("./modules/teams/team.routes");
const projectRoutes = require("./modules/projects/project.routes");
const submissionRoutes = require("./modules/submissions/submission.routes");

dotenv.config();

const app = express();

app.use(express.json());

app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec)
);

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/submissions", submissionRoutes);

app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Hackathon Platform API is running",
    });
});

// Export app for unified server
module.exports = app;