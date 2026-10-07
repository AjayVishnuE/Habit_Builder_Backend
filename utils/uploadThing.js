const { UTApi } = require('uploadthing/server');

const utapi = new UTApi();

const deleteUploadThingFile = async (fileUrl) => {
    if (!fileUrl) {
        return;
    }

    try {
        const url = new URL(fileUrl);

        // Expected UploadThing URL:
        // https://<app-id>.ufs.sh/f/<fileKey>
        const parts = url.pathname.split('/').filter(Boolean);

        if (parts.length < 2 || parts[0] !== 'f') {
            console.warn('Could not extract UploadThing file key:', fileUrl);
            return;
        }

        const fileKey = parts.slice(1).join('/');

        await utapi.deleteFiles(fileKey);

        console.log('Deleted UploadThing profile image:', fileKey);

    } catch (error) {
        console.error(
            'Failed to delete UploadThing profile image:',
            error
        );

        throw error;
    }
};

module.exports = {
    deleteUploadThingFile
};