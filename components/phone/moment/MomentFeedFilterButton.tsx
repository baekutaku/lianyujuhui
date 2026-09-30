"use client";

import { useState } from "react";
import MomentFilterModal from "@/components/phone/moment/MomentFilterModal";

type AuthorOption = {
  key: string;
  label: string;
};

type MomentFeedFilterButtonProps = {
  basePath: string;
  showAuthor?: boolean;
  authorOptions?: AuthorOption[];
  selectedAuthor?: string;
  selectedCategories?: string[];
  selectedReply?: "all" | "replied" | "unreplied";
  selectedYears?: string[];
  availableYears: string[];
};

export default function MomentFeedFilterButton({
  basePath,
  showAuthor = false,
  authorOptions = [],
  selectedAuthor = "all",
  selectedCategories = [],
  selectedReply = "all",
  selectedYears = [],
  availableYears,
}: MomentFeedFilterButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
       className="phone-topbar-icon-button moment-filter-trigger"
        aria-label="필터"
        title="필터"
        onClick={() => setOpen(true)}
      >
        <span className="material-symbols-rounded">search</span>
      </button>

      <MomentFilterModal
        open={open}
        onClose={() => setOpen(false)}
        basePath={basePath}
        showAuthor={showAuthor}
        authorOptions={authorOptions}
        selectedAuthor={selectedAuthor}
        selectedCategories={selectedCategories}
        selectedReply={selectedReply}
        selectedYears={selectedYears}
        availableYears={availableYears}
      />
    </>
  );
}