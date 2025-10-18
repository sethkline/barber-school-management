import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { useRuntimeConfig } from '#imports'

export const getS3Client = () => {
  const config = useRuntimeConfig()

  return new S3Client({
    region: config.awsRegion,
    credentials: {
      accessKeyId: config.awsAccessKeyId,
      secretAccessKey: config.awsSecretAccessKey,
    },
  })
}

export const uploadFileToS3 = async (file: Buffer, key: string, contentType: string) => {
  const config = useRuntimeConfig()
  const client = getS3Client()

  const command = new PutObjectCommand({
    Bucket: config.awsS3Bucket,
    Key: key,
    Body: file,
    ContentType: contentType,
  })

  await client.send(command)
  return key
}

export const deleteFileFromS3 = async (key: string) => {
  const config = useRuntimeConfig()
  const client = getS3Client()

  const command = new DeleteObjectCommand({
    Bucket: config.awsS3Bucket,
    Key: key,
  })

  await client.send(command)
}

export const getPresignedUrl = async (key: string, expiresIn: number = 3600) => {
  const config = useRuntimeConfig()
  const client = getS3Client()

  const command = new GetObjectCommand({
    Bucket: config.awsS3Bucket,
    Key: key,
  })

  return await getSignedUrl(client, command, { expiresIn })
}
