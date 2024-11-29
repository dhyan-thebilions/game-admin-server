Parse.Cloud.define("checkUserCredentials", async (request) => {
    const { username, password } = request.params;

    try {
        // Log in the user using the provided credentials
        const user = await Parse.User.logIn(username, password);

        // Fetch the user's game data (assuming there's a GameSession table related to the user)
        const GameSession = Parse.Object.extend("GameSession");
        const query = new Parse.Query(GameSession);
        query.equalTo("userId", user); // Assuming 'user' is a pointer to the User in the GameSession table

        const gameSessions = await query.find();

        // Format the game data as needed
        const formattedGameSessions = gameSessions.map((session) => {
            return {
                sessionId: session.id,
                gameCatalogId: session.get("gameCatalogueId"), // Assuming gameCatalogId is a field in GameSession
                balanceOnEnter: session.get("balanceOnEnter"),
                balanceOnExit: session.get("balanceOnExit"),
                totalPlayed: session.get("totalPlayed"),
                totalWin: session.get("totalWin"),
            };
        });

        // Return user and their game data
        return {
            status: "success",
            userData: {
                id: user.id,
                username: user.get("username"),
                email: user.get("email"),
                balance: user.get("balance"),
                createdAt: user.get("createdAt"),
                updatedAt: user.get("updatedAt"),
            },
            gameData: formattedGameSessions,
        };
    } catch (error) {
        // Handle different error types
        if (error instanceof Parse.Error) {
            // Return the error if it's a Parse-specific error
            return {
                status: "error",
                code: error.code,
                message: error.message,
            };
        } else {
            // Handle any unexpected errors
            return {
                status: "error",
                code: 500,
                message: "An unexpected error occurred.",
            };
        }
    }
});

Parse.Cloud.define("createGameConfigData", async (request) => {
    const { gameName, gameRtp, reelName } = request.params;

    // Validate the input
    if (
        !gameName ||
        !gameRtp ||
        !Array.isArray(reelName) ||
        reelName.length === 0
    ) {
        throw new Error("Missing or invalid required fields");
    }

    // Convert gameRtp to a number (ensure it’s a valid number)
    const numericRtp = parseFloat(gameRtp);

    // Check if gameRtp is a valid number
    if (isNaN(numericRtp)) {
        throw new Error("Invalid gameRtp value, it must be a valid number");
    }

    // Create a new GameDetails object
    const GameDetails = Parse.Object.extend("GameConfig");
    const gameDetails = new GameDetails();

    // Set the fields for gameName and gameRtp
    gameDetails.set("gameName", gameName);
    gameDetails.set("gameRtp", numericRtp);

    // Process the reelName array (array of objects with sub-objects like reelOne, reelTwo, etc.)
    const processedReels = reelName.map((reel) => {
        // For each reel, ensure that the object is structured with the expected reel name as a key
        const reelKey = Object.keys(reel)[0]; // e.g., 'reelOne', 'reelTwo'
        const reelValues = reel[reelKey]; // e.g., { L1: 5, L2: 3, ... }

        // Ensure the reel object has valid structure (you can add more validation as needed)
        if (!reelValues || typeof reelValues !== "object") {
            throw new Error("Each reel must contain valid symbol values");
        }

        // Convert all the symbol values (like L1, L2, M1, etc.) to numbers
        const convertedReelValues = Object.keys(reelValues).reduce(
            (acc, symbol) => {
                // Convert each symbol value to a number
                acc[symbol] = parseFloat(reelValues[symbol]);

                // Check if the value is a valid number
                if (isNaN(acc[symbol])) {
                    throw new Error(
                        `Invalid value for symbol ${symbol} in ${reelKey}, must be a valid number`
                    );
                }

                return acc;
            },
            {}
        );

        return {
            [reelKey]: convertedReelValues, // Save the reel with the converted values
        };
    });

    // Set the reelName field (array of objects with sub-objects)
    gameDetails.set("reelName", processedReels);

    try {
        // Save the GameDetails object to Parse
        const savedGameDetails = await gameDetails.save();
        return savedGameDetails; // Return the saved object to the client
    } catch (error) {
        // Handle different error types
        if (error instanceof Parse.Error) {
            // Return the error if it's a Parse-specific error
            return {
                status: "error",
                code: error.code,
                message: error.message,
            };
        } else {
            // Handle any unexpected errors
            return {
                status: "error",
                code: 500,
                message: "An unexpected error occurred.",
            };
        }
    }
});

