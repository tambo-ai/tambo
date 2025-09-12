"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export function ProductHuntWidget() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9, duration: 0.6, ease: "easeOut" }}
    >
      <a
        href="https://www.producthunt.com/products/tambo?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-tambo"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Image
          src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1005008&theme=light&t=1757714078501"
          alt="tambo - An AI orchestration framework for React | Product Hunt"
          style={{ width: "250px", height: "54px" }}
          width="250"
          height="54"
        />
      </a>
    </motion.div>
  );
}
