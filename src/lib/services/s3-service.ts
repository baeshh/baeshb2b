import {
  PutObjectCommand,
  GetObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function getS3() {
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const bucket = process.env.AWS_S3_BUCKET;
  if (!region || !accessKeyId || !secretAccessKey || !bucket) {
    return null;
  }
  return {
    client: new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
    }),
    bucket,
  };
}

export async function createPresignedUpload(input: {
  key: string;
  contentType: string;
  contentLength?: number;
}) {
  const cfg = getS3();
  if (!cfg) {
    throw new Error("S3 is not configured");
  }
  const cmd = new PutObjectCommand({
    Bucket: cfg.bucket,
    Key: input.key,
    ContentType: input.contentType,
    ...(input.contentLength
      ? { ContentLength: input.contentLength }
      : {}),
  });
  const url = await getSignedUrl(cfg.client, cmd, { expiresIn: 3600 });
  return { url, bucket: cfg.bucket, key: input.key };
}

export async function createPresignedGet(key: string) {
  const cfg = getS3();
  if (!cfg) throw new Error("S3 is not configured");
  const cmd = new GetObjectCommand({ Bucket: cfg.bucket, Key: key });
  return getSignedUrl(cfg.client, cmd, { expiresIn: 900 });
}

export function buildS3ObjectKey(parts: {
  institutionId: string;
  programId?: string | null;
  filename: string;
}) {
  const safe = parts.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const prefix = parts.programId
    ? `${parts.institutionId}/${parts.programId}`
    : parts.institutionId;
  return `${prefix}/${Date.now()}-${randomSuffix()}-${safe}`;
}

function randomSuffix() {
  return Math.random().toString(36).slice(2, 8);
}
