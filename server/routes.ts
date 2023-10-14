import { ObjectId } from "mongodb";

import { Router, getExpressRouter } from "./framework/router";

import { Comments, Friend, Post, PostLocation, Profile, User, UserLocation, WebSession } from "./app";
import { LocationDoc } from "./concepts/map";
import { PostDoc, PostOptions } from "./concepts/post";
import { ProfileDoc } from "./concepts/profile";
import { UserDoc } from "./concepts/user";
import { WebSessionDoc } from "./concepts/websession";
import Responses from "./responses";

class Routes {
  @Router.get("/session")
  async getSessionUser(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await User.getUserById(user);
  }

  @Router.get("/users")
  async getUsers() {
    return await User.getUsers();
  }

  @Router.get("/users/:username")
  async getUser(username: string) {
    return await User.getUserByUsername(username);
  }

  @Router.get("/profiles")
  async getProfiles() {
    return await Profile.getProfiles();
  }

  @Router.get("/profiles/:username")
  async getProfile(username: string) {
    return await Profile.getProfileByUsername(username);
  }

  @Router.post("/users")
  async createUser(session: WebSessionDoc, username: string, password: string, displayName: string, photo: string, latitude: string, longitude: string) {
    WebSession.isLoggedOut(session);
    const { user } = await User.create(username, password);
    await UserLocation.register(user!._id, latitude, longitude);
    return await Profile.create(user!, displayName, photo);
  }

  @Router.patch("/users")
  async updateUser(session: WebSessionDoc, update: Partial<UserDoc>) {
    const user = WebSession.getUser(session);
    const owner = await User.getUserById(user);
    await User.update(user, update);
    return await Profile.update(owner, { username: update.username });
  }

  @Router.patch("/profiles")
  async updateProfile(session: WebSessionDoc, update: Partial<ProfileDoc>) {
    const user = WebSession.getUser(session);
    const owner = await User.getUserById(user);
    return await Profile.update(owner, update);
  }

  @Router.delete("/users")
  async deleteUser(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    const owner = await User.getUserById(user);
    WebSession.end(session);
    await User.delete(user);
    await UserLocation.delete(user);
    return await Profile.delete(owner);
  }

  @Router.post("/login")
  async logIn(session: WebSessionDoc, username: string, password: string) {
    const u = await User.authenticate(username, password);
    WebSession.start(session, u._id);
    return { msg: "Logged in!" };
  }

  @Router.post("/logout")
  async logOut(session: WebSessionDoc) {
    WebSession.end(session);
    return { msg: "Logged out!" };
  }

  @Router.get("/posts")
  async getPosts(author?: string) {
    let posts;
    if (author) {
      const id = (await User.getUserByUsername(author))._id;
      posts = await Post.getByAuthor(id);
    } else {
      posts = await Post.getPosts({});
    }
    return Responses.posts(posts);
  }

  @Router.post("/posts")
  async createPost(session: WebSessionDoc, content: string, latitude: string, longitude: string, options?: PostOptions) {
    const user = WebSession.getUser(session);
    const created = await Post.create(user, content, options);
    const post = await Responses.post(created.post);
    await PostLocation.register(post!._id, latitude, longitude);
    return { msg: created.msg, post };
  }

  @Router.patch("/posts/:_id")
  async updatePost(session: WebSessionDoc, _id: ObjectId, update: Partial<PostDoc>) {
    const user = WebSession.getUser(session);
    await Post.isAuthor(user, _id);
    return await Post.update(_id, update);
  }

  @Router.delete("/posts/:_id")
  async deletePost(session: WebSessionDoc, _id: ObjectId) {
    const user = WebSession.getUser(session);
    await Post.isAuthor(user, _id);
    const post = await Post.getPosts({ _id }).then((response) => response[0]);
    await PostLocation.delete(post._id);
    return await Post.delete(_id);
  }

  @Router.get("/comments")
  async getComments(author?: string, post?: ObjectId) {
    let comments;
    if (author) {
      const id = (await User.getUserByUsername(author))._id;
      comments = await Comments.getByAuthor(id);
    } else if (post) {
      comments = await Comments.getByTarget(post);
    } else {
      comments = await Comments.getComments({});
    }
    return Responses.comments(comments);
  }

