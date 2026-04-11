"use client";

import { useEffect, useState } from "react";
import MessageThreadView from "./MessageThreadView";

const STORAGE_URL_KEY = "mlqc_phone_me_avatar_url";

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
  defaultMyAvatarUrl?: string;
  entries: MessageEntry[];
};

export default function MessageThreadWithMyProfile({
  otherAvatarUrl,
  defaultMyAvatarUrl = "/profile/mc.png",
  entries,
}: Props) {
  const [myAvatarUrl, setMyAvatarUrl] = useState(defaultMyAvatarUrl);

  useEffect(() => {
    const savedUrl = window.localStorage.getItem(STORAGE_URL_KEY);
    if (savedUrl?.trim()) {
      setMyAvatarUrl(savedUrl);
    }
  }, []);

  return (
    <MessageThreadView
      otherAvatarUrl={otherAvatarUrl}
      myAvatarUrl={myAvatarUrl}
      entries={entries}
    />
  );
}