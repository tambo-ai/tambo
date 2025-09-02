import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ListViewCard } from "../list-view-card";

// Mock the useTamboComponentState hook
jest.mock("../../hooks/use-component-state", () => ({
  useTamboComponentState: jest.fn(),
}));

const mockUseTamboComponentState = require("../../hooks/use-component-state").useTamboComponentState;

// Sample test data
const sampleItems = [
  {
    id: "1",
    title: "First Item",
    subtitle: "First subtitle",
    media: {
      type: "avatar" as const,
      src: "https://example.com/avatar1.jpg",
      alt: "Avatar 1",
    },
  },
  {
    id: "2",
    title: "Second Item",
    subtitle: "Second subtitle",
    media: {
      type: "thumbnail" as const,
      src: "https://example.com/thumb1.jpg",
      alt: "Thumbnail 1",
    },
  },
  {
    id: "3",
    title: "Third Item",
    subtitle: "Third subtitle",
    media: {
      type: "icon" as const,
      src: "🚀",
      alt: "Rocket icon",
    },
  },
];

const defaultState = {
  selectedIds: [],
  focusedIndex: 0,
  searchQuery: "",
  isLoading: false,
  cursor: undefined,
};

const mockSetState = jest.fn();

describe("ListViewCard", () => {
  beforeEach(() => {
    mockUseTamboComponentState.mockReturnValue([defaultState, mockSetState]);
    mockSetState.mockClear();
  });

  it("renders without crashing", () => {
    render(
      <ListViewCard
        items={sampleItems}
        selectionMode="none"
        height={400}
        itemHeight={60}
        showCheckboxes={false}
        variant="default"
        size="md"
      />
    );
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("renders all items", () => {
    render(
      <ListViewCard
        items={sampleItems}
        selectionMode="none"
        height={400}
        itemHeight={60}
        showCheckboxes={false}
        variant="default"
        size="md"
      />
    );
    expect(screen.getByText("First Item")).toBeInTheDocument();
    expect(screen.getByText("Second Item")).toBeInTheDocument();
    expect(screen.getByText("Third Item")).toBeInTheDocument();
  });

  it("displays item subtitles", () => {
    render(
      <ListViewCard
        items={sampleItems}
        selectionMode="none"
        height={400}
        itemHeight={60}
        showCheckboxes={false}
        variant="default"
        size="md"
      />
    );
    expect(screen.getByText("First subtitle")).toBeInTheDocument();
    expect(screen.getByText("Second subtitle")).toBeInTheDocument();
  });

  it("renders media correctly", () => {
    render(
      <ListViewCard
        items={sampleItems}
        selectionMode="none"
        height={400}
        itemHeight={60}
        showCheckboxes={false}
        variant="default"
        size="md"
      />
    );
    
    // Check avatar
    const avatar = screen.getByAltText("Avatar 1");
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute("src", "https://example.com/avatar1.jpg");
    
    // Check thumbnail
    const thumbnail = screen.getByAltText("Thumbnail 1");
    expect(thumbnail).toBeInTheDocument();
    expect(thumbnail).toHaveAttribute("src", "https://example.com/thumb1.jpg");
    
    // Check icon
    expect(screen.getByText("🚀")).toBeInTheDocument();
  });

  it("applies correct ARIA attributes", () => {
    render(
      <ListViewCard
        items={sampleItems}
        selectionMode="none"
        height={400}
        itemHeight={60}
        showCheckboxes={false}
        variant="default"
        size="md"
      />
    );
    
    const listbox = screen.getByRole("listbox");
    expect(listbox).toHaveAttribute("aria-label", "List of items");
    expect(listbox).toHaveAttribute("aria-multiselectable", "false");
  });

  it("applies correct ARIA attributes for multi-selection", () => {
    render(
      <ListViewCard
        items={sampleItems}
        selectionMode="multi"
        height={400}
        itemHeight={60}
        showCheckboxes={false}
        variant="default"
        size="md"
      />
    );
    
    const listbox = screen.getByRole("listbox");
    expect(listbox).toHaveAttribute("aria-multiselectable", "true");
  });

  it("renders checkboxes for multi-selection", () => {
    render(
      <ListViewCard
        items={sampleItems}
        selectionMode="multi"
        showCheckboxes={true}
        height={400}
        itemHeight={60}
        variant="default"
        size="md"
      />
    );
    
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(3);
  });

  it("renders radio buttons for single selection", () => {
    render(
      <ListViewCard
        items={sampleItems}
        selectionMode="single"
        height={400}
        itemHeight={60}
        showCheckboxes={false}
        variant="default"
        size="md"
      />
    );
    
    const radioButtons = screen.getAllByRole("radio");
    expect(radioButtons).toHaveLength(3);
  });

  it("calls onSelect when item is selected", () => {
    const mockOnSelect = jest.fn();
    render(
      <ListViewCard
        items={sampleItems}
        selectionMode="multi"
        showCheckboxes={true}
        onSelect={mockOnSelect}
        height={400}
        itemHeight={60}
        variant="default"
        size="md"
      />
    );
    
    const firstCheckbox = screen.getAllByRole("checkbox")[0];
    fireEvent.click(firstCheckbox);
    
    expect(mockOnSelect).toHaveBeenCalledWith(["1"]);
  });

  it("calls onActivate when item is clicked", () => {
    const mockOnActivate = jest.fn();
    render(
      <ListViewCard
        items={sampleItems}
        onActivate={mockOnActivate}
        selectionMode="none"
        height={400}
        itemHeight={60}
        showCheckboxes={false}
        variant="default"
        size="md"
      />
    );
    
    const firstItem = screen.getByText("First Item");
    fireEvent.click(firstItem);
    
    expect(mockOnActivate).toHaveBeenCalledWith("1");
  });

  it("handles keyboard navigation", () => {
    const mockOnActivate = jest.fn();
    render(
      <ListViewCard
        items={sampleItems}
        onActivate={mockOnActivate}
        selectionMode="none"
        height={400}
        itemHeight={60}
        showCheckboxes={false}
        variant="default"
        size="md"
      />
    );
    
    const listbox = screen.getByRole("listbox");
    listbox.focus();
    
    // Test arrow down
    fireEvent.keyDown(listbox, { key: "ArrowDown" });
    expect(mockSetState).toHaveBeenCalledWith(
      expect.objectContaining({
        focusedIndex: 1,
      })
    );
    
    // Test arrow up
    fireEvent.keyDown(listbox, { key: "ArrowUp" });
    expect(mockSetState).toHaveBeenCalledWith(
      expect.objectContaining({
        focusedIndex: 0,
      })
    );
    
    // Test Home key
    fireEvent.keyDown(listbox, { key: "Home" });
    expect(mockSetState).toHaveBeenCalledWith(
      expect.objectContaining({
        focusedIndex: 0,
      })
    );
    
    // Test End key
    fireEvent.keyDown(listbox, { key: "End" });
    expect(mockSetState).toHaveBeenCalledWith(
      expect.objectContaining({
        focusedIndex: 2,
      })
    );
  });

  it("handles Enter key for activation", () => {
    const mockOnActivate = jest.fn();
    render(
      <ListViewCard
        items={sampleItems}
        onActivate={mockOnActivate}
        selectionMode="none"
        height={400}
        itemHeight={60}
        showCheckboxes={false}
        variant="default"
        size="md"
      />
    );
    
    const listbox = screen.getByRole("listbox");
    fireEvent.keyDown(listbox, { key: "Enter" });
    
    expect(mockOnActivate).toHaveBeenCalledWith("1");
  });

  it("handles Space key for activation", () => {
    const mockOnActivate = jest.fn();
    render(
      <ListViewCard
        items={sampleItems}
        onActivate={mockOnActivate}
        selectionMode="none"
        height={400}
        itemHeight={60}
        showCheckboxes={false}
        variant="default"
        size="md"
      />
    );
    
    const listbox = screen.getByRole("listbox");
    fireEvent.keyDown(listbox, { key: " " });
    
    expect(mockOnActivate).toHaveBeenCalledWith("1");
  });

  it("applies correct CSS classes for variants", () => {
    const { rerender } = render(
      <ListViewCard
        items={sampleItems}
        variant="default"
        selectionMode="none"
        height={400}
        itemHeight={60}
        showCheckboxes={false}
        size="md"
      />
    );
    
    let listbox = screen.getByRole("listbox");
    expect(listbox).toHaveClass("bg-background", "border", "border-border");
    
    rerender(
      <ListViewCard
        items={sampleItems}
        variant="bordered"
        selectionMode="none"
        height={400}
        itemHeight={60}
        showCheckboxes={false}
        size="md"
      />
    );
    listbox = screen.getByRole("listbox");
    expect(listbox).toHaveClass("bg-background", "border-2", "border-border");
    
    rerender(
      <ListViewCard
        items={sampleItems}
        variant="elevated"
        selectionMode="none"
        height={400}
        itemHeight={60}
        showCheckboxes={false}
        size="md"
      />
    );
    listbox = screen.getByRole("listbox");
    expect(listbox).toHaveClass("bg-background", "border", "border-border", "shadow-lg");
  });

  it("applies correct CSS classes for sizes", () => {
    const { rerender } = render(
      <ListViewCard
        items={sampleItems}
        size="sm"
        selectionMode="none"
        height={400}
        itemHeight={60}
        showCheckboxes={false}
        variant="default"
      />
    );
    
    let firstItem = screen.getByText("First Item").closest("div");
    expect(firstItem).toHaveClass("px-3", "py-2", "text-sm");
    
    rerender(
      <ListViewCard
        items={sampleItems}
        size="md"
        selectionMode="none"
        height={400}
        itemHeight={60}
        showCheckboxes={false}
        variant="default"
      />
    );
    firstItem = screen.getByText("First Item").closest("div");
    expect(firstItem).toHaveClass("px-4", "py-3", "text-base");
    
    rerender(
      <ListViewCard
        items={sampleItems}
        size="lg"
        selectionMode="none"
        height={400}
        itemHeight={60}
        showCheckboxes={false}
        variant="default"
      />
    );
    firstItem = screen.getByText("First Item").closest("div");
    expect(firstItem).toHaveClass("px-6", "py-4", "text-lg");
  });

  it("shows loading indicator when loading", () => {
    mockUseTamboComponentState.mockReturnValue([
      { ...defaultState, isLoading: true },
      mockSetState,
    ]);
    
    render(
      <ListViewCard
        items={sampleItems}
        selectionMode="none"
        height={400}
        itemHeight={60}
        showCheckboxes={false}
        variant="default"
        size="md"
      />
    );
    expect(screen.getByText("Loading more items...")).toBeInTheDocument();
  });

  it("shows empty state when no items", () => {
    render(
      <ListViewCard
        items={[]}
        selectionMode="none"
        height={400}
        itemHeight={60}
        showCheckboxes={false}
        variant="default"
        size="md"
      />
    );
    expect(screen.getByText("No items to display.")).toBeInTheDocument();
  });

  it("shows search no results message when filtering", () => {
    mockUseTamboComponentState.mockReturnValue([
      { ...defaultState, searchQuery: "nonexistent" },
      mockSetState,
    ]);
    
    render(
      <ListViewCard
        items={sampleItems}
        selectionMode="none"
        height={400}
        itemHeight={60}
        showCheckboxes={false}
        variant="default"
        size="md"
      />
    );
    expect(screen.getByText("No items match your search.")).toBeInTheDocument();
  });

  it("handles custom height prop", () => {
    render(
      <ListViewCard
        items={sampleItems}
        height={600}
        selectionMode="none"
        itemHeight={60}
        showCheckboxes={false}
        variant="default"
        size="md"
      />
    );
    
    const scrollContainer = screen.getByRole("listbox").querySelector(".overflow-auto");
    expect(scrollContainer).toHaveStyle({ height: "600px" });
  });

  it("handles string height prop", () => {
    render(
      <ListViewCard
        items={sampleItems}
        height="500px"
        selectionMode="none"
        itemHeight={60}
        showCheckboxes={false}
        variant="default"
        size="md"
      />
    );
    
    const scrollContainer = screen.getByRole("listbox").querySelector(".overflow-auto");
    expect(scrollContainer).toHaveStyle({ height: "500px" });
  });

  it("applies custom className", () => {
    render(
      <ListViewCard
        items={sampleItems}
        className="custom-class"
        selectionMode="none"
        height={400}
        itemHeight={60}
        showCheckboxes={false}
        variant="default"
        size="md"
      />
    );
    
    const listbox = screen.getByRole("listbox");
    expect(listbox).toHaveClass("custom-class");
  });

  it("prevents event propagation on checkbox change", () => {
    const mockOnActivate = jest.fn();
    render(
      <ListViewCard
        items={sampleItems}
        selectionMode="multi"
        showCheckboxes={true}
        onActivate={mockOnActivate}
        height={400}
        itemHeight={60}
        variant="default"
        size="md"
      />
    );
    
    const checkbox = screen.getAllByRole("checkbox")[0];
    fireEvent.change(checkbox, { target: { checked: true } });
    
    // onActivate should not be called when checkbox is changed
    expect(mockOnActivate).not.toHaveBeenCalled();
  });

  it("prevents event propagation on radio change", () => {
    const mockOnActivate = jest.fn();
    render(
      <ListViewCard
        items={sampleItems}
        selectionMode="single"
        onActivate={mockOnActivate}
        height={400}
        itemHeight={60}
        showCheckboxes={false}
        variant="default"
        size="md"
      />
    );
    
    const radio = screen.getAllByRole("radio")[0];
    fireEvent.change(radio, { target: { checked: true } });
    
    // onActivate should not be called when radio is changed
    expect(mockOnActivate).not.toHaveBeenCalled();
  });

  it("handles items without media", () => {
    const itemsWithoutMedia = [
      {
        id: "1",
        title: "No Media Item",
        subtitle: "This item has no media",
      },
    ];
    
    render(
      <ListViewCard
        items={itemsWithoutMedia}
        selectionMode="none"
        height={400}
        itemHeight={60}
        showCheckboxes={false}
        variant="default"
        size="md"
      />
    );
    expect(screen.getByText("No Media Item")).toBeInTheDocument();
    expect(screen.getByText("This item has no media")).toBeInTheDocument();
  });

  it("handles items without subtitle", () => {
    const itemsWithoutSubtitle = [
      {
        id: "1",
        title: "No Subtitle Item",
        media: {
          type: "icon" as const,
          src: "📝",
          alt: "Document icon",
        },
      },
    ];
    
    render(
      <ListViewCard
        items={itemsWithoutSubtitle}
        selectionMode="none"
        height={400}
        itemHeight={60}
        showCheckboxes={false}
        variant="default"
        size="md"
      />
    );
    expect(screen.getByText("No Subtitle Item")).toBeInTheDocument();
    expect(screen.queryByText("undefined")).not.toBeInTheDocument();
  });
});
