const {
    createProject,
    getProjectByTeam,
} = require("./project.service");

const create = async (req, res) => {
    try {
        const {
            name,
            description,
            eventId,
            teamId,
        } = req.body;

        if (!name || !description || !eventId || !teamId) {
            return res.status(400).json({
                success: false,
                message:
                    "Project name, description, event ID, and team ID are required",
            });
        }

        const project = await createProject({
            name,
            description,
            eventId,
            teamId,
            userId: req.user.userId,
        });



        return res.status(201).json({
            success: true,
            message: "Project created successfully",
            project,
        });
    } catch (error) {
        if (
            error.message === "Event not found" ||
            error.message === "Team not found in this event" ||
            error.message === "You are not a member of this team" ||
            error.message === "This team already has a project"
        ) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        console.error("Create project error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

const getByTeam = async (req, res) => {
    try {
        const project = await getProjectByTeam(req.params.teamId);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found",
            });
        }

        return res.status(200).json({
            success: true,
            project,
        });
    } catch (error) {
        console.error("Get project error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

module.exports = {
    create,
    getByTeam,
};