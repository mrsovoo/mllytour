import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  CornerUpLeft,
  ImagePlus,
  Loader2,
  MessageCircle,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";
import { apiUrl } from "@/shared/api/client";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { cn } from "@/shared/lib/utils";

type SupportAttachment = { name: string; type: string; dataUrl: string };
type SupportReply = { _id: string; text: string } | null;
type SupportMessage = {
  _id: string;
  role: "user" | "support";
  authorName?: string;
  text: string;
  attachment?: SupportAttachment | null;
  replyTo?: SupportReply;
  automated?: boolean;
  createdAt: number;
};

/** Suhbatga xush kelibsiz xabari — bazaga yozilmaydi, faqat ko'rsatiladi. */
const GREETING: SupportMessage = {
  _id: "greeting",
  role: "support",
  authorName: "Millytour",
  text: "Assalomu alaykum! Qanday yordam bera olamiz? Savolingizni yozing yoki rasm yuboring.",
  attachment: null,
  replyTo: null,
  createdAt: 0,
};

/** Rasmni brauzerda kichraytiradi — biriktirma kichik hajmda saqlanadi. */
async function resizeImage(file: File, max = 1000, quality = 0.75): Promise<SupportAttachment> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Rasmni o'qib bo'lmadi"));
    reader.readAsDataURL(file);
  });
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Rasm yuklanmadi"));
      img.src = dataUrl;
    });
    const scale = Math.min(1, max / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return { name: file.name, type: file.type || "image/jpeg", dataUrl };
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return {
      name: file.name,
      type: "image/jpeg",
      dataUrl: canvas.toDataURL("image/jpeg", quality),
    };
  } catch {
    return { name: file.name, type: file.type || "image/jpeg", dataUrl };
  }
}

