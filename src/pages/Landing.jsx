import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Settings } from "lucide-react";
import { HeroScene, Ornament } from "../components/Art.jsx";
import { AmbientToggle, Wordmark } from "../components/Shell.jsx";
import { IconButton } from "../components/ui.jsx";
import { useArchive } from "../lib/store.jsx";
import CandleCursor from "../components/CandleCursor.jsx";

const word = "AFTERHOURS".split("");

export default function Landing() {
  const { settings } = useArchive();
  return (
    <div className="relative h-dvh min-h-[560px] w-full overflow-hidden bg-ink">
      <HeroScene ambient={settings.ambient} />
      <CandleCursor />

      {/* landing header: wordmark and utility icons only, no page links */}
      <header className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-5 sm:px-10 py-5 safe-t">
        <Wordmark />
        <div className="flex items-center gap-1">
          <AmbientToggle />
          <IconButton
            icon={Settings}
            label="Settings"
            onClick={() => (window.location.hash = "#/settings")}
          />
        </div>
      </header>

      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6 -mt-6 sm:-mt-10">
        <h1
          aria-label="Afterhours"
          className="wordmark text-[clamp(2.1rem,9.2vw,6.4rem)] leading-none text-parchment [text-shadow:0_2px_40px_rgba(0,0,0,.8)]"
        >
          {word.map((c, i) => (
            <motion.span
              key={i}
              aria-hidden="true"
              className="inline-block"
              initial={{ opacity: 0, y: 14, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{
                delay: 0.25 + i * 0.07,
                duration: 0.9,
                ease: [0.22, 0.8, 0.2, 1],
              }}
            >
              {c}
            </motion.span>
          ))}
        </h1>

        <motion.div
          initial={{ opacity: 0, scaleX: 0.4 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 1.2, duration: 0.9 }}
          className="flex items-center gap-4 text-silver/80 my-7 w-60 sm:w-80"
          aria-hidden="true"
        >
          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-silver/50" />
          <Ornament size={18} />
          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-silver/50" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.8 }}
        >
          <Link
            to="/archive"
            className="inline-flex items-center rounded-full border border-silver/45 bg-ink/50 backdrop-blur-sm px-8 py-3.5 text-[15px] text-parchment transition-all duration-300 hover:border-rose hover:bg-burgundy/60 hover:shadow-[0_0_40px_-6px_rgba(167,125,131,.5)]"
          >
            Enter the Archive
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
