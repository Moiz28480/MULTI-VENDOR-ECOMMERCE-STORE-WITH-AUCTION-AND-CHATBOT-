import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client, Functions } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import archiver from 'archiver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const projectId = String(process.env.APPWRITE_PROJECT_ID || '69bf4532001c55de99e2').trim();
const endpoint = String(process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1').trim();
const apiKey = String(process.env.APPWRITE_API_KEY || '').trim();
const runtime = String(process.env.APPWRITE_FUNCTION_RUNTIME || 'node-22').trim();
const geminiApiKey = String(process.env.GEMINI_API_KEY || '').trim();

const functionId = String(process.env.APPWRITE_CHATBOT_FUNCTION_ID || 'chatbot').trim();
const functionName = 'Chatbot AI';
const deploymentArchivePath = path.join(rootDir, 'functions', 'chatbot.tar.gz');
const chatbotFunctionDir = path.join(rootDir, 'functions', 'chatbot');

if (!apiKey) {
  console.error('APPWRITE_API_KEY is required in environment.');
  process.exit(1);
}

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const functions = new Functions(client);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const createArchive = async () => {
  await new Promise((resolve, reject) => {
    const output = fs.createWriteStream(deploymentArchivePath);
    const archive = archiver('tar', { gzip: true });

    output.on('close', resolve);
    output.on('error', reject);
    archive.on('error', reject);

    archive.pipe(output);
    archive.directory(path.join(chatbotFunctionDir, 'src'), 'src');
    archive.file(path.join(chatbotFunctionDir, 'package.json'), { name: 'package.json' });
    archive.finalize();
  });

  console.log(`Created archive: ${deploymentArchivePath}`);
};

const listFunctions = async () => {
  const out = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const page = await functions.list({ limit, offset });
    const batch = page?.functions || [];
    out.push(...batch);

    if (batch.length < limit) {
      break;
    }

    offset += batch.length;
  }

  return out;
};

const upsertVariable = async (targetFunctionId, key, value, secret = false) => {
  const vars = await functions.listVariables(targetFunctionId);
  const existing = (vars?.variables || []).find((v) => v.key === key);

  if (existing) {
    await functions.updateVariable({
      functionId: targetFunctionId,
      variableId: existing.$id,
      key,
      value,
      secret,
    });
    return 'updated';
  }

  await functions.createVariable({
    functionId: targetFunctionId,
    key,
    value,
    secret,
  });
  return 'created';
};

const ensureFunction = async () => {
  const existingFunctions = await listFunctions();
  const existing = existingFunctions.find((f) => f.$id === functionId || f.name === functionName);

  const requiredScopes = ['documents.read', 'documents.write', 'collections.read', 'databases.read'];

  if (existing) {
    console.log(`Using existing function: ${existing.$id} (${existing.name})`);

    const updated = await functions.update({
      functionId: existing.$id,
      name: functionName,
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

  console.log('Creating new function chatbot...');
  return functions.create({
    functionId,
    name: functionName,
    runtime,
    execute: ['users'],
    entrypoint: 'src/main.js',
    commands: 'npm install',
    enabled: true,
    logging: true,
    scopes: requiredScopes,
  });
};

const waitForDeploymentReady = async (targetFunctionId, deploymentId, maxAttempts = 180) => {
  for (let i = 1; i <= maxAttempts; i += 1) {
    const dep = await functions.getDeployment({ functionId: targetFunctionId, deploymentId });
    const status = String(dep?.status || '').toLowerCase();

    if (status === 'ready') {
      return dep;
    }

    if (status === 'failed' || status === 'canceled') {
      throw new Error(`Deployment status is ${status}`);
    }

    if (i % 5 === 0) {
      console.log(`Waiting for deployment... attempt ${i}/${maxAttempts} (status=${status || 'processing'})`);
    }

    await sleep(1000);
  }

  throw new Error('Timed out waiting for deployment readiness.');
};

const writeFrontendEnv = async (targetFunctionId) => {
  const envLocalPath = path.join(rootDir, '.env.local');
  let content = '';

  if (fs.existsSync(envLocalPath)) {
    content = fs.readFileSync(envLocalPath, 'utf8');
  }

  const line = `VITE_CHATBOT_FUNCTION_ID=${targetFunctionId}`;

  if (/^VITE_CHATBOT_FUNCTION_ID=.*$/m.test(content)) {
    content = content.replace(/^VITE_CHATBOT_FUNCTION_ID=.*$/m, line);
  } else {
    content = `${content}${content && !content.endsWith('\n') ? '\n' : ''}${line}\n`;
  }

  fs.writeFileSync(envLocalPath, content, 'utf8');
  console.log('Updated .env.local with chatbot function id');
};

const main = async () => {
  await createArchive();

  const fn = await ensureFunction();
  const targetFunctionId = String(fn?.$id || functionId);

  const variablePairs = [
    ['APPWRITE_API_KEY', apiKey, true],
    ['APPWRITE_ENDPOINT', endpoint, false],
    ['APPWRITE_PROJECT_ID', projectId, false],
    ['APPWRITE_DATABASE_ID', '69c1cfaf003a710f1232', false],
    ['DATABASE_ID', '69c1cfaf003a710f1232', false],
    ...(geminiApiKey ? [['GEMINI_API_KEY', geminiApiKey, true]] : []),
  ];

  for (const [key, value, secret] of variablePairs) {
    const result = await upsertVariable(targetFunctionId, key, String(value || ''), Boolean(secret));
    console.log(`Variable ${key}: ${result}`);
  }

  console.log('Uploading new deployment from functions/chatbot.tar.gz ...');
  const codeFile = InputFile.fromPath(deploymentArchivePath, 'chatbot.tar.gz');
  const deployment = await functions.createDeployment({
    functionId: targetFunctionId,
    code: codeFile,
    activate: true,
    entrypoint: 'src/main.js',
    commands: 'npm install',
  });

  console.log(`Deployment created: ${deployment.$id}`);
  await waitForDeploymentReady(targetFunctionId, deployment.$id);
  console.log('Deployment is ready');

  await writeFrontendEnv(targetFunctionId);

  console.log('SUCCESS');
  console.log(`Function ID: ${targetFunctionId}`);
};

main().catch((err) => {
  console.error('Deployment failed:', err?.message || String(err));
  process.exit(1);
});
