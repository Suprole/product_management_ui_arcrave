#!/usr/bin/env bash

set -euo pipefail

# 例:
# PROJECT_ID=my-project REGION=asia-northeast1 REPOSITORY=app-images IMAGE=read-models-export \
# JOB_NAME=read-models-export ./scripts/deploy-cloud-run-read-models.sh

: "${PROJECT_ID:?PROJECT_ID is required}"
: "${REGION:?REGION is required}"
: "${REPOSITORY:?REPOSITORY is required}"
: "${IMAGE:?IMAGE is required}"
: "${JOB_NAME:?JOB_NAME is required}"

ROOT_DIR="$(cd "$(dirname "$0")/../../.." && pwd)"
IMAGE_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${IMAGE}"

echo "Building image: ${IMAGE_URI}"
gcloud builds submit "${ROOT_DIR}" \
  --config "${ROOT_DIR}/apps/web/cloudbuild.read-models.yaml" \
  --substitutions "_IMAGE_URI=${IMAGE_URI}"

echo "Deploying Cloud Run Job: ${JOB_NAME}"
gcloud run jobs deploy "${JOB_NAME}" \
  --image "${IMAGE_URI}" \
  --region "${REGION}" \
  --command pnpm \
  --args=-C,apps/web,export:read-models

cat <<EOF

Next steps:
1. Add envs to the job:
   gcloud run jobs update ${JOB_NAME} --region ${REGION} --set-env-vars GAS_API_BASE=...,GAS_API_KEY=...,GCS_JSON_BUCKET=...,GCS_JSON_PREFIX=read-models/v1,GCS_PROJECT_ID=...

2. Run once manually:
   gcloud run jobs execute ${JOB_NAME} --region ${REGION} --wait

3. Create a scheduler:
   gcloud scheduler jobs create http ${JOB_NAME}-every-5m \\
     --location ${REGION} \\
     --schedule "*/5 * * * *" \\
     --uri "https://run.googleapis.com/apis/run.googleapis.com/v1/namespaces/${PROJECT_ID}/jobs/${JOB_NAME}:run" \\
     --http-method POST \\
     --oauth-service-account-email <scheduler-sa@${PROJECT_ID}.iam.gserviceaccount.com>
EOF
