import { Profile } from "../model/profile";

export const getProfiles = () => {
  return sampleProfiles;
};

export let sampleProfiles: Profile[] = [
  {
    id: "1",
    name: "Alice",
    imageUrl: "https://example.com/alice.jpg",
    about: "I like to read and play the piano.",
  },
  {
    id: "2",
    name: "Bob",
    imageUrl: "https://example.com/bob.jpg",
    about: "I like to hike and bake bread.",
  },
  {
    id: "3",
    name: "Charlie",
    imageUrl: "https://example.com/charlie.jpg",
    about: "I like to play video games and watch movies.",
  },
];
