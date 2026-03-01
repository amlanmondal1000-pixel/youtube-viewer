import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Comment } from "../backend.d";
import { useActor } from "./useActor";

export function useGetComments(videoId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Comment[]>({
    queryKey: ["comments", videoId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getComments(videoId);
    },
    enabled: !!actor && !isFetching,
  });
}

export function usePostComment(videoId: string) {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      author,
      body,
    }: {
      author: string;
      body: string;
    }) => {
      if (!actor) throw new Error("No actor available");
      return actor.postComment(videoId, author, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", videoId] });
    },
  });
}

export type { Comment };
