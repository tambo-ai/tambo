"use client";

import { ChefHat, Clock, Minus, Plus, Users } from "lucide-react";
import { useState } from "react";

interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

interface RecipeCardProps {
  title?: string;
  description?: string;
  ingredients?: Ingredient[];
  prepTime?: number;
  cookTime?: number;
  originalServings?: number;
}

export default function RecipeCard({
  title,
  description,
  ingredients,
  prepTime = 0,
  cookTime = 0,
  originalServings,
}: RecipeCardProps) {
  const [servings, setServings] = useState(originalServings || 1);
  const scaleFactor = servings / (originalServings || 1);

  const handleServingsChange = (n: number) => {
    if (n > 0) setServings(n);
  };

  const formatTime = (m: number) => {
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    const r = m % 60;
    return r ? `${h}h ${r}m` : `${h}h`;
  };

  const totalTime = prepTime + cookTime;

  return (
    <div
      className="
        max-w-md
        border border-white/10
        bg-[#0f1115]
        rounded-md
      "
    >
      <div className="p-5 space-y-5">
        {/* Header */}
        <div>
          <h2 className="text-lg font-semibold tracking-wide text-white">
            {title}
          </h2>
          <p className="mt-1 text-sm text-white/60 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-5 text-xs text-white/60">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {formatTime(totalTime)}
          </div>

          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            {servings} servings
          </div>

          {prepTime > 0 && (
            <div className="flex items-center gap-2">
              <ChefHat className="w-4 h-4" />
              Prep {formatTime(prepTime)}
            </div>
          )}
        </div>

        {/* Servings Control */}
        <div className="border border-white/10 rounded-md p-4 bg-[#12141a]">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/80 tracking-wide">
              SERVINGS
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleServingsChange(servings - 1)}
                disabled={servings <= 1}
                className="
                  w-8 h-8
                  flex items-center justify-center
                  border border-white/15
                  bg-[#0f1115]
                  text-white
                  rounded-sm
                  disabled:opacity-40
                "
              >
                <Minus className="w-4 h-4" />
              </button>

              <span className="w-8 text-center text-sm text-white">
                {servings}
              </span>

              <button
                onClick={() => handleServingsChange(servings + 1)}
                className="
                  w-8 h-8
                  flex items-center justify-center
                  border border-white/15
                  bg-[#0f1115]
                  text-white
                  rounded-sm
                "
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Ingredients */}
        <div>
          <h3 className="mb-3 text-sm uppercase tracking-widest text-white/70">
            Ingredients
          </h3>

          <ul className="space-y-2">
            {ingredients?.map((ing, i) => (
              <li
                key={i}
                className="
                  flex items-center gap-3
                  p-2
                  border border-white/10
                  rounded-sm
                  bg-[#12141a]
                  text-sm
                "
              >
                <span className="w-6 text-right text-white">
                  {(ing.amount * scaleFactor).toFixed(
                    (ing.amount * scaleFactor) % 1 === 0 ? 0 : 1,
                  )}
                </span>

                <span className="text-white/60">{ing.unit}</span>
                <span className="text-white">{ing.name}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
