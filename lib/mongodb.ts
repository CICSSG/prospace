import { MongoClient } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
const fallbackUri = process.env.MONGODB_URI_FALLBACK;
const options = {
  appName: "devrel.template.nextjs",
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 15000,
  retryReads: false,
  readPreference: "secondaryPreferred" as const,
};

let clientPromise: Promise<MongoClient>;

const connectWithUri = async (connectionUri: string) => {
  const mongoClient = new MongoClient(connectionUri, options);
  await mongoClient.connect();
  return mongoClient;
};

const createClientPromise = async () => {
  try {
    return await connectWithUri(uri);
  } catch (error) {
    const isSrvLookupFailure =
      error instanceof Error &&
      /querySrv|ECONNREFUSED/i.test(error.message);

    if (isSrvLookupFailure && fallbackUri) {
      console.warn(
        "Mongo SRV lookup failed. Retrying with MONGODB_URI_FALLBACK.",
      );
      return connectWithUri(fallbackUri);
    }

    throw error;
  }
};

// Use a global singleton in both development (survives HMR) and production
// (survives multiple invocations of the same serverless function instance).
const globalWithMongo = global as typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};

if (!globalWithMongo._mongoClientPromise) {
  const promise = createClientPromise();
  globalWithMongo._mongoClientPromise = promise;
  // Clear the cache on failure so the next request gets a fresh attempt
  // instead of immediately re-throwing the cached rejection forever.
  promise.catch(() => {
    if (globalWithMongo._mongoClientPromise === promise) {
      globalWithMongo._mongoClientPromise = undefined;
    }
  });
}
clientPromise = globalWithMongo._mongoClientPromise;

export default clientPromise;
