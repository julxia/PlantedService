import { ObjectId } from "mongodb";

import { getExpressRouter, Router } from "./framework/router";

import { Comments, Friend, Groups, Post, Profile, User, WebSession } from "./app";
import { CommentDoc } from "./concepts/comments";
import { GroupDoc } from "./concepts/group";
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

  @Router.post("/users")
  async createUser(session: WebSessionDoc, username: string, password: string, displayName: string, photo: string) {
    WebSession.isLoggedOut(session);
    await Profile.create(username, displayName, photo);
    return await User.create(username, password);
  }

  @Router.patch("/users")
  async updateUser(session: WebSessionDoc, update: Partial<UserDoc>) {
    const user = WebSession.getUser(session);
    if (update.username) {
      await Profile.update(user, { username: update.username });
    }
    return await User.update(user, update);
  }

  @Router.delete("/users")
  async deleteUser(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    WebSession.end(session);
    return await User.delete(user);
  }

  @Router.patch("/profile")
  async updateProfile(session: WebSessionDoc, update: Partial<ProfileDoc>) {
    const user = WebSession.getUser(session);
    return await Profile.update(user, update);
  }

  @Router.get("/profile/:username")
  async getProfile(username: string) {
    return await Profile.getProfiles(username);
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
  async createPost(session: WebSessionDoc, content: string, options?: PostOptions) {
    const user = WebSession.getUser(session);
    const created = await Post.create(user, content, options);
    return { msg: created.msg, post: await Responses.post(created.post) };
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
    return Post.delete(_id);
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

  @Router.get("/comments")
  async getComments(author?: string, target?: ObjectId) {
    let comments;
    if (author) {
      const id = (await User.getUserByUsername(author))._id;
      comments = await Comments.getByAuthor(id);
    } else if (target) {
      comments = await Comments.getByTarget(target);
    } else {
      comments = await Comments.getComments({});
    }
    return comments;
  }

  @Router.post("/comments")
  async createComment(session: WebSessionDoc, target: ObjectId, message: string) {
    const user = WebSession.getUser(session);
    const created = await Comments.create(target, user, message);
    return { msg: created.msg, post: created };
  }

  @Router.patch("/comments/:_id")
  async updateComment(session: WebSessionDoc, _id: ObjectId, update: Partial<CommentDoc>) {
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

  @Router.post("/groups")
  async createGroup(session: WebSessionDoc, name: string) {
    const user = WebSession.getUser(session);
    await WebSession.isLoggedIn();
    const created = await Groups.create(user, name);
    return { msg: created.msg, post: created };
  }

  @Router.patch("/groups")
  async updateGroup(session: WebSessionDoc, name: string, update: Partial<GroupDoc>) {
    // check if group name exists
    // check if user is part of the group
    // update group (get a copy of database, compare to update), add and remove members/posts
  }

  @Router.get("/groups/posts")
  async getGroupPosts(session: WebSessionDoc, name: string) {
    // check if group name exists
    // check if user is part of the group
    // get group posts
  }

  @Router.get("/groups/members")
  async getGroupMembers(session: WebSessionDoc, name: string) {
    // check if group name exists
    // check if user is part of the group
    // get group members
  }

  @Router.post("/tags")
  async createTag(session: WebSessionDoc, tag: string) {
    // get user, make sure logged in
    // create tag if tag does not already exist
    // return back to user
  }

  @Router.patch("/tags")
  async updateTag(session: WebSessionDoc, tag: string, update: Partial<GroupDoc>) {
    // user is logged in
    // check if tag name exists for particular user
    // update tag
  }

  @Router.get("/tags/:tagName")
  async getTagMedia(session: WebSessionDoc, tag: string) {
    // based on user logged in
    // get all media under tagName
  }

  @Router.get("/tags")
  async getAllTagNames(session: WebSessionDoc) {
    // check if user logged in
    // get all tag names that they have created
  }
}

export default getExpressRouter(new Routes());
