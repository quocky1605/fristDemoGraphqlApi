const { validationResult } = require("express-validator");
const Post = require("../models/posts");
const User = require("../models/user");
const fs = require("fs");
const path = require("path");

//get single post
exports.getSinglePost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .then((result) => {
      console.log(result);
      if (!result) {
        const error = new Error("Không tìm thấy bài viết");
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json({ message: "Có bài viết", result });
    })
    .catch((err) => {
      console.log(err);
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

//get all post
exports.getPost = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 3;
  //   let totalPosts;
  try {
    const totalPosts = await Post.find().countDocuments();
    const posts = await Post.find()
      .populate({ path: "creator", select: "email" })
      .skip((currentPage - 1) * perPage)
      .limit(perPage);
    res.status(200).json({
      message: "có dữ liệu",
      posts: posts,
      totalPosts: totalPosts,
    });
  } catch (error) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
  //   Post.find();
};
//create post
exports.createPost = (req, res, next) => {
  console.log(req.userId);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Lỗi nhập liệu, check lại dữ liệu vừa nhập");
    error.statusCode = 422;
    throw error;
  }
  if (!req.file) {
    const error = new Error("file thiếu");
    error.statusCode = 422;
    throw error;
  }

  const imageUrl = req.file.path;
  const title = req.body.title;
  const content = req.body.content;
  let creator;
  const post = new Post({
    title: title,
    imageUrl: imageUrl,
    content: content,
    creator: req.userId,
  });
  post
    .save()
    .then((result) => {
      // console.log(result)
      return User.findById(req.userId);
    })
    .then((user) => {
      creator = user;
      user.posts.push(post);
      return user.save();
    })
    .then((result) => {
      res.status(201).json({
        message: "create post succesfully",
        post: post,
        creator: {
          _id: creator._id,
          name: creator.name,
        },
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.deletePost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .then((post) => {
      if (!post) {
        const error = new Error("cant find post");
        error.statusCode = 404;
        throw error;
      }
      if (post.creator.toString() !== req.userId) {
        const error = new Error("Not authorize");
        error.statusCode = 403;
        throw error;
      }
      console.log(post);
      clearImage(post.imageUrl);
      return Post.findByIdAndRemove(postId);
    })
    .then((result) => {
      // console.log(result)

      return User.findById(req.userId);
    })
    .then((user) => {
      user.posts.pull(postId);
      return user.save();
    })
    .then((result) => {
      res.status(200).json({
        message: "delete success",
      });
    })
    .catch((err) => {
      console.log(err);
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
const clearImage = (filePath) => {
  filePath = path.join(__dirname, "..", filePath);
  fs.unlink(filePath, (err) => console.log(err));
};
