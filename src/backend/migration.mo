import Map "mo:core/Map";
import List "mo:core/List";
import Nat "mo:core/Nat";

module {
  type OldActor = {
    videoComments : Map.Map<Text, [OldComment]>;
    nextId : Nat;
  };
  type NewActor = {
    commentStore : Map.Map<Text, List.List<NewComment>>;
    nextId : Nat;
  };

  // Use type from old actor version
  public type OldComment = {
    id : Nat;
    videoId : Text;
    displayName : Text;
    body : Text;
    timestamp : Int;
  };

  // Use type from new actor version
  public type NewComment = {
    id : Nat;
    videoId : Text;
    author : Text;
    body : Text;
    timestamp : Int;
  };

  // Transform old comment type to new one.
  func oldCommentToNew(oldComment : OldComment) : NewComment {
    {
      oldComment with
      author = oldComment.displayName;
    };
  };

  public func run(old : OldActor) : NewActor {
    let newMap = old.videoComments.map<Text, [OldComment], List.List<NewComment>>(
      func(_videoId, oldComments) {
        // Convert old comments to new comment type and list
        let newCommentsList = List.empty<NewComment>();
        for (oldComment in oldComments.values()) {
          let newComment = oldCommentToNew(oldComment);
          newCommentsList.add(newComment);
        };
        newCommentsList;
      }
    );
    { commentStore = newMap; nextId = old.nextId };
  };
};
