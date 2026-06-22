# Firebase Deployment Troubleshooting

The deployment to Firebase Hosting failed during the build process of the Next.js application's server-side rendering function. 

## The Error
The build failed with the following message:
> `Build failed with status: FAILURE. Could not build the function due to a missing permission on the build service account.`

This indicates that the service account used by Cloud Build in your Google Cloud project lacks the necessary permissions to complete the build (such as writing to Artifact Registry or reading storage objects).

## How to Fix It

To resolve this issue, you will need to update the IAM permissions in your Google Cloud Console for the project `bcomtravel`.

### Steps:
1.  Open the **[Google Cloud Console](https://console.cloud.google.com/)**.
2.  Select your project: **bcomtravel** (Project Number: `985377398962`).
3.  Navigate to **IAM & Admin** > **IAM** in the left navigation menu.
4.  Look for a service account that looks like:
    `985377398962@cloudbuild.gserviceaccount.com` (or potentially `985377398962-compute@developer.gserviceaccount.com`).
5.  Ensure that this account has the **Cloud Build Service Account** role assigned.
6.  If that role is present and it still fails, refer to the official troubleshooting documentation for detailed resolution steps:
    [Cloud Functions Build Service Account Troubleshooting](https://cloud.google.com/functions/docs/troubleshooting#build-service-account)

## Summary of Work Done
*   Successfully logged into Firebase.
*   Enabled the `webframeworks` experiment.
*   Resolved a compilation error in `src/app/live/route.ts` caused by a missing export in `@genkit-ai/next/live` by disabling the route (renamed to `route.ts.bak`). The rest of the app compiles successfully.

Once you have updated the permissions, let me know and we can attempt the deployment again!