  @Router.post("/comments")
  async createComment(session: WebSessionDoc, target: ObjectId, message: string) {
    const user = WebSession.getUser(session);
    const created = await Comments.create(target, user, message);
    return { msg: created.msg, comment: await Responses.comment(created.comment) };
  }

  @Router.patch("/comments/:_id")
  async updateComment(session: WebSessionDoc, _id: ObjectId, update: Partial<PostDoc>) {
    const user = WebSession.getUser(session);
    await Comments.isAuthor(user, _id);
    return await Comments.update(_id, update);
  }

  @Router.delete("/comments/:_id")
  async deleteComment(session: WebSessionDoc, _id: ObjectId) {
    const user = WebSession.getUser(session);
    await Comments.isAuthor(user, _id);
    return Comments.delete(_id);
  }

  @Router.get("/friends")
  async getFriends(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await User.idsToUsernames(await Friend.getFriends(user));
  }

  @Router.delete("/friends/:friend")
  async removeFriend(session: WebSessionDoc, friend: string) {
    const user = WebSession.getUser(session);
    const friendId = (await User.getUserByUsername(friend))._id;
    return await Friend.removeFriend(user, friendId);
  }

  @Router.get("/friend/requests")
  async getRequests(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await Responses.friendRequests(await Friend.getRequests(user));
  }

  @Router.post("/friend/requests/:to")
  async sendFriendRequest(session: WebSessionDoc, to: string) {
    const user = WebSession.getUser(session);
    const toId = (await User.getUserByUsername(to))._id;
    return await Friend.sendRequest(user, toId);
  }

  @Router.delete("/friend/requests/:to")
  async removeFriendRequest(session: WebSessionDoc, to: string) {
    const user = WebSession.getUser(session);
    const toId = (await User.getUserByUsername(to))._id;
    return await Friend.removeRequest(user, toId);
  }

  @Router.put("/friend/accept/:from")
  async acceptFriendRequest(session: WebSessionDoc, from: string) {
    const user = WebSession.getUser(session);
    const fromId = (await User.getUserByUsername(from))._id;
    return await Friend.acceptRequest(fromId, user);
  }

  @Router.put("/friend/reject/:from")
  async rejectFriendRequest(session: WebSessionDoc, from: string) {
    const user = WebSession.getUser(session);
    const fromId = (await User.getUserByUsername(from))._id;
    return await Friend.rejectRequest(fromId, user);
  }

  @Router.get("/locations/users")
  async getUserLocations() {
    return await UserLocation.getLocations();
  }

  @Router.get("/locations/users/:username")
  async getUserLocation(username: string) {
    const user = await User.getUserByUsername(username);
    return await UserLocation.getLocations(user._id);
  }

  @Router.get("/locations/users/filter/:latitude/:longitude")
  async getUserTargets(latitude: string, longitude: string) {
    return await UserLocation.getTargets({ latitude, longitude });
  }

  @Router.patch("/locations/users")
  async updateUserLocation(session: WebSessionDoc, update: Partial<LocationDoc>) {
    const user = WebSession.getUser(session);
    return await UserLocation.update(user, update);
  }

  @Router.get("/locations/posts")
  async getPostLocations() {
    return await PostLocation.getLocations();
  }

  @Router.get("/locations/posts/:_id")
  async getPostLocation(_id: ObjectId) {
    const post = await Post.getPosts({ _id }).then((response) => response[0]);
    return await PostLocation.getLocations(post._id);
  }

  @Router.get("/locations/posts/filter/:latitude/:longitude")
  async getPostTargets(latitude: string, longitude: string) {
    return await PostLocation.getTargets({ latitude, longitude });
  }

  @Router.patch("/locations/posts/:id")
  async updatePostLocation(session: WebSessionDoc, id: ObjectId, update: Partial<LocationDoc>) {
    const user = WebSession.getUser(session);
    await Post.isAuthor(user, id);
    const post = await Post.getPosts({ _id: id }).then((response) => response[0]);
    return await PostLocation.update(post._id, update);
  }
}

export default getExpressRouter(new Routes());
