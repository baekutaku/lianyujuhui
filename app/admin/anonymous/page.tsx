import { supabase } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/utils/admin-auth";
import { redirect } from "next/navigation";
import {
  approveAnonymousMessage,
  deleteAnonymousMessage,
} from "@/app/admin/actions";

export default async function AdminAnonymousPage() {
  const admin = await isAdmin();
  if (!admin) redirect("/admin/login");

  const { data } = await supabase
    .from("anonymous_messages")
    .select("id, nickname, content, is_private, is_approved, created_at")
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });

  const items = data ?? [];

  return (
    <main>
      <h1>익명함 관리</h1>

      <div style={{ display: "grid", gap: 12 }}>
        {items.map((item) => (
          <article key={item.id} style={{ padding: 16, border: "1px solid #ddd" }}>
            <p>{item.nickname || "익명"}</p>
            <p>{item.content}</p>
            <p>
              {item.is_private ? "비공개" : "공개 가능"} /{" "}
              {item.is_approved ? "승인됨" : "대기중"}
            </p>

            {!item.is_private ? (
              <form action={approveAnonymousMessage}>
                <input type="hidden" name="id" value={item.id} />
                <input
                  type="hidden"
                  name="approved"
                  value={item.is_approved ? "false" : "true"}
                />
                <button type="submit">
                  {item.is_approved ? "승인취소" : "공개승인"}
                </button>
              </form>
            ) : null}

            <form action={deleteAnonymousMessage}>
              <input type="hidden" name="id" value={item.id} />
              <button type="submit">삭제</button>
            </form>
          </article>
        ))}
      </div>
    </main>
  );
}