Parse.Cloud.define("updateGameConfigData", async (request) => {
    const { objectId, gameName, gameRtp, reelName } = request.params;

    // Validate the input
    if (
        !gameName ||
        !gameRtp ||
        !Array.isArray(reelName) ||
        reelName.length === 0
    ) {
        throw new Error("Missing or invalid required fields");
    }

    // Convert gameRtp to a number (ensure it’s a valid number)
    const numericRtp = parseFloat(gameRtp);

    // Check if gameRtp is a valid number
    if (isNaN(numericRtp)) {
        throw new Error("Invalid gameRtp value, it must be a valid number");
    }

    // Create a new GameDetails object
    const GameDetails = Parse.Object.extend("GameConfig");
    const query = new Parse.Query(GameDetails);
    query.equalTo("objectId", objectId);

    try {
        const existingGameDetails = await query.first(); // Get the first matching object

        if (!existingGameDetails) {
            throw new Error("Game not found, unable to update");
        }

        // Update  the fields for gameName and gameRtp
        existingGameDetails.set("gameName", gameName);
        existingGameDetails.set("gameRtp", numericRtp);

        // Process the reelName array (array of objects with sub-objects like reelOne, reelTwo, etc.)
        const processedReels = reelName.map((reel) => {
            // For each reel, ensure that the object is structured with the expected reel name as a key
            const reelKey = Object.keys(reel)[0]; // e.g., 'reelOne', 'reelTwo'
            const reelValues = reel[reelKey]; // e.g., { L1: 5, L2: 3, ... }

            // Ensure the reel object has valid structure (you can add more validation as needed)
            if (!reelValues || typeof reelValues !== "object") {
                throw new Error("Each reel must contain valid symbol values");
            }

            // Convert all the symbol values (like L1, L2, M1, etc.) to numbers
            const convertedReelValues = Object.keys(reelValues).reduce(
                (acc, symbol) => {
                    // Convert each symbol value to a number
                    acc[symbol] = parseFloat(reelValues[symbol]);

                    // Check if the value is a valid number
                    if (isNaN(acc[symbol])) {
                        throw new Error(
                            `Invalid value for symbol ${symbol} in ${reelKey}, must be a valid number`
                        );
                    }

                    return acc;
                },
                {}
            );

            return {
                [reelKey]: convertedReelValues, // Save the reel with the converted values
            };
        });

        // Set the updated reelName field (array of objects with sub-objects)
        existingGameDetails.set("reelName", processedReels);

        // Save the updated GameDetails object to Parse
        const savedGameDetails = await existingGameDetails.save();

        return savedGameDetails;
    } catch (error) {
        // Handle different error types
        if (error instanceof Parse.Error) {
            // Return the error if it's a Parse-specific error
            return {
                status: "error",
                code: error.code,
                message: error.message,
            };
        } else {
            // Handle any unexpected errors
            return {
                status: "error",
                code: 500,
                message: "An unexpected error occurred.",
            };
        }
    }
});

Parse.Cloud.define("createUser", async (request) => {
    const { username, name, email, balance, password } = request.params;

    if (!username || !email || !password) {
        throw new Parse.Error(
            400,
            "Missing required fields: username, email, or password"
        );
    }

    try {
        // Create a new Parse User
        const user = new Parse.User();
        user.set("username", username);
        user.set("name", name);
        user.set("email", email);
        user.set("balance", balance);
        user.set("password", password);

        // Save the user
        await user.signUp(null, { useMasterKey: true });

        return { success: true, message: "User created successfully!" };
    } catch (error) {
        // Handle different error types
        if (error instanceof Parse.Error) {
            // Return the error if it's a Parse-specific error
            return {
                status: "error",
                code: error.code,
                message: error.message,
            };
        } else {
            // Handle any unexpected errors
            return {
                status: "error",
                code: 500,
                message: "An unexpected error occurred.",
            };
        }
    }
});

Parse.Cloud.define("updateUser", async (request) => {
    const { userId, username, name, email, balance } = request.params;

    try {
        // Find the user by ID
        const userQuery = new Parse.Query(Parse.User);
        userQuery.equalTo("objectId", userId);
        const user = await userQuery.first({ useMasterKey: true });

        if (!user) {
            throw new Parse.Error(404, `User with ID ${userId} not found`);
        }

        // Update the user fields
        user.set("username", username);
        user.set("name", name);
        user.set("email", email);
        user.set("balance", parseFloat(balance));

        // Save the user
        await user.save(null, { useMasterKey: true });

        return { success: true, message: "User updated successfully" };
    } catch (error) {
        // Handle different error types
        if (error instanceof Parse.Error) {
            // Return the error if it's a Parse-specific error
            return {
                status: "error",
                code: error.code,
                message: error.message,
            };
        } else {
            // Handle any unexpected errors
            return {
                status: "error",
                code: 500,
                message: "An unexpected error occurred.",
            };
        }
    }
});

Parse.Cloud.define("deleteUser", async (request) => {

    const { userId } = request.params;

    if (!userId) {
        throw new Error("User ID is required to delete the user.");
    }

    try {
        // Query the user
        const query = new Parse.Query(Parse.User);
        query.equalTo("objectId", userId);
        const user = await query.first({ useMasterKey: true });

        if (!user) {
            throw new Error("User not found.");
        }

        // Delete the user
        await user.destroy({ useMasterKey: true });

        // Fetch remaining users
        const remainingUsersQuery = new Parse.Query(Parse.User);
        const remainingUsers = await remainingUsersQuery.find({ useMasterKey: true });

        return {
            success: true,
            message: `User with ID ${userId} has been deleted.`,
            data: remainingUsers.map((user) => ({
                id: user.id,
                username: user.get("username"),
                email: user.get("email"),
                name: user.get("name"),
                balance: user.get("balance"),
            })),
        };
    } catch (error) {
        throw new Error(`Failed to delete user: ${error.message}`);
    }
});


