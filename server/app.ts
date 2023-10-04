import CommentsConcept from "./concepts/comments";
import FriendConcept from "./concepts/friend";
import GroupConcept from "./concepts/group";
import PostConcept from "./concepts/post";
import ProfileConcept from "./concepts/profile";
import UserConcept from "./concepts/user";
import WebSessionConcept from "./concepts/websession";

// App Definition using concepts
export const WebSession = new WebSessionConcept();
export const User = new UserConcept();
export const Post = new PostConcept();
export const Friend = new FriendConcept();
export const Profile = new ProfileConcept();
export const Comments = new CommentsConcept();
export const Groups = new GroupConcept();
// export const Tag = new TagConcept();
// export const ExpiringResource = new ExpiringResourceConcept();
