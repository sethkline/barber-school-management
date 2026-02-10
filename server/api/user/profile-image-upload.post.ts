// server/api/user/profile-image-upload.post.ts
import { defineEventHandler, readMultipartFormData, getCookie, createError } from 'h3'
import { uploadFileToS3, getPresignedUrl } from '~/server/utils/s3Client'
import { cognitoService } from '~/server/utils/cognitoClient'

export default defineEventHandler(async (event) => {
  try {
    // Get the access token
    const accessToken = getCookie(event, 'access_token')

    if (!accessToken) {
      throw createError({
        statusCode: 401,
        message: 'Unauthorized'
      })
    }

    // Get current user from Cognito
    const currentUser = await cognitoService.getUser(accessToken)

    if (!currentUser) {
      throw createError({
        statusCode: 401,
        message: 'User not found'
      })
    }

    // Read the multipart form data
    const formData = await readMultipartFormData(event)

    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No file provided'
      })
    }

    const file = formData[0]
    const fileData = file.data
    const contentType = file.type || 'image/jpeg'

    // Upload to S3 with a key based on the user ID
    const s3Key = `profile-images/${currentUser.id}/profile.jpg`
    await uploadFileToS3(fileData, s3Key, contentType)

    // Get a presigned URL for the uploaded image (7 days)
    const imageUrl = await getPresignedUrl(s3Key, 60 * 60 * 24 * 7)

    // Update profile image URL in Cognito
    await cognitoService.adminUpdateUser(currentUser.email, {
      profileImageUrl: imageUrl
    })

    return {
      success: true,
      imageUrl
    }
  } catch (error: any) {
    console.error('Profile image upload error:', error)

    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to upload profile image'
    })
  }
})
