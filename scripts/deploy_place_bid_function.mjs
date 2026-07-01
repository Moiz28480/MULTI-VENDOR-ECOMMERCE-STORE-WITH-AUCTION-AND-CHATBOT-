import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client, Functions } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const endpoint = String(process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1').trim();
const projectId = String(process.env.APPWRITE_PROJECT_ID || '69bf4532001c55de99e2').trim();
const apiKey = String(process.env.APPWRITE_API_KEY || '').trim();

const desiredFunctionId = 'placeBid';
const desiredFunctionName = 'placeBid';
const runtime = String(process.env.APPWRITE_FUNCTION_RUNTIME || 'node-22').trim();
const requiredScopes = [
  'documents.read',
  'documents.write',
  'databases.read',
  'databases.write',
  'collections.read',
  'collections.write',
];

const deploymentArchivePath = path.resolve(repoRoot, 'functions', 'placeBid.tar.gz');
const envLocalPath = path.resolve(repoRoot, '.env.local');

if (!apiKey) {
  console.error('Missing APPWRITE_API_KEY environment variable.');
  process.exit(1);
}

if (!fs.existsSync(deploymentArchivePath)) {
  console.error(`Deployment archive not found: ${deploymentArchivePath}`);
  process.exit(1);
}

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const functions = new Functions(client);

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const upsertVariable = async (functionId, key, value, secret = false) => {
  const list = await functions.listVariables({ functionId });
  const existing = (list?.variables || []).find((entry) => String(entry?.key || '') === key);

  if (existing) {
    await functions.updateVariable({
      functionId,
      variableId: existing.$id,
      key,
      value,
      secret,
    });
    return 'updated';
  }

  await functions.createVariable({
    functionId,
    key,
    value,
    secret,
  });
  return 'created';
};

const writeEnvLocalFunctionId = (functionId) => {
  const targetLine = `VITE_PLACE_BID_FUNCTION_ID=${functionId}`;

  if (!fs.existsSync(envLocalPath)) {
    fs.writeFileSync(envLocalPath, `${targetLine}\n`, 'utf8');
    return;
  }

  const current = fs.readFileSync(envLocalPath, 'utf8');

  if (/^VITE_PLACE_BID_FUNCTION_ID=.*$/m.test(current)) {
    const next = current.replace(/^VITE_PLACE_BID_FUNCTION_ID=.*$/m, targetLine);
    fs.writeFileSync(envLocalPath, next, 'utf8');
    return;
  }

  const suffix = current.endsWith('\n') ? '' : '\n';
  fs.writeFileSync(envLocalPath, `${current}${suffix}${targetLine}\n`, 'utf8');
};

const waitForDeployment = async (functionId, deploymentId) => {
  const maxAttempts = 60;

  for (let i = 1; i <= maxAttempts; i += 1) {
    const deployment = await functions.getDeployment({ functionId, deploymentId });
    const status = String(deployment?.status || '').toLowerCase();

    if (status === 'ready') {
      return deployment;
    }

    if (status === 'failed' || status === 'canceled') {
      throw new Error(`Deployment ended with status: ${status}`);
    }

    if (i % 5 === 0) {
      console.log(`Waiting for deployment build... attempt ${i}/${maxAttempts} (status=${status || 'processing'})`);
    }

    await wait(3000);
  }

  throw new Error('Deployment timed out while waiting for ready status.');
};

const ensureFunction = async () => {
  const list = await functions.list({ queries: [], total: true });
  const existingById = (list?.functions || []).find((fn) => String(fn?.$id || '') === desiredFunctionId);
  const existingByName = (list?.functions || []).find((fn) => String(fn?.name || '') === desiredFunctionName);
  const existing = existingById || existingByName;

  if (existing) {
    console.log(`Using existing function: ${existing.$id} (${existing.name})`);

    const updated = await functions.update({
      functionId: existing.$id,
      name: desiredFunctionName,
      runtime,
      execute: ['users'],
      entrypoint: 'src/main.js',
      commands: 'npm install',
      enabled: true,
      logging: true,
      scopes: requiredScopes,
    });

    return updated;
  }

  console.log('Creating new function placeBid...');
  return functions.create({
    functionId: desiredFunctionId,
    name: desiredFunctionName,
    runtime,
    execute: ['users'],
    entrypoint: 'src/main.js',
    commands: 'npm install',
    enabled: true,
    logging: true,
    scopes: requiredScopes,
  });
};

const main = async () => {
  const fn = await ensureFunction();
  const functionId = String(fn?.$id || desiredFunctionId);

  const variablePairs = [
    ['APPWRITE_API_KEY', apiKey, true],
    ['APPWRITE_FUNCTION_ENDPOINT', endpoint, false],
    ['APPWRITE_FUNCTION_PROJECT_ID', projectId, false],
    ['APPWRITE_ENDPOINT', endpoint, false],
    ['APPWRITE_PROJECT_ID', projectId, false],
    ['APPWRITE_DATABASE_ID', '69c1cfaf003a710f1232', false],
    ['APPWRITE_AUCTIONS_COLLECTION_ID', 'auctions', false],
    ['APPWRITE_BIDS_COLLECTION_ID', 'bids', false],
  ];

  for (const [key, value, secret] of variablePairs) {
    const result = await upsertVariable(functionId, key, String(value), Boolean(secret));
    console.log(`Variable ${key}: ${result}`);
  }

  console.log('Uploading new deployment from functions/placeBid.tar.gz ...');
  const codeFile = InputFile.fromPath(deploymentArchivePath, 'placeBid.tar.gz');
  const deployment = await functions.createDeployment({
    functionId,
    code: codeFile,
    activate: true,
    entrypoint: 'src/main.js',
    commands: 'npm install',
  });

  console.log(`Deployment queued: ${deployment.$id}`);
  await waitForDeployment(functionId, deployment.$id);

  await functions.updateFunctionDeployment({
    functionId,
    deploymentId: deployment.$id,
  });

  writeEnvLocalFunctionId(functionId);

  console.log('SUCCESS');
  console.log(`FUNCTION_ID=${functionId}`);
  console.log(`DEPLOYMENT_ID=${deployment.$id}`);
  console.log('Updated .env.local with VITE_PLACE_BID_FUNCTION_ID');
};

main().catch((err) => {
  console.error('DEPLOYMENT_FAILED');
  console.error(err?.message || err);
  process.exit(1);
});
