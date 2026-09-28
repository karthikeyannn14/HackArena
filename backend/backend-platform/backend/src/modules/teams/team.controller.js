const {
    createTeam,
    getTeamsByEvent,
    getMembersByTeam,
    addMemberToTeam,
    removeMemberFromTeam,
} = require("./team.service");

const create = async (req, res) => {
    try {
        const { name, eventId } = req.body;

        if (!name || !eventId) {
            return res.status(400).json({
                success: false,
                message: "Team name and event ID are required",
            });
        }

        const team = await createTeam({
            name,
            eventId,
            ownerId: req.user.userId,
        });


        return res.status(201).json({
            success: true,
            message: "Team created successfully",
            team,
        });
    } catch (error) {
        if (
            error.message === "Event not found" ||
            error.message === "A team with this name already exists in this event"
        ) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        console.error("Create team error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

const getByEvent = async (req, res) => {
    try {
        const teams = await getTeamsByEvent(req.params.eventId);

        return res.status(200).json({
            success: true,
            teams,
        });
    } catch (error) {
        if (error.message === "Event not found") {
            return res.status(404).json({
                success: false,
                message: error.message,
            });
        }

        console.error("Get teams error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

const getMembers = async (req, res) => {
    try {
        const members = await getMembersByTeam(req.params.teamId);

        return res.status(200).json({
            success: true,
            members,
        });
    } catch (error) {
        console.error("Get team members error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

const addMember = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required",
            });
        }

        const member = await addMemberToTeam({
            teamId: req.params.teamId,
            userId,
            requesterId: req.user.userId,
        });

        return res.status(201).json({
            success: true,
            message: "Member added successfully",
            member,
        });
    } catch (error) {
        if (
            error.message === "Team not found" ||
            error.message === "User not found" ||
            error.message === "User is already a member of this team" ||
            error.message === "Only the team owner can add members"
        ) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        console.error("Add team member error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

const removeMember = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required",
            });
        }

        const result = await removeMemberFromTeam({
            teamId: req.params.teamId,
            userId,
            requesterId: req.user.userId,
        });

        return res.status(200).json({
            success: true,
            message: "Member removed successfully",
            result,
        });
    } catch (error) {
        if (
            error.message === "Team not found" ||
            error.message === "Only the team owner can remove members" ||
            error.message === "Team owner cannot be removed" ||
            error.message === "User is not a member of this team"
        ) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        console.error("Remove team member error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

module.exports = {
    create,
    getByEvent,
    getMembers,
    addMember,
    removeMember,
};