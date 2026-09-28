const {
    createSubmission,
    getSubmissionByProject,
    getSubmissionsByEvent,
} = require("./submission.service");

const create = async (req, res) => {
    try {
        const {
            projectId,
            teamId,
            eventId,
            title,
            description,
            repositoryUrl,
            demoUrl,
        } = req.body;

        if (!projectId || !teamId || !eventId || !title || !description) {
            return res.status(400).json({
                success: false,
                message:
                    "Project ID, team ID, event ID, title, and description are required",
            });
        }

        const submission = await createSubmission({
            projectId,
            teamId,
            eventId,
            title,
            description,
            repositoryUrl,
            demoUrl,
            userId: req.user.userId,
        });

        return res.status(201).json({
            success: true,
            message: "Submission created successfully",
            submission,
        });
    } catch (error) {
        const clientErrors = [
            "Event not found",
            "Team not found in this event",
            "Project not found for this team and event",
            "You are not a member of this team",
            "This project already has a submission",
            "The submission deadline has passed",
        ];

        if (clientErrors.includes(error.message)) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        console.error("Create submission error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

const getByProject = async (req, res) => {
    try {
        const submission = await getSubmissionByProject(req.params.projectId);

        if (!submission) {
            return res.status(404).json({
                success: false,
                message: "Submission not found",
            });
        }

        return res.status(200).json({
            success: true,
            submission,
        });
    } catch (error) {
        console.error("Get submission error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

const getByEvent = async (req, res) => {
    try {
        const submissions = await getSubmissionsByEvent(req.params.eventId);

        return res.status(200).json({
            success: true,
            submissions,
        });
    } catch (error) {
        if (error.message === "Event not found") {
            return res.status(404).json({
                success: false,
                message: error.message,
            });
        }

        console.error("Get event submissions error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

module.exports = {
    create,
    getByProject,
    getByEvent,
};