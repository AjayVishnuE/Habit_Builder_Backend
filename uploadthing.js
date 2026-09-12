const { createUploadthing } = require('uploadthing/express');
const { UploadThingError } = require('uploadthing/server');

const jwt = require('jsonwebtoken');
const User = require('./models/User');

const f = createUploadthing();

const uploadRouter = {
    profilePicture: f({
        image: {
            maxFileSize: '2MB',
            maxFileCount: 1,
            minFileCount: 1
        }
    }).middleware(async ({ req }) => {
        /*
         * Get JWT from the same Authorization header
         * used by the rest of the application.
         */
        const authHeader = req.headers.authorization;
        if (
            !authHeader ||
            !authHeader.startsWith('Bearer ')
        ) {
            throw new UploadThingError(
                'Not authorized'
            );
        }
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET
            );
            const user = await User
                .findById(decoded.id)
                .select('-password');
            if (!user) {
                throw new UploadThingError(
                    'User not found'
                );
            }
            /*
             * This metadata is available in
             * onUploadComplete().
             */
            return {
                userId: user._id.toString()
            };
        } catch (error) {
            if (error instanceof UploadThingError) {
                throw error;
            }
            throw new UploadThingError(
                'Not authorized'
            );
        }
    })

    .onUploadComplete(async ({ metadata, file }) => {
        const user = await User.findById(
            metadata.userId
        );
        if (!user) {
            throw new UploadThingError(
                'User not found'
            );
        }
        /*
         * Store the permanent UploadThing URL
         * in MongoDB.
         */
        user.profileImage = file.ufsUrl;
        await user.save();
        console.log(
            `Profile image updated for user ${metadata.userId}`
        );
        console.log(
            `Image URL: ${file.ufsUrl}`
        );
        return {
            profileImage: file.ufsUrl
        };
    })
};


module.exports = {
    uploadRouter
};