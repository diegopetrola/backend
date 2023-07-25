const express = require("express");
const { PrismaClient } = require("@prisma/client");
require("dotenv").config();
const session = require("express-session");
var MongoDBStore = require("connect-mongodb-session")(session);

const prisma = new PrismaClient();
const app = express();

var store = new MongoDBStore({
  uri: process.env.DATABASE_URL,
  collection: "sessions",
});
// Catch errors
store.on("error", function (error) {
  console.log(error);
});

// Initialize sesssion storage.
app.use(
  session({
    store: store,
    resave: true, // required: force lightweight session keep alive (touch)
    saveUninitialized: true, // recommended: only save session when data exists
    secret: process.env.SECRET,
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 30 }, // 30 days
  })
);

app.use(express.json());

app.get(`/`, async (req, res) => {
  if (req.session?.user) {
    res.json(`Welcome ${req.session.user}`);
  } else {
    res.status(500);
    res.json("Unauthorized");
  }
});

app.get(`/hello`, async (req, res) => {
  res.json("Hello there!");
});

app.get(`/login`, async (req, res) => {
  if (req.session.userid) {
    res.redirect("/");
  } else {
    req.session.user = "quest";
    res.status(200);
    res.json({ msg: "Welcome" });
  }
});

app.get(`/logout`, async (req, res) => {
  req.session.destroy();
  res.json("Logged off");
});

app.post(`/post`, async (req, res) => {
  const { description, image, amount } = req.body;
  const result = await prisma.post.create({
    data: {
      description,
      amount,
      image,
    },
  });
  res.json(result);
});

app.put("/post/:id", async (req, res) => {
  const { id, value, image } = req.body;

  try {
    const updatedPost = await prisma.post.update({
      where: { id },
      data: { value: value || undefined, image: image || undefined },
    });
    res.json(updatedPost);
  } catch (error) {
    res.json({ error: `Post with ID ${id} does not exist in the database` });
  }
});

const server = app.listen(3000, () =>
  console.log(`
🚀 Server ready at: http://localhost:3000
⭐️ See sample requests: http://pris.ly/e/js/rest-express#3-using-the-rest-api`)
);
