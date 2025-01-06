import { userModel } from "../models/user.model.js";

const getUserData = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required to retrieve user data.",
      });
    }

    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No user found with the provided ID.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User retrieved successfully",
      userData: {
        name: user.name,
        isAccountVerified: user.isAccountVerified,
      },
    });
  } catch (error) {
    console.log("Error in getUserData controller:", error);
    return res.status(500).json({
      success: false,
      message:
        "An unexpected error occurred while retrieving the user data. Please try again later.",
    });
  }
};

export { getUserData };
