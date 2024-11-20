"use client";
import { ChevronsDown, Github, Menu, Twitter, BookOpen } from "lucide-react";
import React from "react";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { Separator } from "../ui/separator";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "../ui/navigation-menu";
import { Button } from "../ui/button";
import Link from "next/link";
import Image from "next/image";
import { ToggleTheme } from "./toogle-theme";
import { track } from "@vercel/analytics";

interface RouteProps {
  href: string;
  label: string;
}

interface FeatureProps {
  title: string;
  description: string;
}

const routeList: RouteProps[] = [];

const featureList: FeatureProps[] = [];

export const Navbar = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleNavClick = (label: string) => {
    track(`Nav Click: ${label}`);
  };

  return (
    <header className="shadow-inner bg-opacity-15 w-[90%] md:w-[70%] lg:w-[75%] lg:max-w-screen-xl top-5 mx-auto sticky border border-secondary z-40 rounded-2xl flex justify-between items-center p-2 bg-card">
      <Link href="/" className="font-bold text-lg flex items-center">
        Hydra-AI
      </Link>
      {/* <!-- Mobile --> */}
      <div className="flex items-center lg:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Menu
              onClick={() => {
                setIsOpen(!isOpen);
                handleNavClick("Mobile Menu");
              }}
              className="cursor-pointer lg:hidden"
            />
          </SheetTrigger>

          <SheetContent
            side="left"
            className="flex flex-col justify-between rounded-tr-2xl rounded-br-2xl bg-card border-secondary"
          >
            <div>
              <SheetHeader className="mb-4 ml-4">
                <SheetTitle className="flex items-center">
                  <Link href="/" className="flex items-center">
                    Hydra AI
                  </Link>
                </SheetTitle>
              </SheetHeader>

              <div className="flex flex-col gap-2">
                {routeList.map(({ href, label }) => (
                  <Button
                    key={href}
                    onClick={() => {
                      setIsOpen(false);
                      handleNavClick(`Mobile ${label}`);
                    }}
                    asChild
                    variant="ghost"
                    className="justify-start text-base"
                  >
                    <Link href={href}>{label}</Link>
                  </Button>
                ))}
              </div>
            </div>

            <SheetFooter className="flex-col sm:flex-col justify-start items-start">
              <Separator className="mb-2" />

              <ToggleTheme />

              <Button
                asChild
                size="sm"
                variant="ghost"
                aria-label="View Documentation"
                className="w-full justify-start"
              >
                <Link
                  aria-label="View Documentation"
                  href="/docs"
                  onClick={() => handleNavClick("Documentation")}
                >
                  <BookOpen className="size-5 mr-2" />
                  Documentation
                </Link>
              </Button>

              <Button
                asChild
                size="sm"
                variant="ghost"
                aria-label="Follow on Twitter"
                className="w-full justify-start"
              >
                <Link
                  aria-label="Follow on Twitter"
                  href="https://x.com/usehydraai"
                  target="_blank"
                  onClick={() => handleNavClick("Twitter")}
                >
                  <Twitter className="size-5 mr-2" />
                  Twitter
                </Link>
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      {/* <!-- Desktop --> */}
      <NavigationMenu className="hidden lg:block mx-auto">
        <NavigationMenuList>
          <NavigationMenuItem>
            {featureList && featureList.length > 0 && (
              <>
                <NavigationMenuTrigger
                  className="bg-card text-base"
                  onClick={() => handleNavClick("Features")}
                >
                  Features
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid w-[600px] grid-cols-2 gap-5 p-4">
                    <Image
                      src="https://avatars.githubusercontent.com/u/75042455?v=4"
                      alt="RadixLogo"
                      className="h-full w-full rounded-md object-cover"
                      width={600}
                      height={600}
                    />
                    <ul className="flex flex-col gap-2">
                      {featureList.map(({ title, description }) => (
                        <li
                          key={title}
                          className="rounded-md p-3 text-sm hover:bg-muted"
                          onClick={() => handleNavClick(`Feature: ${title}`)}
                        >
                          <p className="mb-1 font-semibold leading-none text-foreground">
                            {title}
                          </p>
                          <p className="line-clamp-2 text-muted-foreground">
                            {description}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </NavigationMenuContent>
              </>
            )}
          </NavigationMenuItem>

          <NavigationMenuItem>
            {routeList.map(({ href, label }) => (
              <NavigationMenuLink key={href} asChild>
                <Link
                  href={href}
                  className="text-base px-2"
                  onClick={() => handleNavClick(label)}
                >
                  {label}
                </Link>
              </NavigationMenuLink>
            ))}
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>

      <div className="hidden lg:flex">
        <ToggleTheme />

        <Button
          asChild
          size="sm"
          variant="ghost"
          aria-label="View Documentation"
        >
          <Link
            aria-label="View Documentation"
            href="/docs"
            onClick={() => handleNavClick("Documentation")}
          >
            <BookOpen className="size-5" />
          </Link>
        </Button>

        <Button
          asChild
          size="sm"
          variant="ghost"
          aria-label="Follow on Twitter"
        >
          <Link
            aria-label="Follow on Twitter"
            href="https://x.com/usehydraai"
            target="_blank"
            onClick={() => handleNavClick("Twitter")}
          >
            <Twitter className="size-5" />
          </Link>
        </Button>
      </div>
    </header>
  );
};
