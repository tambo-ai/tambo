import { render, screen } from "@testing-library/react";
import { MakeInteractable } from "../MakeInteractable";
import { z } from "zod";

// 1. Create a reference to our mock function
const mockAddInteractable = jest.fn();

// 2. Use that reference inside the mock setup
jest.mock("../../tambo-interactable-provider", () => ({
  useTamboInteractable: () => ({
    addInteractableComponent: mockAddInteractable,
    removeInteractableComponent: jest.fn(),
  }),
}));

describe("MakeInteractable", () => {
  // 3. Clear the mock before each test to ensure a clean slate
  beforeEach(() => {
    mockAddInteractable.mockClear();
  });

  it("should render its child component without crashing", () => {
    const testProps = {
      name: "TestComponent",
      description: "A test component",
      propsSchema: z.object({}),
    };
    render(
      <MakeInteractable {...testProps}>
        <div>Hello World</div>
      </MakeInteractable>,
    );
    expect(screen.getByText("Hello World")).toBeInTheDocument();
  });

  it("should throw an error if more than one child is provided", () => {
    const testProps = {
      name: "TestComponent",
      description: "A test component",
      propsSchema: z.object({}),
    };
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    expect(() =>
      render(
        <MakeInteractable {...testProps}>
          <div>Child 1</div>
          <div>Child 2</div>
        </MakeInteractable>,
      ),
    ).toThrow();
    consoleErrorSpy.mockRestore();
  });

  // 4. ✨ NEW TEST CASE ✨
  it("should register itself on mount with the correct properties", () => {
    // Arrange: Set up the component and its props
    const testProps = {
      name: "NoteComponent",
      description: "A component for notes",
      propsSchema: z.object({ title: z.string() }),
    };
    const ChildComponent = (props: { title: string }) => (
      <div>{props.title}</div>
    );

    // Act: Render the component
    render(
      <MakeInteractable {...testProps}>
        <ChildComponent title="My Note" />
      </MakeInteractable>,
    );

    // Assert: Check that our mock function was called correctly
    expect(mockAddInteractable).toHaveBeenCalledTimes(1);
    expect(mockAddInteractable).toHaveBeenCalledWith({
      name: testProps.name,
      description: testProps.description,
      propsSchema: testProps.propsSchema,
      component: ChildComponent,
      props: { title: "My Note" },
    });
  });
});
