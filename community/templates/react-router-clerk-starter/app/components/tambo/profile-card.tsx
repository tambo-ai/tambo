"use client";

import { MapPin, Briefcase, Heart, Github, Linkedin, Twitter } from "lucide-react";
import { z } from "zod";

export const profileCardSchema = z.object({
    name: z.string().describe("The full name of the user"),
    role: z.string().describe("The professional role or title"),
    location: z.string().optional().describe("The location of the user (e.g. City, Country)"),
    bio: z.string().optional().describe("A short biography or description"),
    interests: z.array(z.string()).optional().describe("List of interests or hobbies"),
    imageUrl: z.string().optional().describe("URL to the user's profile image"),
    socials: z.object({
        github: z.string().optional(),
        twitter: z.string().optional(),
        linkedin: z.string().optional(),
    }).optional().describe("Social media profile links"),
});

export type ProfileCardProps = z.infer<typeof profileCardSchema>;

export function UserCard({
    name,
    role,
    location,
    bio,
    interests,
    imageUrl,
    socials,
}: ProfileCardProps) {
    console.log("Rendering UserCard/ProfileCard with name:", name);
    return (
        <div className="w-full max-w-sm mx-auto bg-white text-gray-900 rounded-xl shadow-sm overflow-hidden border border-gray-200 font-sans">
            <div className="h-24 bg-[#7FFFC3]/30 relative"> {/* Mint accent background */}
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={name}
                        className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full border-4 border-white object-cover shadow-sm"
                    />
                ) : (
                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full border-4 border-white bg-[#FFE17F] flex items-center justify-center shadow-sm text-2xl font-bold text-gray-700">
                        {name.charAt(0)}
                    </div>
                )}
            </div>

            <div className="pt-14 pb-6 px-6 text-center">
                <h2 className="text-xl font-bold text-gray-900">{name}</h2>

                <div className="flex items-center justify-center gap-2 mt-1 text-gray-500">
                    <Briefcase className="w-3 h-3" />
                    <span className="text-sm font-medium">{role}</span>
                </div>

                {location && (
                    <div className="flex items-center justify-center gap-2 mt-1 text-gray-500">
                        <MapPin className="w-3 h-3" />
                        <span className="text-xs">{location}</span>
                    </div>
                )}

                {bio && (
                    <p className="mt-4 text-sm text-gray-600 leading-relaxed">
                        {bio}
                    </p>
                )}

                {interests && interests.length > 0 && (
                    <div className="mt-5 flex flex-wrap justify-center gap-2">
                        {interests.map((interest, index) => (
                            <span
                                key={index}
                                className="px-3 py-1 bg-gray-100 text-gray-700 text-[10px] uppercase tracking-wide font-semibold rounded-full flex items-center gap-1"
                            >
                                <Heart className="w-3 h-3 text-[#FFB6C1]" />
                                {interest}
                            </span>
                        ))}
                    </div>
                )}

                {socials && (
                    <div className="mt-6 flex justify-center gap-4 pt-4 border-t border-gray-100">
                        {socials.github && (
                            <a href={socials.github} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-gray-900 transition-colors">
                                <Github className="w-4 h-4" />
                            </a>
                        )}
                        {socials.twitter && (
                            <a href={socials.twitter} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-[#1DA1F2] transition-colors">
                                <Twitter className="w-4 h-4" />
                            </a>
                        )}
                        {socials.linkedin && (
                            <a href={socials.linkedin} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-[#0A66C2] transition-colors">
                                <Linkedin className="w-4 h-4" />
                            </a>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
