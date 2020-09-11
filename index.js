const { ApolloServer, gql } = require("apollo-server");
const { v4: uuidv4 } = require("uuid");

let authors = [
  {
    name: "Robert Martin",
    id: "afa51ab0-344d-11e9-a414-719c6709cf3e",
    born: 1952,
  },
  {
    name: "Martin Fowler",
    id: "afa5b6f0-344d-11e9-a414-719c6709cf3e",
    born: 1963,
  },
  {
    name: "Fyodor Dostoevsky",
    id: "afa5b6f1-344d-11e9-a414-719c6709cf3e",
    born: 1821,
  },
  {
    name: "Joshua Kerievsky", // birthyear not known
    id: "afa5b6f2-344d-11e9-a414-719c6709cf3e",
  },
  {
    name: "Sandi Metz", // birthyear not known
    id: "afa5b6f3-344d-11e9-a414-719c6709cf3e",
  },
];

let books = [
  {
    title: "Clean Code",
    published: 2008,
    author: "Robert Martin",
    id: "afa5b6f4-344d-11e9-a414-719c6709cf3e",
    genres: ["refactoring"],
  },
  {
    title: "Agile software development",
    published: 2002,
    author: "Robert Martin",
    id: "afa5b6f5-344d-11e9-a414-719c6709cf3e",
    genres: ["agile", "patterns", "design"],
  },
  {
    title: "Refactoring, edition 2",
    published: 2018,
    author: "Martin Fowler",
    id: "afa5de00-344d-11e9-a414-719c6709cf3e",
    genres: ["refactoring"],
  },
  {
    title: "Refactoring to patterns",
    published: 2008,
    author: "Joshua Kerievsky",
    id: "afa5de01-344d-11e9-a414-719c6709cf3e",
    genres: ["refactoring", "patterns"],
  },
  {
    title: "Practical Object-Oriented Design, An Agile Primer Using Ruby",
    published: 2012,
    author: "Sandi Metz",
    id: "afa5de02-344d-11e9-a414-719c6709cf3e",
    genres: ["refactoring", "design"],
  },
  {
    title: "Crime and punishment",
    published: 1866,
    author: "Fyodor Dostoevsky",
    id: "afa5de03-344d-11e9-a414-719c6709cf3e",
    genres: ["classic", "crime"],
  },
  {
    title: "The Demon ",
    published: 1872,
    author: "Fyodor Dostoevsky",
    id: "afa5de04-344d-11e9-a414-719c6709cf3e",
    genres: ["classic", "revolution"],
  },
];

const typeDefs = gql`
  type Authors {
    name: String
    born: Int
    id: ID
    bookCountOfAuthor: Int
  }

  type Books {
    title: String!
    author: String!
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
  }

  type Mutation {
    editAuthor(name: String!, setBornTo: Int!): Authors
    addBook(
      title: String!
      author: String!
      genres: [String!]
      published: Int
    ): Books
  }
`;

const resolvers = {
  Query: {
    allBooksCount: () => books.length,
    allAuthorsCount: () => authors.length,
    allBooks: () => books,
    allAuthors: () => {
      return authors;
    },
    allBooksByAuthor: (root, args) => {
      return books.filter((a) => a.author === args.name);
    },
    allBooksByGenre: (root, args) => {
      return books.filter((a) => a.genres.includes(args.name));
    },
    allBooksByAuthorAndGenre: (root, args) => {
      const authorList = books.filter((a) => a.author === args.name);
      return authorList.filter((a) => a.genres.includes(args.genre));
    },
  },

  Authors: {
    bookCountOfAuthor: (root) => {
      console.log(11111, root);
      const res = books.filter((el) => el.author === root.name).length;
      return res;
    },
  },

  Mutation: {
    addBook: (root, args) => {
      const book = { ...args, id: uuidv4() };
      books = books.concat(book);
      return book;
    },

    editAuthor: (root, args) => {
      const author = authors.find((p) => p.name === args.name);
      if (!author) {
        return null;
      }

      const updatedAuthor = { ...author, born: args.setBornTo };
      authors = authors.map((p) => (p.name === args.name ? updatedAuthor : p));
      return updatedAuthor;
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`);
});
