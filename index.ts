import {
  Application,
  Router,
  RouterContext,
} from 'https://deno.land/x/oak@v6.2.0/mod.ts';
import { applyGraphQL, gql } from 'https://deno.land/x/oak_graphql/mod.ts';
import { config } from 'https://deno.land/x/dotenv/mod.ts';
import 'https://deno.land/x/dotenv/load.ts';

import { Database, PostgresConnector } from 'https://deno.land/x/denodb/mod.ts';
import Dog from './models/Dog.ts';

const env = config();

const { DB_NAME, DB_HOST, DB_USER, DB_PASSWORD } = env;

const connector = new PostgresConnector({
  database: DB_NAME,
  host: DB_HOST,
  username: DB_USER,
  password: DB_PASSWORD,
  port: 5432, // optional
});

const db = new Database(connector);

db.link([Dog]);

const app = new Application();

app.use(async (ctx, next) => {
  await next();
  const rt = ctx.response.headers.get('X-Response-Time');
  console.log(`${ctx.request.method} ${ctx.request.url} - ${rt}`);
});

app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  ctx.response.headers.set('X-Response-Time', `${ms}ms`);
});

const types = gql`
  type Dog {
    name: String!
    breed: String!
    id: ID!
  }

  input DogInput {
    name: String!
    breed: String!
  }

  type Query {
    getDogById(id: String!): [Dog]!
    getAllDogs: [Dog!]!
  }

  type Mutation {
    addDog(input: DogInput): Dog!
  }
`;

const resolvers = {
  Query: {
    getAllDogs: async (
      _: undefined,
      __: undefined,
      ctx: undefined,
      ___: undefined
    ) => {
      const dogs = await Dog.all();
      return dogs;
    },
    getDogById: async (
      _: undefined,
      args: { id: string },
      ctx: undefined,
      ___: undefined
    ) => {
      const dog = await Dog.where('id', args.id).get();
      return dog;
    },
  },
  Mutation: {
    addDog: async (
      _: undefined,
      { input: { name, breed } }: any,
      context: any,
      info: any
    ) => {
      const dog = await Dog.create({ name, breed });
      return dog;
    },
  },
};

const GraphQLService = await applyGraphQL<Router>({
  Router,
  typeDefs: types,
  resolvers,
  context: (ctx: RouterContext) => {
    return { ctx };
  },
});

app.use(GraphQLService.routes(), GraphQLService.allowedMethods());

console.log('Server started at http://localhost:8080');
await app.listen({ port: 8080 });
