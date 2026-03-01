import Array "mo:core/Array";
import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Int "mo:core/Int";
import Migration "migration";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

(with migration = Migration.run)
actor {
  public type Comment = {
    id : Nat;
    videoId : Text;
    author : Text;
    body : Text;
    timestamp : Int;
  };

  public type UserProfile = {
    name : Text;
    // Additional fields can be added here
  };

  type CommentList = List.List<Comment>;
  type CommentMap = Map.Map<Text, CommentList>;

  module Comment {
    public func compareByTimestamp(comment1 : Comment, comment2 : Comment) : Order.Order {
      Int.compare(comment1.timestamp, comment2.timestamp);
    };
  };

  // Initialize the access control state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  var nextId = 0;
  let commentStore : CommentMap = Map.empty<Text, CommentList>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Comment Management
  public shared ({ caller }) func postComment(videoId : Text, author : Text, body : Text) : async Nat {
    // Only authenticated users can post comments
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can post comments");
    };

    let comment : Comment = {
      id = nextId;
      videoId;
      author;
      body;
      timestamp = Time.now();
    };

    // Add comment
    switch (commentStore.get(videoId)) {
      case (?existingList) {
        existingList.add(comment);
        commentStore.add(videoId, existingList);
      };
      case (null) {
        let list = List.empty<Comment>();
        list.add(comment);
        commentStore.add(videoId, list);
      };
    };

    let currentId = nextId;
    nextId += 1;
    currentId;
  };

  public query ({ caller }) func getComments(videoId : Text) : async [Comment] {
    // Public access - anyone can view comments (including guests)
    switch (commentStore.get(videoId)) {
      case (?commentList) {
        commentList.toArray().sort(Comment.compareByTimestamp);
      };
      case (null) { [] };
    };
  };

  public query ({ caller }) func getCommentCount(videoId : Text) : async Nat {
    // Public access - anyone can view comment counts (including guests)
    switch (commentStore.get(videoId)) {
      case (?commentList) { commentList.size() };
      case (null) { 0 };
    };
  };

  public shared ({ caller }) func deleteComment(commentId : Nat) : async Bool {
    // Admin-only function
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete comments");
    };

    // Remove comment from all video lists
    for ((videoId, comments) in commentStore.entries()) {
      let filtered = comments.filter(func(comment) { comment.id != commentId });
      commentStore.add(videoId, filtered);
    };

    true;
  };
};
