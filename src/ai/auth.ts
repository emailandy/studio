'use server';

import { GoogleAuth } from 'google-auth-library';

export async function getVertexToken() {
  try {
    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    return token.token;
  } catch (error) {
    console.error('Failed to get Vertex AI token:', error);
    return null;
  }
}
