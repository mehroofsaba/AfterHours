import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  CabinetArt,
  GlassDomeArt,
  EnvelopeArt,
  Dust,
} from "../components/Art.jsx";
import { useArchive } from "../lib/store.jsx";

const ROOMS = [
  { to: "/cabinet", title: "The Memory Cabinet", Art: CabinetArt },
  { to: "/lost", title: "The Lost & Found", Art: GlassDomeArt },
  { to: "/unsent", title: "The Unsent Archive", Art: EnvelopeArt },
];

export default function Archive() {
  const { settings } = useArchive();

  return (
    <div className="relative min-h-dvh flex flex-col bg-[radial-gradient(ellipse_at_50%_20%,#2a171c,#171313_70%)]">
      <Dust active={settings.ambient} count={30} />

      <div className="relative flex-1 flex flex-col items-center justify-center px-5 pt-12 pb-12 sm:py-16">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="flex items-center gap-5 mb-8 sm:mb-14 w-full max-w-sm"
        >
          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-silver/45" />

          <h1 className="text-3xl sm:text-4xl text-parchment/95">
            The Archive
          </h1>

          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-silver/45" />
        </motion.div>

        <ul className="grid gap-4 sm:gap-8 sm:grid-cols-3 w-full max-w-5xl">
          {ROOMS.map(({ to, title, Art }, i) => (
            <motion.li
              key={to}
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.15 + i * 0.14,
                duration: 0.8,
                ease: [0.22, 0.8, 0.2, 1],
              }}
            >
              <Link
                to={to}
                className="group block frame overflow-hidden bg-mahogany transition-all duration-500 hover:-translate-y-1.5 hover:border-rose/70 hover:shadow-[0_26px_50px_-18px_rgba(84,43,53,.9)] focus-visible:-translate-y-1.5"
              >
                <div className="flex sm:block items-stretch">
                  <div className="relative w-32 h-32 sm:w-full sm:h-auto sm:aspect-[3/4] shrink-0 overflow-hidden">
                    <Art className="absolute inset-0 w-full h-full transition-transform duration-[1400ms] ease-out group-hover:scale-[1.03]" />

                    <div className="absolute inset-0 hidden sm:block bg-gradient-to-t from-ink via-ink/45 to-transparent" />

                    <h2 className="absolute inset-x-0 bottom-0 hidden sm:block px-3 pb-6 text-center text-2xl lg:text-[28px] leading-tight text-parchment">
                      {title}
                    </h2>
                  </div>

                  <div className="sm:hidden flex-1 flex items-center px-5">
                    <h2 className="text-2xl text-parchment leading-tight">
                      {title}
                    </h2>
                  </div>
                </div>
              </Link>
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
}
