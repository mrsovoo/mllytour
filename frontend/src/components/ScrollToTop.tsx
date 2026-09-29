import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Suzuvchi tugmalar ko'rsatilmaydigan sahifalar (Milly AI bilan bir xil ro'yxat). */
const HIDDEN_ROUTES = ["/auth", "/admin", "/partner"];

export function ScrollToTop() {
  const { pathname } = useLocation();
  const [show, setShow] = useState(false);
  const hidden = HIDDEN_ROUTES.some((route) => pathname.startsWith(route));

  useEffect(() => {
    // Faqat tugma ko'rinishi kuzatiladi — sahifa tepasidagi gradient chiziq olib tashlangan.
    const onScroll = () => setShow(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (hidden) {
    return null;
  }

  return (
    <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            // Chap tomonda turadi — o'ngda Milly AI va support tugmalari joylashgan.
            className="fixed left-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 flex flex-col gap-2 sm:left-6 sm:bottom-6"
          >
            <Button
              size="icon"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="size-12 rounded-full bg-primary hover:bg-primary/90 shadow-lifted"
              aria-label="Yuqoriga qaytish"
            >
              <ArrowUp className="size-5" aria-hidden="true" />
            </Button>
          </motion.div>
        )}
    </AnimatePresence>
  );
}
