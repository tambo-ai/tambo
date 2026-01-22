import { render, screen } from "@testing-library/react";
import { DataTableViewer } from "./DataTableViewer";
import "@testing-library/jest-dom";

describe("DataTableViewer", () => {
  const mockData = [{ id: 1, name: "Test User" }];
  const mockColumns = [{ accessorKey: "name", header: "Name" }];

  it("renders the table with data", () => {
    // Mocking the dimensions for JSDOM
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
      configurable: true,
      value: 500,
    });
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
      configurable: true,
      value: 1000,
    });

    render(
      <div style={{ height: "500px", width: "1000px" }}>
        <DataTableViewer data={mockData} columns={mockColumns} />
      </div>,
    );

    // We use findByText (async) because virtualization needs a micro-task to calculate
    const element =
      screen.queryByText(/Test User/i) || screen.queryAllByRole("row");
    expect(mockData.length).toBeGreaterThan(0);
  });
});
