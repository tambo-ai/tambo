"use client";

import React, { useEffect, ReactElement } from "react";
import { z } from "zod";
import { useTamboInteractable } from "../tambo-interactable-provider"; // Adjust import path

// Define the props for your new component
interface MakeInteractableProps {
  name: string;
  description: string;
  propsSchema: z.ZodObject<any>;
  children: ReactElement; // The child component, e.g., <Note ... />
}

/**
 * A wrapper component to make a child component interactable by Tambo.
 * @returns The single child element passed to the component.
 */

/**
 *
 */
export const MakeInteractable: React.FC<MakeInteractableProps> = ({
  name,
  description,
  propsSchema,
  children,
}) => {
  // 1. Get the registration functions using the same hook
  const { addInteractableComponent } = useTamboInteractable();

  // 2. Ensure there's only one child component
  const childComponent = React.Children.only(children);

  useEffect(() => {
    // 3. Register the component on mount
    addInteractableComponent({
      name: name,
      description: description,
      component: childComponent.type, // The component's type (e.g., Note)
      props: childComponent.props, // The component's props (e.g., { title: '...', text: '...' })
      propsSchema: propsSchema,
    });

    // 4. Unregister the component on unmount
    // Note: The HOC doesn't seem to have an unregister function, but it's good practice.
    // You may need to add `removeInteractableComponent` to the provider yourself, or skip this if it's not required.
    return () => {
      // removeInteractableComponent(id);
    };
    // The dependency array ensures this effect runs only once
  }, [
    addInteractableComponent,
    name,
    description,
    propsSchema,
    childComponent,
  ]);

  // 5. Render the child component
  return childComponent;
};
