import { Profile } from "../model/profile";

export const getProfiles = async () => {
  return sampleProfiles;
};

export let sampleProfiles: Profile[] = [
  {
    id: "1",
    name: "Alice",
    imageUrl: "/vangogh.png",
    about: "I like to read and play the piano.",
  },
  {
    id: "2",
    name: "Bob",
    imageUrl: "/vangogh.png",
    about: "I like to hike and bake bread.",
  },
  {
    id: "3",
    name: "Charlie",
    imageUrl: "/vangogh.png",
    about: "I like to play video games and watch movies.",
  },
  {
    id: "4",
    name: "David",
    imageUrl: "/vangogh.png",
    about: "I am a React developer and love creating interactive UIs.",
  },
  {
    id: "5",
    name: "Eve",
    imageUrl: "/vangogh.png",
    about: "I enjoy painting and coding with Next.js.",
  },
  {
    id: "6",
    name: "Frank",
    imageUrl: "/vangogh.png",
    about: "I am a full-stack developer working with React and Next.js.",
  },
  {
    id: "7",
    name: "Grace",
    imageUrl: "/vangogh.png",
    about: "I love designing and developing web applications.",
  },
  {
    id: "8",
    name: "Hank",
    imageUrl: "/vangogh.png",
    about: "I am passionate about learning new technologies and frameworks.",
  },
  {
    id: "9",
    name: "Ivy",
    imageUrl: "/vangogh.png",
    about: "I enjoy writing and developing with React.",
  },
  {
    id: "10",
    name: "Jack",
    imageUrl: "/vangogh.png",
    about: "I love creating fast and scalable web apps with Next.js.",
  },
];
