import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminKeys, allowlistQuery, friendlyError } from "@/lib/admin-data";
import { ErrorBlock, LoadingBlock, Panel } from "./Panel";

export function AdminsManager({ myEmail }: { myEmail: string }) {
  const qc = useQueryClient();
  const list = useQuery(allowlistQuery);
  const [email, setEmail] = useState("");

  const add = useMutation({
    mutationFn: async (e: string) => {
      const { error } = await supabase.from("admin_allowlist").insert({ email: e });
      if (error) throw new Error(/duplicate/i.test(error.message) ? "That email is already on the list." : friendlyError(error.message));
    },
    onSuccess: () => {
      setEmail("");
      toast.success("Added. They can now sign in and claim admin access.");
      qc.invalidateQueries({ queryKey: adminKeys.allowlist });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (e: string) => {
      const { error } = await supabase.from("admin_allowlist").delete().eq("email", e);
      if (error) throw new Error(friendlyError(error.message));
    },
    onSuccess: () => {
      toast.success("Removed — their admin access is revoked.");
      qc.invalidateQueries({ queryKey: adminKeys.allowlist });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const v = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) {
      toast.error("Enter a valid email address.");
      return;
    }
    add.mutate(v);
  };

  return (
    <Panel
      title="Admin access"
      description="Only emails on this list can become admins, and only after verifying their email. Removing an email revokes access immediately."
    >
      <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor="admin-email">Add co-admin email</Label>
          <Input id="admin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="friend@example.com" />
        </div>
        <Button type="submit" variant="hero" disabled={add.isPending}>
          {add.isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <UserPlus aria-hidden="true" />} Add
        </Button>
      </form>

      <div className="mt-6">
        {list.isPending ? (
          <LoadingBlock />
        ) : list.isError ? (
          <ErrorBlock message="Couldn't load the admin list." onRetry={() => list.refetch()} />
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border">
            {list.data.map((row) => {
              const isMe = row.email === myEmail.toLowerCase();
              return (
                <li key={row.email} className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="min-w-0 truncate">
                    {row.email} {isMe ? <span className="ml-1 text-xs text-primary">(you)</span> : null}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={isMe || remove.isPending}
                    onClick={() => remove.mutate(row.email)}
                    aria-label={`Remove ${row.email}`}
                    title={isMe ? "You can't remove yourself" : undefined}
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Panel>
  );
}