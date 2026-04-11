"use client";

import MessageThreadView from "./MessageThreadView";

type TextEntry = {
  type: "text";
  side: "left" | "right";
  text: string;
};

type ImageEntry = {
  type: "image";
  side: "left" | "right";
  url: string;
  caption?: string;
};

type AudioEntry = {
  type: "audio";
  side: "left" | "right";
  url: string;
  duration?: string;
  transcript?: string;
};

type SystemEntry = {
  type: "system";
  text: string;
};

type ChoiceOption =
  | string
  | {
      id?: string;
      label: string;
      result?: MessageEntry[];
    };

type ChoiceEntry = {
  type: "choice";
  options: ChoiceOption[];
  selectedIndex?: number;
};

type MessageEntry =
  | TextEntry
  | ImageEntry
  | AudioEntry
  | SystemEntry
  | ChoiceEntry;

type Props = {
  otherAvatarUrl: string;
  entries: MessageEntry[];
};

export default function MessageThreadWithMyProfile({
  otherAvatarUrl,
  entries,
}: Props) {
  return <MessageThreadView avatarUrl={otherAvatarUrl} entries={entries} />;
}