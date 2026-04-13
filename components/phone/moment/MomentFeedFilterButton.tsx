"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import MomentFilterModal from "@/components/phone/moment/MomentFilterModal";

type MomentFeedFilterButtonProps = {
  basePath: string;
  selectedAuthor?: string;
  selectedCategory?: string;
  selectedYear?: string;
  availableYears: string[];
  showAuthor?: boolean;
};

export default function MomentFeedFilterButton({
  basePath,
  selectedAuthor = "all",
  selectedCategory = "all",
  selectedYear = "",
  availableYears,
  showAuthor = true,
}: MomentFeedFilterButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draftAuthor, setDraftAuthor] = useState(selectedAuthor);
  const [draftCategory, setDraftCategory] = useState(selectedCategory);
  const [draftYear, setDraftYear] = useState(selectedYear);

  const href = useMemo(() => {
    const params = new URLSearchParams();

    if (showAuthor && draftAuthor !== "all") {
      params.set("author", draftAuthor);
    }

    if (draftCategory !== "all") {
      params.set("category", draftCategory);
    }

    if (draftYear) {
      params.set("year", draftYear);
    }

    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  }, [basePath, draftAuthor, draftCategory, draftYear, showAuthor]);

  const handleReset = () => {
    setDraftAuthor("all");
    setDraftCategory("all");
    setDraftYear("");
  };

  const handleApply = () => {
    router.push(href);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        className="phone-topbar-icon-button"
        aria-label="필터"
        title="필터"
        onClick={() => setOpen(true)}
      >
        <span className="material-symbols-rounded">search</span>
      </button>

      <MomentFilterModal
        open={open}
        selectedAuthor={draftAuthor}
        selectedCategory={draftCategory}
        selectedYear={draftYear}
        availableYears={availableYears}
        showAuthor={showAuthor}
        onAuthorChange={setDraftAuthor}
        onCategoryChange={setDraftCategory}
        onYearChange={setDraftYear}
        onClose={() => setOpen(false)}
        onApply={handleApply}
        onReset={handleReset}
      />
    </>
  );
}