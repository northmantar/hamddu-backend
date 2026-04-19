import { InfisicalSDK } from '@infisical/sdk';

/**
 * NestJS ConfigModule async loader.
 * Fetches all secrets from Infisical and returns them as a flat key-value map
 * so they are accessible via ConfigService just like regular .env variables.
 *
 * Required env vars (set these in your minimal local .env or deployment secrets):
 *   INFISICAL_SITE_URL      - e.g. https://infisical.example.com
 *   INFISICAL_PROJECT_ID    - Project ID from Infisical dashboard
 *   INFISICAL_ENVIRONMENT   - e.g. production, staging, dev
 *
 * Auth — provide ONE of the following:
 *   Option A (Universal Auth / Machine Identity):
 *     INFISICAL_CLIENT_ID
 *     INFISICAL_CLIENT_SECRET
 *   Option B (Access Token):
 *     INFISICAL_ACCESS_TOKEN
 */
export async function infisicalLoader(): Promise<Record<string, string>> {
  const siteUrl = process.env.INFISICAL_SITE_URL;
  const projectId = process.env.INFISICAL_PROJECT_ID;
  const environment = process.env.INFISICAL_ENVIRONMENT;

  if (!siteUrl || !projectId || !environment) {
    throw new Error(
      'Missing required Infisical env vars: INFISICAL_SITE_URL, INFISICAL_PROJECT_ID, INFISICAL_ENVIRONMENT',
    );
  }

  const client = new InfisicalSDK({ siteUrl });

  const accessToken = process.env.INFISICAL_ACCESS_TOKEN;
  const clientId = process.env.INFISICAL_CLIENT_ID;
  const clientSecret = process.env.INFISICAL_CLIENT_SECRET;

  if (accessToken) {
    client.auth().accessToken(accessToken);
  } else if (clientId && clientSecret) {
    await client.auth().universalAuth.login({ clientId, clientSecret });
  } else {
    throw new Error(
      'Infisical auth not configured. Set either INFISICAL_ACCESS_TOKEN or both INFISICAL_CLIENT_ID and INFISICAL_CLIENT_SECRET.',
    );
  }

  const { secrets } = await client.secrets().listSecrets({
    projectId,
    environment,
    secretPath: '/',
    recursive: true,
  });

  return Object.fromEntries(
    secrets.map((s) => [s.secretKey, s.secretValue]),
  );
}