export function SupportChat({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { isAuthenticated, user } = useAuth();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState<SupportAttachment | null>(null);
  const [replyTo, setReplyTo] = useState<SupportMessage | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    const response = await fetch(apiUrl("/api/support/thread"), { credentials: "include" });
    if (!response.ok) return;
    const data = await response.json().catch(() => ({}));
    if (Array.isArray(data.messages)) setMessages(data.messages);
  }, [isAuthenticated]);

  // Suhbat ochilganda va keyin har 4 sekundda yangi xabarlar olinadi.
  useEffect(() => {
    if (!open || !isAuthenticated) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- setState await'dan keyin chaqiriladi
    load();
    const timer = window.setInterval(load, 4000);
    return () => window.clearInterval(timer);
  }, [open, isAuthenticated, load]);

  const thread = useMemo<SupportMessage[]>(
    () => [GREETING, ...messages],
    [messages],
  );

  useEffect(() => {
    const node = listRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [thread.length, open]);

  const pickFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Faqat rasm yuborish mumkin");
      return;
    }
    setError(null);
    setAttachment(await resizeImage(file));
  };

  const send = async () => {
    if (sending) return;
    if (!text.trim() && !attachment) return;
    setSending(true);
    setError(null);
    try {
      const response = await fetch(apiUrl("/api/support/send"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          text: text.trim(),
          attachment,
          replyTo: replyTo ? { _id: replyTo._id, text: replyTo.text || "Rasm" } : null,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Xabar yuborilmadi");
      setText("");
      setAttachment(null);
      setReplyTo(null);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Xabar yuborilmadi");
    } finally {
      setSending(false);
    }
  };

  const authorName = user?.name || user?.email || "Siz";

  return (
    <AnimatePresence>
      {open && (
        <motion.section
          key="support"
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          aria-label="Qo'llab-quvvatlash suhbati"
          className="glass-card fixed right-3 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-50 flex h-[min(78vh,720px)] w-[min(94vw,400px)] flex-col overflow-hidden rounded-3xl sm:right-5 sm:bottom-24"
        >
          <header className="flex items-center gap-3 bg-gradient-to-r from-[#0B1220] via-[#12306B] to-[#1E40AF] px-4 py-3 text-white">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/15">
              <MessageCircle className="size-4 text-gold" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">Qo'llab-quvvatlash</p>
              <p className="flex items-center gap-1.5 text-[11px] text-white/70">
                <span className="size-1.5 rounded-full bg-eco" aria-hidden="true" />
                Odatda bir necha daqiqada javob beramiz
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Yopish"
              className="grid size-8 place-items-center rounded-lg text-white/80 transition-colors hover:bg-white/15 hover:text-white"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </header>

          {!isAuthenticated ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
              <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                <ShieldCheck className="size-5" aria-hidden="true" />
              </span>
              <p className="text-sm font-semibold text-foreground">Suhbat uchun tizimga kiring</p>
              <p className="text-[13px] leading-5 text-muted-foreground">
                Buyurtmalaringiz bo'yicha yozishish uchun hisobingizga kiring.
              </p>
              <Link
                to="/auth?returnTo=%2F"
                className="mt-1 inline-flex h-9 items-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground"
              >
                Kirish
              </Link>
            </div>
          ) : (
            <>
              <div ref={listRef} className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3.5">
                {thread.map((message) => {
                  const mine = message.role === "user";
                  return (
                    <div
                      key={message._id}
                      className={cn("flex flex-col gap-1", mine ? "items-end" : "items-start")}
                    >
                      <button
                        type="button"
                        onClick={() => setReplyTo(message)}
                        className={cn(
                          "max-w-[85%] rounded-2xl px-3.5 py-2 text-left text-[13.5px] leading-5 transition-colors",
                          mine
                            ? "rounded-br-md bg-primary text-primary-foreground"
                            : "rounded-bl-md border bg-card text-foreground",
                        )}
                        title="Javob berish uchun bosing"
                      >
                        {message.replyTo && (
                          <span
                            className={cn(
                              "mb-1.5 block rounded-lg border-l-2 px-2 py-1 text-[11.5px] leading-4",
                              mine
                                ? "border-white/50 bg-white/10 text-white/80"
                                : "border-primary/50 bg-muted text-muted-foreground",
                            )}
                          >
                            {message.replyTo.text || "Rasm"}
                          </span>
                        )}
                        {message.attachment && (
                          <img
                            src={message.attachment.dataUrl}
                            alt={message.attachment.name}
                            className="mb-1.5 max-h-52 w-full rounded-xl object-cover"
                            loading="lazy"
                          />
                        )}
                        {message.text && <span className="block whitespace-pre-wrap">{message.text}</span>}
                      </button>
                      <span className="px-1 text-[10.5px] text-muted-foreground">
                        {mine ? authorName : message.authorName || "Millytour"}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="border-t bg-card/60 p-3">
                {replyTo && (
                  <div className="mb-2 flex items-center gap-2 rounded-lg border-l-2 border-primary bg-muted px-2.5 py-1.5 text-[12px] text-muted-foreground">
                    <CornerUpLeft className="size-3.5 shrink-0" aria-hidden="true" />
                    <span className="line-clamp-1 flex-1">{replyTo.text || "Rasm"}</span>
                    <button type="button" onClick={() => setReplyTo(null)} aria-label="Javobni bekor qilish">
                      <X className="size-3.5" aria-hidden="true" />
                    </button>
                  </div>
                )}
                {attachment && (
                  <div className="mb-2 flex items-center gap-2 rounded-lg border bg-muted/60 px-2.5 py-1.5 text-[12px]">
                    <img src={attachment.dataUrl} alt="" className="size-8 rounded object-cover" />
                    <span className="line-clamp-1 flex-1 text-muted-foreground">{attachment.name}</span>
                    <button type="button" onClick={() => setAttachment(null)} aria-label="Rasmni olib tashlash">
                      <X className="size-3.5" aria-hidden="true" />
                    </button>
                  </div>
                )}
                {error && <p className="mb-2 text-[12px] text-destructive">{error}</p>}
                <div className="flex items-end gap-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={pickFile}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    aria-label="Rasm biriktirish"
                    className="grid size-9 shrink-0 place-items-center rounded-xl border text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <ImagePlus className="size-4" aria-hidden="true" />
                  </button>
                  <textarea
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        send();
                      }
                    }}
                    rows={1}
                    placeholder="Xabar yozing…"
                    className="max-h-24 min-h-9 flex-1 resize-none rounded-xl border bg-background px-3 py-2 text-[13.5px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <button
                    type="button"
                    onClick={send}
                    disabled={sending || (!text.trim() && !attachment)}
                    aria-label="Yuborish"
                    className={cn(
                      "grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground transition-opacity",
                      (sending || (!text.trim() && !attachment)) && "opacity-40",
                    )}
                  >
                    {sending ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Send className="size-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </motion.section>
      )}
    </AnimatePresence>
  );
}
