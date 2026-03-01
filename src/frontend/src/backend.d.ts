import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Comment {
    id: bigint;
    body: string;
    author: string;
    timestamp: bigint;
    videoId: string;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteComment(commentId: bigint): Promise<boolean>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCommentCount(videoId: string): Promise<bigint>;
    getComments(videoId: string): Promise<Array<Comment>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    postComment(videoId: string, author: string, body: string): Promise<bigint>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
}
