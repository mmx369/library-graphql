const config = require('./config');
const { ApolloServer, UserInputError, gql } = require('apollo-server');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'secred';

const mongoose = require('mongoose');
const Book = require('./models/book');
const Author = require('./models/author');
const User = require('./models/user');

mongoose.set('useFindAndModify', false);

console.log('connecting to MongoDB');

mongoose
  .connect(config.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('connected to MongoDB');
  })
  .catch((error) => {
    console.log('error connection to MongoDB:', error.message);
  });

const typeDefs = gql`
  type Authors {
    name: String
    born: Int
    id: ID
    bookCountOfAuthor: Int
  }

  type User {
    username: String!
    favoriteGenre: String!
    id: ID!
  }

  type Token {
    value: String!
  }

  type Books {
    title: String!
    author: Authors!
    genres: [String!]
    published: Int
    id: ID!
  }

  type Query {
    allBooksCount: Int!
    allAuthorsCount: Int!
    allBooks: [Books!]!
    allAuthors: [Authors!]!
    allBooksByAuthor(name: String!): [Books]
    allBooksByGenre(name: String!): [Books]
    allBooksByAuthorAndGenre(name: String!, genre: String!): [Books]
    me: User
  }

  type Mutation {
    editAuthor(name: String!, setBornTo: Int!): Authors
    addBook(
      title: String!
      author: String!
      genres: [String!]
      published: Int
    ): Books
    createUser(username: String!, favoriteGenre: String!): User
    login(username: String!, password: String!): Token
  }
`;

const resolvers = {
  Query: {
    allBooksCount: () => Book.collection.countDocuments(),
    allAuthorsCount: () => Author.collection.countDocuments(),
    allBooks: () => Book.find({}).populate('author', { name: 1, born: 1 }),

    allAuthors: () => Author.find({}),

    me: (root, args, context) => {
      return context.currentUser;
    },

    allBooksByAuthor: (root, args) => {
      return Author.find({ name: args.name }).then((res) => {
        const id = res[0]._id;
        return Book.find({ author: id });
      });
    },

    allBooksByGenre: (root, args) => {
      return Book.find({ genres: { $in: [args.name] } });
    },

    allBooksByAuthorAndGenre: async (root, args) => {
      const authorId = await Author.find({ name: args.name });
      return await Book.find({
        author: authorId[0].id,
        genres: { $in: [args.genre] },
      });
    },
  },

  Authors: {
    // bookCountOfAuthor: (root) => {
    //   console.log("11111_root", root.name);
    //   const res = Book.filter((el) => el.author === root.name).length;
    //   return res;
    // },

    bookCountOfAuthor: async (root) => {
      // const authorId = await Author.find({ name: root.name });
      // const id = authorId.map((el) => el.id);
      // console.log(3333, authorId);
      // console.log(4444, id);
      // const test = await Book.find({});
      // // console.log(4444, root.name);
      // // console.log(4545, test);
      // const res = test.filter((el) => el.author === id).length;
      // console.log(5555, res);
      return 10;
    },
  },

  Mutation: {
    createUser: (root, args) => {
      console.log(7777, args);
      const user = new User({
        username: args.username,
        favoriteGenre: args.favoriteGenre,
      });

      return user.save().catch((error) => {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        });
      });
    },

    login: async (root, args) => {
      const user = await User.findOne({ username: args.username });

      if (!user || args.password !== 'secred') {
        throw new UserInputError('wrong credentials');
      }

      const userForToken = {
        username: user.username,
        id: user._id,
      };

      return { value: jwt.sign(userForToken, JWT_SECRET) };
    },

    addBook: async (root, args, context) => {
      const currentUser = context.currentUser;

      if (!currentUser) {
        throw new AuthenticationError('not authenticated');
      }
      const isAuthor = await Author.find({ name: args.author });
      let authorId;
      if (!isAuthor.length) {
        const author = new Author({
          name: args.author,
        });
        await author.save();
        authorId = await Author.find({ name: args.author });
      } else {
        authorId = isAuthor;
      }

      const book = new Book({
        title: args.title,
        author: authorId[0]._id,
        genres: args.genres,
        published: args.published,
      });
      console.log(3333, book);
      try {
        await book.save();
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        });
      }
      return book;
    },

    editAuthor: async (root, args, context) => {
      const currentUser = context.currentUser;
      if (!currentUser) {
        throw new AuthenticationError('not authenticated');
      }
      const author = await Author.findOne({ name: args.name });
      console.log(author);
      author.born = args.setBornTo;

      try {
        await author.save();
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        });
      }
      return author;
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    const auth = req ? req.headers.authorization : null;
    if (auth && auth.toLowerCase().startsWith('bearer ')) {
      const decodedToken = jwt.verify(auth.substring(7), JWT_SECRET);
      const currentUser = await User.findById(decodedToken.id);
      return { currentUser };
    }
  },
});

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`);
});