Parse.Cloud.define("getUserById", async (request) => {
    const { userId } = request.params;

    if (!userId) {
        throw new Parse.Error(400, "Missing required parameter: userId");
    }

    try {
        const query = new Parse.Query(Parse.User);
        query.select("username", "email", "name", "balance");
        query.equalTo("objectId", userId);

        const user = await query.first({ useMasterKey: true });

        if (!user) {
            throw new Parse.Error(404, `User with ID ${userId} not found`);
        }

        // Return user data
        return {
            id: user.id,
            username: user.get("username"),
            email: user.get("email"),
            name: user.get("name"),
            balance: user.get("balance"),
        };
    } catch (error) {
        // Handle different error types
        if (error instanceof Parse.Error) {
            // Return the error if it's a Parse-specific error
            return {
                status: "error",
                code: error.code,
                message: error.message,
            };
        } else {
            // Handle any unexpected errors
            return {
                status: "error",
                code: 500,
                message: "An unexpected error occurred.",
            };
        }
    }
});

Parse.Cloud.define("fetchAllUsers", async (request) => {
    try {
        const userQuery = new Parse.Query(Parse.User);
        userQuery.select("username", "name", "email", "lastLoginIp", "balance");
        const allUsers = await userQuery.find({ useMasterKey: true });
        return allUsers.map((user) => ({
            id: user.id,
            username: user.get("username"),
            name: user.get("name"),
            email: user.get("email"),
            lastLoginIp: user.get("lastLoginIp"),
            balance: user.get("balance"),
        }));
    } catch (error) {
        // Handle different error types
        if (error instanceof Parse.Error) {
            // Return the error if it's a Parse-specific error
            return {
                status: "error",
                code: error.code,
                message: error.message,
            };
        } else {
            // Handle any unexpected errors
            return {
                status: "error",
                code: 500,
                message: "An unexpected error occurred.",
            };
        }
    }
});

// ##### UNITY SIDE FUNCTION #####
Parse.Cloud.define("fetchGameRtpData", async (request) => {
    try {
        const { gameName } = request.params;

        // Check if parameters are provided
        if (!gameName) {
            throw new Parse.Error(
                Parse.Error.VALIDATION_ERROR,
                "Please Provide Game Name."
            );
        }

        // Create a query on the 'GameRtp' class
        const gamertp = Parse.Object.extend("GameConfig");
        const query = new Parse.Query(gamertp);
        query.equalTo("gameName", gameName);

        // Execute the query to find matching records
        const results = await query.find();

        // If no results found, return a message
        if (results.length === 0) {
            return {
                status: "error",
                message: `No records found for Game Name: ${gameName}`,
            };
        }

        // Prepare the data to be returned
        const data = results.map((result) => {
            return {
                id: result.id,
                gameName: result.get("gameName"),
                gameRtp: result.get("gameRtp"),
                reelName: result.get("reelName"),
            };
        });

        // Return user and their game data
        return {
            status: "success",
            gameRtpData: data,
        };
    } catch (error) {
        // Handle different error types
        if (error instanceof Parse.Error) {
            // Return the error if it's a Parse-specific error
            return {
                status: "error",
                code: error.code,
                message: error.message,
            };
        } else {
            // Handle any unexpected errors
            return {
                status: "error",
                code: 500,
                message: "An unexpected error occurred.",
            };
        }
    }
});

Parse.Cloud.define("uploadJsonToS3", async (request) => {
    const AWS = require("aws-sdk");

    AWS.config.update({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.S3_REGION,
    });

    const { fileName, folderName, fileType, fileContent } = request.params;

    // Create an S3 client
    const s3 = new AWS.S3();

    const params = {
        Bucket: process.env.S3_BUCKET,
        Key: `${folderName}/${fileName}`,
        Body: Buffer.from(fileContent, "base64"),
        ContentType: fileType || "application/octet-stream", // Use provided file type or default
    };
    try {
        const data = await s3.upload(params).promise();
        return { success: true, message: "File uploaded successfully", data };
    } catch (error) {
        // Handle different error types
        if (error instanceof Parse.Error) {
            // Return the error if it's a Parse-specific error
            return {
                status: "error",
                code: error.code,
                message: error.message,
            };
        } else {
            // Handle any unexpected errors
            return {
                status: "error",
                code: 500,
                message: "An unexpected error occurred.",
            };
        }
    }
});

Parse.Cloud.beforeSave("Test", () => {
    throw new Parse.Error(9001, "Saving test objects is not available.");
});
