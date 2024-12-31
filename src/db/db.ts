import { MongoClient, ServerApiVersion } from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";


const mongoUri = `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_CLUSTER}/?retryWrites=true&w=majority&appName=Cluster-deepway`;
// const mongoUri = `mongodb://0.0.0.0:27017`;

export const runDb = async () => {
  console.log(process.env.NODE_ENV === 'production')
  let client;

  if(process.env.NODE_ENV === 'production') {

    client = new MongoClient(mongoUri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
      tlsAllowInvalidCertificates: true,
    });
    
    try {
      await client.connect();
      await client.db("articles").command({ ping: 1 });
      console.log("Connected successfuly to mongo server");
    } catch (error) {
      console.error("Ошибка при подключении к базе данных", error);
      await client.close();
    }
  } else {
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    client = new MongoClient(uri);
    await client.connect();
  }

  return client
};
